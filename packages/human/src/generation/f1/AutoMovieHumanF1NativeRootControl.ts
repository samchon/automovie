import { AutoMovieViewAxisJet as AxisJet, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionOutlineParameter,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
} from "@automovie/interface";

/**
 * Original world positions in mm, or component derivatives in their named
 * coordinate.
 */
type V = AutoMovieVector3Tuple;

/**
 * Original target arithmetic, affine course origins and qualified chart priors.
 * Target compensation changes evaluation of the same P, never its geometry.
 * Coordinate priors remain distinct from full relieved-source inversion.
 */
export namespace AutoMovieHumanF1NativeRootControl {
  /**
   * Constant caliper course map with the original section directions and
   * derivative law.
   */
  export interface IAffine {
    /**
     * Transform only the course origin and its actual derivatives; keep
     * original section bases.
     */
    axis(
      prior: IAutoMovieViewAxis.IAxis,
      translation: V,
    ): IAutoMovieViewAxis.IAxis;
  }

  /**
   * Carry both original targets by the complete wall response at their clock.
   *
   * Every changed child coordinate sums child, wall, -parent and the same
   * caliper correction in one existing twofold accumulator. Adding the
   * correction after collapsing high/low would lose its cancellation error.
   * Literal parent and held-child identities retain their original values.
   *
   * The accumulator follows Ogita, Rump and Oishi (2005), algorithms 3.1, 3.3
   * and 5.3, through the engine's existing numeric owner:
   * https://www.tuhh.de/ti3/paper/rump/OgRuOi05.pdf Its product-underflow
   * accuracy limitation remains; finite inputs do not guarantee finite
   * intermediate arithmetic. Nonfinite intermediate or final accumulation
   * refuses explicitly, with no magnitude cutoff or retry. This is not a claim
   * of correctly rounded sums over all finite inputs.
   */
  export function targets(
    input: IAutoMovieHumanF1NativeRoot.ITargets,
  ): IAutoMovieHumanF1NativeRoot.ICurves {
    if (
      input.parent.length === 0 ||
      input.parent.length !== input.child.length ||
      input.parent.length !== input.wall.length
    )
      throw new Error("root controls need one complete paired clock");
    if (
      ![
        ...input.parent.flat(),
        ...input.child.flat(),
        ...input.wall.flat(),
        ...input.scale,
        ...input.basis.origin,
        ...input.basis.u,
        ...input.basis.v,
      ].every(Number.isFinite) ||
      input.scale.some((value: number): boolean => value <= 0)
    )
      throw new Error(
        "root controls must be finite and caliper ratios positive",
      );
    const anchor: V = input.parent[0]!;

    /** Existing directional caliper correction in the original fixed basis. */
    function correction(point: V): V {
      if (input.scale[0] === 1 && input.scale[1] === 1) return [0, 0, 0];
      const q: V = subtract(point, anchor);
      const a: number = (input.scale[0] - 1) * dot(q, input.basis.u);
      const b: number = (input.scale[1] - 1) * dot(q, input.basis.v);
      return [0, 1, 2].map(
        (k: number): number => a * input.basis.u[k]! + b * input.basis.v[k]!,
      ) as V;
    }
    const parent: V[] = input.parent.map((point: V, clock: number): V => {
      const extra: V = correction(point);
      const base: V = input.wall[clock]!;
      return base.map((value: number, k: number): number =>
        extra[k] === 0 ? value : sum([value, extra[k]!]),
      ) as V;
    });
    const child: V[] = input.child.map((point: V, clock: number): V => {
      const extra: V = correction(point);
      const base: V = input.wall[clock]!;
      const before: V = input.parent[clock]!;
      return point.map((value: number, k: number): number =>
        base[k] === before[k] && extra[k] === 0
          ? value
          : sum([value, base[k]!, -before[k]!, extra[k]!]),
      ) as V;
    });
    return { parent, child };
  }

  /**
   * Preserve the original address residual and unwrapped phase under the same
   * raw-coordinate increment.
   */
  export function address(
    original: readonly [number, number],
    target: readonly [number, number],
    baseline: readonly [number, number],
  ): [number, number] {
    if (![...original, ...target, ...baseline].every(Number.isFinite))
      throw new Error("native root addresses must be finite");
    const phase: number = target[1] - baseline[1];
    return [
      original[0] + (target[0] - baseline[0]),
      original[1] + phase - 2 * Math.PI * Math.round(phase / (2 * Math.PI)),
    ];
  }

