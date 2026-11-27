import type {
  IAutoMovieLoftContract,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewCurves,
  IAutoMovieViewOutline,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieViewOutline } from "./AutoMovieViewOutline";

/**
 * The four original view edges, evaluated independently of section/fullness
 * admission and of final coefficient interpolation.
 *
 * A world point uses the supplied axis's actual `at(station)` frame, not the
 * natural spline of frames stored on emitted layers. Scalar station jets
 * therefore describe the source outline only; this API does not claim world
 * derivatives without an axis jet contract. A zero outline at a pole reads the
 * axis origin even when the loft emits no section there. Malformed outlines
 * remain named diagnostics while the other source curves survive.
 */
export namespace AutoMovieViewCurves {
  /**
   * Prepare all original edges without reading the fullness owner or emitting a
   * section.
   */
  export function create(
    part: IAutoMovieViewPart,
  ): IAutoMovieViewCurves.IResult {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const ends: IAutoMovieViewOutline.IEnds = {};
    if (part.pole === "bottom" || part.pole === "both")
      ends.bottom = part.stations[0] ?? NaN;
    if (part.pole === "top" || part.pole === "both")
      ends.top = part.stations[part.stations.length - 1] ?? NaN;
    const curves: IAutoMovieViewCurves.ICurve[] = [];
    for (const view of ["front", "side"] as const)
      for (const sign of ["positive", "negative"] as const) {
        const name: IAutoMovieViewCurves.ICurve["name"] = `${view}.${sign}`;
        const prepared: IAutoMovieViewOutline.IResult =
          AutoMovieViewOutline.create(part[view][sign], ends);
        if ("detail" in prepared)
          diagnostics.push({
            producer: `view.${part.name}`,
            level: 2,
            contract: prepared.contract,
            detail: `${name}: ${prepared.detail}`,
          });
        curves.push({
          name,
          direction: view === "front" ? "u" : "v",
          outline: "detail" in prepared ? null : prepared,
        });
      }
    return { curves, diagnostics };
  }

  /**
   * Locate one source edge; invalid input stays an explicit failure and is
   * never connected across by this owner.
   */
  export function at(
    curve: IAutoMovieViewCurves.ICurve,
    axis: IAutoMovieViewPart["axis"],
    station: number,
  ): IAutoMovieViewCurves.IReading | string {
    if (curve.outline === null)
      return `${curve.name} has no admitted source outline`;
    const scalar: IAutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(curve.outline, station);
    if (typeof scalar === "string") return `${curve.name}: ${scalar}`;
    let frame: IAutoMovieLoftSectionFrame;
    try {
      frame = axis.at(station);
    } catch (error: unknown) {
      return `${curve.name} at ${station}: the actual source axis failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`;
    }
    const direction: readonly number[] = frame[curve.direction];
    const point: [number, number, number] = [0, 1, 2].map(
      (c: number): number => frame.origin[c]! + scalar.value * direction[c]!,
    ) as [number, number, number];
    return { scalar, frame, point };
  }
}
