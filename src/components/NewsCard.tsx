import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Manter import para outros usos se houver
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { NewsActionButton } from "@/components/NewsActionButton"; // Importar o novo botão

interface NewsCardProps {
  id: string;
  titulo: string;
  conteudo: string;
  imagem_url?: string;
  showFullContent?: boolean;
  button_text?: string | null;
  button_link?: string | null;
}

export const NewsCard = ({ 
  id, 
  titulo, 
  conteudo, 
  imagem_url,
  showFullContent = false,
  button_text,
  button_link,
}: NewsCardProps) => {
  const hasButton = button_text && button_link;
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isContentTruncated, setIsContentTruncated] = useState(false);

  useEffect(() => {
    if (contentRef.current && !showFullContent) {
      setIsContentTruncated(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    } else {
      setIsContentTruncated(false);
    }
  }, [conteudo, showFullContent]);

  return (
    <Card className="bg-primary text-primary-foreground overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row">
        {imagem_url && (
          <div className="md:w-1/3 h-48 md:h-auto overflow-hidden rounded-lg border border-border">
            <img src={imagem_url} alt={titulo} className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className={`p-6 ${imagem_url ? 'md:w-2/3' : 'w-full'}`}>
          <h3 className="text-2xl font-bold mb-3">
            {titulo}
          </h3>
          <p ref={contentRef} className={`text-sm opacity-90 mb-4 ${!showFullContent && 'line-clamp-3'}`}>
            {conteudo}
          </p>
          <div className="flex flex-wrap gap-2">
            {!showFullContent && isContentTruncated && (
              <Link to={`/noticia/${id}`}>
                <NewsActionButton>
                  Ler mais
                </NewsActionButton>
              </Link>
            )}
            {hasButton && (
              <NewsActionButton href={button_link}>
                {button_text}
              </NewsActionButton>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};