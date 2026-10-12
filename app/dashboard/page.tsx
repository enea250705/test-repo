"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Clock, Users, LayoutDashboard, Settings, AlertTriangle, BookOpen, MenuIcon, X, Dumbbell, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { UserSidebar, UserMobileHeader, UserMobileMenu } from "./components/DashboardLayout"
import { formatValidUntil } from "@/lib/package-dates"

// Define loader component for when content is loading
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading fitness data...</h3>
    </div>
  </div>
);

// Add type definitions to fix TypeScript errors
interface ClassPreview {
  id: string;
  classId?: string;
  name: string;
  day: string;
  time: string;
  date: string;
  available?: boolean;
  capacity?: number;
  currentBookings?: number;
  price?: string;
  coach?: string;
  isBooked?: boolean;
}

interface PackageInfo {
  id: string;
  name: string;
  totalClasses: number;
  classesRemaining: number;
  startDate: string | Date;
  endDate: string | Date;
  daysRemaining: number;
  active: boolean;
}

// Add package prices interface
interface PackagePrices {
  package8Price: string;
  package12Price: string;
  packageDuration: string;
}

// Define ClassCard component for better reusability
function ClassCard({ 
  cls, 
  isBooking, 
  isUpcoming, 
  onBook, 
  onCancel, 
  userCanBook,
  showBookButton = true,
  onRedirect
}: { 
  cls: ClassPreview;
  isBooking: boolean;
  isUpcoming: boolean;
  onBook?: (id: string) => void;
  onCancel?: (id: string) => void;
  userCanBook: boolean;
  showBookButton?: boolean;
  onRedirect?: () => void;
}) {
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancelClick = async () => {
    if (!onCancel) return;
    
    setIsCanceling(true);
    try {
      await onCancel(cls.id);
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <Card 
      className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-primary/30 to-transparent opacity-30 rounded-bl-full pointer-events-none"></div>
      
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-xl group-hover:text-white/90 transition-colors">{cls.name}</h3>
          {!isUpcoming && showBookButton && (
            <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
              {Math.max(0, (cls.capacity || 0) - (cls.currentBookings || 0))} spots left
            </Badge>
          )}
          {cls.isBooked === true && (
            <Badge variant="outline" className="bg-green-500/20 text-white border-green-500/30">
              Booked
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mt-1 mb-3">
          <div className="flex items-center">
            <CalendarDays className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{new Date(cls.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-1.5 h-4 w-4 text-primary/80" />
            <span>{cls.time}</span>
          </div>
          {cls.coach && (
            <div className="flex items-center">
              <User className="mr-1.5 h-4 w-4 text-primary/80" />
              <span>{cls.coach}</span>
            </div>
          )}
        </div>
        
        {!isUpcoming && showBookButton && (
          <div className="bg-white/5 rounded-md p-2 mt-2 text-xs text-white/60">
            <div className="flex justify-between items-center">
              <span>Class Capacity:</span>
              <span>{cls.currentBookings || 0}/{cls.capacity || 0}</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-primary/80 rounded-full"
                style={{ width: `${((cls.currentBookings || 0) / (cls.capacity || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 pb-6 px-4 sm:px-6">
        {cls.isBooked === true ? (
          <div className="w-full">
            <Link href="/membership/cancel">
              <Button
                className="w-full bg-red-500/30 hover:bg-red-500/50 text-white border border-red-500/40 font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg py-6 text-base relative z-10"
                variant="outline"
                type="button"
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="h-5 w-5 text-red-300" />
                  Cancel Booking
                </span>
              </Button>
            </Link>
            <div className="text-xs text-white/70 mt-3 text-center">
              * Cancellations must be made at least 8 hours before class
            </div>
          </div>
        ) : showBookButton ? (
          <Button
            onClick={() => {
              console.log("Button clicked for class:", cls.id);
              if (onBook) onBook(cls.id);
            }}
            disabled={!userCanBook || isBooking}
            className="w-full bg-white hover:bg-white/90 text-black hover:text-black/90 disabled:bg-white/10 disabled:text-white/30 disabled:border disabled:border-white/10 transition-colors relative z-10"
            type="button"
          >
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                Booking...
              </span>
            ) : (
              'Book Class'
            )}
          </Button>
        ) : (
          <Button
            onClick={onRedirect}
            className="w-full bg-white hover:bg-white/90 text-black hover:text-black/90 transition-colors relative z-10"
            type="button"
          >
            View Details & Book
          </Button>
        )}
        {showBookButton && (
          <div className="text-xs text-white/60 mt-3 text-center w-full">
            * Classes deducted from your membership package
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

const DashboardPage = () => {
  const { user, isLoading: authLoading, refreshSession } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassPreview[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<ClassPreview[]>([]);
  const [userPackage, setUserPackage] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingClassId, setBookingClassId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackagePrices>({
    package8Price: "120",
    package12Price: "160", 
    packageDuration: "30"
  });

  // Refresh session on component mount and periodically
  useEffect(() => {
    // Attempt to refresh the session when the dashboard loads
    refreshSession().catch(err => {
      console.error("Failed to refresh session:", err);
    });

    // Set up periodic token refresh (every 6 hours) to ensure long-lasting sessions
    const refreshInterval = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    const refreshTimer = setInterval(() => {
      console.log("Performing scheduled session refresh");
      refreshSession().catch(err => {
        console.error("Scheduled session refresh failed:", err);
      });
    }, refreshInterval);

    // Clean up the interval when component unmounts
    return () => clearInterval(refreshTimer);
  }, [refreshSession]);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user && !isLoading) {
        // Add a small delay to prevent false redirects during initial load
        const timer = setTimeout(() => {
          // Double-check that we're still not authenticated before redirecting
          if (!user) {
            console.log('User not authenticated, redirecting to login');
            toast({
              title: "Authentication Required",
              description: "Please log in to access this page",
              variant: "destructive"
            });
            router.push('/login');
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    };
    
    checkAuthStatus();
  }, [user, isLoading, router, toast]);

  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log("Dashboard component mounted or user changed, fetching data...");
      fetchData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add function to fetch package data
  const fetchPackageData = async () => {
    try {
      console.log('Fetching package data...');
      
      const response = await fetch('/api/packages/current', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch package data:', response.status, response.statusText);
        return false;
      }
      
      const packageData = await response.json();
      console.log('Package data received:', packageData);
      
      if (packageData.package) {
        setUserPackage({
          id: packageData.package.id,
          name: packageData.package.name,
          totalClasses: packageData.package.totalClasses,
          classesRemaining: packageData.package.classesRemaining,
          startDate: packageData.package.startDate,
          endDate: packageData.package.endDate,
          daysRemaining: packageData.package.daysRemaining,
          active: packageData.package.active || true,
        });
        console.log('User package updated in state:', packageData.package.name);
        return true;
      } else {
        console.log('No active package found');
        setUserPackage(null);
        return false;
      }
    } catch (error) {
      console.error('Error fetching package data:', error);
      
      // Try a fallback to the regular packages endpoint as a backup
      try {
        console.log('Trying fallback package endpoint...');
        const fallbackResponse = await fetch('/api/packages', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!fallbackResponse.ok) {
          console.error('Fallback also failed:', fallbackResponse.status);
          return false;
        }
        
        const fallbackData = await fallbackResponse.json();
        console.log('Fallback package data received:', fallbackData);
        
        if (fallbackData.package) {
          setUserPackage({
            id: fallbackData.package.id,
            name: fallbackData.package.name,
            totalClasses: fallbackData.package.totalClasses,
            classesRemaining: fallbackData.package.classesRemaining,
            startDate: fallbackData.package.startDate,
            endDate: fallbackData.package.endDate,
            daysRemaining: fallbackData.package.daysRemaining,
            active: fallbackData.package.active || true,
          });
          console.log('User package updated from fallback:', fallbackData.package.name);
          return true;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed with error:', fallbackError);
      }
      
      return false;
    }
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching data...");
      
      // Fetch classes
      const classesResponse = await fetch('/api/classes?t=' + new Date().getTime(), {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!classesResponse.ok) {
        const errorData = await classesResponse.json().catch(() => ({}));
        console.error('Failed to fetch classes:', classesResponse.status, errorData);
        throw new Error(`Failed to fetch classes: ${errorData.error || classesResponse.statusText}`);
      }
      
      const classesData = await classesResponse.json().catch(err => {
        console.error('Failed to parse classes JSON:', err);
        throw new Error('Failed to parse classes data');
      });
      
      if (!Array.isArray(classesData)) {
        console.error('Classes data is not an array:', classesData);
        throw new Error('Invalid classes data format');
      }
      
      // Fetch user bookings
      const bookingsResponse = await fetch('/api/bookings', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!bookingsResponse.ok) {
        const errorData = await bookingsResponse.json().catch(() => ({}));
        console.error('Failed to fetch bookings:', bookingsResponse.status, errorData);
        throw new Error(`Failed to fetch bookings: ${errorData.error || bookingsResponse.statusText}`);
      }
      
      const bookingsData = await bookingsResponse.json().catch(err => {
        console.error('Failed to parse bookings JSON:', err);
        throw new Error('Failed to parse bookings data');
      });
      
      if (!Array.isArray(bookingsData)) {
        console.error('Bookings data is not an array:', bookingsData);
        throw new Error('Invalid bookings data format');
      }
      
      console.log("Classes data:", classesData);
      console.log("Bookings data:", bookingsData);
      
      // Get IDs of all classes the user has booked
      const bookedClassIds = bookingsData.map((booking: any) => booking.classId);
      console.log("Booked class IDs:", bookedClassIds);
      
      // Debug log to check if bookedClassIds contains the expected IDs
      console.log("Do we have any booked classes?", bookedClassIds.length > 0);
      if (bookedClassIds.length > 0) {
        console.log("First booked class ID:", bookedClassIds[0]);
      }
      
      // Mark classes as booked only if they exist in the user's bookings
      const classesWithBookingStatus = classesData.map((cls: any) => {
        // Explicitly convert to boolean to ensure proper state handling
        const isBooked = bookedClassIds.includes(cls.id) ? true : false;
        console.log(`Class ${cls.id} (${cls.name}) isBooked:`, isBooked);
        return {
          ...cls,
          isBooked: isBooked,
          capacity: cls.capacity || 5,  // Ensure capacity has a default value
          currentBookings: cls.currentBookings || 0  // Ensure currentBookings has a default value
        };
      });
      
      console.log("Classes with booking status:", classesWithBookingStatus);
      console.log("Booked classes count:", classesWithBookingStatus.filter(cls => cls.isBooked === true).length);
      
      setClasses(classesWithBookingStatus);
      setFilteredClasses(sortClasses(classesWithBookingStatus));
      
      // Fetch fresh package data after setting classes and bookings
      await fetchPackageData();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load data. Please try again.",
        variant: "destructive"
      });
      
      // If we still don't have classes data, provide empty arrays to avoid UI errors
      if (classes.length === 0) {
        setClasses([]);
        setFilteredClasses([]);
      }
      
      throw error; // Re-throw to be caught by the caller
    } finally {
      setIsLoading(false);
    }
  };

  // Add immediate package data fetch on user login
  useEffect(() => {
    if (!user) {
      console.log('No user logged in, skipping data fetch');
      setIsLoading(false);
      return;
    }

    console.log('User logged in, fetching all data');
    
    // Check if there's package data in localStorage from registration
    const savedPackageData = localStorage.getItem('registration_package');
    if (savedPackageData) {
      try {
        const packageData = JSON.parse(savedPackageData);
        console.log('Found package data from registration:', packageData);
        
        if (packageData) {
          // Calculate days remaining
          const now = new Date();
          const endDate = new Date(packageData.endDate);
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          );
          
          setUserPackage({
            id: packageData.id,
            name: packageData.name,
            totalClasses: packageData.totalClasses,
            classesRemaining: packageData.classesRemaining,
            startDate: packageData.startDate,
            endDate: packageData.endDate,
            daysRemaining: daysRemaining,
            active: packageData.active || true,
          });
          
          // Clear from localStorage after using it
          localStorage.removeItem('registration_package');
        }
      } catch (e) {
        console.error('Error parsing saved package data:', e);
        localStorage.removeItem('registration_package');
      }
    }
    
    // Fetch data with error handling
    fetchData()
      .then(() => {
        // After data fetch, explicitly fetch package data again to ensure it's loaded
        // This helps with persistent package state after login/logout
        console.log('Explicitly fetching package data after initial data load');
        
        // Try up to 3 times with a delay between attempts
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryFetchPackage = async () => {
          if (attempts >= maxAttempts) {
            console.error('Failed to fetch package data after', maxAttempts, 'attempts');
            return;
          }
          
          attempts++;
          console.log(`Package data fetch attempt ${attempts}/${maxAttempts}`);
          
          try {
            const success = await fetchPackageData();
            
            if (!success && attempts < maxAttempts) {
              console.log(`Retrying package fetch in ${attempts * 500}ms...`);
              setTimeout(tryFetchPackage, attempts * 500);
            }
          } catch (error) {
            console.error('Error in package fetch attempt:', error);
            if (attempts < maxAttempts) {
              console.log(`Retrying after error in ${attempts * 500}ms...`);
              setTimeout(tryFetchPackage, attempts * 500);
            }
          }
        };
        
        tryFetchPackage();
      })
      .catch(error => {
        console.error('Initial data fetch failed:', error);
        setIsLoading(false);
        toast({
          title: "Connection Error",
          description: "Failed to load your dashboard data. Please try refreshing the page.",
          variant: "destructive"
        });
      });
  }, [user, toast]);

  // Add sorting function
  const sortClasses = (classes: ClassPreview[]) => {
    return [...classes].sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // If dates are the same, sort by time (properly handling AM/PM)
      const getTimeValue = (timeStr: string) => {
        // Handle cases where timeStr might not have the expected format
        if (!timeStr || !timeStr.includes(':')) return 0;
        
        const parts = timeStr.split(' ');
        const time = parts[0];
        const period = parts.length > 1 ? parts[1] : '';
        
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format for proper comparison
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };
      
      return getTimeValue(a.time) - getTimeValue(b.time);
    });
  };

  const handleBookClass = async (classId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book classes.",
        variant: "destructive"
      });
      return;
    }

    // Ensure classId is a string
    const classIdString = String(classId);
    
    console.log("Booking class with ID:", classIdString, "Type:", typeof classIdString);

    if (!userPackage?.active) {
      toast({
        title: "No Active Membership",
        description: "You need an active membership to book classes.",
        variant: "destructive"
      });
      return;
    }
    
    if (userPackage.classesRemaining <= 0) {
      toast({
        title: "No Classes Remaining",
        description: "You have used all classes in your current package.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsBooking(true);
      setBookingClassId(classIdString);
      console.log("Starting booking process for class:", classIdString);
      
      // Book the class
      const response = await fetch('/api/bookings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ classId: classIdString }),
      });
      
      const data = await response.json().catch(err => {
        console.error('Failed to parse booking response:', err);
        throw new Error('Failed to process booking response');
      });
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book class');
      }
      
      console.log("Booking successful, response:", data);
      
      // Update the local state to mark this class as booked
      setClasses(prevClasses => {
        const updatedClasses = prevClasses.map(cls => 
          cls.id === classIdString 
            ? { 
                ...cls, 
                isBooked: true, 
                currentBookings: (cls.currentBookings || 0) + 1 
              } 
            : cls
        );
        console.log("Updated classes after booking:", updatedClasses);
        console.log("Booked classes count after update:", updatedClasses.filter(c => c.isBooked === true).length);
        
        // Also update filtered classes to ensure consistency
        setFilteredClasses(sortClasses(updatedClasses));
        
        return updatedClasses;
      });
      
      // Update userPackage classesRemaining (decrement by 1)
      if (userPackage) {
        setUserPackage({
          ...userPackage,
          classesRemaining: userPackage.classesRemaining - 1
        });
      }
      
      // Show success notification
      toast({
        title: "Class Booked",
        description: "You have successfully booked this class.",
        variant: "success"
      });
      
      // Ensure a small delay before refetching data to allow the backend to settle
      setTimeout(async () => {
        // Refresh package data
        await fetchPackageData();
      
        // Refresh data to ensure new booking is displayed
        await fetchData();
      }, 500);
      
    } catch (error: any) {
      console.error('Error booking class:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book class. Please try again.",
        variant: "destructive"
      });
      
      // Refresh data to ensure UI is in sync with server state
      try {
        await fetchData();
      } catch (refreshError) {
        console.error('Failed to refresh data after booking error:', refreshError);
      }
    } finally {
      setIsBooking(false);
      setBookingClassId(null);
    }
  };

  // Handle purchasing/renewing packages
  const handlePurchasePackage = async (packageType: string) => {
    try {
      setIsBooking(true);
      console.log(`Processing package of type: ${packageType}`);
      
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ packageType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process package');
      }
      
      const data = await response.json();
      console.log('Package processing successful:', data);
      
      // Refresh user package data after purchase/renewal
      setUserPackage(data.package);
      
      // Verify the package is in the state
      console.log('Updated user package state:', data.package.name);
      
      const isRenewal = userPackage && userPackage.daysRemaining > 0;
      
      toast({
        title: isRenewal ? "Package Renewed" : "Package Purchased",
        description: isRenewal 
          ? `Your membership has been extended! Total ${data.package.totalClasses} classes available.`
          : `You now have access to ${data.package.totalClasses} classes per month`,
        variant: "success"
      });
      
      // Force a fetch of package data again after a brief delay
      // This ensures the package data is properly persisted
      setTimeout(async () => {
        console.log('Verifying package data persistence...');
        const success = await fetchPackageData();
        
        if (success) {
          console.log('Package data verified and persisted successfully');
        } else {
          console.warn('Failed to verify package persistence, refreshing data...');
          // Try one more time with a full data refresh
          fetchData();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to purchase package",
        variant: "destructive"
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelBooking = async (classId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage bookings.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Canceling booking for class:", classId);
      
      // Use the dedicated cancel-by-class endpoint
      const response = await fetch('/api/bookings/cancel-by-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      });
      
      const data = await response.json().catch(err => {
        console.error('Failed to parse cancellation response:', err);
        throw new Error('Failed to process cancellation response');
      });
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to cancel booking';
        console.error("Cancellation error:", errorMessage);
        
        // Show a more specific error message
        let userMessage = errorMessage;
        if (errorMessage.includes("Booking not found for this class")) {
          userMessage = "No active booking found for this class.";
        } else if (errorMessage.includes("allowed at least 8 hours")) {
          userMessage = "Cancellations must be made at least 8 hours before the class starts.";
        }
        
        toast({
          title: "Error",
          description: userMessage,
          variant: "destructive"
        });
        
        throw new Error(errorMessage);
      }
      
      console.log("Cancellation response:", data);
      
      // Update the classes state to reflect the cancellation
      setClasses(prevClasses => {
        const updatedClasses = prevClasses.map(cls => 
          cls.id === classId 
            ? { 
                ...cls, 
                isBooked: false, 
                currentBookings: Math.max(0, (cls.currentBookings || 1) - 1) 
              } 
            : cls
        );
        
        // Also update filtered classes to ensure consistency
        setFilteredClasses(sortClasses(updatedClasses));
        
        return updatedClasses;
      });
      
      // If we have a user package, increment the remaining classes
      if (userPackage) {
        setUserPackage({
          ...userPackage,
          classesRemaining: userPackage.classesRemaining + 1
        });
      }
      
      // Show success notification
      toast({
        title: "Booking Cancelled",
        description: "Your class booking has been successfully cancelled.",
        variant: "success"
      });
      
      // Refresh package data
      await fetchPackageData();
    } catch (err: any) {
      console.error("Error in cancellation flow:", err);
      // Don't duplicate toast notifications for errors already handled
    }
  };

  // Add function to fetch package prices
  const fetchPackagePrices = async () => {
    try {
      // Try to fetch from admin settings (will fallback to defaults if API fails)
      const response = await fetch('/api/packages/prices', {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.prices) {
          setPackages(data.prices);
        }
      }
    } catch (error) {
      console.log('Using default package prices');
      // Keep default prices if API fails
    }
  };

  // Update useEffect to include package prices fetch
  useEffect(() => {
    if (user) {
      fetchData()
      fetchPackagePrices()
    }
  }, [user])

  // Update the condition to render main content when user is confirmed
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen flex flex-col">
        {/* Optimized background image with next/image */}
        <div className="fixed inset-0 -z-10">
          <Image 
            src="/images/gymxam3.webp"
            alt="Dashboard background"
            fill
            priority
            sizes="100vw"
            quality={80}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
          </div>
        
        {/* Desktop sidebar */}
        <UserSidebar user={user} />
        
        {/* Mobile header */}
        <UserMobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <UserMobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 sm:py-12 px-4 relative z-10">
          {/* Page header */}
          <div className="text-center mb-12 animate-in">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">Your fitness Dashboard</h1>
            <p className="text-white/70 max-w-xl mx-auto">Book fitness classes, manage your schedule, and track your membership</p>
            </div>

          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-[1fr_380px]">
              {/* Left column - Classes */}
              <div className="space-y-8">
                <Tabs defaultValue="upcoming" className="space-y-6">
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="bg-black/50 p-1 rounded-lg border border-white/10 w-full max-w-full sm:max-w-md mx-auto flex justify-center">
                      <TabsTrigger value="upcoming" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1">
                        Booked Classes
                      </TabsTrigger>
                      <TabsTrigger value="available" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1">
                        Available fitness
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="upcoming" className="space-y-6 animate-in">
                    <div className="flex flex-col items-center justify-center">
                      <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Your Upcoming fitness Classes</h2>
                      <div className="flex gap-2 mt-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={async () => {
                            try {
                              toast({
                                title: "Refreshing Data",
                                description: "Getting your latest booking information...",
                                variant: "default"
                              });
                              await fetchData();
                              toast({
                                title: "Data Refreshed",
                                description: "Your booking information has been updated.",
                                variant: "success"
                              });
                            } catch (error: any) {
                              console.error("Error refreshing data:", error);
                              toast({
                                title: "Error",
                                description: "Failed to refresh your booking data. Please try again.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Refresh Booking Data
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                          onClick={async () => {
                            try {
                              toast({
                                title: "Checking Bookings",
                                description: "Fetching your booking data...",
                                variant: "default"
                              });
                              
                              // Fetch detailed booking debug data
                              const response = await fetch('/api/debug/bookings', {
                                headers: {
                                  'Cache-Control': 'no-store, must-revalidate',
                                  'Pragma': 'no-cache'
                                }
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to fetch bookings');
                              }
                              
                              const debugData = await response.json();
                              console.log('Booking debug data:', debugData);
                              
                              // Update UI with the information
                              toast({
                                title: "Booking Status",
                                description: `Found ${debugData.bookings.activeCount} active bookings`,
                                variant: "default"
                              });
                              
                              // For each active booking, show details to help with debugging
                              if (debugData.bookings.active && debugData.bookings.active.length > 0) {
                                debugData.bookings.active.forEach((booking: any, index: number) => {
                                  setTimeout(() => {
                                    toast({
                                      title: `Booking ${index + 1} Details`,
                                      description: `ID: ${booking.id.substring(0, 8)}... | Class: ${booking.class.name} | ClassID: ${booking.classId.substring(0, 8)}...`,
                                      variant: "default"
                                    });
                                  }, index * 1000); // Stagger toasts by 1 second
                                });
                                
                                // After showing booking details, refresh classes
                                setTimeout(() => {
                                  fetchData();
                                }, (debugData.bookings.active.length + 1) * 1000);
                              } else {
                                toast({
                                  title: "No Active Bookings",
                                  description: "You don't have any active bookings in the system.",
                                  variant: "default"
                                });
                                
                                // Refresh data anyway
                                fetchData();
                              }
                            } catch (error: any) {
                              console.error("Error checking bookings:", error);
                              toast({
                                title: "Error",
                                description: "Failed to check your bookings. Please try again.",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          Check Booking Status
                        </Button>
                      </div>
                    </div>
                    {classes.filter(cls => cls.isBooked === true).length === 0 ? (
                      <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <CalendarDays className="h-8 w-8 text-white/60" />
                          </div>
                          <h3 className="font-medium text-white text-lg">No upcoming classes</h3>
                          <p className="text-white/70 mt-2 max-w-xs">You don't have any booked fitness classes. Explore available classes to get started.</p>
                          <Button 
                            onClick={() => {
                              router.push('/classes');
                            }} 
                            className="mt-6 bg-white/20 text-white hover:bg-white/30 border border-white/10"
                          >
                            Browse fitness Classes
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 xs:grid-cols-1 sm:grid-cols-2">
                        {classes.filter(cls => cls.isBooked === true).map((cls) => {
                          console.log("Rendering booked class:", cls.id, cls.name, "isBooked:", cls.isBooked, "type:", typeof cls.isBooked);
                          return (
                            <ClassCard
                              key={cls.id}
                              cls={cls}
                              isBooking={false}
                              isUpcoming={true}
                              onCancel={handleCancelBooking}
                              userCanBook={!!userPackage?.active}
                            />
                          );
                        })}
                  </div>
                )}
              </TabsContent>
                  
                  <TabsContent value="available" className="space-y-6 animate-in">
                    <h2 className="text-2xl font-semibold tracking-tight text-white text-center">Available fitness Classes</h2>
                    <p className="text-white/70 text-center mb-4">View available classes below. Click on any class to go to the booking page.</p>
                    {filteredClasses.filter(cls => cls.isBooked !== true).length === 0 ? (
                      <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-8 w-8 text-white/60" />
                          </div>
                          <h3 className="font-medium text-white text-lg">No classes available</h3>
                          <p className="text-white/70 mt-2 max-w-xs">There are currently no available classes. Please check back later or contact the admin.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 grid-cols-1 xs:grid-cols-1 sm:grid-cols-2">
                        {filteredClasses.filter(cls => cls.isBooked !== true).map((cls) => {
                          console.log("Rendering available class:", cls.id, cls.name, "isBooked:", cls.isBooked, "currentBookings:", cls.currentBookings, "capacity:", cls.capacity, "spots left:", Math.max(0, (cls.capacity || 0) - (cls.currentBookings || 0)));
                          return (
                            <ClassCard
                              key={cls.id}
                              cls={cls}
                              isBooking={false}
                              isUpcoming={false}
                              userCanBook={!!(userPackage && userPackage.active && userPackage.classesRemaining > 0)}
                              showBookButton={false}
                              onRedirect={() => {
                                console.log("Redirecting to classes page");
                                router.push('/classes');
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Right column - Membership */}
              <div className="space-y-6">
                    {userPackage ? (
                      <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-all animate-in">
                        <CardHeader className="bg-black/30 border-b border-white/10 pb-4 text-center">
                          <CardTitle className="text-white text-2xl font-bold">Your fitness Membership</CardTitle>
                </CardHeader>
                        <CardContent className="space-y-6 p-6">
                          <div className="rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 p-6 border border-white/10 text-center">
                            <div className="text-3xl font-bold text-white mb-1">{userPackage.name}</div>
                            {/* Show package price based on totalClasses */}
                            <div className="text-lg font-semibold text-white/90 mt-3 px-4 py-2 bg-black/20 rounded-lg border border-white/10">
                              {userPackage.totalClasses === 8 ? (
                                `8 classes / month : €${packages.package8Price}`
                              ) : userPackage.totalClasses === 12 ? (
                                `12 classes / month : €${packages.package12Price}`
                              ) : (
                                `${userPackage.totalClasses} classes / month`
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Classes Remaining</span>
                                <span className="text-sm font-medium text-white">{userPackage.classesRemaining} / {userPackage.totalClasses}</span>
                              </div>
                              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out" 
                                  style={{ width: `${(userPackage.classesRemaining / userPackage.totalClasses) * 100}%` }}
                                ></div>
                      </div>
                    </div>
                            
                    <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Valid until:</span>
                                <span className="text-sm font-medium text-white">{formatValidUntil(userPackage.endDate)}</span>
                          </div>
                        </div>
                          
                        <div className="text-white/60 text-xs text-center italic pt-2">
                          * All classes require payment in cash at the studio.
                  </div>
                        </CardContent>
                      <CardFooter className="bg-black/20 border-t border-white/10 p-6">
                        <Link href="/membership/manage">
                          <Button className="w-full bg-white text-black hover:bg-white/90 font-medium">
                            Manage Membership
                          </Button>
                        </Link>
                  </CardFooter>
                </Card>
                    ) : (
                      <Card className="bg-black/40 backdrop-blur-md border-white/10 overflow-hidden shadow-lg hover:shadow-xl transition-all animate-in">
                        <CardHeader className="bg-black/30 border-b border-white/10 pb-4 text-center">
                          <CardTitle className="text-white text-2xl font-bold">Get Started</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 text-center">
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="bg-white/10 rounded-full p-4 mb-6">
                              <CalendarDays className="h-12 w-12 text-white/80" />
                            </div>
                            <h3 className="text-white text-xl font-medium mb-2">No Active Membership</h3>
                            <p className="text-white/70 max-w-xs mb-6">
                              Purchase a membership plan to start booking fitness classes
                            </p>
                            <Link href="/membership/manage">
                              <Button className="bg-white text-black hover:bg-white/90 font-medium px-6">
                                Purchase Plan
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {userPackage && userPackage.daysRemaining <= 7 && (
                      <Alert className="bg-amber-900/70 backdrop-blur-md border border-amber-500/30 text-white animate-in">
                    <CalendarDays className="h-4 w-4" />
                        <AlertTitle>Membership Expiring Soon</AlertTitle>
                        <AlertDescription className="text-white/90">
                          Your current plan is valid until {formatValidUntil(userPackage.endDate)}. Renew now to continue booking.
                  </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/10 mt-2"
                    onClick={fetchData}
                  >
                    Refresh Class Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent border border-white/20 text-white/70 hover:text-white hover:bg-white/10 mt-2"
                    onClick={async () => {
                      try {
                        toast({
                          title: "Checking Bookings",
                          description: "Fetching your booking data...",
                          variant: "default"
                        });
                        
                        // Fetch detailed booking debug data
                        const response = await fetch('/api/debug/bookings', {
                          headers: {
                            'Cache-Control': 'no-store, must-revalidate',
                            'Pragma': 'no-cache'
                          }
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to fetch bookings');
                        }
                        
                        const debugData = await response.json();
                        console.log('Booking debug data:', debugData);
                        
                        // Update UI with the information
                        toast({
                          title: "Booking Status",
                          description: `Found ${debugData.bookings.activeCount} active bookings`,
                          variant: "default"
                        });
                        
                        // For each active booking, show details to help with debugging
                        if (debugData.bookings.active && debugData.bookings.active.length > 0) {
                          debugData.bookings.active.forEach((booking: any, index: number) => {
                            setTimeout(() => {
                              toast({
                                title: `Booking ${index + 1} Details`,
                                description: `ID: ${booking.id.substring(0, 8)}... | Class: ${booking.class.name} | ClassID: ${booking.classId.substring(0, 8)}...`,
                                variant: "default"
                              });
                            }, index * 1000); // Stagger toasts by 1 second
                          });
                          
                          // After showing booking details, refresh classes
                          setTimeout(() => {
                            fetchData();
                          }, (debugData.bookings.active.length + 1) * 1000);
                        } else {
                          toast({
                            title: "No Active Bookings",
                            description: "You don't have any active bookings in the system.",
                            variant: "default"
                          });
                          
                          // Refresh data anyway
                          fetchData();
                        }
                      } catch (error: any) {
                        console.error("Error checking bookings:", error);
                        toast({
                          title: "Error",
                          description: "Failed to check your bookings. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Debug Bookings
                  </Button>
                </div>
              </div>
            )}
        </main>
      </div>
    </>
  );
}

export default DashboardPage;
