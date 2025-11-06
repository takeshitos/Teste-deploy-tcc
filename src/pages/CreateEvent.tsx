import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';
import { format } from "date-fns";

import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Enums, TablesInsert } from "@/integrations/supabase/types"; // Importar TablesInsert

// Define os tipos de evento disponíveis
const eventTypes: Enums<'event_type'>[] = [
  "formacao",
  "retiro",
  "reuniao",
  "experiencia_oracao",
  "introducao_dons",
];

// Define os campos de formulário de inscrição pré-definidos
const predefinedFormFields = [
  { id: "nome", label: "Nome Completo" },
  { id: "telefone", label: "Telefone" },
  { id: "idade", label: "Idade" },
  { id: "telefone_responsavel", label: "Telefone do Responsável (se menor)" },
  { id: "cidade", label: "Cidade" },
  { id: "grupo_oracao", label: "Grupo de Oração" },
  { id: "precisa_pouso", label: "Precisa de Pouso" },
];

const formSchema = z.object({
  nome: z.string().min(5, { message: "O nome do evento deve ter pelo menos 5 caracteres." }),
  descricao: z.string().min(20, { message: "A descrição do evento deve ter pelo menos 20 caracteres." }),
  data: z.date({ required_error: "A data do evento é obrigatória." }),
  horario: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de horário inválido (HH:MM)." }),
  local: z.string().optional(),
  taxa_inscricao: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, { message: "A taxa de inscrição não pode ser negativa." }).optional()
  ),
  tipo: z.enum(eventTypes as [string, ...string[]], { required_error: "O tipo do evento é obrigatório." }),
  imagem_file: z.any().optional(), // File object for upload
  imagem_url: z.string().optional().nullable(), // URL after upload
  obrigatorio: z.boolean().default(false),
  chave_pix: z.string().optional().nullable(),
  qr_code_file: z.any().optional(), // File object for QR code upload
  qr_code_url: z.string().optional().nullable(), // URL after QR code upload
  whatsapp_link: z.string().url({ message: "O link do WhatsApp deve ser uma URL válida." }).optional().or(z.literal('')).nullable(),
  registration_deadline: z.date().optional().nullable(),
  
  // Configuração dos campos do formulário de inscrição
  form_fields_config: z.record(z.string(), z.object({ required: z.boolean() })).default({}),
});

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingQrCode, setIsUploadingQrCode] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      data: undefined,
      horario: "",
      local: "",
      taxa_inscricao: 0,
      tipo: "formacao", // Default type
      imagem_url: null,
      obrigatorio: false,
      chave_pix: "",
      qr_code_url: null,
      whatsapp_link: "",
      registration_deadline: undefined,
      form_fields_config: predefinedFormFields.reduce((acc, field) => ({
        ...acc,
        [field.id]: { required: false },
      }), {}),
    },
  });

  // Check if user is admin or coordenador
  const isAdminOrCoordenador = profile?.role === 'admin' || profile?.role === 'coordenador';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminOrCoordenador) {
    toast.error("Você não tem permissão para acessar esta página.");
    navigate("/");
    return null;
  }

  const handleImageUpload = async (file: File, fieldName: "imagem_url" | "qr_code_url", bucketName: string, setIsUploading: (loading: boolean) => void) => {
    if (!user) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) {
        form.setValue(fieldName, publicUrlData.publicUrl);
        toast.success("Imagem enviada com sucesso!");
      } else {
        throw new Error("Não foi possível obter a URL pública da imagem.");
      }
    } catch (error: any) {
      console.error(`Error uploading ${fieldName}:`, error);
      toast.error(`Erro ao fazer upload da imagem: ${error.message || 'Tente novamente.'}`);
      form.setValue(fieldName, null); // Clear URL on error
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um evento.");
      return;
    }

    try {
      const { imagem_file, qr_code_file, data, registration_deadline, ...restOfValues } = values;
      
      const eventToInsert: TablesInsert<'eventos'> = {
        nome: restOfValues.nome,
        descricao: restOfValues.descricao,
        data: format(data, 'yyyy-MM-dd'), // Format date to YYYY-MM-DD
        horario: restOfValues.horario,
        local: restOfValues.local,
        taxa_inscricao: restOfValues.taxa_inscricao,
        tipo: restOfValues.tipo,
        imagem_url: restOfValues.imagem_url,
        obrigatorio: restOfValues.obrigatorio,
        chave_pix: restOfValues.chave_pix,
        qr_code_url: restOfValues.qr_code_url,
        whatsapp_link: restOfValues.whatsapp_link,
        registration_deadline: registration_deadline ? registration_deadline.toISOString() : null,
        form_fields_config: restOfValues.form_fields_config,
        autor_id: user.id,
      };

      const { error } = await supabase.from("eventos").insert(eventToInsert);

      if (error) throw error;

      toast.success("Evento criado com sucesso!");
      form.reset();
      navigate("/eventos"); // Redirect to events page
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(`Erro ao criar evento: ${error.message || 'Tente novamente.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">Criar Novo Evento</h1>
        
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Detalhes do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Retiro de Carnaval 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detalhes sobre o evento, programação, etc." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data do Evento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="horario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="local"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Salão Paroquial, Centro de Eventos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxa_inscricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de Inscrição (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Evento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de evento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imagem_file"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Imagem do Evento (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0], "imagem_url", "event_images", setIsUploadingImage);
                            }
                            onChange(e.target.files);
                          }}
                          disabled={isUploadingImage}
                          {...fieldProps}
                        />
                      </FormControl>
                      {form.watch("imagem_url") && (
                        <p className="text-sm text-muted-foreground">Imagem carregada: <a href={form.watch("imagem_url") || "#"} target="_blank" rel="noopener noreferrer" className="underline">Ver imagem</a></p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="obrigatorio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Evento Obrigatório</FormLabel>
                        <FormDescription>
                          Marque se a participação neste evento é obrigatória para a formação.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registration_deadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Prazo Final de Inscrição (opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP HH:mm")
                              ) : (
                                <span>Selecione data e hora</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                          <div className="p-3 border-t">
                            <Input
                              type="time"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                if (field.value) {
                                  const newDate = new Date(field.value);
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                } else {
                                  const newDate = new Date();
                                  newDate.setHours(hours, minutes);
                                  field.onChange(newDate);
                                }
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Após esta data, as inscrições para o evento serão encerradas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">Configuração do Formulário de Inscrição</h3>
                <p className="text-muted-foreground mb-4">Marque os campos que serão obrigatórios para a inscrição neste evento.</p>
                <div className="space-y-3 border p-4 rounded-lg">
                  {predefinedFormFields.map((fieldConfig) => (
                    <FormField
                      key={fieldConfig.id}
                      control={form.control}
                      name={`form_fields_config.${fieldConfig.id}.required`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <FormLabel className="text-base font-normal">{fieldConfig.label}</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <h3 className="text-xl font-semibold text-foreground mt-8 mb-4">Informações de Pagamento e Contato (Opcional)</h3>
                <FormField
                  control={form.control}
                  name="chave_pix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 00.000.000/0001-00 ou email@exemplo.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qr_code_file"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Imagem do QR Code PIX (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/png, image/jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0], "qr_code_url", "qr_codes", setIsUploadingQrCode);
                            }
                            onChange(e.target.files);
                          }}
                          disabled={isUploadingQrCode}
                          {...fieldProps}
                        />
                      </FormControl>
                      {form.watch("qr_code_url") && (
                        <p className="text-sm text-muted-foreground">QR Code carregado: <a href={form.watch("qr_code_url") || "#"} target="_blank" rel="noopener noreferrer" className="underline">Ver QR Code</a></p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do WhatsApp para Contato</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://wa.me/5543999999999" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUploadingImage || isUploadingQrCode}>
                  {form.formState.isSubmitting ? "Criando Evento..." : "Criar Evento"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateEvent;