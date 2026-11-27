import { AutoMovieSplineCurve } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanLimbFrame,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

/**
 * Section frames of a limb lofted on its bones, and the layers they carry.
 *
 * A limb's section at a station lies in a plane across its bone, the plane's
 * normal pointing up the chain toward its parent. The in-plane axes are carried
 * from one plane to the next by the least rotation that takes the one normal
 * to the other, the discrete rotation-minimising (parallel-transport) frame, so
 * they never flip and turn about the normal only as much as the bones' bend
 * forces. Across a joint the normal turns smoothly from one bone to the next,
 * and the frame turns with it; posed, a section is its frame moved by the bone
 * that carries it.
 *
 * A layer is a ring of world points expressed in its frame: the in-plane
 * coordinates are the section's spline controls, the out-of-plane residue its
 * lift, and the frame's own station derivative is given so the chain moves the
 * plane by the Hermite rule between layers, matching the field it was cut
 * from.
 */
export namespace AutoMovieHumanLimbFrame {
  /**
   * The in-plane axis carried from a plane of normal `from` to one of normal
   * `to`: the least rotation between the normals, about their cross product.
   */
  export function carry(
    u: AutoMovieVector3Tuple,
    from: AutoMovieVector3Tuple,
    to: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    const a: AutoMovieVector3Tuple = unit(from);
    const b: AutoMovieVector3Tuple = unit(to);
    const k: AutoMovieVector3Tuple = cross(a, b);
    const c: number = dot(a, b);
    const s: number = norm(k);
    if (s < 1e-12) return orthogonal(u, b);
    // Rodrigues' rotation by the angle between the normals about k / |k|.
    const axis: AutoMovieVector3Tuple = scale(k, 1 / s);
    const turned: AutoMovieVector3Tuple = add(
      add(scale(u, c), scale(cross(axis, u), s)),
      scale(axis, dot(axis, u) * (1 - c)),
    );
    return orthogonal(turned, b);
  }

  /**
   * A frame from an origin, a normal toward increasing station and an
   * in-plane axis, completed so that the normal is `v x u`.
   */
  export function frame(
    origin: AutoMovieVector3Tuple,
    normal: AutoMovieVector3Tuple,
    u: AutoMovieVector3Tuple,
  ): IAutoMovieLoftSectionFrame {
    const n: AutoMovieVector3Tuple = unit(normal);
    const a: AutoMovieVector3Tuple = orthogonal(u, n);
    return { origin, u: a, v: cross(a, n) };
  }

  /** The frame's normal `v x u`, toward increasing station. */
  export function normal(f: IAutoMovieLoftSectionFrame): AutoMovieVector3Tuple {
    return cross(f.v, f.u);
  }

  /**
   * The mirror image of a left-side frame across the midline (z to -z), with
   * `v` turned over so its normal still points up the chain.
   */
  export function mirror(
    f: IAutoMovieLoftSectionFrame,
  ): IAutoMovieLoftSectionFrame {
    return {
      origin: [f.origin[0], f.origin[1], -f.origin[2]],
      u: [f.u[0], f.u[1], -f.u[2]],
      v: [-f.v[0], -f.v[1], f.v[2]],
    };
  }

