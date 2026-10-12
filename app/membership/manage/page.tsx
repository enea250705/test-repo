'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  CalendarDays, 
  Clock, 
  CreditCard, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Crown,
  Package,
  History
} from 'lucide-react';
import Link from 'next/link';
import { formatValidUntil } from '@/lib/package-dates';

interface UserPackage {
  id: string;
  name: string;
  classesRemaining: number;
  totalClasses: number;
  startDate: string;
  endDate: string;
  active: boolean;
  price?: number;
}

interface PackageOption {
  id: string;
  name: string;
  classes: number;
  price: number;
  popular?: boolean;
  description: string;
}

interface UsageStats {
  totalClassesBooked: number;
  totalClassesAttended: number;
  totalClassesMissed: number;
  attendanceRate: number;
  favoriteClassTime: string;
  memberSince: string;
}

interface BookingHistory {
  id: string;
  className: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled' | 'no-show';
}

export default function ManageMembershipPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userPackage, setUserPackage] = useState<UserPackage | null>(null);
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch package prices
      let prices: { package8Price?: string; package12Price?: string } = {};
      const optionsResponse = await fetch('/api/packages/prices');
      if (optionsResponse.ok) {
        prices = (await optionsResponse.json()).prices ?? {};
      }
      const optionsData = {
        package8Price: Number(prices.package8Price ?? 120),
        package12Price: Number(prices.package12Price ?? 160),
      };

      // Fetch user package
      const packageResponse = await fetch('/api/packages/current', { cache: 'no-store' });
      if (packageResponse.ok) {
        const { package: pkg } = await packageResponse.json();
        setUserPackage(pkg ? {
          ...pkg,
          price: pkg.totalClasses === 8 ? optionsData.package8Price
            : pkg.totalClasses === 12 ? optionsData.package12Price
            : undefined,
        } : null);
      }

      setPackageOptions([
        {
          id: '8',
          name: '8 Classes Package',
          classes: 8,
          price: optionsData.package8Price,
          description: 'Perfect for getting started with 2 classes per week'
        },
        {
          id: '12',
          name: '12 Classes Package',
          classes: 12,
          price: optionsData.package12Price,
          popular: true,
          description: 'Most popular! Ideal for 3 classes per week'
        }
      ]);

      // Fetch usage stats
      const statsResponse = await fetch('/api/user-stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUsageStats(statsData);
      }

      // Fetch booking history
      const historyResponse = await fetch('/api/bookings/history');
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBookingHistory(historyData);
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

  const handlePurchasePackage = async (packageId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a package.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsPurchasing(true);
      
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType: packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to purchase package');
      }

      toast({
        title: "Package Purchased Successfully!",
        description: `Your ${packageId} classes package has been activated.`,
        variant: "default"
      });

      // Refresh data
      fetchData();
      
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to purchase package",
        variant: "destructive"
      });
    } finally {
      setIsPurchasing(false);
    }
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

  const progressPercentage = userPackage 
    ? ((userPackage.totalClasses - userPackage.classesRemaining) / userPackage.totalClasses) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Membership</h1>
            <p className="text-white/70 mt-1">Review and manage your fitness membership</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/40 backdrop-blur-md border border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="plans" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Plans & Pricing
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Usage Stats
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Current Membership Card */}
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Current Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {userPackage ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <p className="text-3xl font-bold text-white">{userPackage.classesRemaining}</p>
                        <p className="text-white/70 text-sm">Classes Left</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-white">{formatValidUntil(userPackage.endDate)}</p>
                        <p className="text-white/70 text-sm">Valid until</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <Badge variant={userPackage.active ? "default" : "destructive"} className="mb-2">
                          {userPackage.active ? "Active" : "Expired"}
                        </Badge>
                        <p className="text-white/70 text-sm">{userPackage.name}</p>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-white">{userPackage.price != null ? `€${userPackage.price}` : '—'}</p>
                        <p className="text-white/70 text-sm">Paid</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Progress</span>
                        <span className="text-white">{userPackage.totalClasses - userPackage.classesRemaining} / {userPackage.totalClasses} classes used</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Purchase Date:</span>
                        <span className="text-white">{formatValidUntil(userPackage.startDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Valid until:</span>
                        <span className="text-white">{formatValidUntil(userPackage.endDate)}</span>
                      </div>
                    </div>

                    {new Date(userPackage.endDate).getTime() - Date.now() <= 7 * 24 * 60 * 60 * 1000 && userPackage.active && (
                      <Alert className="bg-amber-900/30 border-amber-500/30">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <AlertTitle className="text-amber-200">Membership Expiring Soon</AlertTitle>
                        <AlertDescription className="text-amber-200/90">
                          Your membership is valid until {formatValidUntil(userPackage.endDate)}. Renew now to continue enjoying classes.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <Package className="h-8 w-8 text-white/60 mx-auto" />
                    </div>
                    <h3 className="text-white text-lg font-medium mb-2">No Active Membership</h3>
                    <p className="text-white/70 mb-6">Get started with a membership plan to book classes.</p>
                    <Button 
                      onClick={() => setActiveTab('plans')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-6 text-center">
                  <CalendarDays className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">Book Classes</h3>
                  <p className="text-white/70 text-sm mb-4">Browse and book upcoming classes</p>
                  <Link href="/classes">
                    <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                      Browse Classes
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">My Bookings</h3>
                  <p className="text-white/70 text-sm mb-4">View and manage your bookings</p>
                  <Link href="/bookings">
                    <Button variant="outline" className="bg-transparent border-white/20 text-white hover:bg-white/10">
                      View Bookings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">Cancel Bookings</h3>
                  <p className="text-white/70 text-sm mb-4">Cancel your class bookings</p>
                  <Link href="/membership/cancel">
                    <Button variant="outline" className="bg-transparent border-red-500/20 text-red-200 hover:bg-red-500/10 border-red-500/30">
                      Manage Cancellations
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Plans & Pricing Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {packageOptions.map((pkg) => (
                <Card key={pkg.id} className={`bg-black/40 backdrop-blur-md border-white/10 relative ${
                  pkg.popular ? 'ring-2 ring-primary/50' : ''
                }`}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-white">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-white text-2xl">{pkg.name}</CardTitle>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-4xl font-bold text-white">€{pkg.price}</span>
                      <span className="text-white/70">/ month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-white/70">{pkg.description}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        {pkg.classes} classes per month
                      </div>
                      <div className="flex items-center text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Valid for 30 days
                      </div>
                      <div className="flex items-center text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Cancel bookings up to 8 hours before
                      </div>
                      <div className="flex items-center text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Premium class access
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handlePurchasePackage(pkg.id)}
                      disabled={isPurchasing}
                      className={`w-full ${
                        pkg.popular 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                    >
                      {isPurchasing ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin"></div>
                          Purchasing...
                        </span>
                      ) : (
                        userPackage && userPackage.active ? 'Renew Plan' : 'Choose Plan'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Alert className="bg-blue-900/30 border-blue-500/30">
              <CreditCard className="h-4 w-4 text-blue-400" />
              <AlertTitle className="text-blue-200">Payment Information</AlertTitle>
              <AlertDescription className="text-blue-200/90">
                All classes require payment in cash at the studio. Your membership package provides booking credits only.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Usage Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            {usageStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Class Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-white">{usageStats.totalClassesBooked}</p>
                        <p className="text-white/70 text-sm">Total Booked</p>
                      </div>
                      <div className="text-center p-3 bg-white/5 rounded-lg">
                        <p className="text-2xl font-bold text-green-400">{usageStats.totalClassesAttended}</p>
                        <p className="text-white/70 text-sm">Attended</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">Attendance Rate</span>
                        <span className="text-white">{usageStats.attendanceRate}%</span>
                      </div>
                      <Progress value={usageStats.attendanceRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-md border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Membership Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/70">Member Since:</span>
                        <span className="text-white">{new Date(usageStats.memberSince).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Favorite Time:</span>
                        <span className="text-white">{usageStats.favoriteClassTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Classes Missed:</span>
                        <span className="text-red-400">{usageStats.totalClassesMissed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-black/40 backdrop-blur-md border-white/10">
                <CardContent className="p-8 text-center">
                  <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white/60 mx-auto" />
                  </div>
                  <h3 className="text-white text-lg font-medium mb-2">No Usage Data</h3>
                  <p className="text-white/70">Start booking and attending classes to see your stats here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Booking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {bookingHistory.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            booking.status === 'completed' ? 'bg-green-400' :
                            booking.status === 'cancelled' ? 'bg-red-400' :
                            'bg-yellow-400'
                          }`} />
                          <div>
                            <h4 className="text-white font-medium">{booking.className}</h4>
                            <p className="text-white/70 text-sm">
                              {new Date(booking.date).toLocaleDateString()} at {booking.time}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          booking.status === 'completed' ? 'default' :
                          booking.status === 'cancelled' ? 'destructive' :
                          'secondary'
                        }>
                          {booking.status === 'completed' ? 'Completed' :
                           booking.status === 'cancelled' ? 'Cancelled' :
                           'No Show'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-white/10 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                      <History className="h-8 w-8 text-white/60 mx-auto" />
                    </div>
                    <h3 className="text-white text-lg font-medium mb-2">No Booking History</h3>
                    <p className="text-white/70">Your booking history will appear here once you start attending classes.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}