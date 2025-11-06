import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";

interface GrupoOracao {
  id: string;
  nome: string;
  local: string;
  horario: string;
  descricao: string | null;
  imagem_url: string | null;
}

const GruposOracao = () => {
  const { user, signOut } = useAuth();
  const [grupos, setGrupos] = useState<GrupoOracao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    try {
      const { data } = await supabase
        .from("grupos_oracao")
        .select("*")
        .order("nome", { ascending: true });

      if (data) {
        setGrupos(data);
      }
    } catch (error) {
      console.error("Error fetching prayer groups:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-4">Grupos de Oração</h1>
        <p className="text-muted-foreground mb-8">
          Encontre o grupo de oração mais próximo de você
        </p>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando grupos...</p>
          </div>
        ) : grupos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grupos.map((grupo) => (
              <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
                {grupo.imagem_url && (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={grupo.imagem_url} 
                      alt={grupo.nome} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">{grupo.nome}</h3>
                  {grupo.descricao && (
                    <p className="text-sm text-muted-foreground mb-4">{grupo.descricao}</p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{grupo.local}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{grupo.horario}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground">Nenhum grupo de oração cadastrado no momento.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default GruposOracao;