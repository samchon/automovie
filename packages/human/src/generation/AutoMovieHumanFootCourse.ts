import { AutoMovieEngineLoftChain as Loft } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootCourse,
  IAutoMovieHumanFootSurface,
} from "@automovie/interface";

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
  export function minimum(
    address: IAutoMovieHumanFootCourse.IAddress,
    score: IAutoMovieHumanFootCourse.MinimumScore,
  ): IAutoMovieHumanFootCourse.IMinimum {
    const sample: (phase: number) => AutoMovieVector3Tuple = Loft.sampler(
      address.chain,
      address.station,
    );
    const at = (phase: number): IAutoMovieHumanFootCourse.IMinimum => {
      const point: AutoMovieVector3Tuple = sample(phase);
      return { phase, point, score: score(point) };
    };
    const pitch: number = (2 * Math.PI) / 64;
    let best: IAutoMovieHumanFootCourse.IMinimum = at(0);
    for (let index: number = 1; index < 64; index++) {
      const candidate: IAutoMovieHumanFootCourse.IMinimum = at(index * pitch);
      if (candidate.score < best.score) best = candidate;
    }
    let low: number = best.phase - pitch;
    let high: number = best.phase + pitch;
    for (let step: number = 0; step < 40; step++) {
      const a: IAutoMovieHumanFootCourse.IMinimum = at(
        low + ((high - low) * (3 - Math.sqrt(5))) / 2,
      );
      const b: IAutoMovieHumanFootCourse.IMinimum = at(
        low + ((high - low) * (Math.sqrt(5) - 1)) / 2,
      );
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
  export function course(
    address: IAutoMovieHumanFootCourse.IAddress,
    phases: number[],
    scale: number,
  ): IAutoMovieHumanFootSurface.ICourse {
    const points: AutoMovieVector3Tuple[] = Loft.ring(
      address.chain,
      address.station,
      phases,
    ).map(
      (point: AutoMovieVector3Tuple): AutoMovieVector3Tuple => [
        point[0] * scale,
        point[1] * scale,
        point[2] * scale,
      ],
    );
    const centre: AutoMovieVector3Tuple = Loft.axis(
      address.chain,
      address.station,
    ).map((value: number): number => value * scale) as AutoMovieVector3Tuple;
    const frame: ReturnType<typeof Loft.frame> = Loft.frame(
      address.chain,
      address.station,
    );
    const u: number[] = points.map((point: AutoMovieVector3Tuple): number =>
      dot(sub(point, centre), frame.u),
    );
    const v: number[] = points.map((point: AutoMovieVector3Tuple): number =>
      dot(sub(point, centre), frame.v),
    );
    const lengths: number[] = points.map(
      (point: AutoMovieVector3Tuple, index: number): number =>
        Math.hypot(...sub(points[(index + 1) % points.length]!, point)),
    );
    const total: number = lengths.reduce(
      (sum: number, length: number): number => sum + length,
      0,
    );
    if (
      !(total > 0) ||
      !points.every((point: AutoMovieVector3Tuple): boolean =>
        point.every(Number.isFinite),
      )
    )
      throw new Error("Foot source course is collapsed or nonfinite");
    let travelled: number = 0;
    const coordinates: number[] = lengths.map((length: number): number => {
      const value: number = (2 * Math.PI * travelled) / total;
      travelled += length;
      return value;
    });
    return {
      chain: address.chain.name as IAutoMovieHumanFootSurface.Chain,
      stationMm: address.station,
      centre,
      depth: Math.max(...u) - Math.min(...u),
      breadth: Math.max(...v) - Math.min(...v),
      points,
      sourcePhases: [...phases],
      displayCoordinates: coordinates,
    };
  }
}

/*
 * Physical vector difference for the retained display samples.
 */
function sub(
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/*
 * Euclidean projection onto the source frame's unit direction.
 */
function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
