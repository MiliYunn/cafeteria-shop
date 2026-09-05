import { Component, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { Auth } from "./auth";
import { Icon } from "./icon";

@Component({
  selector: "app-pos",
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `<div class="pos-shell">
    <aside class="side-nav">
      <div class="brand-mark">
        <span>AP</span>
        <div><strong>APCafeteria</strong><small>SHOP PORTAL</small></div>
      </div>
      <nav>
        <a
          routerLink="/pos"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
          ><app-icon name="pos" /><span>New order</span></a
        >
        <p>MANAGEMENT</p>
        <a routerLink="/pos/menus" routerLinkActive="active"
          ><app-icon name="menu" /><span>Menu</span></a
        ><a routerLink="/pos/staff" routerLinkActive="active"
          ><app-icon name="staff" /><span>Staff</span></a
        ><a routerLink="/pos/payment-accounts" routerLinkActive="active"
          ><app-icon name="payment" /><span>Payment accounts</span></a
        ><a routerLink="/pos/settings" routerLinkActive="active"
          ><app-icon name="settings" /><span>Settings</span></a
        >
      </nav>
      <button class="sign-out" (click)="logout()">
        <app-icon name="logout" /><span>Log out</span>
      </button>
    </aside>
    <main class="main-area">
      <header class="topbar">
        <div>
          <span class="eyebrow">SHOP WORKSPACE</span>
          <h1>{{ shop()?.["name"] || "Point of sale" }}</h1>
        </div>
        <div class="shop-status"><i></i><span>Shop online</span></div>
      </header>
      <router-outlet />
    </main>
  </div>`,
})
export class Pos {
  private auth = inject(Auth);
  readonly shop = signal<Record<string, unknown> | null>(null);
  constructor() {
    this.auth
      .profile()
      .subscribe({ next: (response) => this.shop.set(response.data) });
  }
  logout() {
    this.auth.clear();
  }
}
