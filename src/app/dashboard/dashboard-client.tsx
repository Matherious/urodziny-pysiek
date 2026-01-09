'use client'

import { useState, useEffect, useOptimistic, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Guest, Event, SubEvent } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { CalendarDays, MapPin, Clock, Music, LogOut, Settings, Loader2 } from 'lucide-react'
import { logout } from '../actions/auth'
import { updateRSVP, inviteFriend, deleteInvite, updateInvite } from '../actions/rsvp'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Pencil, Trash2, X, Check, Copy } from 'lucide-react'

type FullGuest = Guest & {
    invitees: Guest[]
    // Manually adding these to handle potential stale Prisma types in editor
    plusOneAllowed?: boolean
    plusOneName?: string | null
    plusOneDiet?: string | null
    dietaryRestrictions?: string | null
    songRequest?: string | null
    role: string // ensure role is string
}

type FullEvent = Event & {
    subEvents: SubEvent[]
}

type OptimisticAction =
    | { type: 'RSVP', data: Partial<Guest> }
    | { type: 'INVITE_ADD', name: string }
    | { type: 'INVITE_DELETE', id: string }
    | { type: 'INVITE_UPDATE', id: string, data: Partial<Guest> }

export function DashboardClient({ guest, settings, timeline, events }: {
    guest: FullGuest,
    settings: any,
    timeline: any[],
    events: FullEvent[]
}) {
    const [activeTab, setActiveTab] = useState('overview')

    // Optimistic State
    const [optimisticGuest, setOptimisticGuest] = useOptimistic(
        guest,
        (state: FullGuest, action: OptimisticAction) => {
            if (action.type === 'RSVP') {
                return { ...state, ...action.data }
            }
            if (action.type === 'INVITE_ADD') {
                return {
                    ...state,
                    invitees: [
                        ...state.invitees,
                        {
                            id: 'temp-' + Date.now(),
                            name: action.name,
                            code: '...',
                            role: 'GUEST',
                            rsvpMain: false,
                            rsvpDinner: false,
                            rsvpAfterParty: false,
                            diet: null,
                            songRequest: null,
                            plusOneAllowed: true,
                            plusOneName: null,
                            plusOneDiet: null,
                            invitedById: state.id,
                            maxInvites: 0,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        } as Guest
                    ]
                }
            }
            if (action.type === 'INVITE_DELETE') {
                return {
                    ...state,
                    invitees: state.invitees.filter(i => i.id !== action.id)
                }
            }
            if (action.type === 'INVITE_UPDATE') {
                return {
                    ...state,
                    invitees: state.invitees.map(i => i.id === action.id ? { ...i, ...action.data } : i)
                }
            }
            return state
        }
    )

    const isFamily = optimisticGuest.role === 'FAMILY' || optimisticGuest.role === 'ADMIN'
    const canInvite = optimisticGuest.maxInvites > 0

    async function handleRSVPSubmit(formData: FormData) {
        if (settings?.isRsvpLocked) {
            toast.error('RSVP is currently locked.')
            return
        }

        const newRsvp = {
            rsvpMain: formData.get('rsvpMain') === 'on',
            rsvpDinner: formData.get('rsvpDinner') === 'on',
            rsvpAfterParty: formData.get('rsvpAfterParty') === 'on',
        }

        startTransition(() => {
            setOptimisticGuest({ type: 'RSVP', data: newRsvp })
        })

        const res = await updateRSVP(formData)
        if (res?.success) toast.success('RSVP Saved')
        else toast.error(res?.error || 'Error saving RSVP')
    }

    async function handleInviteSubmit(formData: FormData) {
        const name = formData.get('name') as string
        if (!name) return

        startTransition(() => {
            setOptimisticGuest({ type: 'INVITE_ADD', name })
        })

        const res = await inviteFriend(formData)
        if (res?.success) {
            toast.success(`Invite generated: ${res.code}`)
        } else {
            toast.error(res?.error || 'Error sending invite')
        }
    }

    // Calculate countdown
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const targetDate = settings?.date ? new Date(settings.date) : new Date('2026-01-16T18:00:00');

        const timer = setInterval(() => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [settings]);


    return (
        <div className="max-w-md mx-auto relative min-h-screen pb-20">
            {/* Nanobanana Birthday Background */}
            <div className="fixed inset-0 z-[-1]">
                <img
                    src="/birthday_background.png"
                    alt="Birthday Theme Background"
                    className="w-full h-full object-cover opacity-90 animate-float"
                    style={{ animationDuration: '25s' }}
                />
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
            </div>

            {/* Header */}
            <header className="p-5 flex justify-between items-center glass sticky top-0 z-50">
                <div>
                    <h2 className="text-xs uppercase tracking-widest text-muted-foreground">Welcome</h2>
                    <h1 className="text-xl font-semibold tracking-wide">{optimisticGuest.name.split(' ')[0]}</h1>
                </div>
                <div className="flex gap-1">
                    {optimisticGuest.role === 'ADMIN' && (
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.location.href = '/admin'}>
                            <span className="sr-only">Admin</span>
                            <Settings className="w-5 h-5 opacity-60" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => logout()}>
                        <LogOut className="w-5 h-5 opacity-60" />
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="p-6 py-12 text-center space-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-4">{settings?.title || 'THE EVENT'}</h2>
                    <div className="text-6xl font-thin tracking-tighter tabular-nums text-foreground">
                        {settings?.date ? new Date(settings.date).getDate() : '16'}
                        <span className="text-primary">.</span>
                        {settings?.date ? (new Date(settings.date).getMonth() + 1).toString().padStart(2, '0') : '01'}
                        <span className="text-primary">.</span>
                        {settings?.date ? new Date(settings.date).getFullYear().toString().slice(-2) : '26'}
                    </div>
                </motion.div>

                {/* Countdown */}
                <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto text-center">
                    {Object.entries(timeLeft).map(([unit, value]) => (
                        <div key={unit} className="glass p-4 rounded-2xl card-hover">
                            <div className="text-2xl font-bold tabular-nums text-foreground">{value}</div>
                            <div className="text-[10px] uppercase text-muted-foreground tracking-wider mt-1">{unit}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Tabs Navigation */}
            <div className="px-6 mb-6">
                <div className="flex gap-1 p-1.5 glass rounded-2xl overflow-x-auto">
                    {['overview', 'info', 'rsvp', ...(canInvite ? ['invites'] : [])].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all capitalize whitespace-nowrap",
                                activeTab === tab
                                    ? "tab-active text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(10px)' }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-20"
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <Card className="glass">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-semibold tracking-wide">Your RSVP</h3>

                                    {/* Add check here for locked status in overview card as well, if desired, or just keep simple link to tab */}
                                    <form action={handleRSVPSubmit} className="space-y-4">
                                        <fieldset disabled={settings?.isRsvpLocked} className="space-y-4 disabled:opacity-50">
                                            <input type="hidden" name="guestId" value={optimisticGuest.id} />
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="rsvpMainOverview" className="text-base cursor-pointer">Attending</Label>
                                                <Switch
                                                    id="rsvpMainOverview"
                                                    name="rsvpMain"
                                                    defaultChecked={optimisticGuest.rsvpMain}
                                                    disabled={settings?.isRsvpLocked}
                                                />
                                            </div>
                                            <Button type="submit" className="w-full btn-premium rounded-lg py-2.5" disabled={settings?.isRsvpLocked}>
                                                {settings?.isRsvpLocked ? 'RSVP Locked' : 'Confirm RSVP'}
                                            </Button>
                                            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                                                {optimisticGuest.rsvpMain ? 'You are on the list' : 'Pending Response'}
                                            </p>
                                        </fieldset>
                                    </form>
                                </CardContent>
                            </Card>

                            {timeline && timeline.length > 0 && (
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-lg font-light tracking-wide">Timeline</h3>
                                    {timeline.map((item, index) => (
                                        <TimelineItem key={index} time={item.time} title={item.title} desc={item.description} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            {/* Main Event Info from Settings */}
                            <div className="grid gap-4">
                                <InfoCard icon={MapPin} title="Location" value={settings?.locationName || "TBD"} />
                                <InfoCard icon={Clock} title="Time" value={settings?.date ? format(new Date(settings.date), 'dd.MM.yyyy • HH:mm') : "TBD"} />
                                <InfoCard icon={Music} title="Vibe" value={settings?.vibe || "TBD"} />
                            </div>

                            {/* Dynamic Events */}
                            {events && events.length > 0 && (
                                <div className="space-y-3 pt-4">
                                    <h3 className="text-lg font-light tracking-wide">Events</h3>
                                    {events.map(event => (
                                        <Card key={event.id} className="glass">
                                            <CardContent className="p-4 space-y-2">
                                                <h4 className="font-semibold">{event.title}</h4>
                                                {event.date && (
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <CalendarDays className="w-4 h-4" />
                                                        {format(new Date(event.date), 'dd.MM.yyyy')}
                                                        {event.time && ` • ${event.time}`}
                                                    </p>
                                                )}
                                                {event.locationName && (
                                                    <p className="text-sm flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" /> {event.locationName}
                                                    </p>
                                                )}
                                                {event.description && (
                                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                                )}

                                                {/* SubEvents */}
                                                {event.subEvents && event.subEvents.length > 0 && (
                                                    <div className="pl-4 border-l-2 border-primary/20 mt-3 space-y-2">
                                                        {event.subEvents.map(sub => (
                                                            <div key={sub.id} className="text-sm">
                                                                <span className="font-medium">{sub.title}</span>
                                                                {sub.time && <span className="text-muted-foreground ml-2">{sub.time}</span>}
                                                                {sub.description && (
                                                                    <p className="text-xs text-muted-foreground">{sub.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'rsvp' && (
                        <div className="space-y-6">
                            <Card className="glass">
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="text-lg font-semibold tracking-wide">Your RSVP</h3>
                                    {settings?.isRsvpLocked && (
                                        <div className="p-3 mb-4 rounded-xl glass-subtle text-amber-700 text-sm">
                                            RSVP modifications are currently disabled by the host.
                                        </div>
                                    )}
                                    <form action={handleRSVPSubmit} className="space-y-6">
                                        <fieldset disabled={settings?.isRsvpLocked} className="space-y-6 disabled:opacity-50">
                                            <input type="hidden" name="guestId" value={optimisticGuest.id} />

                                            <div className="flex items-center justify-between p-3 rounded-xl glass-subtle">
                                                <Label htmlFor="rsvpMain" className="text-base cursor-pointer font-medium">Attending</Label>
                                                <Switch
                                                    id="rsvpMain"
                                                    name="rsvpMain"
                                                    defaultChecked={optimisticGuest.rsvpMain}
                                                    disabled={settings?.isRsvpLocked}
                                                />
                                            </div>

                                            {/* DINNER - FAMILY ONLY */}
                                            {isFamily && (
                                                <div className="p-3 rounded-xl glass-subtle space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <Label htmlFor="rsvpDinner" className="text-base font-medium cursor-pointer">{settings?.dinnerTitle || "Private Dinner"}</Label>
                                                            <div className="text-xs uppercase bg-primary/20 px-2 py-0.5 rounded-full text-primary-foreground w-fit mt-1">Family Only</div>
                                                        </div>
                                                        <Switch
                                                            id="rsvpDinner"
                                                            name="rsvpDinner"
                                                            defaultChecked={optimisticGuest.rsvpDinner}
                                                            disabled={settings?.isRsvpLocked}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{settings?.dinnerDescription || "Please confirm if you will join us for the family dinner before the main event."}</p>
                                                </div>
                                            )}

                                            {/* AFTERPARTY - EVERYONE */}
                                            <div className="p-3 rounded-xl glass-subtle space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="rsvpAfterParty" className="text-base font-medium cursor-pointer">{settings?.afterPartyTitle || "The Afterparty"}</Label>
                                                    <Switch
                                                        id="rsvpAfterParty"
                                                        name="rsvpAfterParty"
                                                        defaultChecked={optimisticGuest.rsvpAfterParty}
                                                        disabled={settings?.isRsvpLocked}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">{settings?.afterPartyDescription || "Music & Drinks"}</p>
                                            </div>

                                            {/* DIETARY RESTRICTIONS - Smart Visibility */}
                                            {/* We need to import check logic or inline it. Since we can't easily import from lib in client component if it uses server-only stuff (it doesn't), but let's inline for safety or just check settings. */}
                                            {(settings?.isDietEnabled === undefined || settings.isDietEnabled) && (
                                                (!settings?.dietTargetRoles || settings.dietTargetRoles === '' || settings.dietTargetRoles.includes(optimisticGuest.role)) && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                                                        <Input
                                                            id="dietaryRestrictions"
                                                            name="dietaryRestrictions"
                                                            placeholder="Allergies, vegetarian, vegan..."
                                                            defaultValue={optimisticGuest.dietaryRestrictions || ''}
                                                            className="input-glass rounded-xl"
                                                        />
                                                    </div>
                                                ))}

                                            {/* SONG REQUEST - Smart Visibility */}
                                            {(settings?.isSongRequestEnabled === undefined || settings.isSongRequestEnabled) && (
                                                (!settings?.songTargetRoles || settings?.songTargetRoles === '' || settings?.songTargetRoles.includes(optimisticGuest.role)) && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="songRequest">Song Request</Label>
                                                        <Input
                                                            id="songRequest"
                                                            name="songRequest"
                                                            placeholder="What gets you on the dance floor?"
                                                            defaultValue={optimisticGuest.songRequest || ''}
                                                            className="input-glass rounded-xl"
                                                        />
                                                    </div>
                                                ))}

                                            {optimisticGuest.plusOneAllowed && (
                                                <div className="space-y-3 pt-4 border-t border-border">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium text-muted-foreground">Bringing a Plus One?</Label>
                                                    </div>
                                                    <Input
                                                        name="plusOneName"
                                                        placeholder="+1 Name"
                                                        defaultValue={optimisticGuest.plusOneName || ''}
                                                        className="bg-secondary/50 border-border"
                                                        disabled={settings?.isRsvpLocked}
                                                    />
                                                    <Input
                                                        name="plusOneDiet"
                                                        placeholder="+1 Dietary Requirements"
                                                        defaultValue={optimisticGuest.plusOneDiet || ''}
                                                        className="bg-secondary/50 border-border text-sm"
                                                        disabled={settings?.isRsvpLocked}
                                                    />
                                                </div>
                                            )}

                                            <Button type="submit" className="w-full btn-premium rounded-lg py-2.5" disabled={settings?.isRsvpLocked}>
                                                {settings?.isRsvpLocked ? 'RSVP Locked' : 'Update RSVP'}
                                            </Button>
                                        </fieldset>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'invites' && canInvite && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-light tracking-wide">Your Invites</h3>
                            {optimisticGuest.invitees.length === 0 ? (
                                <p className="text-muted-foreground text-sm">You haven't invited anyone yet.</p>
                            ) : (
                                <div className="grid gap-3">
                                    {optimisticGuest.invitees.map((invitee: Guest) => (
                                        <InviteCard
                                            key={invitee.id}
                                            invitee={invitee}
                                            onDelete={(id) => {
                                                startTransition(() => {
                                                    setOptimisticGuest({ type: 'INVITE_DELETE', id })
                                                })
                                            }}
                                            onUpdate={(id, data) => {
                                                startTransition(() => {
                                                    setOptimisticGuest({ type: 'INVITE_UPDATE', id, data })
                                                })
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {(optimisticGuest.maxInvites - optimisticGuest.invitees.length > 0) && (
                                <form action={handleInviteSubmit} className="space-y-4 pt-4 border-t border-border">
                                    <div className="space-y-1">
                                        <Label>Invite a Friend</Label>
                                        <p className="text-[10px] text-muted-foreground">Add phone or email to send them a magic link.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Input name="name" placeholder="Friend's Name" required className="bg-secondary/50 border-border" />
                                        <Input name="phone" placeholder="Phone (e.g. 123456789)" className="bg-secondary/50 border-border" />
                                        <Input name="email" placeholder="Email (optional)" type="email" className="bg-secondary/50 border-border" />
                                    </div>
                                    <Button type="submit" className="w-full btn-premium">
                                        Send Invite
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center pt-2">
                                        You have {optimisticGuest.maxInvites - optimisticGuest.invitees.length} invites remaining.
                                    </p>
                                </form>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

function TimelineItem({ time, title, desc }: { time: string, title: string, desc: string }) {
    return (
        <div className="flex gap-6 relative group">
            <div className="w-12 text-right pt-1 text-sm font-mono text-muted-foreground group-hover:text-foreground transition-colors">{time}</div>

            {/* Dot and Line */}
            <div className="relative flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary z-10 shadow-[0_0_10px_rgba(200,160,80,0.3)] group-hover:scale-125 transition-transform duration-300" />
                <div className="w-[1px] h-full bg-border absolute top-3 group-hover:bg-primary/20 transition-colors" />
            </div>

            <div className="pb-8 pt-0.5">
                <h3 className="text-lg font-light tracking-wide group-hover:translate-x-1 transition-transform">{title}</h3>
                <p className="text-sm text-muted-foreground font-light">{desc}</p>
            </div>
        </div>
    )
}

function InfoCard({ icon: Icon, title, value }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-2xl glass card-hover cursor-default"
        >
            <div className="p-3 rounded-xl bg-primary/15">
                <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
                <div className="text-sm font-medium">{value}</div>
            </div>
        </motion.div>
    )
}

function InviteCard({ invitee, onDelete, onUpdate }: {
    invitee: any,
    onDelete: (id: string) => void,
    onUpdate: (id: string, data: any) => void
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleUpdate(formData: FormData) {
        setIsEditing(false)
        const name = formData.get('name')
        const phone = formData.get('phone')
        const email = formData.get('email')

        onUpdate(invitee.id, { name, phone, email }) // Optimistic

        const res = await updateInvite(formData)
        if (!res.success) {
            toast.error('Failed to update invite')
            // Revert? (In a real app, yes. Here we rely on revalidation)
        } else {
            toast.success('Invite updated')
        }
    }

    async function handleDelete() {
        setIsDeleting(false) // Close modal/state
        onDelete(invitee.id) // Optimistic

        const res = await deleteInvite(invitee.id)
        if (!res.success) {
            toast.error(res.error || 'Failed to delete')
        } else {
            toast.success('Invite deleted')
        }
    }

    async function copyLink() {
        // Construct link (Assuming standard port/domain for now, ideally passed from prop)
        const link = `${window.location.origin}/invite/${invitee.code}`
        await navigator.clipboard.writeText(link)
        toast.success("Link copied!")
    }

    if (isEditing) {
        return (
            <div className="p-4 rounded-2xl glass-subtle space-y-3">
                <form action={handleUpdate} className="space-y-3">
                    <input type="hidden" name="guestId" value={invitee.id} />
                    <Input name="name" defaultValue={invitee.name} placeholder="Name" className="input-glass rounded-xl" required />
                    <Input name="phone" defaultValue={invitee.phone || ''} placeholder="Phone" className="input-glass rounded-xl" />
                    <Input name="email" defaultValue={invitee.email || ''} placeholder="Email" className="input-glass rounded-xl" />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setIsEditing(false)} type="button"><X className="w-4 h-4" /></Button>
                        <Button size="sm" className="btn-premium" type="submit"><Check className="w-4 h-4" /></Button>
                    </div>
                </form>
            </div>
        )
    }

    if (isDeleting) {
        return (
            <div className="p-4 rounded-2xl glass-subtle border border-destructive/20 space-y-3">
                <p className="text-sm text-destructive">Are you sure you want to delete this invite?</p>
                <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setIsDeleting(false)}>Cancel</Button>
                    <Button size="sm" variant="destructive" className="rounded-full" onClick={handleDelete}>Delete</Button>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 rounded-2xl glass card-hover group"
        >
            <div>
                <div className="font-medium flex items-center gap-2">
                    {invitee.name}
                    <button onClick={copyLink} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" title="Copy Magic Link">
                        <Copy className="w-3 h-3" />
                    </button>
                </div>
                <div className="text-xs text-muted-foreground tracking-widest">{invitee.code}</div>
            </div>

            <div className="flex items-center gap-3">
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] uppercase font-medium",
                    invitee.rsvpMain ? "badge-success" : "badge-pending"
                )}>
                    {invitee.rsvpMain ? 'Accepted' : 'Pending'}
                </span>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive" onClick={() => setIsDeleting(true)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </motion.div>
    )
}
