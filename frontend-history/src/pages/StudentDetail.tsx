import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
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

const StudentDetail = () => {
  const { matricule } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!matricule) {
        setError("Matricule manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiService.getStudent(matricule);
        setStudent(response.data);
      } catch (error) {
        console.error("Failed to fetch student:", error);
        setError("Étudiant non trouvé");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [matricule]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Chargement...</p>
        </Card>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-6 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {error || "Étudiant Non Trouvé"}
          </h2>
          <Button onClick={() => navigate("/students")}>
            Retour à la Liste des Étudiants
          </Button>
        </Card>
      </div>
    );
  }

  const handleExportStudent = () => {
    const data = [
      {
        Matricule: student.matricule,
        Promo: student.promo,
        Rang: student.rang || "N/A",
        "Rang S1": student.rang_s1 || "N/A",
        "Moy S1": student.moy_s1 || "N/A",
        "Rang S2": student.rang_s2 || "N/A",
        "Moy S2": student.moy_s2 || "N/A",
        "Moy Rachat": student.moy_rachat || "N/A",
        "Spécialité Recommandée":
          student.recommended_specialty || "Non assigné",
        ...student.grades,
      },
    ];
    exportToCSV(data, `etudiant_${student.matricule}`);
    toast.success("Rapport étudiant exporté avec succès !");
  };

  const moduleGroups = [
    {
      title: "Modules Semestre 1",
      modules: ["SYS1", "RES1", "ANUM", "RO", "ORG", "LANG1", "IGL", "THP"],
    },
    {
      title: "Modules Semestre 2",
      modules: [
        "MCSI",
        "BDD",
        "SEC",
        "CPROJ",
        "PROJ",
        "LANG2",
        "ARCH",
        "SYS2",
        "RES2",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/students")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Profil Étudiant
              </h1>
              <p className="text-muted-foreground mt-1">
                Informations détaillées et recommandations
              </p>
            </div>
          </div>
          <Button onClick={handleExportStudent} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter Rapport
          </Button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Matricule</p>
            <p className="text-2xl font-bold text-foreground">
              {student.matricule}
            </p>
          </Card>
          <Card className="p-6 shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Rang</p>
            <p className="text-2xl font-bold text-foreground">{student.rang}</p>
          </Card>
          <Card className="p-6 shadow-card">
            <p className="text-sm text-muted-foreground mb-1">Promotion</p>
            <p className="text-2xl font-bold text-foreground">
              {student.promo}
            </p>
          </Card>
        </div>

        {/* Semester Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Semestre 1
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Moyenne</span>
                <span className="font-semibold text-foreground">
                  {student.moy_s1 ? student.moy_s1.toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rang</span>
                <span className="font-semibold text-foreground">
                  {student.rang_s1 || "N/A"}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Semestre 2
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Moyenne</span>
                <span className="font-semibold text-foreground">
                  {student.moy_s2 ? student.moy_s2.toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rang</span>
                <span className="font-semibold text-foreground">
                  {student.rang_s2 || "N/A"}
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-card bg-gradient-primary">
            <h3 className="text-lg font-semibold text-white mb-4">
              Résultat Final
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-white/80">Moy Rachat</span>
                <span className="font-bold text-white text-xl">
                  {student.moy_rachat ? student.moy_rachat.toFixed(2) : "N/A"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Recommended Specialty */}
        <Card className="p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Award className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Spécialité Recommandée
              </h3>
              <p className="text-3xl font-bold text-accent mb-2">
                {student.recommended_specialty || "Non assigné"}
              </p>
              <p className="text-sm text-muted-foreground">
                Basé sur l'analyse des performances dans tous les modules
              </p>
            </div>
          </div>
        </Card>

        {/* Module Grades */}
        {moduleGroups.map((group) => (
          <Card key={group.title} className="p-6 shadow-card">
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {group.title}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {group.modules.map((module) => {
                const grade = student.grades[module];
                const gradeColor =
                  grade >= 14
                    ? "text-primary"
                    : grade >= 10
                    ? "text-accent"
                    : "text-destructive";
                return (
                  <div key={module} className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {module}
                    </p>
                    <p className={`text-2xl font-bold ${gradeColor}`}>
                      {grade.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentDetail;
