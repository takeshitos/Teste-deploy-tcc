import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react"; // Import useRef, useState, useEffect

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
  const contentRef = useRef<HTMLParagraphElement>(null); // Cria um ref para o parágrafo do conteúdo
  const [isContentTruncated, setIsContentTruncated] = useState(false); // Estado para rastrear o truncamento

  useEffect(() => {
    if (contentRef.current && !showFullContent) { // Só verifica se não está mostrando o conteúdo completo
      // Verifica se o conteúdo transborda seu contêiner
      setIsContentTruncated(contentRef.current.scrollHeight > contentRef.current.clientHeight);
    } else {
      setIsContentTruncated(false); // Se estiver mostrando o conteúdo completo, não está truncado
    }
  }, [conteudo, showFullContent]); // Re-executa quando o conteúdo ou showFullContent muda

  return (
    <Card className="bg-primary text-primary-foreground overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row">
        {imagem_url && (
          <div className="md:w-1/3 h-48 md:h-auto overflow-hidden rounded-lg border border-border"> {/* Adicionado rounded-lg e border */}
            <img src={imagem_url} alt={titulo} className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className={`p-6 ${imagem_url ? 'md:w-2/3' : 'w-full'}`}>
          <h3 className="text-2xl font-bold mb-3"> {/* Aumentado o tamanho da fonte para text-2xl */}
            {titulo}
          </h3>
          <p ref={contentRef} className={`text-sm opacity-90 mb-4 ${!showFullContent && 'line-clamp-3'}`}>
            {conteudo}
          </p>
          <div className="flex flex-wrap gap-2">
            {!showFullContent && isContentTruncated && ( // Renderiza condicionalmente "Ler mais"
              <Link to={`/noticia/${id}`}>
                <Button variant="secondary" size="sm" className="bg-background text-foreground hover:bg-accent">
                  Ler mais
                </Button>
              </Link>
            )}
            {hasButton && (
              <a href={button_link} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary-hover">
                  {button_text}
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};