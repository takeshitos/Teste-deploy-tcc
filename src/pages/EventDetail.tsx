import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, DollarSign, QrCode, Whatsapp, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

type Evento = Tables<'eventos'>;
type Inscricao = Tables<'inscricoes'>;

const tipoLabels: Record<string, string> = {
  formacao: "Formação",
  retiro: "Retiro",
  reuniao: "Reunião",
  experiencia_oracao: "Experiência de Oração",
  introducao_dons: "Introdução aos Dons",
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/not-found");
      return;
    }
    fetchEvent();
  }, [id, user, authLoading, navigate]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setEvent(data);
        if (user) {
          checkRegistrationStatus(data.id);
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Erro ao carregar detalhes do evento.");
      navigate("/not-found");
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async (eventId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("inscricoes")
        .select("id")
        .eq("evento_id", eventId)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      setIsRegistered(!!data);
    } catch (error) {
      console.error("Error checking registration status:", error);
      toast.error("Erro ao verificar status de inscrição.");
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.info("Você precisa estar logado para se inscrever.");
      navigate("/auth");
      return;
    }
    if (!event) return;

    setIsRegistering(true);
    try {
      const { error } = await supabase.from("inscricoes").insert({
        evento_id: event.id,
        user_id: user.id,
        confirmado: event.taxa_inscricao && event.taxa_inscricao > 0 ? false : true, // Auto-confirm if no fee
        presente: false,
      });

      if (error) throw error;

      setIsRegistered(true);
      toast.success("Inscrição realizada com sucesso!");
      if (event.taxa_inscricao && event.taxa_inscricao > 0) {
        toast.info("Sua inscrição está pendente de pagamento. Utilize os dados PIX abaixo.");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Erro ao se inscrever no evento.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={!!user} onLogout={signOut} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando detalhes do evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={!!user} onLogout={signOut} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Evento não encontrado.</p>
          <Link to="/eventos" className="text-primary hover:underline mt-4 block">Voltar para Eventos</Link>
        </div>
      </div>
    );
  }

  const eventDate = new Date(event.data);
  const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dayOfWeek = format(eventDate, "EEEE", { locale: ptBR });

  const hasFee = event.taxa_inscricao && event.taxa_inscricao > 0;
  const showPixInfo = hasFee && event.chave_pix && event.qr_code_url;

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-16">
        <Card className="overflow-hidden">
          {event.imagem_url && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img src={event.imagem_url} alt={event.nome} className="w-full h-full object-cover" />
            </div>
          )}
          <CardContent className="p-6 md:p-8">
            <Badge className="mb-4 bg-secondary text-secondary-foreground">{tipoLabels[event.tipo] || event.tipo}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{event.nome}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="capitalize">{formattedDate} ({dayOfWeek})</span>
                </div>
                {event.horario && (
                  <div className="flex items-center gap-3 text-lg">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{event.horario}</span>
                  </div>
                )}
                {event.local && (
                  <div className="flex items-center gap-3 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.local}</span>
                  </div>
                )}
                {hasFee && (
                  <div className="flex items-center gap-3 text-lg font-semibold text-secondary">
                    <DollarSign className="h-5 w-5" />
                    <span>Taxa de Inscrição: R$ {event.taxa_inscricao?.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">{event.descricao}</p>
              </div>
            </div>

            {!isRegistered ? (
              <Button 
                onClick={handleRegister} 
                className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-lg py-6 px-8"
                disabled={isRegistering}
              >
                {isRegistering ? "Inscrevendo..." : "Inscrever-se Agora"}
              </Button>
            ) : (
              <div className="flex items-center gap-3 text-lg font-semibold text-primary bg-primary/10 p-4 rounded-lg">
                <CheckCircle className="h-6 w-6" />
                <span>Você já está inscrito neste evento!</span>
              </div>
            )}

            {isRegistered && hasFee && !event.confirmado && showPixInfo && (
              <Card className="mt-8 bg-card text-card-foreground border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <QrCode className="h-6 w-6" />
                    Informações para Pagamento PIX
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Para confirmar sua inscrição, realize o pagamento da taxa de R$ {event.taxa_inscricao?.toFixed(2)} via PIX.
                  </p>
                  {event.qr_code_url && (
                    <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                      <img src={event.qr_code_url} alt="QR Code PIX" className="w-48 h-48 object-contain mb-4" />
                      <p className="font-medium text-sm">Escaneie o QR Code para pagar</p>
                    </div>
                  )}
                  {event.chave_pix && (
                    <div className="space-y-2">
                      <Label htmlFor="pix-key" className="text-muted-foreground">Chave PIX (copia e cola)</Label>
                      <div className="flex gap-2">
                        <Input id="pix-key" type="text" value={event.chave_pix} readOnly className="flex-grow bg-muted" />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            navigator.clipboard.writeText(event.chave_pix || "");
                            toast.success("Chave PIX copiada!");
                          }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Após o pagamento, sua inscrição será confirmada em breve.
                  </p>
                </CardContent>
              </Card>
            )}

            {event.whatsapp_link && (
              <div className="mt-8">
                <Link to={event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full md:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold text-lg py-6 px-8 flex items-center gap-2">
                    <Whatsapp className="h-6 w-6" />
                    Falar no WhatsApp
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer (reusing from Home.tsx for consistency) */}
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

export default EventDetail;