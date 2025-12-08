import { useState } from "react";
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiService } from "@/services/api";

const Upload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [promo, setPromo] = useState<string>("");
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (
        validTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile);
        toast.success("Fichier sélectionné avec succès");
      } else {
        toast.error("Veuillez télécharger un fichier CSV ou Excel");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Veuillez d'abord sélectionner un fichier");
      return;
    }

    if (!promo.trim()) {
      toast.error("Veuillez spécifier la promotion");
      return;
    }

    setUploading(true);

    try {
      const response = await apiService.uploadStudentData(file, promo.trim());

      if (response.success) {
        toast.success(response.message);
        setShowPromoDialog(false);
        setPromo("");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors du téléchargement"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Télécharger les Données Étudiantes
          </h1>
          <p className="text-muted-foreground">
            Téléchargez un fichier CSV ou Excel contenant les informations et
            notes des étudiants
          </p>
        </div>

        <Card className="p-8 shadow-card">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-4">
                  {file ? (
                    <>
                      <CheckCircle className="h-16 w-16 text-primary" />
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          {file.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-16 w-16 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          Déposez votre fichier ici ou cliquez pour parcourir
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Supporte les fichiers CSV, XLS, XLSX
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </label>
            </div>

            {/* Required Columns Info */}
            <div className="bg-muted p-6 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Colonnes Requises
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                {[
                  "Matricule",
                  "SYS1",
                  "RES1",
                  "ANUM",
                  "RO",
                  "ORG",
                  "LANG1",
                  "IGL",
                  "THP",
                  "Rang S1",
                  "Moy S1",
                  "MCSI",
                  "BDD",
                  "SEC",
                  "CPROJ",
                  "PROJ",
                  "LANG2",
                  "ARCH",
                  "SYS2",
                  "RES2",
                  "Rang S2",
                  "Moy S2",
                  "Rang",
                  "Moy Rachat",
                ].map((col) => (
                  <span
                    key={col}
                    className="px-2 py-1 bg-background rounded text-xs"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPromo("");
                }}
                disabled={!file || uploading}
              >
                Effacer
              </Button>
              <Button
                onClick={() => {
                  if (!file) {
                    toast.error("Veuillez d'abord sélectionner un fichier");
                    return;
                  }
                  setShowPromoDialog(true);
                }}
                disabled={!file || uploading}
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                Traiter
              </Button>
            </div>
          </div>
        </Card>

        {/* Promo Dialog */}
        <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Spécifier la Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-promo" className="text-sm font-medium">
                  Promotion
                </Label>
                <Input
                  id="dialog-promo"
                  type="text"
                  placeholder="Ex: 2023, 2024, 2025..."
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && promo.trim()) {
                      handleUpload();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPromoDialog(false);
                    setPromo("");
                  }}
                  disabled={uploading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!promo.trim() || uploading}
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  {uploading ? "Traitement..." : "Confirmer et Traiter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Upload;
