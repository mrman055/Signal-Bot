import { Link, useLocation } from "wouter";
import { 
  Activity, 
  LayoutDashboard, 
  Star,
  Settings,
  Menu,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/watchlist", icon: Star, label: "Watchlist" },
  ];

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background dark text-foreground overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg tracking-tight uppercase">SignalBot</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                  location === item.href || (location.startsWith("/signals") && item.href === "/")
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
            <span className="text-sm">Settings</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight uppercase">SignalBot</span>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Topbar - Desktop */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-mono">System Status: <span className="text-primary">Online</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-medium">
              TR
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
