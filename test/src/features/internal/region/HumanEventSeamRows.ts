import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanSagitta } from "./HumanSagitta";

type V3 = HumanAnatomy.V3;
type IRow = HumanAnatomyAudit.IRow;

/**
 * Readings across a declared event seam of the composed body: a parent
 * chain's end ring split into its children's adjacent end rings
 * (`IAutoMovieHumanBodyCalibration.IEvent`). At every parent phase inside a
 * child's arcs the reader takes the parent's point on its contact ring, the
 * nearest point of the child's adjacent end ring, and on each side the
 * surface's meridian running away from the seam, and reads the three things
 * a seam shows at a glance:
 *
 * - the gap between the two sides' points (a crack or a step in radius);
 * - the angle between the two sides' surface normals (a kink: the stepped
 *   collar, the flared disc, a shoulder seam);
 * - the sagitta of the meridian through the seam over a 10 mm chord (a crease
 *   or a flare within a few millimetres of the seam).
 *
 * The child's point is found by position, not by phase, so the reading is
 * independent of either chain's phase rule. Normals are the cross product of
 * the ring's phase tangent and the meridian's tangent, oriented away from the
 * ring's centroid. Derivatives are one-sided second-order differences at a
 * 0.5 mm step along the meridian.
 */
export namespace HumanEventSeamRows {
  /** One side of a seam: a chain's stations and its ring evaluator, calibration mm. */
  export interface ISide {
    /** Chain name. */
    name: string;

    /** First station. */
    first: number;

    /** Last station. */
    last: number;

    /** Ring of world points at a station and phases. */
    ring: (station: number, phases: readonly number[]) => V3[];
  }

  /** A declared seam. */
  export interface ISeam {
    /** Name in findings. */
    label: string;

    /** The parent, whose end ring is the contact. */
    parent: ISide;

    /** The child, one of whose end rings is the parent's arcs. */
    child: ISide;

    /** `down`: the contact is the parent's first station; `up`: its last. */
    direction: "down" | "up";

    /** Parent-phase arcs of the child, radians, wrapping through 2 pi when `to < from`. */
    arcs: [number, number][];

    /** Whether the lowest quarter of the seam is the axillary hollow, a named fold (FLD-1), left out of the crease reading. */
    axilla: boolean;
  }

  /** Largest gap, input mm: the catalog's G0 limit for every event seam (SEAM-1 to SEAM-4). */
  export const GAP: number = 1;

  /** Largest normal angle, degrees: the class A surfacing limit the catalog's SEAM rows read for G1 and G2 seams. */
  export const ANGLE: number = 0.1;

  /** Parent phases read per arc. */
  const SAMPLES: number = 48;

  /** Phases of the child's dense end ring for the nearest point: 0.3 mm apart on a 400 mm ring. */
  const DENSE: readonly number[] = Array.from({ length: 1440 }, (_: unknown, i: number): number => (2 * Math.PI * i) / 1440);

  /**
   * The seams a body declares from given parents to children whose names
   * match, each child's side the delivered chain.
   *
   * @param body The composed body.
   * @param parents Parent chain names.
   * @param children Child chain names to read.
   * @param axilla Children whose seam's lowest quarter is the axillary hollow.
   */
  export function declared(body: IAutoMovieHumanBodyCalibration, parents: readonly string[], children: RegExp, axilla: RegExp): ISeam[] {
    const side: (name: string) => ISide = (name: string): ISide => {
      const c: IAutoMovieHumanLoftChain | undefined = body.chains.find((x: IAutoMovieHumanLoftChain): boolean => x.name === name);
      if (c === undefined) throw new Error(`the body has no chain named ${name}`);
      return {
        name,
        first: c.layers[0]!.y,
        last: c.layers[c.layers.length - 1]!.y,
        ring: (s: number, phases: readonly number[]): V3[] => AutoMovieHumanLoftChain.ring(c, s, [...phases]) as V3[],
      };
    };
    const out: ISeam[] = [];
    for (const e of body.events) {
      if (!parents.includes(e.parent)) continue;
      for (const split of e.splits) {
        if (!children.test(split.child)) continue;
        out.push({
          label: `${e.parent} ${e.direction} to ${split.child}`,
          parent: side(e.parent),
          child: side(split.child),
          direction: e.direction,
          arcs: split.arcs,
          axilla: axilla.test(split.child),
        });
      }
    }
    return out;
  }

