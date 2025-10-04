import { Users, TrendingUp, Award, BarChart3, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface DashboardStats {
  total_students: number;
  avg_moy_rachat: number;
  top_specialty: string;
  specialty_distribution: Record<string, number>;
}

interface Promo {
  promo: string;
  studentCount: number;
  uploadDate: string;
  lastProcessed: string | null;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardData, promosData] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getPromos(),
        ]);

        setStats(dashboardData.data);
        setPromos(promosData.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du tableau de bord.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeletePromo = async (promo: string) => {
    try {
      await apiService.deletePromo(promo);
      setPromos((prev) => prev.filter((p) => p.promo !== promo));

      // Refresh stats after deletion
      const dashboardData = await apiService.getDashboardStats();
      setStats(dashboardData.data);

      toast({
        title: "Promo Supprimée",
        description: `La promo ${promo} a été supprimée avec succès.`,
      });
    } catch (error) {
      console.error("Failed to delete promo:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la promo.",
        variant: "destructive",
      });
    }
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
  }) => (
    <Card className="p-6 shadow-card hover:shadow-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tableau de Bord
            </h1>
            <p className="text-muted-foreground">
              Aperçu des données étudiantes et recommandations de spécialités
            </p>
          </div>
          <Button
            onClick={() => navigate("/students")}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            Voir Tous les Étudiants
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">
                Chargement des données...
              </p>
            </div>
          </div>
        ) : !stats ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total Étudiants"
                value={stats.total_students}
                subtitle="Promotion actuelle"
              />
              <StatCard
                icon={TrendingUp}
                title="Moyenne Générale"
                value={stats.avg_moy_rachat.toFixed(2)}
                subtitle="Moy Rachat"
              />
              <StatCard
                icon={Award}
                title="Spécialité Populaire"
                value={
                  Object.entries(stats.specialty_distribution).length > 0
                    ? Object.entries(stats.specialty_distribution).sort(
                        ([, a], [, b]) => (b as number) - (a as number)
                      )[0][0]
                    : "N/A"
                }
                subtitle={
                  Object.entries(stats.specialty_distribution).length > 0
                    ? `${
                        Object.entries(stats.specialty_distribution).sort(
                          ([, a], [, b]) => (b as number) - (a as number)
                        )[0][1]
                      } étudiants`
                    : "Aucune donnée"
                }
              />
              <StatCard
                icon={BarChart3}
                title="Spécialités"
                value={Object.keys(stats.specialty_distribution).length}
                subtitle="Options disponibles"
              />
            </div>

            {/* Specialty Distribution */}
            <Card className="p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Répartition des Spécialités
              </h2>
              <div className="space-y-4">
                {Object.entries(stats.specialty_distribution)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([specialty, count]) => (
                    <div key={specialty} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">
                          {specialty || "Non assigné"}
                        </span>
                        <span className="text-muted-foreground">
                          {count} étudiants (
                          {(
                            ((count as number) / stats.total_students) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary transition-all duration-500"
                          style={{
                            width: `${
                              ((count as number) / stats.total_students) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </>
        )}

        {/* Uploaded Promos */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Promos Téléchargées
          </h2>
          {promos.length > 0 ? (
            <div className="space-y-3">
              {promos.map((promo) => (
                <div
                  key={promo.promo}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      Promo {promo.promo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {promo.studentCount} étudiants • Téléchargé le{" "}
                      {new Date(promo.uploadDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Confirmer la suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer la promo{" "}
                          {promo.promo} ? Cette action supprimera définitivement
                          les données de {promo.studentCount} étudiants et ne
                          peut pas être annulée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePromo(promo.promo)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucune promo téléchargée pour le moment
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
