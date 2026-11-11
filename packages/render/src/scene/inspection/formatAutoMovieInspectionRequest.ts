import type { IAutoMovieSectionPlane } from "@automovie/engine";

import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";
import { parseAutoMovieInspectionRequest } from "./parseAutoMovieInspectionRequest.js";

/**
 * Write an inspection request as the named text values `parseAutoMovieInspectionRequest` reads, so a request made in one host repeats in another as an address or a command line.
 *
 * Keys come in the order of `AUTO_MOVIE_INSPECTION_KEYS`, and a key whose value is the parser's absent value is left out, so the request that asks for nothing is the empty list. Lists are joined by commas, colours written `pattern=rrggbb`, switches are written `1` or `0`, numbers in JavaScript's shortest form that reads back to the same number, and a cut always in its general `px,py,pz:nx,ny,nz` form. For every request the parser returns, parsing the written values gives an equal request.
 *
 * ```ts
 * const address = new URLSearchParams(formatAutoMovieInspectionRequest(request));
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, which keys are left out, how each value form is written, the one form a cut takes and the round trip it guarantees.
 * @evidence contracts/development/implementation.md#principled-implementation The writer mirrors the parser key by key: the absent values are read from the parser itself, a value equal to one is omitted because omitting it reads back the same, and `String` of a finite number is the shortest text that reads back as that number, so the round trip is exact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One list built key by key in the parser's order.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default is restated: the parser's own empty request supplies them. An axis cut is written in the general form, which reads back as the same point and normal, instead of guessing which axis form it came from.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the length of the written text, plus one parse of no keys.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one request.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pairs and keeps nothing.
 */
export function formatAutoMovieInspectionRequest(
  request: IAutoMovieInspectionRequest,
): [key: string, value: string][] {
  const absent: IAutoMovieInspectionRequest = parseAutoMovieInspectionRequest(
    (): undefined => undefined,
  );
  const values: [key: string, value: string][] = [];
  if (request.parts.length !== 0)
    values.push(["parts", request.parts.join(",")]);
  if (request.hide.length !== 0) values.push(["hide", request.hide.join(",")]);
  if (request.shade !== absent.shade) values.push(["shade", request.shade]);
  if (request.surface !== absent.surface)
    values.push(["surface", request.surface ? "1" : "0"]);
  if (request.marks.length !== 0)
    values.push(["marks", request.marks.join(",")]);
  if (request.sliver !== null) values.push(["sliver", String(request.sliver)]);
  if (request.section !== null) {
    const cut: IAutoMovieSectionPlane = request.section;
    values.push([
      "section",
      `${cut.point.x},${cut.point.y},${cut.point.z}:${cut.normal.x},${cut.normal.y},${cut.normal.z}`,
    ]);
  }
  if (request.xray !== absent.xray)
    values.push(["xray", request.xray ? "1" : "0"]);
  if (request.stroke !== absent.stroke)
    values.push(["stroke", String(request.stroke)]);
  if (request.label.length !== 0)
    values.push(["label", request.label.join(",")]);
  if (request.color.length !== 0)
    values.push([
      "color",
      request.color
        .map(
          (entry: IAutoMovieInspectionRequest.IColor): string =>
            `${entry.pattern}=${entry.color.toString(16).padStart(6, "0")}`,
        )
        .join(","),
    ]);
  return values;
}
