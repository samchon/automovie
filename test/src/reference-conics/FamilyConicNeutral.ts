import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, AutoMovieViewJointedCourse, type AutoMovieViewLoft, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicPose as Q, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing as T } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * f1 at the neutral pose, before anything is realized: what the pose law (`AutoMovieHumanConicPose`) makes of every family's course and
 * what every port's loop reads on the trunk's chart, beside the reference pose.
 *
 * Usage, from `test/` after `pnpm conic:build`: `node .shots/esbuild/FamilyConicNeutral.cjs`. It writes `precheck.txt` under
 * `test/.shots/family-conic-neutral/<time>/` and reads only f1's tables, never the reference.
 *
 * `--realize` then realizes the neutral figure once (`AutoMovieHumanF1.construction` at `AutoMovieHumanF1Placement.NEUTRAL`) into the same
 * directory: `realization.json` (the refusal that stopped the declaration or the realization, or the mesh's size and the diagnostics
 * list), the whole figure from the front, the back, both sides and the top, and each joint's zone (both shoulders and armpits, the
 * elbow, the wrist, the hand, the hip, the knee, the ankle and the foot, framed on the neutral datums) in clay and coloured by owner,
 * and `folds.json`: every 30 mm cell with each owner's area and the sharpest fold between two triangles on an edge in the cell, the
 * sharpest first. The reference is not read: a comparison with it means nothing at another pose.
 *
 * `--measure` writes `measures.txt`, the joints' premises read on the lofted walls at both poses, nothing realized: the thumb capsule's
 * seed line against the hand's wall, the axilla cutter's seed line against the arm's and the trunk's walls (the band it is sought on
 * spans between the two and exists only in a realization), the leg's first ring against the trunk's end ring, and the arm's first
 * sections against the armscye's plane. A signed distance is read in the wall's own section: the point's distance from the course
 * less the wall's along the same ray, positive outside.
 *
 * The table lists, per family: every run's owning segment with its basis and its segment's length at both poses; per turn its angle,
 * its half, its set-back, the span the station map gives it with its ratio, and the shift of the stations past it; the engine's own
 * admission of the posed course; and the roll the joints' twists ask for. Then the station every rail and reach reads beside its
 * course's first turn. Then each port's loop (`armscye`, `nostril`, `mammary`) at both poses: its centre and half extents in station and
 * phase, or the refusal that stopped it, and whether the armscye's and the breast's loops' boxes stay apart.
 */
namespace FamilyConicNeutral {
  type IFamily = AutoMovieHumanConicLoft.IFamily;

