import { inject } from "@angular/core";
import { Router, Routes } from "@angular/router";
import { Auth } from "./auth";

const shopGuard = () =>
  inject(Auth).authenticated() || inject(Router).createUrlTree(["/auth/login"]);

export const routes: Routes = [
  {
    path: "auth/login",
    loadComponent: () => import("./login").then((m) => m.Login),
  },
  {
    path: "pos",
    canActivate: [shopGuard],
    loadComponent: () => import("./pos").then((m) => m.Pos),
    children: [
      {
        path: "",
        loadComponent: () => import("./dashboard").then((m) => m.Dashboard),
      },
      {
        path: "orders",
        loadComponent: () => import("./order-history").then((m) => m.OrderHistory),
      },
      {
        path: "orders/:id",
        loadComponent: () => import("./order-detail").then((m) => m.OrderDetail),
      },
      {
        path: "menus",
        data: { resource: "menus" },
        loadComponent: () => import("./management").then((m) => m.Management),
      },
      {
        path: "staff",
        data: { resource: "staffs" },
        loadComponent: () => import("./management").then((m) => m.Management),
      },
      {
        path: "payment-accounts",
        data: { resource: "payment-accounts" },
        loadComponent: () => import("./management").then((m) => m.Management),
      },
      {
        path: "settings",
        loadComponent: () => import("./settings").then((m) => m.SettingsPage),
      },
    ],
  },
  { path: "", pathMatch: "full", redirectTo: "pos" },
  { path: "**", redirectTo: "pos" },
];
