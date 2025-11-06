import { Link, useNavigate } from "react-router-dom";
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
import { User as UserIcon } from "lucide-react";

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Check if the user has 'admin' or 'coordenador' role
  const isAdminOrCoordenador = profile?.role === 'admin' || profile?.role === 'coordenador';

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50 h-20 flex items-center justify-between">
      {/* Logo da Aplicação */}
      <Link to="/" className="flex items-center gap-3 h-full bg-white px-4 rounded-r-lg hover:opacity-90 transition-opacity">
        <img src={rccLogo} alt="RCC Logo" className="h-16 w-auto" />
      </Link>
      
      {/* Links de Navegação e Menu do Usuário */}
      <div className="flex items-center gap-6 pr-4">
        <Link to="/" className="text-sm font-medium hover:opacity-80 transition-opacity">
          Início
        </Link>
        <Link to="/grupos-oracao" className="text-sm font-medium hover:opacity-80 transition-opacity hidden sm:block">
          Grupos de Oração
        </Link>
        <Link to="/eventos" className="text-sm font-medium hover:opacity-80 transition-opacity">
          Eventos
        </Link>
        
        {isAdminOrCoordenador && (
          <Link to="/admin/gerenciar-publicacoes" className="text-sm font-medium hover:opacity-80 transition-opacity hidden md:block">
            Gerenciar Publicações
          </Link>
        )}

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
              size="sm"
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