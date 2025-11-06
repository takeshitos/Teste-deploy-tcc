import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes de arquivo únicos

interface Profile {
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  avatar_url: string | null; // Adicionado avatar_url
}

interface Inscricao {
  id: string;
  confirmado: boolean;
  presente: boolean;
  eventos: {
    nome: string;
    tipo: string;
    data: string;
    obrigatorio: boolean;
  };
}

const Perfil = () => {
  const { user, signOut, profile: authProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (authProfile) {
      setProfile(authProfile);
      setLoading(false);
    } else {
      // Fallback if authProfile is not yet loaded, though AuthContext should handle it
      fetchProfileData(); 
    }
    fetchInscricoes();
  }, [user, navigate, authProfile]);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInscricoes = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("inscricoes")
        .select(`
          id,
          confirmado,
          presente,
          eventos (
            nome,
            tipo,
            data,
            obrigatorio
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setInscricoes(data as Inscricao[]);
      }
    } catch (error) {
      console.error("Error fetching inscriptions:", error);
      toast.error("Erro ao carregar histórico de inscrições.");
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: profile.nome,
          telefone: profile.telefone,
          endereco: profile.endereco,
          avatar_url: profile.avatar_url, // Incluir avatar_url
        })
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Perfil atualizado com sucesso!");
      fetchUserProfile(); // Re-fetch profile to update context
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) {
      toast.error("Por favor, selecione uma imagem para upload.");
      return;
    }

    setUploadingAvatar(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`; // Store in a folder named after the user's ID

    try {
      // 1. Delete old avatar if it exists
      if (profile?.avatar_url) {
        // Extract the path from the full URL
        const oldAvatarPath = profile.avatar_url.split('/public/avatars/')[1];
        if (oldAvatarPath) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldAvatarPath]);

          if (deleteError) {
            console.warn("Erro ao excluir avatar antigo:", deleteError.message);
            // Não lançar erro, apenas avisar, pois o novo upload deve continuar
          } else {
            console.log("Avatar antigo excluído com sucesso:", oldAvatarPath);
          }
        }
      }

      // 2. Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Certifique-se de que este bucket existe no Supabase
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData.publicUrl) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrlData.publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setProfile((prevProfile) => prevProfile ? { ...prevProfile, avatar_url: publicUrlData.publicUrl } : null);
        fetchUserProfile(); // Re-fetch profile to update context
        toast.success("Foto de perfil atualizada com sucesso!");
      } else {
        throw new Error("Não foi possível obter a URL pública da imagem.");
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(`Erro ao fazer upload da foto: ${error.message || 'Tente novamente.'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={!!user} onLogout={signOut} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const eventosRealizados = inscricoes.filter((i) => i.presente).length;
  const eventosObrigatoriosPendentes = inscricoes.filter(
    (i) => i.eventos.obrigatorio && !i.presente
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={!!user} onLogout={signOut} />
      
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">Meu Perfil</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.nome} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile.nome ? profile.nome.charAt(0).toUpperCase() : <UserIcon className="h-12 w-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor="avatar-upload" className="cursor-pointer text-primary hover:underline">
                    {uploadingAvatar ? "Enviando..." : "Alterar Foto de Perfil"}
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={profile.nome}
                    onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={profile.telefone || ""}
                    onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={profile.endereco || ""}
                    onChange={(e) => setProfile({ ...profile, endereco: e.target.value })}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving || uploadingAvatar} className="w-full">
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progresso Formativo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Eventos Realizados</p>
                    <p className="text-2xl font-bold text-primary">{eventosRealizados}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Eventos Obrigatórios Pendentes</p>
                    <p className="text-2xl font-bold text-secondary">{eventosObrigatoriosPendentes}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Histórico de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {inscricoes.length > 0 ? (
              <div className="space-y-3">
                {inscricoes.map((inscricao) => (
                  <div
                    key={inscricao.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{inscricao.eventos.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(inscricao.eventos.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inscricao.eventos.obrigatorio && (
                        <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                          Obrigatório
                        </span>
                      )}
                      {inscricao.presente ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : inscricao.confirmado ? (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Confirmado
                        </span>
                      ) : (
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Você ainda não está inscrito em nenhum evento.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Perfil;