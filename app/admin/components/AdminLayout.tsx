"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  CalendarDays, 
  Users, 
  LayoutDashboard, 
  Menu as MenuIcon, 
  X,
  User,
  Settings,
  Bell
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LogoutButton } from "@/components/logout-button"

// AdminSidebar component - exported for reuse across all admin pages
export function AdminSidebar({ user, pendingUsers, unreadNotifications }: { user: any, pendingUsers?: any[], unreadNotifications?: number }) {
  const pathname = usePathname()

  console.log('AdminSidebar - unreadNotifications:', unreadNotifications)

  const menuItems = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
      isActive: pathname === "/admin"
    },
    {
      href: "/admin/clients",
      icon: Users,
      label: "Clients",
      isActive: pathname.startsWith("/admin/clients")
    },
    {
      href: "/admin/notifications",
      icon: Bell,
      label: "Notifications",
      isActive: pathname.startsWith("/admin/notifications"),
      badge: unreadNotifications && unreadNotifications > 0 ? unreadNotifications : null
    },
    {
      href: "/admin/pending-users",
      icon: User,
      label: "Pending Users",
      isActive: pathname.startsWith("/admin/pending-users"),
      badge: pendingUsers && pendingUsers.length > 0 ? pendingUsers.length : null
    },
    {
      href: "/admin/settings",
      icon: Settings,
      label: "Settings",
      isActive: pathname.startsWith("/admin/settings")
    }
  ]

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-black/80 backdrop-blur-lg border-r border-white/10 z-50 hidden lg:flex flex-col">
      <div className="flex items-center h-16 px-6 border-b border-white/10">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl tracking-tight text-white">
            <span className="text-primary">Gym</span>Xam
          </span>
        </Link>
      </div>
      
      <nav className="flex-1 py-8 px-4">
        <div className="space-y-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className={`flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
                  item.isActive 
                    ? "text-white bg-white/10" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 mr-3 ${item.isActive ? "text-primary" : "text-white/50"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center mb-4 pb-4 border-b border-white/10">
          <Avatar className="border-2 border-white/20 h-10 w-10">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-white/60">{user?.email || 'admin@example.com'}</p>
          </div>
        </div>
        <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
      </div>
    </aside>
  );
}

// MobileHeader component - exported for reuse across all admin pages
export function MobileHeader({ user, setIsMobileMenuOpen }: { user: any, setIsMobileMenuOpen: (open: boolean) => void }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md lg:hidden">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <span className="font-montserrat font-bold text-xl text-white">
            <span className="text-primary">Gym</span>Xam
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
            Admin
          </Badge>
          <Avatar className="border-2 border-white/20 h-9 w-9">
            <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
          </Avatar>
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="rounded-md p-2 text-white hover:bg-white/10"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// MobileMenu component - exported for reuse across all admin pages
export function MobileMenu({ isOpen, onClose, user, pendingUsers, unreadNotifications }: { isOpen: boolean, onClose: () => void, user: any, pendingUsers?: any[], unreadNotifications?: number }) {
  const pathname = usePathname()

  console.log('MobileMenu - unreadNotifications:', unreadNotifications)

  const menuItems = [
    {
      href: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
      isActive: pathname === "/admin"
    },
    {
      href: "/admin/clients",
      icon: Users,
      label: "Clients",
      isActive: pathname.startsWith("/admin/clients")
    },
    {
      href: "/admin/notifications",
      icon: Bell,
      label: "Notifications",
      isActive: pathname.startsWith("/admin/notifications"),
      badge: unreadNotifications && unreadNotifications > 0 ? unreadNotifications : null
    },
    {
      href: "/admin/pending-users",
      icon: User,
      label: "Pending Users",
      isActive: pathname.startsWith("/admin/pending-users"),
      badge: pendingUsers && pendingUsers.length > 0 ? pendingUsers.length : null
    },
    {
      href: "/admin/settings",
      icon: Settings,
      label: "Settings",
      isActive: pathname.startsWith("/admin/settings")
    }
  ]

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute right-0 top-0 h-full w-3/4 max-w-xs bg-black border-l border-white/10 p-6 shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-8">
          <span className="font-montserrat font-bold text-lg text-white">
            <span className="text-primary">Gym</span>Xam
          </span>
          <button onClick={onClose} className="rounded-full p-1 text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center">
            <Avatar className="border-2 border-white/20 h-12 w-12">
              <AvatarFallback className="bg-primary/30 text-white">{user?.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="font-medium text-white">{user?.name || 'Admin'}</p>
              <p className="text-sm text-white/60">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between py-3 ${
                  item.isActive 
                    ? "text-white" 
                    : "text-white/80 hover:text-white"
                }`}
                onClick={onClose}
              >
                <div className="flex items-center">
                  <Icon className={`h-5 w-5 mr-3 ${item.isActive ? "text-primary" : "text-white/50"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge variant="outline" className="bg-primary/20 border-primary/30 text-white">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="absolute bottom-8 left-0 w-full px-6">
          <LogoutButton variant="ghost" className="w-full justify-center text-white hover:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

// Complete admin layout wrapper component
export function AdminLayout({ 
  children, 
  user, 
  pendingUsers = [],
  unreadNotifications = 0
}: { 
  children: React.ReactNode, 
  user: any, 
  pendingUsers?: any[],
  unreadNotifications?: number
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />
      <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        user={user} 
        pendingUsers={pendingUsers}
        unreadNotifications={unreadNotifications}
      />
      
      <div className="lg:ml-64">
        <main className="min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 