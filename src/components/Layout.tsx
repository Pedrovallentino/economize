import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  SidebarProvider, 
  SidebarTrigger, 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { 
  Home, 
  Wallet, 
  TrendingUp, 
  Target, 
  PiggyBank, 
  LogOut,
  User
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * Componente de sidebar da aplicação
 */
function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  const currentPath = location.pathname;

  const menuItems = [
    { title: 'Dashboard', url: '/', icon: Home },
    { title: 'Carteiras', url: '/carteiras', icon: Wallet },
    { title: 'Movimentações', url: '/movimentacoes', icon: TrendingUp },
    { title: 'Metas Financeiras', url: '/metas', icon: Target },
    { title: 'Caixinhas de Poupança', url: '/caixinhas', icon: PiggyBank },
  ];

  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Seção do usuário */}
        <div className="mt-auto p-2 border-t">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <div className="flex items-center gap-2 p-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground truncate">
                        {user?.email}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </Button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

/**
 * Componente de layout principal da aplicação
 * @returns JSX do layout
 */
export default function Layout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Header global com trigger do sidebar */}
        <header className="fixed top-0 left-0 right-0 h-12 flex items-center border-b bg-background z-50">
          <SidebarTrigger className="ml-2" />
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-lg font-semibold">Economize</h1>
          </div>
        </header>

        <div className="flex min-h-screen w-full pt-12">
          <AppSidebar />
          
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}