  /** Write the pre-check. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-neutral", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const n = (x: number, digits: number = 2): string => x.toFixed(digits);
    const degrees = (r: number): string => ((r * 180) / Math.PI).toFixed(1);
    const reference: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const neutral: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble(P.NEUTRAL);
    const lines: string[] = ["f1 neutral pre-check: every joint's rotation the identity; mm and degrees; reference -> neutral", ""];
    const premises: string[] = [];

    lines.push("datums at neutral (reference -> neutral):");
    for (const name of ["upperarm", "lowerarm", "hand", "middle1", "handEnd", "thigh", "calf", "foot", "footBall", "footEnd", "armRoot", "armTurn", "armpit"]) lines.push("  " + name + " [" + reference.point(name).map((x: number): string => n(x)).join(", ") + "] -> [" + neutral.point(name).map((x: number): string => n(x)).join(", ") + "]");
    lines.push("");

    for (const [i, stored] of reference.families.entries()) {
      const posed: IFamily = neutral.families[i]!;
      if (stored.centres.length < 3) continue;
      const [a, b]: Q.ICourse[] = [Q.course(stored.centres, stored.halves), Q.course(posed.centres, posed.halves)];
      const segments: string[] = P.runs(stored.name);
      const admitted: AutoMovieViewJointedCourse.ICourse | string = AutoMovieViewJointedCourse.prepare(posed.centres, posed.halves);
      lines.push(stored.name + ": engine " + (typeof admitted === "string" ? "REFUSES: " + admitted : "admits the neutral course") + "; arclength " + n(a!.total) + " -> " + n(b!.total));
      if (typeof admitted === "string") premises.push(stored.name + ": the engine refuses the neutral course: " + admitted);
      a!.lengths.forEach((length: number, k: number): void => {
        const moved: number = b!.lengths[k]! - length;
        // The run's owner is the bone that ends at its far centre; its near centre is on that bone too, or a corner built on another segment.
        const [near, far]: string[] = [T.COURSES[stored.name]![k]!, T.COURSES[stored.name]![k + 1]!];
        const basis: string = "owner " + segments[k] + ": far centre " + far + " (" + T.POINTS[far!]!.frame + "), near centre " + near + " (" + T.POINTS[near!]!.frame + ")";
        lines.push("  run " + k + ": " + basis + "; segment length " + n(length) + " -> " + n(b!.lengths[k]!) + (Math.abs(moved) > 1e-6 ? "  CHANGES by " + n(moved) + ": the run keeps its stations from " + far + " and the turn before it takes the difference" : ""));
        if (Math.abs(moved) > 1e-6 && k === 0) premises.push(stored.name + " run 0: its length changes by " + n(moved) + " mm and no turn stands before it");
      });
      a!.angles.forEach((angle: number, k: number): void => {
        const [end, placed]: number[] = [a!.starts[k]! + 2 * a!.halves[k]!, b!.starts[k]! + 2 * b!.halves[k]!];
        const [from, to]: number[] = [neutral.station(stored.name, a!.starts[k]!), neutral.station(stored.name, end!)];
        lines.push("  turn " + k + ": angle " + degrees(angle) + " -> " + degrees(b!.angles[k]!) + "; half " + n(a!.halves[k]!) + " -> " + n(b!.halves[k]!) + "; set-back " + n(a!.setbacks[k]!) + " -> " + n(b!.setbacks[k]!) + "; the engine's turn " + n(b!.starts[k]!) + ".." + n(placed!) + "; span " + n(a!.starts[k]!) + ".." + n(end!) + " (" + n(end! - a!.starts[k]!) + ") -> " + n(from!) + ".." + n(to!) + " (" + n(to! - from!) + "), ratio " + n((to! - from!) / (end! - a!.starts[k]!), 3) + "; shift past it " + n(to! - end!));
      });
      lines.push("  knots " + n(stored.knots[0]!) + ".." + n(stored.knots.at(-1)!) + " -> " + n(posed.knots[0]!) + ".." + n(posed.knots.at(-1)!) + (posed.roll === undefined || stored.roll !== undefined ? "; no twist" : "; roll, degrees at station: " + posed.roll.knots.map((s: number, j: number): string => n(s, 1) + ": " + degrees(posed.roll!.values[j]!)).join(", ")));
      lines.push("");
    }

    // The stations the bands' rails and the web's fine layers read, beside the first turn of their course.
    lines.push("rails and reaches read along a posed family, each carried by the station map (`IAssembly.station`): station at the reference -> at neutral; the course's first turn at the reference -> at neutral");
    const reads: [string, string, number, number][] = [
      ...reference.digits.filter((digit: AutoMovieHumanF1.IDigit): boolean => digit.knuckle).map((digit: AutoMovieHumanF1.IDigit): [string, string, number, number] => ["band rail 3 mm", digit.family.name, digit.family.knots[0]!, 3]),
      ["web reach 12 mm", "finger.thumb", reference.digits.find((digit: AutoMovieHumanF1.IDigit): boolean => digit.family.name === "finger.thumb")!.family.knots[0]!, 12],
      ["band rail 6 mm", "leg", reference.body.leg.knots[0]!, 6],
      ["wrist rail 10 mm", "hand", reference.body.hand.knots[0]!, 10],
      ["face end 445 mm", "arm", 445, 0],
    ];
    for (const [what, name, from, length] of reads) {
      const stored: IFamily = reference.families.find((family: IFamily): boolean => family.name === name)!;
      const posed: IFamily = neutral.families.find((family: IFamily): boolean => family.name === name)!;
      const [a, b]: Q.ICourse[] = [Q.course(stored.centres, stored.halves), Q.course(posed.centres, posed.halves)];
      const where: string = from + length < a!.starts[0]! ? "before the first turn" : from + length <= a!.starts[0]! + 2 * a!.halves[0]! ? "INSIDE the first turn" : "past the first turn";
      lines.push("  " + name + ", " + what + ": " + n(from + length) + " -> " + n(neutral.station(name, from + length)) + " (length " + n(length) + " -> " + n(neutral.station(name, from, length), 3) + "); first turn " + n(a!.starts[0]!) + ".." + n(a!.starts[0]! + 2 * a!.halves[0]!) + " -> " + n(b!.starts[0]!) + ".." + n(b!.starts[0]! + 2 * b!.halves[0]!) + "; " + where);
    }
    lines.push("");

    // The ports' loops on the trunk's chart at both poses.
    const trunk: IFamily = reference.body.trunk;
    lines.push("port loops on the trunk's chart (trunk knots " + trunk.knots[0] + ".." + trunk.knots.at(-1) + " mm); centre and half extents, station mm and phase degrees:");
    const boxes: Map<string, [number, number, number, number]> = new Map();
    const loops: [string, (placed: AutoMovieHumanF1.IAssembly) => { centre: [number, number]; semi: [number, number] }][] = [
      ["armscye +z", (placed: AutoMovieHumanF1.IAssembly) => AutoMovieHumanF1.armscye(1, placed)],
      ["armscye -z", (placed: AutoMovieHumanF1.IAssembly) => AutoMovieHumanF1.armscye(-1, placed)],
      ["mammary +z", (placed: AutoMovieHumanF1.IAssembly) => AutoMovieHumanF1.mammary(1, placed)],
      ["mammary -z", (placed: AutoMovieHumanF1.IAssembly) => AutoMovieHumanF1.mammary(-1, placed)],
      ["nostril", (placed: AutoMovieHumanF1.IAssembly) => AutoMovieHumanF1.nostril(placed)],
    ];
    for (const [name, read] of loops)
      for (const [pose, placed] of [["reference", reference], ["neutral", neutral]] as [string, AutoMovieHumanF1.IAssembly][]) {
        try {
          const loop: { centre: [number, number]; semi: [number, number] } = read(placed);
          const [s, t, ds, dt]: number[] = [loop.centre[0] * 1000, loop.centre[1], loop.semi[0] * 1000, loop.semi[1]];
          if (pose === "neutral") boxes.set(name, [s! - ds!, s! + ds!, t! - dt!, t! + dt!]);
          const on: boolean = s! - ds! > trunk.knots[0]! && s! + ds! < trunk.knots.at(-1)!;
          lines.push("  " + name + " at " + pose + ": station " + n(s!) + " +- " + n(ds!) + ", phase " + degrees(t!) + " +- " + degrees(dt!) + (on ? "" : "  OFF the trunk's stations"));
          if (!on) premises.push(name + " at " + pose + ": the loop leaves the trunk's stations");
        } catch (error) {
          lines.push("  " + name + " at " + pose + ": REFUSED: " + (error instanceof Error ? error.message : String(error)));
          if (pose === "neutral") premises.push(name + ": its loop is refused at neutral: " + (error instanceof Error ? error.message : String(error)));
        }
      }
    for (const side of ["+z", "-z"]) {
      const [arm, breast]: ([number, number, number, number] | undefined)[] = [boxes.get("armscye " + side), boxes.get("mammary " + side)];
      if (arm === undefined || breast === undefined) continue;
      const apart: boolean = arm[0] > breast[1] || breast[0] > arm[1] || arm[2] > breast[3] || breast[2] > arm[3];
      lines.push("  armscye and mammary " + side + " at neutral: their boxes " + (apart ? "stay apart" : "OVERLAP"));
      if (!apart) premises.push("armscye and mammary " + side + ": the loops' boxes overlap at neutral");
    }

    lines.push("", premises.length === 0 ? "every premise holds" : premises.length + " premises fail:", ...premises.map((text: string): string => "  " + text));
    await fs.writeFile(path.join(out, "precheck.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + path.join(out, "precheck.txt") + "\n");
    if (process.argv.includes("--measure")) await measure(out, reference, neutral);
    if (process.argv.includes("--realize")) await realize(out, neutral);
  }

  /** A lofted wall to read distances against: its course and its chain. */
  interface IWall {
    family: IFamily;
    chain: NonNullable<AutoMovieViewLoft.IResult["chain"]>;
  }

