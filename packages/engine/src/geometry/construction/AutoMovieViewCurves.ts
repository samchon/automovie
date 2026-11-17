import type { IAutoMovieViewPart, IAutoMovieLoftContract, IAutoMovieLoftFrame, IAutoMovieViewCurves, IAutoMovieViewOutline } from "@automovie/interface";

import { AutoMovieViewOutline } from "./AutoMovieViewOutline";

/**
 * The four original view edges, evaluated independently of section/fullness admission and of final coefficient interpolation.
 *
 * A world point uses the supplied axis's actual `at(station)` frame, not the natural spline of frames stored on emitted layers. Scalar station jets therefore describe the source outline only; this API does not claim world derivatives without an axis jet contract. A zero outline at a pole reads the axis origin even when the loft emits no section there. Malformed outlines remain named diagnostics while the other source curves survive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source frames and scalar jets from the final loft and from unavailable world jets.
 * @evidence contracts/development/design.md#principled-representation Represents The four original view edges, evaluated independently of section/fullness admission and of final coefficient interpolation: companion namespace of 5 members (`ICurve`, `IResult`, `IReading`, `create`, `at`); units and frames named in its text: frame, world, frames. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewCurves` in packages/engine/src/geometry/construction/AutoMovieViewCurves.ts; its surface is the 5 members listed and the text shows 18 other files naming it, mostly packages/human (11), test (6), packages/engine (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieViewCurves {

  /**
   * Prepare all original edges without reading the fullness owner or emitting a section.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each original outline uses the same source owner and closing stations as ViewLoft; malformed edges produce their own existing construction diagnostic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over two views and two signs preserves all four identities and their independent admission results.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not read loft.sections or fullness, so invalid section admission cannot erase source curves or pole endpoints.
   * @evidence contracts/development/common.md#meaningful-documentation Documents curve ordering, source ownership, partial failures and units.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four O(n) source preparations and at most four diagnostics; no section or girth solve is repeated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each admitted spline serves all subsequent samples of that source; changed source data requires a fresh preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Result owns four copied source curves and their diagnostics, with no retained part or global cache.
   */
  export function create(part: IAutoMovieViewPart): IAutoMovieViewCurves.IResult {
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
        const prepared:
          | IAutoMovieViewOutline.IOutline
          | IAutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
          part[view][sign],
          ends,
        );
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
   * Locate one source edge; invalid input stays an explicit failure and is never connected across by this owner.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the admitted scalar and actual axis.at(station), then applies the original source chart direction to the frame origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read returns the scalar, frame and world point or a named failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refuses invalid scalar/frame/point values without substituting a layer-interpolated frame or connecting across a failed query.
   * @evidence contracts/development/common.md#meaningful-documentation Documents actual source frames and explicitly excludes a world-jet claim.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scalar jet query plus one actual axis evaluation and constant vector arithmetic; axis complexity remains that axis owner's cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the caller's admitted scalar spline; actual frames remain keyed by the requested station rather than a sampled layer identity.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fixed-size reading and retains no prior source sample or frame.
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
    let frame: IAutoMovieLoftFrame.IFrame;
    try {
      frame = axis.at(station);
    } catch (error: unknown) {
      return `${curve.name} at ${station}: the actual source axis failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`;
    }
    if (![...frame.origin, ...frame.u, ...frame.v].every(Number.isFinite))
      return `${curve.name} at ${station}: the actual axis frame is nonfinite`;
    const direction: readonly number[] = frame[curve.direction];
    const point: [number, number, number] = [0, 1, 2].map(
      (c: number): number => frame.origin[c]! + scalar.value * direction[c]!,
    ) as [number, number, number];
    if (!point.every(Number.isFinite))
      return `${curve.name} at ${station}: the world source point is nonfinite`;
    return { scalar, frame, point };
  }
}
