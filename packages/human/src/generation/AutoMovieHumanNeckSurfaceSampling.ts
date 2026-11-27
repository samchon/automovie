import { AutoMovieEngineLoftChain, AutoMovieEngineLoftParameter } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanNeckSurface,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

/**
 * Source evaluation and physical copying for the prepared exterior descriptor.
 * Course selection and the public descriptor remain owned by NeckSurface.
 *
 * @evidence contracts/common.md#principled-implementation Existing loft evaluation supplies unmodified points, frame and lift; source measurements remain separate from display polygon geometry.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and unit conversion share one owner while band selection and public types stay in NeckSurface; the reverse dependency is type-only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling neither chooses anatomical sites nor adjusts geometry to match public dimensions or skeletal radii.
 * @evidence contracts/common.md#meaningful-documentation Each operation states source ownership, physical units, measurement density and the difference between source phases and display coordinates.
 * @evidence contracts/performance.md#efficient-algorithms Each section evaluates its display phases and 256 measurement phases once, then traverses the measurement ring once.
 * @evidence contracts/performance.md#reuse-equivalent-work Every addressed section reuses the same fixed measurement-phase array; the caller supplies its prepared chain without another calibration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the fixed phase array survives at module scope; temporary source arrays are released after independent descriptor copies return.
 */
export namespace AutoMovieHumanNeckSurfaceSampling {
  /**
   * Copy one source ring and its independent dense measurement in metres.
   *
   * @evidence contracts/common.md#principled-implementation Loft.ring preserves source frame and lift; cyclic Euclidean segment lengths and world extrema measure the separate 256-phase source ring.
   * @evidence contracts/common.md#clear-and-simple-design Sampling, display coordinates and unit conversion stay together so the consumer needs neither a calibration nor a second fit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The eight-point display perimeter is not labelled as the dense source circumference, and no measured value resizes geometry.
   * @evidence contracts/common.md#meaningful-documentation The result interface states physical units, source address, sampling density and world-axis extent meanings.
   * @evidence contracts/performance.md#efficient-algorithms Two fixed-size ring evaluations and one 256-point measurement pass dominate; only eight points are copied to the output.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This function copies one addressed section synchronously and coordinates no external effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Dense and unscaled points are local temporaries; output frame vectors and points are independent copies without chain references.
   */
  export function section(
    chain: IAutoMovieLoftChain,
    station: number,
    requestedHeight: number,
    phases: readonly number[],
    scale: number,
  ): IAutoMovieHumanNeckSurface.ISection {
    const points: AutoMovieVector3Tuple[] = AutoMovieEngineLoftChain.ring(
      chain,
      station,
      phases,
    );
    const dense: AutoMovieVector3Tuple[] = AutoMovieEngineLoftChain.ring(
      chain,
      station,
      MEASURE_PHASES,
    );
    let circumference: number = 0;
    let minX: number = Infinity;
    let maxX: number = -Infinity;
    let minZ: number = Infinity;
    let maxZ: number = -Infinity;
    for (let i: number = 0; i < dense.length; ++i) {
      const point: AutoMovieVector3Tuple = dense[i]!;
      const next: AutoMovieVector3Tuple = dense[(i + 1) % dense.length]!;
      circumference += Math.hypot(
        next[0] - point[0],
        next[1] - point[1],
        next[2] - point[2],
      );
      minX = Math.min(minX, point[0]);
      maxX = Math.max(maxX, point[0]);
      minZ = Math.min(minZ, point[2]);
      maxZ = Math.max(maxZ, point[2]);
    }
    const frame: IAutoMovieLoftSectionFrame = AutoMovieEngineLoftChain.frame(
      chain,
      station,
    );
    return {
      chain: chain.name,
      stationMm: station,
      requestedHeight: requestedHeight * scale,
      centre: scaled(AutoMovieEngineLoftChain.axis(chain, station), scale),
      frame: {
        origin: scaled(frame.origin, scale),
        u: [...frame.u],
        v: [...frame.v],
      },
      points: points.map(
        (point: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
          scaled(point, scale),
      ),
      sourcePhases: [...phases],
      displayCoordinates: AutoMovieEngineLoftParameter.phases(
        "arclength",
        AutoMovieEngineLoftChain.local(chain, station, points),
      ),
      circumference: circumference * scale,
      breadth: (maxZ - minZ) * scale,
      depth: (maxX - minX) * scale,
    };
  }

  /**
   * Physical unit conversion of an owned point, without changing its source.
   *
   * @evidence contracts/common.md#principled-implementation Uniform multiplication applies the caller's calibration-mm to metre scale to all Cartesian components.
   * @evidence contracts/common.md#clear-and-simple-design A fixed three-component copy avoids mutating a source point or frame origin.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts All axes receive the same supplied physical scale without per-consumer offsets or compensations.
   * @evidence contracts/common.md#meaningful-documentation The signature separates the read-only source point and conversion factor from the returned owned tuple.
   * @evidence contracts/performance.md#efficient-algorithms Three multiplications and one three-number tuple take constant time and space.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This arithmetic helper coordinates no requests, phases or effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned tuple; the function retains no input or state.
   */
  export function scaled(
    point: Readonly<AutoMovieVector3Tuple>,
    scale: number,
  ): AutoMovieVector3Tuple {
    return [point[0] * scale, point[1] * scale, point[2] * scale];
  }
}

/*
 * Existing landmark/perimeter sampling density, independent of display LOD.
 */
const MEASURE_PHASES: number[] = Array.from(
  { length: 256 },
  (_: unknown, i: number): number => (2 * Math.PI * i) / 256,
);
