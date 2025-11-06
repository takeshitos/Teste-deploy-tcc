import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import rccLogo from "@/assets/logo_rcc.png"; // Updated to use the new logo
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

  return (
    <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="bg-white p-2 rounded-lg flex items-center justify-center"> {/* Added white background and rounded borders */}
              <img src={rccLogo} alt="RCC Logo" className="h-12 w-auto" /> {/* Adjusted size to fit better */}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-medium block">Renovação Carismática Católica</span>
              <span className="text-xs opacity-90">Diocese de Cornélio Procópio</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:opacity-80 transition-opacity">
              Início
            </Link>
            <Link to="/grupos-oracao" className="text-sm font-medium hover:opacity-80 transition-opacity hidden sm:block">
              Grupos de Oração
            </Link>
            <Link to="/eventos" className="text-sm font-medium hover:opacity-80 transition-opacity">
              Eventos
            </Link>
            
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
        </div>
      </div>
    </nav>
  );
};