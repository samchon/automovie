import fs from "node:fs";
import path from "node:path";
import type { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanTrunkComposedSection } from "../generation/trunk/AutoMovieHumanTrunkComposedSection";
import type { AutoMovieHumanTrunkMound } from "../generation/trunk/AutoMovieHumanTrunkMound";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type Row = [number, number];

/**
 * f1's own trunk measures read on the reference skin by their published
 * definitions (`node:trunk-measure`), written as a receipt under
 * `.shots/f1_trunk/measure-<stamp>/trunk.json`. Every reading is an exact
 * plane cut of the reference triangles (`NodeTrunkReference.cut`), chained
 * into closed loops; heights are from the reference's floor; X is the
 * reference's own forward axis (no registration: only differences of X are
 * measures). Nothing here feeds generation; the values enter `f1.ts` as the
 * person's measured inputs, each citing this receipt.
 *
 * Readers:
 * - the mid-sagittal profile: at each height (1 mm) the crossings of the
 *   mid-sagittal cut's segments with that horizontal line, the front the
 *   most anterior and the back the most posterior crossing;
 * - the trunk loop at a height: the closed loop of the horizontal cut that
 *   crosses the midline, the longest such (an arm touching the trunk is its
 *   own loop, so the arms drop out without a gap rule);
 * - the front-view shoulder line: per 1 mm of |Z| the highest vertex below
 *   the jaw (Y < 1475).
 *
 * Definitions (ISO 8559-1:2017 clause 3 landmarks, ANSUR 1988 and ANSUR II,
 * Gordon et al. 1989 and 2014; DIERS rasterstereography, Ohlendorf et al.
 * 2023 Sci Rep 13:873 and Bioengineering 2022 PMC9774435):
 * - suprasternale: the deepest point of the jugular notch, the least X of
 *   the front profile between the neck and the manubrium;
 * - cervicale (VP): the C7 spinous process; on a skin with no palpation the
 *   cervicothoracic inflection ICT (steepest backward lean above the
 *   kyphosis apex), which DIERS uses as the kyphosis' upper end;
 * - natural waist: the least trunk-loop girth between rib and iliac crest
 *   (ANSUR 1988 natural indentation); breadth and depth are the loop's
 *   horizontal extents there;
 * - buttock level: the trunk loop's maximum posterior protrusion (ISO 8559-1
 *   5.3.13); hip breadth and buttock depth its extents there;
 * - top hip: midway between the waist and buttock levels (ISO 8559-1 5.3.12);
 * - bust point: the trunk loop's most anterior point; chest breadth and
 *   depth its extents there (ANSUR 1988, at the nipples);
 * - omphalion: the navel's centre, the deepest point of the umbilical pit
 *   behind the trunk loop's anterior extreme on the front profile; the
 *   omphalion girth (taut tape) and depth (caliper) bridge the pit;
 * - crotch length (omphalion), ANSUR II: the taut tape from the front at the
 *   omphalion level through the crotch to the back at the same level, read as
 *   the mid-sagittal cut's convex hull below that level from its front top
 *   vertex through the crotch (lowest point) to its back top vertex;
 * - back line: ICT, the kyphosis apex (most posterior), ITL (steepest
 *   forward lean between the apices), the lordosis apex (most anterior), ILS
 *   (steepest backward lean below it), the PSIS dimples (the deepest paired
 *   paramedian pit); kyphosis angle between the tangents at ICT and ITL,
 *   lordosis angle between ITL and ILS, thoracic bending the chord ICT to the
 *   kyphosis apex from the vertical, trunk length D the distance ICT to the
 *   dimples' middle;
 * - side neck point (ISO 8559-1): where the neck base line meets the
 *   shoulder's top line, read on the front-view shoulder line as the first
 *   |Z| outside the neck where the line's fall per |Z| drops below 1 (the
 *   bisector of the neck's vertical side and the shoulder line).
 */
