import { encode } from "punycode";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "API request failed");
    }

    return data;
  }

  // Students API
  async getStudents(
    params: {
      search?: string;
      specialty?: string;
      promo?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/students?${queryParams}`);
  }

  async getStudentsByModule(params: {
    module: string;
    page?: number;
    limit?: number;
    search?: string;
    specialty?: string;
    promo?: string;
  }) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });

    return this.request(`/students/rank-by-module?${queryParams}`);
  }

  async getStudent(matricule: string) {
    // Double encode to handle slashes in matricules like "22/0040"
    const encodedMatricule = encodeURIComponent(encodeURIComponent(matricule));
    return this.request(`/students/${encodedMatricule}`);
  }

  // Upload API
  async uploadStudentData(file: File, promo: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("promo", promo);

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/upload/student-data`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Upload failed");
    }

    return data;
  }

  // Dashboard API
  async getDashboardStats(promos?: string[]) {
    const queryParams = promos ? `?promos=${promos.join(",")}` : "";
    return this.request(`/dashboard/stats${queryParams}`);
  }

  async getSpecialtyAnalysis() {
    return this.request("/dashboard/specialty-analysis");
  }

  // Promos API
  async getPromos() {
    return this.request("/promos");
  }

  async deletePromo(promo: string) {
    return this.request(`/promos/${promo}`, { method: "DELETE" });
  }

  // Export API
  async exportStudents(filters: any) {
    return this.request("/export/students", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  }

  // Analysis API
  async getAvailableModules(promo: string) {
    return this.request(`/analysis/modules/${promo}`);
  }

  async performPCA(data: {
    promo: string;
    modules: string[];
    n_components?: number;
  }) {
    return this.request("/analysis/pca", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async performClustering(data: {
    promo: string;
    modules: string[];
    n_clusters?: number;
    auto_detect_k: boolean;
    max_k: number;
  }) {
    return this.request("/analysis/clustering", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async performElbowAnalysis(data: {
    promo: string;
    modules: string[];
    max_k: number;
  }) {
    return this.request("/analysis/elbow", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async generateBiplot(data: {
    promo: string;
    modules: string[];
    pc1: number;
    pc2: number;
    n_clusters: number;
  }) {
    return this.request("/analysis/biplot", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async exportAnalysis(
    promo: string,
    modules: string[],
    format: string = "json"
  ) {
    const params = new URLSearchParams({
      modules: modules.join(","),
      format: format,
    });

    if (format === "csv") {
      const response = await fetch(
        `${API_BASE_URL}/analysis/export/${promo}?${params}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      return response.blob();
    } else {
      return this.request(`/analysis/export/${promo}?${params}`);
    }
  }
}

export const apiService = new ApiService();
