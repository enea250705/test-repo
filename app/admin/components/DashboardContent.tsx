"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Calendar, 
  Users, 
  PlusCircle, 
  Clock, 
  AlertTriangle,
  Dumbbell,
  Bell,
  ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Define types for the client data
interface Client {
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

// Define types for the class data
interface ClassItem {
  id: string;
  title: string;
  time: string;
  date: string;
  instructor: string;
  capacity: number;
  bookings: number;
}

// Define types for notifications
interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// LoadingIndicator component
function LoadingIndicator() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function DashboardContent() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch classes, clients, and notifications
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch classes
        const classesResponse = await fetch('/api/admin/classes');
        const classesData = await classesResponse.json();
        
        // Fetch clients
        const clientsResponse = await fetch('/api/admin/clients');
        const clientsData = await clientsResponse.json();
        
        // Fetch recent notifications
        const notificationsResponse = await fetch('/api/admin/notifications?limit=5');
        const notificationsData = await notificationsResponse.json();
        
        // Fetch unread count
        const unreadResponse = await fetch('/api/admin/notifications?unreadOnly=true');
        const unreadData = await unreadResponse.json();
        
        setClasses(classesData.classes || []);
        setClients(clientsData.clients || []);
        setRecentNotifications(notificationsData.notifications || []);
        setUnreadNotifications(unreadData.unreadCount || 0);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Notifications Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-xl overflow-hidden md:col-span-2 lg:col-span-3">
          <CardHeader className="border-b border-white/10 bg-black/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Recent Class Cancellations
              </CardTitle>
              {unreadNotifications > 0 && (
                <Badge className="bg-primary text-black">
                  {unreadNotifications} unread
                </Badge>
              )}
            </div>
            <CardDescription className="text-white/70">
              Track when clients cancel their class bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/70">No cancellation notifications yet</p>
                <p className="text-white/50 text-sm">Notifications will appear here when clients cancel classes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                      notification.read
                        ? 'bg-white/5 border-white/10'
                        : 'bg-primary/10 border-primary/20'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                        <span className="text-xs text-white/60">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white text-sm">{notification.message}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <Link href="/admin/notifications">
                    <Button variant="outline" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
                      View All Notifications
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-black/50 p-1 rounded-lg border border-white/10 mx-auto flex justify-center w-full max-w-full sm:max-w-md overflow-x-auto">
            <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[90px] text-xs sm:text-sm whitespace-nowrap">
              CrossFit Classes
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[90px] text-xs sm:text-sm whitespace-nowrap">
              Manage Clients
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-black text-white rounded-md flex-1 min-w-[90px] text-xs sm:text-sm whitespace-nowrap">
              Year Schedule
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CrossFit Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-xl hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Upcoming Classes
                </CardTitle>
                <CardDescription className="text-white/70">
                  Next scheduled CrossFit sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <div className="space-y-3">
                    {classes.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-white/70">No upcoming CrossFit classes found</p>
                      </div>
                    ) : (
                      classes.slice(0, 3).map((classItem) => (
                        <div key={classItem.id} className="bg-black/30 border border-white/10 rounded-lg p-3 hover:border-white/20 transition-all group">
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium text-white group-hover:text-primary transition-colors">{classItem.title}</h4>
                            <Badge variant="outline" className="bg-primary/20 text-white border-primary/30">
                              {classItem.bookings}/{classItem.capacity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center text-white/70 text-sm">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              <span>{classItem.date}</span>
                            </div>
                            <div className="flex items-center text-white/70 text-sm">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span>{classItem.time}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="pt-2">
                      <Link href="/admin/classes">
                        <Button variant="outline" className="w-full bg-black/30 border-white/20 text-white hover:bg-white/10">
                          View All Classes
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-xl hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Client Overview
                </CardTitle>
                <CardDescription className="text-white/70">
                  Client registrations and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingIndicator />
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-semibold text-white">{clients.length}</p>
                        <p className="text-sm text-white/70">Total Clients</p>
                      </div>
                      <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-center">
                        <p className="text-2xl font-semibold text-white">{clients.filter(c => c.package).length}</p>
                        <p className="text-sm text-white/70">Active Members</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Link href="/admin/clients">
                        <Button variant="outline" className="w-full bg-black/30 border-white/20 text-white hover:bg-white/10">
                          Manage Clients
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-black/40 backdrop-blur-md border-white/10 shadow-xl hover:shadow-lg transition-all sm:col-span-2 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-white/70">
                  Manage classes and clients quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/admin/classes?action=create">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white mb-2">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create New Class
                    </Button>
                  </Link>
                  
                  <Link href="/admin/email-test">
                    <Button variant="outline" className="w-full bg-black/30 border-white/20 text-white hover:bg-white/10">
                      Test Email System
                    </Button>
                  </Link>
                  
                  <Link href="/admin/settings">
                    <Button variant="outline" className="w-full bg-black/30 border-white/20 text-white hover:bg-white/10">
                      System Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manage Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
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
              ) :
                clients.slice(0, 5).map((client) => (
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
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-white">No active membership package</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex sm:flex-col gap-2 mt-4 sm:mt-0">
                          <Link href={`/admin/clients/${client.id}`}>
                            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10 w-full">View Profile</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
              
              <div className="pt-2">
                <Link href="/admin/clients">
                  <Button variant="outline" className="w-full bg-black/30 border-white/20 text-white hover:bg-white/10">
                    View All Clients
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="border-white/10 bg-black/40 backdrop-blur-md shadow-xl overflow-hidden">
            <CardHeader className="border-b border-white/10 bg-black/30">
              <CardTitle className="text-white">Annual Schedule</CardTitle>
              <CardDescription className="text-white/70">
                Plan and manage your CrossFit class schedule for the year
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <Link href="/admin/classes">
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Manage Class Schedule
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 