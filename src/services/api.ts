import { encode } from "punycode";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
}

export const apiService = new ApiService();
