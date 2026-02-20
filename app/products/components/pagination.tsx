import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageHref = (page: number) => {
    const url = new URL(basePath, "http://x")
    url.searchParams.set("page", String(page))
    return `${url.pathname}${url.search}`
  }

  // Generate visible page numbers (at most 5 around current)
  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={currentPage === 1}
        asChild={currentPage !== 1}
      >
        {currentPage !== 1 ? (
          <Link href={getPageHref(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span><ChevronLeft className="h-4 w-4" /></span>
        )}
      </Button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className="rounded-full w-9"
            asChild={page !== currentPage}
          >
            {page !== currentPage ? (
              <Link href={getPageHref(page)}>{page}</Link>
            ) : (
              <span>{page}</span>
            )}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        disabled={currentPage === totalPages}
        asChild={currentPage !== totalPages}
      >
        {currentPage !== totalPages ? (
          <Link href={getPageHref(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span><ChevronRight className="h-4 w-4" /></span>
        )}
      </Button>
    </div>
  )
}
