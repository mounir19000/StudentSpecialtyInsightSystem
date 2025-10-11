import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface AnalysisData {
  selectedPromo: string;
  selectedColumns: string[];
  pcaResults: {
    explained_variance?: number[];
    cumulative_variance?: number[];
    loadings?: Record<string, Record<string, number>>;
    variance_plot?: string;
    cumulative_plot?: string;
  } | null;
  clusteringResults: {
    optimal_k?: number;
    silhouette_score?: number;
    cluster_assignments?: {
      [key: string]: string | number;
      matricule: string;
      cluster: number;
    }[];
    cluster_statistics?: Record<
      string,
      { size: number; percentage: number; students?: string[] }
    >;
    elbow_plot?: string;
  } | null;
  biplotData: Array<{
    id: string;
    name: string;
    pc1?: number;
    pc2?: number;
    biplot?: string;
    explained_variance_pc1?: number;
    explained_variance_pc2?: number;
    created_at: string;
  }>;
  studentsData: unknown[];
}

export const generateAnalysisPDF = async (
  data: AnalysisData,
  capturedCharts?: { [key: string]: HTMLCanvasElement }
) => {
  console.log("Starting PDF generation with data:", data);
  console.log(
    "Pre-captured charts available:",
    Object.keys(capturedCharts || {})
  );

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const addPageIfNeeded = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Helper function to add text with word wrapping
  const addText = (
    text: string,
    fontSize: number = 12,
    fontStyle: "normal" | "bold" = "normal"
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", fontStyle);

    const lines = pdf.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.5;

    addPageIfNeeded(lines.length * lineHeight);

    lines.forEach((line: string) => {
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 5; // Add some spacing after text
  };

  // Helper function to capture and add chart with step navigation
  const addChart = async (
    elementId: string,
    title: string,
    stepIndex?: number
  ) => {
    console.log(`Attempting to capture chart: ${elementId}`);

    // Check if we have a pre-captured chart for this element
    if (capturedCharts && capturedCharts[elementId]) {
      console.log(`Using pre-captured chart for ${elementId}`);
      const canvas = capturedCharts[elementId];

      // Add title
      addText(title, 14, "bold");

      // Calculate image dimensions
      const canvasAspectRatio = canvas.width / canvas.height;
      const maxWidth = pageWidth - 2 * margin;
      const maxHeight = 80; // mm

      let imgWidth = maxWidth;
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * canvasAspectRatio;
      }

      // Check if we need a new page
      if (yPosition + imgHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        addText(title, 14, "bold");
      }

      // Add image to PDF
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;

      console.log(`Successfully added pre-captured chart ${elementId} to PDF`);
      return;
    }

    // Fallback to original behavior if no pre-captured chart
    const element = document.getElementById(elementId);

    if (!element) {
      console.warn(`Element with ID '${elementId}' not found`);
      addText(`[Graphique non disponible: ${title}]`, 12, "normal");
      return;
    }

    console.log(`Found element for ${elementId}:`, element);

    // Check if element is visible
    const rect = element.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;

    if (!isVisible) {
      console.warn(
        `Element ${elementId} is not visible (width: ${rect.width}, height: ${rect.height})`
      );
      addText(`[Graphique non visible: ${title}]`, 12, "normal");
      return;
    }

    try {
      // Wait for Plotly to fully render
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Look for Plotly chart inside the element
      const plotlyDiv =
        element.querySelector(".plotly-graph-div") ||
        element.querySelector("[data-plotly]") ||
        element;
      const targetElement = (plotlyDiv as HTMLElement) || element;

      console.log(`Target element for capture:`, targetElement);

      const canvas = await html2canvas(targetElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true,
        width: targetElement.scrollWidth || targetElement.offsetWidth,
        height: targetElement.scrollHeight || targetElement.offsetHeight,
        onclone: (clonedDoc) => {
          // Ensure SVG elements are properly rendered
          const svgs = clonedDoc.querySelectorAll("svg");
          svgs.forEach((svg) => {
            const rect = svg.getBoundingClientRect();
            if (rect.width && rect.height) {
              svg.setAttribute("width", rect.width.toString());
              svg.setAttribute("height", rect.height.toString());
            }
          });
        },
      });

      console.log(
        `Canvas created for ${elementId}:`,
        canvas.width,
        "x",
        canvas.height
      );

      if (canvas.width === 0 || canvas.height === 0) {
        console.warn(`Canvas for ${elementId} has zero dimensions`);
        addText(`[Graphique vide: ${title}]`, 12, "normal");
        return;
      }

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      addPageIfNeeded(imgHeight + 20);

      addText(title, 14, "bold");
      pdf.addImage(imgData, "PNG", margin, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 10;

      console.log(`Successfully added chart ${elementId} to PDF`);
    } catch (error) {
      console.error(`Error capturing chart ${elementId}:`, error);
      addText(`[Erreur lors de la capture: ${title}]`, 12, "normal");
    }
  };

  // PDF Title
  addText("RAPPORT D'ANALYSE - PRÉDICTION DE SPÉCIALITÉS", 18, "bold");
  addText(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 12, "normal");
  addText("", 12); // Empty line

  // 1. Dataset Information
  addText("1. INFORMATIONS SUR LE DATASET", 16, "bold");
  addText(`Promotion sélectionnée: ${data.selectedPromo}`, 12, "normal");
  addText(
    `Nombre de colonnes analysées: ${data.selectedColumns.length}`,
    12,
    "normal"
  );
  addText("Colonnes sélectionnées:", 12, "bold");
  addText(data.selectedColumns.join(" - "), 10, "normal");
  addText("", 12); // Empty line

  // 2. PCA Results
  if (data.pcaResults) {
    addText("2. ANALYSE EN COMPOSANTES PRINCIPALES (ACP)", 16, "bold");

    // Try to capture PCA Variance Chart, with fallback
    try {
      await addChart("pca-variance-chart", "Variance expliquée par composante");
    } catch (error) {
      console.warn("Could not capture PCA chart, using fallback");
      addText("Graphique de variance ACP non disponible", 12, "normal");
    }

    // Try to capture PCA Cumulative Variance Chart, with fallback
    try {
      await addChart("pca-cumulative-chart", "Variance cumulative expliquée");
    } catch (error) {
      console.warn("Could not capture PCA cumulative chart, using fallback");
      addText(
        "Graphique de variance cumulative ACP non disponible",
        12,
        "normal"
      );
    }

    // PCA Summary (this will always work as it's text-based)
    if (data.pcaResults.explained_variance) {
      const totalVariance =
        data.pcaResults.explained_variance.reduce((sum, val) => sum + val, 0) *
        100;
      addText(
        `Variance totale expliquée: ${totalVariance.toFixed(2)}%`,
        12,
        "normal"
      );

      addText("Variance par composante:", 12, "bold");
      data.pcaResults.explained_variance.forEach((variance, index) => {
        addText(
          `• CP${index + 1}: ${(variance * 100).toFixed(2)}%`,
          10,
          "normal"
        );
      });
    }

    addText("", 12); // Empty line
  }

  // 3. Clustering Results
  if (data.clusteringResults) {
    addText("3. ANALYSE DE CLUSTERING", 16, "bold");

    // Try to capture Elbow Chart, with fallback
    try {
      await addChart(
        "elbow-chart",
        "Méthode du coude pour déterminer le nombre optimal de clusters"
      );
    } catch (error) {
      console.warn("Could not capture elbow chart, using fallback");
      addText("Graphique de la méthode du coude non disponible", 12, "normal");
    }

    // Clustering Summary (this will always work as it's text-based)
    if (data.clusteringResults.optimal_k) {
      addText(
        `Nombre de clusters: ${data.clusteringResults.optimal_k}`,
        12,
        "normal"
      );
    }
    if (data.clusteringResults.silhouette_score) {
      addText(
        `Score de silhouette: ${data.clusteringResults.silhouette_score.toFixed(
          3
        )}`,
        12,
        "normal"
      );
    }

    // Cluster distribution using cluster_statistics if available
    if (data.clusteringResults.cluster_statistics) {
      addText("Distribution des étudiants par cluster:", 12, "bold");
      Object.entries(data.clusteringResults.cluster_statistics).forEach(
        ([cluster, stats]) => {
          addText(
            `• Cluster ${cluster}: ${
              stats.size
            } étudiants (${stats.percentage.toFixed(1)}%)`,
            10,
            "normal"
          );
        }
      );
    }

    addText("", 12); // Empty line
  }

  // 4. Biplot Visualization
  if (data.biplotData && data.biplotData.length > 0) {
    addText("4. BIPLOT - VISUALISATION DES RÉSULTATS", 16, "bold");

    console.log("Biplot data for PDF:", data.biplotData);

    let capturedCount = 0;
    for (const biplot of data.biplotData) {
      console.log(`Processing biplot:`, biplot);
      if (biplot.biplot) {
        const chartTitle = `Biplot PC${biplot.pc1} vs PC${biplot.pc2}`;
        const chartId = `biplot-chart-${biplot.id}`;
        console.log(`Looking for chart with ID: ${chartId}`);

        // Check if element exists before trying to capture
        const element = document.getElementById(chartId);
        console.log(`Element found for ${chartId}:`, element);

        try {
          await addChart(chartId, chartTitle);
          capturedCount++;
        } catch (error) {
          console.warn(
            `Could not capture biplot ${biplot.id}, trying alternative approach`
          );

          // Try to extract the plot data and create a simple text representation
          try {
            const plotData = JSON.parse(biplot.biplot);
            addText(`${chartTitle}`, 14, "bold");
            addText(
              `• Données disponibles: ${plotData.data?.length || 0} séries`,
              10,
              "normal"
            );
            addText(
              `• Graphique interactif disponible dans l'interface`,
              10,
              "normal"
            );
          } catch (parseError) {
            addText(`[${chartTitle} - Données non disponibles]`, 12, "normal");
          }
        }
      }
    }

    if (capturedCount === 0) {
      addText(
        "Note: Les graphiques biplots n'ont pas pu être capturés dans le PDF, mais sont disponibles dans l'interface interactive.",
        10,
        "normal"
      );
    }

    addText(
      "Les biplots montrent la projection des étudiants et des variables sur les composantes principales sélectionnées, avec la coloration par cluster.",
      10,
      "normal"
    );
    addText("", 12); // Empty line
  } // 5. Analysis Summary Table
  addText("5. RÉSUMÉ DE L'ANALYSE", 16, "bold");

  // Create a summary table
  const summaryData = [
    ["Métrique", "Valeur"],
    ["Promotion", data.selectedPromo],
    ["Variables analysées", data.selectedColumns.length.toString()],
    ["Nombre d'étudiants", data.studentsData.length.toString()],
  ];

  if (data.pcaResults && data.pcaResults.explained_variance) {
    const totalVariance =
      data.pcaResults.explained_variance.reduce((sum, val) => sum + val, 0) *
      100;
    summaryData.push([
      "Variance ACP expliquée",
      `${totalVariance.toFixed(2)}%`,
    ]);
  }

  if (data.clusteringResults) {
    if (data.clusteringResults.optimal_k) {
      summaryData.push([
        "Nombre de clusters",
        data.clusteringResults.optimal_k.toString(),
      ]);
    }
    if (data.clusteringResults.silhouette_score) {
      summaryData.push([
        "Score de silhouette",
        data.clusteringResults.silhouette_score.toFixed(3),
      ]);
    }
  }

  // Add table to PDF immediately after the title
  const rowHeight = 8;
  const colWidth = contentWidth / 2;

  addPageIfNeeded(summaryData.length * rowHeight + 10);

  summaryData.forEach((row, index) => {
    if (index === 0) {
      // Header
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
    } else {
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
    }

    // Draw row background for header
    if (index === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPosition - 2, contentWidth, rowHeight, "F");
    }

    // Draw cell borders
    pdf.rect(margin, yPosition - 2, colWidth, rowHeight);
    pdf.rect(margin + colWidth, yPosition - 2, colWidth, rowHeight);

    // Add text
    pdf.text(row[0], margin + 2, yPosition + 4);
    pdf.text(row[1], margin + colWidth + 2, yPosition + 4);

    yPosition += rowHeight;
  });

  yPosition += 10; // Add some spacing after the table

  // Add footer with page numbers
  const pageCount = (
    pdf as jsPDF & { internal: { getNumberOfPages: () => number } }
  ).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Page ${i} sur ${pageCount}`,
      pageWidth - margin - 20,
      pageHeight - 10
    );
    pdf.text(
      "Rapport généré par Student Spec Insight",
      margin,
      pageHeight - 10
    );
  }

  return pdf;
};
