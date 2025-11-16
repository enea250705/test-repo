"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CalendarDays, 
  Clock, 
  Bell, 
  LayoutDashboard, 
  Settings, 
  Users,
  BookOpen,
  Plus,
  AlertTriangle,
  MenuIcon,
  X,
  Mail,
  Calendar,
  User,
  RefreshCw,
  Trash2,
  CheckCircleIcon,
  XCircleIcon,
  Edit3,
  Check,
  Package,
  CreditCard,
  Star,
  ChevronDown,
  ChevronUp,
  ChevronRight
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import { AdminSidebar, MobileHeader, MobileMenu } from "./components/AdminLayout"

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading CrossFit data...</h3>
    </div>
  </div>
);

// Define TypeScript interfaces for our data
interface ClassItem {
  id: string;
  name: string;
  day: string;
  date: string;
  time: string;
  capacity: number;
  currentBookings: number;
  enabled: boolean;
}

interface ClientItem {
  id: string;
  name: string;
  email: string;
  package?: {
    id: string;
    name: string;
    daysRemaining: number;
    classesRemaining: number;
    totalClasses: number;
  };
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}


export default function AdminDashboardPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [clients, setClients] = useState<ClientItem[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week') // Default to week view
  const [scheduleStatus, setScheduleStatus] = useState<{
    isLoading: boolean;
    classCount: number;
    message: string;
  }>({
    isLoading: false,
    classCount: 0,
    message: ""
  });
  const [newClass, setNewClass] = useState({
    name: "",
    day: "",
    time: "",
    date: "",
    capacity: "5",
    timeHour: "7",
    timeMinute: "00",
    timePeriod: "AM"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingClass, setIsCreatingClass] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDeletingPastClasses, setIsDeletingPastClasses] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Background image selection for better visual appeal
  const bgImage = "/images/gymxam4.webp" // Use a high-quality background

  // Handle auth redirects with useEffect
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    } else {
      // Fetch data for the dashboard once we know user is an admin
      Promise.all([
        fetchClasses(),
        fetchClients(),
        fetchPendingUsers(),
        fetchNotificationCount(),
        checkScheduleStatus()
      ]).then(() => {
        setIsLoading(false);
      }).catch(error => {
        console.error("Error fetching dashboard data:", error);
        setIsLoading(false);
      });
    }
  }, [user, router]);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      // Add timestamp to force bypass cache
      const response = await fetch('/api/classes?t=' + new Date().getTime(), {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      
      const data = await response.json();
      console.log('Fetched classes:', data); // Log classes for debugging
      setClasses(data);

      toast({
        title: "Classes loaded",
        description: `Loaded ${data.length} classes successfully`,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes. Please try again.');
      
      toast({
        title: "Error loading classes",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clients with their packages
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/admin/clients');
      
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const data = await response.json();
      setClients(data);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      
      toast({
        title: "Error loading clients",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Fetch pending users who need approval
  const fetchPendingUsers = async () => {
    try {
      const response = await fetch('/api/admin/pending-users');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pending users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Fetched pending users:", data);
      setPendingUsers(data);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive",
      });
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
  }


  const handleToggleClass = async (classId: string) => {
    try {
      // Find the class to toggle
      const classToToggle = classes.find(c => c.id === classId);
      if (!classToToggle) return;
      
      // Toggle the enabled status
      const updatedEnabled = !classToToggle.enabled;
      
      // Update the class in the database
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: updatedEnabled }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update class');
      }
      
      // Update local state
      setClasses(classes.map(cls => 
        cls.id === classId ? { ...cls, enabled: updatedEnabled } : cls
      ));
      
      toast({
        title: `Class ${updatedEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Class has been ${updatedEnabled ? 'enabled' : 'disabled'} successfully`,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error toggling class:', error);
      setErrorMessage('Failed to update class. Please try again.');
      
      toast({
        title: "Error updating class",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleSendReminder = async (clientId: string) => {
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/remind`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      
      toast({
        title: "Reminder Sent",
        description: "The reminder has been sent successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      
      toast({
        title: "Error sending reminder",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreatingClass(true);
      setErrorMessage("");
      
      // Validate inputs
      if (!newClass.name || !newClass.date) {
        setErrorMessage("Please fill in all required fields");
        setIsCreatingClass(false);
        return;
      }
      
      // Format the day of week from the date
      const dateObj = new Date(newClass.date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[dateObj.getDay()];
      
      // Format time properly
      const formattedTime = `${newClass.timeHour}:${newClass.timeMinute} ${newClass.timePeriod}`;
      
      console.log("Creating class with data:", {
        name: newClass.name,
        day,
        time: formattedTime,
        date: newClass.date,
        capacity: parseInt(newClass.capacity, 10)
      });
      
      // Get auth token from cookie or localStorage
      const authToken = document.cookie.split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1] || localStorage.getItem('auth_token');
      
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: newClass.name,
          day: day,
          time: formattedTime,
          date: newClass.date,
          capacity: parseInt(newClass.capacity, 10)
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create class');
      }
      
      console.log("New class created:", responseData);
      
      toast({
        title: "Class Created",
        description: "The new class has been created successfully",
        variant: "success"
      });

    // Reset form
    setNewClass({
      name: "",
      day: "",
      time: "",
      date: "",
        capacity: "5",
        timeHour: "7",
        timeMinute: "00",
        timePeriod: "AM"
      });
      
      // Wait a moment then refresh classes list to include the new class
      setTimeout(() => {
        fetchClasses();
      }, 500);
      
    } catch (error: any) {
      console.error('Error creating class:', error);
      setErrorMessage(error.message);
      
      toast({
        title: "Error creating class",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Handle purchasing/renewing packages
  const handlePurchasePackage = async (packageType: string) => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to purchase package');
      }
      
      const data = await response.json();
      console.log('Package purchased:', data);
      
      toast({
        title: "Package Purchased",
        description: "Package has been purchased successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      setErrorMessage(error.message || 'An error occurred');
      
      toast({
        title: "Error purchasing package",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  // Handle approving a user
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/pending-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to approve user: ${response.status}`);
      }
      
      // Remove the approved user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      toast({
        title: "Success",
        description: "User has been approved successfully",
      });
    } catch (error) {
      console.error("Error approving user:", error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive",
      });
    }
  };

  // Handle declining a user
  const handleDeclineUser = async (userId: string) => {
    if (!confirm('Are you sure you want to decline this user? This action cannot be undone and will permanently delete their account.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/pending-users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to decline user: ${response.status}`);
      }
      
      // Remove the declined user from the list
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      toast({
        title: "User Declined",
        description: "User has been declined and their account deleted",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error declining user:", error);
      toast({
        title: "Error",
        description: "Failed to decline user",
        variant: "destructive",
      });
    }
  };

  // Check the status of the year-long schedule
  const checkScheduleStatus = async () => {
    try {
      setScheduleStatus(prev => ({ ...prev, isLoading: true }));
      
      // Count total classes
      const response = await fetch('/api/classes?count=true');
      
      if (!response.ok) {
        throw new Error('Failed to check schedule status');
      }
      
      const data = await response.json();
      
      // Calculate approximate number of classes in a year schedule
      // ~17 classes per week × 5 days × 52 weeks = ~4420 classes
      const approximateYearlyClasses = 17 * 5 * 52;
      const hasYearSchedule = data.count > approximateYearlyClasses * 0.8; // 80% of expected
      
      setScheduleStatus({
        isLoading: false,
        classCount: data.count,
        message: hasYearSchedule 
          ? "Year-long schedule is already generated" 
          : "Year-long schedule not detected"
      });
      
    } catch (error: any) {
      console.error('Error checking schedule status:', error);
      setScheduleStatus({
        isLoading: false,
        classCount: 0,
        message: "Error checking schedule status"
      });
    }
  };

  // Generate the year-long schedule
  const generateYearSchedule = async () => {
    try {
      setScheduleStatus(prev => ({ ...prev, isLoading: true, message: "Generating schedule..." }));
      
      const response = await fetch('/api/admin/classes/generate-default-schedule', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate schedule');
      }
      
      const data = await response.json();
      
      toast({
        title: "Schedule Generated",
        description: `Successfully created ${data.totalClassesCreated} classes for a year`,
      });
      
      setScheduleStatus({
        isLoading: false,
        classCount: data.totalClassesCreated,
        message: "Year-long schedule has been generated"
      });
      
      // Refresh classes
      fetchClasses();
      
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate schedule",
        variant: "destructive"
      });
      
      setScheduleStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        message: `Error: ${error.message}` 
      }));
    }
  };

  // Reset all classes
  const resetAllClasses = async () => {
    if (!window.confirm("Are you sure you want to delete ALL classes? This cannot be undone!")) {
      return;
    }
    
    try {
      setScheduleStatus(prev => ({ ...prev, isLoading: true, message: "Deleting all classes..." }));
      
      const response = await fetch('/api/admin/classes/clear-all', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear classes');
      }
      
      const data = await response.json();
      
      toast({
        title: "Classes Cleared",
        description: `Successfully deleted ${data.deleted} classes`,
      });
      
      setScheduleStatus({
        isLoading: false,
        classCount: 0,
        message: "All classes have been deleted"
      });
      
      // Refresh classes
      fetchClasses();
      
    } catch (error: any) {
      console.error('Error clearing classes:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to clear classes",
        variant: "destructive"
      });
      
      setScheduleStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        message: `Error: ${error.message}` 
      }));
    }
  };

  // Handle deleting past classes
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
      }
      
      toast({
        title: "Success",
        description: data.deleted > 0 
          ? `Successfully deleted ${data.deleted} past classes`
          : "No past classes found to delete",
      });
      
      // Refresh status (but classes are already updated in frontend)
      checkScheduleStatus();
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

  // Group classes by week for the week view
  const groupClassesByWeek = () => {
    // Sort classes by date
    const sortedClasses = [...classes].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Group classes by week
    const weeks: {
      weekNumber: number;
      startDate: string;
      endDate: string;
      classCount: number;
      enabledCount: number;
      dayGroups: {
        day: string;
        date: string;
        classes: ClassItem[];
      }[];
    }[] = [];
    
    if (sortedClasses.length === 0) return weeks;
    
    // Group by week
    sortedClasses.forEach(cls => {
      const classDate = new Date(cls.date);
      
      // Get the week number (Monday as first day of week)
      const dayOfWeek = classDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0, Sunday = 6
      
      // Calculate the Monday date for this week
      const mondayDate = new Date(classDate);
      mondayDate.setDate(classDate.getDate() - mondayOffset);
      
      // Set time to midnight for consistent comparison
      mondayDate.setHours(0, 0, 0, 0);
      
      // Calculate week number since first Monday in dataset
      const firstClass = new Date(sortedClasses[0].date);
      const firstClassMondayOffset = firstClass.getDay() === 0 ? 6 : firstClass.getDay() - 1;
      const firstMonday = new Date(firstClass);
      firstMonday.setDate(firstClass.getDate() - firstClassMondayOffset);
      firstMonday.setHours(0, 0, 0, 0);
      
      const weeksSinceStart = Math.floor((mondayDate.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // Find or create week group
      let weekGroup = weeks.find(w => w.weekNumber === weeksSinceStart);
      
      if (!weekGroup) {
        // Calculate Friday date (end of week for display)
        const fridayDate = new Date(mondayDate);
        fridayDate.setDate(mondayDate.getDate() + 4); // Monday + 4 days = Friday
        
        weekGroup = {
          weekNumber: weeksSinceStart,
          startDate: mondayDate.toISOString(),
          endDate: fridayDate.toISOString(),
          classCount: 0,
          enabledCount: 0,
          dayGroups: []
        };
        weeks.push(weekGroup);
      }
      
      // Update counts
      weekGroup.classCount++;
      if (cls.enabled) {
        weekGroup.enabledCount++;
      }
      
      // Find or create day group
      let dayGroup = weekGroup.dayGroups.find(d => d.day === cls.day);
      
      if (!dayGroup) {
        dayGroup = {
          day: cls.day,
          date: classDate.toISOString(),
          classes: []
        };
        weekGroup.dayGroups.push(dayGroup);
      }
      
      // Add class to day group
      dayGroup.classes.push(cls);
    });
    
    // Sort each day's classes by time
    weeks.forEach(week => {
      week.dayGroups.sort((a, b) => {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return days.indexOf(a.day) - days.indexOf(b.day);
      });
      
      week.dayGroups.forEach(day => {
        day.classes.sort((a, b) => {
          // Convert time strings to comparable 24-hour format
          const getTimeValue = (timeStr: string) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            
            // Convert to 24-hour format
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes;
          };
          
          return getTimeValue(a.time) - getTimeValue(b.time);
        });
      });
    });
    
    return weeks;
  };

  // Handle toggling all classes in a week
  const handleToggleWeek = async (weekNumber: number, setEnabled: boolean) => {
    try {
      // Find all classes for this week
      const weeks = groupClassesByWeek();
      const weekGroup = weeks.find(w => w.weekNumber === weekNumber);
      
      if (!weekGroup) return;
      
      // Get all class IDs from this week
      const classIds: string[] = [];
      weekGroup.dayGroups.forEach(day => {
        day.classes.forEach(cls => {
          classIds.push(cls.id);
        });
      });
      
      toast({
        title: `Updating classes`,
        description: `Setting ${classIds.length} classes to ${setEnabled ? 'enabled' : 'disabled'}...`,
        variant: "default"
      });
      
      // Use the batch toggle endpoint to update all classes at once
      const response = await fetch('/api/classes/batch-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          classIds, 
          enabled: setEnabled 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update classes');
      }
      
      const result = await response.json();
      
      // Update local state
      setClasses(classes.map(cls => 
        classIds.includes(cls.id) ? { ...cls, enabled: setEnabled } : cls
      ));
      
      toast({
        title: `Classes ${setEnabled ? 'Enabled' : 'Disabled'}`,
        description: `Successfully updated ${result.updatedCount} of ${classIds.length} classes`,
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error toggling week classes:', error);
      
      toast({
        title: "Error updating classes",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  };

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
        <AdminSidebar user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Page header */}
          <div className="text-center mb-12 animate-in">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">CrossFit Admin Dashboard</h1>
            <p className="text-white/70 max-w-xl mx-auto">Manage CrossFit classes, clients, and system settings</p>
          </div>

          {isLoading && classes.length === 0 && clients.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
              <Tabs defaultValue="classes" className="space-y-6">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="bg-black/50 p-1 rounded-lg border border-white/10 mx-auto flex justify-center w-full max-w-full sm:max-w-2xl overflow-x-auto">
                    <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[70px] text-xs sm:text-sm whitespace-nowrap">
                      Classes
                    </TabsTrigger>
                    <TabsTrigger value="add-class" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[70px] text-xs sm:text-sm whitespace-nowrap">
                      Add Class
                    </TabsTrigger>
                    <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[70px] text-xs sm:text-sm whitespace-nowrap">
                      Clients
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[70px] text-xs sm:text-sm whitespace-nowrap">
                      Schedule
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[70px] text-xs sm:text-sm whitespace-nowrap">
                      Users
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="classes" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">CrossFit Class Schedule</h2>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Button
                      onClick={fetchClasses}
                      variant="outline"
                      className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
                    >
                      Refresh Classes
                    </Button>
                    <div className="flex items-center bg-black/40 rounded-md border border-white/20 px-3 py-1.5 gap-2">
                      <span className="text-xs text-white/70">View:</span>
                      <Button
                        variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('day')}
                        className="h-7 text-xs bg-transparent hover:bg-white/10 text-white data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        Day
                      </Button>
                      <Button
                        variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('week')}
                        className="h-7 text-xs bg-transparent hover:bg-white/10 text-white data-[state=active]:bg-white data-[state=active]:text-black"
                      >
                        Week
            </Button>
          </div>
                    <Button
                      onClick={async () => {
                        try {
                          const authToken = document.cookie.split('; ')
                            .find(row => row.startsWith('auth_token='))
                            ?.split('=')[1] || localStorage.getItem('auth_token');
                            
                          const response = await fetch('/api/debug?t=' + new Date().getTime(), {
                            headers: {
                              'Authorization': `Bearer ${authToken}`,
                              'Cache-Control': 'no-cache'
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to fetch debug data');
                          }
                          
                          const data = await response.json();
                          console.log('Debug data:', data);
                          
                          toast({
                            title: "Debug Data",
                            description: `Found ${data.stats.totalClasses} classes in database`,
                            variant: "default"
                          });
                        } catch (error) {
                          console.error('Error fetching debug data:', error);
                        }
                      }}
                      variant="outline"
                      className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
                    >
                      Debug Database
                    </Button>
                    <Button
                      onClick={handleDeletePastClasses}
                      variant="outline"
                      disabled={isDeletingPastClasses}
                      className="bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs sm:text-sm"
                    >
                      {isDeletingPastClasses ? (
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full border-2 border-red-400/20 border-r-transparent animate-spin"></div>
                          Deleting Past Classes...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Trash2 className="h-3 w-3" />
                          Delete Past Classes
                        </span>
                      )}
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const authToken = document.cookie.split('; ')
                            .find(row => row.startsWith('auth_token='))
                            ?.split('=')[1] || localStorage.getItem('auth_token');
                            
                          const response = await fetch('/api/admin/test-notifications', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${authToken}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                            toast({
                              title: "Test Notifications Created!",
                              description: `${data.details.totalNotifications} notifications created for ${data.details.adminCount} admins`,
                              variant: "default"
                            });
                            
                            // Refresh the notification count
                            fetchNotificationCount();
                          } else {
                            throw new Error(data.error || 'Failed to create test notifications');
                          }
                        } catch (error) {
                          console.error('Error creating test notifications:', error);
                          toast({
                            title: "Error",
                            description: "Failed to create test notifications",
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="outline"
                      className="bg-transparent border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs sm:text-sm"
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Test Notifications
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const authToken = document.cookie.split('; ')
                            .find(row => row.startsWith('auth_token='))
                            ?.split('=')[1] || localStorage.getItem('auth_token');
                            
                          const response = await fetch('/api/admin/test-notifications', {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${authToken}`,
                              'Content-Type': 'application/json'
                            }
                          });
                          
                          const data = await response.json();
                          
                          if (response.ok) {
                            toast({
                              title: "Notifications Cleared",
                              description: `${data.deletedCount} notifications deleted`,
                              variant: "default"
                            });
                            
                            // Refresh the notification count
                            fetchNotificationCount();
                          } else {
                            throw new Error(data.error || 'Failed to clear notifications');
                          }
                        } catch (error) {
                          console.error('Error clearing notifications:', error);
                          toast({
                            title: "Error",
                            description: "Failed to clear notifications",
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="outline"
                      className="bg-transparent border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-xs sm:text-sm"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear Test Notifications
                    </Button>
        </div>
                  
                  {isLoading ? (
                    <LoadingIndicator />
                  ) : (
              <div className="grid gap-4">
                      {classes.length === 0 ? (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                             <CalendarDays className="h-8 w-8 text-white/60" />
                           </div>
                            <h3 className="font-medium text-white text-lg">No CrossFit classes found</h3>
                            <p className="text-white/70 mt-2 max-w-xs">You haven't created any CrossFit classes yet. Use the Add New Class tab to get started.</p>
                            <Button 
                              onClick={() => {
                                generateYearSchedule();
                              }}
                              className="mt-6 bg-white/20 text-white hover:bg-white/30 border border-white/10"
                            >
                              Generate Year Schedule
                            </Button>
                          </CardContent>
                        </Card>
                      ) : viewMode === 'day' ? (
                        // Day view - individual classes
                        classes.map((cls) => (
                          <Card key={cls.id} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden cursor-pointer" onClick={() => router.push(`/admin/classes/${cls.id}`)}>
                            <CardContent className="p-6 relative">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <h3 className="font-semibold text-white text-xl">{cls.name}</h3>
                                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-white/70">
                                    <div className="flex items-center">
                                      <CalendarDays className="mr-1.5 h-4 w-4" />
                                      <span>{cls.day} - {new Date(cls.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="mr-1.5 h-4 w-4" />
                            <span>{cls.time}</span>
                          </div>
                        </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                                    <span>Bookings: {cls.currentBookings} / {cls.capacity}</span>
                                    <span>ID: {cls.id.substring(0, 8)}...</span>
                                  </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end gap-3">
                                  <Badge variant={cls.enabled ? "outline" : "secondary"} className={cls.enabled ? "bg-primary/20 text-white border-primary/30" : "bg-muted/20 text-white/70 border-white/10"}>
                            {cls.enabled ? "Bookable" : "Not Bookable"}
                                  </Badge>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={cls.enabled ? "destructive" : "default"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleClass(cls.id);
                                      }}
                                      className={cls.enabled ? "bg-red-600 hover:bg-red-700 text-xs px-2 py-1" : "bg-green-600 hover:bg-green-700 text-xs px-2 py-1"}
                                    >
                                      {cls.enabled ? "Disable" : "Enable"}
                                    </Button>
                                    <Switch 
                                      checked={cls.enabled} 
                                      onCheckedChange={() => handleToggleClass(cls.id)} 
                                      className="data-[state=checked]:bg-primary"
                                    />
                                  </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                        ))
                      ) : (
                        // Week view - grouped by week
                        groupClassesByWeek().map((weekGroup, index) => (
                          <Card key={`week-${index}`} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                            <CardHeader className="border-b border-white/10 bg-black/30 py-3">
          <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-white">
                                  Week of {new Date(weekGroup.startDate).toLocaleDateString()} - {new Date(weekGroup.endDate).toLocaleDateString()}
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-white/70">{weekGroup.classCount} classes</span>
                                  <Switch 
                                    checked={weekGroup.enabledCount > 0} 
                                    onCheckedChange={() => handleToggleWeek(weekGroup.weekNumber, weekGroup.enabledCount < weekGroup.classCount)} 
                                    className="data-[state=checked]:bg-primary"
                                  />
          </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                                {weekGroup.dayGroups.map((dayGroup) => (
                                  <div key={dayGroup.date} className="p-4 bg-gradient-to-b from-transparent to-black/20">
                                    <div className="flex items-center justify-between mb-3">
                                      <h3 className="font-medium text-white">{dayGroup.day}</h3>
                                      <span className="text-xs text-white/60">{new Date(dayGroup.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="space-y-2">
                                      {dayGroup.classes.map((cls) => (
                                        <div 
                                          key={cls.id} 
                                          className={`flex items-center justify-between bg-black/30 rounded p-2 text-sm hover:bg-primary/20 cursor-pointer ${!cls.enabled ? 'opacity-70' : ''}`}
                                          onClick={() => router.push(`/admin/classes/${cls.id}`)}
                                        >
                                          <span className="text-white">{cls.time}</span>
                                          <Badge variant={cls.enabled ? "outline" : "secondary"} className={cls.enabled ? "bg-primary/20 text-white border-primary/30 text-xs" : "bg-muted/20 text-white/70 border-white/10 text-xs"}>
                                            {cls.currentBookings}/{cls.capacity}
                                          </Badge>
                                        </div>
                ))}
              </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  )}
            </TabsContent>

                <TabsContent value="add-class" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Add New Class</h2>
                  
                  <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-white/10 bg-black/30">
                      <CardTitle className="text-xl text-white">Class Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <form onSubmit={handleAddClass}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-white">Class Name</Label>
                            <Input
                              id="name"
                              value={newClass.name}
                              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                              placeholder="e.g., CrossFit WOD"
                              className="bg-black/20 border-white/20 text-white placeholder:text-white/50"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="date" className="text-white">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              value={newClass.date}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                if (selectedDate) {
                                  const dateObj = new Date(selectedDate);
                                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                  const dayName = days[dateObj.getDay()];
                                  setNewClass({ 
                                    ...newClass, 
                                    date: selectedDate,
                                    day: dayName
                                  });
                                } else {
                                  setNewClass({ ...newClass, date: selectedDate });
                                }
                              }}
                              className="bg-black/20 border-white/20 text-white"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="day" className="text-white">Day (Auto-filled)</Label>
                            <Select
                              value={newClass.day}
                              onValueChange={(value) => setNewClass({ ...newClass, day: value })}
                              disabled={!!newClass.date}
                            >
                              <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                <SelectValue placeholder={newClass.day || "Select a date first"} />
                              </SelectTrigger>
                              <SelectContent className="bg-black border-white/20">
                                <SelectItem value="Monday">Monday</SelectItem>
                                <SelectItem value="Tuesday">Tuesday</SelectItem>
                                <SelectItem value="Wednesday">Wednesday</SelectItem>
                                <SelectItem value="Thursday">Thursday</SelectItem>
                                <SelectItem value="Friday">Friday</SelectItem>
                                <SelectItem value="Saturday">Saturday</SelectItem>
                                <SelectItem value="Sunday">Sunday</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="capacity" className="text-white">Capacity</Label>
                            <Input
                              id="capacity"
                              type="number"
                              min="1"
                              max="20"
                              value={newClass.capacity}
                              onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                              className="bg-black/20 border-white/20 text-white"
                              required
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label htmlFor="timeHour" className="text-white">Hour</Label>
                              <Select
                                value={newClass.timeHour}
                                onValueChange={(value) => setNewClass({ ...newClass, timeHour: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                  <SelectValue placeholder="Hour" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/20">
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(hour => (
                                    <SelectItem key={hour} value={hour.toString()}>{hour}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="timeMinute" className="text-white">Minute</Label>
                              <Select
                                value={newClass.timeMinute}
                                onValueChange={(value) => setNewClass({ ...newClass, timeMinute: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                  <SelectValue placeholder="Min" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/20">
                                  <SelectItem value="00">00</SelectItem>
                                  <SelectItem value="15">15</SelectItem>
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="45">45</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Label htmlFor="timePeriod" className="text-white">Period</Label>
                              <Select
                                value={newClass.timePeriod}
                                onValueChange={(value) => setNewClass({ ...newClass, timePeriod: value })}
                              >
                                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                                  <SelectValue placeholder="AM/PM" />
                                </SelectTrigger>
                                <SelectContent className="bg-black border-white/20">
                                  <SelectItem value="AM">AM</SelectItem>
                                  <SelectItem value="PM">PM</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        
                        {errorMessage && (
                          <Alert className="mt-4 bg-red-900/20 border-red-500/30">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="text-red-300">Error</AlertTitle>
                            <AlertDescription className="text-red-200">
                              {errorMessage}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        <Button
                          type="submit"
                          className="w-full mt-6 bg-primary text-black hover:bg-primary/90 font-medium"
                          disabled={isCreatingClass}
                        >
                          {isCreatingClass ? (
                            <span className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full border-2 border-black/20 border-r-transparent animate-spin"></div>
                              Creating Class...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Add Class
                            </span>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="clients" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">CrossFit Client Management</h2>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <Button
                      onClick={fetchClients}
                      variant="outline"
                      className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
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
                      className="bg-transparent border border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
                    >
                      Debug Client Packages
                    </Button>
                  </div>
                  
                  {isLoading ? (
                    <LoadingIndicator />
                  ) : (
              <div className="grid gap-4">
                      {clients.length === 0 ? (
                        <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                              <Users className="h-8 w-8 text-white/60" />
                            </div>
                            <h3 className="font-medium text-white text-lg">No CrossFit clients found</h3>
                            <p className="text-white/70 mt-2 max-w-xs">You don't have any registered CrossFit clients yet.</p>
                          </CardContent>
                        </Card>
                      ) : (
                        clients.map((client) => (
                          <Card key={client.id} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                            <CardContent className="p-6 relative">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="border-2 border-white/20 h-10 w-10">
                                      <AvatarFallback className="bg-primary/30 text-white">{client.name?.charAt(0) || 'C'}</AvatarFallback>
            </Avatar>
                                    <div>
                                      <h3 className="font-semibold text-white text-lg">{client.name}</h3>
                                      <p className="text-sm text-white/70">{client.email}</p>
                                    </div>
                                  </div>
                                  
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
                                
                                <div className="flex justify-end mt-4 sm:mt-0">
                                  {client.package && client.package.daysRemaining <= 7 && client.package.daysRemaining > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => handleSendReminder(client.id)}
                                      className="bg-transparent border border-white/20 text-white hover:bg-primary/20 hover:border-primary/30 flex items-center gap-2 whitespace-nowrap"
                          >
                            <Bell className="h-4 w-4" />
                            Send Reminder
                          </Button>
                        )}
                                </div>
                      </div>
                    </CardContent>
                  </Card>
                        ))
                      )}
              </div>
                  )}
            </TabsContent>

                <TabsContent value="schedule" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Year-Long Schedule Management</h2>
                  
                  <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-white/10 bg-black/30">
                      <CardTitle className="text-xl text-white">Schedule Status</CardTitle>
                      <CardDescription className="text-white/70">Manage the year-long class schedule starting from June 2, 2025</CardDescription>
                </CardHeader>
                    <CardContent className="p-6">
        <div className="space-y-6">
                        <div className="bg-black/30 rounded-lg p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-white text-lg">Current Status</h3>
                            <p className="text-white/70 mt-1">
                              {scheduleStatus.isLoading 
                                ? "Checking status..." 
                                : `${scheduleStatus.classCount} total classes found`}
                            </p>
                            <p className="text-white/70 mt-1">
                              {scheduleStatus.message}
                            </p>
                    </div>
                          <Button
                            onClick={checkScheduleStatus}
                            variant="outline"
                            size="sm"
                            className="bg-transparent border border-white/20 text-white hover:bg-white/10"
                            disabled={scheduleStatus.isLoading}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 ${scheduleStatus.isLoading ? 'animate-spin' : ''}`} />
                            Refresh Status
                          </Button>
                      </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Card className="bg-black/30 border-white/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base text-white">Generate Year Schedule</CardTitle>
                              <CardDescription className="text-white/70 text-xs">
                                Create classes for all weekdays from Jun 2, 2025 to Jun 1, 2026
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="text-white/70 text-sm pt-0">
                              <p>• Monday-Friday classes only</p>
                              <p>• Morning and evening sessions</p>
                              <p>• All classes disabled by default</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button
                                onClick={generateYearSchedule}
                                className="w-full bg-white text-black hover:bg-white/90"
                                disabled={scheduleStatus.isLoading}
                              >
                                {scheduleStatus.isLoading && scheduleStatus.message === "Generating schedule..." ? (
                                  <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border-2 border-black/20 border-r-transparent animate-spin"></div>
                                    Generating...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Generate Schedule
                                  </span>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                          
                          <Card className="bg-black/30 border-white/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base text-white">Delete Past Classes</CardTitle>
                              <CardDescription className="text-white/70 text-xs">
                                Remove all classes older than 7 days
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="text-white/70 text-sm pt-0">
                              <p>• Removes completed classes</p>
                              <p>• Automatically runs weekly</p>
                              <p>• Frees up database space</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button
                                onClick={handleDeletePastClasses}
                                className="w-full bg-indigo-800/70 text-white hover:bg-indigo-700/70"
                                disabled={isDeletingPastClasses}
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
                            </CardFooter>
                          </Card>
                          
                          <Card className="bg-black/30 border-white/10">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base text-white">Reset All Classes</CardTitle>
                              <CardDescription className="text-white/70 text-xs">
                                Delete all classes from the database
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="text-white/70 text-sm pt-0">
                              <p className="text-amber-400">⚠️ Warning: This will delete ALL classes</p>
                              <p>• All bookings will be lost</p>
                              <p>• This action cannot be undone</p>
                            </CardContent>
                            <CardFooter className="pt-0">
                              <Button
                                onClick={resetAllClasses}
                                variant="outline"
                                className="w-full bg-transparent border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-400"
                                disabled={scheduleStatus.isLoading}
                              >
                                {scheduleStatus.isLoading && scheduleStatus.message === "Deleting all classes..." ? (
                                  <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                                    Deleting...
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Trash2 className="h-4 w-4" />
                                    Reset All Classes
                                  </span>
                                )}
                              </Button>
                            </CardFooter>
                          </Card>
                      </div>
                        
                        <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                          <h3 className="font-medium text-white mb-2">Schedule Details</h3>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="p-2 bg-black/40 rounded border border-white/10">
                                <p className="text-white/60">Monday</p>
                                <p className="text-white">AM: 8:00, 9:00, 10:00</p>
                                <p className="text-white">PM: 17:00, 18:00, 19:00, 20:00</p>
                    </div>
                              <div className="p-2 bg-black/40 rounded border border-white/10">
                                <p className="text-white/60">Tuesday</p>
                                <p className="text-white">AM: 8:00, 9:00</p>
                                <p className="text-white">PM: 17:00, 18:00, 19:00, 20:00</p>
                              </div>
                              <div className="p-2 bg-black/40 rounded border border-white/10">
                                <p className="text-white/60">Wednesday</p>
                                <p className="text-white">AM: 8:00, 9:00, 10:00</p>
                                <p className="text-white">PM: 17:00, 18:00, 19:00, 20:00</p>
                              </div>
                              <div className="p-2 bg-black/40 rounded border border-white/10">
                                <p className="text-white/60">Thursday</p>
                                <p className="text-white">AM: 8:00, 9:00</p>
                                <p className="text-white">PM: 17:00, 18:00, 19:00, 20:00</p>
                              </div>
                              <div className="p-2 bg-black/40 rounded border border-white/10">
                                <p className="text-white/60">Friday</p>
                                <p className="text-white">AM: 8:00, 9:00, 10:00</p>
                                <p className="text-white">PM: 16:00, 17:00, 18:00</p>
                              </div>
                            </div>
                          </div>
                        </div>
                    </div>
                  </CardContent>
              </Card>
            </TabsContent>

                <TabsContent value="users" className="space-y-6 animate-in">
                  <h2 className="text-2xl font-semibold tracking-tight text-white text-center">User Management</h2>
                  <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-white/10 bg-black/30">
                      <CardTitle className="text-xl text-white">All Users</CardTitle>
                      <CardDescription className="text-white/70">Delete users permanently. This action cannot be undone.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="bg-black/40 border-b border-white/10 text-white/70">
                              <th className="text-left p-3">Name</th>
                              <th className="text-left p-3">Email</th>
                              <th className="text-left p-3">Package</th>
                              <th className="text-left p-3">Remaining</th>
                              <th className="text-right p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clients.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-white/70">No users found</td>
                              </tr>
                            ) : (
                              clients.map((client) => (
                                <tr key={client.id} className="border-b border-white/10 hover:bg-white/5">
                                  <td className="p-3 text-white">{client.name}</td>
                                  <td className="p-3 text-white/80">{client.email}</td>
                                  <td className="p-3 text-white/80">{client.package?.name || 'None'}</td>
                                  <td className="p-3 text-white/80">{client.package ? `${client.package.classesRemaining}/${client.package.totalClasses}` : '-'}</td>
                                  <td className="p-3 text-right">
                                    <Button
                                      variant="outline"
                                      className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-400 h-8 px-3"
                                      onClick={async () => {
                                        if (!confirm(`Are you sure you want to delete ${client.name || client.email}? This cannot be undone.`)) return;
                                        try {
                                          const resp = await fetch(`/api/admin/users/${client.id}`, { method: 'DELETE' });
                                          if (!resp.ok) {
                                            const err = await resp.json();
                                            throw new Error(err.error || 'Failed to delete user');
                                          }
                                          // Optimistically remove from UI
                                          setClients((prev) => prev.filter((c) => c.id !== client.id));
                                          toast({ title: 'User deleted', description: `${client.name || client.email} was deleted` });
                                        } catch (e: any) {
                                          toast({ title: 'Error', description: e.message || 'Failed to delete user', variant: 'destructive' });
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
          </Tabs>
        </div>
          )}
      </main>
    </div>
    </>
  );
}

                           