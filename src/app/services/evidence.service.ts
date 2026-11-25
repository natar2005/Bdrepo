import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { EvidenceManifest, WorkbookPreview } from '../models/evidence.models';
import { evidenceManifestUrl } from '../pages/evidence-category-page/evidence-categories';

/**
 * Carga (y guarda en memoria) lo que necesitan las páginas de evidencias:
 * el manifest de cada categoría, el texto de los scripts y las hojas de Excel.
 * Así, si se vuelve a abrir un script o una categoría no se descarga otra vez.
 */
@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly cache = new Map<string, Observable<unknown>>();

  constructor(private readonly http: HttpClient) {}

  manifest(slug: string): Observable<EvidenceManifest | null> {
    return this.cached(`manifest:${slug}`, () => this.http.get<EvidenceManifest>(evidenceManifestUrl(slug)));
  }

  text(url: string): Observable<string | null> {
    return this.cached(`text:${url}`, () =>
      this.http.get(url, { responseType: 'text' }).pipe(map((text) => text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')))
    );
  }

  workbook(url: string): Observable<WorkbookPreview | null> {
    return this.cached(`sheet:${url}`, () => this.http.get<WorkbookPreview>(url));
  }

  private cached<T>(key: string, factory: () => Observable<T>): Observable<T | null> {
    if (!this.cache.has(key)) {
      const request = factory().pipe(
        catchError(() => {
          this.cache.delete(key);
          return of(null);
        }),
        shareReplay(1)
      );
      this.cache.set(key, request);
    }
    return this.cache.get(key) as Observable<T | null>;
  }
}
