import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Position and tangent-plane continuity across branch events.
 *
 * At an event the child's mesh inherits the parent's contact ring, while
 * the child's own end layer is evaluated from its coefficients. The fitter
 * makes the two agree, but the shape law maps parent and child through
 * their own morph displacements and warp maps, which differ at the ring:
 * measured on m1 the child's end ring lay 0.2 mm (median) and 0.8 mm (90th
 * percentile) off the parent's ring at 1502 mm, and up to 2.8 mm at the
 * eye-height ring. The mesh closes that gap inside the child's first band,
 * which shades as a line round the face. The first rule moves the child's
 * end ring onto the parent's: each end point goes to the nearest point of
 * the parent's ring, and the move fades out over the child's layers within
 * {@link REACH} mm of the ring (at least two layers), with the station
 * slopes the fade implies, so the child closes the gap over a few
 * millimetres instead of one band. Points off the parent's arcs (the bridge
 * across a pinch) and farther than {@link SNAP} mm from the parent's ring
 * keep their place.
 *
 * Each chain's end layer also carries its own fitted station slopes. Where those slopes put the child's surface at
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
 * and the out-of-plane station advance are kept. The changes at four
 * uniform phases per control point are projected on the child's own
 * spline by plain least squares and added to the end layer's slopes; the
 * layer's coefficients, and so every shared position, are unchanged. A
 * smoothing cutoff of N/8 cycles left the worst creases almost as they
 * were, since they are a few control points wide.
 *
 * Measured after this rule, the 90th-percentile crease fell from 1.3 to
 * 0.6 degrees at the 1543.2 mm ring and from 4.3 to 3.2 degrees at the
 * 1595.5 mm ring; the points beside the canthus stay near 20 degrees
 * because there the skin lies almost in the section plane, where an
 * in-plane slope cannot turn it (the `|N . m|` guard below).
 *
 * Only points on the parent's surface are constrained: the bridge a child
 * section draws across a pinch has no parent surface, so the change fades
 * to zero over the last 6 mm of arc before each pinch phase, and fades out
 * past 0.5 mm from the parent ring and as `|N . m|` falls to 0.3 (the plane
 * almost tangent to the parent).
 *
 * An end slope acts across the child's whole last interval, a cubic Hermite
 * span. A slope m past the span's secant over a span h stands `4/27 m h` off the
 * chord, so a long span turning sharply to reach the parent's tangent trades a
 * crease across the seam for a lump beside it. At the crotch, where the trunk
 * opens at 60 degrees from a thigh that arrives upright, that lump stood 7 mm
 * off the thigh. The change therefore stops at {@link BULGE}; a short span may
 * turn as sharply as its parent asks.
 *
 * Turned inside one span, the tangent planes agree at the ring and nowhere
 * else: the skin's normals part again by 5 to 8 degrees 4 mm either side of the
 * armpit joint and 20 to 30 degrees round the arm's root, which shades as a line
 * across the back and notches the outline. An event with a fillet therefore
 * spreads the turn over the child's layers within that many radii of its end
 * ring: the cubic `m s (1 - s / R)^2` leaves the ring with slope m and meets the
 * layer at R with neither place nor slope, standing the same `4/27 m R` off at
 * most, so {@link BULGE} bounds it too. What the bound leaves stays in the end
 * span.
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
          join(parent, child, event.direction, split.arcs, event.fillet ?? 0),
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

/** Station reach over which the child's end-ring move fades out, mm. */
const REACH: number = 4;

/** Largest end-ring gap closed, mm; a farther point is not on the parent. */
const SNAP: number = 3;

/** Distance past 0.5 mm over which a point leaves the parent's surface, mm. */
const FAR: number = 1;

/** Rise of `|N . m|` past 0.3 over which a point comes to take the slope. */
const FACING: number = 0.2;

/** Largest lump an end slope may raise off its span's chord, mm. */
const BULGE: number = 4;

/** Child chain moved onto the parent's ring and re-sloped. */
function join(
  parent: IAutoMovieHumanLoftChain,
  child: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
  arcs: [number, number][],
  fillet: number,
): IAutoMovieHumanLoftChain {
  if (child.basis !== "spline") return child;
  const ring: IRing = parentRing(parent, direction, arcs);
  return slope(parent, ring, place(ring, child, direction), direction, fillet);
}

/** Dense parent ring at an event and the arc weight of a phase on it. */
interface IRing {
  sp: number;
  points: Vec3[];

  /** Length along the ring up to each sample, one more entry than the samples. */
  length: number[];
  weight: (t: number) => number;
}

