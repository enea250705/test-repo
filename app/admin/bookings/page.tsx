"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  LayoutDashboard, 
  Settings, 
  Users,
  CalendarDays,
  Clock,
  User,
  X,
  MenuIcon,
  Calendar,
  Search,
  Filter,
  Check,
  Mail
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar, MobileMenu, MobileHeader } from "@/app/admin/components/AdminLayout"

// Define interfaces for our data types
interface Booking {
  id: string;
  classId: string;
  className: string;
  classDate: string;
  classTime: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

// Define LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading bookings...</h3>
    </div>
  </div>
);

// BookingCard component to display individual bookings
function BookingCard({ booking }: { booking: Booking }) {
  const bookingDate = new Date(booking.classDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-white text-lg">{booking.className}</CardTitle>
          {booking.status === "active" ? (
            <Badge className="bg-green-500/20 text-white border-green-500/30">
              Active
            </Badge>
          ) : booking.status === "cancelled" ? (
            <Badge className="bg-red-500/20 text-white border-red-500/30">
              Cancelled
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-white border-yellow-500/30">
              {booking.status}
            </Badge>
          )}
        </div>
        <CardDescription className="text-white/70">
          Booking ID: {booking.id.substring(0, 8)}...
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-white/80 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary/80" />
            <span>{bookingDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary/80" />
            <span>{booking.classTime}</span>
          </div>
        </div>
        
        <div className="bg-black/30 rounded p-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-primary/80" />
            <span className="font-medium">{booking.client.name}</span>
          </div>
          <div className="text-white/60 text-xs">
            {booking.client.email}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
        <Link href={`/admin/classes/${booking.classId}`} className="flex-1">
          <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
            View Class
          </Button>
        </Link>
        <Link href={`/admin/clients/${booking.client.id}/bookings`} className="flex-1">
          <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20">
            Client Bookings
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Main page component
export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Background image for better visual appeal
  const bgImage = "/images/gymxam4.webp"

  // Handle auth redirects and fetch data
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user && user.role !== "admin") {
      router.push("/dashboard");
    } else if (user && user.role === "admin") {
      fetchBookings();
      fetchNotificationCount();
    }
  }, [user, router])

  // Fetch all bookings
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/bookings`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      setBookings(data.bookings);
      setFilteredBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Handle search
  useEffect(() => {
    if (bookings.length === 0) return;
    
    let filtered = [...bookings];
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.className.toLowerCase().includes(term) ||
        booking.client.name.toLowerCase().includes(term) ||
        booking.client.email.toLowerCase().includes(term) ||
        booking.id.toLowerCase().includes(term)
      );
    }
    
    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  // Render unauthorized view
  if (user && user.role !== "admin") {
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
        {/* Background image */}
        <div className="fixed inset-0 -z-10">
          <Image 
            src={bgImage}
            alt="Admin background"
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">All Bookings</h1>
            <p className="text-white/70">
              View and manage all class bookings across the system
            </p>
          </div>
          
          {/* Search and filters */}
          <div className="mb-8 space-y-4">
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      className="bg-white/5 border-white/10 text-white pl-10"
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full sm:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2 text-white/50" />
                          <SelectValue placeholder="Filter by status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings list */}
          {filteredBookings.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-white/60" />
                </div>
                <h3 className="font-medium text-white text-lg">No Bookings Found</h3>
                <p className="text-white/70 mt-2 max-w-xs">
                  {searchTerm || statusFilter !== "all" 
                    ? "No bookings match your search criteria. Try adjusting your filters."
                    : "There are no bookings in the system yet."}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 bg-transparent border border-white/20 text-white hover:bg-white/10"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
} 