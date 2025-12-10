import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  LogOut,
  Menu,
  X,
  Building2,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo_petit.png';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mandataireNavItems = [
    { href: '/mandataire', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/mandataire/operations', label: 'Mes opérations', icon: FileCheck },
  ];

  const comptableNavItems = [
    { href: '/comptable', label: 'Accueil', icon: LayoutDashboard },
    { href: '/comptable/campagnes', label: 'Campagnes', icon: Building2 },
    { href: '/comptable/gestion', label: 'Gestion', icon: FileCheck },
  ];

  const candidatNavItems = [
    { href: '/candidat', label: 'Tableau de bord', icon: LayoutDashboard },
  ];

  const getNavItems = () => {
    if (hasRole('comptable')) return comptableNavItems;
    if (hasRole('candidat')) return candidatNavItems;
    return mandataireNavItems;
  };

  const navItems = getNavItems();

  const getCurrentRole = () => {
    if (hasRole('comptable')) return 'Expert-Comptable';
    if (hasRole('candidat')) return 'Candidat';
    if (hasRole('mandataire')) return 'Mandataire';
    return 'Utilisateur';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Campagn'expert" className="h-14 w-auto brightness-0 invert" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary-foreground/20"
                    : "hover:bg-primary-foreground/10"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary-foreground/10">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <User size={16} className="text-accent-foreground" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.prenom || ''} {user?.nom || ''}</p>
                  <p className="text-xs opacity-75">{getCurrentRole()}</p>
                </div>
                <ChevronDown size={16} className="opacity-75" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                {user?.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut size={16} className="mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur animate-fade-in">
          <nav className="container py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}
