import type { IFilmProduction } from "../IFilmProduction";
import { BoutPlaybackRuntime } from "../physics/BoutPlaybackRuntime";
import { readFilmReviewInterval } from "./readFilmReviewInterval";

/** Admit the available source range and publish its mode and bounds to real review controls before the host enables playback. */
export function configureFilmReview(
  root: HTMLElement,
  film: IFilmProduction,
  params: URLSearchParams,
): ReturnType<typeof readFilmReviewInterval> {
  const interval: ReturnType<typeof readFilmReviewInterval> =
    readFilmReviewInterval(params, film.available);
  /** Missing controls are a host failure, never a fallback source range. */
  function element<T extends HTMLElement>(selector: string): T {
    const found: T | null = root.querySelector<T>(selector);
    if (!found) throw new Error(`Missing film control ${selector}`);
    return found;
  }
  const mode: string =
    film.runtime instanceof BoutPlaybackRuntime
      ? `${film.runtime.mode} cache`
      : "authored motion";
  const extent: string =
    film.available[0] === 0 && film.available[1] === 180
      ? "180 seconds"
      : `${film.available[0]} to ${film.available[1]} seconds`;
  element("header p").textContent =
    `${mode} · ${extent} · original Human polygon`;
  for (const selector of ["#seek", "#start", "#end"]) {
    element<HTMLInputElement>(selector).min = String(film.available[0]);
    element<HTMLInputElement>(selector).max = String(film.available[1]);
  }
  element<HTMLInputElement>("#start").value = String(interval.start);
  element<HTMLInputElement>("#end").value = String(interval.end);
  element<HTMLSelectElement>("#speed").value = String(interval.speed);
  return interval;
}
