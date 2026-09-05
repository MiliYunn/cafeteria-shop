import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Subject, debounceTime, takeUntil } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { Icon } from "./icon";
import { Entity, Option, Pagination, ShopApi, errorMessage } from "./shop-api";

type ResourceKey = "menus" | "staffs" | "payment-accounts";
interface ResourceConfig {
  title: string;
  singular: string;
  subtitle: string;
  icon: string;
}
const CONFIGS: Record<ResourceKey, ResourceConfig> = {
  menus: {
    title: "Menu management",
    singular: "Menu item",
    subtitle: "Create dishes, set prices, and control counter availability.",
    icon: "menu",
  },
  staffs: {
    title: "Staff management",
    singular: "Staff member",
    subtitle: "Keep your shop team contact details and status up to date.",
    icon: "staff",
  },
  "payment-accounts": {
    title: "Payment accounts",
    singular: "Payment account",
    subtitle: "Manage the accounts customers can pay through.",
    icon: "payment",
  },
};
const STAFF_ROLES = [
  { value: "manager", name: "Manager" },
  { value: "supervisor", name: "Supervisor" },
  { value: "cashier", name: "Cashier" },
  { value: "cook", name: "Cook" },
  { value: "server", name: "Server" },
  { value: "cleaner", name: "Cleaner" },
  { value: "delivery", name: "Delivery" },
  { value: "kitchen_helper", name: "Kitchen Helper" },
  { value: "inventory_clerk", name: "Inventory Clerk" },
  { value: "staff", name: "General Staff" },
];

