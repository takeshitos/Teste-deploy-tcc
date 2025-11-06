import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Noticia {
  id: string;
  titulo: string;
  publicado: boolean | null;
  created_at: string;
}

const ManageNews = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [news, setNews] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check if user is admin or coordenador
  const isAdminOrCoordenador = profile?.role === 'admin' || profile?.role === 'coordenador';

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdminOrCoordenador) {
        toast.error("Você não tem permissão para acessar esta página.");
        navigate("/");
      } else {
        fetchNews();
      }
    }
  }, [user, profile, authLoading, navigate, isAdminOrCoordenador]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("noticias")
        .select("id, titulo, publicado, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast.error("Erro ao carregar publicações.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("noticias").delete().eq("id", id);
      if (error) throw error;
      toast.success("Publicação excluída com sucesso!");
      setNews(news.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting news:", error);
      toast.error("Erro ao excluir publicação.");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Carregando publicações...</p>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Gerenciar Publicações</h1>
          <Link to="/admin/criar-publicacao">
            <Button>Criar Nova Publicação</Button>
          </Link>
        </div>
        
        {news.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground">Nenhuma publicação encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.titulo}</TableCell>
                    <TableCell>
                      <Badge variant={item.publicado ? "default" : "secondary"}>
                        {item.publicado ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link to={`/noticia/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/admin/editar-publicacao/${item.id}`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeletingId(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente
                              esta publicação.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageNews;