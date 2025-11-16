"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarDays, 
  Clock, 
  AlertTriangle,
  LayoutDashboard, 
  Settings, 
  Users,
  Plus,
  Search,
  Check,
  X,
  Filter,
  ArrowUpDown,
  MenuIcon,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  Eye,
  Calendar
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { AdminLayout } from '../components/AdminLayout'

// Remove the mock data and add a proper interface
interface Booking {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Class {
  id: string;
  name: string;
  day: string;
  time: string;
  date: string;
  description?: string;
  enabled: boolean;
  capacity: number;
  currentBookings: number;
  bookings: Booking[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading data...</h3>
    </div>
  </div>
);

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState("date")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isDeletingClass, setIsDeletingClass] = useState(false)
  const [isDeletingPastClasses, setIsDeletingPastClasses] = useState(false)
  const [classToDelete, setClassToDelete] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isManageBookingsOpen, setIsManageBookingsOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
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
      fetchClasses();
      fetchUsers();
      fetchNotificationCount();
    }
  }, [user, router])
  
  // Fetch real data from API
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      
      // Fetch classes from the API
      const response = await fetch('/api/admin/classes');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setClasses(data);
      setFilteredClasses(data);
      
      toast({
        title: "Classes loaded",
        description: `Loaded ${data.length} classes successfully`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes. Please try again.');
      
      toast({
        title: "Error loading classes",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
  };

  // Apply filters and sorting
  useEffect(() => {
    let results = [...classes];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(cls => 
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.day.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter === "active") {
      results = results.filter(cls => cls.enabled);
    } else if (selectedFilter === "inactive") {
      results = results.filter(cls => !cls.enabled);
    } else if (selectedFilter === "full") {
      results = results.filter(cls => cls.currentBookings >= cls.capacity);
    }
    
    // Apply sorting
    results.sort((a, b) => {
      if (sortKey === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortKey === "date") {
        return sortOrder === "asc" 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortKey === "capacity") {
        return sortOrder === "asc" 
          ? a.capacity - b.capacity
          : b.capacity - a.capacity;
      } else if (sortKey === "bookings") {
        return sortOrder === "asc" 
          ? a.currentBookings - b.currentBookings
          : b.currentBookings - a.currentBookings;
      }
      return 0;
    });
    
    setFilteredClasses(results);
  }, [classes, searchTerm, selectedFilter, sortKey, sortOrder]);

  const handleToggleClass = async (classId: string) => {
    try {
      // Find the class to toggle
      const classToToggle = classes.find(c => c.id === classId);
      if (!classToToggle) return;
      
      // Toggle the enabled status
      const updatedEnabled = !classToToggle.enabled;
      
      // Call API to update class
      const response = await fetch(`/api/admin/classes/${classId}/toggle-enabled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: updatedEnabled }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update local state after successful API call
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, enabled: updatedEnabled } : cls
      ));
      
      toast({
        title: `Class ${updatedEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Class has been ${updatedEnabled ? 'enabled' : 'disabled'} successfully`,
        variant: "success"
      });
    } catch (error: unknown) {
      console.error('Error toggling class:', error);
      setErrorMessage('Failed to update class. Please try again.');
      
      toast({
        title: "Error updating class",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone!")) {
      return;
    }
    
    try {
      setIsDeletingClass(true);
      
      // Call API to delete class
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Update local state after successful API call
      setClasses(classes.filter(cls => cls.id !== classId));
      
      toast({
        title: "Class Deleted",
        description: "The class has been deleted successfully",
        variant: "success"
      });
      
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    } catch (error: unknown) {
      console.error('Error deleting class:', error);
      
      toast({
        title: "Error deleting class",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleDeletePastClasses = async () => {
    if (!window.confirm("Are you sure you want to delete all past classes (older than 7 days)? This action cannot be undone!")) {
      return;
    }
    
    try {
      setIsDeletingPastClasses(true);
      
      const response = await fetch('/api/admin/classes/delete-past', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete past classes');
      }
      
      const data = await response.json();
      
      // Immediately remove deleted classes from frontend state
      if (data.deletedClassIds && data.deletedClassIds.length > 0) {
        setClasses(prevClasses => 
          prevClasses.filter(cls => !data.deletedClassIds.includes(cls.id))
        );
        setFilteredClasses(prevFilteredClasses => 
          prevFilteredClasses.filter(cls => !data.deletedClassIds.includes(cls.id))
        );
      }
      
      toast({
        title: "Success",
        description: data.deleted > 0 
          ? `Successfully deleted ${data.deleted} past classes`
          : "No past classes found to delete",
      });
    } catch (error: any) {
      console.error('Error deleting past classes:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to delete past classes",
        variant: "destructive"
      });
    } finally {
      setIsDeletingPastClasses(false);
    }
  };

  const handleSort = (key: string) => {
    setSortKey(key);
    setSortOrder(current => current === "asc" ? "desc" : "asc");
  };

  const handleToggleClassEnabled = async (classId: string, currentEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/classes/${classId}/toggle-enabled`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !currentEnabled
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: result.message,
          variant: "success"
        });
        fetchClasses(); // Refresh the classes data
      } else {
        const error = await response.json();
        toast({
          title: error.error || 'Failed to update class status',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling class enabled status:', error);
      toast({
        title: 'Failed to update class status',
        variant: "destructive"
      });
    }
  };

  const handleAddUserToClass = async () => {
    if (!selectedClass || !selectedUserId) return;

    try {
      const response = await fetch(`/api/admin/classes/${selectedClass.id}/add-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `User ${selectedClass.enabled ? 'added to' : 'pre-added to'} class successfully`,
          variant: "success"
        });
        setIsAddUserOpen(false);
        setSelectedUserId('');
        fetchClasses(); // Refresh the classes data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || 'Failed to add user to class',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding user to class:', error);
      toast({
        title: "Error",
        description: 'Failed to add user to class',
        variant: "destructive"
      });
    }
  };

  const handleRemoveUserFromClass = async (bookingId: string) => {
    if (!selectedClass) return;

    if (!confirm('Are you sure you want to remove this user from the class?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/classes/${selectedClass.id}/remove-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: 'User removed from class successfully',
          variant: "success"
        });
        fetchClasses(); // Refresh the classes data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || 'Failed to remove user from class',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing user from class:', error);
      toast({
        title: "Error",
        description: 'Failed to remove user from class',
        variant: "destructive"
      });
    }
  };

  const openManageBookings = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsManageBookingsOpen(true);
  };

  const openAddUser = (classItem: Class) => {
    setSelectedClass(classItem);
    setSelectedUserId('');
    setUserSearchTerm('');
    setIsAddUserOpen(true);
  };

  const availableUsers = users.filter(user => 
    !selectedClass?.bookings.some(booking => booking.userId === user.id)
  );

  // Filter available users based on search term
  const filteredAvailableUsers = userSearchTerm
    ? availableUsers.filter(user => 
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    : availableUsers;

  // Update the condition to render main content when user is confirmed
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
    <AdminLayout user={user} unreadNotifications={unreadNotifications}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Class Management</h1>
            <p className="text-gray-300">Manage class bookings and enable/disable classes</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleDeletePastClasses}
              variant="destructive"
              disabled={isDeletingPastClasses}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingPastClasses ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/20 border-r-transparent animate-spin"></div>
                  Deleting Past Classes...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Past Classes
                </span>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-medium text-gray-300">{classes.length} Total Classes</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search classes by name or day..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-white">{classItem.name}</CardTitle>
                    <p className="text-sm text-gray-300">{classItem.day} at {classItem.time}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(classItem.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={classItem.enabled ? "default" : "secondary"} className={classItem.enabled ? "bg-green-600" : ""}>
                    {classItem.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Bookings:</span>
                  <Badge variant="outline" className="border-white/30 text-gray-300">
                    {classItem.currentBookings}/{classItem.capacity}
                  </Badge>
                </div>

                {classItem.description && (
                  <p className="text-sm text-gray-400">{classItem.description}</p>
                )}

                <div className="flex flex-col gap-2">
                  {classItem.currentBookings > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openManageBookings(classItem)}
                      className="w-full border-white/30 text-gray-300 hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {classItem.enabled ? `View Bookings (${classItem.currentBookings})` : `View Pre-added Users (${classItem.currentBookings})`}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAddUser(classItem)}
                    className="w-full border-white/30 text-gray-300 hover:bg-white/10"
                    disabled={classItem.currentBookings >= classItem.capacity}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {classItem.enabled ? "Add User" : "Pre-add User"}
                  </Button>

                  <Button
                    size="sm"
                    variant={classItem.enabled ? "destructive" : "default"}
                    onClick={() => handleToggleClassEnabled(classItem.id, classItem.enabled)}
                    className="w-full"
                  >
                    {classItem.enabled ? (
                      <>
                        <Settings className="h-4 w-4 mr-1" />
                        Disable Class
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1" />
                        Enable & Send Emails
                      </>
                    )}
                  </Button>

                  {/* Delete button for past classes */}
                  {new Date(classItem.date) < new Date() && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isDeletingClass}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Class
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manage Bookings Dialog */}
        <Dialog open={isManageBookingsOpen} onOpenChange={setIsManageBookingsOpen}>
          <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedClass?.enabled ? "Manage Bookings" : "Pre-populated Users"}: {selectedClass?.name} - {selectedClass?.day} at {selectedClass?.time}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedClass?.enabled 
                  ? "These users are confirmed and have received booking emails."
                  : "These users are pre-added. They'll receive emails when you enable the class."
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Current Bookings</h4>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {selectedClass?.currentBookings}/{selectedClass?.capacity}
                </Badge>
              </div>

              {selectedClass?.bookings && selectedClass.bookings.length > 0 ? (
                <div className="space-y-2">
                  {selectedClass.bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg bg-gray-800">
                      <div>
                        <p className="font-medium text-white">{booking.user.name}</p>
                        <p className="text-sm text-gray-400">{booking.user.email}</p>
                        <p className="text-xs text-gray-500">
                          Booked: {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveUserFromClass(booking.id)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No bookings yet</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsManageBookingsOpen(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
              <Button onClick={() => openAddUser(selectedClass!)}>
                <UserPlus className="h-4 w-4 mr-1" />
                {selectedClass?.enabled ? "Add User" : "Pre-add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <AlertDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <AlertDialogContent className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md border-none rounded-none m-0 p-0">
            <div className="h-screen w-screen flex items-center justify-center p-8">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-white/20 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-white/10 p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
                        <UserPlus className="h-10 w-10 text-primary" />
              </div>
                      <div>
                        <AlertDialogTitle className="text-4xl font-bold text-white mb-2">
                {selectedClass?.enabled ? "Add User to Class" : "Pre-populate Class"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/70 text-xl">
                {selectedClass?.enabled 
                            ? "Adding a user will send them a booking confirmation email."
                            : "Pre-add users without sending emails until class is enabled."
                          }
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
                    
                    {/* Left Side - Class Info & Status */}
                    <div className="space-y-8">
                      
                      {/* Class Card */}
                      <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-white">Class Information</h3>
                          <div className={`px-4 py-2 rounded-full text-base font-semibold ${
                            selectedClass?.enabled 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {selectedClass?.enabled ? '🟢 Active' : '🟡 Pre-populate'}
                          </div>
              </div>

                        <h4 className="text-3xl font-bold text-white mb-6">{selectedClass?.name}</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <CalendarDays className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Day</p>
                            <p className="text-white font-semibold text-lg">{selectedClass?.day}</p>
                          </div>
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Time</p>
                            <p className="text-white font-semibold text-lg">{selectedClass?.time}</p>
                          </div>
                          <div className="bg-white/10 rounded-xl p-4 text-center">
                            <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                            <p className="text-white/60 text-sm">Date</p>
                            <p className="text-white font-semibold text-lg">
                              {selectedClass?.date && new Date(selectedClass.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Selected User Card */}
                      {selectedUserId && (
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-8">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-green-500/30 rounded-2xl flex items-center justify-center">
                              <Check className="w-8 h-8 text-green-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-green-400">Selected User</h3>
                              <p className="text-green-300/80">Ready to add to class</p>
                            </div>
                          </div>
                          <div className="bg-green-500/10 rounded-xl p-4">
                            <p className="font-bold text-white text-xl mb-1">
                              {filteredAvailableUsers.find(u => u.id === selectedUserId)?.name}
                            </p>
                            <p className="text-green-300">
                              {filteredAvailableUsers.find(u => u.id === selectedUserId)?.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                
                    {/* Right Side - User Selection */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-white">Select User to Add</h3>
                      
                      {/* Search Bar */}
                <div className="relative">
                        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/50 h-6 w-6" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-14 bg-white/10 border-white/30 text-white placeholder-white/50 h-16 text-xl rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                      {/* User List */}
                      <div className="bg-white/5 border border-white/20 rounded-2xl overflow-hidden">
                        <div className="h-96 overflow-y-auto">
                  {filteredAvailableUsers.length > 0 ? (
                            <div className="p-4 space-y-3">
                      {filteredAvailableUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedUserId(user.id)}
                                  className={`p-5 rounded-xl cursor-pointer transition-all duration-300 ${
                            selectedUserId === user.id
                                      ? 'bg-primary/20 border-2 border-primary/50 shadow-lg transform scale-[1.02]'
                                      : 'hover:bg-white/10 border-2 border-transparent hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                                      <p className="font-bold text-white text-xl">{user.name}</p>
                                      <p className="text-white/70 text-lg">{user.email}</p>
                            </div>
                            {selectedUserId === user.id && (
                                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                        <Check className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                          ) : (
                            <div className="flex items-center justify-center h-full p-12">
                              <div className="text-center">
                                {userSearchTerm ? (
                                  <>
                                    <Search className="h-20 w-20 text-white/40 mx-auto mb-6" />
                                    <p className="text-white/70 text-2xl font-semibold">No users found</p>
                                    <p className="text-white/50 text-lg">Try a different search term</p>
                                  </>
                                ) : (
                                  <>
                                    <Users className="h-20 w-20 text-white/40 mx-auto mb-6" />
                                    <p className="text-white/70 text-2xl font-semibold">No available users</p>
                                    <p className="text-white/50 text-lg">All users are already in this class</p>
                                  </>
                                )}
                    </div>
                    </div>
                  )}
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
                      onClick={handleAddUserToClass} 
                      disabled={!selectedUserId || availableUsers.length === 0}
                      className="bg-primary hover:bg-primary/90 text-white px-10 py-4 text-xl rounded-xl disabled:opacity-50 transition-all"
                    >
                      <Plus className="h-6 w-6 mr-3" />
                      {selectedClass?.enabled ? "Add User" : "Pre-add User"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {filteredClasses.length === 0 && (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No classes found</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No classes have been created yet.'}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
