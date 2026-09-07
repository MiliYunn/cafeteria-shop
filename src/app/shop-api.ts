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
interface ListResponse<T = Entity> extends Response<T[]> {
  pagination: Pagination;
}
export interface UploadResult {
  filename: string;
  original_filename: string;
  path: string;
  url: string;
}
export interface OrderFeeConfiguration {
  tax_fee: number | string;
  pickup_service_fee: number | string;
  delivery_service_fee: number | string;
}
export interface ShopOrderItem {
  id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  amount: number | string;
}
export interface ShopOrder {
  id: number;
  order_code: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  order_at: string;
  subtotal_amount: number | string;
  tax_fee: number | string;
  service_fee: number | string;
  total_amount: number | string;
  is_pickup: boolean;
  delivery_location?: string | null;
  remark?: string | null;
  customer: { id: number; fullname: string; email: string };
  items: ShopOrderItem[];
  payment_account?: {
    account_holder_name: string;
    account_number: string;
    payment_method: { name: string; type: string };
  } | null;
  status_history?: { id: number; order_id: number; status: string; created_at: string }[];
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
  orderFees() {
    return this.http.get<Response<OrderFeeConfiguration>>(`${API}/order-fees`);
  }
  orders(query: Record<string, string | number> = {}) {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== "") params = params.set(key, String(value));
    });
    return this.http.get<ListResponse<ShopOrder>>(`${API}/orders`, { params });
  }
  updateOrderStatus(orderId: number, status: ShopOrder["status"]) {
    return this.http.put<Response<ShopOrder>>(`${API}/orders/${orderId}/status`, { status });
  }
  order(orderId: number) {
    return this.http.get<Response<ShopOrder>>(`${API}/orders/${orderId}`);
  }
}
