import { DatePipe } from "@angular/common";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { finalize, interval } from "rxjs";
import { Icon } from "./icon";
import { ShopApi, ShopOrder, errorMessage } from "./shop-api";

@Component({
  selector: "app-order-detail",
  imports: [DatePipe, RouterLink, Icon],
  template: `<section class="order-detail-page">
    <div class="detail-page-heading"><a routerLink="/pos/orders" class="secondary back-to-orders"><app-icon name="left" [size]="18" />Order history</a><small>Updates every 10 seconds</small></div>
    @if (loading()) { <div class="panel detail-page-loading"></div> }
    @else if (error()) { <div class="form-error">{{ error() }}</div> }
    @else if (order(); as order) {
      <div class="detail-page-grid">
        <article class="panel detail-main-card">
          <header class="detail-title"><div><span class="eyebrow">ORDER DETAIL</span><h2>{{ order.order_code }}</h2><p>{{ order.order_at | date:'medium' }}</p></div><em class="detail-status" [attr.data-status]="order.status">{{ order.status }}</em></header>
          <section class="detail-data-grid"><div><small>Customer</small><strong>{{ order.customer.fullname }}</strong><span>{{ order.customer.email }}</span></div><div><small>Fulfilment</small><strong>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</strong><span>{{ order.is_pickup ? 'Customer will collect the order' : order.delivery_location }}</span></div><div><small>Payment method</small><strong>{{ order.payment_account?.payment_method?.name || '—' }}</strong><span>{{ order.payment_account?.payment_method?.type || '' }}</span></div><div><small>Payment account</small><strong>{{ order.payment_account?.account_holder_name || '—' }}</strong><span>{{ order.payment_account?.account_number || '' }}</span></div></section>
          @if (order.remark) { <section class="detail-page-note"><small>Customer note</small><p>{{ order.remark }}</p></section> }
          <section class="detail-page-section"><h3>Ordered items</h3><div class="detail-item-table">@for (item of order.items; track item.id) { <div><b>{{ item.quantity }}×</b><span>{{ item.menu_name }}</span><strong>RM {{ money(item.amount) }}</strong></div> }</div></section>
          <section class="detail-page-section"><h3>Status logs</h3><div class="detail-status-logs">@for (event of order.status_history || []; track event.id) { <div><i></i><span><strong>{{ label(event.status) }}</strong><small>{{ event.created_at | date:'medium' }}</small></span></div> } @empty { <p>No status logs available.</p> }</div></section>
        </article>
        <aside class="panel detail-action-card">
          <div><span class="eyebrow">STATUS</span><h2>{{ label(order.status) }}</h2></div>
          <div class="detail-fee-list"><span>Sub-total <strong>RM {{ money(order.subtotal_amount) }}</strong></span><span>Tax fee <strong>RM {{ money(order.tax_fee) }}</strong></span><span>Service fee <strong>RM {{ money(order.service_fee) }}</strong></span><span class="pos-total">Total fee <strong>RM {{ money(order.total_amount) }}</strong></span></div>
          <div class="detail-actions">@if (nextAction(order); as action) { <button class="primary wide" [disabled]="updating()" (click)="changeStatus(order, action.status)">{{ updating() ? 'Updating…' : action.label }}</button> } @if (canCancel(order)) { <button class="cancel-order wide" [disabled]="updating()" (click)="changeStatus(order, 'cancelled')">Cancel order</button> } @if (!nextAction(order) && !canCancel(order)) { <p>This order has no further status actions.</p> }</div>
        </aside>
      </div>
    }
  </section>`,
})
export class OrderDetail implements OnInit {
  private api = inject(ShopApi);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  readonly order = signal<ShopOrder | null>(null);
  readonly loading = signal(true);
  readonly updating = signal(false);
  readonly error = signal("");
  private orderId = 0;

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get("id"));
    if (!Number.isInteger(this.orderId) || this.orderId < 1) { void this.router.navigate(["/pos/orders"]); return; }
    this.load(); interval(10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(true));
  }
  load(silent = false) {
    if (!silent) this.loading.set(true); this.error.set("");
    this.api.order(this.orderId).pipe(finalize(() => { if (!silent) this.loading.set(false); })).subscribe({ next: (response) => this.order.set(response.data), error: (error) => this.error.set(errorMessage(error)) });
  }
  nextAction(order: ShopOrder) { return ({ pending: { status: "confirmed", label: "Accept order" }, confirmed: { status: "preparing", label: "Start preparing" }, preparing: { status: "ready", label: "Mark as ready" }, ready: { status: "completed", label: "Complete order" } } as const)[order.status as "pending" | "confirmed" | "preparing" | "ready"]; }
  canCancel(order: ShopOrder) { return ["pending", "confirmed", "preparing"].includes(order.status); }
  changeStatus(order: ShopOrder, status: ShopOrder["status"]) { this.updating.set(true); this.api.updateOrderStatus(order.id, status).pipe(finalize(() => this.updating.set(false))).subscribe({ next: (response) => { this.order.set(response.data); this.toast.success(`Order marked ${status}.`); }, error: (error) => this.toast.error(errorMessage(error)) }); }
  label(value: string) { return value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
  money(value: number | string) { return Number(value || 0).toFixed(2); }
}
