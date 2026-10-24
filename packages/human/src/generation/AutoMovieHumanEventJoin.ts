import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Tangent-plane continuity across branch events.
 *
 * At an event the child inherits the parent's contact ring, so the two
 * surfaces share positions there, but each chain's end layer carries its
 * own fitted station slopes. Where those slopes put the child's surface at
 * an angle to the parent's, the shared ring prints a crease: measured on
 * the f1 calibration it reached 4 degrees at the 90th percentile and 20
 * degrees at worst along the 1595.5 mm head ring (from the outer eye
 * corner to the ear), 12 degrees at the 1543.2 mm ring and 11 degrees at
 * the axillae.
 *
 * The rule makes the child's end derivative lie in the parent's tangent
 * plane. At a child section point p with parent phase tau on an inherited
 * arc, the parent surface normal is `N = dP/dt x dP/ds` and the child's
 * station derivative D_c is moved within the child's section plane along
 * the section's in-plane normal m by
 *
 * ```text
 * alpha = N . (D_p - D_c) / (N . m)
 * ```
 *
 * the smallest in-plane change giving `N . D_c' = N . D_p`. The component
 * along the ring, which carries each chain's own sliding correspondence,
 * and the out-of-plane station advance are kept. The changes at uniform
 * phases are projected on the child's own spline (a P-spline with a
 * cutoff of N/8 cycles) and added to the end layer's slopes; the layer's
 * coefficients, and so every shared position, are unchanged.
 *
 * Only points on the parent's surface are constrained: the bridge a child
 * section draws across a pinch has no parent surface, so the change fades
 * to zero over the last 6 mm of arc before each pinch phase, and points
 * farther than 0.5 mm from the parent ring or where `|N . m| < 0.3` (the
 * plane almost tangent to the parent) are left as fitted.
 */
export namespace AutoMovieHumanEventJoin {
  /**
   * Calibration whose children meet their parents tangent-continuously.
   *
   * @param calibration Merged calibration; not modified.
   * @returns A copy with the children's adjacent end-layer slopes changed.
   */
  export function reconcile(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IAutoMovieHumanBodyCalibration {
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    const replaced: Map<string, IAutoMovieHumanLoftChain> = new Map();
    for (const event of calibration.events) {
      const parent: IAutoMovieHumanLoftChain = chains.get(event.parent)!;
      for (const split of event.splits) {
        const fitted: IAutoMovieHumanLoftChain | undefined = chains.get(
          split.child,
        );
        if (fitted === undefined)
          throw new Error(`Calibration lacks the ${split.child} chain`);
        const child: IAutoMovieHumanLoftChain =
          replaced.get(split.child) ?? fitted;
        replaced.set(
          split.child,
          join(parent, child, event.direction, split.arcs),
        );
      }
    }
    return {
      ...calibration,
      chains: calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          replaced.get(c.name) ?? c,
      ),
    };
  }
}

/** Point or vector in mm. */
type Vec3 = [number, number, number];

/** Fade length before a pinch, mm. */
const TAPER: number = 6;

