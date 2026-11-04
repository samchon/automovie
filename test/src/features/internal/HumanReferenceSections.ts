import fs from "node:fs";
import path from "node:path";

/**
 * Reader of the private reference curve pack's horizontal sections, for the
 * estimate readings that aggregate shape ratios over the reference set where
 * no published source exists.
 *
 * The pack lives in the git-ignored `.references/curves/<id>/` of the
 * checkout (f1, f2, m1, m2) and never enters the repository; without it every
 * reader answers empty. Each region file `sections/<region>/NNN.json` holds
 * horizontal sections (planes y = height, mm; frame x forward, y up, z the
 * body's left) whose curves are cubic Hermite splines; a loop is read here as
 * the polygon of its spans' start points and midpoints, which follows the
 * fitted curve within its fit tolerance for the extents and hull girths the
 * readings take. Curves the pack's own audit marks broken are left out.
 */
export namespace HumanReferenceSections {
  /** A point, mm. */
  export type V3 = [number, number, number];

  /** One closed loop of a section, as sampled points. */
  export interface ILoop {
    /** The loop's points, mm. */
    points: V3[];
  }

  /** One horizontal section of a region. */
  export interface ISection {
    /** Height of the cutting plane above the floor, mm. */
    y: number;

    /** The section's closed loops in this region. */
    loops: ILoop[];

    /** The section's open arcs in this region (where the cut skin is not one closed loop). */
    arcs: ILoop[];
  }

  /** The pack's labelling cut heights (not anatomical measurements), mm. */
  export interface ILandmarks {
    /** The highest skin point. */
    statureMm: number;

    /** The top of the legs. */
    crotchMm: number;

    /** The top of the arms. */
    armpitMm: number;

    /** The narrowest single leg loop above the foot, left. */
    ankle_lMm: number;

    /** The same, right. */
    ankle_rMm: number;
  }

