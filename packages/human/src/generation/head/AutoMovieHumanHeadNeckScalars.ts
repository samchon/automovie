import { AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanHeadNeck } from "../IAutoMovieHumanHeadNeck";
import type { AutoMovieHumanHeadNeckCurves } from "./AutoMovieHumanHeadNeckCurves";

/** Original neck scalar controls and their declared radius-dependent bases, before numerical closure or any point/loft consumer. */
export namespace AutoMovieHumanHeadNeckScalars {
  /** One affine lower-neck generating axis, before its scalar controls or either anatomical consumer. */
  export interface IAxis {
    /** Original parameter is physical world-Y in calibration mm. */
    readonly parameter: "physical-Y-mm";

    /** Shared normal-plane origin, calibration mm. */
    readonly anchor: readonly [number, number, number];

    /** Derivative per physical station mm, including its unit Y component. */
    readonly first: readonly [number, number, number];

    /** The declared affine primitive has zero second derivative. */
    readonly second: readonly [number, number, number];

    /** Actual point on the declared lower/normal affine primitive; no completed curve is read. */
    point(station: number): [number, number, number];
  }

  /** The retained mean/pose coefficients declare this affine lower source, not a Taylor continuation of emitted geometry. */
  export function axis(neck: Pick<IAutoMovieHumanHeadNeck, "x" | "level" | "backSlope">): IAxis {
    const x: number = neck.x;
    const y: number = neck.level;
    const m: number = neck.backSlope;
    if (![x, y, m].every(Number.isFinite)) throw new Error("Shared lower-neck axis needs finite generating coefficients");
    return { parameter: "physical-Y-mm", anchor: [x, y, 0], first: [m, 1, 0], second: [0, 0, 0],
      point(station: number): [number, number, number] {
        if (!Number.isFinite(station)) throw new Error("Shared lower-neck axis needs a finite physical station");
        return [x + m * (station - y), station, 0];
      } };
  }

  /** One call-owned generating family, with prepared immutable bases shared by the constraint owner. */
  export interface IOutput {
    /** Actual numeric radius declaration at a selected lower radius. */
    radius(base: number): IAutoMovieViewPart.IOutline;

    /** Actual physical-station centre, independent of the lower-radius trial. */
    centre: IAutoMovieViewPart.IOutline;

    /** The identical invariant axis prepared once by this generating owner. */
    preparedCentre: AutoMovieViewOutline.IOutline;

    /** Original course parameter length, not another tape. */
    clock: number;

    /** Radius-independent radius ordinate basis. */
    constant: AutoMovieViewOutline.IOutline;

    /** Radius coefficient of the unknown lower radius. */
    basis: AutoMovieViewOutline.IOutline;
  }

