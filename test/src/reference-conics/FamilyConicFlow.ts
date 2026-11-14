import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewChain as Q, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicFit as F } from "./FamilyConicFit";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Where a stored family's fields leave the flow of their own knots, and whether laying them again from their neighbours brings its skin
 * nearer the reference (#3412, wrap-up: "smooth the minor defects by comparing neighbouring coordinates and curves").
 *
 * For every stored f1 family the package holds (`AutoMovieHumanF1.FAMILIES`, the walls `FamilyConicBody.ts --seed=stored` reads as well),
 * each field at each interior knot is compared with its leave-one-out value: the natural cubic through the field's other knots evaluated at
 * that knot (`FamilyConicFit.resample`), the law `FamilyConicBody.ts --relay` and `--relay-stored` lay a broken value again by, so a relay
 * reproduces it exactly. A knot is flagged where its difference exceeds both `OUTLIER` times the field's median absolute difference and a
 * floor (`FLOOR`); adjacent flagged knots of a field are one group, laid from the knots outside it. Each group is then checked on the
 * coordinates: the wall's sections against the reference source's cut in the same planes over the group's span, before and after the relay,
 * and a group whose relay draws the wall away from the skin is a real feature, kept.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicFlow.cjs`; it writes `test/.shots/family-conic-flow/<time>/`: per family its
 * table (`<part>.flow.txt`), the `--relay-stored` argument of its accepted groups (`<part>.relay.txt`) and before and after frames of its
 * worst three accepted groups, and `summary.txt`.
 */
export namespace FamilyConicFlow {
  /**
   * A knot stands out of its field's flow when its difference from the leave-one-out value exceeds this many times the field's median
   * absolute difference: four median absolute deviations is past the noise of a field whose knots follow one smooth curve, the usual robust
   * outlier bound (about 2.7 standard deviations of a normal spread).
   */
  export const OUTLIER: number = 4;

  /**
   * The least difference that flags a knot, by the field's unit: 0.3 mm for a coordinate, the deviation a reader of the clay can see
   * (campaign 1 judged steps under it invisible), and 0.03 for a share, a shoulder or a turn in radians, a tenth of the span a shoulder
   * ranges over between its model bounds.
   */
  export const FLOOR: { mm: number; other: number } = { mm: 0.3, other: 0.03 };

  /** A relay worsens the skin when its largest miss grows by more than this, mm, or its mean miss grows at all. */
  export const WORSE_MM: number = 0.1;

  /** Station step of the coordinate check, mm. */
  export const STEP_MM: number = 1;

  /** One flagged group of one family: the knots laid again and the fields laid at them. */
  export interface IGroup {
    /** The knots laid again from the field's other knots, mm. */
    knots: number[];

    /** The fields laid at those knots, by index. */
    fields: number[];

    /** The largest difference among them, in each field's unit. */
    worst: number;

    /** The span of stations the relay changes: from the knot before the group to the knot after, mm. */
    span: [number, number];

    /** The skin against the reference over the span before the relay. */
    before: IMiss;

    /** The skin against the reference over the span after the relay. */
    after: IMiss;

    /** Accepted (the relay does not draw the wall from the skin) or kept as a real feature. */
    accepted: boolean;
  }

  /** The skin's miss against the reference over a span. */
  export interface IMiss {
    /** Largest distance of the reference's section points from the wall's section, mm. */
    max: number;

    /** 99th percentile of those distances, mm. */
    p99: number;

    /** Mean of those distances, mm. */
    mean: number;

    /** Reference points farther than 1 mm. */
    over: number;

    /** Stations whose section crosses itself. */
    folds: number;

    /** Stations the model refuses. */
    refused: number;
  }

  const f2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : String(x));
  const median = (xs: readonly number[]): number => {
    const s: number[] = [...xs].sort((a: number, b: number): number => a - b);
    return s.length === 0 ? 0 : s.length % 2 === 1 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
  };

  /** Each field's leave-one-out value at each interior knot, the natural cubic through its other knots there; NaN at the ends. */
  export function leaveOneOut(family: H.IFamily): number[][] {
    return family.values.map((field: number[]): number[] =>
      field.map((_: number, k: number): number => {
        if (k === 0 || k === family.knots.length - 1) return NaN;
        const keep: number[] = family.knots.map((__: number, j: number): number => j).filter((j: number): boolean => j !== k);
        return F.resample([keep.map((j: number): number => field[j]!)], keep.map((j: number): number => family.knots[j]!), [family.knots[k]!])[0]![0]!;
      }),
    );
  }

  /** The family with the listed knots of the listed fields laid again from the field's other knots, as `--relay-stored` lays them. */
  export function relayed(family: H.IFamily, groups: readonly Pick<IGroup, "knots" | "fields">[]): H.IFamily {
    const values: number[][] = family.values.map((field: number[]): number[] => [...field]);
    for (const group of groups) {
      const keep: number[] = family.knots.map((_: number, k: number): number => k).filter((k: number): boolean => !group.knots.includes(family.knots[k]!));
      for (const f of group.fields) {
        const laid: number[] = F.resample([keep.map((k: number): number => values[f]![k]!)], keep.map((k: number): number => family.knots[k]!), family.knots)[0]!;
        values[f] = values[f]!.map((x: number, k: number): number => (group.knots.includes(family.knots[k]!) ? laid[k]! : x));
      }
    }
    return { ...family, values };
  }

  /** A field vector's section as a polygon: each conic arc of the model's chain sampled `per` times. */
  function polygon(values: readonly number[], layout: S.ILayout, per: number = 16): C.P[] {
    const input = S.resolve(values, layout).input;
    const n: number = input.points.length;
    const out: C.P[] = [];
    for (let k: number = 0; k < n; ++k) {
      const p0 = input.points[k]!, p2 = input.points[(k + 1) % n]!;
      const a: C.P = S.meet([p0[0]!, p0[1]!], [input.tangents[k]![0]!, input.tangents[k]![1]!], [p2[0]!, p2[1]!], [input.tangents[(k + 1) % n]![0]!, input.tangents[(k + 1) % n]![1]!]);
      const w: number = input.shoulders[k]! / (1 - input.shoulders[k]!);
      for (let i: number = 0; i < per; ++i) {
        const t: number = i / per;
        const b0: number = (1 - t) ** 2, b1: number = 2 * t * (1 - t) * w, b2: number = t * t;
        const d: number = b0 + b1 + b2;
        out.push([(b0 * p0[0]! + b1 * a[0] + b2 * p2[0]!) / d, (b0 * p0[1]! + b1 * a[1] + b2 * p2[1]!) / d]);
      }
    }
    return out;
  }

  /** Whether a closed polygon crosses itself. */
  function crosses(ring: readonly C.P[]): boolean {
    const n: number = ring.length;
    const side = (a: C.P, b: C.P, c: C.P): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 2; j < n; ++j) {
        if (i === 0 && j === n - 1) continue;
        const a: C.P = ring[i]!, b: C.P = ring[(i + 1) % n]!, c: C.P = ring[j]!, d: C.P = ring[(j + 1) % n]!;
        if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return true;
      }
    return false;
  }

  /** Distance from a point to a closed polyline. */
  function nearest(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let k: number = 0; k < ring.length; ++k) {
      const a: C.P = ring[k]!, b: C.P = ring[(k + 1) % ring.length]!;
      const d: C.P = [b[0] - a[0], b[1] - a[1]];
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1] || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]));
    }
    return best;
  }

  /**
   * The wall's miss against the reference over a span: at every `STEP_MM` station, the reference cut in the station's plane (the loop
   * nearest the wall's section, so a neighbouring part cut by the same plane is not read) against the wall's section. The wall alone, its
   * reliefs left out: a relay changes the wall, and the same reliefs stand on it before and after.
   */
  export function miss(family: H.IFamily, span: readonly [number, number], source: R.ISource): IMiss {
    const read: (s: number) => number[] = H.reader(family);
    const axis = H.axis(family);
    const distances: number[] = [];
    let folds: number = 0, refused: number = 0;
    for (let s: number = span[0]; s <= span[1] + 1e-9; s += STEP_MM) {
      const values: number[] = read(s);
      if (S.chain(values, family.layout).fault !== null) {
        ++refused;
        continue;
      }
      const section: C.P[] = polygon(values, family.layout);
      if (crosses(section)) ++folds;
      const ring: C.P[] = Array.from({ length: 360 }, (_: unknown, k: number): C.P => {
        const phi: number = (2 * Math.PI * k) / 360;
        const r: number = Q.radius(S.chain(values, family.layout), phi);
        return [r * Math.cos(phi), r * Math.sin(phi)];
      });
      const loops: C.P[][] = R.loops(source.all, axis.at(s));
      if (loops.length === 0) continue;
      const loop: C.P[] = loops.reduce((a: C.P[], b: C.P[]): C.P[] => (median(b.map((p: C.P): number => nearest(p, ring))) < median(a.map((p: C.P): number => nearest(p, ring))) ? b : a));
      for (const p of loop) distances.push(nearest(p, ring));
    }
    const sorted: number[] = [...distances].sort((a: number, b: number): number => a - b);
    return {
      max: sorted.at(-1) ?? NaN,
      p99: sorted[Math.min(sorted.length - 1, Math.floor(0.99 * sorted.length))] ?? NaN,
      mean: sorted.reduce((a: number, b: number): number => a + b, 0) / Math.max(1, sorted.length),
      over: sorted.filter((d: number): boolean => d > 1).length,
      folds,
      refused,
    };
  }

  /** Each field's flagged knots, grouped into runs of adjacent flagged knots, merged across fields that flag the same knots. */
  export function groups(family: H.IFamily, loo: readonly (readonly number[])[]): { knots: number[]; fields: number[]; worst: number }[] {
    const units: S.Unit[] = S.units(family.layout);
    const byKnots: Map<string, { knots: number[]; fields: number[]; worst: number }> = new Map();
    family.values.forEach((field: number[], f: number): void => {
      const diff: number[] = field.map((x: number, k: number): number => x - loo[f]![k]!);
      const interior: number[] = diff.filter((d: number): boolean => Number.isFinite(d)).map(Math.abs);
      const bound: number = Math.max(OUTLIER * median(interior), units[f] === "mm" ? FLOOR.mm : FLOOR.other);
      const flagged: boolean[] = diff.map((d: number): boolean => Number.isFinite(d) && Math.abs(d) > bound);
      for (let k: number = 0; k < flagged.length; ) {
        if (!flagged[k]) {
          ++k;
          continue;
        }
        let j: number = k;
        while (j + 1 < flagged.length && flagged[j + 1]) ++j;
        const knots: number[] = family.knots.slice(k, j + 1);
        const key: string = knots.join(",");
        const entry = byKnots.get(key) ?? { knots, fields: [], worst: 0 };
        entry.fields.push(f);
        entry.worst = Math.max(entry.worst, ...diff.slice(k, j + 1).map(Math.abs));
        byKnots.set(key, entry);
        k = j + 1;
      }
    });
    return [...byKnots.values()];
  }

  /** The family's wall lofted over a span, as a mesh in metres, its stations inside `marked` in their own colour. */
  function mesh(family: H.IFamily, span: readonly [number, number], marked: readonly [number, number], id: string): N.Mesh[] {
    const stations: number[] = [];
    for (let s: number = span[0]; s <= span[1] + 1e-9; s += 0.5) stations.push(s);
    const lofted: AutoMovieViewLoft.IResult = H.create({ ...family, reliefs: undefined, tips: undefined }, stations);
    if (lofted.chain === null) return [];
    const about: number = 192;
    const positions: number[] = [];
    for (const s of stations)
      for (let j: number = 0; j < about; ++j) {
        const p = AutoMovieLoftChain.point(lofted.chain, s, (2 * Math.PI * j) / about);
        positions.push(p[0]! / 1000, p[1]! / 1000, p[2]! / 1000);
      }
    const plain: number[] = [], inside: number[] = [];
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < about; ++j) {
        const a: number = i * about + j, b: number = i * about + ((j + 1) % about);
        const into: number[] = stations[i]! >= marked[0] - 1e-9 && stations[i + 1]! <= marked[1] + 1e-9 ? inside : plain;
        into.push(a, a + about, b, b, a + about, b + about);
      }
    return [
      { id, positions, indices: plain, colour: [0.64, 0.65, 0.67] },
      { id: id + ".relayed", positions, indices: inside, colour: [0.86, 0.55, 0.32] },
    ];
  }

  /** Read every family, flag, check, write the tables, relays and frames, and the summary. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-flow", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const source: R.ISource = await R.load(root);
    const reference: N.Mesh[] = [source.body, source.head].map((m, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(m.positions, (x: number): number => x / 1000), indices: Array.from(m.indices), colour: [0.64, 0.65, 0.67] }));
    NodeCanvasRaster.initialize();
    const seen: Set<string> = new Set();
    const summary: string[] = [
      "# FamilyConicFlow: every stored family's fields against their leave-one-out flow, groups checked on the coordinates (before -> after over the group's span)",
      "# the stored cutters (nostril, axilla, vault, concha) are not exported by the Human package (`AutoMovieHumanF1.FAMILIES` holds the families sewn into the figure), so they are not read here",
      "family  knots  fields  groups  accepted  kept  relay",
    ];
    for (const member of AutoMovieHumanF1.FAMILIES) {
      const family: H.IFamily = member.family;
      if (seen.has(family.name)) continue;
      seen.add(family.name);
      const units: S.Unit[] = S.units(family.layout);
      const loo: number[][] = leaveOneOut(family);
      const found: IGroup[] = groups(family, loo).map((g) => {
        const first: number = family.knots.indexOf(g.knots[0]!), last: number = family.knots.indexOf(g.knots.at(-1)!);
        const span: [number, number] = [family.knots[Math.max(0, first - 1)]!, family.knots[Math.min(family.knots.length - 1, last + 1)]!];
        const before: IMiss = miss(family, span, source);
        const after: IMiss = miss(relayed(family, [g]), span, source);
        const accepted: boolean = after.refused <= before.refused && after.folds <= before.folds && after.max <= before.max + WORSE_MM && after.mean <= before.mean;
        return { ...g, span, before, after, accepted };
      });
      const table: string[] = [
        `# ${family.name}: ${family.knots.length} knots, ${family.values.length} fields; leave-one-out difference (stored - laid) at each interior knot, flagged past ${OUTLIER} x the field's median absolute difference and ${FLOOR.mm} mm / ${FLOOR.other}`,
        "field  unit   " + family.knots.slice(1, -1).map((k: number): string => String(k).padStart(9)).join(""),
      ];
      family.values.forEach((field: number[], f: number): void => {
        table.push(String(f).padStart(5) + "  " + units[f]!.padEnd(5) + "  " + field.slice(1, -1).map((x: number, k: number): string => (x - loo[f]![k + 1]!).toFixed(units[f] === "mm" ? 2 : 3).padStart(9)).join(""));
      });
      table.push("", "## groups (knots : fields), worst difference, span, skin before -> after (max / p99 / mean / over 1 mm / folds / refused), verdict");
      for (const g of found)
        table.push(`${g.knots.join(",")} : ${g.fields.join(",")}  worst ${g.worst.toFixed(3)}  span ${g.span.join("-")}  ${f2(g.before.max)}/${f2(g.before.p99)}/${f2(g.before.mean)}/${g.before.over}/${g.before.folds}/${g.before.refused} -> ${f2(g.after.max)}/${f2(g.after.p99)}/${f2(g.after.mean)}/${g.after.over}/${g.after.folds}/${g.after.refused}  ${g.accepted ? "relay" : "kept: a real feature"}`);
      const accepted: IGroup[] = found.filter((g: IGroup): boolean => g.accepted);
      const relay: string = accepted.length === 0 ? "" : "--relay-stored=" + accepted.map((g: IGroup): string => `${g.knots.join(",")}:${g.fields.join(",")}`).join(";");
      await fs.writeFile(path.join(out, family.name + ".flow.txt"), table.join("\n") + "\n");
      await fs.writeFile(path.join(out, family.name + ".relay.txt"), relay + "\n");
      // Before and after frames of the worst three accepted groups, framed on the reference near the group's span.
      const frames: string[] = [];
      for (const [i, g] of [...accepted].sort((a: IGroup, b: IGroup): number => b.worst - a.worst).slice(0, 3).entries()) {
        const wide: [number, number] = [Math.max(family.knots[0]!, g.span[0] - 10), Math.min(family.knots.at(-1)!, g.span[1] + 10)];
        const before: N.Mesh[] = mesh(family, wide, g.span, family.name + ".before");
        const after: N.Mesh[] = mesh(relayed(family, [g]), wide, g.span, family.name + ".after");
        const near: N.Point[] = [];
        for (const m of before) for (let k: number = 0; k < m.positions.length; k += 3 * 7) near.push([m.positions[k]!, m.positions[k + 1]!, m.positions[k + 2]!]);
        if (near.length === 0) continue;
        for (const view of ["front", "left"]) {
          const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
          for (const [stage, shown] of [["reference", reference], ["before", before], ["after", after]] as [string, N.Mesh[]][]) {
            const file: string = `${family.name}.group${i + 1}.${view}.${stage}.png`;
            const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", `f1 | ${family.name} group ${g.knots.join(",")} | ${stage} | ${view}`).png;
            await fs.writeFile(path.join(out, file), png);
            frames.push(file + " " + createHash("sha256").update(png).digest("hex").slice(0, 12));
          }
        }
      }
      if (frames.length > 0) await fs.appendFile(path.join(out, family.name + ".flow.txt"), ["", "## frames", ...frames].join("\n") + "\n");
      summary.push([family.name.padEnd(16), String(family.knots.length).padStart(5), String(family.values.length).padStart(7), String(found.length).padStart(7), String(accepted.length).padStart(9), String(found.length - accepted.length).padStart(5), "  " + (relay || "-")].join(""));
      process.stdout.write(JSON.stringify({ event: "flow-family", family: family.name, groups: found.length, accepted: accepted.length }) + "\n");
    }
    await fs.writeFile(path.join(out, "summary.txt"), summary.join("\n") + "\n");
    process.stdout.write(JSON.stringify({ event: "flow-complete", out }) + "\n");
  }
}

if (/FamilyConicFlow\.c?[jt]s$/.test(process.argv[1] ?? ""))
  FamilyConicFlow.main().catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
