import { Component, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToastrService } from "ngx-toastr";
import { Icon } from "./icon";
import { ShopApi, errorMessage } from "./shop-api";

@Component({
  selector: "app-settings-page",
  imports: [FormsModule, Icon],
  template: `
    <section class="settings-page panel">
      <div class="management-head">
        <div>
          <span class="eyebrow">SHOP SETTINGS</span>
          <h2>Operating hours</h2>
          <p>Set the normal opening and closing time shown for your shop.</p>
        </div>
      </div>

      @if (loading()) {
        <div class="settings-loading"><span></span><span></span></div>
      } @else {
        <form (ngSubmit)="save()">
          <div class="hours-card">
            <div class="hours-icon"><app-icon name="clock" [size]="25" /></div>
            <div class="time-fields">
              <label>
                <span>Open at</span>
                <input type="time" name="open_at" [(ngModel)]="openAt" />
                <small>The time your shop starts accepting orders.</small>
              </label>
              <div class="time-line"><span></span></div>
              <label>
                <span>Close at</span>
                <input type="time" name="close_at" [(ngModel)]="closeAt" />
                <small>The time your shop stops accepting orders.</small>
              </label>
            </div>
          </div>

          <div class="schedule-preview">
            <app-icon name="info" [size]="19" />
            <div>
              <strong>Current schedule</strong>
              <p>{{ scheduleText() }}</p>
            </div>
          </div>

          @if (formError()) {
            <p class="form-error">{{ formError() }}</p>
          }
          <div class="settings-actions">
            <button type="submit" class="primary" [disabled]="saving()">
              {{ saving() ? "Saving…" : "Save operating hours" }}
            </button>
          </div>
        </form>
      }
    </section>
  `,
})
export class SettingsPage implements OnInit {
  private api = inject(ShopApi);
  private toast = inject(ToastrService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formError = signal("");
  openAt = "";
  closeAt = "";

  ngOnInit() {
    this.api.getSettings().subscribe({
      next: (response) => {
        this.openAt = response.data["open_at"] || "";
        this.closeAt = response.data["close_at"] || "";
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }

  save() {
    if ((this.openAt && !this.closeAt) || (!this.openAt && this.closeAt)) {
      this.formError.set(
        "Enter both opening and closing times, or clear both.",
      );
      return;
    }
    this.formError.set("");
    this.saving.set(true);
    this.api
      .updateSettings({
        open_at: this.openAt || null,
        close_at: this.closeAt || null,
      })
      .subscribe({
        next: (response) => {
          this.openAt = response.data["open_at"] || "";
          this.closeAt = response.data["close_at"] || "";
          this.saving.set(false);
          this.toast.success("Operating hours updated.");
        },
        error: (error) => {
          this.saving.set(false);
          this.formError.set(errorMessage(error));
        },
      });
  }

  scheduleText() {
    if (!this.openAt || !this.closeAt)
      return "Operating hours have not been set.";
    if (this.closeAt <= this.openAt)
      return `${this.openAt} to ${this.closeAt} the following day.`;
    return `${this.openAt} to ${this.closeAt} daily.`;
  }
}
