import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CustomPagination = ({ currentPage, totalPages, onPageChange }: CustomPaginationProps) => {
  const pageNumbers = [];
  // Determine which page numbers to show (e.g., current, prev, next, and ellipsis)
  const maxPagesToShow = 5; // Max number of page links to display
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
          >
            Anterior
          </PaginationPrevious>
        </PaginationItem>

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(1)} isActive={1 === currentPage}>1</PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pageNumbers.map((number) => (
          <PaginationItem key={number}>
            <PaginationLink
              onClick={() => onPageChange(number)}
              isActive={number === currentPage}
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink onClick={() => onPageChange(totalPages)} isActive={totalPages === currentPage}>{totalPages}</PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
          >
            Próximo
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};