  /**
   * Keep the existing constant affine candidate course policy and physical2.
   * The caller admits its finite basis, anchor and positive scales before
   * acquiring the source. Translation is constant along each returned axis.
   * Point/vector arithmetic and parameter conversion retain their original
   * evaluation order; only targets uses compensated addition.
   */
  export function create(
    basis: IAutoMovieLoftSectionFrame,
    scale: readonly [number, number],
    anchor: V,
  ): IAffine {
    /** Existing anchored point map; translation and coordinates use world mm. */
    function affine(point: V, translation: V): V {
      const q: V = subtract(point, anchor);
      const a: number = (scale[0] - 1) * dot(q, basis.u);
      const b: number = (scale[1] - 1) * dot(q, basis.v);
      return point.map(
        (value: number, k: number): number =>
          value + translation[k]! + a * basis.u[k]! + b * basis.v[k]!,
      ) as V;
    }

    /** The same constant linear part differentiates the origin once and twice. */
    function linear(point: V): V {
      const a: number = (scale[0] - 1) * dot(point, basis.u);
      const b: number = (scale[1] - 1) * dot(point, basis.v);
      return point.map(
        (value: number, k: number): number =>
          value + a * basis.u[k]! + b * basis.v[k]!,
      ) as V;
    }

    /**
     * Preserve original u/v and their derivatives while transforming the course
     * origin.
     */
    function axis(
      prior: IAutoMovieViewAxis.IAxis,
      translation: V,
    ): IAutoMovieViewAxis.IAxis {
      if (
        scale[0] === 1 &&
        scale[1] === 1 &&
        translation.every((value: number): boolean => value === 0)
      )
        return prior;

      /** The actual original frame with only its origin transformed. */
      function frame(
        value: IAutoMovieLoftSectionFrame,
      ): IAutoMovieLoftSectionFrame {
        return {
          ...value,
          origin: affine(value.origin, translation),
        };
      }
      return {
        at: (s: number): IAutoMovieLoftSectionFrame => frame(prior.at(s)),
        jet: (
          s: number,
          parameter?: IAutoMovieConstructionOutlineParameter,
        ): IAutoMovieViewAxisJet.IJet | null => {
          const value: IAutoMovieViewAxisJet.IJet | null =
            prior.jet?.(s) ?? null;
          return value === null
            ? null
            : AxisJet.parameter(
                {
                  value: frame(value.value),
                  first: { ...value.first, origin: linear(value.first.origin) },
                  second: {
                    ...value.second,
                    origin: linear(value.second.origin),
                  },
                },
                parameter,
                s,
              );
        },
      };
    }
    return { axis };
  }

  /**
   * Straight-parent bare-coordinate prior, in mm/radians; not a relieved-skin
   * inverse.
   */
  export function rawParent(
    axis: IAutoMovieViewAxis.IAxis,
    point: V,
  ): [number, number] {
    const frame: IAutoMovieLoftSectionFrame = axis.at(0);
    const normal: V = cross(frame.v, frame.u);
    const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(0) ?? null;
    if (jet === null)
      throw new Error(
        "parent raw-coordinate prior requires its actual course2",
      );
    const speed: number = dot(normal, jet.first.origin);
    if (!(Number.isFinite(speed) && speed > 0))
      throw new Error("parent course coordinate has no finite positive speed");
    const q: V = subtract(point, frame.origin);
    return [
      dot(q, normal) / speed,
      Math.atan2(dot(q, frame.v), dot(q, frame.u)),
    ];
  }

  /**
   * Same local source-native prior at the original material station, in
   * mm/radians.
   */
  export function rawChild(
    axis: IAutoMovieViewAxis.IAxis,
    point: V,
    station: number,
  ): [number, number] {
    const frame: IAutoMovieLoftSectionFrame = axis.at(station);
    const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(station) ?? null;
    if (jet === null)
      throw new Error("child coordinate prior requires its actual course2");
    const normal: V = cross(frame.v, frame.u);
    const speed: number = dot(normal, jet.first.origin);
    if (!(Number.isFinite(speed) && speed > 0))
      throw new Error("child course coordinate has no finite positive speed");
    const q: V = subtract(point, frame.origin);
    const u: number = dot(q, frame.u);
    const v: number = dot(q, frame.v);
    if (!(u * u + v * v > 0))
      throw new Error("child polar coordinate is singular on the course");
    return [station + dot(q, normal) / speed, Math.atan2(v, u)];
  }

  /**
   * The original caliper-frame construction clock, with no anatomical
   * interpretation.
   */
  export function polarAt(frame: IAutoMovieLoftSectionFrame, point: V): number {
    const q: V = subtract(point, frame.origin);
    const u: number = dot(q, frame.u);
    const v: number = dot(q, frame.v);
    if (!(Number.isFinite(u) && Number.isFinite(v) && u * u + v * v > 0))
      throw new Error("original caliper polar binding is singular");
    return Math.atan2(v, u);
  }

  /**
   * Accumulate at most four unchanged target terms with the engine's twofold
   * owner. Inputs and every intermediate high/low must remain finite; even a
   * finite exact final sum can exceed this nonoverflowing evaluation domain.
   * Two or four terms and one two-double buffer bound this call's resources.
   */
  function sum(
    values:
      | readonly [number, number]
      | readonly [number, number, number, number],
  ): number {
    const accumulator: Float64Array = new Float64Array(2);
    for (const value of values) {
      if (!Number.isFinite(value))
        throw new Error("native root target accumulation has a nonfinite term");
      AutoMovieEngineMath.addQuadraticProduct(accumulator, 0, value, 1);
      if (!(Number.isFinite(accumulator[0]) && Number.isFinite(accumulator[1])))
        throw new Error("native root target twofold accumulation overflowed");
    }
    const value: number = accumulator[0]! + accumulator[1]!;
    if (!Number.isFinite(value))
      throw new Error("native root target final accumulation overflowed");
    return value;
  }

  /** Fresh component subtraction with unchanged arithmetic. */
  function subtract(a: V, b: V): V {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Existing projection onto an original frame direction. */
  function dot(a: V, b: V): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Original frame normal in the engine's v-cross-u convention. */
  function cross(a: V, b: V): V {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
}
