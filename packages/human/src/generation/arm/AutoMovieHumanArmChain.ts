import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftParameter } from "../../lofting/AutoMovieHumanLoftParameter";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";
import type { AutoMovieHumanArmRootStrip } from "./AutoMovieHumanArmRootStrip";

/**
 * The arm's chain `arm.{side}`: its layers from the hand's heel up through the
 * forearm and upper arm to the root strip and the trunk's ring, each in its
 * own plane with its frame carried down from the ring by least rotation.
 *
 * A layer's section is either the tube's own section assembled from its
 * guides and sectors (`AutoMovieHumanSeamKnot.assemble`, given here as its
 * control points), where the plane is square to the walk, or the ring the
 * plane cuts from the tube, the heel or the root strip, read by the
 * section's spline interpolation. Every station derivative is the generating
 * surface's own: first and second differences of that surface a twentieth of
 * a millimetre either side, so each interval of the arm's own layers is the
 * quintic Hermite of the surface's jets, C2 along the chain; the hand's heel
 * layers carry slopes only, as the hand builds them. The right side is the
 * left's mirror, its phase reversed.
 */
export namespace AutoMovieHumanArmChain {
  /** What the chain reads. */
  export interface ILaw {
    /** Parameters of the heel's and tube's layers from the bottom. */
    layers: number[];

    /** Whether a layer's parameter is the arm's own (its jets are C2). */
    own(q: number): boolean;

    /** Normal of the plane at a parameter, toward the shoulder. */
    normal(q: number): Vec3;

    /** A point the plane passes through. */
    anchor(q: number): Vec3;

    /** Ring of the plane at a parameter, one point per control point. */
    ring(q: number): Vec3[];

    /** World control points of the tube's own section where the plane is square to the walk; null elsewhere. */
    controls(q: number): Vec3[] | null;

    /** The root strip above the last tube layer. */
    root: AutoMovieHumanArmRootStrip.IStrip;

    /** Cross parameters of the strip's layers, from below the tube's last layer up to the ring (0). */
    rootLayers: number[];

    /** Cross-parameter step of the strip's derivatives. */
    rootStep: number;
  }

