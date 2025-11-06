import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { EventCard } from "@/components/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Evento {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  horario: string;
  local: string | null;
  descricao: string | null;
  taxa_inscricao: number;
  imagem_url: string | null;
}

const Eventos = () => {
  const { user, signOut } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const { data } = await supabase
        .from("eventos")
        .select("*")
        .order("data", { ascending: true });

      if (data) {
        setEventos(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const proximosEventos = eventos.filter(
    (e) => new Date(e.data) >= new Date()
  );
  
  const eventosPassados = eventos.filter(
    (e) => new Date(e.data) < new Date()
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">Eventos RCC</h1>
        
        <Tabs defaultValue="proximos" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="proximos">Próximos Eventos</TabsTrigger>
            <TabsTrigger value="passados">Eventos Passados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="proximos">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            ) : proximosEventos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proximosEventos.map((evento) => (
                  <EventCard key={evento.id} {...evento} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhum evento programado no momento.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="passados">
            {eventosPassados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventosPassados.map((evento) => (
                  <EventCard key={evento.id} {...evento} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhum evento passado encontrado.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Eventos;