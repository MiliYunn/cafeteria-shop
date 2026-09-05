import { Component } from "@angular/core";
import { Icon } from "./icon";

@Component({
  selector: "app-dashboard",
  imports: [Icon],
  template: `<section class="workspace-grid">
    <div class="catalog panel">
      <div class="section-heading">
        <div>
          <span class="eyebrow">COUNTER</span>
          <h2>Start a new order</h2>
        </div>
      </div>
      <div class="empty-state">
        <span class="empty-icon"><app-icon name="food" [size]="28" /></span>
        <h3>No menu items selected</h3>
        <p>
          Your available menu will be connected to this order workspace next.
        </p>
      </div>
    </div>
    <aside class="order panel">
      <div>
        <span class="eyebrow">ORDER</span>
        <h2>Current order</h2>
      </div>
      <div class="empty-state compact"><p>Select an item to begin.</p></div>
      <footer>
        <div><span>Total</span><strong>RM 0.00</strong></div>
        <button class="primary wide">Charge order</button>
      </footer>
    </aside>
  </section>`,
})
export class Dashboard {}