/** Samples of the dense parent ring. */
const RING: number = 2048;

/** The parent's ring at an event and the weight of its phases on the child's arcs. */
function parentRing(
  parent: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
  arcs: [number, number][],
): IRing {
  const last: number = parent.layers.length - 1;
  const sp: number =
    direction === "down" ? parent.layers[0]!.y : parent.layers[last]!.y;
  const n: number = RING;
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
  return { sp, points: ring, length, weight };
}

/** Nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, and the distance. */
function nearest(ring: IRing, p: Vec3): [number, Vec3, number] {
  const n: number = ring.points.length;
  let best: number = 0;
  let distance: number = Infinity;
  let bound: number = Infinity;
  for (let j: number = 0; j < n; ) {
    const q: Vec3 = ring.points[j]!;
    const x: number = q[0] - p[0];
    const y: number = q[1] - p[1];
    const z: number = q[2] - p[2];

    // Only a sample that can beat the best pays for the exact length.
    const square: number = x * x + y * y + z * z;
    if (!(square > bound)) {
      const d: number = Math.hypot(x, y, z);
      if (d < distance) {
        distance = d;
        best = j;
        bound = square * (1 + 1e-9);
      }
    }

    // A sample closes on p by no more than the ring's length to it, so those
    // too near along the ring to come within the bound are passed over.
    const reach: number =
      ring.length[j]! + Math.sqrt(square) - Math.sqrt(bound) - 1e-6;
    let low: number = j + 1;
    let high: number = n;
    while (low < high) {
      const middle: number = (low + high) >> 1;
      if (ring.length[middle]! < reach) low = middle + 1;
      else high = middle;
    }
    j = low;
  }
  // Refine on the two segments beside the nearest sample.
  let point: Vec3 = ring.points[best]!;
  for (const other of [(best + n - 1) % n, (best + 1) % n]) {
    const a: Vec3 = ring.points[best]!;
    const d: Vec3 = sub(ring.points[other]!, a);
    const u: number = Math.max(
      0,
      Math.min(1, dot(sub(p, a), d) / Math.max(1e-12, dot(d, d))),
    );
    const q: Vec3 = add(a, scale(d, u));
    const e: number = norm(sub(q, p));
    if (e < distance) {
      distance = e;
      point = q;
    }
  }
  return [(2 * Math.PI * best) / n, point, distance];
}

/** Child chain with its end ring moved onto the parent's, faded over its first layers. */
function place(
  ring: IRing,
  child: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
): IAutoMovieHumanLoftChain {
  const k: number = direction === "down" ? child.layers.length - 1 : 0;
  const step: number = direction === "down" ? -1 : 1;
  const sc: number = child.layers[k]!.y;
  const N: number = child.order;
  const Q: number = 4 * N;
  const phases: number[] = Array.from(
    { length: Q },
    (_: unknown, i: number): number => (2 * Math.PI * i) / Q,
  );

  // World move of every end point; zero off the arcs or off the ring.
  const moves: Vec3[] = AutoMovieHumanLoftChain.ring(child, sc, phases).map(
    (p: Vec3): Vec3 => {
      const [tau, q, distance] = nearest(ring, p);
      const w: number = distance <= SNAP ? ring.weight(tau) : 0;
      return scale(sub(q, p), w);
    },
  );
  if (moves.every((m: Vec3): boolean => norm(m) < 1e-6)) return child;

  // Fade over the layers within the reach, at least two besides the end.
  const second: number = k + 2 * step;
  const reach: number = Math.max(
    REACH,
    second >= 0 && second < child.layers.length
      ? 1.5 * Math.abs(child.layers[second]!.y - sc)
      : 0,
  );
  const layers: IAutoMovieHumanLoftChain.ILayer[] = child.layers.map(
    (
      layer: IAutoMovieHumanLoftChain.ILayer,
      j: number,
    ): IAutoMovieHumanLoftChain.ILayer => {
      const sigma: number = Math.abs(layer.y - sc);
      if (sigma >= reach) return layer;
      // Fade f(sigma) = 1 - smooth(sigma / reach) and its station derivative,
      // sigma growing into the child.
      const x: number = sigma / reach;
      const fade: number = 1 - smooth(x);
      const rate: number = (-6 * x * (1 - x) * step) / reach;
      const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
        child,
        layer.y,
      );
      const values: [number, number][] = moves.map(
        (m: Vec3): [number, number] => [fade * dot(m, f.u), fade * dot(m, f.v)],
      );
      const slopes: [number, number][] = moves.map(
        (m: Vec3): [number, number] => [rate * dot(m, f.u), rate * dot(m, f.v)],
      );
      const dc: number[] = AutoMovieHumanSplineCurve.project(values, N);
      const dm: number[] = AutoMovieHumanSplineCurve.project(slopes, N);

      // The law lifts sections off their planes, so part of a gap lies
      // along the frame normal and moves the lift instead.
      const normal: Vec3 = cross(f.v, f.u);
      const across: number[] = moves.map((m: Vec3): number => dot(m, normal));
      const lifted: boolean =
        layer.lift !== undefined ||
        across.some((v: number): boolean => Math.abs(v) > 1e-3);
      const dl: number[] = lifted
        ? AutoMovieHumanSplineCurve.project(
            across.map((v: number): [number, number] => [fade * v, fade * v]),
            N,
          ).slice(0, N)
        : [];
      const dr: number[] = lifted
        ? AutoMovieHumanSplineCurve.project(
            across.map((v: number): [number, number] => [rate * v, rate * v]),
            N,
          ).slice(0, N)
        : [];
      const lift: number[] = layer.lift ?? new Array<number>(N).fill(0);
      const liftSlopes: number[] =
        layer.liftSlopes ?? new Array<number>(N).fill(0);
      return {
        ...layer,
        coefficients: layer.coefficients.map(
          (v: number, i: number): number => v + dc[i]!,
        ),
        slopes:
          j === k
            ? layer.slopes
            : layer.slopes.map((v: number, i: number): number => v + dm[i]!),
        ...(lifted
          ? {
              lift: lift.map((v: number, i: number): number => v + dl[i]!),
              liftSlopes:
                j === k
                  ? liftSlopes
                  : liftSlopes.map(
                      (v: number, i: number): number => v + dr[i]!,
                    ),
            }
          : {}),
      };
    },
  );
  return { ...child, layers };
}

