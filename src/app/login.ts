import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Auth } from "./auth";
@Component({
  selector: "app-login",
  template: `<main class="login">
    <section>
      <span class="brand">Cafeteria</span>
      <h1>Welcome to your shop</h1>
      <p>Use your secure shop link to open the point of sale.</p>
      <button (click)="signIn()" [disabled]="loading()">
        {{ loading() ? "Signing in…" : "Open my shop" }}
      </button>
      @if (error()) {
        <div class="error">{{ error() }}</div>
      }
    </section>
  </main>`,
})
export class Login {
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  private router = inject(Router);
  loading = signal(false);
  error = signal(
    this.route.snapshot.queryParamMap.get("reason") === "session-expired"
      ? "Your session has expired. Reopen your secure shop login link."
      : "",
  );
  signIn() {
    const ce = this.route.snapshot.queryParamMap.get("ce"),
      cp = this.route.snapshot.queryParamMap.get("cp");
    if (!ce || !cp) {
      this.error.set(
        "This shop login link is incomplete. Ask an administrator for a new link.",
      );
      return;
    }
    this.loading.set(true);
    this.auth.login(ce, cp).subscribe({
      next: () => this.router.navigate(["/pos"]),
      error: () => {
        this.loading.set(false);
        this.error.set("This shop login link is invalid or inactive.");
      },
    });
  }
}
