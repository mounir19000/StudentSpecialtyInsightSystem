import { useState, useEffect, useMemo } from "react";
import { Search, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiService } from "@/services/api";

interface Student {
  matricule: string;
  promo: string;
  rang: number;
  moy_rachat: number;
  recommended_specialty: string;
  rang_s1?: number;
  moy_s1?: number;
  rang_s2?: number;
  moy_s2?: number;
  grades?: Record<string, number | null>;
}

interface PromoData {
  promo: string;
  studentCount: number;
  uploadDate: string;
  lastProcessed: string | null;
  status: string;
}

interface StudentsResponse {
  students: Student[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalStudents: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const StudentList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [promoFilter, setPromoFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"rang" | "moyRachat">("rang");
  const [students, setStudents] = useState<Student[]>([]);
  const [promos, setPromos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const params: {
          page: number;
          limit: number;
          sortBy: string;
          search?: string;
          specialty?: string;
          promo?: string;
        } = {
          page: currentPage,
          limit: 50,
          sortBy: sortBy === "moyRachat" ? "moyRachat" : "rang",
        };

        if (searchTerm) params.search = searchTerm;
        if (specialtyFilter !== "all") params.specialty = specialtyFilter;
        if (promoFilter !== "all") params.promo = promoFilter;

        const response = await apiService.getStudents(params);
        const data: StudentsResponse = response.data;

        setStudents(data.students);
        setTotalPages(data.pagination.totalPages);
        setTotalStudents(data.pagination.totalStudents);
      } catch (error) {
        console.error("Failed to fetch students:", error);
        toast.error("Impossible de charger les étudiants");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentPage, searchTerm, specialtyFilter, promoFilter, sortBy]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await apiService.getPromos();
        const promosList = response.data.map((promo: PromoData) => promo.promo);
        setPromos(promosList);
      } catch (error) {
        console.error("Failed to fetch promos:", error);
      }
    };

    fetchPromos();
  }, []);

  const specialties = useMemo(() => {
    return Array.from(
      new Set(students.map((s) => s.recommended_specialty).filter(Boolean))
    );
  }, [students]);

  const handleExport = async () => {
    try {
      const filters = {
        search: searchTerm || undefined,
        specialty: specialtyFilter !== "all" ? specialtyFilter : undefined,
        promo: promoFilter !== "all" ? promoFilter : undefined,
      };

      const response = await apiService.exportStudents(filters);

      // For now, export current page data as CSV
      const data = students.map((s) => ({
        Matricule: s.matricule,
        Rang: s.rang || "N/A",
        "Moy Rachat": s.moy_rachat || "N/A",
        "Spécialité Recommandée": s.recommended_specialty || "Non assigné",
        Promo: s.promo,
      }));

      exportToCSV(data, "liste_etudiants");
      toast.success("Liste des étudiants exportée avec succès !");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Échec de l'exportation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Liste des Étudiants
          </h1>
          <p className="text-muted-foreground">
            Parcourir et gérer tous les dossiers étudiants
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrer par spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Spécialités</SelectItem>
                {specialties.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={promoFilter} onValueChange={setPromoFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrer par promo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les Promos</SelectItem>
                {promos.map((promo) => (
                  <SelectItem key={promo} value={promo}>
                    {promo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as "rang" | "moyRachat")}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rang">Trier par Rang</SelectItem>
                <SelectItem value="moyRachat">Trier par Moyenne</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </Card>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Affichage de {students.length} sur {totalStudents} étudiants
          {totalPages > 1 && (
            <span>
              {" "}
              - Page {currentPage} sur {totalPages}
            </span>
          )}
        </p>

        {/* Table - Desktop */}
        {!isMobile && (
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Matricule
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Rang
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Moy Rachat
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Spécialité Recommandée
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                      Promo
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground mt-2">
                            Chargement...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        Aucun étudiant trouvé
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr
                        key={student.matricule}
                        className="hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/student/${encodeURIComponent(student.matricule)}`
                          )
                        }
                      >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {student.matricule}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {student.rang || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {student.moy_rachat
                            ? student.moy_rachat.toFixed(2)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            {student.recommended_specialty || "Non assigné"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {student.promo}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(
                                `/student/${encodeURIComponent(
                                  student.matricule
                                )}`
                              );
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Card View - Mobile */}
        {isMobile && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement...</p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                Aucun étudiant trouvé
              </Card>
            ) : (
              students.map((student) => (
                <Card
                  key={student.matricule}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigate(
                      `/student/${encodeURIComponent(student.matricule)}`
                    )
                  }
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {student.matricule}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.promo}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary"
                      >
                        {student.recommended_specialty || "Non assigné"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Rang: </span>
                        <span className="font-medium text-foreground">
                          {student.rang || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Moyenne: </span>
                        <span className="font-medium text-foreground">
                          {student.moy_rachat
                            ? student.moy_rachat.toFixed(2)
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/student/${encodeURIComponent(student.matricule)}`
                        );
                      }}
                      className="w-full gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Voir Détails
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;
