import { FamilyConicNearest as Nearest } from "./FamilyConicNearest";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import {
  AutoMovieLoftViewFullSource as Full,
  AutoMovieViewChain,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
} from "@automovie/human";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1Armscye as Armscye,
  AutoMovieHumanF1Joints,
  AutoMovieHumanF1Placement,
} from "@automovie/human/capture";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionWidth,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieSolidSurface,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The armscye as a shared-loop join, pre-checked on f1's two generated fields before anything is built (the Human skill's Shared
 * Connections: every premise the operator admits on, read from `AutoMovieConstructionSharedLoop` and `AutoMovieSolidSharedCurve`).
 *
 * A mixed join (`IAutoMovieConstructionJoin.loop`) declares one closed loop on the host's chart and asks that the part's face pass
 * through it within the join's tolerance all round, that the part keep one side, and that each fold width fit. This tool measures how
 * far today's trunk and arm sources are from that, with no loft and no mesh: both are read as their complete native sources, reliefs
 * included.
 *
 * For each sagittal plane `z = c` (the record's armscye plane stands at 151 mm; the arm's first knot at 153, its rail at 163):
 * - the trunk's skin cut by the plane, one front and one back point per trunk station where the skin reaches the plane;
 * - the arm's own section in that plane, its course's first run being square to it, so the arm's station is `c` less the course's first
 *   centre's `z`;
 * - both in the arm's chart there: for each trunk cut point its polar angle and radius about the arm's course point, the arm's radius
 *   at that angle, the gap between them (positive where the trunk's skin stands outside the arm's), and the turn between the two
 *   surfaces' normals.
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicArmscyeJoin.cjs`. It prints its tables.
 */
namespace FamilyConicArmscyeJoin {
  type V = [number, number, number];
  const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const cross = (a: readonly number[], b: readonly number[]): V => [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const unit = (a: readonly number[]): V => {
    const l: number = Math.hypot(a[0]!, a[1]!, a[2]!);
    return [a[0]! / l, a[1]! / l, a[2]! / l];
  };

  /** Planes read, mm from the median plane. */
  const PLANES: readonly number[] = [151, 153, 158, 163];

  /** Trunk stations read, mm on its course: from under the armpit's crease to above the shoulder's top. */
  const STATIONS: { from: number; to: number; step: number } = { from: 440, to: 670, step: 2 };

  /** A surface normal that may point either way: the two sources' chart orientations are not compared here, only the planes' turn. */
  const normal = (jet: IAutoMovieSolidSurface.IJet): V => unit(cross(jet.u, jet.v));

  /** The phase in `[low, high]` where the trunk's skin at `station` stands at `z = c`, by bisection; null when the ends do not bracket it. */
  function phaseAt(trunk: IAutoMovieLoftViewFullSource.IReader, station: number, c: number, low: number, high: number): number | null {
    const f = (t: number): number => trunk.point(station, t)[2]! - c;
    let [a, b]: [number, number] = [low, high];
    let [fa, fb]: [number, number] = [f(a), f(b)];
    if (!(fa * fb <= 0)) return null;
    for (let k: number = 0; k < 60; ++k) {
      const m: number = (a + b) / 2;
      const fm: number = f(m);
      if (fa * fm <= 0) [b, fb] = [m, fm];
      else [a, fa] = [m, fm];
    }
    return (a + b) / 2;
  }

  /** Measure and print every plane's table. */
  /**
   * `--contact [--arm=<arm.family.json>] [--carried=<mm>]`: the contact of any arm family with the stored trunk, read without a ring or
   * a plane, so it holds for a course that leaves the trunk obliquely. At every fifth arm phase: every station, from the family's first
   * knot less `carried` to 200 mm past it, at which the arm's skin changes side of the trunk's skin (`out` leaving the trunk's solid,
   * `in` entering it), and at the first `out` the point, its and its trunk drop's signed distance to the reference's skin, and the turn
   * between the two surfaces' normals.
   */
  async function contact(trunkPart: IAutoMovieViewPart): Promise<void> {
    const file: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--arm="))?.slice(6);
    // `--part=<family>`: any stored family of the figure in place of the arm (a breast, a nose), read against the trunk the same way.
    const named: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--part="))?.slice(7);
    const stored: IAutoMovieHumanConicLoft.IFamily | undefined = named === undefined ? AutoMovieHumanF1.BODY.arm : AutoMovieHumanF1.FAMILIES.find((m: IAutoMovieHumanF1.IMember): boolean => m.family.name === named)?.family;
    if (stored === undefined) throw new Error("--part: the figure has no family named " + named);
    const family: IAutoMovieHumanConicLoft.IFamily = file === undefined ? stored : (JSON.parse(await fs.readFile(file, "utf8")) as IAutoMovieHumanConicLoft.IFamily);
    const carried: number = Number(process.argv.find((a: string): boolean => a.startsWith("--carried="))?.slice(10) ?? 0);
    const from: number = family.knots[0]! - carried;
    const reach: number = Math.min(200, family.knots.at(-1)! - from);
    const armPart: IAutoMovieViewPart = H.part({ ...family, tips: undefined }, Array.from({ length: 101 }, (_: unknown, i: number): number => from + (reach * i) / 100));
    const [arm, trunk]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(armPart), Full.create(trunkPart)];
    const grid: Nearest.IGrid = Nearest.grid([(await R.load(path.resolve(process.cwd(), ".."))).all]);
    const foot: IAutoMovieLoftSectionFrame = trunkPart.axis.at(0);
    const tangent: V = unit(cross(foot.v, foot.u));
    const address = (p: readonly number[]): [number, number, number] => {
      const q: V = sub(p, foot.origin);
      return [dot(q, tangent), Math.atan2(dot(q, foot.v), dot(q, foot.u)), Math.hypot(dot(q, foot.u), dot(q, foot.v))];
    };
    const depth = (p: readonly number[]): number => {
      const [s, t, r]: [number, number, number] = address(p);
      if (s < trunk!.domain[0] || s > trunk!.domain[1]) return -r;
      const skin: V = sub(trunk!.point(s, t), trunkPart.axis.at(s).origin);
      return Math.hypot(dot(skin, foot.u), dot(skin, foot.v)) - r;
    };
    const near = (x: readonly number[]): string => (Nearest.distance(grid, [x[0]!, x[1]!, x[2]!])?.toFixed(2) ?? "far");
    const out: string[] = [`== contact of ${family.name} "${file ?? "stored"}" (knots ${family.knots[0]} to ${family.knots.at(-1)}, carried ${carried} mm) with the stored trunk ==`];
    out.push("arm phase deg | crossings (station:way) | first out: point x, y, z | arm to reference mm | trunk drop to reference mm | turn deg");
    for (let k: number = 0; k < 72; ++k) {
      const phase: number = (2 * Math.PI * k) / 72;
      const at = (s: number): number => depth(arm!.point(s, phase));
      const crossings: [number, string][] = [];
      let previous: number = at(from);
      const step: number = reach / 400;
      for (let s: number = from + step; s <= from + reach; s += step) {
        const d: number = at(s);
        if (previous * d <= 0 && previous !== d) {
          let [lo, hi]: [number, number] = [s - step, s];
          for (let i: number = 0; i < 40; ++i) {
            const m: number = (lo + hi) / 2;
            if (at(lo) * at(m) <= 0) hi = m;
            else lo = m;
          }
          crossings.push([(lo + hi) / 2, previous > 0 ? "out" : "in"]);
        }
        previous = d;
      }
      const first: [number, string] | undefined = crossings.find((c: [number, string]): boolean => c[1] === "out");
      let detail: string = `starts ${at(from) > 0 ? "inside" : "outside"} by ${Math.abs(at(from)).toFixed(2)}; no out`;
      if (first !== undefined) {
        const p: readonly number[] = arm!.point(first[0], phase);
        const [s, t]: [number, number, number] = address(p);
        const drop: readonly number[] = trunk!.point(s, t);
        const turn: number = Math.acos(Math.min(1, Math.abs(dot(normal(trunk!.jet(s, t)), normal(arm!.jet(first[0], phase))))));
        detail = `${p[0]!.toFixed(1)}, ${p[1]!.toFixed(1)}, ${p[2]!.toFixed(1)} | ${near(p)} | ${near(drop)} | ${((turn * 180) / Math.PI).toFixed(1)}`;
      }
      out.push(`${k * 5} | ${crossings.map((c: [number, string]): string => c[0].toFixed(1) + ":" + c[1]).join(" ") || "none"} | ${detail}`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  /**
   * `--groove`: the axillary folds as forms on the reference. Each level section of the reference's body from the armpit's apex to the
   * shoulder's top is one loop with the arm as a lobe (Wang 2005, Fig. 3); between the chest and the arm it turns inward, in front (the
   * anterior fold's groove) and behind (the posterior's). On the +Z side each groove is read as the pocket under the loop's convex hull:
   * the hull edge that bridges it, its length (the groove's width at the skin), the deepest point under it and that depth.
   */
  async function groove(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const out: string[] = ["== the axillary folds on the reference, level sections, +Z side ==", "height mm | side | bridge from x, z to x, z | width mm | deepest point x, z | depth mm"];
    for (let y: number = 1270; y <= 1410; y += 10) {
      // The largest closed loop of the cut: above the armpit it holds the trunk and both arms.
      const loops: [number, number][][] = R.loops(source.body, { origin: [0, y, 0], u: [1, 0, 0], v: [0, 0, 1] }) as [number, number][][];
      const loop: [number, number][] | undefined = loops.sort((p: [number, number][], q: [number, number][]): number => Math.abs(R.area(q)) - Math.abs(R.area(p)))[0];
      if (loop === undefined) {
        out.push(`${y} | no closed loop`);
        continue;
      }
      const hull: [number, number][] = R.hull(loop) as [number, number][];
      let any: boolean = false;
      for (let k: number = 0; k < hull.length; ++k) {
        const [a, b]: [number, number][] = [hull[k]!, hull[(k + 1) % hull.length]!];
        const width: number = Math.hypot(b![0] - a![0], b![1] - a![1]);
        if (width < 8 || Math.min(a![1], b![1]) < 60) continue;

        // The loop's points between the bridge's ends, by their distance under the bridge.
        const normal: [number, number] = [-(b![1] - a![1]) / width, (b![0] - a![0]) / width];
        let deepest: [number, number] = a!;
        let depth: number = 0;
        const index = (q: [number, number]): number => loop.findIndex((p: [number, number]): boolean => p[0] === q[0] && p[1] === q[1]);
        const [ia, ib]: [number, number] = [index(a!), index(b!)];
        if (ia < 0 || ib < 0) continue;

        // The loop's own run under the bridge: the shorter way round between the bridge's two ends.
        const forward: number = (ib - ia + loop.length) % loop.length;
        const [start, count]: [number, number] = forward <= loop.length / 2 ? [ia, forward] : [ib, loop.length - forward];
        for (let i: number = 1; i < count; ++i) {
          const p: [number, number] = loop[(start + i) % loop.length]!;
          const under: number = Math.abs((p[0] - a![0]) * normal[0] + (p[1] - a![1]) * normal[1]);
          if (under > depth) [depth, deepest] = [under, p];
        }
        if (depth < 1) continue;
        any = true;
        out.push(`${y} | ${(a![0] + b![0]) / 2 > -15 ? "front" : "back"} | ${a![0].toFixed(1)}, ${a![1].toFixed(1)} to ${b![0].toFixed(1)}, ${b![1].toFixed(1)} | ${width.toFixed(1)} | ${deepest[0].toFixed(1)}, ${deepest[1].toFixed(1)} | ${depth.toFixed(1)}`);
      }
      if (!any) out.push(`${y} | no pocket of 1 mm or more lateral of z = 60`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  export async function main(): Promise<void> {
    if (process.argv.includes("--groove")) return groove();
    if (process.argv.includes("--contact")) {
      const trunkFile: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--trunk="))?.slice(8);
      const stored: IAutoMovieViewPart | undefined =
        trunkFile === undefined
          ? AutoMovieHumanF1.construction().sources.get("trunk")
          : H.part({ ...(JSON.parse(await fs.readFile(trunkFile, "utf8")) as IAutoMovieHumanConicLoft.IFamily), name: "trunk" }, Array.from({ length: 222 }, (_: unknown, i: number): number => 28 + 4 * i));
      if (stored === undefined) throw new Error("f1 has no trunk source");
      return contact(stored);
    }
    const sources: ReadonlyMap<string, IAutoMovieViewPart> = AutoMovieHumanF1.construction().sources;
    const [trunkPart, armPart]: (IAutoMovieViewPart | undefined)[] = [sources.get("trunk"), sources.get("arm")];
    if (trunkPart === undefined || armPart === undefined) throw new Error("f1 has no trunk or arm source: " + [...sources.keys()].join(", "));
    const [trunk, arm]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(trunkPart), Full.create(armPart)];
    const out: string[] = [];
    out.push(`trunk domain ${trunk!.domain.join(" to ")} mm, reliefs ${(trunkPart.reliefs ?? []).length}; arm domain ${arm!.domain.join(" to ")} mm, reliefs ${(armPart.reliefs ?? []).length}`);
    const root: IAutoMovieLoftSectionFrame = armPart.axis.at(arm!.domain[0]);
    out.push(`arm course at its first station: origin [${root.origin.map((x: number): string => x.toFixed(2)).join(", ")}]`);
    for (const c of PLANES) {
      const station: number = arm!.domain[0] + (c - root.origin[2]!);
      out.push("");
      out.push(`== plane z = ${c} mm; arm station ${station.toFixed(2)} ==`);
      if (station < arm!.domain[0] || station > arm!.domain[1]) {
        out.push("the arm's source does not reach this plane");
        continue;
      }
      const frame: IAutoMovieLoftSectionFrame = armPart.axis.at(station);
      const tangent: V = unit(cross(frame.v, frame.u));
      out.push(`arm section plane normal [${tangent.map((x: number): string => x.toFixed(4)).join(", ")}] (the sagittal plane's is [0, 0, 1])`);

      // The arm's radius by polar angle in its own chart, from 720 phases of its section.
      const ring: { angle: number; radius: number; phase: number }[] = Array.from({ length: 720 }, (_: unknown, k: number): { angle: number; radius: number; phase: number } => {
        const phase: number = (2 * Math.PI * k) / 720;
        const q: V = sub(arm!.point(station, phase), frame.origin);
        return { angle: Math.atan2(dot(q, frame.v), dot(q, frame.u)), radius: Math.hypot(dot(q, frame.u), dot(q, frame.v)), phase };
      });
      const armAt = (angle: number): { radius: number; phase: number } => {
        let best: { angle: number; radius: number; phase: number } = ring[0]!;
        let least: number = Infinity;
        for (const p of ring) {
          const d: number = Math.abs(Math.atan2(Math.sin(p.angle - angle), Math.cos(p.angle - angle)));
          if (d < least) [least, best] = [d, p];
        }
        return best;
      };

      // The trunk's cut: at each station the phase of its widest point, then one root in front of it and one behind.
      out.push("trunk station | side | point x, y | arm-chart angle deg | trunk radius | arm radius | gap (trunk - arm) | turn between normals deg");
      let reached: number = 0;
      let [least, most]: [number, number] = [Infinity, -Infinity];
      for (let s: number = STATIONS.from; s <= STATIONS.to; s += STATIONS.step) {
        let widest: number = Math.PI / 2;
        let width: number = -Infinity;
        for (let k: number = 1; k < 64; ++k) {
          const t: number = (Math.PI * k) / 64;
          const z: number = trunk!.point(s, t)[2]!;
          if (z > width) [width, widest] = [z, t];
        }
        if (width < c) continue;
        ++reached;
        for (const [side, low, high] of [["front", 0.01, widest], ["back", widest, Math.PI - 0.01]] as const) {
          const t: number | null = phaseAt(trunk!, s, c, low, high);
          if (t === null) continue;
          const p: readonly number[] = trunk!.point(s, t);
          const q: V = sub(p, frame.origin);
          const angle: number = Math.atan2(dot(q, frame.v), dot(q, frame.u));
          const radius: number = Math.hypot(dot(q, frame.u), dot(q, frame.v));
          const own: { radius: number; phase: number } = armAt(angle);
          const turn: number = Math.acos(Math.min(1, Math.abs(dot(normal(trunk!.jet(s, t)), normal(arm!.jet(station, own.phase))))));
          const gap: number = radius - own.radius;
          [least, most] = [Math.min(least, gap), Math.max(most, gap)];
          if (s % 10 === 0)
            out.push(`${s} | ${side} | ${p[0]!.toFixed(1)}, ${p[1]!.toFixed(1)} | ${((angle * 180) / Math.PI).toFixed(1)} | ${radius.toFixed(2)} | ${own.radius.toFixed(2)} | ${gap.toFixed(2)} | ${((turn * 180) / Math.PI).toFixed(1)}`);
        }
      }
      out.push(`trunk stations whose skin reaches the plane: ${reached}; gap from ${least.toFixed(2)} to ${most.toFixed(2)} mm`);
    }

    // Under the arm the plane's cut runs inside the arm's tube, so the two walls cross there instead of sharing a line. Where: along
    // each station line of the arm that faces the trunk, the first station at which the arm's skin leaves the trunk's solid. The trunk's
    // sections are level about its vertical course, so a point's trunk station is its height above the course's foot and its phase the
    // polar angle of (x, z); it is inside where it stands nearer the course than the trunk's skin at that address.
    const foot: IAutoMovieLoftSectionFrame = trunkPart.axis.at(0);
    const depth = (p: readonly number[]): number | null => {
      const q: V = sub(p, foot.origin);
      const s: number = dot(q, unit(cross(foot.v, foot.u)));
      if (s < trunk!.domain[0] || s > trunk!.domain[1]) return null;
      const t: number = Math.atan2(dot(q, foot.v), dot(q, foot.u));
      const skin: V = sub(trunk!.point(s, t), trunkPart.axis.at(s).origin);
      return Math.hypot(dot(skin, foot.u), dot(skin, foot.v)) - Math.hypot(dot(q, foot.u), dot(q, foot.v));
    };
    out.push("");
    out.push("== where the arm's wall leaves the trunk's solid, by arm phase ==");
    out.push("arm phase deg | arm station of the crossing | point x, y, z | turn between normals deg (none: the station line is outside the trunk from the arm's first station, or inside to 140 mm)");
    for (let k: number = 0; k < 36; ++k) {
      const phase: number = (2 * Math.PI * k) / 36;
      const inside = (s: number): number | null => depth(arm!.point(s, phase));
      const first: number | null = inside(arm!.domain[0]);
      let found: string = first === null ? "outside the trunk's stations" : first <= 0 ? `outside at the first station by ${(-first).toFixed(2)} mm` : "inside to 140 mm";
      if (first !== null && first > 0)
        for (let s: number = arm!.domain[0] + 1; s <= 140; s += 1) {
          const d: number | null = inside(s);
          if (d === null || d > 0) continue;
          let [a, b]: [number, number] = [s - 1, s];
          for (let i: number = 0; i < 50; ++i) {
            const m: number = (a + b) / 2;
            if ((inside(m) ?? -1) > 0) a = m;
            else b = m;
          }
          const at: number = (a + b) / 2;
          const p: readonly number[] = arm!.point(at, phase);
          const q: V = sub(p, foot.origin);
          const ts: number = dot(q, unit(cross(foot.v, foot.u)));
          const tt: number = Math.atan2(dot(q, foot.v), dot(q, foot.u));
          const turn: number = Math.acos(Math.min(1, Math.abs(dot(normal(trunk!.jet(ts, tt)), normal(arm!.jet(at, phase))))));
          found = `${at.toFixed(2)} | ${p[0]!.toFixed(1)}, ${p[1]!.toFixed(1)}, ${p[2]!.toFixed(1)} | ${((turn * 180) / Math.PI).toFixed(1)} (inside by ${first.toFixed(2)} mm at the first station)`;
          break;
        }
      out.push(`${(k * 10).toString()} | ${found}`);
    }

    // The stored arm carried inward of its first knot: its fields' natural cubics run on along their end tangents, as a loose family's
    // reach carries them. By arm chart angle, the station between `CARRIED.from` and the first knot plus 30 mm where that wall crosses
    // the trunk's skin (inside before, outside after), or how near the two come where they do not cross.
    const family: IAutoMovieHumanConicLoft.IFamily = AutoMovieHumanF1.BODY.arm;
    const course: IAutoMovieViewAxis.IAxis = H.axis(family);
    const read: (s: number) => number[] = H.reader(family);
    const wall = (s: number, angle: number): V => {
      const frame: IAutoMovieLoftSectionFrame = course.at(s);
      const section: IAutoMovieViewChain.ISection = S.chain(read(s), family.layout);
      if (section.fault !== null) throw new Error("the carried arm's section at " + s + " is not admitted: " + section.fault);
      const r: number = AutoMovieViewChain.radius(section, angle);
      return [0, 1, 2].map((k: number): number => frame.origin[k]! + r * (Math.cos(angle) * frame.u[k]! + Math.sin(angle) * frame.v[k]!)) as V;
    };
    out.push("");
    out.push(`== the stored arm's bare wall carried inward from station ${CARRIED.from} (first knot ${family.knots[0]}) ==`);
    out.push("arm chart angle deg | crossing station | point x, y, z | or: nearest approach mm at station (positive: the arm's wall inside the trunk)");
    for (let k: number = 0; k < 36; ++k) {
      const angle: number = (2 * Math.PI * k) / 36;
      let previous: number | null = null;
      let found: string | null = null;
      let nearest: [number, number] = [Infinity, NaN];
      try {
        for (let s: number = CARRIED.from; s <= family.knots[0]! + 30 && found === null; s += 0.5) {
          const d: number | null = depth(wall(s, angle));
          if (d === null) continue;
          if (Math.abs(d) < Math.abs(nearest[0])) nearest = [d, s];
          if (previous !== null && previous > 0 && d <= 0) {
            let [a, b]: [number, number] = [s - 0.5, s];
            for (let i: number = 0; i < 40; ++i) {
              const m: number = (a + b) / 2;
              if ((depth(wall(m, angle)) ?? -1) > 0) a = m;
              else b = m;
            }
            const p: V = wall((a + b) / 2, angle);
            found = `${((a + b) / 2).toFixed(2)} | ${p[0].toFixed(1)}, ${p[1].toFixed(1)}, ${p[2].toFixed(1)}`;
          }
          previous = d;
        }
      } catch (error: unknown) {
        found = "refused: " + (error instanceof Error ? error.message : String(error));
      }
      out.push(`${k * 10} | ${found ?? `no crossing; nearest ${nearest[0].toFixed(2)} at ${nearest[1].toFixed(1)}`}`);
    }

    // The loop's candidate by rule: on the arm's carried face with its reliefs, by source phase, the crossing of the trunk's skin
    // nearest the ring at `RING` (the arm's ring in the record's armscye plane), and the two skins' gap at that ring where no crossing
    // stands within `NEAR` of it.
    const carried: IAutoMovieLoftViewFullSource.IReader = Full.create(H.part(family, Array.from({ length: 76 }, (_: unknown, i: number): number => CARRIED.from + 2 * i)));
    out.push("");
    out.push(`== nearest crossing to the ring at station ${RING}, carried face with reliefs (domain ${carried.domain.join(" to ")}) ==`);
    out.push("arm phase deg | depth at the ring mm (+ inside the trunk) | nearest crossing station | loop station by rule | gap there mm");
    let worst: number = 0;
    for (let k: number = 0; k < 72; ++k) {
      const phase: number = (2 * Math.PI * k) / 72;
      const at = (s: number): number => depth(carried.point(s, phase)) ?? NaN;
      const ring: number = at(RING);
      let crossing: number | null = null;
      for (let step: number = 0.25; step <= 30 && crossing === null; step += 0.25)
        for (const s of [RING - step, RING + step]) {
          if (s < carried.domain[0] + 0.25 || s > 100) continue;
          const [a, b]: [number, number] = s < RING ? [s, s + 0.25] : [s - 0.25, s];
          if (at(a) * at(b) <= 0) {
            let [lo, hi]: [number, number] = [a, b];
            for (let i: number = 0; i < 40; ++i) {
              const m: number = (lo + hi) / 2;
              if (at(lo) * at(m) <= 0) hi = m;
              else lo = m;
            }
            crossing = (lo + hi) / 2;
            break;
          }
        }
      const rule: number = crossing !== null && Math.abs(crossing - RING) <= NEAR ? crossing : RING;
      const gap: number = rule === RING ? ring : 0;
      worst = Math.max(worst, Math.abs(gap));
      if (k % 2 === 0) out.push(`${k * 5} | ${ring.toFixed(2)} | ${crossing === null ? "none" : crossing.toFixed(2)} | ${rule.toFixed(2)} | ${gap.toFixed(2)}`);
    }
    out.push(`largest gap on the rule's loop: ${worst.toFixed(2)} mm`);
    process.stdout.write(out.join("\n") + "\n");
    if (process.argv.includes("--reference")) await reference(family, trunkPart, depth);
    if (process.argv.includes("--realize")) await realize(family);
  }

  /**
   * `--reference`: the generated loop against the reference's skin. At every fifth arm phase, the loop's point on the arm's carried
   * face and its drop on the trunk's skin, each with its signed distance to the nearest reference triangle (positive outside the
   * skin), the arm station of the loop there, whether that station lies on fitted wall (at or past the arm's first knot) or on wall
   * carried along the end tangents, and the arm's depth in the trunk at the ring. Where the loop lies on carried wall, its distance to
   * the reference says whether an extrapolation is drawing the join's edge.
   */
  async function reference(family: IAutoMovieHumanConicLoft.IFamily, trunkPart: IAutoMovieViewPart, depth: (p: readonly number[]) => number | null): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const grid: Nearest.IGrid = Nearest.grid([source.body]);
    const armPart: IAutoMovieViewPart = H.part(family, Array.from({ length: 77 }, (_: unknown, i: number): number => family.knots[0]! - Armscye.CARRIED_MM + 2 * i));
    const contact: Armscye.IContact = Armscye.create(trunkPart, armPart, 96);
    const [arm, trunk]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(armPart), Full.create(trunkPart)];
    const foot: IAutoMovieLoftSectionFrame = trunkPart.axis.at(0);
    const out: string[] = ["", `== the generated loop against the reference's skin (largest gap between the two fields on it ${contact.gap.toFixed(2)} mm) ==`];
    out.push("arm phase deg | loop station (fitted or carried) | arm point x, y, z | arm point to reference mm | trunk drop to reference mm | gap arm-trunk mm | depth at the ring mm");
    const step: number = contact.stations.length / 144;
    for (let k: number = 0; k < 144; ++k) {
      const j: number = Math.round(k * step);
      const phase: number = (2 * Math.PI * j) / contact.stations.length;
      const station: number = contact.stations[j]!;
      const p: readonly number[] = arm!.point(station, phase);
      const q: V = sub(p, foot.origin);
      const drop: readonly number[] = trunk!.point(dot(q, unit(cross(foot.v, foot.u))), Math.atan2(dot(q, foot.v), dot(q, foot.u)));
      const near = (x: readonly number[]): string => (Nearest.distance(grid, [x[0]!, x[1]!, x[2]!])?.toFixed(2) ?? "far");
      const fine: boolean = k * 2.5 <= 30 || k * 2.5 >= 330;
      if (k % 2 === 0 || fine)
        out.push(`${(k * 2.5).toFixed(1)} | ${station.toFixed(2)} ${station >= family.knots[0]! ? "fitted" : "carried"} | ${p[0]!.toFixed(1)}, ${p[1]!.toFixed(1)}, ${p[2]!.toFixed(1)} | ${near(p)} | ${near(drop)} | ${Math.hypot(p[0]! - drop[0]!, p[1]! - drop[1]!, p[2]! - drop[2]!).toFixed(2)} | ${(depth(arm!.point(Armscye.RING_MM, phase)) ?? NaN).toFixed(2)}`);
    }
    process.stdout.write(out.join("\n") + "\n");
  }

  /**
   * `--realize`: the joint alone. A slab of the trunk (stations 420 to 700) and the carried arm to 160 mm, joined on the generated loop
   * by the shared-loop join, realized by the engine; prints the contact, every diagnostic and the mesh's size, and draws the armpit and
   * the shoulder from six sides into `--out=<directory>`.
   */
  async function realize(family: IAutoMovieHumanConicLoft.IFamily): Promise<void> {
    const out: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--out="))?.slice(6);
    if (out === undefined) throw new Error("--realize needs --out=<directory>");
    const option = (name: string, fallback: number): number => Number(process.argv.find((a: string): boolean => a.startsWith("--" + name + "="))?.slice(name.length + 3) ?? fallback);
    const count: number = option("count", 96);

    // `--arm=<arm.family.json> --outermost=<mm>`: a candidate arm in place of the stored one, its contact read as its outermost leaving.
    const file: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--arm="))?.slice(6);
    const candidate: IAutoMovieHumanConicLoft.IFamily = file === undefined ? family : { ...(JSON.parse(await fs.readFile(file, "utf8")) as IAutoMovieHumanConicLoft.IFamily), name: "arm" };
    const outermost: number | undefined = file === undefined ? undefined : option("outermost", 140);
    const first: number = file === undefined ? family.knots[0]! - Armscye.CARRIED_MM : candidate.knots[0]! - option("carried", 0);

    // `--without=<relief>,<relief>`: the trunk with those nets left off, an isolating control that says which premise a net breaks. It
    // is a reading on the instrument, never a figure: the wall under a net left off is the tape's hull.
    const without: string[] = process.argv.find((a: string): boolean => a.startsWith("--without="))?.slice(10).split(",") ?? [];
    // `--trunk=<trunk.family.json>`: a candidate trunk in place of the stored one.
    const trunkFile: string | undefined = process.argv.find((a: string): boolean => a.startsWith("--trunk="))?.slice(8);
    const stored: IAutoMovieHumanConicLoft.IFamily = trunkFile === undefined ? AutoMovieHumanF1.BODY.trunk : { ...(JSON.parse(await fs.readFile(trunkFile, "utf8")) as IAutoMovieHumanConicLoft.IFamily), name: "trunk" };
    const missing: string[] = without.filter((name: string): boolean => !(stored.reliefs ?? []).some((r: { name: string }): boolean => r.name === name));
    if (missing.length > 0) throw new Error("--without: the trunk has no net named " + missing.join(", ") + "; it has " + (stored.reliefs ?? []).map((r: { name: string }): string => r.name).join(", "));
    const trunk: IAutoMovieHumanConicLoft.IFamily = without.length === 0 ? stored : { ...stored, reliefs: (stored.reliefs ?? []).filter((r: { name: string }): boolean => !without.includes(r.name)) };
    const sources: Map<string, IAutoMovieViewPart> = new Map([
      ["trunk", H.part(trunk, Array.from({ length: 141 }, (_: unknown, i: number): number => 420 + 2 * i))],
      ["arm", H.part(candidate, Array.from({ length: 111 }, (_: unknown, i: number): number => first + 2 * i))],
    ]);
    // `--surface`: the loop as the arm's skin cut by the armscye's dividing surface, the surface the two fits were clipped by.
    const divided: boolean = process.argv.includes("--surface");
    const contact: Armscye.IContact = Armscye.create(
      sources.get("trunk")!,
      sources.get("arm")!,
      count,
      divided ? { type: "surface", side: Armscye.surface(AutoMovieHumanF1Placement.REFERENCE.get("thorax")!, AutoMovieHumanF1Joints.upperarm, AutoMovieHumanF1Joints.lowerarm).side } : outermost === undefined ? undefined : { type: "outermost", within: outermost },
    );
    process.stdout.write(JSON.stringify({ contact: { centre: contact.loop.centre, semi: contact.loop.semi, shares: [Math.min(...contact.loop.shape!), Math.max(...contact.loop.shape!)], part: contact.part, host: contact.host, gapMm: contact.gap, stations: [Math.min(...contact.stations), Math.max(...contact.stations)] } }) + "\n");
    // `--table`: the loop phase by phase, each point on the part's face and its drop on the host's skin against the reference's skin
    // (positive outside it), the gap between the two, and the turn between the two surfaces' normals there.
    if (process.argv.includes("--table")) {
      const grid: Nearest.IGrid = Nearest.grid([(await R.load(path.resolve(process.cwd(), ".."))).all]);
      const [armReader, trunkReader]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(sources.get("arm")!), Full.create(sources.get("trunk")!)];
      const foot: IAutoMovieLoftSectionFrame = sources.get("trunk")!.axis.at(0);
      const near = (x: readonly number[]): string => (Nearest.distance(grid, [x[0]!, x[1]!, x[2]!])?.toFixed(2) ?? "far");
      const rows: string[] = ["part phase deg | loop station | part point x, y, z | part point to reference mm | host drop to reference mm | gap mm | turn deg"];
      const every: number = contact.stations.length / 72;
      for (let k: number = 0; k < 72; ++k) {
        const j: number = Math.round(k * every);
        const phase: number = (2 * Math.PI * j) / contact.stations.length;
        const p: readonly number[] = armReader!.point(contact.stations[j]!, phase);
        const q: V = sub(p, foot.origin);
        const [s, t]: [number, number] = [dot(q, unit(cross(foot.v, foot.u))), Math.atan2(dot(q, foot.v), dot(q, foot.u))];
        const drop: readonly number[] = trunkReader!.point(s, t);
        const turn: number = Math.acos(Math.min(1, Math.abs(dot(normal(trunkReader!.jet(s, t)), normal(armReader!.jet(contact.stations[j]!, phase))))));
        rows.push(`${k * 5} | ${contact.stations[j]!.toFixed(1)} | ${p[0]!.toFixed(1)}, ${p[1]!.toFixed(1)}, ${p[2]!.toFixed(1)} | ${near(p)} | ${near(drop)} | ${Math.hypot(p[0]! - drop[0]!, p[1]! - drop[1]!, p[2]! - drop[2]!).toFixed(2)} | ${((turn * 180) / Math.PI).toFixed(1)}`);
      }
      process.stdout.write(rows.join("\n") + "\n");
    }
    const fold: IAutoMovieConstructionWidth = { type: "fold", radius: option("radius", 6) / 1000, cap: option("cap", 30) / 1000, reach: option("reach", 6) / 1000 };
    const root: IAutoMovieConstructionNode = {
      type: "join",
      kind: "merge",
      name: "armscye.arm",
      host: { type: "source", name: "trunk", source: "trunk" },
      part: { type: "source", name: "arm", source: "arm" },
      seed: { type: "point", partFace: "arm", hostFace: "trunk", part: contact.part, host: contact.host },
      parameter: { type: "arc" },
      loop: contact.loop,
      partWidth: fold,
      hostWidth: fold,
      continuity: "G2",
      count,
      rows: 8,
      tolerance: option("tolerance", Math.ceil(contact.gap * 10 + 1) / 10) / 1000,
      grazing: option("grazing", 0.2),
    };
    const started: number = performance.now();
    const real: IAutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.armscye", root }, { chord: 0.0005, sources });
    process.stdout.write(JSON.stringify({ milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, joins: real.joins.length, triangles: real.mesh.indices.length / 3 }).slice(0, 6000) + "\n");
    if (real.mesh.positions.length === 0) return;
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "armscye", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };

    // Framed on the joint: the mesh's vertices within the box round the armpit and the shoulder, metres.
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) {
      const [x, y, z]: number[] = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
      if (x! > -0.1 && x! < 0.09 && y! > 1.23 && y! < 1.43 && z! > 0.09 && z! < 0.24) bounds.push([x!, y!, z!]);
    }
    NodeCanvasRaster.initialize();
    for (const view of ["front", "back", "left", "high-oblique", "low-oblique"])
      await fs.writeFile(path.join(out, "armscye." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 900), [mesh], [], "depth", "f1 | armscye join alone | " + view).png);
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }

  /** The arm's ring the loop is read about, mm of its course: its first knot less one, the record's armscye plane plus one. */
  const RING: number = 31;

  /** How far from the ring a crossing still counts as the ring's own, mm. */
  const NEAR: number = 8;

  /** How far before its first knot the stored arm's wall is carried, mm of its course: to 20 mm inside the record's armscye plane. */
  const CARRIED: { from: number } = { from: 10 };
}

void FamilyConicArmscyeJoin.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
