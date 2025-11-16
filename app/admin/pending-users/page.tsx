"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  LayoutDashboard, 
  Users,
  MenuIcon,
  X,
  Mail,
  Calendar,
  User,
  Check,
  AlertTriangle,
  Clock,
  XCircle
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth"
import { LogoutButton } from "@/components/logout-button"
import Link from "next/link"
import { AdminSidebar, MobileMenu, MobileHeader } from "@/app/admin/components/AdminLayout"

// LoadingIndicator component
const LoadingIndicator = () => (
  <div className="flex h-full w-full items-center justify-center py-10">
    <div className="flex flex-col items-center">
      <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
      <h3 className="mt-4 text-base font-medium text-foreground/70">Loading...</h3>
    </div>
  </div>
);

interface PendingUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function AdminPendingUsersPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Background image selection
  const bgImage = "/images/gymxam4.webp" 

  // Handle auth redirects with useEffect
  useEffect(() => {
    if (user === null) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    } else {
      fetchPendingUsers();
      fetchNotificationCount();
    }
  }, [user, router]);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/pending-users', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
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
    } finally {
      setIsLoading(false);
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
        <AdminSidebar user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />
        
        {/* Mobile header */}
        <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        
        {/* Mobile menu */}
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />

        {/* Main content */}
        <main className="flex-1 container max-w-6xl mx-auto lg:pl-64 py-8 px-4 relative z-10">
          {/* Page header */}
          <div className="border-b border-white/10 pb-6 mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Pending User Approval
            </h1>
            <p className="text-white/60">Review and approve new user registrations</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={fetchPendingUsers}
              variant="outline"
              className="bg-transparent border border-white/20 text-white hover:bg-white/10"
            >
              Refresh Users
            </Button>
          </div>

          {isLoading ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-6">
              {pendingUsers.length === 0 ? (
                <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
                  <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-white/60" />
                    </div>
                    <h3 className="font-medium text-white text-lg">All caught up!</h3>
                    <p className="text-white/70 mt-2 max-w-xs">There are no pending user registrations that need approval.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingUsers.map((pendingUser) => (
                    <Card key={pendingUser.id} className="bg-black/40 backdrop-blur-md border-white/10 shadow-lg hover:shadow-xl transition-all">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="border-2 border-white/20 h-12 w-12">
                                <AvatarFallback className="bg-primary/30 text-white">{pendingUser.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-white text-xl">{pendingUser.name}</h3>
                                <div className="flex items-center text-sm text-white/70">
                                  <Mail className="mr-1.5 h-4 w-4" />
                                  <span>{pendingUser.email}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-white/60">
                              <div className="flex items-center">
                                <Clock className="mr-1.5 h-4 w-4" />
                                <span>Registered: {new Date(pendingUser.createdAt).toLocaleString()}</span>
                              </div>
                              <span>ID: {pendingUser.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-3 sm:items-end">
                            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                              Pending Approval
                            </Badge>
                            <Button 
                              onClick={() => handleApproveUser(pendingUser.id)}
                              className="bg-primary hover:bg-primary/90 text-white"
                            >
                              <Check className="mr-2 h-4 w-4" /> Approve User
                            </Button>
                            <Button 
                              onClick={() => handleDeclineUser(pendingUser.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Decline User
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
} 