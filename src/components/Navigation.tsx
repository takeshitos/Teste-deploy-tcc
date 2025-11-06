import { Link, useNavigate, NavLink as RouterNavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import rccLogo from "@/assets/logo_rcc.png";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Menu } from "lucide-react"; // Import Menu icon
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Import Sheet components

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Check if the user has 'admin' or 'coordenador' role
  const isAdminOrCoordenador = profile?.role === 'admin' || profile?.role === 'coordenador';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-xl font-medium hover:opacity-80 transition-opacity",
      isActive && "border-b-2 border-current" // Adiciona sublinhado se o link estiver ativo
    );

  // Mobile nav link class - slightly different styling for vertical menu
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "block px-4 py-2 text-lg font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
      isActive && "bg-accent text-accent-foreground"
    );

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50 h-20 flex items-center justify-between">
      {/* Logo da Aplicação - LEFT */}
      <Link to="/" className="flex items-center gap-3 h-full bg-white px-4 rounded-r-lg hover:opacity-90 transition-opacity">
        <img src={rccLogo} alt="RCC Logo" className="h-16 w-auto" />
      </Link>
      
      {/* Desktop Navigation Links - CENTER (hidden on small screens) */}
      <div className="hidden md:flex flex-grow justify-center items-center gap-6">
        <RouterNavLink to="/" className={navLinkClass}>
          Início
        </RouterNavLink>
        <RouterNavLink to="/eventos" className={navLinkClass}>
          Eventos
        </RouterNavLink>
        <RouterNavLink to="/grupos-oracao" className={navLinkClass}>
          Grupos de Oração
        </RouterNavLink>
        
        {user && (
          <RouterNavLink to="/perfil" className={navLinkClass}>
            Perfil
          </RouterNavLink>
        )}

        {isAdminOrCoordenador && (
          <>
            <RouterNavLink to="/admin/gerenciar-publicacoes" className={navLinkClass}>
              Gerenciar Publicações
            </RouterNavLink>
            <RouterNavLink to="/admin/criar-evento" className={navLinkClass}>
              Criar Evento
            </RouterNavLink>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu - LEFT (visible on small screens) */}
      <div className="md:hidden flex items-center ml-4"> {/* Added ml-4 for spacing */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground"> {/* Changed text color for icon */}
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-background text-foreground">
            <div className="flex flex-col gap-2 pt-6">
              <RouterNavLink to="/" className={mobileNavLinkClass}>
                Início
              </RouterNavLink>
              <RouterNavLink to="/eventos" className={mobileNavLinkClass}>
                Eventos
              </RouterNavLink>
              <RouterNavLink to="/grupos-oracao" className={mobileNavLinkClass}>
                Grupos de Oração
              </RouterNavLink>
              
              {user && (
                <RouterNavLink to="/perfil" className={mobileNavLinkClass}>
                  Perfil
                </RouterNavLink>
              )}

              {isAdminOrCoordenador && (
                <>
                  <RouterNavLink to="/admin/gerenciar-publicacoes" className={mobileNavLinkClass}>
                    Gerenciar Publicações
                  </RouterNavLink>
                  <RouterNavLink to="/admin/criar-evento" className={mobileNavLinkClass}>
                    Criar Evento
                  </RouterNavLink>
                </>
              )}
              <div className="mt-4 border-t pt-4">
                {user ? (
                  <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-lg">
                    Sair
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full text-lg">
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* User Menu / Botão ENTRAR - RIGHT */}
      <div className="flex items-center pr-4">
        {user && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome || "Usuário"} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {profile.nome ? profile.nome.charAt(0).toUpperCase() : <UserIcon className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.nome}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil">Minha Conta</Link>
              </DropdownMenuItem>
              {isAdminOrCoordenador && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/criar-publicacao">Criar Publicação</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/gerenciar-publicacoes">Gerenciar Publicações</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin/criar-evento">Criar Evento</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button 
              variant="secondary" 
              size="lg"
              className="bg-background text-foreground hover:bg-accent font-semibold"
            >
              ENTRAR
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};