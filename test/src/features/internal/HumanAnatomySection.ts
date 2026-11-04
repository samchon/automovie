import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyVector } from "./HumanAnatomyVector";

type V3 = HumanAnatomyVector.V3;
type ISkin = HumanAnatomy.ISkin;
type ICut = HumanAnatomy.ICut;
const V: typeof HumanAnatomyVector = HumanAnatomyVector;

/**
 * Plane sections of a skin: every triangle a plane crosses cut into a
 * segment, segments sharing a mesh edge joined into loops, each loop one
 * component of the section. Reached through `HumanAnatomy`, which re-exports
 * `cut` and `polylines`.
 */
export namespace HumanAnatomySection {
  /**
   * The section of the skin by a plane, as the component holding a point.
   *
   * The girth is the perimeter of the loop's convex hull: a tape drawn taut
   * round a section lies on its hull and bridges every hollow, as a tape
   * measure does.
   *
   * @param pick Point the wanted component encloses; the nearest component when none does.
   * @param within Triangles to cut; all when absent.
   */
  export function cut(skin: ISkin, origin: V3, normal: V3, pick: V3, within?: Uint32Array): ICut | null {
    const all: IPieces = pieces(skin, origin, normal, within);
    if (all.components.length === 0) return null;
    const [u, w]: [V3, V3] = V.basis(normal);
    const at: (p: V3) => [number, number] = (p: V3): [number, number] => [V.dot(V.sub(p, origin), u), V.dot(V.sub(p, origin), w)];
    const q: [number, number] = at(pick);
    let best: number = -1;
    let bestArea: number = Infinity;

    // A point is enclosed when rays in at least two of three directions cross
    // the loop an odd number of times: a gap where the loop meets an opening
    // can spoil one ray.
    const directions: [number, number][] = [0, 1, 2].map((k: number): [number, number] => [Math.cos(0.3 + (2 * Math.PI * k) / 3), Math.sin(0.3 + (2 * Math.PI * k) / 3)]);
    all.components.forEach((c: IComponent, k: number): void => {
      let votes: number = 0;
      for (const [dx, dy] of directions) {
        let crossings: number = 0;
        for (const [a, b] of c.segments) {
          const pa: [number, number] = at(a);
          const pb: [number, number] = at(b);

          // Ray q + t (dx, dy), t > 0, against segment pa + s (pb - pa), s in [0, 1).
          const ex: number = pb[0] - pa[0];
          const ey: number = pb[1] - pa[1];
          const den: number = dx * ey - dy * ex;
          if (Math.abs(den) < 1e-12) continue;
          const wx: number = pa[0] - q[0];
          const wy: number = pa[1] - q[1];
          const t: number = (wx * ey - wy * ex) / den;
          const s: number = (wx * dy - wy * dx) / den;
          if (t > 0 && s >= 0 && s < 1) crossings++;
        }
        if (crossings % 2 === 1) votes++;
      }
      if (votes >= 2 && c.area < bestArea) {
        best = k;
        bestArea = c.area;
      }
    });

    let contained: boolean = true;
    let nearest: number = 0;
    if (best < 0) {
      contained = false;
      nearest = Infinity;
      all.components.forEach((c: IComponent, k: number): void => {
        for (const [a] of c.segments) {
          const d: number = V.dist(a, pick);
          if (d < nearest) {
            nearest = d;
            best = k;
          }
        }
      });
    }
    const chosen: IComponent = all.components[best]!;
    const points: V3[] = chosen.segments.map((s: [V3, V3]): V3 => s[0]);
    return { girth: V.hull(points.map(at)), area: chosen.area, points, contained, outside: nearest };
  }

  /** Every component of a plane's section, each as an ordered polyline, closed or open. */
  export function polylines(skin: ISkin, origin: V3, normal: V3, within?: Uint32Array): { points: V3[]; closed: boolean }[] {
    const all: IPieces = pieces(skin, origin, normal, within);
    return all.components.map((c: IComponent): { points: V3[]; closed: boolean } => {
      const uses: Map<number, number[]> = new Map();
      c.keys.forEach(([a, b]: [number, number], k: number): void => {
        for (const e of [a, b]) {
          const list: number[] = uses.get(e) ?? [];
          list.push(k);
          uses.set(e, list);
        }
      });

      // An open loop starts at an edge one segment uses.
      let start: number = 0;
      let startKey: number = c.keys[0]![0];
      let closed: boolean = true;
      for (const [e, list] of uses)
        if (list.length === 1) {
          start = list[0]!;
          startKey = e;
          closed = false;
          break;
        }
      const done: Uint8Array = new Uint8Array(c.keys.length);
      const out: V3[] = [];
      let seg: number = start;
      let key: number = startKey;
      for (;;) {
        done[seg] = 1;
        const [a, b]: [number, number] = c.keys[seg]!;
        const from: number = a === key ? 0 : 1;
        out.push(c.segments[seg]![from]);
        const next: number = from === 0 ? b : a;
        const list: number[] = uses.get(next) ?? [];
        const other: number | undefined = list.find((s: number): boolean => done[s] === 0);
        if (other === undefined) {
          out.push(c.segments[seg]![1 - from]);
          break;
        }
        seg = other;
        key = next;
      }
      return { points: out, closed };
    });
  }

