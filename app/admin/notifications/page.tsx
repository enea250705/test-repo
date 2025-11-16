"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Trash2, X, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth"
import { AdminSidebar, MobileHeader, MobileMenu } from "../components/AdminLayout"

interface Notification {
  id: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Background image for consistency with other admin pages
  const bgImage = "/images/gymxam4.webp"

  // Handle auth redirects
  useEffect(() => {
    if (user === null) {
      router.push("/login")
    } else if (user && user.role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/notifications?unreadOnly=${showUnreadOnly}`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [showUnreadOnly])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, read: true }
              : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
        
        toast({
          title: "Success",
          description: "Notification marked as read"
        })
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        setUnreadCount(0)
        
        toast({
          title: "Success",
          description: "All notifications marked as read"
        })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        
        toast({
          title: "Success",
          description: "Notification deleted"
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      })
    }
  }

  // Handle loading and auth states
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    )
  }

  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">You don't have permission to access the admin area</p>
          <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        {/* Background image with overlay */}
        <div className="fixed inset-0 -z-10">
          <Image 
            src={bgImage}
            alt="Admin dashboard background"
            fill
            priority
            sizes="100vw"
            quality={80}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
        </div>
        
        {/* Desktop sidebar */}
        <AdminSidebar user={user} unreadNotifications={unreadCount} />
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          user={user} 
          unreadNotifications={unreadCount}
        />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2 flex items-center gap-2">
                  <Bell className="h-8 w-8 text-primary" />
                  Class Cancellation Notifications
                </h1>
                <p className="text-white/70 max-w-xl">
                  Track when clients cancel their class bookings
                </p>
              </div>
              
              {unreadCount > 0 && (
                <Badge className="bg-primary text-black text-lg px-4 py-2">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showUnreadOnly ? "default" : "outline"}
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                size="sm"
                className={showUnreadOnly 
                  ? "bg-primary text-black hover:bg-primary/90" 
                  : "bg-transparent border-white/20 text-white hover:bg-white/10"
                }
              >
                {showUnreadOnly ? "Show All" : "Unread Only"}
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={markAllAsRead}
                  size="sm"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={fetchNotifications}
                size="sm"
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-r-transparent animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-xl">
              <CardContent className="py-12">
                <div className="text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-white/30" />
                  <p className="text-lg text-white">No notifications</p>
                  <p className="text-sm mt-2 text-white/70">
                    {showUnreadOnly 
                      ? "You have no unread notifications"
                      : "You'll see class cancellation notifications here"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={`bg-black/40 backdrop-blur-md border-white/10 shadow-xl transition-all ${
                    notification.read ? "opacity-60" : "border-l-4 border-l-primary"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {!notification.read && (
                            <Badge className="bg-primary text-black text-xs">New</Badge>
                          )}
                          <span className="text-sm text-white/60">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-base text-white">{notification.message}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead([notification.id])}
                            title="Mark as read"
                            className="text-white hover:bg-white/10"
                          >
                            <CheckCheck className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete notification"
                          className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