export namespace NodeTrunkMeasure {
  /** Reads every measure above on f1's reference and writes the receipt. */
  export function run(): void {
    const raw: NodeTrunkReference.IMesh = NodeTrunkReference.load(1);
    const midZ: number = median(raw.points.filter((p: V3): boolean => p[1] > 1000 && p[1] < 1400).map((p: V3): number => p[2]));
    const mesh: NodeTrunkReference.IMesh = { points: raw.points.map((p: V3): V3 => [p[0], p[1], p[2] - midZ]), triangles: raw.triangles };
    const best = <T>(list: T[], key: (t: T) => number): T => list.reduce((a: T, b: T): T => (key(b) < key(a) ? b : a));

    // Trunk loop readings at a height.
    const at = (y: number): ILevel => trunkLevel(mesh, y);
    const scan = (lo: number, hi: number): ILevel[] => {
      const out: ILevel[] = [];
      for (let y: number = lo; y <= hi + 1e-9; y += 2) out.push(at(y));
      return out;
    };

    // The mid-sagittal profile.
    const sagittal: [V3, V3][] = NodeTrunkReference.cut(mesh, [0, 0, 1], 0);
    const rowsOf = (lo: number, hi: number, side: 1 | -1): Row[] => {
      const out: Row[] = [];
      for (let y: number = lo; y <= hi + 1e-9; y += 1) {
        const xs: number[] = crossings(sagittal, y, 1, 0);
        if (xs.length >= 2) out.push([y, side === 1 ? Math.max(...xs) : Math.min(...xs)]);
      }
      return out;
    };
    const front: Row[] = rowsOf(780, 1500, 1);
    const back: Row[] = rowsOf(850, 1530, -1);
    const within = (rows: Row[], lo: number, hi: number): Row[] => rows.filter(([y]: Row): boolean => y >= lo && y <= hi);
    const backAt = (y: number): number => interpolate(back, y);
    const slope = (y: number): number => fitSlope(back.filter(([v]: Row): boolean => Math.abs(v - y) <= 10));

    // Suprasternale.
    const notch: Row = best(within(front, 1370, 1460), (r: Row): number => r[1]);

    // Natural waist, buttock level, top hip, bust point.
    const waistScan: ILevel[] = scan(1000, 1200);
    const waist: ILevel = best(waistScan, (l: ILevel): number => l.hull);
    const seatScan: ILevel[] = scan(840, 960);
    const buttock: ILevel = best(seatScan, (l: ILevel): number => l.minX);
    const topHip: ILevel = at((waist.y + buttock.y) / 2);
    const bustScan: ILevel[] = scan(1180, 1300);
    const bust: ILevel = best(bustScan, (l: ILevel): number => -l.maxX);

    // Omphalion: the deepest pit of the front profile behind the trunk loop's anterior extreme.
    const pit: Row[] = within(front, 980, 1090).map(([y, x]: Row): Row => [y, at(y).maxX - x]);
    const navel: Row = best(pit, (r: Row): number => -r[1]);
    const omphalion: ILevel = at(navel[0]);

    // Crotch length (omphalion) on the sagittal hull.
    const below: [number, number][] = sagittal.flat().filter((p: V3): boolean => p[1] <= navel[0] && p[1] > 600).map((p: V3): [number, number] => [p[0], p[1]]);
    const [, order] = AutoMovieHumanTrunkComposedSection.hull(below);
    const ring: [number, number][] = order.map((i: number): [number, number] => below[i]!);
    const lowest: number = ring.indexOf(best(ring, (p: [number, number]): number => p[1]));
    const topY: number = Math.max(...ring.map((p: [number, number]): number => p[1]));
    const tops: number[] = ring.map((_: [number, number], i: number): number => i).filter((i: number): boolean => ring[i]![1] >= topY - 3);
    const frontTop: number = best(tops, (i: number): number => -ring[i]![0]);
    const backTop: number = best(tops, (i: number): number => ring[i]![0]);
    const walkTo = (to: number): [number, number][] => {
      // The shorter way round from the crotch that does not pass the other top vertex.
      const other: number = to === frontTop ? backTop : frontTop;
      for (const dir of [1, -1]) {
        const out: [number, number][] = [ring[lowest]!];
        let ok: boolean = true;
        for (let s: number = 1; s <= ring.length; ++s) {
          const i: number = (((lowest + dir * s) % ring.length) + ring.length) % ring.length;
          if (i === other) {
            ok = false;
            break;
          }
          out.push(ring[i]!);
          if (i === to) break;
        }
        if (ok) return out;
      }
      return [];
    };
    const length = (list: [number, number][]): number => list.slice(1).reduce((s: number, p: [number, number], i: number): number => s + Math.hypot(p[0] - list[i]![0], p[1] - list[i]![1]), 0);
    const anterior: number = length(walkTo(frontTop));
    const posterior: number = length(walkTo(backTop));

    // Back line.
    const kyphosisApex: Row = best(within(back, 1180, 1400), (r: Row): number => r[1]);
    const lordosisApex: Row = best(within(back, 1000, kyphosisApex[0] - 40), (r: Row): number => -r[1]);
    const itlY: number = best(within(back, lordosisApex[0] + 10, kyphosisApex[0] - 10), (r: Row): number => slope(r[0]))[0];
    const ictY: number = best(within(back, kyphosisApex[0] + 20, 1510), (r: Row): number => -slope(r[0]))[0];
    const ilsY: number = best(within(back, 930, lordosisApex[0] - 10), (r: Row): number => -slope(r[0]))[0];

    // PSIS dimples: per level the back surface X(|z|) (least X per 2 mm of |z| among the trunk loop's
    // points behind the midline back + 40), the pit depth X(z) less the mean of X(z - 16) and X(z + 16).
    const dimples: { y: number; z: number; depth: number }[] = [];
    for (let y: number = 920; y <= 1070; y += 2) {
      const loop: V3[] = at(y).loop;
      const segs: [V3, V3][] = loop.map((p: V3, i: number): [V3, V3] => [p, loop[(i + 1) % loop.length]!]);
      // The back surface X at |z| (both sides averaged): the least X crossing of the line Z = +-z.
      const surface: Map<number, number> = new Map();
      for (let z: number = 2; z <= 90; z += 2) {
        const r: number[] = crossings(segs, z, 2, 0);
        const l: number[] = crossings(segs, -z, 2, 0);
        if (r.length > 0 && l.length > 0) surface.set(z, (Math.min(...r) + Math.min(...l)) / 2);
      }
      for (let z: number = 20; z <= 70; z += 2) {
        const a: number | undefined = surface.get(z);
        const l: number | undefined = surface.get(z - 16);
        const r: number | undefined = surface.get(z + 16);
        if (a !== undefined && l !== undefined && r !== undefined) dimples.push({ y, z, depth: a - (l + r) / 2 });
      }
    }
    const psis: { y: number; z: number; depth: number } = dimples.length > 0 ? best(dimples, (d: { y: number; z: number; depth: number }): number => -d.depth) : { y: NaN, z: NaN, depth: NaN };

    const deg = (r: number): number => (r * 180) / Math.PI;
    const tangent = (y: number): number => deg(Math.atan(slope(y)));
    const ict: Row = [ictY, backAt(ictY)];

    // Front-view shoulder line and the side neck point.
    const line: Map<number, number> = new Map();
    for (const p of mesh.points) {
      if (p[1] >= 1475 || p[1] < 1300 || p[2] < 0) continue;
      const key: number = Math.round(p[2]);
      const v: number | undefined = line.get(key);
      if (v === undefined || p[1] > v) line.set(key, p[1]);
    }
    const shoulder: Row[] = [...line.entries()].sort((a: Row, b: Row): number => a[0] - b[0]);
    const fall = (z: number): number => -fitSlope(shoulder.filter(([v]: Row): boolean => Math.abs(v - z) <= 4).map(([a, b]: Row): Row => [a, b]));
    const snp: Row | undefined = shoulder.find(([z]: Row): boolean => z >= 40 && z <= 100 && interpolate(shoulder, z) < 1474 && fall(z) < 1);

    // Quarter fullness of f1's trunk loops at S00's sites, about S00's section axis there (world X of its
    // course, carried into the reference's raw X by the registration's translation, -26.80): each quarter
    // is the conic from its midline point A (front or back crossing of Z = 0) to its lateral point B (the
    // axis X, the side's largest |Z|), C the corner (A's X, B's Z), M the chord's midpoint; the shoulder
    // share rho = |MS| / |MC| with S the loop's crossing of the ray M -> C (the ellipse is 0.414).
    const dx: number = -26.8;
    const sites: [string, number, number][] = [
      ["hip", 886, 0],
      ["iliac", 940, 0],
      ["top hip", 993, 0],
      ["omphalion", 1048, 0],
      ["waist", 1100, 0],
      ["lower ribs", 1150, -1.8],
      ["underbust", 1202, -11.0],
      ["chest", 1254, -26.1],
    ];
    const quarters = sites.map(([name, y, axisWorld]: [string, number, number]): Record<string, unknown> => {
      const l: ILevel = at(y);
      const axis: number = axisWorld - dx;
      const segs: [V3, V3][] = l.loop.map((p: V3, i: number): [V3, V3] => [p, l.loop[(i + 1) % l.loop.length]!]);
      const rho = (ax: number, side: 1 | -1): number => {
        const zs: number[] = l.loop.filter((p: V3): boolean => Math.sign(p[2]) === side).map((p: V3): number => Math.abs(p[2]));
        const half: number = Math.max(...zs) * side;
        const m: [number, number] = [(ax + axis) / 2, half / 2];
        const c: [number, number] = [ax, half];
        const d: [number, number] = [c[0] - m[0], c[1] - m[1]];
        let best: number = Infinity;
        for (const [p, q] of segs) {
          const e: [number, number] = [q[0] - p[0], q[2] - p[2]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: [number, number] = [p[0] - m[0], p[2] - m[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < best) best = t;
        }
        return best;
      };
      return { name, y, axisWorld, frontWorld: l.front + dx, backWorld: l.back + dx, half: l.half, rho: { frontRight: rho(l.front, 1), backRight: rho(l.back, 1), backLeft: rho(l.back, -1), frontLeft: rho(l.front, -1) } };
    });

    // Reverse extraction (owner, 2026-11-08 15:35): f1's outlines and quarter shares every 5 mm in world
    // coordinates, reduced to knots within 0.5 mm (Douglas-Peucker on the height profile, the knot keeping
    // the sample's central-difference slope). S00's course X (world): the hip vertical to the waist, the
    // quintic smoothstep to the acromia's X (-48.26) at 1395.2.
    const courseX = (y: number): number => {
      if (y <= 1100) return 0;
      const t: number = Math.min(1, (y - 1100) / (1395.2 - 1100));
      return -48.26 * (t * t * t * (10 - 15 * t + 6 * t * t));
    };
    const sample: { y: number; front: number; back: number; half: number; rf: number; rb: number }[] = [];
    for (let y: number = 805; y <= 1455; y += 5) {
      const l: ILevel = at(y);
      if (l.loop.length < 3) continue;
      const near: V3[] = l.loop.filter((p: V3): boolean => Math.abs(p[2]) <= 12);
      const front: number = Math.max(...near.map((p: V3): number => p[0])) + dx;
      const back: number = (y < 960 ? Math.min(...near.map((p: V3): number => p[0])) : Math.min(...l.loop.filter((p: V3): boolean => Math.abs(p[2]) < 100).map((p: V3): number => p[0]))) + dx;
      const axis: number = courseX(y) - dx;
      const segs: [V3, V3][] = l.loop.map((p: V3, i: number): [V3, V3] => [p, l.loop[(i + 1) % l.loop.length]!]);
      const share = (ax: number): number => {
        const half: number = Math.max(...l.loop.filter((p: V3): boolean => p[2] > 0).map((p: V3): number => p[2]));
        const m: [number, number] = [(ax + axis) / 2, half / 2];
        const d: [number, number] = [ax - m[0], half - m[1]];
        let bestT: number = Infinity;
        for (const [p, q] of segs) {
          const e: [number, number] = [q[0] - p[0], q[2] - p[2]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: [number, number] = [p[0] - m[0], p[2] - m[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < bestT) bestT = t;
        }
        return bestT;
      };
      sample.push({ y, front, back, half: l.half, rf: y <= 1265 ? share(front - dx) : NaN, rb: y <= 1265 ? share(back - dx) : NaN });
    }
    const reduce = (rows: [number, number][], tol: number): [number, number, number][] => {
      const keep: boolean[] = rows.map((_: [number, number], i: number): boolean => i === 0 || i === rows.length - 1);
      const dp = (a: number, b: number): void => {
        let worst: number = -1;
        let at: number = -1;
        for (let i: number = a + 1; i < b; ++i) {
          const t: number = (rows[i]![0] - rows[a]![0]) / (rows[b]![0] - rows[a]![0]);
          const e: number = Math.abs(rows[i]![1] - (rows[a]![1] + t * (rows[b]![1] - rows[a]![1])));
          if (e > worst) [worst, at] = [e, i];
        }
        if (worst > tol) {
          keep[at] = true;
          dp(a, at);
          dp(at, b);
        }
      };
      dp(0, rows.length - 1);
      return rows
        .map((r: [number, number], i: number): [number, number, number] => {
          const p: [number, number] = rows[Math.max(0, i - 1)]!;
          const n: [number, number] = rows[Math.min(rows.length - 1, i + 1)]!;
          return [r[0], round(r[1]), Math.round(((n[1] - p[1]) / (n[0] - p[0])) * 1000) / 1000];
        })
        .filter((_: [number, number, number], i: number): boolean => keep[i]!);
    };
    const series = (key: "front" | "back" | "half" | "rf" | "rb", lo: number, hi: number): [number, number][] =>
      sample.filter((s: (typeof sample)[number]): boolean => s.y >= lo && s.y <= hi && Number.isFinite(s[key])).map((s: (typeof sample)[number]): [number, number] => [s.y, s[key]]);
    const extract = {
      front: reduce(series("front", 835, 1415), 0.5),
      back: reduce(series("back", 880, 1455), 0.5),
      half: reduce(series("half", 835, 1265), 0.5),
      backLessFront: reduce(sample.filter((s: (typeof sample)[number]): boolean => s.y >= 960 && s.y <= 1195 && Number.isFinite(s.rf) && Number.isFinite(s.rb)).map((s: (typeof sample)[number]): [number, number] => [s.y, s.rb - s.rf]), 0.02),
    };

    // The breast through its apex: the paramedian front profile at Z = 90.5 (half f1's bust point width)
    // from 1170 to 1360, and the bust level's front x(|z|) from the midline out to 150 (world X).
    const paramedian: [V3, V3][] = NodeTrunkReference.cut(mesh, [0, 0, 1], 90.5);
    const breastSide: number[][] = [];
    for (let y: number = 1170; y <= 1360; y += 5) {
      const xs: number[] = crossings(paramedian, y, 1, 0).filter((x: number): boolean => x > 0);
      if (xs.length > 0) breastSide.push([y, round(Math.max(...xs) + dx)]);
    }
    const bustLoop: V3[] = at(1254).loop;
    const bustSegs: [V3, V3][] = bustLoop.map((p: V3, i: number): [V3, V3] => [p, bustLoop[(i + 1) % bustLoop.length]!]);
    const breastAcross: number[][] = [];
    for (let z: number = 0; z <= 150; z += 5) {
      const xs: number[] = crossings(bustSegs, z, 2, 0);
      if (xs.length > 0) breastAcross.push([z, round(Math.max(...xs) + dx)]);
    }
    // The shoulder levels with the arm cut away: the loop's points within S00's lateral half there (the
    // armscye side), each quarter's share about S00's course with that half as the lateral reach.
    const shoulderHalf = (y: number): number => (y <= 1405 ? 150 + ((1405 - y) / 10) * 20 : y <= 1425 ? 150 - ((y - 1405) / 20) * 45 : y <= 1446 ? 105 - ((y - 1425) / 21) * 35 : 70 - ((y - 1446) / 12) * 20);
    const shoulderQuarters: Record<string, number>[] = [];
    for (const y of [1400, 1415, 1430, 1445]) {
      const half: number = shoulderHalf(y);
      const kept: V3[] = at(y).loop.filter((p: V3): boolean => Math.abs(p[2]) <= half);
      const segs: [V3, V3][] = [];
      for (let i: number = 0; i + 1 < kept.length; ++i) if (Math.hypot(kept[i + 1]![0] - kept[i]![0], kept[i + 1]![2] - kept[i]![2]) < 15) segs.push([kept[i]!, kept[i + 1]!]);
      const mid: number[] = crossings(segs, 0, 2, 0);
      if (mid.length < 2) continue;
      const fx: number = Math.max(...mid);
      const bx: number = Math.min(...mid);
      const axis: number = courseX(y) - dx;
      const shareAt = (ax: number, side: 1 | -1): number => {
        const m: [number, number] = [(ax + axis) / 2, (side * half) / 2];
        const d: [number, number] = [ax - m[0], side * half - m[1]];
        let bestT: number = Infinity;
        for (const [p, q] of segs) {
          const e: [number, number] = [q[0] - p[0], q[2] - p[2]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: [number, number] = [p[0] - m[0], p[2] - m[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < bestT) bestT = t;
        }
        return bestT;
      };
      shoulderQuarters.push({ y, half, front: round(fx + dx), back: round(bx + dx), rhoFront: Math.round(shareAt(fx, 1) * 1000) / 1000, rhoBack: Math.round(shareAt(bx, 1) * 1000) / 1000 });
    }

    // The breast column through her apex (58 mm from the midline, the bust level's most anterior point).
    const column: [V3, V3][] = NodeTrunkReference.cut(mesh, [0, 0, 1], 58);
    const breastColumn: number[][] = [];
    for (let y: number = 1180; y <= 1360; y += 5) {
      const xs: number[] = crossings(column, y, 1, 0).filter((x: number): boolean => x > 0);
      if (xs.length > 0) breastColumn.push([y, round(Math.max(...xs) + dx)]);
    }
    // The shoulder bar, 1395 to 1455 every 10 mm: the front-view top line's reach at that height (the largest
    // |z| whose top stands at or above it), the midline front and back reach of the uncut loop, and each
    // quarter's share on the loop cut by that reach (the arm side) and, above IJ, by the neck cylinder
    // (50 mm about the neck's centre X, -30.5 world: midway between IJ and C7).
    const reachAt = (y: number): number => Math.max(...shoulder.filter(([z, top]: Row): boolean => z >= 40 && z <= 230 && top >= y).map(([z]: Row): number => z));
    const bar: Record<string, number>[] = [];
    for (let y: number = 1395; y <= 1455; y += 10) {
      const half: number = reachAt(y);
      const loop: V3[] = at(y).loop;
      const near: V3[] = loop.filter((p: V3): boolean => Math.abs(p[2]) <= 12);
      if (near.length === 0) continue;
      const fx: number = Math.max(...near.map((p: V3): number => p[0]));
      const bx: number = Math.min(...loop.filter((p: V3): boolean => Math.abs(p[2]) < 100).map((p: V3): number => p[0]));
      const neck: number = -30.5 - dx;
      const kept: V3[] = loop.filter((p: V3): boolean => Math.abs(p[2]) <= half && !(y > 1416 && Math.hypot(p[0] - neck, p[2]) < 50));
      const segs: [V3, V3][] = [];
      for (let i: number = 0; i + 1 < kept.length; ++i) if (Math.hypot(kept[i + 1]![0] - kept[i]![0], kept[i + 1]![2] - kept[i]![2]) < 15) segs.push([kept[i]!, kept[i + 1]!]);
      const axis: number = courseX(y) - dx;
      const shareAt = (ax: number): number => {
        const m: [number, number] = [(ax + axis) / 2, half / 2];
        const d: [number, number] = [ax - m[0], half - m[1]];
        let bestT: number = Infinity;
        for (const [p, q] of segs) {
          const e: [number, number] = [q[0] - p[0], q[2] - p[2]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: [number, number] = [p[0] - m[0], p[2] - m[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (t > 0 && u >= 0 && u <= 1 && t < bestT) bestT = t;
        }
        return bestT;
      };
      bar.push({ y, half, front: round(fx + dx), back: round(bx + dx), rhoFront: Math.round(shareAt(fx) * 1000) / 1000, rhoBack: Math.round(shareAt(bx) * 1000) / 1000 });
    }

    const receipt = {
      breastColumn,
      bar,
      breast: { side: breastSide, across: breastAcross },
      shoulderQuarters,
      extract,
      quarters,
      person: "f1",
      method: "exact plane cuts of test/.shots/f1/reference-model.json (NodeTrunkReference.cut) chained into closed loops; mid-sagittal plane at Z = median trunk vertex Z; reference X unregistered (differences only)",
      midZ,
      suprasternale: { height: notch[0], x: notch[1] },
      cervicale: { height: ict[0], x: ict[1], definition: "cervicothoracic inflection ICT (no palpation on a skin)" },
      neckBase: { depth: notch[1] - ict[1], rise: ict[0] - notch[0], sideNeckPoint: snp === undefined ? null : { height: snp[1], half: snp[0], breadth: 2 * snp[0] } },
      naturalWaist: pick(waist),
      buttock: pick(buttock),
      topHip: pick(topHip),
      bust: pick(bust),
      omphalion: { ...pick(omphalion), pitDepth: navel[1] },
      crotch: { length: anterior + posterior, anterior, posterior, lowest: ring[lowest], frontTop: ring[frontTop], backTop: ring[backTop] },
      backLine: {
        ict,
        kyphosisApex,
        itl: [itlY, backAt(itlY)],
        lordosisApex,
        ils: [ilsY, backAt(ilsY)],
        psis: { y: psis.y, z: psis.z, pitDepth: psis.depth, x: backAt(psis.y) },
        tangents: { ict: tangent(ictY), itl: tangent(itlY), ils: tangent(ilsY), psis: tangent(psis.y) },
        kyphosisAngle: tangent(ictY) - tangent(itlY),
        lordosisAngle: tangent(ilsY) - tangent(itlY),
        thoracicBending: deg(Math.atan2(ict[1] - kyphosisApex[1], ict[0] - kyphosisApex[0])),
        trunkLength: Math.hypot(ict[0] - psis.y, ict[1] - backAt(psis.y)),
      },
      shoulderLine: shoulder.filter(([z]: Row): boolean => z % 10 === 0),
      // The sparse coordinates for S00's f1 lines: heights above the floor, X ahead of the back midline
      // at the PSIS dimples' level (the S00 origin chain's skin datum), every 10 mm.
      lines: ((): Record<string, unknown> => {
        const x0: number = backAt(psis.y);
        const rel = (rows: Row[]): number[][] => rows.filter(([y]: Row): boolean => y % 10 === 0).map(([y, x]: Row): number[] => [y, round(x - x0)]);
        const half: number[][] = [];
        let last: number = NaN;
        for (let y: number = 810; y <= 1300; y += 10) {
          const h: number = at(y).half;
          if (Number.isFinite(last) && h - last > 20) break;
          half.push([y, round(h)]);
          last = h;
        }
        return { psisBackX: x0, front: rel(within(front, 800, notch[0] + 10)), back: rel(within(back, 800, 1530)), half, shoulder: shoulder.filter(([z]: Row): boolean => z % 5 === 0).map(([z, y]: Row): number[] => [z, round(y)]) };
      })(),
      scans: {
        waist: waistScan.map((l: ILevel): number[] => [l.y, round(l.hull)]),
        seat: seatScan.map((l: ILevel): number[] => [l.y, round(l.minX), round(l.maxX), round(l.half), round(l.hull)]),
        bust: bustScan.map((l: ILevel): number[] => [l.y, round(l.maxX), round(l.half), round(l.hull)]),
        front: front.filter(([y]: Row): boolean => y % 10 === 0),
        back: back.filter(([y]: Row): boolean => y % 10 === 0),
      },
    };
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_trunk/measure-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "trunk.json"), JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify({ ...receipt, scans: undefined }, null, 1));
    console.log(out);
  }

  /**
   * f1's relief heights over S00's own wall (`--reliefs`): S00 built for f1
   * (`AutoMovieHumanTrunkS00.of`), its wall without reliefs; at each sample the
   * wall point and her skin along a direction (the line's nearest crossing of
   * her exact horizontal cut, registered X: raw - 26.8). The shoulder caps:
   * radial from the axis, heights 1395 to 1435, phases pi/2 - 0.7 to
   * pi/2 + 0.9, her loop cut at S00's lateral reach + 15 mm (the arm) and,
   * above IJ, the neck cylinder. The right breast: along its mound's axis,
   * heights 1200 to 1335, arcs -60 to +120 mm from its apex phase.
   */
  export async function reliefs(): Promise<void> {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    // `--floor`: S00 with its bottom band turned through her forks (AutoMovieHumanTrunkViewCurves.IOptions.floor).
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters, AutoMovieHumanBodyAnatomy.resolve(person.parameters), { floor: process.argv.includes("--floor") });
    const source: AutoMovieHumanTrunkComposedSection.ISource = { ...s00.curves.source, reliefs: [] };
    const raw: NodeTrunkReference.IMesh = NodeTrunkReference.load(1);
    const midZ: number = median(raw.points.filter((p: V3): boolean => p[1] > 1000 && p[1] < 1400).map((p: V3): number => p[2]));
    const mesh: NodeTrunkReference.IMesh = { points: raw.points.map((p: V3): V3 => [p[0] - 26.8, p[1], p[2] - midZ]), triangles: raw.triangles };
    const axisX = (y: number): number => source.axis?.(y) ?? s00.curves.axis.xs;
    const wall = (y: number, phi: number): [number, number] => {
      const r: number = AutoMovieHumanTrunkComposedSection.radius(source, y, phi);
      return [axisX(y) + r * Math.cos(phi), r * Math.sin(phi)];
    };
    const along = (segs: [V3, V3][], p: [number, number], d: [number, number]): number => {
      let best: number = NaN;
      for (const [a, b] of segs) {
        const e: [number, number] = [b[0] - a[0], b[2] - a[2]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (Math.abs(den) < 1e-12) continue;
        const w: [number, number] = [a[0] - p[0], a[2] - p[1]];
        const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
        const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
        if (u >= 0 && u <= 1 && !(Math.abs(t) >= Math.abs(best))) best = t;
      }
      return best;
    };
    const ijY: number = s00.datums.frames.heights.suprasternale;
    const caps: number[][] = [];
    for (let y: number = 1395; y <= 1435; y += 10) {
      const reach: number = AutoMovieHumanTrunkComposedSection.read(source.lateral, y) + 15;
      const loop: V3[] = trunkLevel(mesh, y).loop.filter((p: V3): boolean => Math.abs(p[2]) <= reach && !(y > ijY && Math.hypot(p[0] + 30.5, p[2]) < 50));
      const segs: [V3, V3][] = [];
      for (let i: number = 0; i + 1 < loop.length; ++i) if (Math.hypot(loop[i + 1]![0] - loop[i]![0], loop[i + 1]![2] - loop[i]![2]) < 15) segs.push([loop[i]!, loop[i + 1]!]);
      for (let phi: number = Math.PI / 2 - 0.7; phi <= Math.PI / 2 + 0.9 + 1e-9; phi += 0.05) {
        const w: [number, number] = wall(y, phi);
        caps.push([y, round(phi * 1000) / 1000, round(w[0]), round(w[1]), round(along(segs, w, [Math.cos(phi), Math.sin(phi)]))]);
      }
    }
    // A mound's height table over the wall along its own axis (the relief's motion): rows of heights at
    // `ys`, columns at arcs `as` (mm, positive lateral) from its apex phase.
    // The wall point in the world on the station's actual plane (a turned plane in the bottom band), and her
    // horizontal cut at that point's height: the relief's axis is horizontal, so the reading stays in that cut.
    const placed = (s: number, phi: number): V3 => {
      const f: { origin: readonly number[]; u: readonly number[]; v: readonly number[] } = s00.curves.axis.turn.frame(s);
      const r: number = AutoMovieHumanTrunkComposedSection.radius(source, s, phi);
      return [0, 1, 2].map((k: number): number => f.origin[k]! + r * Math.cos(phi) * f.u[k]! + r * Math.sin(phi) * f.v[k]!) as V3;
    };
    const read = (m: AutoMovieHumanTrunkMound.ISpec | undefined, ys: number[], as: number[]): { station: number; phase: number; radius: number; v: number[]; a: number[]; h: number[][] } | null => {
      if (m === undefined) return null;
      const d: [number, number] = [Math.cos(m.phase), Math.sin(m.phase)];
      const h: number[][] = ys.map((y: number): number[] =>
        as.map((a: number): number => {
          const p: V3 = placed(y, m.phase + (m.lateral * a) / m.radius);
          return round(along(NodeTrunkReference.cut(mesh, [0, 1, 0], p[1]), [p[0], p[2]], d));
        }),
      );
      return { station: m.station, phase: m.phase, radius: m.radius, v: ys.map((y: number): number => y - m.station), a: as, h };
    };
    const steps = (lo: number, hi: number, step: number): number[] => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_: unknown, k: number): number => lo + k * step);
    const find = (name: string): AutoMovieHumanTrunkMound.ISpec | undefined => s00.curves.mounds.find((m: AutoMovieHumanTrunkMound.ISpec): boolean => m.name === name);
    // Each window ends where her residual over the wall is near zero (render trunk-2026-11-08T08-10-38-440Z:
    // a window cropped on a large residual draws its fade as a crease). The breast with the upper chest and
    // the shoulder bar's front up to 1440 (nothing left there), medially to the midline (50 mm of arc),
    // laterally to 160 (behind the lateral line: the port above 1296, about 1 mm below it).
    const breastTable = read(find("breast.right"), steps(1190, 1440, 10), steps(-50, 160, 10));
    // The thigh root's front from the open bottom up the groin and the hip's front to 1100 (the 1060 row
    // still read -5 medially, render trunk-2026-11-08T08-26-19-926Z), from the midline (80 mm of arc medial,
    // 7 mm short of it) to 90 lateral (short of the buttock window).
    const thighTable = read(find("thigh.right"), steps(Math.ceil(s00.curves.bottom), 1100, 10), steps(-80, 90, 10));
    // The buttock in its law's window: from the open bottom to the crest, from the cleft to the lateral line.
    const buttockTable = read(find("buttock.right"), steps(Math.ceil(s00.curves.bottom), 1040, 10), steps(-55, 120, 10));
    // Her mid-sagittal crotch line: the z = 0 cut's points below 875 between the thighs, ordered front to
    // back (descending X along the arc), reduced within 0.5 mm by Douglas-Peucker on the polyline.
    const sagittal: [V3, V3][] = NodeTrunkReference.cut(mesh, [0, 0, 1], 0).filter(([a, b]: [V3, V3]): boolean => a[1] < 875 && b[1] < 875 && a[1] > 700 && Math.abs(a[0]) < 160);
    const loops: V3[][] = chain(sagittal).sort((a: V3[], b: V3[]): number => b.length - a.length);
    const arc: V3[] = loops[0] ?? [];
    const ordered: V3[] = arc.length > 1 && arc[0]![0] < arc[arc.length - 1]![0] ? [...arc].reverse() : arc;
    const crotch: number[][] = simplify(
      ordered.map((p: V3): [number, number] => [p[0], p[1]]),
      0.5,
    ).map(([x, y]: [number, number]): number[] => [round(x), round(y)]);
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_trunk2/reliefs-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "reliefs.json"), JSON.stringify({ caps, breast: breastTable, thigh: thighTable, buttock: buttockTable, crotch }));
    console.log(out);
  }

  /** Douglas-Peucker on an open polyline: the points kept so every dropped one lies within `tol` of its chord. */
  function simplify(points: [number, number][], tol: number): [number, number][] {
    if (points.length < 3) return points;
    const keep: boolean[] = points.map((_: [number, number], i: number): boolean => i === 0 || i === points.length - 1);
    const dp = (a: number, b: number): void => {
      const [ax, ay] = points[a]!;
      const [bx, by] = points[b]!;
      const len: number = Math.hypot(bx - ax, by - ay) || 1;
      let worst: number = -1;
      let at: number = -1;
      for (let i: number = a + 1; i < b; ++i) {
        const e: number = Math.abs((bx - ax) * (ay - points[i]![1]) - (ax - points[i]![0]) * (by - ay)) / len;
        if (e > worst) [worst, at] = [e, i];
      }
      if (worst > tol) {
        keep[at] = true;
        dp(a, at);
        dp(at, b);
      }
    };
    dp(0, points.length - 1);
    return points.filter((_: [number, number], i: number): boolean => keep[i]!);
  }

  /** The trunk loop's readings at one height. */
  interface ILevel {
    /** Height, mm. */
    y: number;

    /** The loop's points. */
    loop: V3[];

    /** Most anterior and most posterior X. */
    maxX: number;
    minX: number;

    /** Half breadth, the largest |Z|. */
    half: number;

    /** Taut-tape perimeter (convex hull in the plane). */
    hull: number;

    /** Midline front and back X (the loop's crossings of Z = 0). */
    front: number;
    back: number;
  }

  function pick(l: ILevel): Record<string, number> {
    return { height: l.y, girth: l.hull, breadth: 2 * l.half, depth: l.maxX - l.minX, midlineFront: l.front, midlineBack: l.back, maxX: l.maxX, minX: l.minX };
  }

  /** The longest closed loop of the horizontal cut at `y` that crosses Z = 0. */
  function trunkLevel(mesh: NodeTrunkReference.IMesh, y: number): ILevel {
    const loops: V3[][] = chain(NodeTrunkReference.cut(mesh, [0, 1, 0], y));
    const crossing: V3[][] = loops.filter((l: V3[]): boolean => l.some((p: V3): boolean => p[2] > 0) && l.some((p: V3): boolean => p[2] < 0));
    const loop: V3[] = crossing.reduce((a: V3[], b: V3[]): V3[] => (perimeter(b) > perimeter(a) ? b : a), crossing[0] ?? []);
    const segs: [V3, V3][] = loop.map((p: V3, i: number): [V3, V3] => [p, loop[(i + 1) % loop.length]!]);
    const mid: number[] = crossings(segs, 0, 2, 0);
    return {
      y,
      loop,
      maxX: Math.max(...loop.map((p: V3): number => p[0])),
      minX: Math.min(...loop.map((p: V3): number => p[0])),
      half: Math.max(...loop.map((p: V3): number => Math.abs(p[2]))),
      hull: AutoMovieHumanTrunkComposedSection.hull(loop.map((p: V3): [number, number] => [p[0], p[2]]))[0],
      front: mid.length ? Math.max(...mid) : NaN,
      back: mid.length ? Math.min(...mid) : NaN,
    };
  }

  /** Chains cut segments into closed loops by their shared end points (keys rounded to 1e-4 mm). */
  function chain(segments: [V3, V3][]): V3[][] {
    const key = (p: V3): string => `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)},${Math.round(p[2] * 1e4)}`;
    const ends: Map<string, number[]> = new Map();
    segments.forEach(([a, b]: [V3, V3], i: number): void => {
      for (const p of [a, b]) {
        const k: string = key(p);
        const list: number[] | undefined = ends.get(k);
        if (list === undefined) ends.set(k, [i]);
        else list.push(i);
      }
    });
    const used: boolean[] = segments.map((): boolean => false);
    const loops: V3[][] = [];
    for (let s: number = 0; s < segments.length; ++s) {
      if (used[s]) continue;
      used[s] = true;
      const loop: V3[] = [segments[s]![0]];
      let tip: V3 = segments[s]![1];
      for (;;) {
        loop.push(tip);
        const next: number | undefined = (ends.get(key(tip)) ?? []).find((i: number): boolean => !used[i]);
        if (next === undefined) break;
        used[next] = true;
        const [a, b] = segments[next]!;
        tip = key(a) === key(tip) ? b : a;
      }
      loops.push(loop);
    }
    return loops;
  }

  /** Coordinate `out` of the crossings of the segments with the line where coordinate `axis` equals `v`. */
  function crossings(segments: [V3, V3][], v: number, axis: number, out: number): number[] {
    const xs: number[] = [];
    for (const [a, b] of segments) {
      const sa: number = a[axis]! - v;
      const sb: number = b[axis]! - v;
      if ((sa < 0 && sb >= 0) || (sa >= 0 && sb < 0)) xs.push(a[out]! + ((b[out]! - a[out]!) * sa) / (sa - sb));
    }
    return xs;
  }

  function perimeter(loop: V3[]): number {
    return loop.slice(1).reduce((s: number, p: V3, i: number): number => s + Math.hypot(p[0] - loop[i]![0], p[2] - loop[i]![2]), 0);
  }

  function interpolate(rows: Row[], y: number): number {
    for (let i: number = 1; i < rows.length; ++i) {
      const [y0, x0] = rows[i - 1]!;
      const [y1, x1] = rows[i]!;
      if (y >= y0 && y <= y1) return y1 === y0 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
    return NaN;
  }

  /** Least-squares slope of the rows' second coordinate on their first. */
  function fitSlope(rows: Row[]): number {
    const my: number = mean(rows.map(([y]: Row): number => y));
    const mx: number = mean(rows.map(([, x]: Row): number => x));
    let num: number = 0;
    let den: number = 0;
    for (const [y, x] of rows) {
      num += (y - my) * (x - mx);
      den += (y - my) ** 2;
    }
    return den === 0 ? NaN : num / den;
  }

  function mean(values: number[]): number {
    return values.length === 0 ? NaN : values.reduce((s: number, v: number): number => s + v, 0) / values.length;
  }

  function median(values: number[]): number {
    const s: number[] = [...values].sort((a: number, b: number): number => a - b);
    return s[Math.floor(s.length / 2)] ?? 0;
  }

  function round(x: number): number {
    return Math.round(x * 10) / 10;
  }
}

if (process.argv.includes("--reliefs"))
  void NodeTrunkMeasure.reliefs().catch((error: unknown): void => {
    console.error(error);
    process.exitCode = 1;
  });
else NodeTrunkMeasure.run();