  /** The chain's sampling. */
  export interface ISampling {
    /** Control points of a section. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: AutoMovieHumanLoftParameter.Rule;
  }

  /** The chain of one side. */
  export function of(law: ILaw, side: "left" | "right", sign: 1 | -1, sampling: ISampling): IAutoMovieHumanLoftChain {
    const order: number = sampling.order;
    type Slot = { kind: "tube"; q: number } | { kind: "root"; w: number };
    const slots: Slot[] = [
      ...law.layers.map((q: number): Slot => ({ kind: "tube", q })),
      ...law.rootLayers.map((w: number): Slot => ({ kind: "root", w })),
    ];

    // The in-plane axis carried down from the level ring: through the strip,
    // then down the tube.
    const rootGrid: { w: number; n: Vec3; u: Vec3 }[] = [{ w: 0, n: law.root.normal(0), u: [1, 0, 0] }];
    for (let w: number = ROOT_CARRY; w <= 1 + 1e-9; w += ROOT_CARRY) {
      const last = rootGrid[rootGrid.length - 1]!;
      const n: Vec3 = law.root.normal(Math.min(1, w));
      rootGrid.push({ w: Math.min(1, w), n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const top: number = law.layers[law.layers.length - 1]!;
    const bottom: number = law.layers[0]!;
    const seed = rootGrid[rootGrid.length - 1]!;
    const tubeGrid: { q: number; n: Vec3; u: Vec3 }[] = [
      { q: top, n: law.normal(top), u: AutoMovieHumanLimbFrame.carry(seed.u, seed.n, law.normal(top)) },
    ];
    for (let q: number = top - CARRY; q > bottom - 2 * CARRY; q -= CARRY) {
      const last = tubeGrid[tubeGrid.length - 1]!;
      const n: Vec3 = law.normal(q);
      tubeGrid.push({ q, n, u: AutoMovieHumanLimbFrame.carry(last.u, last.n, n) });
    }
    const axisOfTube = (q: number, n: Vec3): Vec3 => {
      const i: number = Math.min(tubeGrid.length - 1, Math.max(0, Math.round((top - q) / CARRY)));
      const g = tubeGrid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, n);
    };
    const axisOfRoot = (w: number, n: Vec3): Vec3 => {
      const i: number = Math.min(rootGrid.length - 1, Math.max(0, Math.round(w / ROOT_CARRY)));
      const g = rootGrid[i]!;
      return AutoMovieHumanLimbFrame.carry(g.u, g.n, n);
    };

    // A slot's section moved by a step up the chain (positive toward the ring).
    interface ISection {
      frame: AutoMovieHumanLoftFrame.IFrame;
      coefficients: number[];
      lift: number[];
    }
    const section = (slot: Slot, step: number): ISection => {
      if (slot.kind === "root") {
        const w: number = Math.max(0, slot.w - step * law.rootStep);
        const n: Vec3 = law.root.normal(w);
        const ring: Vec3[] = law.root.ring(w);
        const c: Vec3 = centroid(ring);
        return local(ring, AutoMovieHumanLimbFrame.frame(c, n, axisOfRoot(w, n)), false);
      }
      const q: number = slot.q + step * SLOPE_STEP;
      const n: Vec3 = law.normal(q);
      const controls: Vec3[] | null = law.controls(q);
      const points: Vec3[] = controls ?? law.ring(q);
      const c: Vec3 = centroid(points);
      const o: Vec3 = sub(c, scale(n, dot(sub(c, law.anchor(q)), n)));
      return local(points, AutoMovieHumanLimbFrame.frame(o, n, axisOfTube(q, n)), controls !== null);
    };

    // A section's coefficients in its frame, from its world ring or control points.
    const local = (points: Vec3[], frame: AutoMovieHumanLoftFrame.IFrame, direct: boolean): ISection => {
      const sided: Vec3[] = reflect(points, sign);
      const f: AutoMovieHumanLoftFrame.IFrame = sign === 1 ? frame : AutoMovieHumanLimbFrame.mirror(frame);
      if (!direct) {
        const c = AutoMovieHumanLimbFrame.controls({ station: 0, frame: f, ring: sided }, order);
        return { frame: f, coefficients: c.coefficients, lift: c.lift };
      }
      const n: Vec3 = AutoMovieHumanLimbFrame.normal(f);
      const d: Vec3[] = sided.map((p: Vec3): Vec3 => sub(p, f.origin));
      return {
        frame: f,
        coefficients: [...d.map((p: Vec3): number => dot(p, f.u)), ...d.map((p: Vec3): number => dot(p, f.v))],
        lift: d.map((p: Vec3): number => dot(p, n)),
      };
    };

    const here: ISection[] = slots.map((s: Slot): ISection => section(s, 0));
    const stations: number[] = [0];
    for (let k: number = 1; k < here.length; k++)
      stations.push(stations[k - 1]! + norm(sub(here[k]!.frame.origin, here[k - 1]!.frame.origin)));
    const layers: IAutoMovieHumanLoftChain.ILayer[] = slots.map((slot: Slot, k: number): IAutoMovieHumanLoftChain.ILayer => {
      const h: ISection = here[k]!;
      const topmost: boolean = slot.kind === "root" && slot.w <= 0;
      const a: ISection = topmost ? h : section(slot, 1);
      const b: ISection = section(slot, -1);
      const ha: number = topmost ? 0 : norm(sub(a.frame.origin, h.frame.origin));
      const hb: number = norm(sub(h.frame.origin, b.frame.origin));
      const span: number = ha + hb;
      const slope = (lo: readonly number[], hi: readonly number[]): number[] =>
        lo.map((v: number, i: number): number => (hi[i]! - v) / span);
      const bend = (lo: readonly number[], mid: readonly number[], hi: readonly number[]): number[] =>
        mid.map((v: number, i: number): number => (2 * ((hi[i]! - v) / ha - (v - lo[i]!) / hb)) / span);
      const frameSlopes: number[] = slope(flat(b.frame), flat(a.frame));
      const jets: boolean = !topmost && (slot.kind === "root" || law.own(slot.q));
      return {
        y: stations[k]!,
        frame: h.frame,
        frameSlopes: unflat(frameSlopes),
        coefficients: h.coefficients,
        slopes: slope(b.coefficients, a.coefficients),
        lift: h.lift,
        liftSlopes: slope(b.lift, a.lift),
        ...(jets
          ? {
              curvatures: bend(b.coefficients, h.coefficients, a.coefficients),
              frameCurvatures: unflat(bend(flat(b.frame), flat(h.frame), flat(a.frame))),
            }
          : {}),
      };
    });
    return {
      name: `arm.${side}`,
      basis: "spline",
      order,
      samples: sampling.samples,
      rule: sampling.rule,
      layers,
    };
  }

  /**
   * A ring of one side from the left frame's: mirrored, its phase reversed so
   * the right side's point at phase t is the mirror of the left's at -t.
   */
  export function reflect(ring: readonly Vec3[], sign: 1 | -1): Vec3[] {
    if (sign === 1) return [...ring];
    const n: number = ring.length;
    return ring.map((_: Vec3, m: number): Vec3 => {
      const p: Vec3 = ring[(n - m) % n]!;
      return [p[0], p[1], -p[2]];
    });
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** Parameter step of the tube's carried frame. */
const CARRY: number = 0.5;

/** Cross-parameter step of the strip's carried frame. */
const ROOT_CARRY: number = 0.01;

/** Parameter step of a layer's derivatives, mm. */
const SLOPE_STEP: number = 0.05;

function flat(f: AutoMovieHumanLoftFrame.IFrame): number[] {
  return [...f.origin, ...f.u, ...f.v];
}

function unflat(x: readonly number[]): AutoMovieHumanLoftFrame.IFrame {
  return { origin: [x[0]!, x[1]!, x[2]!], u: [x[3]!, x[4]!, x[5]!], v: [x[6]!, x[7]!, x[8]!] };
}

function centroid(points: readonly Vec3[]): Vec3 {
  const c: Vec3 = [0, 0, 0];
  for (const p of points) for (let k: number = 0; k < 3; k++) c[k] += p[k]! / points.length;
  return c;
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