  /**
   * The rows of one seam: its worst gap, normal angle and crease.
   *
   * @param person Name in findings.
   * @param seam The seam.
   * @param k Input mm per calibration mm.
   */
  export function rows(person: string, seam: ISeam, k: number): IRow[] {
    const h: number = 0.5 / k;
    const p: ISide = seam.parent;
    const c: ISide = seam.child;
    const sP: number = seam.direction === "down" ? p.first : p.last;
    const dP: number = seam.direction === "down" ? 1 : -1;
    const parentRing: V3[] = p.ring(sP, DENSE);

    // The child's adjacent end is the one whose ring lies on the parent's.
    const near: (s: number) => number = (s: number): number => {
      const r: V3[] = c.ring(s, DENSE.filter((_: number, i: number): boolean => i % 30 === 0));
      return r.reduce((sum: number, q: V3): number => sum + nearest(parentRing, q).distance, 0);
    };
    const firstEnd: boolean = near(c.first) <= near(c.last);
    const sC: number = firstEnd ? c.first : c.last;
    const dC: number = firstEnd ? 1 : -1;
    const childRing: V3[] = c.ring(sC, DENSE);
    const parentCentre: V3 = centroid(parentRing);
    const childCentre: V3 = centroid(childRing);
    const reach: number = Math.min(10 / k, Math.abs(p.last - p.first) / 2, Math.abs(c.last - c.first) / 2);

    // Parent phases inside each arc, clear of the pinches at its ends.
    const phases: number[] = [];
    for (const [from, to] of seam.arcs) {
      const length: number = to >= from ? to - from : to + 2 * Math.PI - from;
      for (let i: number = 0; i < SAMPLES; i++) phases.push((from + length * (0.03 + (0.94 * i) / (SAMPLES - 1))) % (2 * Math.PI));
    }
    const points: V3[] = p.ring(sP, phases);
    const low: number = Math.min(...points.map((q: V3): number => q[1]));
    const high: number = Math.max(...points.map((q: V3): number => q[1]));

    let gap: [number, string] = [0, ""];
    let angle: [number, string] = [0, ""];
    let crease: [number, string] = [0, ""];
    phases.forEach((psi: number, i: number): void => {
      const pp: V3 = points[i]!;
      const found: { index: number; distance: number } = nearest(childRing, pp);
      const phi: number = DENSE[found.index]!;
      const where: string = `parent phase ${((psi * 180) / Math.PI).toFixed(0)} deg at [${pp.map((v: number): string => (v * k).toFixed(0)).join(", ")}]`;
      if (found.distance * k > gap[0]) gap = [found.distance * k, where];

      // Meridians away from the seam on each side.
      const pm: V3[] = [0, 1, 2].map((j: number): V3 => p.ring(sP + dP * j * h, [psi])[0]!);
      const cm: V3[] = [0, 1, 2].map((j: number): V3 => c.ring(sC + dC * j * h, [phi])[0]!);
      const tp: V3 = derivative(pm, h);
      const tc: V3 = derivative(cm, h);
      const np: V3 = oriented(HumanAnatomy.cross(phaseTangent(p, sP, psi), tp), HumanAnatomy.sub(pp, parentCentre));
      const nc: V3 = oriented(HumanAnatomy.cross(phaseTangent(c, sC, phi), tc), HumanAnatomy.sub(cm[0]!, childCentre));
      const a: number = (Math.acos(Math.max(-1, Math.min(1, HumanAnatomy.dot(np, nc)))) * 180) / Math.PI;
      if (a > angle[0]) angle = [a, where];

      // The meridian through the seam, 10 mm each side, read for a crease.
      if (seam.axilla && pp[1] < low + 0.25 * (high - low)) return;
      const line: V3[] = [];
      for (let s: number = reach; s > 1e-9; s -= h) line.push(p.ring(sP + dP * s, [psi])[0]!);
      line.push(pp);
      for (let s: number = h; s <= reach + 1e-9; s += h) line.push(c.ring(sC + dC * s, [phi])[0]!);
      const normal: V3 = HumanAnatomy.unit(HumanAnatomy.add(np, nc));
      const readings: HumanSagitta.IReading[] = HumanSagitta.along(line, 5 / k, h, (): V3 => normal);
      const seamArc: number = HumanSagitta.resample(line.slice(0, Math.round(reach / h) + 1), h).length * h;
      for (const r of readings) if (Math.abs(r.arc - seamArc) <= 3 / k && Math.abs(r.value * k) > Math.abs(crease[0])) crease = [r.value * k, where];
    });

    const row: (site: string, value: number, lowLimit: number, highLimit: number, unit: string) => IRow = (site: string, value: number, lowLimit: number, highLimit: number, unit: string): IRow => ({ person, site: `seam ${seam.label}: ${site}`, value, low: lowLimit, high: highLimit, unit });
    return [
      row(`largest gap between the two sides, ${gap[1]}`, gap[0], 0, GAP, "mm"),
      row(`largest angle between the two sides' normals, ${angle[1]}`, angle[0], 0, ANGLE, "deg"),
      row(`largest sagitta of the meridian across the seam over a 10 mm chord, ${crease[1]}`, crease[0], -HumanAnatomyShared.CREASE, HumanAnatomyShared.CREASE, "mm"),
    ];
  }

  /** The nearest point of a dense ring. */
  function nearest(ring: readonly V3[], q: V3): { index: number; distance: number } {
    let index: number = 0;
    let distance: number = Infinity;
    ring.forEach((r: V3, i: number): void => {
      const d: number = HumanAnatomy.dist(r, q);
      if (d < distance) {
        distance = d;
        index = i;
      }
    });
    return { index, distance };
  }

  /** Mean of points. */
  function centroid(points: readonly V3[]): V3 {
    const c: V3 = [0, 0, 0];
    for (const q of points) for (let j: number = 0; j < 3; j++) c[j]! += q[j]! / points.length;
    return c;
  }

  /** One-sided second-order first derivative from points at 0, h and 2h. */
  function derivative(m: readonly V3[], h: number): V3 {
    return HumanAnatomy.scale(HumanAnatomy.add(HumanAnatomy.add(HumanAnatomy.scale(m[0]!, -3), HumanAnatomy.scale(m[1]!, 4)), HumanAnatomy.scale(m[2]!, -1)), 1 / (2 * h));
  }

  /** The ring's tangent in phase at a point, by a central difference of a thousandth of a turn. */
  function phaseTangent(side: ISide, s: number, phase: number): V3 {
    const d: number = (2 * Math.PI) / 1000;
    const [a, b]: V3[] = side.ring(s, [phase - d, phase + d]);
    return HumanAnatomy.sub(b!, a!);
  }

  /** A unit normal turned to face along a reference direction. */
  function oriented(n: V3, reference: V3): V3 {
    const u: V3 = HumanAnatomy.unit(n);
    return HumanAnatomy.dot(u, reference) < 0 ? HumanAnatomy.scale(u, -1) : u;
  }
}
