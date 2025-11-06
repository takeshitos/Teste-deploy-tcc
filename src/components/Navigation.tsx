import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import rccLogo from "@/assets/rcc-logo.png";

interface NavigationProps {
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Navigation = ({ isAuthenticated, onLogout }: NavigationProps) => {
  return (
    <nav className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={rccLogo} alt="RCC Logo" className="h-12 w-auto" />
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
            
            {isAuthenticated ? (
              <>
                <Link to="/perfil" className="text-sm font-medium hover:opacity-80 transition-opacity hidden md:block">
                  Perfil
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={onLogout}
                  className="bg-background text-foreground hover:bg-accent"
                >
                  Sair
                </Button>
              </>
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