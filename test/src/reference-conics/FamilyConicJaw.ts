import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieMeshExtract as M } from "@automovie/engine";
import { AutoMovieHumanConicLoft } from "@automovie/human";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicStar as S } from "./FamilyConicStar";

/**
 * The jaw's lower border read off the reference, its landmarks by their definitions, and the star check of a course along it.
 *
 * Face modelling treats the jawline as the loop between face and neck, from the ear along the jaw to the chin and back, with rings round
 * the chin and the neck; under the chin the trunk's level sections fold all along that edge (F7, "a bright jagged line under the jaw"). So
 * the chin's family runs along the jaw's lower border, its sections cut across the edge, each a wedge of cheek above and neck below.
 *
 * - The border: in frontal planes (x constant) from the chin back past the jaw's angle, the face-to-neck line, where the skin's outward
 *   normal turns from facing sideways or forward to facing down: on each side the most lateral point below the lower lip (y under 1,505 mm)
 *   whose normal stands `DOWN_DEG` below the horizontal. A corner rule followed only the chin's lower corner, since the mandible's border
 *   is too soft a corner: it stopped at x 56, z 31, short of the angle near x 20, z 55.
 * - Menton (soft tissue, Farkas "gn" region): on the median profile below the lower lip, the chin's lower corner, the point where the profile
 *   turns most sharply outward between the chin's front and the neck.
 * - Gonion (soft tissue, Farkas "go"): the border's most lateral point near the jaw's angle.
 * - The course: a smooth curve (centripetal Catmull-Rom) through the border set `INSET_MM` inside the edge toward the jaw's interior, from
 *   gonion to menton and out to the other gonion; a jointed course turned sharply at menton, and its sections there crossed each other. Its
 *   sections reach `RADIUS_MM`, and on a turn's inner side no farther than the local bend radius; every skin point within `COVER_MM` of
 *   the face-to-neck line must lie in an admitted section.
 *
 * Usage, from `test`: `node <bundle>`; it writes `jaw.txt` under `test/.shots/family-conic-jaw/<stamp>/`.
 */
namespace FamilyConicJaw {
  type V3 = [number, number, number];

  /** How far inside the edge the course runs, mm. */
  export const INSET_MM: number = 8;

  /** The face-to-neck line's normal, degrees below the horizontal: half way from facing sideways (0) to facing down (90). */
  export const DOWN_DEG: number = 45;

  /** How near `DOWN_DEG` a point's normal must stand to lie on the line, degrees: the outline's points are about 1 to 3 mm apart. */
  export const DOWN_BAND_DEG: number = 8;

  /** How far apart the course's control points stand, mm. */
  export const CONTROL_MM: number = 10;

  /** How far a border point may stand from the last one in the next plane, mm, two planes being 2 mm apart. */
  export const STEP_MM: number = 6;

  /** The mouth's corner, mm forward: in front of it the border is read below the lower lip (y 1,505), behind it up to the ear lobe. */
  export const MOUTH_CORNER_X: number = 95;

  /** The ear lobe's lower edge, mm high (the ear's plate starts at 1,538): behind the mouth's corner the border is read below it. */
  export const LOBE_Y: number = 1538;

  /** How far apart the course is sampled, mm. */
  export const SAMPLE_MM: number = 2;

  /** The arc over which the course's bend radius is read, mm either side. */
  export const BEND_SPAN_MM: number = 6;

  /** Each sampled joint's half turn arclength, mm, under half the sample spacing so the turns do not overlap. */
  export const JOINT_HALF_MM: number = 0.2;

  /** How far either side of the face-to-neck line the coverage proof reads the skin, mm: the sections' reach. */
  export const COVER_MM: number = 25;

  /** How far from the course point a section's skin is the region's, mm. */
  export const RADIUS_MM: number = 25;

