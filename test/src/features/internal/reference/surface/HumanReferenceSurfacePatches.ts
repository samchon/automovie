import type { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceFlag } from "./HumanReferenceSurfaceFlag";

/**
 * Grouping of flagged vertices into connected patches, each reported with its
 * region, size, deviation and place.
 */
export namespace HumanReferenceSurfacePatches {
  /** The vertices of one surface and what was found on them. */
  export interface IGroupProps {
    /** Reference alias, for the findings. */
    person: string;

    /** Which surface the vertices belong to. */
    surface: "reference" | "generated";

    /** Flat vertex positions, mm. */
    P: Float64Array;

    /** Flat triangle vertex indices, whose edges join vertices into patches. */
    I: Uint32Array;

    /** Flat outward unit vertex normals, which give a patch the way it faces. */
    normal: Float64Array;

    /** Area per vertex, mm squared. */
    area: Float64Array;

    /** Flag code per vertex; 0 is within the limit, and a patch joins vertices of one code. */
    flag: Uint8Array;

    /** Signed deviation per vertex, mm. */
    value: Float64Array;

    /** Limit per vertex, mm. */
    limit: Float64Array;

    /** Region index per vertex, into `names`. */
    region: Int32Array;

    /** Region names. */
    names: string[];

    /** Whether each vertex was read by the nearest distance because its normal line found no counterpart. */
    fallback: Uint8Array;
  }

  /**
   * Groups flagged vertices into connected patches of one flag code over the
   * mesh's edges.
   *
   * @param props The surface and its findings.
   * @returns One patch per connected group, in no particular order.
   */
  export function group(props: IGroupProps): HumanReferenceSurface.IPatch[] {
    const out: HumanReferenceSurface.IPatch[] = [];

    for (const list of members(props.I, props.flag).values()) out.push(patch(props, list));

    return out;
  }

  /**
   * Joins vertices of one flag code that share a triangle edge, by union-find.
   *
   * @param I Flat triangle vertex indices.
   * @param flag Flag code per vertex.
   * @returns The vertices of every connected group, by the group's root.
   */
  function members(I: Uint32Array, flag: Uint8Array): Map<number, number[]> {
    const n: number = flag.length;
    const parent: Int32Array = new Int32Array(n);
    for (let v: number = 0; v < n; v++) parent[v] = v;

    const find: (v: number) => number = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]!]!;
        v = parent[v]!;
      }

      return v;
    };

    for (let t: number = 0; t < I.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const a: number = I[t + k]!;
        const b: number = I[t + ((k + 1) % 3)]!;
        if (flag[a] === 0 || flag[a] !== flag[b]) continue;

        const ra: number = find(a);
        const rb: number = find(b);
        if (ra !== rb) parent[ra] = rb;
      }

    const out: Map<number, number[]> = new Map();
    for (let v: number = 0; v < n; v++) {
      if (flag[v] === 0) continue;

      const r: number = find(v);
      const list: number[] | undefined = out.get(r);
      if (list === undefined) out.set(r, [v]);
      else list.push(v);
    }

    return out;
  }

  /**
   * Reports one connected group as a patch.
   *
   * @param props The surface and its findings.
   * @param list The group's vertices.
   */
  function patch(props: IGroupProps, list: number[]): HumanReferenceSurface.IPatch {
    const { P, flag }: IGroupProps = props;
    let area: number = 0;
    let weighted: number = 0;
    let best: number = list[0]!;
    let lo: number = Infinity;
    let hi: number = -Infinity;
    let fallback: number = 0;
    const centroid: HumanAnatomy.V3 = [0, 0, 0];
    const facing: HumanAnatomy.V3 = [0, 0, 0];
    const regions: Map<number, number> = new Map();

    for (const v of list) {
      const w: number = props.area[v]!;
      const d: number = Math.abs(props.value[v]!);
      area += w;
      weighted += w * d;
      if (d > Math.abs(props.value[best]!)) best = v;
      lo = Math.min(lo, props.limit[v]!);
      hi = Math.max(hi, props.limit[v]!);
      fallback += props.fallback[v]!;

      for (let a: number = 0; a < 3; a++) {
        centroid[a] += w * P[3 * v + a]!;
        facing[a] += w * props.normal[3 * v + a]!;
      }
      regions.set(props.region[v]!, (regions.get(props.region[v]!) ?? 0) + w);
    }

    // The patch belongs to the region holding most of its area; the others it reaches follow by area.
    const ranked: string[] = [...regions.entries()]
      .sort((x: [number, number], y: [number, number]): number => y[1] - x[1])
      .map(([r]: [number, number]): string => props.names[r]!);
    const at: HumanAnatomy.V3 = [P[3 * best]!, P[3 * best + 1]!, P[3 * best + 2]!];

    return {
      person: props.person,
      region: ranked[0]!,
      spans: ranked.slice(1),
      direction: HumanReferenceSurfaceFlag.DIRECTIONS[flag[list[0]!]!]!,
      surface: props.surface,
      facing: face(facing),
      area,
      max: Math.abs(props.value[best]!),
      mean: area > 0 ? weighted / area : 0,
      limit: props.limit[best]!,
      limits: [lo, hi],
      centroid: area > 0 ? (centroid.map((c: number): number => c / area) as HumanAnatomy.V3) : at,
      at,
      vertices: list.length,
      fallback,
      detached: flag[list[0]!] === HumanReferenceSurfaceFlag.DETACHED,
    };
  }

  /**
   * The anatomical directions a mean normal points: its axis of largest
   * magnitude, and any other axis within half of the normal's length.
   *
   * @param n The mean normal, in the body's frame.
   */
  function face(n: HumanAnatomy.V3): string {
    const names: string[][] = [
      ["back", "front"],
      ["down", "up"],
      ["right", "left"],
    ];
    const l: number = Math.hypot(...n) || 1;
    const parts: string[] = [];
    const order: number[] = [0, 1, 2].sort((a: number, b: number): number => Math.abs(n[b]!) - Math.abs(n[a]!));

    for (const a of order)
      if (Math.abs(n[a]!) / l >= 0.5 || parts.length === 0) parts.push(names[a]![n[a]! >= 0 ? 1 : 0]!);

    return parts.join("-");
  }
}
