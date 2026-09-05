import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { API } from "./auth";

export type Entity = Record<string, any>;
export interface Option {
  id: number;
  name: string;
}
export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}
interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}
interface ListResponse extends Response<Entity[]> {
  pagination: Pagination;
}
export interface UploadResult {
  filename: string;
  original_filename: string;
  path: string;
  url: string;
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const errors = error.error?.errors;
    if (errors && typeof errors === "object")
      return Object.values(errors).join(" ");
    return error.error?.message || "The request could not be completed.";
  }
  return "Something unexpected happened.";
}

@Injectable({ providedIn: "root" })
export class ShopApi {
  private http = inject(HttpClient);
  list(resource: string, query: Record<string, string | number | boolean>) {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined)
        params = params.set(key, String(value));
    });
    return this.http.get<ListResponse>(`${API}/${resource}`, { params });
  }
  options(resource: "genre-options" | "payment-method-options") {
    return this.http.get<Response<Option[]>>(`${API}/${resource}`);
  }
  create(resource: string, payload: Entity) {
    return this.http.post<Response<Entity>>(`${API}/${resource}`, payload);
  }
  update(resource: string, id: number, payload: Entity) {
    return this.http.put<Response<Entity>>(`${API}/${resource}/${id}`, payload);
  }
  delete(resource: string, id: number) {
    return this.http.delete<Response<never>>(`${API}/${resource}/${id}`);
  }
  upload(file: File) {
    const body = new FormData();
    body.append("file", file);
    return this.http.post<Response<UploadResult>>(`${API}/uploads`, body);
  }
  getSettings() {
    return this.http.get<Response<Entity>>(`${API}/settings`);
  }
  updateSettings(payload: { open_at: string | null; close_at: string | null }) {
    return this.http.put<Response<Entity>>(`${API}/settings`, payload);
  }
}
