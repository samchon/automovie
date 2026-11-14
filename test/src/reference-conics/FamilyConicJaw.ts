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
 * - The border: in frontal planes (x constant) from the chin back past the jaw's angle, on each side, the point of the skin's outline below
 *   the lower lip (y under 1,505 mm) where it turns most sharply outward (the convex corner between the cheek and the jaw's underside).
 * - Menton (soft tissue, Farkas "gn" region): on the median profile below the lower lip, the chin's lower corner, the point where the profile
 *   turns most sharply outward between the chin's front and the neck.
 * - Gonion: the angle of the jaw, where the lower border runs out into the ramus: the trace's last corner.
 * - The course: gonion, border points about every 15 mm, menton, and their reflections, each set `INSET_MM` inside the edge toward the
 *   jaw's interior (a course point on the skin itself has no ray to read), turned through each joint over `HALF_MM`; its sections read
 *   within `RADIUS_MM` of the course point (`FamilyConicStar`, `radius`).
 *
 * Usage, from `test`: `node <bundle>`; it writes `jaw.txt` under `test/.shots/family-conic-jaw/<stamp>/`.
 */
namespace FamilyConicJaw {
  type V3 = [number, number, number];

  /** How far inside the edge the course runs, mm. */
  export const INSET_MM: number = 8;

  /** Each joint's half turn arclength, mm. */
  export const HALF_MM: number = 6;

  /** How far a border corner may stand from the last one in the next plane, mm, two planes being 2 mm apart. */
  export const STEP_MM: number = 6;

  /** The least outline turn over 4 mm that counts as the border's corner, degrees. */
  export const CORNER_DEG: number = 4;

  /** How far from the course point a section's skin is the region's, mm. */
  export const RADIUS_MM: number = 25;

  /**
   * Every chain of a plane's cut of the skin, open or closed, as world points with each point's outline turn, degrees, read over 2 mm of
   * arclength either side, and whether the corner there is convex: the chord across it passes nearer `inside`, a point well inside the
   * body, than the corner does. Open chains are read too, since the lips' skin is open into the mouth and many planes close no loop.
   */
  function cut(mesh: R.ISource["all"], centres: [V3, V3], up: V3, inside: V3): { world: V3; turn: number; convex: boolean }[] {
    const frame = AutoMovieHumanConicLoft.axis({ centres, halves: [], up }).at(Math.hypot(centres[1][0] - centres[0][0], centres[1][1] - centres[0][1], centres[1][2] - centres[0][2]) / 2);
    const n: V3 = [frame.v[1]! * frame.u[2]! - frame.v[2]! * frame.u[1]!, frame.v[2]! * frame.u[0]! - frame.v[0]! * frame.u[2]!, frame.v[0]! * frame.u[1]! - frame.v[1]! * frame.u[0]!];
    const section: M.ISection = M.outline(mesh, { origin: [...frame.origin] as V3, axes: [n, [...frame.u] as V3, [...frame.v] as V3] }, [0], 0, 0.5, 0)[0]!;
    const world = (p: C.P): V3 => [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!) as V3;
    const distance = (a: V3, b: V3): number => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const out: { world: V3; turn: number; convex: boolean }[] = [];
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
        out.push({ world: p, turn, convex: distance(chord, inside) < distance(p, inside) });
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

    // The border on the +z side, traced back from the chin: in each frontal plane the sharpest outward corner below the lower lip within
    // `STEP_MM` of the last one (the border is one edge, so the next corner of the trace lies beside the last), until no corner sharper
    // than `CORNER_DEG` stands there: the lower border has run out into the ramus, and its last point is gonion (the angle of the jaw).
    const border: { world: V3; turn: number }[] = [];
    for (let x: number = Math.floor(menton.world[0]) - 2; x >= -10; x -= 2) {
      const side = cut(mesh, [[x + 1, 1500, 0], [x - 1, 1500, 0]], [0, 1, 0], [x, 1530, 0]).filter((q) => q.convex && q.world[1] > 1430 && q.world[1] < 1505 && q.world[2] > 4 && q.world[2] < 95);
      const last: V3 | undefined = border.at(-1)?.world;
      const near = last === undefined ? side : side.filter((q) => Math.hypot(q.world[1] - last[1], q.world[2] - last[2]) <= STEP_MM);
      if (near.length === 0) break;
      const best = near.reduce((a, b) => (b.turn > a.turn ? b : a));
      if (best.turn < CORNER_DEG) break;
      border.push(best);
    }
    lines.push("border, +z side, frontal planes (point, outline turn deg):", ...border.map((q) => `  ${f(q.world)} ${q.turn.toFixed(1)}`));
    const gonion = border.at(-1)!;
    lines.push(`gonion ${f(gonion.world)}: the border's last corner sharper than ${CORNER_DEG} deg`);
    // The course: gonion (-z), the border about every 15 mm, menton, and back out to gonion (+z), each set inside the edge.
    const along: V3[] = [];
    let last: number = Infinity;
    for (const q of border) {
      if (q.world[0] < gonion.world[0] - 1e-9) break;
      if (last - q.world[0] >= 15) {
        along.push(q.world);
        last = q.world[0];
      }
    }
    if (along.at(-1) !== gonion.world) along.push(gonion.world);
    const inset = (p: V3): V3 => {
      const d: V3 = [0, 20, -p[2]];
      const l: number = Math.hypot(...d);
      return [p[0] + (INSET_MM * d[0]) / l, p[1] + (INSET_MM * d[1]) / l, p[2] + (INSET_MM * d[2]) / l];
    };
    const plus: V3[] = along.map(inset);
    const centres: V3[] = [...plus.map((p: V3): V3 => [p[0], p[1], -p[2]]).reverse(), inset(menton.world), ...plus];
    const trial: S.ITrial = { label: "jaw", centres, halves: centres.slice(2).map((): number => HALF_MM), up: [0, 1, 0], box: [-1e9, 1e9, -1e9, 1e9, -1e9, 1e9], radius: RADIUS_MM, step: 1 };
    lines.push(`course ${JSON.stringify(centres.map((c: V3) => c.map((x: number): number => Number(x.toFixed(1)))))}, halves ${HALF_MM}, inset ${INSET_MM}, radius ${RADIUS_MM}`);

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

    const out: string = path.join(root, "test/.shots/family-conic-jaw", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "jaw.txt"), lines.join("\n") + "\n");
    process.stdout.write(JSON.stringify({ out }) + "\n" + lines.filter((l: string): boolean => !l.startsWith("  ")).join("\n") + "\n");
  }
}

if (/FamilyConicJaw\.c?[jt]s$/.test(process.argv[1] ?? "")) void FamilyConicJaw.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
