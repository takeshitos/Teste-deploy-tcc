import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { v4 as uuidv4 } from 'uuid';

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

const formSchema = z.object({
  titulo: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  conteudo: z.string().min(20, { message: "O conteúdo deve ter pelo menos 20 caracteres." }),
  imagem: z.any().optional(), // File object for upload
  imagem_url: z.string().optional().nullable(), // URL after upload, can be null
  publicado: z.boolean().default(true),
  button_text: z.string().optional().nullable(),
  button_link: z.string().url({ message: "O link do botão deve ser uma URL válida." }).optional().or(z.literal('')).nullable(),
});

const EditNews = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      conteudo: "",
      imagem_url: null,
      publicado: true,
      button_text: null,
      button_link: null,
    },
  });

  // Check if user is admin or coordenador
  const isAdminOrCoordenador = profile?.role === 'admin' || profile?.role === 'coordenador';

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdminOrCoordenador) {
        toast.error("Você não tem permissão para acessar esta página.");
        navigate("/");
        return;
      }
      if (id) {
        fetchNewsData(id);
      } else {
        toast.error("ID da publicação não fornecido.");
        navigate("/admin/gerenciar-publicacoes");
      }
    }
  }, [user, profile, authLoading, navigate, id, isAdminOrCoordenador]);

  const fetchNewsData = async (newsId: string) => {
    setInitialLoading(true);
    try {
      const { data, error } = await supabase
        .from("noticias")
        .select("*")
        .eq("id", newsId)
        .single();

      if (error) throw error;
      if (data) {
        form.reset({
          titulo: data.titulo,
          conteudo: data.conteudo,
          imagem_url: data.imagem_url,
          publicado: data.publicado || false,
          button_text: data.button_text,
          button_link: data.button_link,
        });
      }
    } catch (error) {
      console.error("Error fetching news data:", error);
      toast.error("Erro ao carregar dados da publicação.");
      navigate("/admin/gerenciar-publicacoes");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    setIsUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${uuidv4()}.${fileExt}`; // Store in user's folder
    const filePath = `news_images/${fileName}`;

    try {
      // Optionally delete old image if it exists and is different
      const currentImageUrl = form.getValues("imagem_url");
      if (currentImageUrl && currentImageUrl !== filePath) { // Simple check, could be more robust
        const oldImagePath = currentImageUrl.split('/public/news_images/')[1];
        if (oldImagePath) {
          await supabase.storage.from('news_images').remove([oldImagePath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('news_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('news_images')
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) {
        form.setValue("imagem_url", publicUrlData.publicUrl);
        toast.success("Imagem enviada com sucesso!");
      } else {
        throw new Error("Não foi possível obter a URL pública da imagem.");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(`Erro ao fazer upload da imagem: ${error.message || 'Tente novamente.'}`);
      form.setValue("imagem_url", null); // Clear URL on error
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !id) {
      toast.error("Você precisa estar logado para editar uma publicação.");
      return;
    }

    try {
      const { imagem, ...dataToUpdate } = values; // Exclude the file object from update
      
      const { error } = await supabase.from("noticias").update({
        titulo: dataToUpdate.titulo,
        conteudo: dataToUpdate.conteudo,
        imagem_url: dataToUpdate.imagem_url,
        publicado: dataToUpdate.publicado,
        button_text: dataToUpdate.button_text,
        button_link: dataToUpdate.button_link === '' ? null : dataToUpdate.button_link, // Ensure empty string becomes null
      }).eq("id", id);

      if (error) throw error;

      toast.success("Publicação atualizada com sucesso!");
      navigate("/admin/gerenciar-publicacoes"); // Redirect to manage page
    } catch (error: any) {
      console.error("Error updating news post:", error);
      toast.error(`Erro ao atualizar publicação: ${error.message || 'Tente novamente.'}`);
    }
  };

  if (authLoading || initialLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando publicação para edição...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdminOrCoordenador) {
    return null; // Should have been redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">Editar Publicação</h1>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Detalhes da Publicação</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da notícia ou comunicado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conteudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Escreva o conteúdo da sua publicação aqui..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imagem"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Imagem (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(e.target.files[0]);
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
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto do Botão (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Saiba Mais, Inscreva-se" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="button_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Botão (opcional)</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://exemplo.com" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publicado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publicar Imediatamente</FormLabel>
                        <FormDescription>
                          Se ativado, a notícia será visível na página principal.
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

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUploadingImage}>
                  {form.formState.isSubmitting ? "Atualizando Publicação..." : "Salvar Alterações"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EditNews;