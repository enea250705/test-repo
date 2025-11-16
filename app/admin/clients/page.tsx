"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
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
  Filter,
  ArrowUpDown,
  MenuIcon,
  Mail,
  Tag,
  Calendar,
  User,
  Plus,
  Edit,
  Package,
  Save,
  RotateCcw
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AdminSidebar, MobileHeader, MobileMenu } from "../components/AdminLayout"
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

// Remove the mockClients array
// Instead define proper interfaces
interface ClientPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  daysRemaining: number;
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  package?: ClientPackage;
  status?: "active" | "warning" | "expired";
  joinDate?: string;
  totalBookings?: number;
  nextClass?: string;
  packages: ClientPackage[];
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

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [clientForReminder, setClientForReminder] = useState<Client | null>(null)
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState("cards")
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Background image selection for better visual appeal
  const bgImage = "/images/gymxam4.webp" // Use a high-quality background

  // Handle auth redirects with useEffect
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/dashboard");
    } else if (user && user.role === "admin") {
      // Load data
      fetchClients();
      fetchNotificationCount();
    }
  }, [user, router])
  
  // Real data fetch function that calls the API
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data from the API
      const response = await fetch('/api/admin/clients', {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      console.log('Fetched clients:', data);
      
      // Process the client data to add status field
      const processedClients = data.map((client: any) => {
        let status = "active";
        
        if (!client.package) {
          status = "expired";
        } else if (client.package.daysRemaining <= 7) {
          status = "warning";
        }
        
        return {
          ...client,
          status,
          joinDate: new Date().toLocaleDateString(), // This would come from the API in a real implementation
          totalBookings: Math.floor(Math.random() * 50) // This would come from the API in a real implementation
        };
      });
      
      setClients(processedClients);
      setFilteredClients(processedClients);
      
      toast({
        title: "Clients loaded",
        description: `Loaded ${processedClients.length} clients successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      setErrorMessage('Failed to load clients. Please try again.');
      
      toast({
        title: "Error loading clients",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch unread notifications count
  const fetchNotificationCount = async () => {
    try {
      console.log('fetchNotificationCount called');
      const response = await fetch('/api/admin/notifications?unreadOnly=true');
      if (response.ok) {
        const data = await response.json();
        console.log('fetchNotificationCount response:', data);
        setUnreadNotifications(data.unreadCount);
        console.log('setUnreadNotifications to:', data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  // Apply filters and sorting
  useEffect(() => {
    let results = [...clients];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter === "active") {
      results = results.filter(client => client.status === "active");
    } else if (selectedFilter === "warning") {
      results = results.filter(client => client.status === "warning");
    } else if (selectedFilter === "expired") {
      results = results.filter(client => client.status === "expired");
    } else if (selectedFilter === "nopackage") {
      results = results.filter(client => !client.package);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortKey === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortKey === "joinDate") {
        return sortOrder === "asc" 
          ? new Date(a.joinDate || "").getTime() - new Date(b.joinDate || "").getTime()
          : new Date(b.joinDate || "").getTime() - new Date(a.joinDate || "").getTime();
      } else if (sortKey === "bookings") {
        return sortOrder === "asc" 
          ? (a.totalBookings || 0) - (b.totalBookings || 0)
          : (b.totalBookings || 0) - (a.totalBookings || 0);
      }
      return 0;
    });
    
    setFilteredClients(results);
  }, [clients, searchTerm, selectedFilter, sortKey, sortOrder]);

  const handleSendReminder = async (clientId: string) => {
    try {
      setIsSendingReminder(true);
      
      // Use the real API endpoint
      const response = await fetch(`/api/admin/clients/${clientId}/remind`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      
      toast({
        title: "Reminder Sent",
        description: "The client has been notified about their membership",
        variant: "success"
      });
      
      setIsReminderDialogOpen(false);
    } catch (error) {
      console.error('Error sending reminder:', error);
      
      toast({
        title: "Error sending reminder",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleAssignPackage = async (clientId: string, packageType: string) => {
    try {
      toast({
        title: "Assigning Package",
        description: "Please wait...",
        variant: "default"
      });
      
      const response = await fetch(`/api/admin/clients/${clientId}/assign-package`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign package');
      }
      
      const data = await response.json();
      console.log('Package assigned:', data);
      
      toast({
        title: "Package Assigned",
        description: data.message || "Package has been assigned successfully",
        variant: "success"
      });
      
      // Refresh clients list to show the new package
      fetchClients();
    } catch (error: any) {
      console.error('Error assigning package:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to assign package",
        variant: "destructive"
      });
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    newClassesRemaining: 0,
    reason: ''
  });

  // Package assignment form
  const [packageForm, setPackageForm] = useState({
    packageType: '',
    totalClasses: 8,
    duration: 30
  });

  const handleAdjustClasses = async () => {
    if (!selectedClient) return;

    const activePackage = selectedClient.packages.find(pkg => pkg.active);
    if (!activePackage) {
      toast({
        title: "Error",
        description: "No active package found for this client",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${selectedClient.id}/adjust-classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: activePackage.id,
          newClassesRemaining: adjustmentData.newClassesRemaining,
          reason: adjustmentData.reason
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Classes adjusted successfully",
          variant: "default"
        });
        setIsAdjustDialogOpen(false);
        fetchClients();
        setAdjustmentData({ newClassesRemaining: 0, reason: '' });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to adjust classes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adjusting classes:', error);
      toast({
        title: "Error",
        description: "Failed to adjust classes",
        variant: "destructive"
      });
    }
  };

  const openAdjustDialog = (client: Client) => {
    const activePackage = client.packages.find(pkg => pkg.active);
    if (activePackage) {
      setSelectedClient(client);
      setAdjustmentData({
        newClassesRemaining: activePackage.classesRemaining,
        reason: ''
      });
      setIsAdjustDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "No active package found for this client",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <LoadingIndicator />
      </div>
    );
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
    );
  }

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        {/* Optimized background image with next/image */}
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
        <AdminSidebar user={user} unreadNotifications={unreadNotifications} />
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} unreadNotifications={unreadNotifications} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Page header */}
          <div className="text-center mb-12 animate-in">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">Client Management</h1>
            <p className="text-white/70 max-w-xl mx-auto">View and manage client information, memberships and activity</p>
          </div>

          {/* Add this button near the top of the page content, after the page header */}
          <div className="flex justify-center gap-3 mb-6">
            <Button
              onClick={fetchClients}
              variant="outline"
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Refresh Clients
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/admin-clients?t=' + new Date().getTime(), {
                    headers: {
                      'Cache-Control': 'no-cache'
                    }
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to fetch debug data');
                  }
                  
                  const data = await response.json();
                  console.log('Client debug data:', data);
                  
                  toast({
                    title: "Debug Client Data",
                    description: `Found ${data.clientCount} clients with packages`,
                    variant: "default"
                  });
                  
                  // Refresh clients
                  fetchClients();
                } catch (error) {
                  console.error('Error fetching client debug data:', error);
                  toast({
                    title: "Error",
                    description: "Failed to fetch client debug data",
                    variant: "destructive"
                  });
                }
              }}
              variant="outline"
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Debug Client Packages
            </Button>
          </div>

          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
              {/* Search and filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative sm:col-span-2">
              <Input
                    type="text"
                    placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/30 border-white/10 text-white pl-10 h-11"
              />
                  <Search className="absolute left-3 top-3 h-5 w-5 text-white/50" />
            </div>
                
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-white h-11">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
                    <SelectItem value="all">All Clients</SelectItem>
                    <SelectItem value="active">Active Members</SelectItem>
                    <SelectItem value="warning">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired Memberships</SelectItem>
                    <SelectItem value="nopackage">No Active Package</SelectItem>
                  </SelectContent>
                </Select>
          </div>

              {/* View mode toggle */}
              <div className="flex justify-end">
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                  <TabsList className="bg-black/50 border border-white/10 grid w-[200px] grid-cols-2">
                    <TabsTrigger value="cards" className="data-[state=active]:bg-white data-[state=active]:text-black">
                      Card View
                    </TabsTrigger>
                    <TabsTrigger value="table" className="data-[state=active]:bg-white data-[state=active]:text-black">
                      Table View
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Clients list with view modes */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                <CardHeader className="border-b border-white/10 bg-black/30">
                  <CardTitle className="text-xl text-white">Client List</CardTitle>
                  <CardDescription className="text-white/70">
                    {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} {searchTerm ? "matching search" : "total"}
                  </CardDescription>
                </CardHeader>
                
                {viewMode === "cards" ? (
                  <div className="p-6">
            {filteredClients.length === 0 ? (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-white/60" />
                        </div>
                        <h3 className="font-medium text-white text-lg">No clients found</h3>
                        <p className="text-white/70 mt-2 max-w-xs mx-auto">
                          {searchTerm ? 
                            `No clients match "${searchTerm}". Try a different search term.` : 
                            'No clients match the selected filters.'}
                        </p>
                        {searchTerm && (
                          <Button 
                            variant="outline" 
                            onClick={() => setSearchTerm("")} 
                            className="mt-4 bg-transparent border border-white/20 text-white hover:bg-white/10"
                          >
                            Clear Search
                          </Button>
                        )}
              </div>
            ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredClients.map((client) => (
                          <Card key={client.id} className="bg-black/30 border-white/10 hover:border-white/20 transition-all group overflow-hidden">
                            <CardContent className="p-6 relative">
                              <div className="flex items-start justify-between">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-12 w-12">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                                      <h3 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{client.name}</h3>
                                      <div className="flex items-center text-white/70">
                                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                                        <span className="text-sm">{client.email}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-white/70">
                                    <div className="flex items-center">
                                      <Calendar className="mr-1.5 h-4 w-4" />
                                      <span>Joined {client.joinDate}</span>
                                    </div>
                                  </div>
                                  
                                  {client.nextClass && (
                                    <div className="flex items-start gap-1.5 text-sm">
                                      <Clock className="h-4 w-4 mt-0.5 text-white/70" />
                                      <div>
                                        <span className="text-white/70">Next class: </span>
                                        <span className="text-white">{client.nextClass}</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {client.package ? (
                                    <div className="mt-3 bg-primary/10 rounded-lg p-3 border border-primary/20">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                                          {client.package.name}
                                        </Badge>
                                        <span className="text-sm text-white/70">
                                          {client.package.daysRemaining} days left
                                        </span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-white/70">Classes Remaining</span>
                                          <span className="font-medium text-white">{client.package.classesRemaining} / {client.package.totalClasses}</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                                            style={{ width: `${(client.package.classesRemaining / client.package.totalClasses) * 100}%` }}
                                          ></div>
                                        </div>
                                        <div className="text-xs text-white/60 mt-1">
                                          Package ID: {client.package.id.substring(0, 8)}...
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-3 bg-amber-900/30 backdrop-blur-md rounded-lg p-3 border border-amber-500/30">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="bg-amber-500/20 text-white border-amber-500/30">
                                          No Active Package
                                        </Badge>
                                      </div>
                                      <div className="flex space-x-2 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAssignPackage(client.id, "standard")}
                                          className="text-xs h-8 bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30"
                                        >
                                          Assign Standard
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAssignPackage(client.id, "premium")}
                                          className="text-xs h-8 bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30"
                                        >
                                          Assign Premium
                                        </Button>
                          </div>
                        </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end gap-3">
                                  {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setClientForReminder(client);
                                              setIsReminderDialogOpen(true);
                                            }}
                                            className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 flex items-center gap-2"
                                          >
                                            <Bell className="h-4 w-4" />
                                            Remind
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Send reminder about expiring membership</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  
                                  <div className="flex items-center gap-2">
                                    <Link 
                                      href={`/admin/clients/${encodeURIComponent(client.id)}/bookings`}
                                      className="text-xs bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded text-white border border-primary/30 transition-colors"
                                    >
                                      View Bookings
                                    </Link>
                                  </div>
                                </div>
                        </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    {filteredClients.length === 0 ? (
                      <div className="text-center p-10">
                        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-white/60" />
                        </div>
                        <h3 className="font-medium text-white text-lg">No clients found</h3>
                        <p className="text-white/70 mt-2 max-w-xs mx-auto">
                          {searchTerm ? 
                            `No clients match "${searchTerm}". Try a different search term.` : 
                            'No clients match the selected filters.'}
                        </p>
                        {searchTerm && (
                          <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")} 
                            className="mt-4 bg-transparent border border-white/20 text-white hover:bg-white/10"
                          >
                            Clear Search
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-white">
                          <thead className="bg-black/40 border-b border-white/10">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium">
                                <button 
                                  onClick={() => handleSort("name")}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Client Name
                                  <ArrowUpDown className="h-3 w-3" />
                                </button>
                              </th>
                              <th className="text-left py-3 px-4 font-medium">Email</th>
                              <th className="text-left py-3 px-4 font-medium">Membership</th>
                              <th className="text-left py-3 px-4 font-medium">
                                <button 
                                  onClick={() => handleSort("joinDate")}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  Joined
                                  <ArrowUpDown className="h-3 w-3" />
                                </button>
                              </th>
                              <th className="text-left py-3 px-4 font-medium">Status</th>
                              <th className="text-right py-3 px-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClients.map((client) => (
                              <tr key={client.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-8 w-8">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{client.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-white/80">{client.email}</td>
                                <td className="py-3 px-4">
                                  {client.package ? (
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        client.status === "warning" 
                                          ? "bg-yellow-500/20 text-white border-yellow-500/30"
                                          : client.status === "expired"
                                            ? "bg-red-500/20 text-white border-red-500/30"
                                            : "bg-primary/20 text-white border-primary/30"
                                      }
                                    >
                                      {client.package.name.split(":")[0]}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-500/20 text-white border-amber-500/30">
                                      No Package
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-white/60" />
                                    <span className="text-white/80">{client.joinDate}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  {client.status === "active" ? (
                                    <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                                      Active
                                    </Badge>
                                  ) : client.status === "warning" ? (
                                    <Badge variant="outline" className="bg-yellow-500/20 text-white border-yellow-500/30">
                                      Expiring Soon
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-red-500/20 text-white border-red-500/30">
                                      Expired
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setClientForReminder(client);
                                                setIsReminderDialogOpen(true);
                                              }}
                                              className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 h-8 px-2"
                                            >
                                              <Bell className="h-3.5 w-3.5" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Send reminder about expiring membership</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                    
                                    <Link 
                                      href={`/admin/clients/${encodeURIComponent(client.id)}/bookings`}
                                      className="text-xs bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded text-white border border-primary/30 transition-colors"
                                    >
                                      View Bookings
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
      
      {/* Reminder dialog for client reminders */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="bg-black/80 backdrop-blur-lg border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Send Membership Reminder</DialogTitle>
            <DialogDescription className="text-white/70">
              Send a reminder email about the client's membership expiration
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {clientForReminder && (
              <div className="p-4 border border-white/10 rounded-md bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="border-2 border-white/20 h-10 w-10">
                    <AvatarFallback className="bg-primary/30 text-white">{clientForReminder.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-white">{clientForReminder.name}</h4>
                    <p className="text-sm text-white/70">{clientForReminder.email}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Membership:</span>
                    <span className="text-white">{clientForReminder.package?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Expires in:</span>
                    <span className="text-white">{clientForReminder.package?.daysRemaining} days</span>
                  </div>
                  {clientForReminder.package?.totalClasses && (
                    <div className="flex justify-between">
                      <span className="text-white/70">Classes Remaining:</span>
                      <span className="text-white">
                        {clientForReminder.package.classesRemaining} / {clientForReminder.package.totalClasses}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsReminderDialogOpen(false)}
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => clientForReminder && handleSendReminder(clientForReminder.id)}
              disabled={isSendingReminder}
              className="bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50"
            >
              {isSendingReminder ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-r-transparent animate-spin"></div>
                  Sending...
                </span>
              ) : (
                "Send Reminder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Package Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Package to {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="packageType">Package Type</Label>
              <Select
                value={packageForm.packageType}
                onValueChange={(value) => setPackageForm(prev => ({ ...prev, packageType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8-class">8-Class Package</SelectItem>
                  <SelectItem value="12-class">12-Class Package</SelectItem>
                  <SelectItem value="unlimited">Unlimited Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="totalClasses">Total Classes</Label>
              <Input
                id="totalClasses"
                type="number"
                value={packageForm.totalClasses}
                onChange={(e) => setPackageForm(prev => ({ ...prev, totalClasses: parseInt(e.target.value) }))}
                min="1"
              />
            </div>

            <div>
              <Label>Duration</Label>
              <div className="text-sm text-white/80">30 days (fixed)</div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleAssignPackage(selectedClient?.id || '', packageForm.packageType)}>
              Assign Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Classes Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Classes for {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClient && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Current Package Info:</h4>
                {(() => {
                  const activePackage = selectedClient.packages.find(pkg => pkg.active);
                  return activePackage ? (
                    <div className="text-sm space-y-1">
                      <p><strong>Package:</strong> {activePackage.totalClasses}-Class Package</p>
                      <p><strong>Current Remaining:</strong> {activePackage.classesRemaining} classes</p>
                      <p><strong>Expires in:</strong> {activePackage.daysRemaining} days</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No active package found</p>
                  );
                })()}
              </div>
            )}

            <div>
              <Label htmlFor="newClassesRemaining">New Classes Remaining</Label>
              <Input
                id="newClassesRemaining"
                type="number"
                value={adjustmentData.newClassesRemaining}
                onChange={(e) => setAdjustmentData(prev => ({ 
                  ...prev, 
                  newClassesRemaining: parseInt(e.target.value) || 0 
                }))}
                min="0"
                placeholder="Enter new number of remaining classes"
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason for Adjustment</Label>
              <Textarea
                id="reason"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for this adjustment (optional)"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will update the client's remaining classes immediately. 
                The change will be reflected in their account right away.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustClasses}>
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
