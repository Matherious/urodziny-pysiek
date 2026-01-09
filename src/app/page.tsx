'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { authenticate } from './actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [code, setCode] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    const result = await authenticate(formData)

    if (result?.error) {
      toast.error(result.error)
      setIsLoading(false)
    } else if (result?.success) {
      toast.success('Welcome back')
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Nanobanana Birthday Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="/birthday_background.png"
          alt="Birthday Theme Background"
          className="w-full h-full object-cover opacity-90 animate-float"
          style={{ animationDuration: '20s' }}
        />
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Glass Card */}
        <div className="glass p-8 space-y-8">
          <div className="text-center space-y-2">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-semibold tracking-wider text-foreground"
            >
              Urodziny
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm tracking-widest text-primary font-medium uppercase bg-white/40 px-3 py-1 rounded-full inline-block"
            >
              Circle of Trust
            </motion.p>
          </div>

          <form action={handleSubmit} className="space-y-5">
            <div className="relative">
              <Input
                name="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ACCESS CODE"
                className="h-14 text-center text-lg tracking-[0.4em] uppercase input-glass rounded-2xl text-foreground focus:border-primary transition-all placeholder:tracking-widest placeholder:text-muted-foreground/60"
                required
                minLength={6}
                maxLength={6}
                autoComplete="off"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-premium tracking-widest uppercase text-sm"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter'}
            </Button>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-[10px] text-muted-foreground tracking-widest uppercase"
          >
            invite only event
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
