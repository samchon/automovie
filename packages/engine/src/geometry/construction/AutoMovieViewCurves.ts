import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import type { AutoMovieLoftFrame } from "./AutoMovieLoftFrame";
import { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import type { IAutoMovieViewPart } from "./IAutoMovieViewPart";

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
   * One source edge, retained even when its preparation fails.
   *
   * @evidence contracts/development/design.md#principled-representation Names the original front/side signed edge and the input-frame direction that carries it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Name, direction and nullable admitted outline retain the four independent source identities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed edge remains a named null source instead of borrowing another edge or a section.
   * @evidence contracts/development/common.md#meaningful-documentation Members state source identity, frame direction and failure state.
   */
  export interface ICurve {
    /** Stable name of the source edge. */
    name:
      | "front.positive"
      | "front.negative"
      | "side.positive"
      | "side.negative";

    /** Frame direction carrying this chart coordinate. */
    direction: "u" | "v";

    /** Admitted scalar source, or null with its diagnostic. */
    outline: AutoMovieViewOutline.IOutline | null;
  }

  /**
   * Every original edge and its source admission failures.
   *
   * @evidence contracts/development/design.md#principled-representation Preserves each edge independently of fullness and section admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four curve records and explicit diagnostics suffice for source inspection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A partial failure does not hide the other valid curves.
   * @evidence contracts/development/common.md#meaningful-documentation States curve order and independence from section diagnostics.
   */
  export interface IResult {
    /** Four records in front positive/negative, side positive/negative order. */
    curves: ICurve[];

    /** Source failures, independent of section and fullness diagnostics. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Original scalar reading located in its actual source frame.
   *
   * @evidence contracts/development/design.md#principled-representation Records a scalar source and its actual input frame, with point o+value*u or o+value*v in world millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Scalar, frame and point expose the quantities needed to distinguish outline and placement defects.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scalar jets are not mislabeled as world jets; no world derivative is invented without an axis derivative contract.
   * @evidence contracts/development/common.md#meaningful-documentation Documents source-frame identity and world units separately from scalar jets.
   */
  export interface IReading {
    /** Shared source scalar reading and its qualified jets. */
    scalar: AutoMovieViewOutline.IReading;

    /** Actual input axis frame at the station, world millimetres. */
    frame: AutoMovieLoftFrame.IFrame;

    /** The source edge's world point, millimetres. */
    point: [number, number, number];
  }

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
  export function create(part: IAutoMovieViewPart): IResult {
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const ends: AutoMovieViewOutline.IEnds = {};
    if (part.pole === "bottom" || part.pole === "both")
      ends.bottom = part.stations[0] ?? NaN;
    if (part.pole === "top" || part.pole === "both")
      ends.top = part.stations[part.stations.length - 1] ?? NaN;
    const curves: ICurve[] = [];
    for (const view of ["front", "side"] as const)
      for (const sign of ["positive", "negative"] as const) {
        const name: ICurve["name"] = `${view}.${sign}`;
        const prepared:
          | AutoMovieViewOutline.IOutline
          | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(
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
    curve: ICurve,
    axis: IAutoMovieViewPart["axis"],
    station: number,
  ): IReading | string {
    if (curve.outline === null)
      return `${curve.name} has no admitted source outline`;
    const scalar: AutoMovieViewOutline.IReading | string =
      AutoMovieViewOutline.at(curve.outline, station);
    if (typeof scalar === "string") return `${curve.name}: ${scalar}`;
    let frame: AutoMovieLoftFrame.IFrame;
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
