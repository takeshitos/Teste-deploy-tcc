import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { EventCard } from "@/components/EventCard";
import { NewsCard } from "@/components/NewsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import heroPrayer from "@/assets/hero-prayer.jpg";
import eventFormacao from "@/assets/event-formacao.jpg";
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

interface Noticia {
  id: string;
  titulo: string;
  conteudo: string;
  imagem_url: string | null;
  created_at: string;
  button_text: string | null;
  button_link: string | null;
}

const Home = () => {
  const { user, signOut } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [latestNews, setLatestNews] = useState<Noticia[]>([]); // Para a aba "Últimas Notícias"
  const [allNews, setAllNews] = useState<Noticia[]>([]); // Para a aba "Todos os Comunicados"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch upcoming events
      const { data: eventosData } = await supabase
        .from("eventos")
        .select("*")
        .gte("data", new Date().toISOString().split('T')[0])
        .order("data", { ascending: true })
        .limit(3);

      if (eventosData) {
        setEventos(eventosData);
      }

      // Fetch latest news for the "Últimas Notícias" tab
      const { data: latestNewsData } = await supabase
        .from("noticias")
        .select("id, titulo, conteudo, imagem_url, created_at, button_text, button_link")
        .eq("publicado", true)
        .order("created_at", { ascending: false })
        .limit(3); // Limite para as últimas notícias

      if (latestNewsData) {
        setLatestNews(latestNewsData);
      }

      // Fetch ALL published news for the "Todos os Comunicados" tab
      const { data: allNewsData } = await supabase
        .from("noticias")
        .select("id, titulo, conteudo, imagem_url, created_at, button_text, button_link")
        .eq("publicado", true)
        .order("created_at", { ascending: false });

      if (allNewsData) {
        setAllNews(allNewsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroPrayer} 
            alt="Prayer gathering" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/60"></div>
        </div>
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Renovação Carismática Católica
          </h1>
          <p className="text-lg md:text-xl opacity-95 italic max-w-2xl mx-auto leading-relaxed">
            "Cumpre em mim o Teu querer. Faça o que está no Teu coração. E que a cada dia eu queira mais e mais estar ao Teu lado, Senhor"
          </p>
        </div>
      </section>

      {/* Events Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground mb-8">Próximos Eventos</h2>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando eventos...</p>
          </div>
        ) : eventos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventos.map((evento, index) => (
              <EventCard
                key={evento.id}
                {...evento}
                imagem_url={evento.imagem_url || (index === 0 ? eventFormacao : undefined)}
                featured={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground">Nenhum evento programado no momento.</p>
          </div>
        )}
      </section>

      {/* News Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground mb-8">Notícias e Comunicados</h2>
        
        <Tabs defaultValue="latest">
          <TabsList className="mb-8 grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="latest">Últimas Notícias</TabsTrigger>
            <TabsTrigger value="all">Todos os Comunicados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="latest">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando notícias...</p>
              </div>
            ) : latestNews.length > 0 ? (
              <div className="space-y-6">
                {latestNews.map((noticia, index) => (
                  <NewsCard key={noticia.id} {...noticia} imageOnRight={index % 2 !== 0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhuma notícia recente encontrada.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando comunicados...</p>
              </div>
            ) : allNews.length > 0 ? (
              <>
                <div className="space-y-6">
                  {allNews.map((noticia, index) => (
                    <NewsCard key={noticia.id} {...noticia} imageOnRight={index % 2 !== 0} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">Nenhum comunicado encontrado.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">Renovação Carismática Católica</h3>
            <p className="text-sm opacity-90 mb-2">Diocese de Cornélio Procópio</p>
            <p className="text-xs opacity-75">© 2025 RCC. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;