/** Child chain with its end layer at the event re-sloped. */
function slope(
  parent: IAutoMovieHumanLoftChain,
  ring: IRing,
  child: IAutoMovieHumanLoftChain,
  direction: "down" | "up",
  fillet: number,
): IAutoMovieHumanLoftChain {
  const sp: number = ring.sp;
  const k: number = direction === "down" ? child.layers.length - 1 : 0;
  const sc: number = child.layers[k]!.y;

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
  const previous: number = child.layers[k + inward]!.y;
  const inner: Vec3[] = AutoMovieHumanLoftChain.ring(
    child,
    previous,
    Array.from(
      { length: Q },
      (_: unknown, i: number): number => (2 * Math.PI * i) / Q,
    ),
  );
  const onParent: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(
    parent,
    sp,
  );
  const insideParent: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(
    parent,
    sp - inward * h,
  );
  const onChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(
    child,
    sc,
  );
  const insideChild: (t: number) => Vec3 = AutoMovieHumanLoftChain.sampler(
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
  for (let i: number = 0; i < Q; i++) {
    const t: number = (2 * Math.PI * i) / Q;
    const s: [number, number, number, number] = AutoMovieHumanLoftChain.section(
      child,
      c,
      t,
    );
    const p: Vec3 = onChild(t);

    // Nearest parent sample, then the parent's jets there.
    const [tau, , distance] = nearest(ring, p);
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
        Math.min(secant + turn, own + (facing * w * dot(N3, sub(Dp, Dc))) / nm),
      ) - own;
    const delta: Vec3 = scale(m, inward * alpha);
    samples.push([dot(delta, f.u), dot(delta, f.v)]);
    spread.push(scale(m, Math.max(-most, Math.min(most, alpha))));
  }
  const change: number[] = AutoMovieHumanSplineCurve.project(samples, N);

  const layers: IAutoMovieHumanLoftChain.ILayer[] = [...child.layers];
  layers[k] = {
    ...layers[k]!,
    slopes: layers[k]!.slopes.map(
      (v: number, i: number): number => v + change[i]!,
    ),
  };
  child.layers.forEach(
    (layer: IAutoMovieHumanLoftChain.ILayer, j: number): void => {
      const sigma: number = Math.abs(layer.y - sc);
      if (j === k || sigma >= reach) return;
      const x: number = sigma / reach;
      const lean: number = sigma * (1 - x) ** 2;
      const rate: number = inward * (1 - x) * (1 - 3 * x);
      const g: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(
        child,
        layer.y,
      );
      const moved: number[] = AutoMovieHumanSplineCurve.project(
        spread.map((d: Vec3): [number, number] => [
          lean * dot(d, g.u),
          lean * dot(d, g.v),
        ]),
        N,
      );
      const turned: number[] = AutoMovieHumanSplineCurve.project(
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
