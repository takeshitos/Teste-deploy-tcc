import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from 'lucide-react';

interface ExportRegistrationsPdfProps {
  eventId: string;
  eventName: string;
}

type RegistrationWithProfile = Tables<'inscricoes'> & {
  profiles: Pick<Tables<'profiles'>, 'nome' | 'email' | 'telefone' | 'endereco'> | null;
};

const predefinedFormFields = [
  { id: "nome", label: "Nome Completo" },
  { id: "telefone", label: "Telefone" },
  { id: "idade", label: "Idade" },
  { id: "telefone_responsavel", label: "Telefone do Responsável" },
  { id: "cidade", label: "Cidade" },
  { id: "grupo_oracao", label: "Grupo de Oração" },
  { id: "precisa_pouso", label: "Precisa de Pouso" },
];

export const ExportRegistrationsPdf: React.FC<ExportRegistrationsPdfProps> = ({ eventId, eventName }) => {
  const [loading, setLoading] = React.useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          *,
          profiles (
            nome,
            email,
            telefone,
            endereco
          )
        `)
        .eq('evento_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        generatePdf(data as RegistrationWithProfile[]);
      } else {
        toast.info("Nenhuma inscrição encontrada para este evento.");
      }
    } catch (error: any) {
      console.error("Error fetching registrations:", error);
      toast.error(`Erro ao buscar inscrições: ${error.message || 'Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async (registrations: RegistrationWithProfile[]) => {
    const doc = new jsPDF('p', 'pt', 'a4'); // 'p' for portrait, 'pt' for points, 'a4' for A4 size
    const margin = 40;
    let y = margin;
    const lineHeight = 12;
    const pageHeight = doc.internal.pageSize.height;

    doc.setFontSize(18);
    doc.text(`Inscrições para o Evento: ${eventName}`, margin, y);
    y += 30;

    doc.setFontSize(10);
    doc.text(`Total de Inscrições: ${registrations.length}`, margin, y);
    y += 20;

    // Prepare table headers
    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "Cidade",
      "Idade",
      "Tel. Resp.",
      "G. Oração",
      "Pouso",
      "Confirmado",
      "Presente",
      "Data Inscrição"
    ];

    const tableData = registrations.map(reg => {
      const profile = reg.profiles;
      const formData = reg.dados_formulario as Record<string, any> || {};

      // Prioritize form data if available, fallback to profile data
      const nome = formData.nome || profile?.nome || '';
      const email = profile?.email || ''; // Email is always from profile
      const telefone = formData.telefone || profile?.telefone || '';
      const cidade = formData.cidade || profile?.endereco || ''; // Using endereco as city
      const idade = formData.idade !== undefined ? formData.idade.toString() : '';
      const telefone_responsavel = formData.telefone_responsavel || '';
      const grupo_oracao = formData.grupo_oracao || '';
      const precisa_pouso = formData.precisa_pouso ? 'Sim' : 'Não';

      return [
        nome,
        email,
        telefone,
        cidade,
        idade,
        telefone_responsavel,
        grupo_oracao,
        precisa_pouso,
        reg.confirmado ? 'Sim' : 'Não',
        reg.presente ? 'Sim' : 'Não',
        format(new Date(reg.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ];
    });

    // AutoTable plugin for jspdf
    (doc as any).autoTable({
      startY: y,
      head: [headers],
      body: tableData,
      margin: { top: margin, left: margin, right: margin, bottom: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [22, 163, 74], // Primary green color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray for alternate rows
      },
      didDrawPage: (data: any) => {
        // Footer
        doc.setFontSize(8);
        doc.text(`Página ${data.pageNumber} de ${doc.getNumberOfPages()}`, doc.internal.pageSize.width - margin, pageHeight - 20, { align: 'right' });
      }
    });

    doc.save(`inscricoes-${eventName.replace(/\s/g, '_')}.pdf`);
    toast.success("PDF de inscrições gerado com sucesso!");
  };

  return (
    <Button onClick={fetchRegistrations} disabled={loading} className="w-full md:w-auto bg-secondary text-secondary-foreground hover:bg-secondary-hover font-semibold text-lg py-6 px-8 flex items-center gap-2">
      {loading ? "Gerando PDF..." : (
        <>
          <Download className="h-5 w-5" />
          Exportar Inscrições (PDF)
        </>
      )}
    </Button>
  );
};