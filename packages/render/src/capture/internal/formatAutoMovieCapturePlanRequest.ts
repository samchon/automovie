import type {
  IAutoMovieCapturePlanRequest,
  IAutoMovieCaptureRequestEntry,
  IAutoMovieCaptureSampling,
  IAutoMovieInspectionRequest,
} from "@automovie/interface";

import { formatAutoMovieInspectionRequest } from "../../scene/inspection/internal/formatAutoMovieInspectionRequest.js";
import { parseAutoMovieCapturePlanRequest } from "./parseAutoMovieCapturePlanRequest.js";

/**
 * Write a capture plan request as the named text values
 * `parseAutoMovieCapturePlanRequest` reads, so a request worked out in one host
 * repeats in another as an address, a command line or props.
 *
 * Keys come in the order of `AUTO_MOVIE_CAPTURE_PLAN_KEYS`, and a key whose
 * value is the reader's absent value is left out, so the request that asks for
 * nothing is the empty list. Numbers are written in JavaScript's shortest form
 * that reads back to the same number, lists joined by commas and views by `;`.
 * One pass is written through the inspection's `shade`, several through
 * `passes` with `shade` left out. The inspection keys come last, written by
 * `formatAutoMovieInspectionRequest`. For every request the reader returns,
 * reading the written values gives an equal request.
 *
 * ```ts
 * const address = new URLSearchParams(
 *   formatAutoMovieCapturePlanRequest(request),
 * );
 * const command = formatAutoMovieCapturePlanRequest(request).flatMap(
 *   ([key, value]) => [`--${key}`, value],
 * );
 * ```
 */
export function formatAutoMovieCapturePlanRequest(
  request: IAutoMovieCapturePlanRequest,
): IAutoMovieCaptureRequestEntry[] {
  const absent: IAutoMovieCapturePlanRequest = parseAutoMovieCapturePlanRequest(
    new Map<string, string>(),
  );
  const values: IAutoMovieCaptureRequestEntry[] = [];
  if (request.subject !== null) values.push(["subject", request.subject]);

  // Seconds: explicit, or an even sampling against the reader's own defaults.
  if (request.sampling.kind === "at")
    values.push(["at", request.sampling.seconds.map(String).join(",")]);
  else {
    const fallback: IAutoMovieCaptureSampling = absent.sampling;
    if (fallback.kind !== "even" || request.sampling.from !== fallback.from)
      values.push(["from", String(request.sampling.from)]);
    if (request.sampling.to !== null)
      values.push(["to", String(request.sampling.to)]);
    if (fallback.kind !== "even" || request.sampling.rate !== fallback.rate)
      values.push(["rate", String(request.sampling.rate)]);
  }
  if (request.events.length !== 0)
    values.push(["events", request.events.map(String).join(",")]);
  if (request.window !== absent.window)
    values.push(["window", String(request.window)]);
  if (request.threshold !== absent.threshold)
    values.push(["threshold", String(request.threshold)]);
  if (request.views.join(";") !== absent.views.join(";"))
    values.push(["views", request.views.join(";")]);

  // Several passes replace the inspection's shade; one pass is that shade.
  const several: boolean = request.passes.length > 1;
  if (several) values.push(["passes", request.passes.join(",")]);
  if (request.sweep !== null) values.push(["sweep", request.sweep]);
  if (request.sweep !== null && request.margin !== absent.margin)
    values.push(["margin", String(request.margin)]);
  if (request.budget.longest !== absent.budget.longest)
    values.push(["longest", String(request.budget.longest)]);
  if (request.budget.smallest !== absent.budget.smallest)
    values.push(["smallest", String(request.budget.smallest)]);
  if (request.budget.reduction !== absent.budget.reduction)
    values.push(["reduction", request.budget.reduction]);
  if (request.round !== null) values.push(["round", request.round]);
  if (request.compare !== null) values.push(["compare", request.compare]);
  if (request.compare !== null && request.tolerance !== absent.tolerance)
    values.push(["tolerance", String(request.tolerance)]);

  // The inspection keys, with the shade the passes decide.
  const inspection: IAutoMovieInspectionRequest = {
    ...request.inspection,
    shade: several ? absent.inspection.shade : request.passes[0]!,
  };
  values.push(
    ...formatAutoMovieInspectionRequest(inspection).filter(
      ([key]: [key: string, value: string]): boolean =>
        !(several && key === "shade"),
    ),
  );
  return values;
}