@Component({
  selector: "app-management",
  imports: [CommonModule, FormsModule, Icon],
  template: `
    <section class="management panel">
      <div class="management-head">
        <div>
          <span class="eyebrow">MANAGEMENT</span>
          <h2>{{ config.title }}</h2>
          <p>{{ config.subtitle }}</p>
        </div>
        <button class="primary" (click)="openCreate()">
          <app-icon name="add" [size]="18" /> Add {{ config.singular }}
        </button>
      </div>
      <div class="toolbar">
        <label class="search"
          ><app-icon name="search" [size]="18" /><input
            placeholder="Search {{ config.title.toLowerCase() }}"
            [ngModel]="search()"
            (ngModelChange)="searchChanged($event)"
        /></label>
        @if (resource === "menus") {
          <select
            [ngModel]="genreFilter()"
            (ngModelChange)="genreFilter.set($event); load()"
          >
            <option value="">All genres</option>
            @for (option of options(); track option.id) {
              <option [value]="option.id">{{ option.name }}</option>
            }
          </select>
        }
        @if (resource === "staffs") {
          <select
            [ngModel]="roleFilter()"
            (ngModelChange)="roleFilter.set($event); load()"
          >
            <option value="">All roles</option>
            @for (role of staffRoles; track role.value) {
              <option [value]="role.value">{{ role.name }}</option>
            }
          </select>
        }
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event); load()"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      @if (loading()) {
        <div class="loading-list"><span></span><span></span><span></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <span class="empty-icon"
            ><app-icon [name]="config.icon" [size]="28"
          /></span>
          <h3>No {{ config.title.toLowerCase() }} yet</h3>
          <p>Add the first record or change your current filters.</p>
        </div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                @if (resource === "menus") {
                  <th class="index-cell">No.</th>
                  <th>Item</th>
                  <th>Genre</th>
                  <th>Price</th>
                  <th>Availability</th>
                }
                @if (resource === "staffs") {
                  <th>Staff member</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                }
                @if (resource === "payment-accounts") {
                  <th>Account holder</th>
                  <th>Payment method</th>
                  <th>Account number</th>
                  <th>Status</th>
                }
                <th class="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item["id"]; let rowIndex = $index) {
                <tr>
                  @if (resource === "menus") {
                    <td class="index-cell">{{ rowNumber(rowIndex) }}</td>
                    <td>
                      <div class="entity">
                        @if (item["image"]) {
                          <img
                            class="menu-thumbnail"
                            [src]="mediaUrl(item['image'])"
                            [alt]="item['name'] + ' image'"
                          />
                        } @else {
                          <span class="avatar food">{{
                            initials(item["name"])
                          }}</span>
                        }
                        <div>
                          <strong>{{ item["name"] }}</strong
                          ><small>{{
                            item["description"] || "No description"
                          }}</small>
                        </div>
                      </div>
                    </td>
                    <td>{{ genreNames(item) }}</td>
                    <td>
                      <strong>RM {{ money(item["cost"]) }}</strong>
                    </td>
                    <td>
                      <span class="status" [class.off]="!item['is_available']"
                        ><i></i
                        >{{
                          item["is_available"] ? "Available" : "Unavailable"
                        }}</span
                      >
                    </td>
                  }
                  @if (resource === "staffs") {
                    <td>
                      <div class="entity">
                        <span class="avatar">{{ initials(item["name"]) }}</span
                        ><strong>{{ item["name"] }}</strong>
                      </div>
                    </td>
                    <td>
                      <span class="role-chip">{{
                        roleName(item["role"])
                      }}</span>
                    </td>
                    <td>{{ item["email"] || "—" }}</td>
                    <td>{{ item["phone"] || "—" }}</td>
                    <td>
                      <span class="status" [class.off]="!item['is_active']"
                        ><i></i
                        >{{ item["is_active"] ? "Active" : "Inactive" }}</span
                      >
                    </td>
                  }
                  @if (resource === "payment-accounts") {
                    <td>
                      <div class="entity">
                        <span class="avatar payment"
                          ><app-icon name="money" [size]="18" /></span
                        ><strong>{{ item["account_holder_name"] }}</strong>
                      </div>
                    </td>
                    <td>{{ optionName(item["payment_method_id"]) }}</td>
                    <td class="mono">{{ item["account_number"] }}</td>
                    <td>
                      <span class="status" [class.off]="!item['is_active']"
                        ><i></i
                        >{{ item["is_active"] ? "Active" : "Inactive" }}</span
                      >
                    </td>
                  }
                  <td class="actions-cell">
                    <button
                      class="icon-button"
                      title="Edit"
                      (click)="openEdit(item)"
                    >
                      <app-icon name="edit" [size]="17" /></button
                    ><button
                      class="icon-button danger"
                      title="Delete"
                      (click)="confirmDelete(item)"
                    >
                      <app-icon name="delete" [size]="17" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span
            >Showing {{ rangeStart() }}–{{ rangeEnd() }} of
            {{ pagination().total }}</span
          >
          <div>
            <button
              class="icon-button"
              [disabled]="!pagination().has_previous"
              (click)="changePage(-1)"
            >
              <app-icon name="left" [size]="17" /></button
            ><span
              >Page {{ pagination().page }} of
              {{ pagination().total_pages || 1 }}</span
            ><button
              class="icon-button"
              [disabled]="!pagination().has_next"
              (click)="changePage(1)"
            >
              <app-icon name="right" [size]="17" />
            </button>
          </div>
        </div>
      }
    </section>
    @if (dialogOpen()) {
      <div class="modal-backdrop" (mousedown)="closeDialog()">
        <form
          class="modal"
          (mousedown)="$event.stopPropagation()"
          (ngSubmit)="save()"
        >
          <div class="modal-head">
            <div>
              <span class="eyebrow">{{ editingId() ? "EDIT" : "NEW" }}</span>
              <h2>
                {{ editingId() ? "Update" : "Add" }} {{ config.singular }}
              </h2>
            </div>
            <button type="button" class="icon-button" (click)="closeDialog()">
              <app-icon name="close" />
            </button>
          </div>
          <div class="form-grid">
            @if (resource === "menus") {
              <label
                ><span>Name *</span
                ><input
                  name="name"
                  [(ngModel)]="form['name']"
                  maxlength="150"
                  required
                /><small>Shown to customers and counter staff.</small></label
              >
              <fieldset class="genre-field full">
                <legend>Genres * <small>Select one or more</small></legend>
                <div class="genre-grid">
                  @for (option of options(); track option.id) {
                    <label
                      class="check-card"
                      [class.selected]="genreSelected(option.id)"
                    >
                      <input
                        type="checkbox"
                        [checked]="genreSelected(option.id)"
                        (change)="toggleGenre(option.id)"
                      />
                      <span>{{ option.name }}</span>
                    </label>
                  }
                </div>
              </fieldset>
              <label
                ><span>Price (RM) *</span
                ><input
                  name="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  [(ngModel)]="form['cost']"
                  required /></label
              ><label class="full"
                ><span>Description</span
                ><textarea
                  name="description"
                  [(ngModel)]="form['description']"
                  maxlength="2000"
                  rows="3"
                ></textarea></label
              ><div class="full image-field">
                <span class="field-label">Menu image</span>
                <div
                  class="menu-dropzone"
                  [class.dragging]="imageDragging()"
                  [class.has-image]="menuImagePreview()"
                  (dragover)="imageDragOver($event)"
                  (dragleave)="imageDragging.set(false)"
                  (drop)="dropMenuImage($event)"
                >
                  @if (menuImagePreview()) {
                    <img [src]="menuImagePreview()" alt="Menu image preview" />
                    <div class="image-preview-copy">
                      <strong>{{ uploadingImage() ? "Uploading image…" : "Image ready" }}</strong>
                      <small>{{ imageName() || "Current menu image" }}</small>
                    </div>
                    <button
                      type="button"
                      class="image-remove"
                      [disabled]="uploadingImage()"
                      (click)="removeMenuImage()"
                    >Remove</button>
                  } @else {
                    <span class="upload-mark"><app-icon name="upload" [size]="28" /></span>
                    <div>
                      <strong>Drag and drop a menu image</strong>
                      <small>JPG, PNG, WebP or GIF · Maximum 5 MB</small>
                    </div>
                    <label class="secondary file-picker">
                      Browse image
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif,image/*"
                        [disabled]="uploadingImage()"
                        (change)="chooseMenuImage($event)"
                      />
                    </label>
                  }
                </div>
              </div
              ><label class="switch-row full"
                ><div>
                  <strong>Available for ordering</strong
                  ><small>Turn off when this menu item is sold out.</small>
                </div>
                <input
                  name="is_available"
                  type="checkbox"
                  [(ngModel)]="form['is_available']"
              /></label>
            }
            @if (resource === "staffs") {
              <label class="full"
                ><span>Name *</span
                ><input
                  name="name"
                  [(ngModel)]="form['name']"
                  maxlength="255"
                  required /></label
              ><label
                ><span>Role *</span
                ><select name="role" [(ngModel)]="form['role']" required>
                  @for (role of staffRoles; track role.value) {
                    <option [value]="role.value">{{ role.name }}</option>
                  }
                </select></label
              ><label
                ><span>Email</span
                ><input
                  name="email"
                  type="email"
                  [(ngModel)]="form['email']" /></label
              ><label
                ><span>Phone</span
                ><input
                  name="phone"
                  [(ngModel)]="form['phone']"
                  maxlength="30" /></label
              ><label class="switch-row full"
                ><div>
                  <strong>Active staff member</strong
                  ><small>Inactive staff remain in your records.</small>
                </div>
                <input
                  name="is_active"
                  type="checkbox"
                  [(ngModel)]="form['is_active']"
              /></label>
            }
            @if (resource === "payment-accounts") {
              <label
                ><span>Payment method *</span
                ><select
                  name="payment_method_id"
                  [(ngModel)]="form['payment_method_id']"
                  required
                >
                  <option value="">Select a payment method</option>
                  @for (option of options(); track option.id) {
                    <option [ngValue]="option.id">{{ option.name }}</option>
                  }
                </select></label
              ><label
                ><span>Account holder *</span
                ><input
                  name="account_holder_name"
                  [(ngModel)]="form['account_holder_name']"
                  maxlength="255"
                  required /></label
              ><label class="full"
                ><span>Account number *</span
                ><input
                  name="account_number"
                  [(ngModel)]="form['account_number']"
                  maxlength="100"
                  required /></label
              ><label class="full"
                ><span>QR or image URL</span
                ><input
                  name="image"
                  type="url"
                  [(ngModel)]="form['image']"
                  placeholder="https://..." /></label
              ><label class="switch-row full"
                ><div>
                  <strong>Active payment account</strong
                  ><small
                    >Only active accounts should be offered during
                    checkout.</small
                  >
                </div>
                <input
                  name="is_active"
                  type="checkbox"
                  [(ngModel)]="form['is_active']"
              /></label>
            }
          </div>
          @if (formError()) {
            <p class="form-error">{{ formError() }}</p>
          }
          <div class="modal-actions">
            <button type="button" class="secondary" (click)="closeDialog()">
              Cancel</button
            ><button type="submit" class="primary" [disabled]="saving() || uploadingImage()">
              {{ saving() ? "Saving…" : uploadingImage() ? "Uploading…" : "Save changes" }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class Management implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api = inject(ShopApi);
  private toast = inject(ToastrService);
  private destroyed = new Subject<void>();
  private searches = new Subject<string>();
  resource: ResourceKey = "menus";
  config = CONFIGS.menus;
  form: Entity = {};
  readonly items = signal<Entity[]>([]);
  readonly options = signal<Option[]>([]);
  readonly loading = signal(true);
  readonly dialogOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly saving = signal(false);
  readonly formError = signal("");
  readonly search = signal("");
  readonly statusFilter = signal("");
  readonly genreFilter = signal("");
  readonly roleFilter = signal("");
  readonly uploadingImage = signal(false);
  readonly imageDragging = signal(false);
  readonly imagePreview = signal("");
  readonly imageName = signal("");
  readonly staffRoles = STAFF_ROLES;
  readonly pagination = signal<Pagination>({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_previous: false,
  });
  ngOnInit() {
    this.route.data.pipe(takeUntil(this.destroyed)).subscribe((data) => {
      this.resource = data["resource"];
      this.config = CONFIGS[this.resource];
      this.resetFilters();
      this.loadOptions();
      this.load();
    });
    this.searches
      .pipe(debounceTime(350), takeUntil(this.destroyed))
      .subscribe(() => {
        this.pagination.update((p) => ({ ...p, page: 1 }));
        this.load();
      });
  }
  ngOnDestroy() {
    this.clearLocalImagePreview();
    this.destroyed.next();
    this.destroyed.complete();
  }
  resetFilters() {
    this.search.set("");
    this.statusFilter.set("");
    this.genreFilter.set("");
    this.roleFilter.set("");
    this.pagination.update((p) => ({ ...p, page: 1 }));
  }
  loadOptions() {
    if (this.resource === "staffs") {
      this.options.set([]);
      return;
    }
    const endpoint =
      this.resource === "menus" ? "genre-options" : "payment-method-options";
    this.api.options(endpoint).subscribe({
      next: (r) => this.options.set(r.data),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  load() {
    this.loading.set(true);
    const statusKey = this.resource === "menus" ? "is_available" : "is_active";
    const query: Record<string, string | number | boolean> = {
      page: this.pagination().page,
      per_page: this.pagination().per_page,
      search: this.search(),
      [statusKey]: this.statusFilter(),
    };
    if (this.resource === "menus") query["genre_id"] = this.genreFilter();
    if (this.resource === "staffs") query["role"] = this.roleFilter();
    this.api.list(this.resource, query).subscribe({
      next: (r) => {
        this.items.set(r.data);
        this.pagination.set(r.pagination);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.toast.error(errorMessage(e));
      },
    });
  }
  searchChanged(value: string) {
    this.search.set(value);
    this.searches.next(value);
  }
  openCreate() {
    this.clearLocalImagePreview();
    this.editingId.set(null);
    this.formError.set("");
    this.form = this.defaults();
    this.dialogOpen.set(true);
  }
  openEdit(item: Entity) {
    this.clearLocalImagePreview();
    this.editingId.set(item["id"]);
    this.formError.set("");
    this.form = {
      ...item,
      genre_ids: [...(item["genre_ids"] || [])],
      payment_method_id: item["payment_method_id"] || "",
    };
    this.dialogOpen.set(true);
  }
  closeDialog() {
    if (!this.saving() && !this.uploadingImage()) {
      this.clearLocalImagePreview();
      this.dialogOpen.set(false);
    }
  }
  defaults(): Entity {
    if (this.resource === "menus")
      return {
        name: "",
        genre_ids: [],
        cost: "",
        description: "",
        image: "",
        is_available: true,
      };
    if (this.resource === "staffs")
      return {
        name: "",
        role: "staff",
        email: "",
        phone: "",
        is_active: true,
      };
    return {
      payment_method_id: "",
      account_holder_name: "",
      account_number: "",
      image: "",
      is_active: true,
    };
  }
  save() {
    if (this.uploadingImage()) {
      this.formError.set("Wait for the image upload to finish before saving.");
      return;
    }
    const validation = this.validate();
    if (validation) {
      this.formError.set(validation);
      return;
    }
    this.saving.set(true);
    this.formError.set("");
    const id = this.editingId();
    const request = id
      ? this.api.update(this.resource, id, this.payload())
      : this.api.create(this.resource, this.payload());
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.clearLocalImagePreview();
        this.dialogOpen.set(false);
        this.toast.success(`${this.config.singular} saved.`);
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(errorMessage(e));
      },
    });
  }
  validate(): string {
    if (
      this.resource === "menus" &&
      (!String(this.form["name"] || "").trim() ||
        !Array.isArray(this.form["genre_ids"]) ||
        this.form["genre_ids"].length === 0 ||
        this.form["cost"] === "" ||
        Number(this.form["cost"]) < 0)
    )
      return "Name, at least one genre, and a non-negative price are required.";
    if (
      this.resource === "staffs" &&
      (!String(this.form["name"] || "").trim() || !this.form["role"])
    )
      return "Staff name and role are required.";
    if (
      this.resource === "payment-accounts" &&
      (!this.form["payment_method_id"] ||
        !String(this.form["account_holder_name"] || "").trim() ||
        !String(this.form["account_number"] || "").trim())
    )
      return "Payment method, account holder, and account number are required.";
    return "";
  }
  payload(): Entity {
    const allowed: Record<ResourceKey, string[]> = {
      menus: [
        "name",
        "genre_ids",
        "cost",
        "description",
        "image",
        "is_available",
      ],
      staffs: ["name", "role", "email", "phone", "is_active"],
      "payment-accounts": [
        "payment_method_id",
        "account_holder_name",
        "account_number",
        "image",
        "is_active",
      ],
    };
    return Object.fromEntries(
      allowed[this.resource].map((key) => [
        key,
        this.form[key] === "" &&
        ["description", "image", "email", "phone"].includes(key)
          ? null
          : this.form[key],
      ]),
    );
  }
  confirmDelete(item: Entity) {
    const name = item["name"] || item["account_holder_name"];
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`))
      return;
    this.api.delete(this.resource, item["id"]).subscribe({
      next: () => {
        this.toast.success(`${this.config.singular} deleted.`);
        this.load();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
  changePage(direction: number) {
    this.pagination.update((p) => ({ ...p, page: p.page + direction }));
    this.load();
  }
  rowNumber(index: number) {
    return (
      (this.pagination().page - 1) * this.pagination().per_page + index + 1
    );
  }
  imageDragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.uploadingImage()) this.imageDragging.set(true);
  }
  dropMenuImage(event: DragEvent) {
    event.preventDefault();
    this.imageDragging.set(false);
    if (this.uploadingImage()) return;
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadMenuImage(file);
  }
  chooseMenuImage(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadMenuImage(file);
    input.value = "";
  }
  uploadMenuImage(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      this.toast.error("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error("The menu image must not be larger than 5 MB.");
      return;
    }
    this.clearLocalImagePreview();
    this.imagePreview.set(URL.createObjectURL(file));
    this.imageName.set(file.name);
    this.uploadingImage.set(true);
    this.formError.set("");
    this.api.upload(file).subscribe({
      next: (response) => {
        this.form["image"] = response.data.url;
        this.uploadingImage.set(false);
        this.toast.success("Image uploaded. Save the menu item to apply it.");
      },
      error: (error) => {
        this.uploadingImage.set(false);
        this.clearLocalImagePreview();
        this.formError.set(errorMessage(error));
      },
    });
  }
  removeMenuImage() {
    this.form["image"] = "";
    this.clearLocalImagePreview();
  }
  menuImagePreview() {
    return this.imagePreview() || this.mediaUrl(this.form["image"]);
  }
  mediaUrl(value: unknown) {
    const path = String(value || "");
    return path.startsWith("/") ? `http://127.0.0.1:8000${path}` : path;
  }
  private clearLocalImagePreview() {
    const preview = this.imagePreview();
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    this.imagePreview.set("");
    this.imageName.set("");
    this.imageDragging.set(false);
  }
  initials(value: string) {
    return String(value || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  money(value: unknown) {
    return Number(value || 0).toFixed(2);
  }
  optionName(id: number) {
    return this.options().find((item) => item.id === id)?.name || "—";
  }
  roleName(value: string) {
    return (
      this.staffRoles.find((role) => role.value === value)?.name ||
      "General Staff"
    );
  }
  genreSelected(id: number) {
    return (
      Array.isArray(this.form["genre_ids"]) &&
      this.form["genre_ids"].includes(id)
    );
  }
  toggleGenre(id: number) {
    const selected: number[] = Array.isArray(this.form["genre_ids"])
      ? [...this.form["genre_ids"]]
      : [];
    this.form["genre_ids"] = selected.includes(id)
      ? selected.filter((value) => value !== id)
      : [...selected, id];
  }
  genreNames(item: Entity) {
    return Array.isArray(item["genres"]) && item["genres"].length
      ? item["genres"].map((genre: Option) => genre.name).join(", ")
      : "—";
  }
  rangeStart() {
    return this.pagination().total
      ? (this.pagination().page - 1) * this.pagination().per_page + 1
      : 0;
  }
  rangeEnd() {
    return Math.min(
      this.pagination().page * this.pagination().per_page,
      this.pagination().total,
    );
  }
}
