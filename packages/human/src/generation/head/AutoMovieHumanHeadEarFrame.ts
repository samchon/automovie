import { AutoMovieViewCurves, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";
import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";

/**
 * The auricle's own measurement chord and fixed orientation site.
 * The retained 17.5-degree sagittal lean is projected into the side-outline
 * tangent plane at the selected tragion height. That height is fixed before
 * placing the endpoints; changing the ear's centre cannot change this normal.
 * The plate uses horizontal section planes, independently of this tilted
 * sa-sba chord, so its highest/lowest points can own the global Y extrema.
 *
 * @evidence contracts/common.md#principled-implementation Reads the identical head source's original side derivative at a named orientation site and keeps the tilted measurement chord distinct from the section normal.
 * @evidence contracts/common.md#clear-and-simple-design Returns one frame and the independent ear dimensions; the plate owns actual attachment points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses no unused private forward-centre estimate, emitted mesh, finite-difference silhouette or fitted placement.
 * @evidence contracts/common.md#meaningful-documentation States the retained lean, orientation convention, dimensions and global-height ownership.
 * @evidence contracts/performance.md#efficient-algorithms One shared source preparation and one analytic derivative read.
 * @evidence contracts/performance.md#reuse-equivalent-work The plate and relief builders share the returned frame.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed-size vectors/scalars and retains no head source globally.
 */
export namespace AutoMovieHumanHeadEarFrame {
  /** Own-side dimensions and orientation in calibration mm. */
  export interface IFrame {
    /** Outward side-outline normal at the selected tragion height. */
    n: [number, number, number];
    /** Unit sa-sba chord direction, upward. */
    a: [number, number, number];
    /** Forward unit direction perpendicular to a and n. */
    b: [number, number, number];
    /** Selected highest superaurale height. */
    top: number;
    /** Lowest subaurale height, top - length*a.y. */
    bottom: number;
    /** Public sa-sba chord length. */
    length: number;
    /** Public c-j chord length. */
    breadth: number;
    /** Public scalp-to-rim distance at the tragal level. */
    protrusion: number;
    /** Retained relief-row scale, world breadth/31 mm. */
    scale: number;
    /** Own side, positive left and negative right. */
    sign: 1 | -1;
  }

  /** Retained 17.5-degree sagittal lean within Banks/Cheney's 15-20 range. */
  export const LEAN: number = 17.5 * Math.PI / 180;
  /** Original relief-row breadth, world mm. */
  export const PRIOR_BREADTH: number = 31;

  /**
   * Orient once at tragion and place the chosen highest/lowest endpoints.
   * The derivative belongs to the original side guide, not a finished scalp
   * normal or a published individual auricular orientation.
   *
   * @evidence contracts/common.md#principled-implementation Uses the actual source station derivative and closes endpoint height span from the public tilted chord length.
   * @evidence contracts/common.md#clear-and-simple-design Orientation and endpoint placement are explicit separate operations.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects unavailable derivatives instead of choosing an epsilon normal.
   * @evidence contracts/common.md#meaningful-documentation Separates the orientation convention from measured dimensions and section planes.
   * @evidence contracts/performance.md#efficient-algorithms Bounded vector arithmetic follows one prepared source read.
   * @evidence contracts/performance.md#reuse-equivalent-work One frame serves the plate and all its reliefs.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned vectors/scalars survive the call.
   */
  export function of(plan: IAutoMovieHumanHeadLayout, mass: IAutoMovieViewPart, sign: 1 | -1, ear: IAutoMovieHumanEar, top?: number): IFrame {
    const source: AutoMovieViewCurves.IResult = AutoMovieViewCurves.create(mass);
    const outline: AutoMovieViewOutline.IOutline | null = source.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === "side.positive")?.outline ?? null;
    if (outline === null)
      throw new Error(
        `Ear orientation needs the actual original head side guide: ${source.diagnostics.map((d: { detail: string }): string => d.detail).join("; ")}`,
      );
    const reading: AutoMovieViewOutline.IReading | string = AutoMovieViewOutline.at(outline, plan.landmarks.tragion[1]);
    if (typeof reading === "string" || reading.stationJet === null) throw new Error("Ear orientation needs a finite side-guide derivative at tragion");
    const n: [number, number, number] = unit([0, -reading.stationJet[0], sign]);
    const a: [number, number, number] = unit(reject([-Math.sin(LEAN), Math.cos(LEAN), 0], n));
    const b: [number, number, number] = unit(reject(reject([Math.cos(LEAN), Math.sin(LEAN), 0], n), a));
    const length: number = ear.length * plan.scale;
    const highest: number = top ?? plan.subnasale + length * a[1];
    return { n, a, b, top: highest, bottom: highest - length * a[1], length, breadth: ear.breadth * plan.scale, protrusion: ear.protrusion * plan.scale, scale: ear.breadth / PRIOR_BREADTH, sign };
  }

  /** Normalize a nondegenerate geometric vector. */
  function unit(v: [number, number, number]): [number, number, number] {
    const length: number = Math.hypot(...v);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("Ear frame has a degenerate orientation");
    return [v[0] / length, v[1] / length, v[2] / length];
  }

  /** Remove the component along a unit vector. */
  function reject(v: [number, number, number], u: [number, number, number]): [number, number, number] {
    const dot: number = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
    return [v[0] - dot * u[0], v[1] - dot * u[1], v[2] - dot * u[2]];
  }
}
