import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewsCard } from "@/components/NewsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Noticia {
  id: string;
  titulo: string;
  conteudo: string;
  imagem_url: string | null;
  button_text: string | null;
  button_link: string | null;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate("/not-found");
      return;
    }
    fetchNewsItem();
  }, [id, navigate]);

  const fetchNewsItem = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setNewsItem(data);
      }
    } catch (error) {
      console.error("Error fetching news item:", error);
      toast.error("Erro ao carregar detalhes da publicação.");
      navigate("/not-found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando publicação...</p>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Publicação não encontrada.</p>
          <Link to="/" className="text-primary hover:underline mt-4 block">Voltar para o Início</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-foreground">{newsItem.titulo}</CardTitle>
          </CardHeader>
          <CardContent>
            <NewsCard 
              id={newsItem.id}
              titulo={newsItem.titulo}
              conteudo={newsItem.conteudo}
              imagem_url={newsItem.imagem_url}
              button_text={newsItem.button_text}
              button_link={newsItem.button_link}
              showFullContent={true} // Exibir o conteúdo completo
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NewsDetail;