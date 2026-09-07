import { DatePipe } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastrService } from "ngx-toastr";
import { finalize, interval } from "rxjs";
import { Icon } from "./icon";
import { Pagination, ShopApi, ShopOrder, errorMessage } from "./shop-api";

@Component({
  selector: "app-dashboard",
  imports: [DatePipe, Icon],
  template: `<section class="workspace-grid orders-workspace">
    <div class="catalog panel incoming-orders">
      <div class="order-heading">
        <div><span class="eyebrow">LIVE QUEUE</span><h2>New orders</h2><small class="auto-refresh-note">Pending orders update every 10 seconds</small></div>
        <button class="secondary refresh-orders" [disabled]="loading()" (click)="loadOrders()">Refresh</button>
      </div>
      @if (error()) { <div class="form-error order-error">{{ error() }}</div> }
      @if (loading()) {
        <div class="order-loading"><span></span><span></span><span></span></div>
      } @else {
        <div class="incoming-list">
          @for (order of orders(); track order.id) {
            <button class="incoming-card" [class.selected]="selected()?.id === order.id" (click)="selected.set(order)">
              <span class="order-card-top"><strong>{{ order.order_code }}</strong><em data-status="pending">Pending</em></span>
              <span class="customer-name">{{ order.customer.fullname }}</span>
              <span class="order-card-meta"><small><app-icon name="clock" [size]="14" />{{ order.order_at | date:'short' }}</small><small>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</small><b>RM {{ money(order.total_amount) }}</b></span>
            </button>
          } @empty {
            <div class="empty-state orders-empty"><span class="empty-icon"><app-icon name="orders" [size]="28" /></span><h3>No new orders</h3><p>Pending customer orders will appear here automatically.</p></div>
          }
        </div>
      }
      @if (pagination().total_pages > 1) {
        <div class="order-pagination"><button class="secondary" [disabled]="!pagination().has_previous" (click)="changePage(-1)">Previous</button><span>Page {{ pagination().page }} of {{ pagination().total_pages }}</span><button class="secondary" [disabled]="!pagination().has_next" (click)="changePage(1)">Next</button></div>
      }
    </div>

    <aside class="order panel order-detail">
      @if (selected(); as order) {
        <header class="detail-head"><div><span class="eyebrow">NEW ORDER</span><h2>{{ order.order_code }}</h2></div><em class="detail-status" data-status="pending">Pending</em></header>
        <div class="customer-block"><strong>{{ order.customer.fullname }}</strong><span>{{ order.customer.email }}</span><small>{{ order.order_at | date:'medium' }}</small></div>
        <div class="fulfilment-card"><strong>{{ order.is_pickup ? 'Pickup order' : 'Delivery order' }}</strong>@if (!order.is_pickup) { <span>{{ order.delivery_location }}</span> }</div>
        <div class="ordered-items">@for (item of order.items; track item.id) { <div><b>{{ item.quantity }}×</b><span>{{ item.menu_name }}</span><strong>RM {{ money(item.amount) }}</strong></div> }</div>
        @if (order.remark) { <div class="order-note"><small>Customer note</small><p>{{ order.remark }}</p></div> }
        <div class="payment-detail"><span>Payment</span><strong>{{ order.payment_account?.payment_method?.name || '—' }}</strong></div>
        <footer>
          <div class="pos-fees"><span>Sub-total <strong>RM {{ money(order.subtotal_amount) }}</strong></span><span>Tax fee <strong>RM {{ money(order.tax_fee) }}</strong></span><span>Service fee <strong>RM {{ money(order.service_fee) }}</strong></span><span class="pos-total">Total fee <strong>RM {{ money(order.total_amount) }}</strong></span></div>
          <button class="primary wide" [disabled]="updating()" (click)="changeStatus(order, 'confirmed')">{{ updating() ? 'Updating…' : 'Accept order' }}</button>
          <button class="cancel-order wide" [disabled]="updating()" (click)="changeStatus(order, 'cancelled')">Cancel order</button>
        </footer>
      } @else {
        <div><span class="eyebrow">NEW ORDER</span><h2>Order details</h2></div><div class="empty-state compact"><p>Select a pending order to review and accept it.</p></div>
      }
    </aside>
  </section>`,
})
export class Dashboard implements OnInit {
  private api = inject(ShopApi);
  private toast = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  private latestOrderId: number | null = null;
  readonly orders = signal<ShopOrder[]>([]);
  readonly selected = signal<ShopOrder | null>(null);
  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly error = signal("");
  readonly pagination = signal<Pagination>({ page: 1, per_page: 10, total: 0, total_pages: 0, has_next: false, has_previous: false });

  ngOnInit() { this.loadOrders(); interval(10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.poll()); }
  loadOrders(page = this.pagination().page, silent = false) {
    if (!silent) this.loading.set(true);
    this.error.set("");
    this.api.orders({ page, per_page: 10, status: "pending" }).pipe(finalize(() => { if (!silent) this.loading.set(false); })).subscribe({
      next: (response) => {
        this.orders.set(response.data); this.pagination.set(response.pagination);
        if (this.latestOrderId === null && page === 1) this.latestOrderId = this.newestId(response.data);
        const selectedId = this.selected()?.id;
        this.selected.set(response.data.find((item) => item.id === selectedId) || response.data[0] || null);
      },
      error: (error) => this.error.set(errorMessage(error)),
    });
  }
  private poll() {
    this.api.orders({ page: 1, per_page: 10, status: "pending" }).subscribe({ next: (response) => {
      const fresh = this.latestOrderId === null ? [] : response.data.filter((order) => order.id > this.latestOrderId!);
      if (fresh.length === 1) this.toast.info(`${fresh[0].order_code} from ${fresh[0].customer.fullname}`, "New customer order");
      if (fresh.length > 1) this.toast.info(`${fresh.length} new orders have arrived.`, "New customer orders");
      const newest = this.newestId(response.data);
      if (newest !== null && (this.latestOrderId === null || newest > this.latestOrderId)) this.latestOrderId = newest;
      this.loadOrders(this.pagination().page, true);
    }});
  }
  private newestId(orders: ShopOrder[]) { return orders.length ? Math.max(...orders.map((order) => order.id)) : null; }
  changePage(change: number) { this.loadOrders(this.pagination().page + change); }
  changeStatus(order: ShopOrder, status: ShopOrder["status"]) {
    this.updating.set(true);
    this.api.updateOrderStatus(order.id, status).pipe(finalize(() => this.updating.set(false))).subscribe({
      next: () => { this.toast.success(status === "confirmed" ? "Order accepted." : "Order cancelled."); this.loadOrders(); },
      error: (error) => this.toast.error(errorMessage(error)),
    });
  }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
