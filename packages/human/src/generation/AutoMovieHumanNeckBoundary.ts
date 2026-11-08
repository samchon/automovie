import { AutoMovieLoftSectionNative, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanTrunkNeckSeat } from "./AutoMovieHumanTrunkNeckSeat";
import type { AutoMovieHumanHeadNeckCurves } from "./head/AutoMovieHumanHeadNeckCurves";
import type { AutoMovieHumanTrunkConnection } from "./trunk/AutoMovieHumanTrunkConnection";

/** Original regular neck boundary from shared scalar/section/frame laws, before either part or any raw chain. */
export namespace AutoMovieHumanNeckBoundary {
  /** Same physical cut, complete native family and separate legacy support interpretation. */
  export interface IOutput {
    /** Full original section and qualified physical frame2, calibration mm. */
    readonly connection: AutoMovieHumanTrunkConnection.IDefinition;

    /** Existing internal-overlap support/finite-difference convention, not the qualified source jets. */
    readonly seat: AutoMovieHumanTrunkNeckSeat.ISeat;
  }

  /**
   * @evidence contracts/common.md#principled-implementation Reads the declared radius/centre laws at the original cut and constructs all four native support two-jets and the original fixed-axis frame2 directly. Native admission still evaluates that actual complete section.
   * @evidence contracts/common.md#clear-and-simple-design Publishes the boundary needed by both source consumers, without constructing a neck part, full head, loft, mesh or calibration.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move the cut, copy a reference point, fit sampled points, extrapolate a finished curve or invent absent derivatives. The old seat's finite-difference convention remains explicitly separate from qualified jets.
   * @evidence contracts/common.md#meaningful-documentation The native family and frame use physical-Y mm; the seat is the old internal overlap interpretation, not a public neck-base landmark or anatomical certificate.
   * @evidence contracts/performance.md#efficient-algorithms Prepares one radius and one centre scalar, reads three fixed physical planes and admits one fixed-size native section. The admitted native quarter support gives the same cardinal maximum without building or sampling a raw ring.
   * @evidence contracts/performance.md#reuse-equivalent-work Both adjoining original consumers receive the same boundary descriptor; required scalar/neck constraints belong to the supplied common generating controls.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only numeric section/frame/support records return. Prepared scalars, readings and native callbacks are call-owned and no completed part or chain is retained.
   */
  export function create(controls: AutoMovieHumanHeadNeckCurves.IOutput, station: number): IOutput {
    const radius: AutoMovieViewOutline.IOutline = prepare(controls.radius);
    const centre: AutoMovieViewOutline.IOutline = prepare(controls.centre);
    const origin: AutoMovieViewOutline.IReading = read(centre, station);
    const r: AutoMovieViewOutline.IReading = read(radius, station);
    const inputs: AutoMovieHumanTrunkConnection.IDefinition["field"]["inputs"] = {
      extents: controls.extents.map((extent: number): [number, number, number] => [
        extent * r.value / controls.lateral,
        extent * r.stationJet![0] / controls.lateral,
        extent * r.stationJet![1] / controls.lateral,
      ]) as AutoMovieHumanTrunkConnection.IDefinition["field"]["inputs"]["extents"],
      shoulders: [
        [AutoMovieViewSection.ELLIPSE, 0, 0], [AutoMovieViewSection.ELLIPSE, 0, 0],
        [AutoMovieViewSection.ELLIPSE, 0, 0], [AutoMovieViewSection.ELLIPSE, 0, 0],
      ],
    };
    AutoMovieLoftSectionNative.jet(inputs)(0);
    const connection: AutoMovieHumanTrunkConnection.IDefinition = {
      boundary: { y: station,
        frame: { origin: [origin.value, station, 0], u: [1, 0, 0], v: [0, 0, 1] },
        frameSlopes: { origin: [origin.stationJet![0], 1, 0], u: [0, 0, 0], v: [0, 0, 0] },
        frameCurvatures: { origin: [origin.stationJet![1], 0, 0], u: [0, 0, 0], v: [0, 0, 0] } },
      field: { kind: "native", inputs },
    };
    const z0: number = r.value;
    const step: number = AutoMovieHumanTrunkNeckSeat.STEP;
    const z1: number = read(radius, station + step).value;
    const z2: number = read(radius, station + 2 * step).value;
    return { connection, seat: { y: station, width: z0, middle: origin.value,
      front: [origin.value + inputs.extents[0]![0], station, 0],
      back: [origin.value - inputs.extents[2]![0], station, 0],
      side: [origin.value, station, z0],
      lateral: { y: station, z: z0, slope: (-3 * z0 + 4 * z1 - z2) / (2 * step), curvature: (z0 - 2 * z1 + z2) / (step * step) } } };
  }
}

/** Admit the actual numeric scalar in its original parameter. */
function prepare(outline: IAutoMovieViewPart.IOutline): AutoMovieViewOutline.IOutline {
  const result: ReturnType<typeof AutoMovieViewOutline.create> = AutoMovieViewOutline.create(outline);
  if ("detail" in result) throw new Error(result.detail);
  return result;
}

/** Physical station derivatives of the original law, never fitted boundary jets. */
function read(outline: AutoMovieViewOutline.IOutline, station: number): AutoMovieViewOutline.IReading {
  const result: ReturnType<typeof AutoMovieViewOutline.at> = AutoMovieViewOutline.at(outline, station);
  if (typeof result === "string") throw new Error(result);
  if (result.stationJet === null) throw new Error("Original neck boundary has no qualified physical2");
  return result;
}
