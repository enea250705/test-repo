'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, X, CalendarDays, Clock, AlertTriangle, Check } from 'lucide-react';
import Link from 'next/link';
import { formatValidUntil } from '@/lib/package-dates';

interface BookedClass {
  id: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  canCancel: boolean;
  cancellationDeadline?: string;
}

interface UserPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  endDate: string;
  active: boolean;
}

export default function CancelMembershipPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bookedClasses, setBookedClasses] = useState<BookedClass[]>([]);
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingClass, setCancellingClass] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch booked classes
      const classesResponse = await fetch('/api/bookings');
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setBookedClasses(classesData.map((booking: any) => {
          // Get the date and time from the booking data
          const rawDate = booking.class?.date || booking.date;
          const rawTime = booking.class?.time || booking.time;
          
          console.log('Raw date:', rawDate, 'Raw time:', rawTime);
          
          // More robust date parsing
          let classDateTime;
          
          try {
            // If rawDate is already a Date object or a valid date string
            const baseDate = new Date(rawDate);
            
            // Check if the date is valid
            if (isNaN(baseDate.getTime())) {
              throw new Error('Invalid date');
            }
            
            // Create a new date object to avoid modifying the original
            classDateTime = new Date(baseDate);
            
            // Parse and set the time if available
            if (rawTime && typeof rawTime === 'string') {
              const timeParts = rawTime.split(':');
              if (timeParts.length >= 2) {
                const hours = parseInt(timeParts[0], 10);
                const minutes = parseInt(timeParts[1], 10);
                
                if (!isNaN(hours) && !isNaN(minutes)) {
                  classDateTime.setHours(hours, minutes, 0, 0);
                }
              }
            }
          } catch (error) {
            console.error('Date parsing error:', error);
            // Fallback: create a future date so canCancel becomes false
            classDateTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
          }
          
          console.log('Final class datetime:', classDateTime);
          
          // Calculate deadline (8 hours before class)
          const cancellationDeadline = new Date(classDateTime.getTime() - 8 * 60 * 60 * 1000);
          const now = new Date();
          
          // Check if the deadline is valid
          const isValidDeadline = !isNaN(cancellationDeadline.getTime());
          const canCancel = isValidDeadline && now < cancellationDeadline;
          
          console.log('Cancellation deadline:', cancellationDeadline);
          console.log('Is valid deadline:', isValidDeadline);
          console.log('Current time:', now);
          console.log('Can cancel?', canCancel);
          
          return {
            ...booking,
            className: booking.class?.name || booking.className,
            date: booking.class?.date || booking.date,
            time: booking.class?.time || booking.time,
            canCancel: canCancel,
            cancellationDeadline: isValidDeadline ? cancellationDeadline.toLocaleString() : 'Invalid Date'
          };
        }));
      }

      // Fetch user package
      const packageResponse = await fetch('/api/packages/current', { cache: 'no-store' });
      if (packageResponse.ok) {
        const packageData = await packageResponse.json();
        setUserPackage(packageData.package ?? null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load membership data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClass = async (classId: string) => {
    if (!user) return;
    
    try {
      setCancellingClass(classId);
      
      const response = await fetch('/api/bookings/cancel-by-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }
      
      toast({
        title: "Booking Cancelled",
        description: "Your class booking has been cancelled and a credit has been returned to your account.",
        variant: "default"
      });
      
      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel booking",
        variant: "destructive"
      });
    } finally {
      setCancellingClass(null);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedClasses.size === 0) return;
    
    try {
      const promises = Array.from(selectedClasses).map(classId => 
        fetch('/api/bookings/cancel-by-class', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ classId }),
        })
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Bookings Cancelled",
        description: `${selectedClasses.size} class bookings have been cancelled and credits returned to your account.`,
        variant: "default"
      });
      
      setSelectedClasses(new Set());
      fetchData();
      
    } catch (error) {
      console.error('Error with bulk cancellation:', error);
      toast({
        title: "Error",
        description: "Some bookings could not be cancelled. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleClassSelection = (classId: string) => {
    const newSelection = new Set(selectedClasses);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClasses(newSelection);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-primary border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70">Loading membership data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cancellableClasses = bookedClasses.filter(cls => cls.canCancel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Cancel Bookings</h1>
            <p className="text-white/70 mt-1">Manage your class bookings and cancellations</p>
          </div>
        </div>

        {/* Membership Overview */}
        {userPackage && (
          <Card className="bg-black/40 backdrop-blur-md border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Current Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold text-white">{userPackage.classesRemaining}</p>
                  <p className="text-white/70 text-sm">Classes Remaining</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <p className="text-2xl font-bold text-white">{formatValidUntil(userPackage.endDate)}</p>
                  <p className="text-white/70 text-sm">Valid until</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Badge variant={userPackage.active ? "default" : "destructive"} className="text-sm">
                    {userPackage.active ? "Active" : "Expired"}
                  </Badge>
                  <p className="text-white/70 text-sm mt-1">{userPackage.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Policy */}
        <Alert className="bg-amber-900/30 border-amber-500/30 mb-8">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200">
            <strong>Cancellation Policy:</strong> Classes can only be cancelled at least 8 hours before the scheduled start time. 
            Cancelled classes will return a credit to your membership account.
          </AlertDescription>
        </Alert>

        {/* Bulk Actions */}
        {cancellableClasses.length > 0 && (
          <div className="flex items-center justify-between bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-4">
              <p className="text-white/70">
                {selectedClasses.size > 0 ? `${selectedClasses.size} selected` : 'Select classes to cancel multiple bookings'}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedClasses.size > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedClasses(new Set())}
                    className="text-white/70 hover:text-white"
                  >
                    Clear Selection
                  </Button>
                  <Button
                    onClick={handleBulkCancel}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30"
                    size="sm"
                  >
                    Cancel Selected ({selectedClasses.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Booked Classes */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Your Booked Classes</h2>
          
          {bookedClasses.length === 0 ? (
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardContent className="p-8 text-center">
                <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <Check className="h-8 w-8 text-white/60 mx-auto" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">No Booked Classes</h3>
                <p className="text-white/70 mb-6">You don't have any upcoming class bookings to cancel.</p>
                <Link href="/classes">
                  <Button className="bg-primary hover:bg-primary/90">
                    Browse Classes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookedClasses.map((booking) => (
                <Card key={booking.id} className={`bg-black/40 backdrop-blur-md border-white/10 transition-all ${
                  selectedClasses.has(booking.classId) ? 'ring-2 ring-primary/50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {booking.canCancel && (
                          <input
                            type="checkbox"
                            checked={selectedClasses.has(booking.classId)}
                            onChange={() => toggleClassSelection(booking.classId)}
                            className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-white text-lg font-semibold mb-2">{booking.className}</h3>
                          <div className="flex flex-wrap gap-4 text-white/70 text-sm mb-4">
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-1.5" />
                              {new Date(booking.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1.5" />
                              {booking.time}
                            </div>
                          </div>
                          
                          {!booking.canCancel && (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-md p-3 mb-4">
                              <p className="text-red-200 text-sm">
                                <strong>Cannot Cancel:</strong> Cancellation deadline passed. 
                                Classes must be cancelled at least 8 hours before start time.
                              </p>
                              {booking.cancellationDeadline && (
                                <p className="text-red-200/70 text-xs mt-1">
                                  Deadline was: {booking.cancellationDeadline}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge variant={booking.canCancel ? "default" : "destructive"}>
                          {booking.canCancel ? "Can Cancel" : "Too Late"}
                        </Badge>
                        
                        {booking.canCancel && (
                          <Button
                            onClick={() => handleCancelClass(booking.classId)}
                            disabled={cancellingClass === booking.classId}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30"
                            size="sm"
                          >
                            {cancellingClass === booking.classId ? (
                              <span className="flex items-center gap-1.5">
                                <div className="h-3 w-3 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                                Cancelling...
                              </span>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Link href={`/classes/${booking.classId}`}>
                          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/bookings">
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                View All Bookings
              </Button>
            </Link>
            <Link href="/classes">
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                Browse Classes
              </Button>
            </Link>
            <Link href="/membership/manage">
              <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                Manage Membership
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}