  /**
   * A reference's labelling cut heights.
   *
   * @param id Reference id.
   */
  export function landmarks(id: string): ILandmarks {
    const text: string = fs.readFileSync(path.join(ROOT, id, "index.json"), "utf8");
    const match: RegExpMatchArray | null = /"landmarks":(\{[^}]*\})/.exec(text);
    if (match === null) throw new Error(`${id}: the pack's index has no landmarks`);
    return JSON.parse(match[1]!) as ILandmarks;
  }

  /** The pack's root. */
  export const ROOT: string = path.resolve(__dirname, "../../../../.references/curves");

  /**
   * The reference ids whose pack is present.
   */
  export function available(): string[] {
    return ["f1", "f2", "m1", "m2"].filter((id: string): boolean => fs.existsSync(path.join(ROOT, id, "index.json")));
  }

  /**
   * Every section of a region, low to high, with its closed loops and open
   * arcs; with a height band, only the region files that overlap it are
   * parsed.
   *
   * @param id Reference id.
   * @param region Region label of the pack (`trunk`, `leg_l`, `foot_r`, `head`, ...).
   * @param band Heights to read, mm, both ends included; omitted, every height.
   */
  export function sections(id: string, region: string, band?: [number, number]): ISection[] {
    const folder: string = path.join(ROOT, id, "sections", region);
    if (!fs.existsSync(folder)) return [];
    const out: ISection[] = [];
    for (const file of fs
      .readdirSync(folder)
      .filter((f: string): boolean => f.endsWith(".json"))
      .sort((a: string, b: string): number => a.localeCompare(b))) {
      const full: string = path.join(folder, file);

      // A file's height band sits at its head; a file outside the band is
      // not parsed (the head's files run to tens of megabytes).
      if (band !== undefined) {
        const handle: number = fs.openSync(full, "r");
        const head: Buffer = Buffer.alloc(400);
        fs.readSync(handle, head, 0, 400, 0);
        fs.closeSync(handle);
        const from: number = Number(/"fromMm":(-?[0-9.]+)/.exec(head.toString("utf8"))?.[1]);
        const to: number = Number(/"toMm":(-?[0-9.]+)/.exec(head.toString("utf8"))?.[1]);
        if (to < band[0] || from > band[1]) continue;
      }
      const doc: { sections: { coordinateMm: number; curves: { kind: string; quality?: { status: string }; curve: ICurve }[] }[] } = JSON.parse(
        fs.readFileSync(full, "utf8"),
      );
      for (const s of doc.sections) {
        if (band !== undefined && (s.coordinateMm < band[0] || s.coordinateMm > band[1])) continue;
        const kept: { kind: string; quality?: { status: string }; curve: ICurve }[] = s.curves.filter(
          (c: { quality?: { status: string } }): boolean => c.quality?.status !== "broken",
        );
        out.push({
          y: s.coordinateMm,
          loops: kept.filter((c: { kind: string }): boolean => c.kind === "closed").map((c: { curve: ICurve }): ILoop => ({ points: sample(c.curve) })),
          arcs: kept.filter((c: { kind: string }): boolean => c.kind !== "closed").map((c: { curve: ICurve }): ILoop => ({ points: sample(c.curve) })),
        });
      }
    }
    return out.sort((a: ISection, b: ISection): number => a.y - b.y);
  }

  /** The pack's curve record: Hermite spans with phase widths. */
  interface ICurve {
    phaseIntervals: number[];
    spans: { start: V3; end: V3; startDerivative: V3; endDerivative: V3 }[];
  }

  /** A curve's span starts and midpoints. */
  function sample(curve: ICurve): V3[] {
    const out: V3[] = [];
    curve.spans.forEach((s: ICurve["spans"][number], i: number): void => {
      const h: number = curve.phaseIntervals[i] ?? 0;
      out.push(s.start);

      // The Hermite midpoint: (start + end) / 2 + h (startDerivative - endDerivative) / 8.
      out.push([0, 1, 2].map((k: number): number => (s.start[k]! + s.end[k]!) / 2 + (h * (s.startDerivative[k]! - s.endDerivative[k]!)) / 8) as V3);
    });

    // The last span's end closes the polygon of a closed curve (a repeated
    // point) and is an open arc's far end, which a margin reading needs.
    const last: ICurve["spans"][number] | undefined = curve.spans[curve.spans.length - 1];
    if (last !== undefined) out.push(last.end);
    return out;
  }

  /** A loop's extents and taut-tape girth in its plane. */
  export interface IExtent {
    /** Least and greatest x, mm. */
    x: [number, number];

    /** Least and greatest z, mm. */
    z: [number, number];

    /** Convex hull perimeter in the xz plane, mm. */
    girth: number;

    /** Mean of the points, mm. */
    centre: V3;
  }

  /**
   * A loop's extents and girth.
   *
   * @param loop The loop.
   */
  export function extent(loop: ILoop): IExtent {
    const xs: number[] = loop.points.map((p: V3): number => p[0]);
    const zs: number[] = loop.points.map((p: V3): number => p[2]);
    const n: number = loop.points.length;
    const centre: V3 = [xs.reduce((a: number, b: number): number => a + b, 0) / n, loop.points[0]![1], zs.reduce((a: number, b: number): number => a + b, 0) / n];
    return { x: [Math.min(...xs), Math.max(...xs)], z: [Math.min(...zs), Math.max(...zs)], girth: hull(loop.points.map((p: V3): [number, number] => [p[0], p[2]])), centre };
  }

  /** Convex hull perimeter of planar points (monotone chain). */
  function hull(points: [number, number][]): number {
    const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return 0;
    const cross = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const q of p) {
      while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
      lower.push(q);
    }
    const upper: [number, number][] = [];
    for (const q of [...p].reverse()) {
      while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
      upper.push(q);
    }
    const ring: [number, number][] = [...lower.slice(0, -1), ...upper.slice(0, -1)];
    let length: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number] = ring[i]!;
      const b: [number, number] = ring[(i + 1) % ring.length]!;
      length += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return length;
  }
}
