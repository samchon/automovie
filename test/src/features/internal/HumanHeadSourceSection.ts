import { type AutoMovieViewCurves, AutoMovieViewOutline, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

/**
 * Observe the actual original head section for head and neck source tests.
 * No loft, mesh, anatomical tape-site substitution or inverse fit is used.
 *
 * @evidence contracts/common.md#principled-implementation Reads the four original scalar edges and their declared shoulder/departure owner through the public engine, then measures that same bare section.
 * @evidence contracts/common.md#clear-and-simple-design One shared observer avoids different head/neck interpretations of the identical original section.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Returns the actual fault and length, never a circle-equivalent target or surviving loft section.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original horizontal source observations from anatomical tapes and final skin.
 * @evidence contracts/performance.md#efficient-algorithms Four prepared edge reads, at most five scalar fullness preparations and one fixed-size native section measurement.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller supplies its already prepared original edges; no head generation or raw loft is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fixed-size numeric observations and a nullable fault, retaining no source or global cache.
 */
export namespace HumanHeadSourceSection {
  /** Actual source magnitudes/quarters and their native perimeter, calibration mm except the dimensionless shoulders. */
  export interface IOutput {
    /** Front, left, back and right support magnitudes. */
    extents: [number, number, number, number];
    /** Quarter fullness in increasing source phase. */
    shoulders: [number, number, number, number];
    /** Length of that section, not an identified anatomical tape. */
    perimeter: number;
    /** The engine's original source fault. */
    fault: string | null;
  }

  /**
   * Read one original section of the head's current shoulder-fullness source.
   * Invalid or unsupported source data throws with its original reason.
   *
   * @evidence contracts/common.md#principled-implementation Reuses source preparation/value and native section owners; no independent curve or quadrature implementation is present.
   * @evidence contracts/common.md#clear-and-simple-design Keeps one section's four supports, four quarter values, length and fault together.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses a missing edge or a different fullness owner rather than inferring a replacement.
   * @evidence contracts/common.md#meaningful-documentation States units, actual-source scope and explicit failures.
   * @evidence contracts/performance.md#efficient-algorithms Work is linear in the bounded fullness knot lists plus the engine's native section measurement cost.
   * @evidence contracts/performance.md#reuse-equivalent-work Receives already prepared radial curves and never constructs a figure or loft.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned small record survives; scalar preparations are local.
   */
  export function of(part: IAutoMovieViewPart, source: AutoMovieViewCurves.IResult, height: number): IOutput {
    const scalar: (outline: IAutoMovieViewPart.IOutline) => number = (outline: IAutoMovieViewPart.IOutline): number => {
      const prepared: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(outline);
      if ("detail" in prepared) throw new Error(`Original section observation: ${prepared.detail}`);
      const value: number | string = AutoMovieViewOutline.value(prepared, height);
      if (typeof value === "string") throw new Error(`Original section observation: ${value}`);
      return value;
    };
    const edge: (name: AutoMovieViewCurves.ICurve["name"]) => number = (name: AutoMovieViewCurves.ICurve["name"]): number => {
      const outline: AutoMovieViewOutline.IOutline | null = source.curves.find((curve: AutoMovieViewCurves.ICurve): boolean => curve.name === name)?.outline ?? null;
      if (outline === null) throw new Error(`Original section observation has no ${name} source`);
      const value: number | string = AutoMovieViewOutline.value(outline, height);
      if (typeof value === "string") throw new Error(`Original section observation: ${value}`);
      return value;
    };
    if (part.fullness.kind !== "shoulder") throw new Error("This head observation requires its current declared shoulder owner");
    const common: number = scalar(part.fullness.shoulder);
    const departures: readonly IAutoMovieViewPart.IOutline[] | undefined = part.fullness.departures;
    const quarter: (index: number) => number = (index: number): number => common + (departures === undefined ? 0 : scalar(departures[index]!));
    const shoulders: [number, number, number, number] = [quarter(0), quarter(1), quarter(2), quarter(3)];
    const extents: [number, number, number, number] = [edge("front.positive"), edge("side.positive"), -edge("front.negative"), -edge("side.negative")];
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents }, shoulders);
    return { extents, shoulders, perimeter: AutoMovieViewSection.length(section), fault: AutoMovieViewSection.fault(section) };
  }
}