  /** Loft a family at its own knots; a family the engine refuses is refused here with its rule. */
  function wall(family: IFamily): IWall {
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, family.knots);
    if (loft.chain === null) throw new Error(family.name + " does not loft: " + JSON.stringify(loft.diagnostics).slice(0, 200));
    return { family, chain: loft.chain };
  }

  /**
   * A point's signed distance from a wall, mm, positive outside, with the station it is read at: the station between the wall's first and
   * last knots whose section plane holds the point nearest the course (scanned every millimetre, refined by bisection), and there the
   * point's distance from the course less the ring's along the same ray. Null when no section plane between the knots holds the point.
   */
  function signed(against: IWall, p: readonly number[]): { station: number; distance: number } | null {
    const axis = AutoMovieHumanConicLoft.axis(against.family);
    const local = (s: number): [number, number, number] => {
      const frame = axis.at(s);
      const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
      const t: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      return [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2], d[0]! * t[0]! + d[1]! * t[1]! + d[2]! * t[2]!];
    };
    const [from, to]: number[] = [against.family.knots[0]!, against.family.knots.at(-1)!];
    let best: { station: number; reach: number } | null = null;
    for (let s: number = from!; s < to!; s += 1) {
      let [lo, hi]: number[] = [s, Math.min(to!, s + 1)];
      if (local(lo!)[2] > 0 === local(hi!)[2] > 0) continue;
      for (let i: number = 0; i < 30; ++i) {
        const middle: number = (lo! + hi!) / 2;
        if (local(middle)[2] > 0 === local(lo!)[2] > 0) lo = middle;
        else hi = middle;
      }
      const [x, y]: number[] = local(lo!);
      if (best === null || Math.hypot(x!, y!) < best.reach) best = { station: lo!, reach: Math.hypot(x!, y!) };
    }
    if (best === null) return null;
    const [x, y]: number[] = local(best.station);
    const angle: number = Math.atan2(y!, x!);
    const frame = axis.at(best.station);
    // The ring's reach along the point's ray: its two points on either side of the ray's angle, joined by their chord.
    const ring: [number, number][] = Array.from({ length: 360 }, (_: unknown, j: number): [number, number] => {
      const q: number[] = AutoMovieLoftChain.point(against.chain, best!.station, (2 * Math.PI * j) / 360);
      const d: number[] = [q[0]! - frame.origin[0], q[1]! - frame.origin[1], q[2]! - frame.origin[2]];
      const [u, v]: number[] = [d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2], d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2]];
      return [Math.atan2(v!, u!), Math.hypot(u!, v!)];
    });
    const turn = (a: number): number => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
    let reach: number = NaN;
    for (let j: number = 0; j < ring.length; ++j) {
      const [a, b]: [number, number][] = [ring[j]!, ring[(j + 1) % ring.length]!];
      const [da, db]: number[] = [turn(a![0] - angle), turn(b![0] - angle)];
      if (da! > 0 === db! > 0 || Math.abs(da! - db!) > 1) continue;
      reach = a![1] + ((b![1] - a![1]) * da!) / (da! - db!);
      break;
    }
    return { station: best.station, distance: best.reach - reach };
  }

  /** `--measure`: the joints' premises on the lofted walls at both poses. */
  async function measure(out: string, reference: AutoMovieHumanF1.IAssembly, neutral: AutoMovieHumanF1.IAssembly): Promise<void> {
    const n = (x: number, digits: number = 1): string => (Number.isFinite(x) ? x.toFixed(digits) : "none");
    const lines: string[] = ["f1 joints measured on the lofted walls, reference and neutral; mm; a signed distance is positive outside the wall", ""];
    const poses: [string, AutoMovieHumanF1.IAssembly][] = [["reference", reference], ["neutral", neutral]];
    // A station line's points; a station the chain cannot be read at (a pole, a section the engine refuses) is left out and named.
    const line = (chain: IWall["chain"], stations: number[], phase: number): [number, number[] | string][] =>
      stations.map((s: number): [number, number[] | string] => {
        try {
          return [s, AutoMovieLoftChain.point(chain, s, phase)];
        } catch (error) {
          return [s, error instanceof Error ? error.message.slice(0, 80) : String(error)];
        }
      });
    const along = (label: string, points: [number, number[] | string][], against: IWall): void => {
      const read: string[] = points.map(([s, p]: [number, number[] | string]): string => {
        if (typeof p === "string") return n(s) + ": unread (" + p + ")";
        const found: { station: number; distance: number } | null = signed(against, p);
        return n(s) + ": " + (found === null ? "off the wall's stations" : n(found.distance) + " (at " + n(found.station) + ")");
      });
      lines.push("  " + label + ": " + read.join(", "));
    };

    // The thumb: its capsule's seed line, phase 0, over the merge's search range (shares 0 to 0.7 of its stations from its root's point,
    // 10 mm behind its first joint, to its tip), against the hand's wall.
    lines.push("thumb (`web.finger.thumb`): the capsule's station line at phase 0, capsule station: signed distance from the hand's wall (at the hand's station)");
    for (const [pose, placed] of poses) {
      const thumb: IFamily = placed.digits.find((digit: AutoMovieHumanF1.IDigit): boolean => digit.family.name === "finger.thumb")!.family;
      const capsule: IWall = wall({ ...thumb, tips: [{ from: thumb.knots[0]!, tip: -10, covered: true }, thumb.tips?.[1] ?? null] });
      const hand: IWall = wall({ ...placed.body.hand, tips: undefined });
      const end: number = thumb.knots.at(-1)!;
      const last: number = thumb.tips?.[1]?.tip ?? end;
      along(pose, line(capsule.chain, Array.from({ length: 12 }, (_: unknown, i: number): number => -9.5 + ((0.7 * (last + 10) - 0.5) * i) / 11), 0), hand);
    }

    // The axilla: its cutter's seed line, phase 4.6173, shares 0.613 to 0.669 of its stations and 20 mm either side, against the arm's wall
    // and the trunk's; the seed is sought on the band between them.
    lines.push("", "axilla (`cut.axilla`): the cutter's station line at phase 4.6173, cutter station: signed distance from the arm's wall and from the trunk's (the seed is sought at stations 58.5 to 62.5)");
    for (const [pose, placed] of poses) {
      const cutter: IWall = wall(placed.axilla);
      const points: [number, number[] | string][] = line(cutter.chain, [40, 50, 58.5, 60.5, 62.5, 70, 77], 4.6173);
      along(pose + ", arm", points, wall({ ...placed.body.arm, tips: undefined, reliefs: undefined }));
      along(pose + ", trunk", points, wall({ ...placed.body.trunk, tips: undefined }));
    }

    // The hip: the leg's ring where its band lands, 6 mm past its first knot, against the trunk's end ring, the first knot's.
    lines.push("", "hip (`crotch`, `band.leg`): the leg's ring 6 mm past its first knot against the trunk's end ring; hip reference angles: flexion -2.1, adduction -1.3, internal rotation -3.9 degrees (`frames.txt`)");
    for (const [pose, placed] of poses) {
      const leg: IWall = wall({ ...placed.body.leg, tips: undefined, reliefs: undefined });
      const trunk: IWall = wall({ ...placed.body.trunk, tips: undefined });
      const at: number = placed.station("leg", reference.body.leg.knots[0]! + 6);
      const end: number[][] = Array.from({ length: 360 }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(trunk.chain, trunk.family.knots[0]!, (2 * Math.PI * j) / 360));
      const gaps: number[] = Array.from({ length: 72 }, (_: unknown, j: number): number => {
        const p: number[] = AutoMovieLoftChain.point(leg.chain, at, (2 * Math.PI * j) / 72);
        return Math.min(...end.map((q: number[]): number => Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!)));
      });
      const frame = AutoMovieHumanConicLoft.axis(leg.family).at(at);
      const t: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
      const heights: number[] = Array.from({ length: 72 }, (_: unknown, j: number): number => AutoMovieLoftChain.point(leg.chain, at, (2 * Math.PI * j) / 72)[1]!);
      lines.push("  " + pose + ": the leg's ring at station " + n(at) + ", centre [" + frame.origin.map((x: number): string => n(x)).join(", ") + "], heights " + n(Math.min(...heights)) + " to " + n(Math.max(...heights)) + "; its plane leans " + n((Math.acos(Math.min(1, Math.abs(t[1]!))) * 180) / Math.PI) + " degrees from level; distance of its 72 columns to the trunk's end ring: least " + n(Math.min(...gaps)) + ", mean " + n(gaps.reduce((sum: number, x: number): number => sum + x, 0) / gaps.length) + ", most " + n(Math.max(...gaps)));
    }

    // The shoulder: the arm's first sections against the armscye's plane, the sagittal plane at the armpit's side distance.
    lines.push("", "shoulder (`armscye`, `band.arm`): the arm's rings past its first knot against the armscye's plane z = " + n(reference.point("armpit")[2]) + " (the armpit's side distance): each ring's side distance, least to most");
    for (const [pose, placed] of poses) {
      const arm: IWall = wall({ ...placed.body.arm, tips: undefined, reliefs: undefined });
      const read: string[] = [0, 10, 20, 40, 80, 120].map((mm: number): string => {
        const s: number = placed.station("arm", reference.body.arm.knots[0]! + mm);
        const sides: number[] = Array.from({ length: 72 }, (_: unknown, j: number): number => AutoMovieLoftChain.point(arm.chain, s, (2 * Math.PI * j) / 72)[2]!);
        const heights: number[] = Array.from({ length: 72 }, (_: unknown, j: number): number => AutoMovieLoftChain.point(arm.chain, s, (2 * Math.PI * j) / 72)[1]!);
        return "+" + mm + " (station " + n(s) + "): z " + n(Math.min(...sides)) + ".." + n(Math.max(...sides)) + ", y " + n(Math.min(...heights)) + ".." + n(Math.max(...heights));
      });
      lines.push("  " + pose + ": " + read.join("; "));
    }
    await fs.writeFile(path.join(out, "measures.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + path.join(out, "measures.txt") + "\n");
  }

  /** Edge of the cells the folds are listed in, mm, as the deviation map's owner cells. */
  const CELL_MM: number = 30;

  /** `--realize`: the neutral figure realized once, its diagnostics, frames and folds. */
  async function realize(out: string, neutral: AutoMovieHumanF1.IAssembly): Promise<void> {
    const message = (error: unknown): string => (error instanceof Error ? (error.stack ?? error.message) : String(error));
    const started: number = performance.now();
    let real: ReturnType<typeof realizeAutoMovieConstruction>;
    try {
      const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction(undefined, P.NEUTRAL);
      real = realizeAutoMovieConstruction({ name: "f1.neutral", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
    } catch (error) {
      await fs.writeFile(path.join(out, "realization.json"), JSON.stringify({ realized: false, refusal: message(error) }, null, 2));
      process.stdout.write("neutral: REFUSED before a mesh: " + message(error).split("\n")[0] + "\n");
      return;
    }
    const diagnostics: string[] = real.diagnostics.map((d: { node: string; contract: string; detail: string }): string => d.node + " (" + d.contract + "): " + d.detail);
    const mesh = real.mesh;
    if (mesh === null) {
      await fs.writeFile(path.join(out, "realization.json"), JSON.stringify({ realized: false, diagnostics }, null, 2));
      process.stdout.write("neutral: no mesh; " + diagnostics.length + " diagnostics\n");
      return;
    }
    const owner = (v: number): string => mesh.owners[mesh.coordinates[v * 3]!]!;
    const corner = (v: number): N.Point => [mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!];
    const count: number = mesh.indices.length / 3;
    const owned: string[] = Array.from({ length: count }, (_: unknown, t: number): string => {
      const names: string[] = [0, 1, 2].map((k: number): string => owner(mesh.indices[t * 3 + k]!));
      return names[0] === names[1] || names[0] === names[2] ? names[0]! : names[1]!;
    });

    // The meshes: the whole skin in clay, and one mesh per owner in its colour.
    const clay: N.Mesh[] = [{ id: "neutral", positions: Array.from(mesh.positions), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }];
    const palette: [number, number, number][] = [[0.85, 0.25, 0.25], [0.25, 0.7, 0.3], [0.25, 0.4, 0.9], [0.95, 0.8, 0.2], [0.7, 0.3, 0.8], [0.2, 0.75, 0.8], [0.95, 0.5, 0.15], [0.6, 0.85, 0.3], [0.9, 0.4, 0.65], [0.5, 0.3, 0.15], [0.1, 0.45, 0.35], [0.55, 0.6, 0.95]];
    const groups: Map<string, { positions: number[]; indices: number[] }> = new Map();
    for (let t: number = 0; t < count; ++t) {
      const group: { positions: number[]; indices: number[] } = groups.get(owned[t]!) ?? { positions: [], indices: [] };
      for (let k: number = 0; k < 3; ++k) group.positions.push(...corner(mesh.indices[t * 3 + k]!));
      const n: number = group.positions.length / 3;
      group.indices.push(n - 3, n - 2, n - 1);
      groups.set(owned[t]!, group);
    }
    const names: string[] = [...groups.keys()].sort((a: string, b: string): number => a.localeCompare(b));
    const colour = (name: string): [number, number, number] => (name === "trunk" ? [0.64, 0.65, 0.67] : palette[names.filter((other: string): boolean => other !== "trunk").indexOf(name) % palette.length]!);
    const owners: N.Mesh[] = names.map((name: string): N.Mesh => ({ id: name, ...groups.get(name)!, colour: colour(name) }));

    // The frames: the whole figure, then each joint's zone round its neutral datum, metres.
    const bounds: N.Point[] = Array.from({ length: mesh.positions.length / 3 }, (_: unknown, v: number): N.Point => corner(v));
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    const shoot = async (file: string, camera: N.Camera, shown: N.Mesh[], title: string): Promise<void> => {
      const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", title).png;
      await fs.writeFile(path.join(out, file), png);
      frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
    };
    for (const view of ["front", "back", "left", "right", "top"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      await shoot("figure." + view + ".clay.png", camera, clay, "f1 | neutral | " + view);
      await shoot("figure." + view + ".owners.png", camera, owners, "f1 | neutral owners | " + view);
    }
    const zones: [string, string, number, 1 | -1][] = [
      ["shoulder", "upperarm", 0.14, 1], ["shoulder.twin", "upperarm", 0.14, -1], ["armpit", "armpit", 0.1, 1], ["armpit.twin", "armpit", 0.1, -1],
      ["elbow", "lowerarm", 0.09, 1], ["wrist", "hand", 0.07, 1], ["hand", "middle1", 0.12, 1], ["hip", "thigh", 0.15, 1], ["knee", "calf", 0.1, 1], ["ankle", "foot", 0.09, 1], ["foot", "footBall", 0.13, 1],
    ];
    for (const [zone, datum, radius, side] of zones) {
      const at: number[] = neutral.point(datum).map((x: number, k: number): number => ((k === 2 ? side : 1) * x) / 1000);
      const near: N.Point[] = bounds.filter((p: N.Point): boolean => Math.hypot(p[0] - at[0]!, p[1] - at[1]!, p[2] - at[2]!) < radius);
      if (near.length === 0) continue;
      for (const view of ["front", "back", side > 0 ? "left" : "right", "high-oblique", ...(zone.startsWith("armpit") ? ["low-oblique"] : [])]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
        await shoot(zone + "." + view + ".clay.png", camera, clay, "f1 | neutral | " + zone + " " + view);
        await shoot(zone + "." + view + ".owners.png", camera, owners, "f1 | neutral owners | " + zone + " " + view);
      }
    }

    // The folds: every edge two triangles share, by the cell of its middle, with each of the two owners.
    const normal = (t: number): N.Point => {
      const [a, b, c]: N.Point[] = [0, 1, 2].map((k: number): N.Point => corner(mesh.indices[t * 3 + k]!));
      const [u, w]: N.Point[] = [[b![0] - a![0], b![1] - a![1], b![2] - a![2]], [c![0] - a![0], c![1] - a![1], c![2] - a![2]]];
      return [u![1] * w![2] - u![2] * w![1], u![2] * w![0] - u![0] * w![2], u![0] * w![1] - u![1] * w![0]];
    };
    const cells: Map<string, Map<string, { area: number; fold: number }>> = new Map();
    const share = (p: N.Point, name: string): { area: number; fold: number } => {
      const key: string = p.map((x: number): number => (Math.floor((x * 1000) / CELL_MM) + 0.5) * CELL_MM).join(",");
      const cell: Map<string, { area: number; fold: number }> = cells.get(key) ?? new Map();
      cells.set(key, cell);
      const found: { area: number; fold: number } = cell.get(name) ?? { area: 0, fold: 0 };
      cell.set(name, found);
      return found;
    };
    const first: Map<number, number> = new Map();
    const vertices: number = mesh.positions.length / 3;
    for (let t: number = 0; t < count; ++t) {
      const n: N.Point = normal(t);
      const corners: N.Point[] = [0, 1, 2].map((k: number): N.Point => corner(mesh.indices[t * 3 + k]!));
      share([(corners[0]![0] + corners[1]![0] + corners[2]![0]) / 3, (corners[0]![1] + corners[1]![1] + corners[2]![1]) / 3, (corners[0]![2] + corners[1]![2] + corners[2]![2]) / 3], owned[t]!).area += (Math.hypot(n[0], n[1], n[2]) / 2) * 1e6;
      for (let k: number = 0; k < 3; ++k) {
        const [i, j]: number[] = [mesh.indices[t * 3 + k]!, mesh.indices[t * 3 + ((k + 1) % 3)]!];
        const key: number = Math.min(i!, j!) * vertices + Math.max(i!, j!);
        const other: number | undefined = first.get(key);
        if (other === undefined) {
          first.set(key, t);
          continue;
        }
        const m: N.Point = normal(other);
        const cosine: number = (n[0] * m[0] + n[1] * m[1] + n[2] * m[2]) / (Math.hypot(n[0], n[1], n[2]) * Math.hypot(m[0], m[1], m[2]));
        const fold: number = (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
        if (!Number.isFinite(fold)) continue;
        const middle: N.Point = [(corner(i!)[0] + corner(j!)[0]) / 2, (corner(i!)[1] + corner(j!)[1]) / 2, (corner(i!)[2] + corner(j!)[2]) / 2];
        for (const name of new Set([owned[t]!, owned[other]!])) {
          const found: { area: number; fold: number } = share(middle, name);
          found.fold = Math.max(found.fold, fold);
        }
      }
    }
    const folds: { centreMm: number[]; fold: number; owners: { owner: string; areaMm2: number; foldDeg: number }[] }[] = [...cells]
      .map(([key, cell]: [string, Map<string, { area: number; fold: number }>]) => ({ centreMm: key.split(",").map(Number), fold: Math.max(...[...cell.values()].map((found: { fold: number }): number => found.fold)), owners: [...cell].map(([name, found]: [string, { area: number; fold: number }]) => ({ owner: name, areaMm2: Math.round(found.area * 100) / 100, foldDeg: Math.round(found.fold * 10) / 10 })) }))
      .sort((a: { fold: number }, b: { fold: number }): number => b.fold - a.fold);
    await fs.writeFile(path.join(out, "folds.json"), JSON.stringify({ cellMm: CELL_MM, cells: folds.map((cell: { centreMm: number[]; owners: { owner: string; areaMm2: number; foldDeg: number }[] }) => ({ centreMm: cell.centreMm, owners: cell.owners })) }));
    await fs.writeFile(path.join(out, "realization.json"), JSON.stringify({ realized: true, generationMs: Math.round(performance.now() - started), vertices, triangles: count, diagnostics, owners: names, frames }, null, 2));
    process.stdout.write("neutral: realized " + count + " triangles; " + diagnostics.length + " diagnostics\n" + diagnostics.map((text: string): string => "  " + text.slice(0, 300)).join("\n") + "\n");
  }
}
void FamilyConicNeutral.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
