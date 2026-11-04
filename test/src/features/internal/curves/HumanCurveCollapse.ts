import type { IAutoMovieHumanBodyCalibration } from "../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { HumanAnatomy } from "../HumanAnatomy";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanCurveRings } from "./HumanCurveRings";

type V3 = [number, number, number];
type IRow = HumanAnatomyAudit.IRow;

/**
 * Collapsed lofts (the SKIN-COLLAPSE class): a chain whose rings flatten into
 * lenses or shrink to points, and a skin that does not span the rings it was
 * lofted from.
 *
 * Two readings per chain, both in the body's own millimetres:
 *
 * - Rings: every layer of the composed chain and every midpoint between two
 *   layers, at 192 phases, read for finite points and its isoperimetric
 *   quotient `4 pi A / G^2` (area over the taut girth's square, 1 for a
 *   circle, 0 for a flat lens). An ellipse of axis ratio 0.12 reads 0.3;
 *   the flattest section of a body, across the palm, is about a third as
 *   thick as it is broad and reads above 0.6, so a ring under 0.3 is a
 *   collapse. The ears are open shells and are left out; a chain closing on
 *   a pole is read short of its pole station.
 * - Skin: the bind skin's vertices of each chain span, along each world axis,
 *   at least half the extent of that chain's own rings: a surface that
 *   flattens a loft into a sheet loses most of one extent.
 *
 * Both readings are listed in the body's chain order, the order the body law
 * generates them, so the first collapsed chain names where to look.
 */
export namespace HumanCurveCollapse {
  /** Least isoperimetric quotient of a ring: an ellipse of axis ratio 0.12. */
  export const QUOTIENT: number = 0.3;

  /** Least share of a chain's ring extent its skin must span along each axis. */
  export const SPAN: number = 0.5;

  /** Chains read: every chain but the ears' open shells. */
  export const CHAINS: RegExp = /^(?!ear\.)/;

  /** The rings of one chain at every layer and between layers. */
  export function stations(chain: IAutoMovieLoftChain): number[] {
    const out: number[] = [];
    const L: IAutoMovieLoftChain.ILayer[] = chain.layers;
    for (let i: number = 0; i < L.length; i++) {
      out.push(L[i]!.y);
      if (i + 1 < L.length) out.push((L[i]!.y + L[i + 1]!.y) / 2);
    }

    // A pole's own station closes the ring to a point by design.
    if (chain.pole?.end === "top") out.pop();
    if (chain.pole?.end === "bottom") out.shift();
    return out;
  }

  /** The ring rows of every chain of a body: one per chain, its least quotient and where. */
  export function rings(person: string, body: IAutoMovieHumanBodyCalibration): IRow[] {
    return body.chains
      .filter((c: IAutoMovieLoftChain): boolean => CHAINS.test(c.name))
      .flatMap((c: IAutoMovieLoftChain, order: number): IRow[] => [ring(person, c, order), boxed(person, body.stature, c, order)]);
  }

  /** One chain's rings outside the person's standing box: a flung ring fails at the chain, before any skin is lofted. */
  export function boxed(person: string, S: number, c: IAutoMovieLoftChain, order: number): IRow {
    let outside: number = 0;
    let read: number = 0;
    let far: number = 0;
    const layers: number[] = [];
    for (const s of stations(c)) {
      read++;
      let worst: number = 0;
      for (const p of AutoMovieLoftChain.ring(c, s, HumanCurveRings.PHASES) as V3[])
        if (p.every(Number.isFinite)) worst = Math.max(worst, Math.abs(p[0]) - BOX * S, Math.abs(p[2]) - BOX * S, p[1] - (1 + FLOOR) * S, -p[1] - FLOOR * S);
      if (worst > 0) {
        outside++;
        far = Math.max(far, worst);
        layers.push(layerOf(c, s));
      }
    }
    const span: string = layers.length === 0 ? "none" : `layers ${Math.min(...layers)} to ${Math.max(...layers)}, ${far.toFixed(0)} mm past the box at most`;
    return { person, site: `#${order} ${c.name} rings outside the standing box (|x|, |z| within ${BOX} S, height within ${FLOOR} S of the floor and the crown), of ${read} read: ${span} (SKIN-COLLAPSE)`, value: outside, low: 0, high: 0, unit: "rings" };
  }

  /** One chain's ring row: its least isoperimetric quotient, where, and how many rings fall under the floor. */
  function ring(person: string, c: IAutoMovieLoftChain, order: number): IRow {
    let least: number = Infinity;
    let at: number = NaN;
    let k: number = -1;
    let flat: number = 0;
    let read: number = 0;
    const layers: number[] = [];
    for (const s of stations(c)) {
      const points: V3[] = AutoMovieLoftChain.ring(c, s, HumanCurveRings.PHASES) as V3[];
      const q: number = points.every((p: V3): boolean => p.every(Number.isFinite)) ? quotient(points) : NaN;
      read++;
      if (!(q >= QUOTIENT)) {
        flat++;
        layers.push(layerOf(c, s));
      }
      if (!(q >= least)) {
        least = q;
        at = s;
        k = layerOf(c, s);
      }
      if (Number.isNaN(q)) break;
    }
    const span: string = layers.length === 0 ? "none" : `layers ${Math.min(...layers)} to ${Math.max(...layers)}`;
    return {
      person,
      site: `#${order} ${c.name}/${k} ring at station ${at.toFixed(1)}: least isoperimetric quotient 4 pi A / G^2; ${flat} of ${read} rings under ${QUOTIENT}, ${span} (SKIN-COLLAPSE)`,
      value: least,
      low: QUOTIENT,
      high: 1 + 1e-6,
      unit: "",
    };
  }

