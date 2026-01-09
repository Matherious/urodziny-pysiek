'use client'

import { useState, useRef } from 'react'
import { Guest, EventSettings, TimelineItem, Event, SubEvent } from '@prisma/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { generateInvite, deleteGuest, sendBulkSMS, updateGuestAdmin, importGuestsFromCSV } from '../actions/admin'
import { createEvent, updateEvent, deleteEvent, createSubEvent, updateSubEvent, deleteSubEvent } from '../actions/events'
import { updateEventSettings, addTimelineItem, deleteTimelineItem, updateTimelineItem } from '../actions/settings'
import { toast } from 'sonner'
import { Loader2, Trash2, Send, Users, CheckSquare, Square, Pencil, Upload, Plus, Calendar, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

type FullGuest = Guest & {
    invitees: Guest[]
    invitedBy: Guest | null
    plusOneAllowed?: boolean
    plusOneName?: string | null
    plusOneDiet?: string | null
    phone?: string | null
    email?: string | null
}

type FullEvent = Event & {
    subEvents: SubEvent[]
}

export function AdminClient({ guests, stats, settings, timeline, events }: {
    guests: FullGuest[],
    stats: { total: number; main: number; dinner: number; afterParty: number },
    settings: EventSettings | null,
    timeline: TimelineItem[],
    events: FullEvent[]
}) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedGuests, setSelectedGuests] = useState<string[]>([])
    const [editingGuest, setEditingGuest] = useState<FullGuest | null>(null)
    const [editLoading, setEditLoading] = useState(false)

    // SMS State
    const [smsTarget, setSmsTarget] = useState<'ALL' | 'GROUP' | 'SELECTED' | 'GUESTS_OF_ROLE'>('ALL')
    const [smsGroupFilter, setSmsGroupFilter] = useState<string>('FAMILY')
    const [smsMessage, setSmsMessage] = useState('')
    const [smsThinking, setSmsThinking] = useState(false)

    async function onGenerateSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            const res = await generateInvite(formData)

            if (res?.success) {
                toast.success(`Generated: ${res.code} `)
                setOpen(false)
                window.location.reload()
            } else {
                toast.error(res?.error || 'Error generating invite')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setIsLoading(false)
        }
    }

    async function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setEditLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            const res = await updateGuestAdmin(formData)

            if (res?.success) {
                toast.success('Guest Updated')
                setEditingGuest(null)
                window.location.reload()
            } else {
                toast.error(res?.error || 'Error updating guest')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setEditLoading(false)
        }
    }

    async function handleGuestDelete(id: string) {
        if (!confirm('Delete this guest? This cannot be undone.')) return
        const res = await deleteGuest(id)
        if (res?.success) {
            toast.success('Guest Deleted')
            window.location.reload()
        } else toast.error('Error deleting')
    }



    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedGuests.length === guests.length) {
            setSelectedGuests([])
        } else {
            setSelectedGuests(guests.map(g => g.id))
        }
    }

    const toggleSelectGuest = (id: string) => {
        if (selectedGuests.includes(id)) {
            setSelectedGuests(selectedGuests.filter(g => g !== id))
        } else {
            setSelectedGuests([...selectedGuests, id])
        }
    }

    // SMS Handler
    async function handleSendSMS() {
        if (!confirm(`Are you sure you want to send this message to ${getRecipientCount()} people?`)) return

        setSmsThinking(true)
        try {
            const res = await sendBulkSMS({
                message: smsMessage,
                target: smsTarget,
                filter: smsTarget === 'GROUP' ? smsGroupFilter : (smsTarget === 'SELECTED' ? selectedGuests : undefined)
            })

            if (res.success) {
                toast.success(`Sent: ${res.sent}, Failed: ${res.failed}`)
                setSmsMessage('')
            } else {
                toast.error(res.error || 'Failed to send SMS')
            }
        } catch (e) {
            toast.error('Error sending SMS')
        } finally {
            setSmsThinking(false)
        }
    }

    const getRecipientCount = () => {
        if (smsTarget === 'ALL') return guests.length
        if (smsTarget === 'SELECTED') return selectedGuests.length
        if (smsTarget === 'GROUP') return guests.filter(g => g.role === smsGroupFilter).length
        if (smsTarget === 'GUESTS_OF_ROLE') return guests.filter(g => g.invitedBy?.role === smsGroupFilter).length
        return 0
    }

    async function handleSettingsSubmit(formData: FormData) {
        const res = await updateEventSettings(formData)
        if (res?.success) toast.success('Settings Saved')
        else toast.error('Error saving settings')
    }

    async function handleTimelineAdd(formData: FormData) {
        const res = await addTimelineItem(formData)
        if (res?.success) {
            toast.success('Event Added')
            window.location.reload()
        } else toast.error('Error adding event')
    }

    async function handleTimelineDelete(id: string) {
        if (!confirm('Are you sure?')) return
        const res = await deleteTimelineItem(id)
        if (res?.success) {
            toast.success('Deleted')
            window.location.reload()
        } else toast.error('Error deleting')
    }

    const [editingTimelineItem, setEditingTimelineItem] = useState<TimelineItem | null>(null)

    async function handleTimelineUpdate(formData: FormData) {
        const res = await updateTimelineItem(formData)
        if (res?.success) {
            toast.success('Updated')
            setEditingTimelineItem(null)
            window.location.reload()
        } else toast.error('Error updating')
    }

    // === CSV Import ===
    const csvFileRef = useRef<HTMLInputElement>(null)
    const [csvImporting, setCsvImporting] = useState(false)

    async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setCsvImporting(true)
        try {
            const content = await file.text()
            const res = await importGuestsFromCSV(content)
            if (res.success) {
                toast.success(`Imported ${res.created} guests. Skipped: ${res.skipped}`)
                if (res.errors.length > 0) {
                    console.log('Import errors:', res.errors)
                }
                window.location.reload()
            } else {
                toast.error(res.errors[0] || 'Import failed')
            }
        } catch (err) {
            toast.error('Failed to read file')
        } finally {
            setCsvImporting(false)
            if (csvFileRef.current) csvFileRef.current.value = ''
        }
    }

    // === Event Management ===
    const [eventDialogOpen, setEventDialogOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<FullEvent | null>(null)
    const [eventLoading, setEventLoading] = useState(false)

    // SubEvent state
    const [subEventDialogOpen, setSubEventDialogOpen] = useState(false)
    const [editingSubEvent, setEditingSubEvent] = useState<SubEvent | null>(null)
    const [currentEventId, setCurrentEventId] = useState<string | null>(null)
    const [subEventLoading, setSubEventLoading] = useState(false)

    async function handleEventSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setEventLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            const res = editingEvent
                ? await updateEvent(formData)
                : await createEvent(formData)
            if (res?.success) {
                toast.success(editingEvent ? 'Event updated' : 'Event created')
                setEventDialogOpen(false)
                setEditingEvent(null)
                window.location.reload()
            } else {
                toast.error(res?.error || 'Failed')
            }
        } catch {
            toast.error('Error')
        } finally {
            setEventLoading(false)
        }
    }

    async function handleEventDelete(id: string) {
        if (!confirm('Delete this event and all its sub-events?')) return
        const res = await deleteEvent(id)
        if (res?.success) {
            toast.success('Event deleted')
            window.location.reload()
        } else toast.error('Error deleting')
    }

    async function handleSubEventSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSubEventLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            const res = editingSubEvent
                ? await updateSubEvent(formData)
                : await createSubEvent(formData)
            if (res?.success) {
                toast.success(editingSubEvent ? 'Sub-event updated' : 'Sub-event created')
                setSubEventDialogOpen(false)
                setEditingSubEvent(null)
                setCurrentEventId(null)
                window.location.reload()
            } else {
                toast.error(res?.error || 'Failed')
            }
        } catch {
            toast.error('Error')
        } finally {
            setSubEventLoading(false)
        }
    }

    async function handleSubEventDelete(id: string) {
        if (!confirm('Delete this sub-event?')) return
        const res = await deleteSubEvent(id)
        if (res?.success) {
            toast.success('Sub-event deleted')
            window.location.reload()
        } else toast.error('Error deleting')
    }

    function openAddSubEvent(eventId: string) {
        setCurrentEventId(eventId)
        setEditingSubEvent(null)
        setSubEventDialogOpen(true)
    }

    function openEditSubEvent(subEvent: SubEvent) {
        setEditingSubEvent(subEvent)
        setCurrentEventId(subEvent.eventId)
        setSubEventDialogOpen(true)
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                {events.slice(0, 3).map((event) => (
                    <Card key={event.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm font-medium">{new Date(event.date).toLocaleDateString()}</div>
                            {event.time && <div className="text-xs text-muted-foreground">{event.time}</div>}
                            {event.subEvents.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">{event.subEvents.length} sub-event(s)</div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {events.length === 0 && (
                    <>
                        <Card className="opacity-50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">No events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Add events in Event Settings</div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <Tabs defaultValue="guests" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="guests">Guest List</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="settings">Event Settings</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="guests" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                            {selectedGuests.length} selected
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={csvFileRef}
                                accept=".csv"
                                className="hidden"
                                onChange={handleCSVImport}
                            />
                            <Button
                                variant="outline"
                                onClick={() => csvFileRef.current?.click()}
                                disabled={csvImporting}
                            >
                                {csvImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                Import CSV
                            </Button>
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button>Generate Invite</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>New Guest Invite</DialogTitle>
                                        <p className="text-sm text-muted-foreground">Generate a unique access code for a new guest.</p>
                                    </DialogHeader>
                                    <form onSubmit={onGenerateSubmit} className="space-y-5 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="inviteName">Guest Name</Label>
                                            <Input id="inviteName" name="name" placeholder="e.g. Jan Kowalski" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="invitePhone">Phone (Optional)</Label>
                                                <Input id="invitePhone" name="phone" placeholder="+48..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="inviteEmail">Email (Optional)</Label>
                                                <Input id="inviteEmail" name="email" type="email" placeholder="example@..." />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Select name="role" defaultValue="FRIEND">
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper">
                                                        <SelectItem value="FAMILY">Family</SelectItem>
                                                        <SelectItem value="FRIEND">Friend</SelectItem>
                                                        <SelectItem value="VIP">VIP</SelectItem>
                                                        <SelectItem value="GUEST">Guest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="maxInvites">Can Invite (x)</Label>
                                                <Input id="maxInvites" name="maxInvites" type="number" placeholder="0" defaultValue="0" min="0" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                            <div className="space-y-1">
                                                <Label htmlFor="genPlusOne" className="text-sm font-medium cursor-pointer">Allow +1</Label>
                                                <p className="text-xs text-muted-foreground">Guest can bring a companion</p>
                                            </div>
                                            <Switch
                                                id="genPlusOne"
                                                name="plusOneAllowed"
                                                defaultChecked={true}
                                            />
                                        </div>

                                        <Button type="submit" className="w-full btn-premium" disabled={isLoading}>
                                            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                            Generate Code
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <Dialog open={!!editingGuest} onOpenChange={(o) => !o && setEditingGuest(null)}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit Guest</DialogTitle>
                            </DialogHeader>
                            {editingGuest && (
                                <form onSubmit={onEditSubmit} className="space-y-5 pt-2">
                                    <input type="hidden" name="guestId" value={editingGuest.id} />
                                    <div className="space-y-2">
                                        <Label htmlFor="editName">Guest Name</Label>
                                        <Input id="editName" name="name" defaultValue={editingGuest.name} required />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="editPhone">Phone</Label>
                                            <Input id="editPhone" name="phone" defaultValue={editingGuest.phone || ''} placeholder="+48..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="editEmail">Email</Label>
                                            <Input id="editEmail" name="email" type="email" defaultValue={editingGuest.email || ''} placeholder="example@..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select name="role" defaultValue={editingGuest.role}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent position="popper">
                                                    <SelectItem value="FAMILY">Family</SelectItem>
                                                    <SelectItem value="FRIEND">Friend</SelectItem>
                                                    <SelectItem value="VIP">VIP</SelectItem>
                                                    <SelectItem value="GUEST">Guest</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="editMaxInvites">Can Invite (x)</Label>
                                            <Input id="editMaxInvites" name="maxInvites" type="number" defaultValue={editingGuest.maxInvites} min="0" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                                        <div className="space-y-1">
                                            <Label htmlFor="editPlusOne" className="text-sm font-medium cursor-pointer">Allow +1</Label>
                                        </div>
                                        <Switch
                                            id="editPlusOne"
                                            name="plusOneAllowed"
                                            defaultChecked={editingGuest.plusOneAllowed}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full btn-premium" disabled={editLoading}>
                                        {editLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                        Save Changes
                                    </Button>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>

                    <div className="border rounded-lg bg-card text-card-foreground">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <div className="flex items-center justify-center cursor-pointer" onClick={toggleSelectAll}>
                                            {selectedGuests.length === guests.length && guests.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                        </div>
                                    </TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Invited By</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-center">+1</TableHead>
                                    <TableHead className="text-center">RSVP</TableHead>
                                    <TableHead className="text-right">Diet</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guests.map((guest) => (
                                    <TableRow key={guest.id}>
                                        <TableCell>
                                            <div className="flex items-center justify-center cursor-pointer" onClick={() => toggleSelectGuest(guest.id)}>
                                                {selectedGuests.includes(guest.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {guest.name}
                                            {guest.phone && <div className="text-[10px] text-muted-foreground">{guest.phone}</div>}
                                            {guest.invitees.length > 0 && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    Invited: {guest.invitees.length} / {guest.maxInvites}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {guest.invitedBy ? guest.invitedBy.name : '-'}
                                        </TableCell>
                                        <TableCell className="font-mono">{guest.code}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{guest.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {guest.plusOneAllowed ? (
                                                <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground">No</Badge>
                                            )}
                                            {guest.plusOneName && <div className="text-[10px] mt-1">{guest.plusOneName}</div>}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${guest.rsvpMain ? 'bg-green-500' : 'bg-muted-foreground/30'}`} title="Main" />
                                                <div className={`w-2 h-2 rounded-full ${guest.rsvpDinner ? 'bg-green-500' : 'bg-muted-foreground/30'}`} title="Dinner" />
                                                <div className={`w-2 h-2 rounded-full ${guest.rsvpAfterParty ? 'bg-green-500' : 'bg-muted-foreground/30'}`} title="After" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs truncate max-w-[150px]">
                                            {guest.diet}
                                            {guest.plusOneDiet && <div className="text-muted-foreground">Since +1: {guest.plusOneDiet}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" type="button" onClick={() => setEditingGuest(guest)} className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-6 w-6 mr-1">
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" type="button" onClick={() => handleGuestDelete(guest.id)} className="text-red-500 hover:text-red-700 hover:bg-red-500/10 h-6 w-6">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send Notifications</CardTitle>
                            <CardDescription>Send SMS updates to your guests. (Require: .env setup)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>Recipients</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${smsTarget === 'ALL' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                        onClick={() => setSmsTarget('ALL')}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4" />
                                            <span className="font-semibold">All Guests</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Everyone in the list</p>
                                    </div>

                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${smsTarget === 'GROUP' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                        onClick={() => setSmsTarget('GROUP')}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users className="w-4 h-4" />
                                            <span className="font-semibold">By Group</span>
                                        </div>
                                        <Select value={smsGroupFilter} onValueChange={setSmsGroupFilter} disabled={smsTarget !== 'GROUP'}>
                                            <SelectTrigger className="w-full bg-background min-h-[2rem] h-auto" onClick={(e) => {
                                                // Ensure clicking trigger also selects the group mode
                                                if (smsTarget !== 'GROUP') setSmsTarget('GROUP')
                                            }}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FAMILY">Family</SelectItem>
                                                <SelectItem value="FRIEND">Friend</SelectItem>
                                                <SelectItem value="VIP">VIP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${smsTarget === 'SELECTED' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                        onClick={() => setSmsTarget('SELECTED')}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckSquare className="w-4 h-4" />
                                            <span className="font-semibold">Selected</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{selectedGuests.length} guests selected</p>
                                    </div>

                                    <div
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${smsTarget === 'GUESTS_OF_ROLE' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                                        onClick={() => {
                                            setSmsTarget('GUESTS_OF_ROLE')
                                            setSmsGroupFilter('VIP') // Default to VIPs inviting
                                        }}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4" />
                                            <span className="font-semibold">Guests of VIPs</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Send to people invited by VIPs</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Message</Label>
                                    <span className={`text-xs ${smsMessage.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {smsMessage.length} / 160 chars
                                    </span>
                                </div>
                                <div className="flex gap-2 pb-2">
                                    <Badge variant="outline" className="cursor-pointer hover:bg-white/10" onClick={() => setSmsMessage(prev => prev + ' {name}')}>+ Name</Badge>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-white/10" onClick={() => setSmsMessage(prev => prev + ' {inviter_name}')}>+ Inviter Name</Badge>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-white/10" onClick={() => setSmsMessage(prev => prev + ' {code}')}>+ Code</Badge>
                                    <Badge variant="outline" className="cursor-pointer hover:bg-white/10" onClick={() => setSmsMessage(prev => prev + ' {link}')}>+ Magic Link</Badge>
                                </div>
                                <textarea
                                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Type your message here..."
                                    value={smsMessage}
                                    onChange={(e) => setSmsMessage(e.target.value)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-6">
                            <div className="text-sm text-muted-foreground">
                                Will send to: <span className="font-bold text-foreground">{getRecipientCount()}</span> recipients
                            </div>
                            <Button onClick={handleSendSMS} disabled={smsThinking || getRecipientCount() === 0 || !smsMessage}>
                                {smsThinking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Send SMS
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    {/* Global Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Settings</CardTitle>
                            <CardDescription>General event configuration for RSVP and features</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={handleSettingsSubmit} className="space-y-4 max-w-lg">
                                <div className="flex items-center gap-2 p-3 border rounded-md">
                                    <Switch name="isRsvpLocked" id="rsvpLock" defaultChecked={settings?.isRsvpLocked} />
                                    <Label htmlFor="rsvpLock">Lock RSVP (Prevent Changes)</Label>
                                </div>
                                <Button type="submit">Save Global Settings</Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Events Management */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Events</CardTitle>
                                <CardDescription>Manage your events and sub-events</CardDescription>
                            </div>
                            <Button onClick={() => { setEditingEvent(null); setEventDialogOpen(true) }}>
                                <Plus className="w-4 h-4 mr-2" /> Add Event
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {events.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No events yet. Click "Add Event" to create one.</p>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                                                    </span>
                                                    {event.locationName && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {event.locationName}
                                                        </span>
                                                    )}
                                                </div>
                                                {event.description && <p className="text-sm mt-2">{event.description}</p>}
                                                <div className="flex gap-1 mt-2">
                                                    {event.visibleToRoles.split(',').map((role) => (
                                                        <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingEvent(event); setEventDialogOpen(true) }}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEventDelete(event.id)} className="text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Sub-events */}
                                        <div className="pl-4 border-l-2 border-muted space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Sub-events</span>
                                                <Button variant="ghost" size="sm" onClick={() => openAddSubEvent(event.id)}>
                                                    <Plus className="w-3 h-3 mr-1" /> Add
                                                </Button>
                                            </div>
                                            {event.subEvents.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No sub-events</p>
                                            ) : (
                                                event.subEvents.map((sub) => (
                                                    <div key={sub.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                                                        <div>
                                                            <span className="font-medium text-sm">{sub.title}</span>
                                                            {sub.time && <span className="text-xs text-muted-foreground ml-2">{sub.time}</span>}
                                                            <div className="flex gap-1 mt-1">
                                                                {sub.visibleToRoles.split(',').map((role) => (
                                                                    <Badge key={role} variant="outline" className="text-[10px]">{role}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditSubEvent(sub)}>
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => handleSubEventDelete(sub.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Event Dialog */}
                    <Dialog open={eventDialogOpen} onOpenChange={(o) => { if (!o) { setEventDialogOpen(false); setEditingEvent(null) } else setEventDialogOpen(true) }}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleEventSubmit} className="space-y-4">
                                {editingEvent && <input type="hidden" name="id" value={editingEvent.id} />}
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input name="title" defaultValue={editingEvent?.title || ''} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date *</Label>
                                        <Input name="date" type="date" defaultValue={editingEvent?.date ? new Date(editingEvent.date).toISOString().split('T')[0] : ''} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input name="time" type="time" defaultValue={editingEvent?.time || ''} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Location Name</Label>
                                        <Input name="locationName" defaultValue={editingEvent?.locationName || ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Address</Label>
                                        <Input name="locationAddress" defaultValue={editingEvent?.locationAddress || ''} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input name="description" defaultValue={editingEvent?.description || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Order</Label>
                                    <Input name="order" type="number" defaultValue={editingEvent?.order || 0} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Visible To Roles</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['ALL', 'FAMILY', 'FRIEND', 'VIP', 'GUEST'].map((role) => (
                                            <label key={role} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                                                <input type="checkbox" name={`role_${role}`} defaultChecked={editingEvent?.visibleToRoles.includes(role) || (!editingEvent && role === 'ALL')} />
                                                <span className="text-sm">{role}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={eventLoading}>
                                    {eventLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* SubEvent Dialog */}
                    <Dialog open={subEventDialogOpen} onOpenChange={(o) => { if (!o) { setSubEventDialogOpen(false); setEditingSubEvent(null); setCurrentEventId(null) } else setSubEventDialogOpen(true) }}>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>{editingSubEvent ? 'Edit Sub-Event' : 'Add Sub-Event'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubEventSubmit} className="space-y-4">
                                {editingSubEvent && <input type="hidden" name="id" value={editingSubEvent.id} />}
                                <input type="hidden" name="eventId" value={currentEventId || ''} />
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input name="title" defaultValue={editingSubEvent?.title || ''} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input name="date" type="date" defaultValue={editingSubEvent?.date ? new Date(editingSubEvent.date).toISOString().split('T')[0] : ''} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Time</Label>
                                        <Input name="time" type="time" defaultValue={editingSubEvent?.time || ''} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input name="description" defaultValue={editingSubEvent?.description || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Order</Label>
                                    <Input name="order" type="number" defaultValue={editingSubEvent?.order || 0} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Visible To Roles</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['ALL', 'FAMILY', 'FRIEND', 'VIP', 'GUEST'].map((role) => (
                                            <label key={role} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-accent">
                                                <input type="checkbox" name={`role_${role}`} defaultChecked={editingSubEvent?.visibleToRoles.includes(role) || (!editingSubEvent && role === 'ALL')} />
                                                <span className="text-sm">{role}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={subEventLoading}>
                                    {subEventLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {editingSubEvent ? 'Update Sub-Event' : 'Add Sub-Event'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Timeline</CardTitle>
                            <CardDescription>Overview of all scheduled events. Create events in "Event Settings" tab.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {events.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No events scheduled. Add events in the "Event Settings" tab.</p>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className="border rounded-lg p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-16 text-center">
                                                <div className="text-lg font-bold">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric' })}</div>
                                                <div className="text-xs text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                {event.time && <div className="text-xs mt-1">{event.time}</div>}
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                                {event.locationName && (
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.locationName}
                                                    </div>
                                                )}
                                                {event.description && <p className="text-sm mt-2">{event.description}</p>}
                                                <div className="flex gap-1 mt-2">
                                                    {event.visibleToRoles.split(',').map((role) => (
                                                        <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                                                    ))}
                                                </div>

                                                {event.subEvents.length > 0 && (
                                                    <div className="mt-4 pl-4 border-l-2 border-muted space-y-2">
                                                        <div className="text-xs font-medium text-muted-foreground uppercase">Sub-events</div>
                                                        {event.subEvents.map((sub) => (
                                                            <div key={sub.id} className="flex items-center gap-3">
                                                                {sub.time && <span className="text-sm font-mono text-muted-foreground">{sub.time}</span>}
                                                                <span className="text-sm">{sub.title}</span>
                                                                {sub.description && <span className="text-xs text-muted-foreground">— {sub.description}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