/** Child chain with its end layer at the event re-sloped. */
function join(
  parent: IAutoMovieHumanLoftChain,
  child: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
  arcs: [number, number][],
): IAutoMovieHumanLoftChain {
  if (child.basis !== "spline") return child;
  const last: number = parent.layers.length - 1;
  const sp: number =
    direction === "down" ? parent.layers[0]!.y : parent.layers[last]!.y;
  const k: number = direction === "down" ? child.layers.length - 1 : 0;
  const sc: number = child.layers[k]!.y;

  // Dense parent ring with cumulative arc length, for projection and for
  // the distance of a phase from the nearest pinch.
  const n: number = 2048;
  const ring: Vec3[] = AutoMovieHumanLoftChain.ring(
    parent,
    sp,
    Array.from(
      { length: n },
      (_: unknown, i: number): number => (2 * Math.PI * i) / n,
    ),
  );
  const length: number[] = [0];
  for (let i: number = 1; i <= n; i++)
    length.push(length[i - 1]! + norm(sub(ring[i % n]!, ring[i - 1]!)));
  const at: (t: number) => number = (t: number): number => {
    const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
    const i: number = Math.floor(u);
    return length[i]! + (u - i) * (length[i + 1]! - length[i]!);
  };
  const perimeter: number = length[n]!;
  const whole: boolean = arcs.some(
    ([a, b]: [number, number]): boolean => b - a >= 2 * Math.PI - 1e-9,
  );

  // Weight of a parent phase: inside one of the arcs, fading near pinches.
  const weight: (t: number) => number = (t: number): number => {
    if (whole) return 1;
    let best: number = 0;
    for (const [a, b] of arcs) {
      const la: number = at(a);
      const span: number = (at(b) - la + perimeter) % perimeter;
      const offset: number = (at(t) - la + perimeter) % perimeter;
      if (offset > span) continue;
      const edge: number = Math.min(offset, span - offset);
      best = Math.max(best, smooth(edge / TAPER));
    }
    return best;
  };

  // In-plane slope changes at uniform child phases, 4 per control point.
  const N: number = child.order;
  const Q: number = 4 * N;
  const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
    child,
    sc,
  );
  const normal: Vec3 = cross(f.v, f.u);
  const c: number[] = AutoMovieHumanLoftChain.coefficients(child, sc);
  const h: number = 0.02;
  const inward: number = direction === "down" ? -1 : 1;
  const samples: [number, number][] = [];
  for (let i: number = 0; i < Q; i++) {
    const t: number = (2 * Math.PI * i) / Q;
    const s: [number, number, number, number] = AutoMovieHumanLoftChain.section(
      child,
      c,
      t,
    );
    const p: Vec3 = AutoMovieHumanLoftChain.ring(child, sc, [t])[0]!;

    // Nearest parent sample, then the parent's jets there.
    let best: number = 0;
    let distance: number = Infinity;
    ring.forEach((q: Vec3, j: number): void => {
      const d: number = norm(sub(q, p));
      if (d < distance) {
        distance = d;
        best = j;
      }
    });
    const tau: number = (2 * Math.PI * best) / n;
    const w: number = distance < 0.5 ? weight(tau) : 0;
    if (w === 0) {
      samples.push([0, 0]);
      continue;
    }
    const P: Vec3 = AutoMovieHumanLoftChain.ring(parent, sp, [tau])[0]!;
    const Tp: Vec3 = sub(
      AutoMovieHumanLoftChain.ring(parent, sp, [tau + 1e-4])[0]!,
      AutoMovieHumanLoftChain.ring(parent, sp, [tau - 1e-4])[0]!,
    );
    const Dp: Vec3 = scale(
      sub(P, AutoMovieHumanLoftChain.ring(parent, sp - inward * h, [tau])[0]!),
      1 / h,
    );
    const Dc: Vec3 = scale(
      sub(AutoMovieHumanLoftChain.ring(child, sc + inward * h, [t])[0]!, p),
      1 / h,
    );
    const N3: Vec3 = unit(cross(Tp, Dp));
    const Tc: Vec3 = add(scale(f.u, s[2]), scale(f.v, s[3]));
    const m: Vec3 = unit(cross(normal, Tc));
    const nm: number = dot(N3, m);
    if (Math.abs(nm) < 0.3) {
      samples.push([0, 0]);
      continue;
    }

    // Child slopes are per unit station in the child's own direction; the
    // two derivatives above both point away from the parent.
    const alpha: number = (w * dot(N3, sub(Dp, Dc))) / nm;
    const delta: Vec3 = scale(m, inward * alpha);
    samples.push([dot(delta, f.u), dot(delta, f.v)]);
  }
  const change: number[] = AutoMovieHumanSplineCurve.project(samples, N);

  const layers: IAutoMovieHumanLoftChain.ILayer[] = [...child.layers];
  layers[k] = {
    ...layers[k]!,
    slopes: layers[k]!.slopes.map(
      (v: number, i: number): number => v + change[i]!,
    ),
  };
  return { ...child, layers };
}

/** Smoothstep on [0, 1], clamped. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** Difference. */
function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Sum. */
function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Scalar multiple. */
function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** Dot product. */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Cross product. */
function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Euclidean length. */
function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** Unit vector. */
function unit(a: Vec3): Vec3 {
  return scale(a, 1 / (norm(a) || 1));
}