  /**
   * Every chain of a plane's cut of the skin, open or closed, as world points with each point's outline turn, degrees, read over 2 mm of
   * arclength either side, and whether the corner there is convex: the chord across it passes nearer `inside`, a point well inside the
   * body, than the corner does. Open chains are read too, since the lips' skin is open into the mouth and many planes close no loop.
   */
  function cut(mesh: R.ISource["all"], centres: [V3, V3], up: V3, inside: V3): { world: V3; turn: number; convex: boolean; down: number; lateral: number }[] {
    const frame = AutoMovieHumanConicLoft.axis({ centres, halves: [], up }).at(Math.hypot(centres[1][0] - centres[0][0], centres[1][1] - centres[0][1], centres[1][2] - centres[0][2]) / 2);
    const n: V3 = [frame.v[1]! * frame.u[2]! - frame.v[2]! * frame.u[1]!, frame.v[2]! * frame.u[0]! - frame.v[0]! * frame.u[2]!, frame.v[0]! * frame.u[1]! - frame.v[1]! * frame.u[0]!];
    const section: M.ISection = M.outline(mesh, { origin: [...frame.origin] as V3, axes: [n, [...frame.u] as V3, [...frame.v] as V3] }, [0], 0, 0.5, 0)[0]!;
    const world = (p: C.P): V3 => [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!) as V3;
    const distance = (a: V3, b: V3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const out: { world: V3; turn: number; convex: boolean; down: number; lateral: number }[] = [];
    for (const piece of section.loops) {
      const points: V3[] = piece.points.map(world);
      const m: number = points.length;
      const reach = (i: number, step: number): number | null => {
        let j: number = i;
        let arc: number = 0;
        while (arc < 2) {
          const k: number = piece.closed ? (j + step + m) % m : j + step;
          if (k < 0 || k >= m || Math.abs(j + step - i) > m / 4) return null;
          arc += distance(points[k]!, points[j]!);
          j = k;
        }
        return j;
      };
      points.forEach((p: V3, i: number): void => {
        const a: number | null = reach(i, -1);
        const b: number | null = reach(i, 1);
        if (a === null || b === null) return;
        const u: V3 = [p[0] - points[a]![0], p[1] - points[a]![1], p[2] - points[a]![2]];
        const w: V3 = [points[b]![0] - p[0], points[b]![1] - p[1], points[b]![2] - p[2]];
        const turn: number = (Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1] + u[2] * w[2]) / (Math.hypot(...u) * Math.hypot(...w))))) * 180) / Math.PI;
        const chord: V3 = [(points[a]![0] + points[b]![0]) / 2, (points[a]![1] + points[b]![1]) / 2, (points[a]![2] + points[b]![2]) / 2];
        // The outward normal in the plane, square to the chord across the point and away from `inside`; `down` is its angle below the
        // horizontal, degrees (90 facing straight down), `lateral` its sideways share.
        const tangent: V3 = [points[b]![0] - points[a]![0], points[b]![1] - points[a]![1], points[b]![2] - points[a]![2]];
        let normal: V3 = [n[1] * tangent[2] - n[2] * tangent[1], n[2] * tangent[0] - n[0] * tangent[2], n[0] * tangent[1] - n[1] * tangent[0]];
        if (normal[0] * (p[0] - inside[0]) + normal[1] * (p[1] - inside[1]) + normal[2] * (p[2] - inside[2]) < 0) normal = [-normal[0], -normal[1], -normal[2]];
        const length: number = Math.hypot(...normal);
        out.push({ world: p, turn, convex: distance(chord, inside) < distance(p, inside), down: (Math.asin(Math.max(-1, Math.min(1, -normal[1] / length))) * 180) / Math.PI, lateral: Math.abs(normal[2]) / length });
      });
    }
    return out;
  }
  /** Read the border, the landmarks and the course, and star-check the course. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    // The skin alone: the mouth's lining (8,350 triangles), the eyeballs and the lashes are detached pieces, and the lining's corners
    // inside the mouth read sharper than the jaw's. Its open chains are read (`cut`), since the lips' skin is open into the mouth.
    const mesh: R.ISource["all"] = S.components(source.all, 20000).mesh;
    const lines: string[] = [];
    const f = (v: readonly number[]): string => "[" + v.map((x: number): string => x.toFixed(1)).join(", ") + "]";

    // Menton: the median profile's sharpest outward turn below the lower lip, between the chin's front and the neck.
    const profile = cut(mesh, [[40, 1530, -1], [40, 1530, 1]], [1, 0, 0], [40, 1530, 0]).filter((q) => q.convex && q.world[0] > 40 && q.world[0] < 125 && q.world[1] > 1440 && q.world[1] < 1505);
    const menton = profile.reduce((a, b) => (b.turn > a.turn ? b : a));
    lines.push(`menton ${f(menton.world)}, profile turn ${menton.turn.toFixed(1)} deg over 4 mm`);

    // The border on the +z side: in each frontal plane from the chin back, the face-to-neck line, where the skin's outward normal turns from
    // facing sideways or forward to facing down, read as the most lateral point below the lower lip whose normal stands `DOWN_DEG` below the
    // horizontal (the cheek above it faces outward; the jaw's underside below it faces down, and the neck under that faces outward again,
    // nearer the median plane).
    const border: { world: V3; down: number }[] = [];
    let misses: number = 0;
    for (let x: number = Math.floor(menton.world[0]) - 2; x >= -10; x -= 2) {
      // Below the lower lip in front of the mouth's corner; behind it, up to the ear lobe's lower edge, where the border rises to the angle.
      const top: number = x >= MOUTH_CORNER_X ? 1505 : LOBE_Y;
      const side = cut(mesh, [[x + 1, 1500, 0], [x - 1, 1500, 0]], [0, 1, 0], [x, 1530, 0]).filter((q) => q.world[1] > 1430 && q.world[1] < top && q.world[2] > 4 && q.world[2] < 95 && Math.abs(q.down - DOWN_DEG) <= DOWN_BAND_DEG);
      // The trace is one line: the first plane's point is the one nearest menton, every later one within `STEP_MM` of the last.
      const last: V3 = border.at(-1)?.world ?? menton.world;
      const near = border.length === 0 ? side : side.filter((q) => Math.hypot(q.world[1] - last[1], q.world[2] - last[2]) <= STEP_MM);
      if (near.length === 0) {
        if (++misses >= 3 && border.length > 0) break;
        continue;
      }
      misses = 0;
      const best = border.length === 0 ? near.reduce((a, b) => (Math.hypot(b.world[1] - last[1], b.world[2] - last[2]) < Math.hypot(a.world[1] - last[1], a.world[2] - last[2]) ? b : a)) : near.reduce((a, b) => (b.world[2] > a.world[2] ? b : a));
      border.push({ world: best.world, down: best.down });
    }
    lines.push(`border, +z side, frontal planes (point, normal's angle below the horizontal, deg), at ${DOWN_DEG} +- ${DOWN_BAND_DEG} deg:`, ...border.map((q) => `  ${f(q.world)} ${q.down.toFixed(1)}`));

    // Gonion (soft tissue, Farkas "go"): the border's most lateral point near the jaw's angle, behind x 50.
    const gonion = border.filter((q) => q.world[0] < 50).reduce((a, b) => (b.world[2] > a.world[2] ? b : a), border.at(-1)!);
    lines.push(`gonion ${f(gonion.world)}: the border's most lateral point behind x 50`);

    // The course: a smooth curve through the inset border from gonion to menton and its reflection, the centripetal Catmull-Rom spline
    // through control points `CONTROL_MM` apart or more, sampled every `SAMPLE_MM`; its bend radius is read over `BEND_SPAN_MM`.
    const inset = (p: V3): V3 => {
      const d: V3 = [0, 20, -p[2]];
      const l: number = Math.hypot(...d);
      return [p[0] + (INSET_MM * d[0]) / l, p[1] + (INSET_MM * d[1]) / l, p[2] + (INSET_MM * d[2]) / l];
    };
    const half: V3[] = border.filter((q) => q.world[0] >= gonion.world[0] - 1e-9).map((q) => inset(q.world)).reverse();
    // The course through control points `spacing` apart: the dense samples, and its least bend radius with where it falls.
    const course = (spacing: number): { dense: V3[]; bend: number; bendAt: V3; controls: number; ring: number } => {
      const controls: V3[] = [];
      for (const p of [...half, inset(menton.world)]) if (controls.length === 0 || Math.hypot(p[0] - controls.at(-1)![0], p[1] - controls.at(-1)![1], p[2] - controls.at(-1)![2]) >= spacing) controls.push(p);
      const ring: V3[] = [...controls, ...controls.slice(0, -1).reverse().map((p: V3): V3 => [p[0], p[1], -p[2]])];
      const spline = (p0: V3, p1: V3, p2: V3, p3: V3, u: number): V3 => {
        const knot = (a: V3, b: V3): number => Math.sqrt(Math.max(1e-9, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])));
        const t1: number = knot(p0, p1), t2: number = t1 + knot(p1, p2), t3: number = t2 + knot(p2, p3);
        const t: number = t1 + u * (t2 - t1);
        const lerp = (a: V3, b: V3, ta: number, tb: number): V3 => [0, 1, 2].map((c: number): number => ((tb - t) * a[c]! + (t - ta) * b[c]!) / (tb - ta)) as V3;
        const a1: V3 = lerp(p0, p1, 0, t1), a2: V3 = lerp(p1, p2, t1, t2), a3: V3 = lerp(p2, p3, t2, t3);
        return lerp(lerp(a1, a2, 0, t2), lerp(a2, a3, t1, t3), t1, t2);
      };
      const dense: V3[] = [];
      for (let k: number = 0; k + 1 < ring.length; ++k) {
        const p0: V3 = ring[Math.max(0, k - 1)]!, p1: V3 = ring[k]!, p2: V3 = ring[k + 1]!, p3: V3 = ring[Math.min(ring.length - 1, k + 2)]!;
        const steps: number = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]) / SAMPLE_MM));
        for (let j: number = 0; j < steps; ++j) dense.push(spline(k === 0 ? [2 * p1[0] - p2[0], 2 * p1[1] - p2[1], 2 * p1[2] - p2[2]] : p0, p1, p2, k + 2 >= ring.length ? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1], 2 * p2[2] - p1[2]] : p3, j / steps));
      }
      dense.push(ring.at(-1)!);
      // Samples closer than half the spacing (a control segment's last step) are dropped, so every joint's turn fits its segments.
      for (let k: number = dense.length - 2; k > 0; --k) if (Math.hypot(dense[k + 1]![0] - dense[k]![0], dense[k + 1]![1] - dense[k]![1], dense[k + 1]![2] - dense[k]![2]) < SAMPLE_MM / 2) dense.splice(k, 1);
      let bend: number = Infinity;
      let bendAt: V3 = dense[0]!;
      const span: number = Math.max(1, Math.round(BEND_SPAN_MM / SAMPLE_MM));
      for (let k: number = span; k + span < dense.length; ++k) {
        const a: V3 = dense[k - span]!, p: V3 = dense[k]!, b: V3 = dense[k + span]!;
        const ab: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), ap: number = Math.hypot(p[0] - a[0], p[1] - a[1], p[2] - a[2]), pb: number = Math.hypot(b[0] - p[0], b[1] - p[1], b[2] - p[2]);
        const cross: number = Math.hypot((p[1] - a[1]) * (b[2] - a[2]) - (p[2] - a[2]) * (b[1] - a[1]), (p[2] - a[2]) * (b[0] - a[0]) - (p[0] - a[0]) * (b[2] - a[2]), (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]));
        const radius: number = cross < 1e-9 ? Infinity : (ab * ap * pb) / (2 * cross);
        if (radius < bend) {
          bend = radius;
          bendAt = p;
        }
      }
      return { dense, bend, bendAt, controls: controls.length, ring: ring.length };
    };
    // The jaw's U at menton is real anatomy: smoothed down to three control points it still bent at 9.4 mm against the 25 mm reach. So the
    // course keeps the border's control points, and the sections' reach on each turn's inner side is the local bend radius (`inner`), where
    // neighbouring sections meet; the outer side keeps the whole reach, and the coverage below shows no skin is left unread.
    const spacing: number = CONTROL_MM;
    const laid = course(spacing);
    const { dense, bend, bendAt } = laid;
    const centres: V3[] = dense;
    const trial: S.ITrial = { label: "jaw", centres, halves: centres.slice(2).map((): number => JOINT_HALF_MM), up: [0, 1, 0], box: [-1e9, 1e9, -1e9, 1e9, -1e9, 1e9], radius: RADIUS_MM, inner: true, step: 1 };
    lines.push(`course: control points ${spacing} mm apart, ${laid.controls} a side (${laid.ring} in all), ${dense.length} samples ${SAMPLE_MM} mm apart; least bend radius ${bend.toFixed(1)} mm at ${f(bendAt)}; reach ${RADIUS_MM} mm, on a turn's inner side the local bend radius`);
    // Star share and closure share per station.
    const length: number = centres.slice(1).reduce((sum: number, c: V3, k: number): number => sum + Math.hypot(c[0] - centres[k]![0], c[1] - centres[k]![1], c[2] - centres[k]![2]), 0);
    const sections = S.regionSections(source, trial, 0, length, mesh);
    const axis = AutoMovieHumanConicLoft.axis({ centres, halves: trial.halves!, up: trial.up });
    lines.push(`star-shaped sections ${sections.length} of ${Math.floor(length) + 1} stations (1 mm apart over ${length.toFixed(1)} mm)`);
    for (const section of sections) lines.push(`  ${section.s.toFixed(1).padStart(6)}  ${S.measure(section, axis.at(section.s))}`);
    const covered: number[] = sections.map((section): number => section.s);
    const missing: number[] = [];
    for (let s: number = 0; s <= length + 1e-9; s += 1) if (!covered.includes(s)) missing.push(s);
    lines.push(`stations with no star-shaped piece: ${missing.length === 0 ? "none" : missing.join(", ")}`);

    // Coverage: every skin point of the jaw region, within `COVER_MM` of the face-to-neck line on either side, lies in at least one admitted
    // section: within half a station of its plane and inside its reach.
    const line: V3[] = [...border.map((q) => [q.world[0], q.world[1], -q.world[2]] as V3).reverse(), menton.world, ...border.map((q) => q.world)];
    const toLine = (v: V3): number => {
      let best: number = Infinity;
      for (let k: number = 0; k + 1 < line.length; ++k) {
        const a: V3 = line[k]!, b: V3 = line[k + 1]!;
        const e: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const l2: number = e[0] * e[0] + e[1] * e[1] + e[2] * e[2];
        const u: number = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((v[0] - a[0]) * e[0] + (v[1] - a[1]) * e[1] + (v[2] - a[2]) * e[2]) / l2));
        best = Math.min(best, Math.hypot(v[0] - a[0] - u * e[0], v[1] - a[1] - u * e[1], v[2] - a[2] - u * e[2]));
      }
      return best;
    };
    const admitted = sections.map((section) => ({ s: section.s, frame: axis.at(section.s), reach: S.reach(trial, axis, section.s) }));
    const used: Set<number> = new Set(Array.from(mesh.indices));
    let region: number = 0, read: number = 0;
    const unread: Map<string, number> = new Map();
    for (const i of used) {
      const v: V3 = [mesh.positions[i * 3]!, mesh.positions[i * 3 + 1]!, mesh.positions[i * 3 + 2]!];
      if (v[0] < -20 || v[0] > 130 || v[1] < 1420 || v[1] > 1560 || Math.abs(v[2]) > 100 || toLine(v) > COVER_MM) continue;
      ++region;
      const hit: boolean = admitted.some(({ frame, reach }) => {
        const q: V3 = [v[0] - frame.origin[0]!, v[1] - frame.origin[1]!, v[2] - frame.origin[2]!];
        const n: V3 = [frame.u[1]! * frame.v[2]! - frame.u[2]! * frame.v[1]!, frame.u[2]! * frame.v[0]! - frame.u[0]! * frame.v[2]!, frame.u[0]! * frame.v[1]! - frame.u[1]! * frame.v[0]!];
        if (Math.abs(q[0] * n[0] + q[1] * n[1] + q[2] * n[2]) > trial.step / 2) return false;
        return reach.inside([q[0] * frame.u[0]! + q[1] * frame.u[1]! + q[2] * frame.u[2]!, q[0] * frame.v[0]! + q[1] * frame.v[1]! + q[2] * frame.v[2]!]);
      });
      if (hit) ++read;
      else {
        const key: string = `x ${Math.round(v[0] / 10) * 10}, ${v[2] >= 0 ? "+z" : "-z"}`;
        unread.set(key, (unread.get(key) ?? 0) + 1);
      }
    }
    lines.push(`coverage: ${read} of ${region} skin points within ${COVER_MM} mm of the face-to-neck line lie in an admitted section (${((100 * read) / Math.max(1, region)).toFixed(1)}%)`);
    if (unread.size > 0) lines.push(`  unread by place: ${[...unread.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => `${key}: ${count}`).join("; ")}`);

    // The jaw's angle, x 20 to 40: the reference's own normal on the +z side, the lateral-most point within the band round 45 degrees and
    // the lateral-most point of all, to show whether the line runs on past the trace's end.
    lines.push("the angle, x 20 to 40, +z side (z 35 to 80, y 1,480 to 1,550): lateral-most point near 45 deg (its down angle), lateral-most of all (its down angle)");
    for (let x: number = 40; x >= 20; x -= 2) {
      const side = cut(mesh, [[x + 1, 1500, 0], [x - 1, 1500, 0]], [0, 1, 0], [x, 1530, 0]).filter((q) => q.world[2] > 35 && q.world[2] < 80 && q.world[1] > 1480 && q.world[1] < 1550);
      if (side.length === 0) {
        lines.push(`  x ${x}: no skin`);
        continue;
      }
      const band = side.filter((q) => Math.abs(q.down - DOWN_DEG) <= DOWN_BAND_DEG);
      const near = band.length === 0 ? null : band.reduce((a, b) => (b.world[2] > a.world[2] ? b : a));
      const most = side.reduce((a, b) => (b.world[2] > a.world[2] ? b : a));
      lines.push(`  x ${x}: ${near === null ? "none near 45 deg" : `${f(near.world)} ${near.down.toFixed(1)}`}; lateral-most ${f(most.world)} ${most.down.toFixed(1)}`);
    }

    const out: string = path.join(root, "test/.shots/family-conic-jaw", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "jaw.txt"), lines.join("\n") + "\n");
    // The course as a trial for `FamilyConicStar`, whose report names why a station has no star-shaped piece.
    await fs.writeFile(path.join(out, "jaw.trial.json"), JSON.stringify([trial]));
    process.stdout.write(JSON.stringify({ out }) + "\n" + lines.filter((l: string): boolean => !l.startsWith("  ")).join("\n") + "\n");
  }
}

if (/FamilyConicJaw\.c?[jt]s$/.test(process.argv[1] ?? "")) void FamilyConicJaw.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
