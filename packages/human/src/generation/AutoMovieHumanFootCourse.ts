import { AutoMovieLoftChain as Loft, type IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanFootSurface as Foot } from "./AutoMovieHumanFootSurface";

/**
 * Samples generated loft courses for the optional rigid foot display, never a construction input.
 *
 * @evidence contracts/common.md#principled-implementation Reads engine source-course samples for display metadata without claiming continuous extrema or exact arclength.
 * @evidence contracts/common.md#clear-and-simple-design Owns bounded phase search and retained-course conversion in one display-only module.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not move a generated point, fit a footprint or feed sampled display measurements back into source construction.
 * @evidence contracts/common.md#meaningful-documentation States station/physical units, sample budgets and the limitations of polygon descriptors and arbitrary-objective refinement.
 * @evidence contracts/performance.md#efficient-algorithms Each search has 64 initial plus at most 80 refinement evaluations; course conversion is linear in retained phases.
 * @evidence contracts/performance.md#reuse-equivalent-work Each query reuses one engine sampler and each retained course reuses its own sampled points for descriptors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary samples and search state are query-local; returned arrays belong to the display caller.
 */
export namespace AutoMovieHumanFootCourse {
  /**
   * Exact source chain and material address before a display ring exists.
   *
   * @evidence contracts/common.md#principled-implementation Names the actual chain and its calibration-mm station directly.
   * @evidence contracts/common.md#clear-and-simple-design The pair identifies one source course without a fabricated ring.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Contains no world-height or old station-index substitute.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes the source chain reference and material station units.
   * @evidenceExclude contracts/performance.md#efficient-algorithms An address type owns no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Query functions determine sampler reuse.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The display query borrows the chain; the address owns no external handle.
   */
  export interface IAddress {
    /** Source chain. */
    chain: IAutoMovieLoftChain;

    /** Calibration-mm station. */
    station: number;
  }

  /**
   * The best evaluated point of a bounded phase search, not a continuous global-minimum guarantee.
   *
   * @evidence contracts/common.md#principled-implementation Retains the lowest actually evaluated score with that source point and phase.
   * @evidence contracts/common.md#clear-and-simple-design Three values expose exactly what the bounded search observed.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not present an unevaluated interpolation or local refinement as a certified global minimum.
   * @evidence contracts/common.md#meaningful-documentation States phase, point units and objective-score meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result declaration has no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The minimum query owns search work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the fixed-size result and sampled point.
   */
  export interface IMinimum {
    /** Material phase, radians. */
    phase: number;

    /** Actual source point, calibration mm. */
    point: Foot.Vector;

    /** Value of the anatomical site objective. */
    score: number;
  }

  /**
   * Sample an objective at 64 phases and refine its best bracket by 40 golden-section steps.
   * Returns the lowest score among those evaluations. An arbitrary objective
   * need not be unimodal, so neither the bracket nor the global minimum is
   * certified. The caller names a display objective; no loft point is moved.
   *
   * @evidence contracts/common.md#principled-implementation Reads the engine's loft sampler directly and returns the best actually evaluated objective value, without claiming a continuous extremum.
   * @evidence contracts/common.md#clear-and-simple-design One material-address query is shared by anatomical landmarks and retained footprint extrema.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No floor projection, fitted point or geometry cache replaces source evaluation.
   * @evidence contracts/common.md#meaningful-documentation States the sample/refinement budget and lack of a global guarantee for arbitrary objectives; this is display-only metadata.
   * @evidence contracts/performance.md#efficient-algorithms Uses 64 initial and at most 80 refinement evaluations per course, with constant retained state.
   * @evidence contracts/performance.md#reuse-equivalent-work One engine sampler serves all evaluations of the same course query.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the best point and current bracket during one synchronous query.
   */
  export function minimum(address: IAddress, score: (point: Foot.Vector) => number): IMinimum {
    const sample: (phase: number) => Foot.Vector = Loft.sampler(address.chain, address.station);
    const at = (phase: number): IMinimum => {
      const point: Foot.Vector = sample(phase);
      return { phase, point, score: score(point) };
    };
    const pitch: number = (2 * Math.PI) / 64;
    let best: IMinimum = at(0);
    for (let index: number = 1; index < 64; index++) {
      const candidate: IMinimum = at(index * pitch);
      if (candidate.score < best.score) best = candidate;
    }
    let low: number = best.phase - pitch;
    let high: number = best.phase + pitch;
    for (let step: number = 0; step < 40; step++) {
      const a: IMinimum = at(low + ((high - low) * (3 - Math.sqrt(5))) / 2);
      const b: IMinimum = at(low + ((high - low) * (Math.sqrt(5) - 1)) / 2);
      if (a.score < best.score) best = a;
      if (b.score < best.score) best = b;
      if (a.score < b.score) high = b.phase;
      else low = a.phase;
    }
    return best;
  }

  /**
   * Copy the retained phase samples into physical metres and measure their
   * projected extents and cyclic chord-polygon perimeter. These are sampled
   * descriptors, not continuous loft extrema or exact curve arclength.
   *
   * @evidence contracts/common.md#principled-implementation Every emitted point is Loft.ring at the retained chain, station and phase, with the caller's one unit conversion.
   * @evidence contracts/common.md#clear-and-simple-design Material addresses accompany points; sampled extents and normalized cyclic chord lengths serve display metadata only.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses collapsed or nonfinite courses instead of inventing a ring or flattening its source.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes calibration station and physical coordinates, and sampled polygon measurements from continuous extrema and arclength.
   * @evidence contracts/performance.md#efficient-algorithms Uses linear passes over the small retained phase set.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the retained samples for projected extents, chord perimeter and display coordinates.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned small arrays without retaining the source calibration or sampler.
   */
  export function course(address: IAddress, phases: number[], scale: number): Foot.ICourse {
    const points: Foot.Vector[] = Loft.ring(address.chain, address.station, phases).map((point: Foot.Vector): Foot.Vector => [point[0] * scale, point[1] * scale, point[2] * scale]);
    const centre: Foot.Vector = Loft.axis(address.chain, address.station).map((value: number): number => value * scale) as Foot.Vector;
    const frame: ReturnType<typeof Loft.frame> = Loft.frame(address.chain, address.station);
    const u: number[] = points.map((point: Foot.Vector): number => dot(sub(point, centre), frame.u));
    const v: number[] = points.map((point: Foot.Vector): number => dot(sub(point, centre), frame.v));
    const lengths: number[] = points.map((point: Foot.Vector, index: number): number => Math.hypot(...sub(points[(index + 1) % points.length]!, point)));
    const total: number = lengths.reduce((sum: number, length: number): number => sum + length, 0);
    if (!(total > 0) || !points.every((point: Foot.Vector): boolean => point.every(Number.isFinite)))
      throw new Error("Foot source course is collapsed or nonfinite");
    let travelled: number = 0;
    const coordinates: number[] = lengths.map((length: number): number => {
      const value: number = (2 * Math.PI * travelled) / total;
      travelled += length;
      return value;
    });
    return { chain: address.chain.name as Foot.Chain, stationMm: address.station, centre, depth: Math.max(...u) - Math.min(...u), breadth: Math.max(...v) - Math.min(...v), points, sourcePhases: [...phases], displayCoordinates: coordinates };
  }
}

/** Physical vector difference for the retained display samples. */
function sub(a: Foot.Vector, b: Foot.Vector): Foot.Vector {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Euclidean projection onto the source frame's unit direction. */
function dot(a: Foot.Vector, b: Foot.Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