  /** The skin rows of every chain of a body: one per chain and axis, the skin's extent over its rings'. */
  export function skins(person: string, body: IAutoMovieHumanBodyCalibration, skin: HumanAnatomy.ISkin): IRow[] {
    const out: IRow[] = [];
    const boxes: Map<string, [V3, V3]> = new Map();
    for (let t: number = 0; t < skin.tri.length; t++) {
      const chain: string | undefined = skin.chains[skin.tri[t]!];
      if (chain === undefined) continue;
      for (let j: number = 0; j < 3; j++) {
        const v: number = skin.I[3 * t + j]!;
        grow(boxes, chain, [skin.P[3 * v]!, skin.P[3 * v + 1]!, skin.P[3 * v + 2]!]);
      }
    }
    body.chains
      .filter((c: IAutoMovieLoftChain): boolean => CHAINS.test(c.name))
      .forEach((c: IAutoMovieLoftChain, order: number): void => {
        const own: Map<string, [V3, V3]> = new Map();
        for (const s of stations(c)) for (const p of AutoMovieLoftChain.ring(c, s, HumanCurveRings.PHASES) as V3[]) if (p.every(Number.isFinite)) grow(own, c.name, p);
        const ring: [V3, V3] | undefined = own.get(c.name);
        const mesh: [V3, V3] | undefined = boxes.get(c.name);
        for (let axis: number = 0; axis < 3; axis++) {
          const want: number = ring === undefined ? NaN : ring[1][axis]! - ring[0][axis]!;
          const got: number = mesh === undefined ? 0 : mesh[1][axis]! - mesh[0][axis]!;
          out.push({
            person,
            site: `#${order} ${c.name} skin extent along ${"XYZ"[axis]} against its rings' extent ${want.toFixed(1)} mm, mm (SKIN-COLLAPSE)`,
            value: got,
            low: SPAN * want,
            high: want + REACH * body.stature,
            unit: "mm",
          });
        }
      });

    // Every vertex finite and inside the person's own standing box.
    let bad: number = 0;
    let outside: number = 0;
    let far: number = 0;
    const S: number = body.stature;
    for (let v: number = 0; 3 * v + 2 < skin.P.length; v++) {
      const p: V3 = [skin.P[3 * v]!, skin.P[3 * v + 1]!, skin.P[3 * v + 2]!];
      if (!p.every(Number.isFinite)) {
        bad++;
        continue;
      }
      const d: number = Math.max(Math.abs(p[0]) / (BOX * S), Math.abs(p[2]) / (BOX * S), (p[1] - S) / (FLOOR * S), -p[1] / (FLOOR * S));
      if (d > 1) {
        outside++;
        far = Math.max(far, Math.max(Math.abs(p[0]), Math.abs(p[2]), p[1] - S, -p[1]));
      }
    }
    out.push({ person, site: "bind skin: non-finite coordinates (SKIN-COLLAPSE)", value: bad, low: 0, high: 0, unit: "coordinates" });
    out.push({ person, site: `bind skin: vertices outside the standing box (|x|, |z| within ${BOX} S, height within ${FLOOR} S of the floor and the crown), farthest ${far.toFixed(0)} mm out (SKIN-COLLAPSE)`, value: outside, low: 0, high: 0, unit: "vertices" });
    return out;
  }

  /**
   * Largest growth of a chain's skin past its rings' extent along an axis, as
   * a share of stature: a web or fillet bridges to a neighbour within a
   * fraction of the body, never a tenth of its height.
   */
  export const REACH: number = 0.1;

  /**
   * Half-width of the standing box, share of stature: the bind's A-pose
   * spans less than the arms' span abducted 90 degrees, ANSUR II 1.019 to
   * 1.033 S, so no skin stands farther than 0.6 S from the body's axis.
   */
  export const BOX: number = 0.6;

  /** How far below the floor or above the crown a vertex may stand, share of stature: the crown at stature and the soles on the floor within 2 percent. */
  export const FLOOR: number = 0.02;

  /** `4 pi A / G^2` of a ring: its vector area over the square of its taut girth. */
  export function quotient(ring: V3[]): number {
    const n: V3 = [0, 0, 0];
    for (let i: number = 0; i < ring.length; i++) {
      const a: V3 = ring[i]!;
      const b: V3 = ring[(i + 1) % ring.length]!;
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const area: number = Math.hypot(n[0], n[1], n[2]) / 2;
    const girth: number = HumanCurveRings.taut(ring);
    return girth > 0 ? (4 * Math.PI * area) / (girth * girth) : 0;
  }
}

/** The layer interval holding a station. */
function layerOf(chain: IAutoMovieLoftChain, station: number): number {
  let k: number = 0;
  while (k + 1 < chain.layers.length && chain.layers[k + 1]!.y <= station) k++;
  return k;
}

/** Widen a named box to hold a point. */
function grow(boxes: Map<string, [V3, V3]>, name: string, p: V3): void {
  const box: [V3, V3] | undefined = boxes.get(name);
  if (box === undefined) boxes.set(name, [[...p], [...p]]);
  else
    for (let k: number = 0; k < 3; k++) {
      box[0][k] = Math.min(box[0][k]!, p[k]!);
      box[1][k] = Math.max(box[1][k]!, p[k]!);
    }
}
