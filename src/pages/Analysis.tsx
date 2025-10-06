import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { generateAnalysisPDF, type AnalysisData } from "@/lib/pdfExport";
import {
  Brain,
  Settings,
  BarChart3,
  ScatterChart,
  Download,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Plus,
  FileText,
} from "lucide-react";
import Plot from "react-plotly.js";
import html2canvas from "html2canvas";

interface Promo {
  promo: string;
  student_count: number;
}

interface BackendPromo {
  promo: string;
  studentCount: number;
  uploadDate: string;
  lastProcessed: string;
  status: string;
}

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
  icon: React.ReactNode;
}

interface BiplotData {
  id: string;
  name: string;
  biplot?: string;
  pc1?: number;
  pc2?: number;
  explained_variance_pc1?: number;
  explained_variance_pc2?: number;
  created_at: string;
}

interface AnalysisResults {
  pca?: {
    data?: { n_components: number };
    explained_variance?: number[];
    cumulative_variance?: number[];
    loadings?: Record<string, Record<string, number>>;
    variance_plot?: string;
    cumulative_plot?: string;
  };
  elbow?: {
    suggested_k?: number;
    elbow_scores?: number[];
    elbow_plot?: string;
    max_k_tested?: number;
  };
  clustering?: {
    optimal_k?: number;
    silhouette_score?: number;
    cluster_assignments?: Array<{
      matricule: string;
      cluster: number;
      [key: string]: string | number;
    }>;
    cluster_statistics?: Record<
      string,
      {
        size: number;
        percentage: number;
        students?: string[];
      }
    >;
    elbow_plot?: string;
  };
  biplots?: BiplotData[];
  complete?: Record<string, unknown>;
}

