import {
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
} from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from "rxjs";

export const API = "http://127.0.0.1:8000/cafeteria/shop";
const SESSION_KEY = "apcafeteria.shop.session";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  shop?: Record<string, unknown>;
}

interface Session extends Tokens {
  expiresAt: number;
}

@Injectable({ providedIn: "root" })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  readonly session = signal<Session | null>(this.restore());
  readonly authenticated = computed(
    () => !!this.session()?.access_token && !!this.session()?.refresh_token,
  );
  private refreshing?: Observable<ApiResponse<Tokens>>;

  private restore(): Session | null {
    try {
      const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return value?.access_token && value?.refresh_token ? value : null;
    } catch {
      return null;
    }
  }

  private save(tokens: Tokens) {
    const session: Session = {
      ...tokens,
      shop: tokens.shop || this.session()?.shop,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };
    this.session.set(session);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem("shop_token");
  }

  login(ce: string, cp: string) {
    return this.http
      .post<ApiResponse<Tokens>>(`${API}/auth/login`, { ce, cp })
      .pipe(tap((response) => this.save(response.data)));
  }

  refresh() {
    if (this.refreshing) return this.refreshing;
    const refreshToken = this.session()?.refresh_token;
    if (!refreshToken) return throwError(() => new Error("No refresh token"));
    this.refreshing = this.http
      .post<ApiResponse<Tokens>>(`${API}/auth/refresh-token`, {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => {
          if (this.session()?.refresh_token === refreshToken)
            this.save(response.data);
        }),
        finalize(() => (this.refreshing = undefined)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshing;
  }

  profile() {
    return this.http.get<ApiResponse<Record<string, unknown>>>(
      `${API}/auth/profile`,
    );
  }

  clear() {
    this.session.set(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem("shop_token");
    void this.router.navigate(["/auth/login"], {
      queryParams: { reason: "session-expired" },
    });
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(Auth);
  if (
    !request.url.startsWith(`${API}/`) ||
    /\/auth\/(login|refresh-token)$/.test(request.url)
  )
    return next(request);
  const sentToken = auth.session()?.access_token;
  const authorized = sentToken
    ? request.clone({ setHeaders: { Authorization: `Bearer ${sentToken}` } })
    : request;
  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !auth.session()?.refresh_token)
        return throwError(() => error);
      if (auth.session()?.access_token !== sentToken)
        return next(
          request.clone({
            setHeaders: {
              Authorization: `Bearer ${auth.session()!.access_token}`,
            },
          }),
        );
      return auth.refresh().pipe(
        switchMap((response) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${response.data.access_token}`,
              },
            }),
          ),
        ),
        catchError((refreshError) => {
          auth.clear();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
