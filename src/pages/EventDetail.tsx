import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, DollarSign, QrCode, CheckCircle, Upload, XCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tables, Json } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Evento = Tables<'eventos'>;
type Inscricao = Tables<'inscricoes'>;

const tipoLabels: Record<string, string> = {
  formacao: "Formação",
  retiro: "Retiro",
  reuniao: "Reunião",
  experiencia_oracao: "Experiência de Oração",
  introducao_dons: "Introdução aos Dons",
};

// Esquema base para os dados do formulário de inscrição
const baseRegistrationFormSchema = z.object({
  nome: z.string().optional(),
  telefone: z.string().optional(),
  idade: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "Idade inválida." }).optional()
  ),
  telefone_responsavel: z.string().optional(),
  cidade: z.string().optional(),
  grupo_oracao: z.string().optional(),
  precisa_pouso: z.boolean().optional(),
  comprovante_file: z.any().optional(), // Para upload do comprovante
});

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading, profile: userProfile } = useAuth();
  const [event, setEvent] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistrationConfirmed, setIsRegistrationConfirmed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null); // Para armazenar o ID da inscrição

  // Alterado o tipo do useState para ZodSchema<any> para maior flexibilidade
  const [dynamicFormSchema, setDynamicFormSchema] = useState<z.ZodSchema<any>>(baseRegistrationFormSchema);

  const form = useForm<z.infer<typeof baseRegistrationFormSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {
      nome: userProfile?.nome || "",
      telefone: userProfile?.telefone || "",
      idade: undefined,
      telefone_responsavel: "",
      cidade: userProfile?.endereco || "", // Usar endereço como cidade por enquanto
      grupo_oracao: "",
      precisa_pouso: false,
    },
  });

  useEffect(() => {
    if (!id) {
      navigate("/not-found");
      return;
    }
    fetchEvent();
  }, [id, user, authLoading, navigate, userProfile]);

  useEffect(() => {
    if (event?.form_fields_config) {
      const config = event.form_fields_config as Record<string, { required: boolean }>;

      // Start with a base schema shape
      let currentSchemaShape: { [key: string]: z.ZodTypeAny } = {
        nome: z.string().optional(),
        telefone: z.string().optional(),
        idade: z.preprocess(
          (val) => (val === "" ? undefined : Number(val)),
          z.number().min(0, { message: "Idade inválida." }).optional()
        ),
        telefone_responsavel: z.string().optional(),
        cidade: z.string().optional(),
        grupo_oracao: z.string().optional(),
        precisa_pouso: z.boolean().optional(),
        comprovante_file: z.any().optional(),
      };

      // Apply required rules based on admin configuration
      if (config.nome?.required) currentSchemaShape.nome = z.string().min(1, "Nome é obrigatório.");
      if (config.telefone?.required) currentSchemaShape.telefone = z.string().min(1, "Telefone é obrigatório.");
      if (config.idade?.required) currentSchemaShape.idade = z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number().min(0, { message: "Idade inválida." }) // Sem .optional() aqui se for obrigatório
      );
      if (config.cidade?.required) currentSchemaShape.cidade = z.string().min(1, "Cidade é obrigatória.");
      if (config.grupo_oracao?.required) currentSchemaShape.grupo_oracao = z.string().min(1, "Grupo de Oração é obrigatório.");
      
      let finalSchema = z.object(currentSchemaShape);

      // Conditional requirement for telefone_responsavel
      // Atribua o resultado do superRefine a uma nova variável ou diretamente ao estado
      const schemaWithRefinement = finalSchema.superRefine((data, ctx) => {
        const idadeValue = form.getValues("idade"); 
        if (config.telefone_responsavel?.required && idadeValue !== undefined && idadeValue < 18 && !data.telefone_responsavel) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Telefone do responsável é obrigatório para menores de 18 anos.",
            path: ["telefone_responsavel"],
          });
        }
      });

      setDynamicFormSchema(schemaWithRefinement); // Atribuição corrigida
    }
  }, [event, form]);

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
        .select("id, confirmado, dados_formulario")
        .eq("evento_id", eventId)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
      setIsRegistered(!!data);
      setIsRegistrationConfirmed(data?.confirmado || false);
      setRegistrationId(data?.id || null);

      if (data?.dados_formulario) {
        // Pre-fill form with existing registration data
        form.reset({
          ...form.getValues(), // Keep default values for fields not in dados_formulario
          ...(data.dados_formulario as z.infer<typeof baseRegistrationFormSchema>),
        });
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
      toast.error("Erro ao verificar status de inscrição.");
    }
  };

  const handleRegister = async (values: z.infer<typeof baseRegistrationFormSchema>) => {
    if (!user || !event) {
      toast.info("Você precisa estar logado para se inscrever.");
      navigate("/auth");
      return;
    }

    setIsRegistering(true);
    try {
      const isConfirmedInitially = event.taxa_inscricao && event.taxa_inscricao > 0 ? false : true;
      
      const { error, data: newRegistration } = await supabase.from("inscricoes").insert({
        evento_id: event.id,
        user_id: user.id,
        confirmado: isConfirmedInitially,
        presente: false,
        dados_formulario: values as Json, // Store form data
      }).select('id').single();

      if (error) throw error;

      setIsRegistered(true);
      setIsRegistrationConfirmed(isConfirmedInitially);
      setRegistrationId(newRegistration.id);
      toast.success("Inscrição realizada com sucesso!");
      if (event.taxa_inscricao && event.taxa_inscricao > 0) {
        toast.info("Sua inscrição está pendente de pagamento. Utilize os dados PIX abaixo e envie o comprovante.");
      }
    } catch (error) {
      console.error("Error registering for event:", error);
      toast.error("Erro ao se inscrever no evento.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !registrationId || !event.target.files || event.target.files.length === 0) {
      toast.error("Por favor, selecione uma imagem para upload.");
      return;
    }

    setIsUploadingProof(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${registrationId}/${uuidv4()}.${fileExt}`; // Store in registration's folder
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('registration_proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('registration_proofs')
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) {
        const { error: updateError } = await supabase
          .from('inscricoes')
          .update({ comprovante_url: publicUrlData.publicUrl })
          .eq('id', registrationId);

        if (updateError) throw updateError;

        toast.success("Comprovante enviado com sucesso! Aguarde a confirmação.");
      } else {
        throw new Error("Não foi possível obter a URL pública do comprovante.");
      }
    } catch (error: any) {
      console.error("Error uploading proof:", error);
      toast.error(`Erro ao fazer upload do comprovante: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsUploadingProof(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando detalhes do evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
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

  const registrationDeadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isRegistrationOpen = !registrationDeadline || !isPast(registrationDeadline);

  const formFieldsConfig = (event.form_fields_config || {}) as Record<string, { required: boolean }>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
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
                {registrationDeadline && (
                  <div className="flex items-center gap-3 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Prazo de Inscrição: {format(registrationDeadline, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">{event.descricao}</p>
              </div>
            </div>

            {!isRegistrationOpen ? (
              <div className="flex items-center gap-3 text-lg font-semibold text-destructive bg-destructive/10 p-4 rounded-lg">
                <XCircle className="h-6 w-6" />
                <span>As inscrições para este evento estão encerradas.</span>
              </div>
            ) : !isRegistered ? (
              <Card className="mt-8 bg-card text-card-foreground border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl">Formulário de Inscrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo {formFieldsConfig.nome?.required && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone {formFieldsConfig.telefone?.required && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="idade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idade {formFieldsConfig.idade?.required && "*"}</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("idade") !== undefined && form.watch("idade") < 18 && (
                        <FormField
                          control={form.control}
                          name="telefone_responsavel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone do Responsável {formFieldsConfig.telefone_responsavel?.required && "*"}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade {formFieldsConfig.cidade?.required && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="grupo_oracao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Grupo de Oração {formFieldsConfig.grupo_oracao?.required && "*"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="precisa_pouso"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Precisa de pouso? {formFieldsConfig.precisa_pouso?.required && "*"}
                              </FormLabel>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit"
                        className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-lg py-6 px-8"
                        disabled={isRegistering}
                      >
                        {isRegistering ? "Inscrevendo..." : "Inscrever-se Agora"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center gap-3 text-lg font-semibold text-primary bg-primary/10 p-4 rounded-lg">
                <CheckCircle className="h-6 w-6" />
                <span>Você já está inscrito neste evento!</span>
              </div>
            )}

            {isRegistered && hasFee && !isRegistrationConfirmed && showPixInfo && (
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
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="proof-upload" className="text-muted-foreground flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload do Comprovante de Pagamento
                    </Label>
                    <Input
                      id="proof-upload"
                      type="file"
                      accept="image/*, application/pdf"
                      onChange={handleProofUpload}
                      disabled={isUploadingProof}
                    />
                    {isUploadingProof && <p className="text-sm text-muted-foreground">Enviando comprovante...</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Após o pagamento e envio do comprovante, sua inscrição será confirmada em breve.
                  </p>
                </CardContent>
              </Card>
            )}

            {event.whatsapp_link && (
              <div className="mt-8">
                <Link to={event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full md:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold text-lg py-6 px-8 flex items-center gap-2">
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