const Analysis: React.FC = () => {
  const { toast } = useToast();

  // State management
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<string>("");
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState<AnalysisResults>({});

  // Clustering parameters
  const [autoDetectK, setAutoDetectK] = useState(true);
  const [manualK, setManualK] = useState(3);
  const [maxK, setMaxK] = useState(10);
  const [selectedK, setSelectedK] = useState<number | null>(null);
  const [elbowCompleted, setElbowCompleted] = useState(false);

  // Biplot parameters
  const [selectedPC1, setSelectedPC1] = useState(1);
  const [selectedPC2, setSelectedPC2] = useState(2);

  const [steps, setSteps] = useState<AnalysisStep[]>([
    {
      id: "dataset",
      title: "Sélection Jeu de Données et Modules",
      description: "Sélectionner la promo et les modules pour l'analyse",
      status: "active",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      id: "pca",
      title: "Analyse ACP",
      description: "Analyse en Composantes Principales",
      status: "pending",
      icon: <Brain className="w-4 h-4" />,
    },
    {
      id: "clustering",
      title: "Analyse de Classification",
      description: "Classification K-Means avec méthode du coude",
      status: "pending",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "biplot",
      title: "Visualisation Biplot",
      description: "Visualisation interactive 2D",
      status: "pending",
      icon: <ScatterChart className="w-4 h-4" />,
    },
    {
      id: "export",
      title: "Résultats et Export",
      description: "Exporter les résultats d'analyse",
      status: "pending",
      icon: <Download className="w-4 h-4" />,
    },
  ]);

  const loadPromos = useCallback(async () => {
    try {
      const response = await apiService.getPromos();
      console.log("Raw API response:", response);
      // Map backend response format to frontend format
      const mappedPromos =
        response.data?.map((item: BackendPromo) => ({
          promo: item.promo,
          student_count: item.studentCount,
        })) || [];
      console.log("Mapped promos:", mappedPromos);
      setPromos(mappedPromos);
    } catch (error) {
      console.error("Error loading promos:", error);
      toast({
        title: "Error",
        description: "Failed to load promos",
        variant: "destructive",
      });
    }
  }, [toast]);

  const loadAvailableModules = useCallback(
    async (promo: string) => {
      try {
        setLoading(true);
        const data = await apiService.getAvailableModules(promo);
        setAvailableModules(data.modules || []);
      } catch (error) {
        console.error("Error loading modules:", error);
        toast({
          title: "Error",
          description: "Failed to load available modules",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // Load promos on component mount
  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  // Load available modules when promo changes
  useEffect(() => {
    if (selectedPromo) {
      loadAvailableModules(selectedPromo);
    }
  }, [selectedPromo, loadAvailableModules]);

  const updateStepStatus = (stepId: string, status: AnalysisStep["status"]) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const canProceedToStep = (stepIndex: number): boolean => {
    if (stepIndex === 0) return true;
    if (stepIndex === 1) return selectedPromo && selectedModules.length > 0;
    if (stepIndex === 2) return !!results.pca;
    if (stepIndex === 3) return !!results.clustering;
    if (stepIndex === 4) return results.biplots && results.biplots.length > 0;
    return false;
  };

  const isBiplotDuplicate = (pc1: number, pc2: number): boolean => {
    return (
      results.biplots?.some(
        (biplot) =>
          (biplot.pc1 === pc1 && biplot.pc2 === pc2) ||
          (biplot.pc1 === pc2 && biplot.pc2 === pc1)
      ) || false
    );
  };

  const handleModuleToggle = (module: string) => {
    setSelectedModules((prev) =>
      prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module]
    );
  };

  const handleSelectAllModules = () => {
    setSelectedModules(availableModules);
  };

  const handleClearModules = () => {
    setSelectedModules([]);
  };

  const performPCA = async () => {
    if (!selectedPromo || selectedModules.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une promo et au moins un module",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      updateStepStatus("pca", "active");

      const response = await apiService.performPCA({
        promo: selectedPromo,
        modules: selectedModules,
      });

      setResults((prev) => ({ ...prev, pca: response }));
      updateStepStatus("pca", "completed");

      toast({
        title: "Succès",
        description: "Analyse ACP terminée avec succès",
      });
    } catch (error: unknown) {
      console.error("Error performing PCA:", error);
      updateStepStatus("pca", "error");
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Échec de l'analyse ACP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performPCAAndProceed = async () => {
    if (!selectedPromo || selectedModules.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une promo et au moins un module",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      updateStepStatus("pca", "active");

      const response = await apiService.performPCA({
        promo: selectedPromo,
        modules: selectedModules,
      });

      setResults((prev) => ({ ...prev, pca: response }));
      updateStepStatus("pca", "completed");

      toast({
        title: "Succès",
        description: "Analyse ACP terminée avec succès",
      });

      // Navigate to next step after successful PCA
      setCurrentStep(1);
    } catch (error: unknown) {
      console.error("Error performing PCA:", error);
      updateStepStatus("pca", "error");
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Échec de l'analyse ACP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performElbowAnalysis = async () => {
    try {
      setLoading(true);

      const response = await apiService.performElbowAnalysis({
        promo: selectedPromo,
        modules: selectedModules,
        max_k: maxK,
      });

      setResults((prev) => ({ ...prev, elbow: response }));
      setElbowCompleted(true);
      setSelectedK(response.suggested_k || 3);

      toast({
        title: "Succès",
        description: "Analyse du coude terminée avec succès",
      });
    } catch (error: unknown) {
      console.error("Error performing elbow analysis:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Échec de l'analyse du coude",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performClustering = async () => {
    if (!selectedK) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner le nombre de clusters (K)",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      updateStepStatus("clustering", "active");

      const response = await apiService.performClustering({
        promo: selectedPromo,
        modules: selectedModules,
        n_clusters: selectedK,
        auto_detect_k: false,
        max_k: maxK,
      });

      setResults((prev) => ({ ...prev, clustering: response }));
      updateStepStatus("clustering", "completed");

      toast({
        title: "Succès",
        description: "Analyse de classification terminée avec succès",
      });
    } catch (error: unknown) {
      console.error("Error performing clustering:", error);
      updateStepStatus("clustering", "error");
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Échec de l'analyse de classification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBiplot = async () => {
    if (!selectedK) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord terminer l'analyse de classification",
        variant: "destructive",
      });
      return;
    }

    // Check if this PC combination already exists
    const existingBiplot = results.biplots?.find(
      (biplot) =>
        (biplot.pc1 === selectedPC1 && biplot.pc2 === selectedPC2) ||
        (biplot.pc1 === selectedPC2 && biplot.pc2 === selectedPC1)
    );

    if (existingBiplot) {
      toast({
        title: "Biplot Déjà Existant",
        description: `Un biplot pour CP${selectedPC1} vs CP${selectedPC2} existe déjà`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      updateStepStatus("biplot", "active");

      const response = await apiService.generateBiplot({
        promo: selectedPromo,
        modules: selectedModules,
        pc1: selectedPC1,
        pc2: selectedPC2,
        n_clusters: selectedK,
      });

      // Create new biplot entry
      const newBiplot: BiplotData = {
        id: `biplot-${Date.now()}`,
        name: `CP${selectedPC1} vs CP${selectedPC2}`,
        biplot: response.biplot,
        pc1: response.pc1,
        pc2: response.pc2,
        explained_variance_pc1: response.explained_variance_pc1,
        explained_variance_pc2: response.explained_variance_pc2,
        created_at: new Date().toLocaleString(),
      };

      // Add to biplots array
      setResults((prev) => ({
        ...prev,
        biplots: [...(prev.biplots || []), newBiplot],
      }));

      updateStepStatus("biplot", "completed");

      toast({
        title: "Succès",
        description: `Biplot CP${selectedPC1} vs CP${selectedPC2} généré avec succès`,
      });
    } catch (error: unknown) {
      console.error("Error generating biplot:", error);
      updateStepStatus("biplot", "error");
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Échec de la génération du biplot",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBiplot = (biplotId: string) => {
    setResults((prev) => ({
      ...prev,
      biplots: prev.biplots?.filter((biplot) => biplot.id !== biplotId) || [],
    }));

    toast({
      title: "Success",
      description: "Biplot removed successfully",
    });
  };

  const exportResults = async (format: "json" | "csv" = "json") => {
    try {
      const response = await apiService.exportAnalysis(
        selectedPromo,
        selectedModules,
        format
      );

      if (format === "csv") {
        const url = window.URL.createObjectURL(response as Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analysis_${selectedPromo}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const dataStr = JSON.stringify(response, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analysis_${selectedPromo}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      updateStepStatus("export", "completed");
      toast({
        title: "Succès",
        description: `Résultats exportés en ${format.toUpperCase()}`,
      });
    } catch (error: unknown) {
      console.error("Error exporting results:", error);
      toast({
        title: "Erreur",
        description: "Échec de l'export des résultats",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    try {
      // Show loading state
      setLoading(true);

      const originalStep = currentStep;

      // Prepare the analysis data for PDF generation
      const analysisData: AnalysisData = {
        selectedPromo,
        selectedColumns: selectedModules,
        pcaResults: results?.pca || null,
        clusteringResults: results?.clustering || null,
        biplotData: results.biplots || [],
        studentsData: results?.clustering?.cluster_assignments || [],
      };

      // Helper function to navigate to step and wait for render
      const captureChartsFromStep = async (
        stepIndex: number,
        waitTime: number = 2000
      ) => {
        console.log(`Navigating to step ${stepIndex}`);
        setCurrentStep(stepIndex);
        await new Promise((resolve) => setTimeout(resolve, waitTime));

        // Force a re-render by scrolling
        window.scrollTo(0, 0);
        await new Promise((resolve) => setTimeout(resolve, 500));
      };

      // Navigate through steps and capture charts individually
      let pcaCaptured = false;
      let clusteringCaptured = false;
      let biplotsCaptured = false;
      const capturedCharts: { [key: string]: HTMLCanvasElement } = {};

      if (results.pca) {
        console.log("Capturing PCA charts...");
        await captureChartsFromStep(1, 2000); // PCA step

        // Additional wait for Plotly charts to render
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force plots to redraw
        window.dispatchEvent(new Event("resize"));
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if PCA element exists and capture it
        const pcaElement = document.getElementById("pca-variance-chart");
        console.log("PCA variance chart element:", pcaElement);
        if (pcaElement) {
          const rect = pcaElement.getBoundingClientRect();
          console.log("PCA chart dimensions:", rect.width, "x", rect.height);

          try {
            const canvas = await html2canvas(pcaElement, {
              useCORS: true,
              scale: 2,
              logging: false,
              backgroundColor: "#ffffff",
            });
            capturedCharts["pca-variance-chart"] = canvas;
            pcaCaptured = true;
            console.log("PCA chart captured successfully");
          } catch (error) {
            console.error("Failed to capture PCA chart:", error);
          }
        }
      }

      if (results.clustering) {
        console.log("Capturing clustering charts...");
        await captureChartsFromStep(2, 2000); // Clustering step

        // Additional wait for Plotly charts to render
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force plots to redraw
        window.dispatchEvent(new Event("resize"));
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check if clustering element exists and capture it
        const elbowElement = document.getElementById("elbow-chart");
        console.log("Elbow chart element:", elbowElement);
        if (elbowElement) {
          const rect = elbowElement.getBoundingClientRect();
          console.log("Elbow chart dimensions:", rect.width, "x", rect.height);

          try {
            const canvas = await html2canvas(elbowElement, {
              useCORS: true,
              scale: 2,
              logging: false,
              backgroundColor: "#ffffff",
            });
            capturedCharts["elbow-chart"] = canvas;
            clusteringCaptured = true;
            console.log("Clustering chart captured successfully");
          } catch (error) {
            console.error("Failed to capture clustering chart:", error);
          }
        }
      }

      if (results.biplots && results.biplots.length > 0) {
        console.log(`Found ${results.biplots.length} biplots to capture`);
        await captureChartsFromStep(3, 3000); // Biplot step - more time for multiple charts

        // Additional wait for Plotly charts to render
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force all plots to redraw by triggering a resize event
        window.dispatchEvent(new Event("resize"));
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check if biplot elements exist and capture them
        for (const biplot of results.biplots) {
          const element = document.getElementById(`biplot-chart-${biplot.id}`);
          console.log(`Biplot (ID: ${biplot.id}) element:`, element);
          if (element) {
            const rect = element.getBoundingClientRect();
            console.log(
              `Biplot ${biplot.id} dimensions:`,
              rect.width,
              "x",
              rect.height
            );

            try {
              const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                logging: false,
                backgroundColor: "#ffffff",
              });
              capturedCharts[`biplot-chart-${biplot.id}`] = canvas;
              biplotsCaptured = true;
              console.log(`Biplot ${biplot.id} captured successfully`);
            } catch (error) {
              console.error(`Failed to capture biplot ${biplot.id}:`, error);
            }
          }
        }
      }

      // Stay on step 3 to ensure all charts remain in DOM while generating PDF
      console.log(
        "Staying on step 3 to generate PDF with all charts available..."
      );
      await captureChartsFromStep(3, 1000); // Ensure we're on biplot step where all charts are accessible

      // Generate the PDF while charts are available
      console.log("Generating comprehensive PDF with captured charts...");
      console.log(
        `Charts captured: PCA=${pcaCaptured}, Clustering=${clusteringCaptured}, Biplots=${biplotsCaptured}`
      );
      const pdf = await generateAnalysisPDF(analysisData, capturedCharts);

      // Download the PDF
      const filename = `analyse_${selectedPromo}_${new Date()
        .toLocaleDateString("fr-FR")
        .replace(/\//g, "-")}.pdf`;
      pdf.save(filename);

      // Restore original step
      setCurrentStep(originalStep);
      setLoading(false);

      updateStepStatus("export", "completed");
      toast({
        title: "Succès",
        description: "Rapport PDF généré et téléchargé avec succès",
      });
    } catch (error) {
      console.error("Error during PDF export:", error);
      setCurrentStep(currentStep); // Use current step as fallback
      setLoading(false);
      updateStepStatus("export", "error");
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération du rapport PDF",
        variant: "destructive",
      });
    }
  };
  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "active":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return step.icon;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Sélection Jeu de Données et Modules
              </CardTitle>
              <CardDescription>
                Sélectionnez la promo et les modules que vous souhaitez inclure
                dans l'analyse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Promo Selection */}
              <div className="space-y-2">
                <Label htmlFor="promo">Sélectionner la Promo</Label>
                <Select value={selectedPromo} onValueChange={setSelectedPromo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une promo" />
                  </SelectTrigger>
                  <SelectContent>
                    {promos.map((promo) => (
                      <SelectItem key={promo.promo} value={promo.promo}>
                        {promo.promo} ({promo.student_count} étudiants)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Module Selection */}
              {selectedPromo && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sélectionner les Modules</Label>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllModules}
                      >
                        Tout Sélectionner
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearModules}
                      >
                        Effacer
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableModules.map((module) => (
                      <div key={module} className="flex items-center space-x-2">
                        <Checkbox
                          id={module}
                          checked={selectedModules.includes(module)}
                          onCheckedChange={() => handleModuleToggle(module)}
                        />
                        <Label
                          htmlFor={module}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {module}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {selectedModules.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm text-muted-foreground">
                        Selected Modules ({selectedModules.length}):
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedModules.map((module) => (
                          <Badge key={module} variant="secondary">
                            {module}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={performPCAAndProceed}
                  disabled={
                    !selectedPromo || selectedModules.length === 0 || loading
                  }
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Procéder à l'Analyse ACP
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Résultats de l'Analyse ACP
              </CardTitle>
              <CardDescription>
                Résultats de l'Analyse en Composantes Principales et explication
                de la variance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.pca ? (
                <div className="space-y-6">
                  {/* PCA Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.pca.data?.n_components || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Principal Components
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.pca.explained_variance
                            ? (results.pca.explained_variance[0] * 100).toFixed(
                                1
                              ) + "%"
                            : "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Variance Expliquée CP1
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.pca.cumulative_variance
                            ? (
                                results.pca.cumulative_variance[1] * 100
                              ).toFixed(1) + "%"
                            : "0%"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          CP1+CP2 Cumulé
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Variance Plots */}
                  <Tabs defaultValue="variance" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="variance">
                        Variance Expliquée
                      </TabsTrigger>
                      <TabsTrigger value="cumulative">
                        Variance Cumulée
                      </TabsTrigger>
                      <TabsTrigger value="loadings">Contributions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="variance" className="space-y-4">
                      {results.pca.variance_plot && (
                        <div
                          id="pca-variance-chart"
                          className="w-full flex items-center justify-center"
                        >
                          <Plot
                            data={JSON.parse(results.pca.variance_plot).data}
                            layout={
                              JSON.parse(results.pca.variance_plot).layout
                            }
                            config={{ responsive: true }}
                            className="w-fit"
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="cumulative" className="space-y-4">
                      {results.pca.cumulative_plot && (
                        <div className="w-full flex items-center justify-center">
                          <Plot
                            data={JSON.parse(results.pca.cumulative_plot).data}
                            layout={
                              JSON.parse(results.pca.cumulative_plot).layout
                            }
                            config={{ responsive: true }}
                            className="w-fit"
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="loadings" className="space-y-4">
                      <div className="w-0 min-w-full overflow-x-auto border rounded-md">
                        <table className="table-fixed w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left w-32">
                                <div className="truncate">Module</div>
                              </th>
                              {results.pca.loadings &&
                                Object.keys(
                                  Object.values(results.pca.loadings)[0] || {}
                                ).map((pc: string) => (
                                  <th
                                    key={pc}
                                    className="border border-gray-300 px-4 py-2 text-center w-24"
                                  >
                                    <div className="truncate">{pc}</div>
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {results.pca.loadings &&
                              Object.entries(results.pca.loadings).map(
                                ([module, loadings]: [
                                  string,
                                  Record<string, number>
                                ]) => (
                                  <tr key={module}>
                                    <td className="border border-gray-300 px-4 py-2 font-medium">
                                      <div className="truncate" title={module}>
                                        {module}
                                      </div>
                                    </td>
                                    {Object.values(loadings).map(
                                      (value: number, idx: number) => (
                                        <td
                                          key={idx}
                                          className="border border-gray-300 px-4 py-2 text-center"
                                        >
                                          <div
                                            className={`truncate font-medium ${
                                              value >= 0
                                                ? "text-green-600"
                                                : "text-red-600"
                                            }`}
                                            title={
                                              typeof value === "number"
                                                ? value.toString()
                                                : value
                                            }
                                          >
                                            {typeof value === "number"
                                              ? value.toFixed(3)
                                              : value}
                                          </div>
                                        </td>
                                      )
                                    )}
                                  </tr>
                                )
                              )}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(2)}
                      className="flex items-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Procéder à la Classification
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Prêt à effectuer l'analyse ACP sur le jeu de données et
                      les modules sélectionnés.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end">
                    <Button
                      onClick={performPCA}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Lancer l'Analyse ACP
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analyse de Classification
              </CardTitle>
              <CardDescription>
                Classification K-Means avec méthode du coude pour la détection
                optimale des clusters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Step 1: Elbow Method */}
                {!elbowCompleted ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          1
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Analyse Méthode du Coude
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Trouver le nombre optimal de clusters en utilisant
                            la méthode du coude
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor="max-k" className="text-sm">
                          Max K:
                        </Label>
                        <Input
                          id="max-k"
                          type="number"
                          min="5"
                          max="20"
                          value={maxK}
                          onChange={(e) => setMaxK(parseInt(e.target.value))}
                          className="w-20 h-8"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={performElbowAnalysis}
                        disabled={loading || !results.pca}
                        className="flex items-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Lancer l'Analyse du Coude
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step 1 Completed - Show Elbow Results */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                          ✓
                        </div>
                        <div>
                          <h3 className="font-medium">
                            Résultats Méthode du Coude
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            K optimal suggéré:{" "}
                            <span className="font-medium">
                              {results.elbow?.suggested_k}
                            </span>
                          </p>
                        </div>
                      </div>

                      {results.elbow?.elbow_plot && (
                        <div className="border rounded-lg p-4">
                          <div
                            id="elbow-chart"
                            className="w-full flex items-center justify-center"
                          >
                            <Plot
                              data={JSON.parse(results.elbow.elbow_plot).data}
                              layout={
                                JSON.parse(results.elbow.elbow_plot).layout
                              }
                              config={{ responsive: true }}
                              className="w-fit"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Choose K and Run Clustering */}
                    {!results.clustering ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                            2
                          </div>
                          <div>
                            <h3 className="font-medium">
                              Choisir K et Lancer la Classification
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Sélectionner le nombre de clusters basé sur
                              l'analyse du coude
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="selected-k">
                              Nombre de clusters (K)
                            </Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                id="selected-k"
                                type="number"
                                min="2"
                                max="20"
                                value={selectedK || ""}
                                onChange={(e) =>
                                  setSelectedK(parseInt(e.target.value))
                                }
                                className="w-32"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setSelectedK(results.elbow?.suggested_k || 3)
                                }
                              >
                                Utiliser Suggéré ({results.elbow?.suggested_k})
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={performClustering}
                            disabled={loading || !selectedK}
                            className="flex items-center gap-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Lancer Classification K-Means
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Clustering Results */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                            ✓
                          </div>
                          <div>
                            <h3 className="font-medium">Clustering Complete</h3>
                            <p className="text-sm text-muted-foreground">
                              K-Means clustering with K={selectedK} completed
                              successfully
                            </p>
                          </div>
                        </div>

                        {/* Clustering Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                {selectedK}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Clusters Used
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                {results.clustering.silhouette_score
                                  ? results.clustering.silhouette_score.toFixed(
                                      3
                                    )
                                  : "N/A"}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Silhouette Score
                              </p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-2xl font-bold">
                                {results.clustering.cluster_assignments
                                  ? results.clustering.cluster_assignments
                                      .length
                                  : "N/A"}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Students Clustered
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Cluster Statistics */}
                        <div className="space-y-4">
                          <h4 className="font-medium">
                            Statistiques des Clusters
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.clustering.cluster_statistics &&
                              Object.entries(
                                results.clustering.cluster_statistics
                              ).map(
                                ([clusterId, stats]: [
                                  string,
                                  {
                                    size: number;
                                    percentage: number;
                                    students?: string[];
                                  }
                                ]) => (
                                  <Card key={clusterId}>
                                    <CardHeader className="pb-2">
                                      <CardTitle className="text-lg">
                                        Cluster {clusterId.split("_")[1]}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span>Taille:</span>
                                          <span className="font-medium">
                                            {stats.size}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Pourcentage:</span>
                                          <span className="font-medium">
                                            {stats.percentage.toFixed(1)}%
                                          </span>
                                        </div>
                                        <Separator />
                                        <div className="text-xs text-muted-foreground">
                                          Étudiants Exemples:
                                        </div>
                                        <div className="text-xs">
                                          {stats.students
                                            ?.slice(0, 3)
                                            .join(", ")}
                                          {stats.students?.length > 3 && "..."}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              )}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => setCurrentStep(3)}
                            className="flex items-center gap-2"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Procéder au Biplot
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScatterChart className="w-5 h-5" />
                Visualisation Biplot
              </CardTitle>
              <CardDescription>
                Visualisation interactive 2D des composantes principales et des
                clusters d'étudiants. Créez plusieurs biplots avec différentes
                combinaisons de CP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Biplot Creation Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="w-5 h-5" />
                    <h3 className="text-lg font-medium">
                      Créer un Nouveau Biplot
                    </h3>
                  </div>

                  {/* PC Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pc1">
                        Première Composante Principale
                      </Label>
                      <Select
                        value={selectedPC1.toString()}
                        onValueChange={(value) =>
                          setSelectedPC1(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {results.pca?.data?.n_components &&
                            Array.from(
                              { length: results.pca.data.n_components },
                              (_, i) => (
                                <SelectItem
                                  key={i + 1}
                                  value={(i + 1).toString()}
                                >
                                  CP{i + 1}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pc2">
                        Deuxième Composante Principale
                      </Label>
                      <Select
                        value={selectedPC2.toString()}
                        onValueChange={(value) =>
                          setSelectedPC2(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {results.pca?.data?.n_components &&
                            Array.from(
                              { length: results.pca.data.n_components },
                              (_, i) => (
                                <SelectItem
                                  key={i + 1}
                                  value={(i + 1).toString()}
                                >
                                  CP{i + 1}
                                </SelectItem>
                              )
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={generateBiplot}
                      disabled={
                        loading ||
                        !results.clustering ||
                        selectedPC1 === selectedPC2 ||
                        isBiplotDuplicate(selectedPC1, selectedPC2)
                      }
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter Biplot
                    </Button>
                  </div>

                  {selectedPC1 === selectedPC2 && (
                    <p className="text-sm text-amber-600 text-center">
                      Veuillez sélectionner des composantes principales
                      différentes
                    </p>
                  )}

                  {selectedPC1 !== selectedPC2 &&
                    isBiplotDuplicate(selectedPC1, selectedPC2) && (
                      <p className="text-sm text-amber-600 text-center">
                        Biplot pour CP{selectedPC1} vs CP{selectedPC2} existe
                        déjà
                      </p>
                    )}
                </div>

                <Separator />

                {/* Existing Biplots */}
                {results.biplots && results.biplots.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Generated Biplots ({results.biplots.length})
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {results.biplots.map((biplot, index) => (
                        <Card key={biplot.id} className="w-full">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">
                                  {biplot.name}
                                </CardTitle>
                                <CardDescription>
                                  Variance explained:{" "}
                                  {biplot.explained_variance_pc1 &&
                                  biplot.explained_variance_pc2
                                    ? (
                                        (biplot.explained_variance_pc1 +
                                          biplot.explained_variance_pc2) *
                                        100
                                      ).toFixed(1) + "%"
                                    : "N/A"}{" "}
                                  • Created: {biplot.created_at}
                                </CardDescription>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Supprimer le Biplot
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer le
                                      biplot "{biplot.name}" ? Cette action ne
                                      peut pas être annulée.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Annuler
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeBiplot(biplot.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {biplot.biplot && (
                              <div
                                id={`biplot-chart-${biplot.id}`}
                                className="flex justify-center items-center"
                              >
                                <Plot
                                  data={JSON.parse(biplot.biplot).data}
                                  layout={JSON.parse(biplot.biplot).layout}
                                  config={{ responsive: true }}
                                  className="w-fit"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {(!results.biplots || results.biplots.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <ScatterChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No biplots created yet. Generate your first biplot above.
                    </p>
                  </div>
                )}

                {results.biplots && results.biplots.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setCurrentStep(4)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Procéder à l'exportation
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Résultats et Export
              </CardTitle>
              <CardDescription>
                Exportez vos résultats d'analyse et générez des rapports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Export Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Options d'Export</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button
                      onClick={() => exportResults("json")}
                      variant="outline"
                      className="flex items-center gap-2 h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Exporter en JSON</div>
                        <div className="text-sm text-muted-foreground">
                          Résultats complets d'analyse avec graphiques
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => exportResults("csv")}
                      variant="outline"
                      className="flex items-center gap-2 h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">Exporter en CSV</div>
                        <div className="text-sm text-muted-foreground">
                          Affectations clusters des étudiants
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={exportToPDF}
                      variant="outline"
                      className="flex items-center gap-2 h-auto p-4"
                      disabled={!results.pca}
                    >
                      <FileText className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Rapport PDF</div>
                        <div className="text-sm text-muted-foreground">
                          Rapport complet avec graphiques
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Analysis Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Résumé de l'Analyse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedPromo}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Promo Analysée
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {selectedModules.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Modules Sélectionnés
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.pca?.data?.n_components || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Composantes CP
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {results.clustering?.optimal_k || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Clusters Trouvés
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Selected Modules */}
                <div className="space-y-2">
                  <h4 className="font-medium">Modules Sélectionnés:</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedModules.map((module) => (
                      <Badge key={module} variant="secondary">
                        {module}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Data Analysis</h1>
            <p className="text-muted-foreground">
              PCA and clustering analysis for student performance data
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Analysis Workflow</h2>
              <Progress
                value={((currentStep + 1) / steps.length) * 100}
                className="w-32"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center space-x-1 min-w-0 flex-shrink-0"
                >
                  <Button
                    variant={
                      index === currentStep
                        ? "default"
                        : step.status === "completed"
                        ? "secondary"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      canProceedToStep(index) && setCurrentStep(index)
                    }
                    disabled={!canProceedToStep(index)}
                    className="flex items-center gap-1 text-xs min-w-0"
                  >
                    {getStepIcon(step)}
                    <span className="hidden sm:inline truncate">
                      {step.title}
                    </span>
                  </Button>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block w-4 h-px bg-border flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {renderStepContent()}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <div>
                    <p className="font-medium">Traitement de l'Analyse</p>
                    <p className="text-sm text-muted-foreground">
                      Veuillez patienter pendant que nous analysons vos
                      données...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analysis;
