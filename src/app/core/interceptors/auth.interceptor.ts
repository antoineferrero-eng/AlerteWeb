import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const idToken = localStorage.getItem('id_token');

  if (idToken) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${idToken}`)
    });
    return next(authReq);
  }

  return next(req);
};