  /** One component of a section. */
  interface IComponent {
    /** Segment end points. */
    segments: [V3, V3][];

    /** Edge keys of each segment's ends. */
    keys: [number, number][];

    /** Enclosed area, mm^2. */
    area: number;
  }

  /** A section's components. */
  interface IPieces {
    /** Components, one per loop of skin. */
    components: IComponent[];
  }

  /** Cut every triangle a plane crosses into segments, joined into loops by shared edges (union-find on edge keys). */
  function pieces(skin: ISkin, origin: V3, normal: V3, within?: Uint32Array): IPieces {
    const n: number = skin.P.length / 3;
    const parent: Map<number, number> = new Map();
    const find: (k: number) => number = (k: number): number => {
      let r: number = k;
      while (parent.get(r) !== r) r = parent.get(r)!;
      let c: number = k;
      while (parent.get(c) !== r) {
        const next: number = parent.get(c)!;
        parent.set(c, r);
        c = next;
      }
      return r;
    };
    const segments: [V3, V3][] = [];
    const keys: [number, number][] = [];
    const count: number = within === undefined ? skin.I.length / 3 : within.length;
    const P: Float64Array = skin.P;
    for (let i: number = 0; i < count; i++) {
      const t: number = within === undefined ? i : within[i]!;
      const v: number[] = [skin.I[3 * t]!, skin.I[3 * t + 1]!, skin.I[3 * t + 2]!];
      const d: number[] = v.map((x: number): number => (P[3 * x]! - origin[0]) * normal[0] + (P[3 * x + 1]! - origin[1]) * normal[1] + (P[3 * x + 2]! - origin[2]) * normal[2]);
      const above: boolean[] = d.map((x: number): boolean => x >= 0);
      if (above[0] === above[1] && above[1] === above[2]) continue;
      const ends: V3[] = [];
      const edgeKeys: number[] = [];
      for (let e: number = 0; e < 3; e++) {
        const a: number = e;
        const b: number = (e + 1) % 3;
        if (above[a] === above[b]) continue;
        const s: number = d[a]! / (d[a]! - d[b]!);
        const va: number = v[a]!;
        const vb: number = v[b]!;
        ends.push([P[3 * va]! + (P[3 * vb]! - P[3 * va]!) * s, P[3 * va + 1]! + (P[3 * vb + 1]! - P[3 * va + 1]!) * s, P[3 * va + 2]! + (P[3 * vb + 2]! - P[3 * va + 2]!) * s]);
        edgeKeys.push(Math.min(va, vb) * n + Math.max(va, vb));
      }

      // Orient the segment round the outward normal so loop areas add up.
      const pa: V3 = [P[3 * v[0]!]!, P[3 * v[0]! + 1]!, P[3 * v[0]! + 2]!];
      const pb: V3 = [P[3 * v[1]!]!, P[3 * v[1]! + 1]!, P[3 * v[1]! + 2]!];
      const pc: V3 = [P[3 * v[2]!]!, P[3 * v[2]! + 1]!, P[3 * v[2]! + 2]!];
      const tn: V3 = V.cross(V.sub(pb, pa), V.sub(pc, pa));
      const dir: V3 = V.sub(ends[1]!, ends[0]!);
      const flip: boolean = V.dot(V.cross(normal, tn), dir) < 0;
      segments.push(flip ? [ends[1]!, ends[0]!] : [ends[0]!, ends[1]!]);
      keys.push(flip ? [edgeKeys[1]!, edgeKeys[0]!] : [edgeKeys[0]!, edgeKeys[1]!]);
      for (const k of edgeKeys) if (!parent.has(k)) parent.set(k, k);
      const ra: number = find(edgeKeys[0]!);
      const rb: number = find(edgeKeys[1]!);
      if (ra !== rb) parent.set(ra, rb);
    }

    const [u, w]: [V3, V3] = V.basis(normal);
    const groups: Map<number, IComponent> = new Map();
    segments.forEach((s: [V3, V3], k: number): void => {
      const root: number = find(keys[k]![0]);
      let c: IComponent | undefined = groups.get(root);
      if (c === undefined) {
        c = { segments: [], keys: [], area: 0 };
        groups.set(root, c);
      }
      c.segments.push(s);
      c.keys.push(keys[k]!);
      const a: V3 = V.sub(s[0], origin);
      const b: V3 = V.sub(s[1], origin);
      c.area += (V.dot(a, u) * V.dot(b, w) - V.dot(a, w) * V.dot(b, u)) / 2;
    });
    const components: IComponent[] = [...groups.values()];
    for (const c of components) c.area = Math.abs(c.area);
    return { components };
  }
}
