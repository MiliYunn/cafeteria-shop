import { DatePipe } from "@angular/common";
import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { Icon } from "./icon";
import { Pagination, ShopApi, ShopOrder, errorMessage } from "./shop-api";

@Component({
  selector: "app-order-history",
  imports: [DatePipe, FormsModule, Icon],
  template: `<section class="panel order-history-page">
    <div class="history-heading"><div><span class="eyebrow">ORDER MANAGEMENT</span><h2>Order history</h2><p>Review all customer orders and their current status.</p></div></div>
    <form class="history-filters" (ngSubmit)="applyFilters()">
      <label><span>Order code</span><input name="order_code" [(ngModel)]="filters.order_code" placeholder="Search order code" /></label>
      <label><span>Customer name</span><input name="customer_name" [(ngModel)]="filters.customer_name" placeholder="Search customer" /></label>
      <label><span>Order date</span><input name="order_date" type="date" [(ngModel)]="filters.order_date" /></label>
      <label><span>Status</span><select name="status" [(ngModel)]="filters.status"><option value="">All statuses</option>@for (status of statuses; track status) { <option [value]="status">{{ label(status) }}</option> }</select></label>
      <div class="history-filter-actions"><button class="primary" type="submit">Apply filters</button><button class="secondary" type="button" (click)="clearFilters()">Clear</button></div>
    </form>
    @if (error()) { <div class="form-error order-error">{{ error() }}</div> }
    @if (loading()) {
      <div class="order-loading"><span></span><span></span><span></span></div>
    } @else {
      <div class="table-wrap order-history-table"><table><thead><tr><th>No.</th><th>Order code</th><th>Customer</th><th>Order date</th><th>Type</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
        @for (order of orders(); track order.id; let index = $index) {
          <tr tabindex="0" (click)="view(order)" (keydown.enter)="view(order)"><td>{{ rowNumber(index) }}</td><td><strong>{{ order.order_code }}</strong></td><td><span class="history-customer"><strong>{{ order.customer.fullname }}</strong><small>{{ order.customer.email }}</small></span></td><td>{{ order.order_at | date:'mediumDate' }}<small class="history-time">{{ order.order_at | date:'shortTime' }}</small></td><td>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</td><td><strong>RM {{ money(order.total_amount) }}</strong></td><td><em class="detail-status" [attr.data-status]="order.status">{{ order.status }}</em></td><td><button class="icon-button" type="button" aria-label="View order details"><app-icon name="right" [size]="17" /></button></td></tr>
        } @empty { <tr><td colspan="8"><div class="history-empty">No orders match these filters.</div></td></tr> }
      </tbody></table></div>
    }
    <div class="history-pagination"><span>Showing {{ rangeStart() }}–{{ rangeEnd() }} of {{ pagination().total }}</span><div><button class="secondary" [disabled]="!pagination().has_previous" (click)="changePage(-1)">Previous</button><span>Page {{ pagination().page }} of {{ pagination().total_pages || 1 }}</span><button class="secondary" [disabled]="!pagination().has_next" (click)="changePage(1)">Next</button></div></div>
  </section>`,
})
export class OrderHistory implements OnInit {
  private api = inject(ShopApi);
  private router = inject(Router);
  readonly orders = signal<ShopOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal("");
  readonly pagination = signal<Pagination>({ page: 1, per_page: 10, total: 0, total_pages: 0, has_next: false, has_previous: false });
  readonly statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
  filters = { order_code: "", customer_name: "", order_date: "", status: "" };

  ngOnInit() { this.load(); }
  load(page = this.pagination().page) {
    this.loading.set(true); this.error.set("");
    this.api.orders({ page, per_page: 10, ...this.filters }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => { this.orders.set(response.data); this.pagination.set(response.pagination); },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }
  applyFilters() { this.load(1); }
  clearFilters() { this.filters = { order_code: "", customer_name: "", order_date: "", status: "" }; this.load(1); }
  changePage(change: number) { this.load(this.pagination().page + change); }
  view(order: ShopOrder) { void this.router.navigate(["/pos/orders", order.id]); }
  rowNumber(index: number) { return (this.pagination().page - 1) * 10 + index + 1; }
  rangeStart() { return this.pagination().total ? (this.pagination().page - 1) * 10 + 1 : 0; }
  rangeEnd() { return Math.min(this.pagination().page * 10, this.pagination().total); }
  label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
