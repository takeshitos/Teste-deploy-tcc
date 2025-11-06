import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface NewsCardProps {
  id: string;
  titulo: string;
  conteudo: string;
  imagem_url?: string;
  showFullContent?: boolean;
}

export const NewsCard = ({ 
  id, 
  titulo, 
  conteudo, 
  imagem_url,
  showFullContent = false 
}: NewsCardProps) => {
  return (
    <Card className="bg-primary text-primary-foreground overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row">
        {imagem_url && (
          <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
            <img src={imagem_url} alt={titulo} className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className={`p-6 ${imagem_url ? 'md:w-2/3' : 'w-full'}`}>
          <h3 className="text-xl font-bold mb-3">{titulo}</h3>
          <p className={`text-sm opacity-90 mb-4 ${!showFullContent && 'line-clamp-3'}`}>
            {conteudo}
          </p>
          {!showFullContent && (
            <Link to={`/noticia/${id}`}>
              <Button variant="secondary" size="sm" className="bg-background text-foreground hover:bg-accent">
                Ler mais
              </Button>
            </Link>
          )}
        </CardContent>
      </div>
    </Card>
  );
};