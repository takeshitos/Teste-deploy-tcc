import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventCardProps {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  horario: string;
  local?: string;
  descricao?: string;
  taxa_inscricao?: number;
  imagem_url?: string;
  featured?: boolean;
}

const tipoLabels: Record<string, string> = {
  formacao: "Formação",
  retiro: "Retiro",
  reuniao: "Reunião",
  experiencia_oracao: "Experiência de Oração",
  introducao_dons: "Introdução aos Dons",
};

export const EventCard = ({ 
  id, 
  nome, 
  tipo, 
  data, 
  horario, 
  local, 
  descricao, 
  taxa_inscricao,
  imagem_url,
  featured = false 
}: EventCardProps) => {
  const eventDate = new Date(data);
  const formattedDate = format(eventDate, "dd 'de' MMMM", { locale: ptBR });
  const dayOfWeek = format(eventDate, "EEEE", { locale: ptBR });

  if (featured) {
    return (
      <Card className="bg-secondary text-secondary-foreground overflow-hidden hover:shadow-xl transition-shadow">
        {imagem_url && (
          <div className="h-48 overflow-hidden">
            <img src={imagem_url} alt={nome} className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className="p-6">
          <Badge className="mb-3 bg-background text-foreground">{tipoLabels[tipo] || tipo}</Badge>
          <h3 className="text-2xl font-bold mb-3">{nome}</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span className="capitalize">{formattedDate} ({dayOfWeek})</span>
            </div>
            {horario && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{horario}</span>
              </div>
            )}
            {local && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{local}</span>
              </div>
            )}
            {taxa_inscricao !== undefined && taxa_inscricao > 0 && (
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                <span>R$ {taxa_inscricao.toFixed(2)}</span>
              </div>
            )}
          </div>
          <Link to={`/evento/${id}`}>
            <Button className="w-full bg-background text-foreground hover:bg-accent font-semibold">
              INSCRIÇÃO
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-primary text-primary-foreground overflow-hidden hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <Badge className="mb-3 bg-secondary text-secondary-foreground">{tipoLabels[tipo] || tipo}</Badge>
        <h3 className="text-xl font-bold mb-3">{nome}</h3>
        {descricao && (
          <p className="text-sm opacity-90 mb-4 line-clamp-2">{descricao}</p>
        )}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">{formattedDate}</span>
          </div>
          {local && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>{local}</span>
            </div>
          )}
        </div>
        <Link to={`/evento/${id}`}>
          <Button className="w-full bg-background text-foreground hover:bg-accent">
            INSCRIÇÃO
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};