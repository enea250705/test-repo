"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Save, 
  Bell, 
  CalendarDays, 
  Clock, 
  AlertTriangle,
  LayoutDashboard, 
  Settings, 
  Users,
  Search,
  Check,
  X,
  MenuIcon,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock4,
  RefreshCw,
  Edit3,
  Plus,
  Minus,
  Calendar,
  UserIcon
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import { AdminSidebar, MobileHeader, MobileMenu } from "../components/AdminLayout"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

// Define interfaces
interface ClientPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  endDate: string;
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  package?: ClientPackage;
  packageExpiry?: string;
}

// Define LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading data...</h3>
    </div>
  </div>
);

export default function AdminSettingsPage() {
  const router = useRouter()
  const { isLoading, user } = useAuth()
  const { toast } = useToast()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  
  const [generalSettings, setGeneralSettings] = useState({
    studioName: "GymXam",
    email: "info@gymxam.com",
    phone: "+1 (555) 123-4567",
    address: "123 Fitness Ave, New York, NY 10001",
    cancelHours: "8",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    sendBookingConfirmations: true,
    sendCancellationNotifications: true,
    sendRenewalReminders: true,
    reminderDays: "7",
    allowClientEmails: false,
  })

  const [packageSettings, setPackageSettings] = useState({
    package8Price: "120",
    package12Price: "160",
    packageDuration: "30",
    allowAutoRenewal: false,
  })

  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isUpdatingClasses, setIsUpdatingClasses] = useState(false)

  const [newExpirationDate, setNewExpirationDate] = useState<Date | undefined>(undefined)

  const [editExpirationDialog, setEditExpirationDialog] = useState({
    isOpen: false,
    user: null as Client | null,
    packageExpiry: ""
  })

  // Load settings from API on component mount
  useEffect(() => {
    if (user && user.role === "admin") {
      loadSettings()
      loadClients()
      fetchNotificationCount()
    }
  }, [user])

  // Filter clients based on search term
  useEffect(() => {
    if (clientSearchTerm) {
      setFilteredClients(clients.filter(client => 
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
      ))
    } else {
      setFilteredClients(clients)
    }
  }, [clients, clientSearchTerm])

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true)
      const response = await fetch('/api/admin/settings')
      
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setGeneralSettings(prev => ({ ...prev, ...data.settings.general }))
          setNotificationSettings(prev => ({ ...prev, ...data.settings.notifications }))
          setPackageSettings(prev => ({ ...prev, ...data.settings.packages }))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const loadClients = async () => {
    try {
      setIsLoadingClients(true)
      const response = await fetch('/api/admin/clients')
      
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        setFilteredClients(data)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive"
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  // Fetch unread notifications count
  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/admin/notifications?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }

  const updateClientClasses = async (clientId: string, packageId: string, newCount: number) => {
    if (newCount < 0) {
      toast({
        title: "Invalid Count",
        description: "Classes remaining cannot be negative",
        variant: "destructive"
      })
      return
    }

    try {
      setIsUpdatingClasses(true)
      const response = await fetch('/api/admin/clients/update-classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          packageId,
          classesRemaining: newCount
        })
      })

      if (response.ok) {
        toast({
          title: "Classes Updated",
          description: `Successfully updated remaining classes to ${newCount}`,
        })
        // Reload clients to show updated data
        loadClients()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update classes')
      }
    } catch (error) {
      console.error('Error updating client classes:', error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsUpdatingClasses(false)
    }
  }

  const openDateDialog = (client: Client) => {
    setEditExpirationDialog({
      isOpen: true,
      user: client,
      packageExpiry: client.packageExpiry || ""
    })
    setNewExpirationDate(client.package?.endDate ? new Date(client.package.endDate) : undefined)
  }



  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'general',
          settings: generalSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Your general settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save general settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateAllClassCapacities = async () => {
    try {
      const response = await fetch('/api/admin/update-class-capacities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Classes Updated",
          description: data.message,
        });
      } else {
        throw new Error(data.error || 'Failed to update class capacities');
      }
    } catch (error) {
      console.error('Error updating class capacities:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    }
  };

  const handleSaveNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'notifications',
          settings: notificationSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Settings updated",
          description: "Your notification settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePackageSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'packages',
          settings: packageSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Package settings updated",
          description: "Package prices and settings have been saved successfully.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save package settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateExpiration = async () => {
    if (!editExpirationDialog.user || !newExpirationDate) return

    try {
      setIsUpdatingClasses(true)
      const response = await fetch('/api/admin/clients/update-expiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: editExpirationDialog.user.id,
          packageId: editExpirationDialog.user.package?.id,
          newExpirationDate
        })
      })

      if (response.ok) {
        toast({
          title: "Expiration Date Updated",
          description: `Successfully updated expiration date to ${new Date(newExpirationDate).toLocaleDateString()}`,
        })
        // Refresh clients data
        loadClients()
      } else {
        throw new Error('Failed to update expiration date')
      }
    } catch (error) {
      console.error('Error updating expiration date:', error)
      toast({
        title: "Error",
        description: "Failed to update expiration date",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingClasses(false)
      setEditExpirationDialog({ isOpen: false, user: null, packageExpiry: "" })
      setNewExpirationDate(undefined)
    }
  }

  if (isLoading) {
    return <LoadingIndicator />
  }

  if (!user) {
    router.push("/login")
    return <LoadingIndicator />
  }

  if (user.role !== "admin") {
    router.push("/dashboard")
    return <LoadingIndicator />
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background image with overlay */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/dark-yoga-bg.jpg"
          alt="Background"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-black/90"></div>
      </div>
      
      {/* Desktop sidebar */}
      <AdminSidebar user={user} unreadNotifications={unreadNotifications} />
      
      {/* Mobile header */}
      <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} unreadNotifications={unreadNotifications} />

      <main className="lg:pl-64 min-h-screen">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="mt-1 text-muted-foreground text-white/60">
              Manage your studio settings and preferences.
            </p>
          </div>

          {isLoadingSettings ? (
            <LoadingIndicator />
          ) : (
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="bg-black/40 backdrop-blur-sm border border-white/10 p-1">
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="general"
                >
                  General
                </TabsTrigger>
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="notifications"
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="packages"
                >
                  Packages
                </TabsTrigger>
                <TabsTrigger 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-white data-[state=active]:shadow-none text-white/70" 
                  value="clients"
                >
                  Client Classes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Studio Information</CardTitle>
                    <CardDescription className="text-white/60">
                      Update your studio details and business information
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveGeneralSettings}>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="studioName" className="text-white/80">Studio Name</Label>
                        <Input
                          id="studioName"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          value={generalSettings.studioName}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, studioName: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="email" className="text-white/80">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-primary/80" />
                              Email
                            </div>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            value={generalSettings.email}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="phone" className="text-white/80">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-primary/80" />
                              Phone
                            </div>
                          </Label>
                          <Input
                            id="phone"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                            value={generalSettings.phone}
                            onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2 mt-2">
                        <Label htmlFor="address" className="text-white/80">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary/80" />
                            Address
                          </div>
                        </Label>
                        <Input
                          id="address"
                          className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                          value={generalSettings.address}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2 mt-4">
                        <Label htmlFor="cancelHours" className="text-white/80">
                          <div className="flex items-center gap-2">
                            <Clock4 className="h-4 w-4 text-primary/80" />
                            Cancellation Policy (Hours before class)
                          </div>
                        </Label>
                        <Select
                          value={generalSettings.cancelHours}
                          onValueChange={(value) =>
                            setGeneralSettings({ ...generalSettings, cancelHours: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select hours" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="4">4 hours</SelectItem>
                            <SelectItem value="8">8 hours</SelectItem>
                            <SelectItem value="12">12 hours</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Notification Preferences</CardTitle>
                    <CardDescription className="text-white/60">
                      Configure how and when to send notifications to clients
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveNotificationSettings}>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <Check className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="bookingConfirmations" className="text-white flex text-base font-medium">
                                Booking confirmations
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send emails when clients book classes</p>
                            </div>
                          </div>
                          <Switch
                            id="bookingConfirmations"
                            checked={notificationSettings.sendBookingConfirmations}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendBookingConfirmations: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <X className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="cancellationNotifications" className="text-white flex text-base font-medium">
                                Cancellation notifications
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send emails when clients cancel their bookings</p>
                            </div>
                          </div>
                          <Switch
                            id="cancellationNotifications"
                            checked={notificationSettings.sendCancellationNotifications}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendCancellationNotifications: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/20">
                              <AlertTriangle className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label htmlFor="renewalReminders" className="text-white flex text-base font-medium">
                                Package renewal reminders
                              </Label>
                              <p className="text-sm text-white/60 mt-0.5">Send reminders when packages are about to expire</p>
                            </div>
                          </div>
                          <Switch
                            id="renewalReminders"
                            checked={notificationSettings.sendRenewalReminders}
                            onCheckedChange={(checked) =>
                              setNotificationSettings({ ...notificationSettings, sendRenewalReminders: checked })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 pt-2 border-t border-white/10">
                        <Label htmlFor="reminderDays" className="text-white/80">Days before expiration to send reminder</Label>
                        <Select
                          value={notificationSettings.reminderDays}
                          onValueChange={(value) =>
                            setNotificationSettings({ ...notificationSettings, reminderDays: value })
                          }
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="10">10 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <Label htmlFor="clientEmails" className="text-white flex text-base font-medium">
                            Marketing emails
                          </Label>
                          <p className="text-sm text-white/60 mt-0.5">Allow clients to receive marketing and promotional emails</p>
                        </div>
                        <Switch
                          id="clientEmails"
                          checked={notificationSettings.allowClientEmails}
                          onCheckedChange={(checked) =>
                            setNotificationSettings({ ...notificationSettings, allowClientEmails: checked })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="packages">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Package Settings</CardTitle>
                    <CardDescription className="text-white/60">
                      Configure class packages and payment options
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSavePackageSettings}>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <div className="font-medium mb-2 text-white flex items-center">
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 mr-2">Plan A</Badge>
                            8 Classes Package
                          </div>
                          <div className="grid gap-2 mt-3">
                            <Label htmlFor="package8Price" className="text-white/80">Cash Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">€</span>
                              <Input
                                id="package8Price"
                                type="number"
                                min="1"
                                className="bg-white/5 border-white/10 text-white pl-7"
                                value={packageSettings.package8Price}
                                onChange={(e) => setPackageSettings({ ...packageSettings, package8Price: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                          <div className="font-medium mb-2 text-white flex items-center">
                            <Badge variant="outline" className="bg-primary/20 border-primary/30 mr-2">Plan B</Badge>
                            12 Classes Package
                          </div>
                          <div className="grid gap-2 mt-3">
                            <Label htmlFor="package12Price" className="text-white/80">Cash Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">€</span>
                              <Input
                                id="package12Price"
                                type="number"
                                min="1"
                                className="bg-white/5 border-white/10 text-white pl-7"
                                value={packageSettings.package12Price}
                                onChange={(e) => setPackageSettings({ ...packageSettings, package12Price: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid gap-2 p-4 rounded-lg border border-white/10 bg-white/5 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <Label htmlFor="packageDuration" className="text-white/90 text-base font-medium">Package Duration</Label>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            id="packageDuration"
                            type="number"
                            min="1"
                            max="90"
                            className="bg-white/5 border-white/10 text-white max-w-[120px]"
                            value={packageSettings.packageDuration}
                            onChange={(e) => setPackageSettings({ ...packageSettings, packageDuration: e.target.value })}
                          />
                          <span className="text-white/80">days</span>
                        </div>
                        <p className="text-sm text-white/60 mt-1">All packages expire after this number of days</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div>
                          <Label htmlFor="autoRenewal" className="text-white flex text-base font-medium">
                            Automatic package renewal
                          </Label>
                          <p className="text-sm text-white/60 mt-0.5">Allow clients to automatically renew their packages</p>
                        </div>
                        <Switch
                          id="autoRenewal"
                          checked={packageSettings.allowAutoRenewal}
                          onCheckedChange={(checked) =>
                            setPackageSettings({ ...packageSettings, allowAutoRenewal: checked })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 pt-6">
                      <Button 
                        type="submit" 
                        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Package Settings
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="clients">
                <Card className="border-white/10 bg-black/40 backdrop-blur-md text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Client Class Management</CardTitle>
                    <CardDescription className="text-white/60">
                      Adjust remaining classes for clients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Search bar */}
                    <div className="space-y-2">
                      <Label htmlFor="clientSearch" className="text-white/80">Search Clients</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-4 w-4" />
                        <Input
                          id="clientSearch"
                          placeholder="Search by name or email..."
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder-white/40"
                        />
                      </div>
                    </div>

                    {/* Refresh button */}
                    <div className="flex justify-between items-center">
                      <Button 
                        onClick={loadClients}
                        variant="outline"
                        className="bg-transparent border-white/20 text-white hover:bg-white/10"
                        disabled={isLoadingClients}
                      >
                        {isLoadingClients ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Clients
                          </>
                        )}
                      </Button>
                      <Badge variant="outline" className="border-white/30 text-white/70">
                        {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {/* Clients list */}
                    {isLoadingClients ? (
                      <div className="flex justify-center py-8">
                        <LoadingIndicator />
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
                        <p className="text-white/60">No clients found</p>
                        {clientSearchTerm && (
                          <p className="text-white/40 text-sm mt-2">Try a different search term</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {filteredClients.map((client) => (
                          <div key={client.id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-white">{client.name}</h3>
                                <p className="text-sm text-white/60">{client.email}</p>
                                
                                {client.package ? (
                                  <div className="mt-2 p-3 rounded border border-primary/20 bg-primary/5">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
                                        {client.package.name}
                                      </Badge>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-white/60">
                                          Expires: {new Date(client.package.endDate).toLocaleDateString()}
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openDateDialog(client)}
                                          className="h-6 px-2 bg-blue-500/20 border-blue-500/30 text-white hover:bg-blue-500/30"
                                        >
                                          <Calendar className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => updateClientClasses(client.id, client.package!.id, Math.max(0, client.package!.classesRemaining - 1))}
                                          disabled={isUpdatingClasses || client.package.classesRemaining <= 0}
                                          className="p-1 h-7 w-7 bg-red-500/20 border-red-500/30 text-white hover:bg-red-500/30"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        
                                        <div className="px-3 py-1 rounded bg-white/10 border border-white/20 min-w-[80px] text-center">
                                          <span className="text-white font-medium">
                                            {client.package.classesRemaining}
                                          </span>
                                          <span className="text-white/60 text-sm">
                                            /{client.package.totalClasses}
                                          </span>
                                        </div>
                                        
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => updateClientClasses(client.id, client.package!.id, client.package!.classesRemaining + 1)}
                                          disabled={isUpdatingClasses}
                                          className="p-1 h-7 w-7 bg-green-500/20 border-green-500/30 text-white hover:bg-green-500/30"
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      <div className="flex-1 mx-3">
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300" 
                                            style={{ 
                                              width: `${Math.min(100, (client.package.classesRemaining / client.package.totalClasses) * 100)}%` 
                                            }}
                                          ></div>
                                        </div>
                                        <p className="text-xs text-white/60 mt-1 text-center">
                                          {client.package.classesRemaining} classes remaining
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2 p-3 rounded border border-white/10 bg-white/5">
                                    <p className="text-white/60 text-sm">No active package</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredClients.length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-900/30 border border-blue-500/30">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-blue-500/20">
                            <AlertTriangle className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-200">Client Management Information</h4>
                            <p className="text-sm text-blue-200/80 mt-1">
                              Use the + and - buttons to adjust remaining classes for each client. 
                              Click the calendar icon to edit the membership expiration date. 
                              All changes are applied immediately and will affect their account.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Edit Expiration Date Dialog */}
          <AlertDialog open={editExpirationDialog.isOpen} onOpenChange={(open) => !open && setEditExpirationDialog({ isOpen: false, user: null, packageExpiry: "" })}>
            <AlertDialogContent className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md border-none rounded-none m-0 p-0">
              <div className="h-screen w-screen flex items-center justify-center p-8">
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/20 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                  
                  {/* Header */}
                  <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-white/10 p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center">
                          <Calendar className="h-10 w-10 text-amber-400" />
                </div>
                        <div>
                          <AlertDialogTitle className="text-4xl font-bold text-white mb-2">
                            Edit Expiration Date
                </AlertDialogTitle>
                          <AlertDialogDescription className="text-white/70 text-xl">
                            Update package expiration for {editExpirationDialog.user?.name}
                </AlertDialogDescription>
                        </div>
                      </div>
                      <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/20 text-white h-14 w-14 rounded-2xl p-0 transition-all">
                        <X className="h-7 w-7" />
                      </AlertDialogCancel>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      
                      {/* Left Side - Client Info */}
                      <div className="space-y-8">
                        
                        {/* Client Card */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8">
                          <h3 className="text-2xl font-bold text-white mb-6">Client Information</h3>
                          
                          <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                              <UserIcon className="w-10 h-10 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-2xl mb-1">{editExpirationDialog.user?.name}</p>
                              <p className="text-white/70 text-lg">{editExpirationDialog.user?.email}</p>
                            </div>
                          </div>

              <div className="space-y-4">
                            <div className="bg-white/10 rounded-xl p-6">
                              <div className="flex justify-between items-center">
                      <div>
                                  <p className="text-white/60 text-sm mb-1">Package Type</p>
                                  <p className="font-bold text-white text-xl">
                                    {editExpirationDialog.user?.package?.name || 'N/A'}
                                  </p>
                      </div>
                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                  <Building className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                            </div>
                            
                            <div className="bg-white/10 rounded-xl p-6">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-white/60 text-sm mb-1">Current Expiry</p>
                                  <p className="font-bold text-white text-xl">
                                    {editExpirationDialog.user?.packageExpiry ? 
                                      new Date(editExpirationDialog.user.packageExpiry).toLocaleDateString() : 'N/A'}
                                  </p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-base font-bold ${
                                  editExpirationDialog.user?.packageExpiry && new Date(editExpirationDialog.user.packageExpiry) > new Date()
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {editExpirationDialog.user?.packageExpiry && new Date(editExpirationDialog.user.packageExpiry) > new Date()
                                    ? '🟢 Active' : '🔴 Expired'}
                                </div>
                              </div>
                            </div>
                          </div>
                </div>

                        {/* Preview Card */}
                {newExpirationDate && (
                          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-8">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-16 h-16 bg-green-500/30 rounded-2xl flex items-center justify-center">
                                <Check className="w-8 h-8 text-green-400" />
                      </div>
                      <div>
                                <h4 className="text-xl font-bold text-green-400">New Expiration Preview</h4>
                                <p className="text-green-300/80">Updated package details</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-green-500/10 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-300/80 font-medium">New Date</span>
                                  <span className="font-bold text-green-300 text-lg">
                                    {newExpirationDate.toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="bg-green-500/10 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-300/80 font-medium">Days from today</span>
                                  <span className="font-bold text-green-300 text-lg">
                                    {Math.ceil((newExpirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                </div>
                              </div>
                              <div className="bg-green-500/10 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-green-300/80 font-medium">Day of week</span>
                                  <span className="font-bold text-green-300 text-lg">
                                    {newExpirationDate.toLocaleDateString('en-US', { weekday: 'long' })}
                                  </span>
                                </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                      {/* Right Side - Date Selection */}
                      <div className="space-y-8">
                        <h3 className="text-2xl font-bold text-white">Select New Expiration Date</h3>
                        
                        {/* Date Picker Card */}
                        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`w-full h-20 text-left font-normal bg-white/10 border-white/30 text-white hover:bg-white/20 text-xl rounded-2xl transition-all ${
                                  !newExpirationDate && "text-white/50"
                                }`}
                              >
                                <CalendarIcon className="mr-4 h-8 w-8" />
                                <div>
                                  <p className="text-sm text-white/60 mb-1">Selected Date</p>
                                  <p className="text-xl font-bold">
                                    {newExpirationDate ? (
                                      format(newExpirationDate, "PPP")
                                    ) : (
                                      "Pick a date"
                                    )}
                                  </p>
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-auto p-0 bg-gray-900 border border-white/20" 
                              align="start"
                            >
                              <CalendarComponent
                                mode="single"
                                selected={newExpirationDate}
                                onSelect={setNewExpirationDate}
                                disabled={(date: Date) => date < new Date()}
                                initialFocus
                                className="bg-gray-900 text-white border-0"
                              />
                            </PopoverContent>
                          </Popover>

                          {/* Quick Select Buttons */}
                          <div className="mt-8 space-y-4">
                            <p className="text-white/70 font-semibold text-lg">Quick select:</p>
                            <div className="grid grid-cols-2 gap-4">
                              <Button
                                onClick={() => {
                                  const date = new Date();
                                  date.setMonth(date.getMonth() + 1);
                                  setNewExpirationDate(date);
                                }}
                                variant="outline"
                                className="bg-white/5 border-white/30 text-white hover:bg-white/15 h-16 text-lg rounded-xl transition-all"
                              >
                                <div className="text-center">
                                  <p className="font-bold">+1 Month</p>
                                  <p className="text-sm text-white/60">30 days</p>
                                </div>
                              </Button>
                              <Button
                                onClick={() => {
                                  const date = new Date();
                                  date.setMonth(date.getMonth() + 3);
                                  setNewExpirationDate(date);
                                }}
                                variant="outline"
                                className="bg-white/5 border-white/30 text-white hover:bg-white/15 h-16 text-lg rounded-xl transition-all"
                              >
                                <div className="text-center">
                                  <p className="font-bold">+3 Months</p>
                                  <p className="text-sm text-white/60">90 days</p>
                                </div>
                              </Button>
                              <Button
                                onClick={() => {
                                  const date = new Date();
                                  date.setMonth(date.getMonth() + 6);
                                  setNewExpirationDate(date);
                                }}
                                variant="outline"
                                className="bg-white/5 border-white/30 text-white hover:bg-white/15 h-16 text-lg rounded-xl transition-all"
                              >
                                <div className="text-center">
                                  <p className="font-bold">+6 Months</p>
                                  <p className="text-sm text-white/60">180 days</p>
                                </div>
                              </Button>
                              <Button
                                onClick={() => {
                                  const date = new Date();
                                  date.setFullYear(date.getFullYear() + 1);
                                  setNewExpirationDate(date);
                                }}
                                variant="outline"
                                className="bg-white/5 border-white/30 text-white hover:bg-white/15 h-16 text-lg rounded-xl transition-all"
                              >
                                <div className="text-center">
                                  <p className="font-bold">+1 Year</p>
                                  <p className="text-sm text-white/60">365 days</p>
                                </div>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-t border-white/10 p-8">
                    <div className="flex justify-end gap-6">
                      <AlertDialogCancel className="bg-white/10 hover:bg-white/20 border-white/30 text-white px-10 py-4 text-xl rounded-xl transition-all">
                  Cancel
                </AlertDialogCancel>
                      <Button 
                        onClick={handleUpdateExpiration} 
                        disabled={!newExpirationDate}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-4 text-xl rounded-xl disabled:opacity-50 transition-all"
                      >
                        <Calendar className="h-6 w-6 mr-3" />
                        Update Expiration
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  )
}
