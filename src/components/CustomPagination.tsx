import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CustomPagination = ({ currentPage, totalPages, onPageChange }: CustomPaginationProps) => {
  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <Pagination className="mb-4"> {/* Adicionado mb-4 para espaçamento abaixo da paginação */}
      <PaginationContent className="flex-wrap space-x-1"> {/* Adicionado flex-wrap para permitir quebra de linha */}
        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={cn(
              "flex items-center gap-1 h-9 px-3 py-2",
              currentPage === 1 ? "pointer-events-none opacity-50" : undefined
            )}
            aria-label="Ir para a página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </PaginationLink>
        </PaginationItem>

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(1)} isActive={1 === currentPage} className="h-9 px-3 py-2">1</PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <PaginationEllipsis className="h-9 px-3 py-2" />
              </PaginationItem>
            )}
          </>
        )}

        {pageNumbers.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink
              onClick={() => onPageChange(number)}
              isActive={number === currentPage}
              className="h-9 px-3 py-2"
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis className="h-9 px-3 py-2" />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(totalPages)} isActive={totalPages === currentPage} className="h-9 px-3 py-2">{totalPages}</PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationLink
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={cn(
              "flex items-center gap-1 h-9 px-3 py-2",
              currentPage === totalPages ? "pointer-events-none opacity-50" : undefined
            )}
            aria-label="Ir para a próxima página"
          >
            <span>Próximo</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};