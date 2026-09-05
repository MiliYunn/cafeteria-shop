import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideToastr } from "ngx-toastr";
import { App } from "./app/app";
import { routes } from "./app/routes";
import { authInterceptor } from "./app/auth";

bootstrapApplication(App, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      positionClass: "toast-bottom-right",
      timeOut: 3500,
      progressBar: true,
      closeButton: true,
    }),
  ],
});
