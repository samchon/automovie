import { type AutoMovieViewLoft, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

import { HumanDebugReferenceCut } from "./HumanDebugReferenceCut";
import type { HumanDebugViewParts } from "./HumanDebugViewParts";

type Vec3 = [number, number, number];

/** Angles each built section is read at for its distance to the skin. */
const RING: number = 48;

/**
 * Each built part's view curves against the same person's reference skin, cut by the part's own
 * section planes (`HumanDebugReferenceCut`): a diagnostic for the modelers, never an acceptance and
 * never a target any shape is fitted to.
 *
 * At every emitted station of a part, in person millimetres (the calibration scaled by the
 * person's stature about the floor):
 *
 * - edges: where the reference's piece around the axis is found, each of the four outline edges
 *   (`+u`, `+v`, `-u`, `-v`, the front pair then the side pair) minus the reference's extreme on
 *   that side, positive where the built curve stands outside the skin, also as a share of the
 *   reference's breadth (front edges) or depth (side edges) there;
 * - touches: the distance from each of the four touch points to the nearest reference skin in the
 *   cut, read for every part, a face part merged into the head included;
 * - ring: the distance from the built section, read at {@link RING} equal angles, to the nearest
 *   reference skin: the fullness and the extremes together.
 *
 * Each part's row keeps the largest and the mean absolute value of each over its stations and the
 * station of the largest edge deviation, as its share of the part's station span and its nearest
 * named site. Rows hold aggregates only, never a reference coordinate.
 */
export namespace HumanDebugViewDeviation {
  /** One part's aggregates. */
  export interface IRow {
    /** The part's name. */
    name: string;

    /** Regions of the pack the part was cut against. */
    regions: string[];

    /** Emitted stations. */
    stations: number;

    /** Stations where the reference's piece around the axis was found. */
    surrounded: number;

    /** Largest and mean absolute edge deviation, mm, and the largest as a share of breadth or depth; null without a surrounded station. */
    edge: { max: number; mean: number; share: number; edge: string; at: number; site: string } | null;

    /** Mean signed deviation of each edge `[+u, +v, -u, -v]`, mm (positive: built outside); null without a surrounded station. */
    bias: [number, number, number, number] | null;

    /** Largest and mean distance of the four touch points to the skin, mm. */
    touch: { max: number; mean: number };

    /** Largest and mean distance of the built section to the skin, mm. */
    ring: { max: number; mean: number };
  }

  /**
   * Compare every part.
   *
   * @param built The person's parts.
   * @param regions The reference's segments by region.
   * @returns One row per part with at least one station.
   */
  export function of(built: HumanDebugViewParts.IOutput, regions: readonly HumanDebugReferenceCut.IRegion[]): IRow[] {
    const rows: IRow[] = [];
    for (const p of built.parts) {
      const sections: AutoMovieViewLoft.IStation[] = p.loft.sections;
      if (sections.length === 0) continue;
      const names: string[] = regionsOf(p.name);
      const read: HumanDebugReferenceCut.IRegion[] = regions.filter((r: HumanDebugReferenceCut.IRegion): boolean => names.length === 0 || names.includes(r.name));
      const knots: IAutoMovieViewPart.IKnot[] = p.part.front.positive.knots;
      const first: number = sections[0]!.station;
      const last: number = sections[sections.length - 1]!.station;
      const edges: number[] = [];
      const signed: number[][] = [[], [], [], []];
      const touches: number[] = [];
      const rings: number[] = [];
      let worst: IRow["edge"] = null;
      for (const s of sections) {
        const k: number = built.scale;
        const e: number[] = s.section.box.extents.map((x: number): number => x * k);
        const origin: Vec3 = [s.frame.origin[0]! * k, s.frame.origin[1]! * k, s.frame.origin[2]! * k];
        const u: Vec3 = [s.frame.u[0]!, s.frame.u[1]!, s.frame.u[2]!];
        const v: Vec3 = [s.frame.v[0]!, s.frame.v[1]!, s.frame.v[2]!];
        const cut: HumanDebugReferenceCut.ICut = HumanDebugReferenceCut.of(read, origin, u, v, Math.max(...e));
        if (cut.segments.length === 0) continue;
        const touch: [number, number][] = [
          [e[0]!, 0],
          [0, e[1]!],
          [-e[2]!, 0],
          [0, -e[3]!],
        ];
        for (const [x, z] of touch) touches.push(HumanDebugReferenceCut.distance(cut, x, z));
        for (let i: number = 0; i < RING; i++) {
          const phi: number = (2 * Math.PI * i) / RING;
          const r: number = AutoMovieViewSection.radius(s.section, phi)[0] * k;
          rings.push(HumanDebugReferenceCut.distance(cut, r * Math.cos(phi), r * Math.sin(phi)));
        }
        if (cut.extents === null) continue;
        const ref: [number, number, number, number] = cut.extents;
        const breadth: number = ref[0] + ref[2];
        const depth: number = ref[1] + ref[3];
        for (let q: number = 0; q < 4; q++) {
          const d: number = e[q]! - ref[q]!;
          edges.push(Math.abs(d));
          signed[q]!.push(d);
          if (worst === null || Math.abs(d) > worst.max) {
            const site: string = knots.reduce((a: IAutoMovieViewPart.IKnot, b: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => (Math.abs(b.station - s.station) < Math.abs(a.station - s.station) ? b : a)).site;
            worst = {
              max: Math.abs(d),
              mean: 0,
              share: Math.abs(d) / (q % 2 === 0 ? breadth : depth),
              edge: ["+u", "+v", "-u", "-v"][q]!,
              at: last > first ? (s.station - first) / (last - first) : 0,
              site,
            };
          }
        }
      }
      const mean = (a: number[]): number => (a.length === 0 ? NaN : a.reduce((x: number, y: number): number => x + y, 0) / a.length);
      const finite = (a: number[]): number[] => a.filter(Number.isFinite);
      const largest = (a: number[]): number => finite(a).reduce((x: number, y: number): number => Math.max(x, y), -Infinity);
      if (worst !== null) worst.mean = mean(edges);
      rows.push({
        name: p.name,
        regions: names,
        stations: sections.length,
        surrounded: signed[0]!.length,
        edge: worst,
        bias: signed[0]!.length === 0 ? null : (signed.map(mean) as [number, number, number, number]),
        touch: { max: largest(touches), mean: mean(finite(touches)) },
        ring: { max: largest(rings), mean: mean(finite(rings)) },
      });
    }
    return rows;
  }

  /**
   * The pack regions a part is cut against, by the words of its name; empty reads every region.
   *
   * @param name The part's name.
   */
  export function regionsOf(name: string): string[] {
    const side: string | null = /left/.test(name) ? "_l" : /right/.test(name) ? "_r" : null;
    if (/(^|\.)(head|neck|nose|nasal|lip|ear|auricle|lid|eyelid|orbit|brow|zyg|cheek|chin|jaw|mouth|philtrum|malar|temple)/.test(name)) return ["head", "trunk"];
    if (side !== null) {
      if (/foot|toe|hallux/.test(name)) return ["foot" + side, "leg" + side];
      if (/hand|finger|thumb|palm|index|middle|ring|little|pinky|digit/.test(name)) return ["hand" + side, "arm" + side];
      if (/arm|elbow|wrist|deltoid/.test(name)) return ["arm" + side, "hand" + side, "trunk"];
      if (/leg|thigh|calf|knee|shank|ankle/.test(name)) return ["leg" + side, "foot" + side, "trunk"];
    }
    if (/trunk|breast|glut|buttock|chest|abdomen|pelvis|upper/.test(name)) return ["trunk"];
    return [];
  }
}