  /** Spline controls and lift of a ring in its frame. */
  export function controls(
    sample: IAutoMovieHumanLimbFrame.ISample,
    order: number,
  ): IAutoMovieHumanLimbFrame.IControlsResult {
    const f: IAutoMovieLoftSectionFrame = sample.frame;
    const n: AutoMovieVector3Tuple = normal(f);
    const local: AutoMovieVector3Tuple[] = sample.ring.map(
      (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => {
        const d: AutoMovieVector3Tuple = sub(p, f.origin);
        return [dot(d, f.u), dot(d, f.v), dot(d, n)];
      },
    );
    return {
      coefficients: AutoMovieSplineCurve.interpolate(
        local.map((q: AutoMovieVector3Tuple): [number, number] => [q[0], q[1]]),
      ),
      lift: AutoMovieSplineCurve.interpolate(
        local.map((q: AutoMovieVector3Tuple): [number, number] => [q[2], 0]),
      ).slice(0, order),
    };
  }

  /**
   * A principal layer from its section and the sections a small station step
   * either side: values from the section, every slope (coefficients, lift and
   * the plane's components) the central difference of the neighbours, each
   * read in its own frame.
   */
  export function layer(
    here: IAutoMovieHumanLimbFrame.ISample,
    before: IAutoMovieHumanLimbFrame.ISample,
    after: IAutoMovieHumanLimbFrame.ISample,
    order: number,
  ): IAutoMovieLoftChain.ILayer {
    const h: ReturnType<typeof controls> = controls(here, order);
    const a: ReturnType<typeof controls> = controls(before, order);
    const b: ReturnType<typeof controls> = controls(after, order);
    const span: number = after.station - before.station;
    const slope = (lo: readonly number[], hi: readonly number[]): number[] =>
      lo.map((v: number, i: number): number => (hi[i]! - v) / span);
    const flat = (f: IAutoMovieLoftSectionFrame): number[] => [
      ...f.origin,
      ...f.u,
      ...f.v,
    ];
    const d: number[] = slope(flat(before.frame), flat(after.frame));
    return {
      y: here.station,
      frame: here.frame,
      frameSlopes: {
        origin: [d[0]!, d[1]!, d[2]!],
        u: [d[3]!, d[4]!, d[5]!],
        v: [d[6]!, d[7]!, d[8]!],
      },
      coefficients: h.coefficients,
      slopes: slope(a.coefficients, b.coefficients),
      lift: h.lift,
      liftSlopes: slope(a.lift, b.lift),
    };
  }

  /**
   * Layers from sections already sampled at their stations, the slopes the
   * three-point derivative over the neighbouring layers (one-sided at the
   * ends), for a chain whose sections exist only at its layers.
   */
  export function layers(
    samples: readonly IAutoMovieHumanLimbFrame.ISample[],
    order: number,
  ): IAutoMovieLoftChain.ILayer[] {
    const values = samples.map(
      (s: IAutoMovieHumanLimbFrame.ISample): number[] => {
        const c = controls(s, order);
        return [
          ...c.coefficients,
          ...c.lift,
          ...s.frame.origin,
          ...s.frame.u,
          ...s.frame.v,
        ];
      },
    );
    const stations: number[] = samples.map(
      (s: IAutoMovieHumanLimbFrame.ISample): number => s.station,
    );
    const width: number = 2 * order;
    return samples.map(
      (
        s: IAutoMovieHumanLimbFrame.ISample,
        k: number,
      ): IAutoMovieLoftChain.ILayer => {
        const d: number[] = derivative(stations, values, k);
        const own: number[] = values[k]!;
        return {
          y: s.station,
          frame: s.frame,
          frameSlopes: {
            origin: [
              d[width + order]!,
              d[width + order + 1]!,
              d[width + order + 2]!,
            ],
            u: [
              d[width + order + 3]!,
              d[width + order + 4]!,
              d[width + order + 5]!,
            ],
            v: [
              d[width + order + 6]!,
              d[width + order + 7]!,
              d[width + order + 8]!,
            ],
          },
          coefficients: own.slice(0, width),
          slopes: d.slice(0, width),
          lift: own.slice(width, width + order),
          liftSlopes: d.slice(width, width + order),
        };
      },
    );
  }

  /*
   * Three-point derivative of a list of arrays over unequal stations.
   */
  function derivative(
    s: readonly number[],
    values: readonly (readonly number[])[],
    k: number,
  ): number[] {
    const a: number = Math.max(0, k - 1);
    const b: number = Math.min(s.length - 1, k + 1);
    if (a === k || b === k)
      return values[k]!.map(
        (_: number, i: number): number =>
          (values[b]![i]! - values[a]![i]!) / (s[b]! - s[a]!),
      );
    const h0: number = s[k]! - s[a]!;
    const h1: number = s[b]! - s[k]!;
    return values[k]!.map(
      (v: number, i: number): number =>
        ((values[b]![i]! - v) * h0 * h0 + (v - values[a]![i]!) * h1 * h1) /
        (h0 * h1 * (h0 + h1)),
    );
  }

  /*
   * The part of u square to a unit normal, as a unit vector.
   */
  function orthogonal(
    u: AutoMovieVector3Tuple,
    n: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return unit(sub(u, scale(n, dot(u, n))));
  }

  function add(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a: AutoMovieVector3Tuple, s: number): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function norm(a: AutoMovieVector3Tuple): number {
    return Math.hypot(a[0], a[1], a[2]);
  }

  function unit(a: AutoMovieVector3Tuple): AutoMovieVector3Tuple {
    return scale(a, 1 / (norm(a) || 1));
  }

  function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
}