  /** Author common controls before the radius-dependent side-site/height trial; no external anterior-support estimate constrains front X. */
  export function create(
    input: AutoMovieHumanHeadNeckCurves.IInputs,
    first: number,
    lower: number,
    upper: number,
  ): IOutput {
    const r: number = input.neck.radius;
    const affine: IAxis = axis(input.neck);
    const m: number = affine.first[0];

    const axisSpan: number = input.crown - first;

    // The same adopted axis continues below the normal band. Its slope is
    // a documented pose proxy, not a posterior skin or front-point tape.
    // Both source consumers read this declaration before either is lofted.
    const centre: IAutoMovieViewPart.IOutline = {
      knots: [
        {
          site: "neck.origin.bottom",
          station: first,
          value: affine.point(first)[0],
          jet: { first: m * axisSpan, second: 0 },
        },
        {
          site: "base.front",
          station: input.base.suprasternaleHeight,
          value: affine.point(input.base.suprasternaleHeight)[0],
          jet: { first: m * axisSpan, second: 0 },
        },
        {
          site: "neck.cylinder.lower",
          station: lower,
          value: affine.point(lower)[0],
          jet: { first: m * axisSpan, second: 0 },
        },
        {
          site: "neck.cylinder.upper",
          station: upper,
          value: affine.point(upper)[0],
          jet: { first: m * axisSpan, second: 0 },
        },
        {
          site: "tragion",
          station: input.tragion,
          value: input.cranialCentre,
          jet: { first: 0, second: 0 },
        },
        {
          site: "vertex",
          station: input.crown,
          value: input.cranialCentre,
          jet: { first: 0, second: 0 },
        },
      ].filter((knot: IAutoMovieViewPart.IKnot, i: number, rows: IAutoMovieViewPart.IKnot[]): boolean =>
        i === 0 || knot.station !== rows[i - 1]!.station),
    };
    const clock: number = input.base.girth;
    const radius: (base: number, normal?: number) => IAutoMovieViewPart.IOutline = (
      base: number,
      normal: number = r,
    ): IAutoMovieViewPart.IOutline => {
      const rows: [string, number, number][] = [
        ["neck.radius.bottom", first, base],
        ["base.front", input.base.suprasternaleHeight, base],
        ["neck.cylinder.lower", lower, normal],
        ["neck.cylinder.upper", upper, normal],
      ];
      return {
        parameter: { type: "root", end: "top", pole: input.crown },
        knots: rows
          .filter(
            (entry: [string, number, number], i: number): boolean =>
              i === 0 || entry[1] !== rows[i - 1]![1],
          )
          .map(
            ([site, station, value]: [
              string,
              number,
              number,
            ]): IAutoMovieViewPart.IKnot => ({
              site,
              station,
              value,
              jet: { first: 0, second: 0 },
            }),
          ),
      };
    };

    // The authored zero jets and fixed parameter make every radius value

    // linear in the two original knot ordinates: C(y) + base * B(y).

    // These are declared knot bases, not sampled or fitted completed curves.
    const constant: AutoMovieViewOutline.IOutline = prepare(radius(0, r));
    const basis: AutoMovieViewOutline.IOutline = prepare(radius(1, 0));

    return { radius, centre, preparedCentre: prepare(centre), clock, constant, basis };
  }

  /**
   * Four C2 height spans through the public named heights in their actual
   * trial clock. Side phase comes from this section's AP-plane construction,
   * not a measured clinical phase or a native quarter boundary. Zero height
   * jets remain an explicit smooth authoring choice.
   *
   * @evidence contracts/common.md#principled-implementation Uses actual trial phase and public named heights to declare four flat-two-jet quintic spans in the original finite clock.
   * @evidence contracts/common.md#clear-and-simple-design This control author performs no root search, source evaluation or geometry preparation; its explicit phase comes from the one trial owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no fixed anatomical angle, person selector, copied coordinate, target adjustment or sampled refit.
   * @evidence contracts/common.md#meaningful-documentation States the parameter clock, named heights, authoring jets and distinction from native quarters or measured clinical sites.
   * @evidence contracts/performance.md#efficient-algorithms Copies exactly five scalar knots after finite open-half phase admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This fixed-size control declaration coordinates no repeated source request or preparation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a caller-owned numeric knot array and retains no callback, prepared source or process.
   */
  export function height(
    input: AutoMovieHumanHeadNeckCurves.IInputs,
    side: number,
  ): IAutoMovieViewPart.IOutline {
    if (!(Number.isFinite(side) && side > 0 && side < Math.PI))
      throw new Error("Neck side height needs a distinct original half-profile phase");
    const phases: readonly number[] = [0, side, Math.PI, 2 * Math.PI - side, 2 * Math.PI];
    return {
      knots: [
        input.base.suprasternaleHeight,
        input.base.sideNeckPointHeight,
        input.base.cervicaleHeight,
        input.base.sideNeckPointHeight,
        input.base.suprasternaleHeight,
      ].map(
        (value: number, i: number): IAutoMovieViewPart.IKnot => ({
          site: [
            "base.front",
            "base.left",
            "base.cervicale",
            "base.right",
            "base.front.close",
          ][i]!,
          station: input.base.girth * (phases[i]! / (2 * Math.PI)),
          value,
          jet: { first: 0, second: 0 },
        }),
      ),
    };
  }

}

/** Prepare only the authored scalar; admission failure is not a replacement source. */
function prepare(outline: IAutoMovieViewPart.IOutline): AutoMovieViewOutline.IOutline {
  const prepared: ReturnType<typeof AutoMovieViewOutline.create> = AutoMovieViewOutline.create(outline);
  if ("detail" in prepared) throw new Error("Neck original source: " + prepared.detail);
  return prepared;
}
