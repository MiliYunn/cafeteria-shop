import { Component, Input } from "@angular/core";
import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  History,
  Info,
  LayoutGrid,
  LogOut,
  LucideAngularModule,
  MenuSquare,
  ImagePlus,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Truck,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-angular";

const icons: Record<string, any> = {
  pos: LayoutGrid,
  menu: MenuSquare,
  staff: UserRound,
  payment: BadgeDollarSign,
  logout: LogOut,
  add: Plus,
  search: Search,
  edit: Pencil,
  delete: Trash2,
  delivery: Truck,
  close: X,
  left: ChevronLeft,
  right: ChevronRight,
  food: UtensilsCrossed,
  money: CircleDollarSign,
  settings: Settings,
  clock: Clock3,
  history: History,
  info: Info,
  upload: ImagePlus,
  orders: PackageCheck,
};

@Component({
  selector: "app-icon",
  imports: [LucideAngularModule],
  template:
    '<lucide-icon [img]="icons[name]" [size]="size" [strokeWidth]="1.9" aria-hidden="true" />',
})
export class Icon {
  @Input() name = "pos";
  @Input() size = 20;
  readonly icons = icons;
}
