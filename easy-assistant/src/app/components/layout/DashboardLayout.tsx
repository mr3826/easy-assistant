import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  Users, 
  Briefcase, 
  Clock, 
  Share2, 
  Bot, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { LanguageSwitcher, useI18n } from '../../i18n';

interface DashboardLayoutProps {
  children: ReactNode;
}

const menuItems: Array<{ icon: LucideIcon; labelKey: string; path: string }> = [
  { icon: LayoutDashboard, labelKey: 'nav.home', path: '/dashboard' },
  { icon: Calendar, labelKey: 'nav.bookings', path: '/appointments' },
  { icon: MessageSquare, labelKey: 'nav.chats', path: '/conversations' },
  { icon: Briefcase, labelKey: 'nav.services', path: '/services' },
  { icon: Users, labelKey: 'nav.team', path: '/staff' },
  { icon: Clock, labelKey: 'nav.hours', path: '/availability' },
  { icon: Share2, labelKey: 'nav.whatsapp', path: '/channels' },
  { icon: Bot, labelKey: 'nav.assistant', path: '/ai-settings' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, session } = useAuth();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = session?.user ?? null;
  const userLabel = user?.name?.trim() || user?.email?.trim() || t('common.account');
  const userInitials = getInitials(user?.name || user?.email || t('common.account'));

  const handleLogout = () => {
    void logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">{t('app.title')}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label={t('common.closeSidebar')}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
              <Link to="/privacy" className="hover:text-blue-600 hover:underline" onClick={() => setSidebarOpen(false)}>
                {t('common.privacy')}
              </Link>
              <span aria-hidden="true">|</span>
              <Link to="/terms" className="hover:text-blue-600 hover:underline" onClick={() => setSidebarOpen(false)}>
                {t('common.terms')}
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label={t('common.openSidebar')}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <p className="hidden text-sm font-medium text-gray-700 sm:block">
                {t('dashboard.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" aria-label={t('common.accountMenu')}>
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-slate-900 text-white">{userInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{userLabel}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('nav.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate('/settings')}>{t('common.account')}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  const parts = String(value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return 'A';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}
