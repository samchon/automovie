import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanEventJoinPlace } from "./AutoMovieHumanEventJoinPlace";
import { AutoMovieHumanEventJoinRing } from "./AutoMovieHumanEventJoinRing";
import { AutoMovieHumanEventJoinVector } from "./AutoMovieHumanEventJoinVector";

type Vec3 = AutoMovieHumanEventJoinVector.Vec3;
type IRing = AutoMovieHumanEventJoinRing.IRing;
const { add, cross, dot, norm, scale, smooth, sub, unit } = AutoMovieHumanEventJoinVector;
const { nearest } = AutoMovieHumanEventJoinRing;
const { FAR } = AutoMovieHumanEventJoinPlace;

/**
 * The event join's second rule: the child's end derivative turned into the
 * parent's tangent plane, by the smallest in-plane change of each end
 * point's station derivative, its lump bounded by {@link BULGE} and, with a
 * fillet, spread over the child's layers within that many radii.
 */
export namespace AutoMovieHumanEventJoinSlope {
  /** Rise of `|N . m|` past 0.3 over which a point comes to take the slope. */
  export const FACING: number = 0.2;

  /** Largest lump an end slope may raise off its span's chord, mm. */
  export const BULGE: number = 4;

  /** Child chain with its end layer at the event re-sloped. */
  export function slope(
    parent: IAutoMovieLoftChain,
    ring: IRing,
    child: IAutoMovieLoftChain,
    direction: "down" | "up",
    fillet: number,
  ): IAutoMovieLoftChain {
    const sp: number = ring.sp;
    const k: number = direction === "down" ? child.layers.length - 1 : 0;
    const sc: number = child.layers[k]!.y;

    // In-plane slope changes at uniform child phases, 4 per control point.
    const N: number = child.order;
    const Q: number = 4 * N;
    const f: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(
      child,
      sc,
    );
    const normal: Vec3 = cross(f.v, f.u);
    const c: number[] = AutoMovieLoftChain.coefficients(child, sc);
    const h: number = 0.02;
    const inward: number = direction === "down" ? -1 : 1;
    const previous: number = child.layers[k + inward]!.y;
    const inner: Vec3[] = AutoMovieLoftChain.ring(
      child,
      previous,
      Array.from(
        { length: Q },
        (_: unknown, i: number): number => (2 * Math.PI * i) / Q,
      ),
    );
    const onParent: (t: number) => Vec3 = AutoMovieLoftChain.sampler(
      parent,
      sp,
    );
    const insideParent: (t: number) => Vec3 = AutoMovieLoftChain.sampler(
      parent,
      sp - inward * h,
    );
    const onChild: (t: number) => Vec3 = AutoMovieLoftChain.sampler(
      child,
      sc,
    );
    const insideChild: (t: number) => Vec3 = AutoMovieLoftChain.sampler(
      child,
      sc + inward * h,
    );
    const samples: [number, number][] = [];

    // The fillet's slope at each phase, and the length it spreads over.
    const spread: Vec3[] = [];
    const rim: Vec3[] = Array.from(
      { length: Q },
      (_: unknown, i: number): Vec3 => onChild((2 * Math.PI * i) / Q),
    );
    const reach: number =
      (fillet *
        rim.reduce(
          (sum: number, p: Vec3, i: number): number =>
            sum + norm(sub(rim[(i + 1) % Q]!, p)),
          0,
        )) /
      (2 * Math.PI);
    const most: number = reach > 0 ? (27 * BULGE) / (4 * reach) : 0;
    // Consecutive child points lie near consecutive parent samples.
    let last: number | undefined;
    for (let i: number = 0; i < Q; i++) {
      const t: number = (2 * Math.PI * i) / Q;
      const s: [number, number, number, number] = AutoMovieLoftChain.section(
        child,
        c,
        t,
      );
      const p: Vec3 = onChild(t);

      // Nearest parent sample, then the parent's jets there.
      const [tau, , distance, found] = nearest(ring, p, last);
      last = found;
      // Both guards fade rather than switch: a change that turns on and off from
      // one sample to the next prints ribs across the seam.
      const w: number = ring.weight(tau) * (1 - smooth((distance - 0.5) / FAR));
      if (w === 0) {
        samples.push([0, 0]);
        spread.push([0, 0, 0]);
        continue;
      }
      const P: Vec3 = onParent(tau);
      const Tp: Vec3 = sub(onParent(tau + 1e-4), onParent(tau - 1e-4));
      const Dp: Vec3 = scale(sub(P, insideParent(tau)), 1 / h);
      const Dc: Vec3 = scale(sub(insideChild(t), p), 1 / h);
      const N3: Vec3 = unit(cross(Tp, Dp));
      const Tc: Vec3 = add(scale(f.u, s[2]), scale(f.v, s[3]));
      const m: Vec3 = unit(cross(normal, Tc));
      const nm: number = dot(N3, m);
      const facing: number = smooth((Math.abs(nm) - 0.3) / FACING);
      if (facing === 0) {
        samples.push([0, 0]);
        spread.push([0, 0, 0]);
        continue;
      }

      // Child slopes are per unit station in the child's own direction; the
      // two derivatives above both point away from the parent.
      const own: number = dot(Dc, m);
      const span: number = Math.abs(previous - sc);
      const secant: number = dot(sub(inner[i]!, p), m) / span;
      const turn: number = Math.max(
        (27 * BULGE) / (4 * span),
        Math.abs(own - secant),
      );
      const alpha: number =
        Math.max(
          secant - turn,
          Math.min(secant + turn, own + (facing * w * AutoMovieHumanSeam.defect(N3, Dp, Dc)) / nm),
        ) - own;
      const delta: Vec3 = scale(m, inward * alpha);
      samples.push([dot(delta, f.u), dot(delta, f.v)]);
      spread.push(scale(m, Math.max(-most, Math.min(most, alpha))));
    }
    const change: number[] = AutoMovieSplineCurve.project(samples, N);

    const layers: IAutoMovieLoftChain.ILayer[] = [...child.layers];
    layers[k] = {
      ...layers[k]!,
      slopes: layers[k]!.slopes.map(
        (v: number, i: number): number => v + change[i]!,
      ),
    };
    child.layers.forEach(
      (layer: IAutoMovieLoftChain.ILayer, j: number): void => {
        const sigma: number = Math.abs(layer.y - sc);
        if (j === k || sigma >= reach) return;
        const x: number = sigma / reach;
        const lean: number = sigma * (1 - x) ** 2;
        const rate: number = inward * (1 - x) * (1 - 3 * x);
        const g: AutoMovieLoftFrame.IFrame = AutoMovieLoftChain.frame(
          child,
          layer.y,
        );
        const moved: number[] = AutoMovieSplineCurve.project(
          spread.map((d: Vec3): [number, number] => [
            lean * dot(d, g.u),
            lean * dot(d, g.v),
          ]),
          N,
        );
        const turned: number[] = AutoMovieSplineCurve.project(
          spread.map((d: Vec3): [number, number] => [
            rate * dot(d, g.u),
            rate * dot(d, g.v),
          ]),
          N,
        );
        layers[j] = {
          ...layer,
          coefficients: layer.coefficients.map(
            (v: number, i: number): number => v + moved[i]!,
          ),
          slopes: layer.slopes.map(
            (v: number, i: number): number => v + turned[i]!,
          ),
        };
      },
    );
    return { ...child, layers };
  }
}
