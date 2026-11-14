import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, type AutoMovieMeshExtract as M, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanF1, AutoMovieHumanF1Joints as J, AutoMovieHumanF1Placement, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The armscye's landmark loop on f1 (issue #3151, the shoulder and armscye redesign, step R1): the acromion, the anterior and posterior
 * axillary fold points and the axilla read on the reference skin by written definitions; the closed loop through them on the skin; today's
 * port loop (`AutoMovieHumanF1.armscye`) against it; and the cap between the shoulder joint and the loop, which the arm should own, read
 * on sections about a course from the shoulder joint along the humerus. It measures only; nothing is stored.
 *
 * Frame: millimetres, forward +X, up +Y, +Z the stored side (the reference's left, whose datums the joint table holds); the loop is also
 * written in the thorax's frame (`AutoMovieHumanF1Placing`), where the trunk would publish it. A reading whose target lies at its search
 * window's end is refused, as the landmark tool refuses (`FamilyConicLandmarks`).
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicArmscyeLoop.cjs`. It writes `armscye.txt` and the frames
 * under `test/.shots/family-conic-armscye-loop/<time>/`.
 */
namespace FamilyConicArmscyeLoop {
  type V = R.V;

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V): number => Math.hypot(a[0], a[1], a[2]);
  const unit = (a: V): V => scale(a, 1 / norm(a));
  const perpendicular = (a: V, n: V): V => unit(sub(a, scale(n, dot(a, n))));
  const fixed = (p: readonly number[], digits: number = 1): string => "[" + p.map((x: number): string => x.toFixed(digits)).join(", ") + "]";

  /** A chart point of a frame back in the world. */
  const world = (frame: AutoMovieLoftFrame.IFrame, p: C.P): V => [0, 1, 2].map((i: number): number => frame.origin[i]! + p[0] * frame.u[i]! + p[1] * frame.v[i]!) as V;

  /** Where a closed chart polygon crosses a line: the parameter along `d` from `o` of each crossing. */
  function crossings(loop: readonly C.P[], o: C.P, d: C.P): number[] {
    const out: number[] = [];
    for (let i: number = 0; i < loop.length; ++i) {
      const a: C.P = loop[i]!;
      const b: C.P = loop[(i + 1) % loop.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) continue;
      const t: number = ((a[0] - o[0]) * e[1] - (a[1] - o[1]) * e[0]) / den;
      const w: number = ((a[0] - o[0]) * d[1] - (a[1] - o[1]) * d[0]) / den;
      if (w >= 0 && w < 1) out.push(t);
    }
    return out.sort((x: number, y: number): number => x - y);
  }

  /** One landmark reading. */
  interface IReading {
    id: string;
    point: V | null;
    definition: string;
    source: string;
    check: string;
    sanity: string;
    trace: V[];
  }

  /**
   * The acromion: ISO 8559-1 3.1.1 shoulder point, "most lateral point of the lateral edge of the spine (acromial process) of the scapula,
   * projected vertically to the surface of the skin", identical to ISO 7250-1's acromion. Without the bone, read on the skin's frontal
   * section through the shoulder joint centre (the plane x = GH's x) as the corner where the shoulder's top meets the arm's lateral side:
   * the profile point farthest outside the chord from the top's skin 30 mm medial of GH to the arm's lateral skin 60 mm below GH.
   */
  function acromion(mesh: M.IMesh): IReading {
    const gh: V = J.upperarm as V;
    const frame: AutoMovieLoftFrame.IFrame = { origin: gh, u: [0, 0, 1], v: [0, 1, 0] };
    const loop: C.P[] | null = R.cut(mesh, frame).loop;
    const base = { id: "acromion", definition: "on the skin's frontal section through GH (x = " + gh[0].toFixed(1) + "), the profile point farthest outside the chord from the top's skin 30 mm medial of GH to the arm's lateral skin 60 mm below GH", source: "ISO 8559-1:2017 3.1.1 shoulder point; ISO 7250-1 acromion" };
    if (loop === null) return { ...base, point: null, check: "REFUSED: no frontal section round GH", sanity: "", trace: [] };
    const top: number = Math.max(...crossings(loop, [-30, 0], [0, 1]));
    const lateral: number = Math.max(...crossings(loop, [0, -60], [1, 0]));
    const a: C.P = [-30, top];
    const b: C.P = [lateral, -60];
    const nearest = (p: C.P): number => loop.reduce((best: number, q: C.P, i: number): number => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(loop[best]![0] - p[0], loop[best]![1] - p[1]) ? i : best), 0);
    const [ia, ib]: number[] = [nearest(a), nearest(b)];
    // The arc between them over the shoulder: the one whose points stand above the chord's lower end.
    const arc = (from: number, to: number): number[] => {
      const out: number[] = [];
      for (let i: number = from; ; i = (i + 1) % loop.length) {
        out.push(i);
        if (i === to) break;
      }
      return out;
    };
    const arcs: number[][] = [arc(ia!, ib!), arc(ib!, ia!)];
    const over: number[] = arcs.reduce((x: number[], y: number[]): number[] => (x.length <= y.length ? x : y));
    const d: C.P = [b[0] - a[0], b[1] - a[1]];
    const l: number = Math.hypot(d[0], d[1]);
    const outside = (p: C.P): number => (d[0] * (p[1] - a[1]) - d[1] * (p[0] - a[0])) / l;
    let best: number = over[0]!;
    for (const i of over) if (outside(loop[i]!) > outside(loop[best]!)) best = i;
    const position: number = over.indexOf(best);
    const interior: boolean = position > 2 && position < over.length - 3 && outside(loop[best]!) >= 2;
    const point: V = world(frame, loop[best]!);
    return {
      ...base,
      point,
      check: (interior ? "interior: " : "REFUSED, AT THE WINDOW'S END: ") + "the corner stands " + outside(loop[best]!).toFixed(1) + " mm outside the chord, point " + position + " of " + over.length + " on the arc",
      sanity: "biacromial breadth over the skin's corners 2 z = " + (2 * point[2]).toFixed(1) + " mm against ANSUR II women's bony biacromial breadth 365.3 +- 18.3 mm (sitting): " + ((2 * point[2] - 365.3) / 18.3).toFixed(1) + " SD; the skin corner stands outside the bone's edge",
      trace: over.map((i: number): V => world(frame, loop[i]!)),
    };
  }

  /**
   * The axilla: the deepest point of the armpit's vault, the apex of the notch the outer skin draws between the trunk's side and the arm.
   * On frontal sections x = const every 1 mm from 60 mm in front of GH to 60 mm behind it, the outer loop round the chest (the cut's bridged
   * outer boundary, which closes the body and head skins' seam; their open pieces dropped, a parity count along a line through the trunk
   * read the trunk as air and found the head): its highest point from 60 mm medial to 10 mm lateral of GH and from 150 to 5 mm below GH,
   * the notch's apex. The highest of those over the sweep.
   */
  function axilla(mesh: M.IMesh, from: number, to: number): IReading {
    const gh: V = J.upperarm as V;
    const window = { z: [gh[2] - 60, gh[2] + 10], y: [gh[1] - 150, gh[1] - 5] };
    let best: { x: number; z: number; y: number } | null = null;
    const xs: number[] = [];
    for (let x: number = from; x <= to + 1e-9; x += 1) xs.push(x);
    const trace: V[] = [];
    for (const x of xs) {
      const frame: AutoMovieLoftFrame.IFrame = { origin: [x, gh[1] - 150, 0], u: [0, 0, 1], v: [0, 1, 0] };
      const loop: C.P[] | null = R.cut(mesh, frame).loop;
      if (loop === null) continue;
      let top: { z: number; y: number } | null = null;
      for (const p of loop) {
        const [z, y]: number[] = [p[0], p[1] + gh[1] - 150];
        if (z! < window.z[0]! || z! > window.z[1]! || y! < window.y[0]! || y! > window.y[1]!) continue;
        if (top === null || y! > top.y) top = { z: z!, y: y! };
      }
      // A section in front of or behind the armpit has no notch: its highest skin in the window lies on the window's edge. Only a section
      // whose highest point stands inside the window has the notch, and only those count.
      if (top === null || top.z < window.z[0]! + 1 || top.z > window.z[1]! - 1 || top.y > window.y[1]! - 1) continue;
      trace.push([x, top.y, top.z]);
      if (best === null || top.y > best.y) best = { x, ...top };
    }
    const base = { id: "axilla", definition: "the apex of the notch the outer skin draws between the trunk's side and the arm, the vault being the hollow between the two axillary folds: on frontal sections every 1 mm from the posterior fold's x to the anterior fold's x (" + from.toFixed(1) + " to " + to.toFixed(1) + "), the bridged outer loop's highest point from 60 mm medial to 10 mm lateral of GH and from 150 to 5 mm below GH, where that point stands inside that window (the section has a notch); the highest over the sweep", source: "ISO 8559-1 armscye girth's armpit; the vault's apex" };
    if (best === null) return { ...base, point: null, check: "REFUSED: no outer skin in the window under the shoulder", sanity: "", trace };
    const interior: boolean = best.x > xs[0]! + 2 && best.x < xs.at(-1)! - 2 && best.z > window.z[0]! + 2 && best.z < window.z[1]! - 2 && best.y < window.y[1]! - 1 && best.y > window.y[0]! + 1;
    return {
      ...base,
      point: [best.x, best.y, best.z],
      check: (interior ? "interior" : "REFUSED, AT THE WINDOW'S END") + ": " + (gh[1] - best.y).toFixed(1) + " mm below GH, " + (gh[2] - best.z).toFixed(1) + " mm medial of it, " + (best.x - gh[0]).toFixed(1) + " mm forward of it",
      sanity: "the joint table's armpit crease datum stands at " + fixed(AutoMovieHumanF1Placement.point("armpit")) + ", " + norm(sub([best.x, best.y, best.z], AutoMovieHumanF1Placement.point("armpit") as V)).toFixed(1) + " mm away",
      trace,
    };
  }

  /**
   * The anterior and posterior axillary fold points: ISO 8559-1 3.1.13 "front fold point of the armpit on arm scye line determined using a
   * scale placed under arm"; "The level is decided as the upper edge of a rule placed under the armpit". In the reference's A-pose the arm
   * does not hang, so the rule's edge is taken at the axilla's height, read 3 mm above it, where the trunk and the arm are one loop: on that
   * level section, the skin point deepest inside the tape's bridge from the chest to the arm in front (the anterior fold) and from the back
   * to the arm behind (the posterior fold), among points from 70 mm medial to 30 mm lateral of GH.
   */
  function folds(mesh: M.IMesh, y: number): { front: IReading; back: IReading; level: V[] } {
    const gh: V = J.upperarm as V;
    const frame: AutoMovieLoftFrame.IFrame = { origin: [0, y, 60], u: [1, 0, 0], v: [0, 0, 1] };
    const loop: C.P[] | null = R.cut(mesh, frame).loop;
    const read = (id: string, sense: 1 | -1, source: string, definition: string): IReading => {
      const base = { id, source, definition };
      if (loop === null) return { ...base, point: null, check: "REFUSED: no level section round the chest at " + y.toFixed(1), sanity: "", trace: [] };
      const hull: C.P[] = R.hull(loop);
      const window = (p: C.P): boolean => p[1] >= gh[2] - 70 && p[1] <= gh[2] + 30 && sense * (p[0] - gh[0]) > -20;
      let best: { p: C.P; depth: number } | null = null;
      for (const p of loop) {
        if (!window(p)) continue;
        let least: number = Infinity;
        for (let k: number = 0; k < hull.length; ++k) {
          const a: C.P = hull[k]!;
          const b: C.P = hull[(k + 1) % hull.length]!;
          const e: C.P = [b[0] - a[0], b[1] - a[1]];
          const l: number = Math.hypot(e[0], e[1]) || 1;
          const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / (l * l)));
          least = Math.min(least, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]));
        }
        if (best === null || least > best.depth) best = { p, depth: least };
      }
      if (best === null) return { ...base, point: null, check: "REFUSED: no skin in the window", sanity: "", trace: [] };
      const atEnd: boolean = Math.abs(best.p[1] - (gh[2] - 70)) < 2 || Math.abs(best.p[1] - (gh[2] + 30)) < 2;
      return { ...base, point: world(frame, best.p), check: (best.depth >= 2 && !atEnd ? "interior" : "REFUSED, AT THE WINDOW'S END OR SHALLOW") + ": " + best.depth.toFixed(1) + " mm inside the tape's bridge", sanity: "", trace: [] };
    };
    const front: IReading = read("fold-anterior", 1, "ISO 8559-1:2017 3.1.13 armpit front fold point", "on the level section 3 mm above the axilla (the rule's edge, A-pose), the skin point deepest inside the tape's bridge from the chest to the arm in front, from 70 mm medial to 30 mm lateral of GH");
    const back: IReading = read("fold-posterior", -1, "ISO 8559-1 armscye line; ANSUR II Interscye I's posterior axillary fold landmark", "the same level section's deepest point inside the tape's bridge from the back to the arm behind");
    const level: V[] = loop === null ? [] : loop.map((p: C.P): V => world(frame, p));
    // ANSUR II Interscye I: across the back between the posterior fold points, the tape on the skin but across the back's hollow: the hull's
    // path along the back between the two fold points, the other side the reflection in z = 0.
    if (loop !== null && back.point !== null) {
      const hull: C.P[] = R.hull(loop);
      const behind: C.P[] = hull.filter((p: C.P): boolean => p[0] < back.point![0] && Math.abs(p[1]) <= back.point![2]);
      const ordered: C.P[] = [[back.point[0], -back.point[2]], ...behind.sort((p: C.P, q: C.P): number => p[1] - q[1]), [back.point[0], back.point[2]]];
      let length: number = 0;
      for (let k: number = 1; k < ordered.length; ++k) length += Math.hypot(ordered[k]![0] - ordered[k - 1]![0], ordered[k]![1] - ordered[k - 1]![1]);
      back.sanity = "Interscye I over the back's hull between the two posterior fold points " + length.toFixed(1) + " mm against ANSUR II women 373.4 +- 29.8 mm: " + ((length - 373.4) / 29.8).toFixed(1) + " SD (ANSUR's arms hang; the A-pose spreads the back)";
    }
    return { front, back, level };
  }

  /**
   * One piece of the landmark loop: the skin's section by the plane through the shoulder joint centre and the piece's two landmarks, from
   * one to the other on the side facing away from GH. A plane through the joint centre cuts the skin round the joint, as a tape round the
   * armscye lies when drawn taut in that plane; a geodesic would need a surface solver the tools do not have.
   */
  function piece(mesh: M.IMesh, p: V, q: V): V[] {
    const gh: V = J.upperarm as V;
    const u: V = unit(sub(p, gh));
    const v: V = perpendicular(sub(q, gh), u);
    const frame: AutoMovieLoftFrame.IFrame = { origin: gh, u, v };
    const loop: C.P[] | null = R.cut(mesh, frame).loop;
    if (loop === null) return [p, q];
    const chart = (x: V): C.P => [dot(sub(x, gh), u), dot(sub(x, gh), v)];
    const [cp, cq]: C.P[] = [chart(p), chart(q)];
    const angle = (c: C.P): number => Math.atan2(c[1], c[0]);
    const theta: number = angle(cq!);
    const nearest = (c: C.P): number => loop.reduce((best: number, x: C.P, i: number): number => (Math.hypot(x[0] - c[0], x[1] - c[1]) < Math.hypot(loop[best]![0] - c[0], loop[best]![1] - c[1]) ? i : best), 0);
    const [ip, iq]: number[] = [nearest(cp!), nearest(cq!)];
    const walk = (from: number, to: number, step: 1 | -1): number[] => {
      const out: number[] = [];
      for (let i: number = from; ; i = (i + step + loop.length) % loop.length) {
        out.push(i);
        if (i === to) break;
      }
      return out;
    };
    const inside = (i: number): boolean => {
      const a: number = angle(loop[i]!);
      return theta >= 0 ? a >= -0.05 && a <= theta + 0.05 : a <= 0.05 && a >= theta - 0.05;
    };
    const arcs: number[][] = [walk(ip!, iq!, 1), walk(ip!, iq!, -1)];
    const chosen: number[] = arcs.reduce((x: number[], y: number[]): number[] => (x.filter(inside).length / x.length >= y.filter(inside).length / y.length ? x : y));
    return chosen.map((i: number): V => world(frame, loop[i]!));
  }

  /** Today's port loop in the world: `armscye(+1)`'s columns on the trunk's skin, read on the trunk's lofted ring at each column's station. */
  function today(): V[] {
    const placed: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const loop = AutoMovieHumanF1.armscye(1, placed);
    const trunk: H.IFamily = placed.body.trunk;
    const pelvis: SF.IFrame = AutoMovieHumanF1Placement.frame("pelvis", placed.frames);
    const floor: V = SF.toLocal(pelvis, trunk.centres[0]!) as V;
    const t: V = unit(sub(SF.toLocal(pelvis, trunk.centres[1]!) as V, floor));
    const u: V = perpendicular(SF.toLocalDirection(pelvis, trunk.up) as V, t);
    const v: V = cross(u, t);
    // `armscye` always writes a share per column (`around`); a loop without one is the plain ellipse, every share 1.
    const shape: number[] = loop.shape === undefined ? Array.from({ length: 96 }, (): number => 1) : [...loop.shape];
    const columns: number = shape.length;
    const stations: number[] = shape.map((share: number, k: number): number => 1000 * (loop.centre[0] + share * loop.semi[0] * Math.cos((2 * Math.PI * k) / columns)));
    const phases: number[] = shape.map((share: number, k: number): number => loop.centre[1] + (share * loop.semi[1] * Math.sin((2 * Math.PI * k) / columns)) / loop.sense);
    const grid: number[] = [...new Set(stations.map((s: number): number => Math.round(s)))].sort((a: number, b: number): number => a - b);
    const loft: AutoMovieViewLoft.IResult = H.create(trunk, [Math.min(...grid) - 2, ...grid, Math.max(...grid) + 2].filter((s: number, i: number, all: number[]): boolean => i === 0 || s > all[i - 1]!));
    if (loft.chain === null) throw new Error("the trunk does not loft at the port's stations");
    const chain = loft.chain;
    return stations.map((s: number, k: number): V => {
      // The ring at the column's station, read as phases about the trunk's course in its chart, and the ring point at the column's phase.
      const read = AutoMovieLoftChain.sampler(chain, s);
      const ring: { phi: number; p: V }[] = Array.from({ length: 2048 }, (_: unknown, j: number) => {
        const p: V = read((2 * Math.PI * j) / 2048) as V;
        const q: V = sub(SF.toLocal(pelvis, p) as V, floor);
        return { phi: Math.atan2(dot(q, v), dot(q, u)), p };
      });
      const target: number = Math.atan2(Math.sin(phases[k]!), Math.cos(phases[k]!));
      return ring.reduce((a, b) => (Math.abs(Math.atan2(Math.sin(b.phi - target), Math.cos(b.phi - target))) < Math.abs(Math.atan2(Math.sin(a.phi - target), Math.cos(a.phi - target))) ? b : a)).p;
    });
  }

  /** A closed polyline's point at a clock about a centre in a plane: the crossing of the ray at that clock with the polyline. */
  function atClock(loop: readonly V[], centre: V, e1: V, e2: V, clock: number): V | null {
    const chart: C.P[] = loop.map((p: V): C.P => [dot(sub(p, centre), e1), dot(sub(p, centre), e2)]);
    const d: C.P = [Math.cos(clock), Math.sin(clock)];
    let best: { t: number; i: number; w: number } | null = null;
    for (let i: number = 0; i < chart.length; ++i) {
      const a: C.P = chart[i]!;
      const b: C.P = chart[(i + 1) % chart.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
      if (w >= 0 && w <= 1 && t > 0 && (best === null || t > best.t)) best = { t, i, w };
    }
    if (best === null) return null;
    return add(loop[best.i]!, scale(sub(loop[(best.i + 1) % loop.length]!, loop[best.i]!), best.w));
  }

  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const mesh: M.IMesh = source.all;
    const gh: V = J.upperarm as V;
    const lines: string[] = ["f1 armscye landmark loop, the stored side (+Z), mm (forward +X, up +Y)", "GH (the shoulder joint centre, the humerus's origin): " + fixed(gh, 2), ""];

    // 1. The landmarks. The folds' level is the rule's edge at the axilla, and the axilla is read between the folds, so the two are resolved
    // as a fixed point: the level starts 40 mm below GH, the axilla is read between the folds read there, the level moves to 3 mm above it,
    // until the axilla moves less than 0.5 mm; refused if it has not settled in five passes.
    const ac: IReading = acromion(mesh);
    let level: number = gh[1] - 40;
    let fold: { front: IReading; back: IReading; level: V[] } | null = null;
    let ax: IReading = { id: "axilla", point: null, definition: "", source: "", check: "REFUSED: not read", sanity: "", trace: [] };
    let settled: boolean = false;
    for (let pass: number = 1; pass <= 5 && !settled; ++pass) {
      fold = folds(mesh, level);
      if (fold.front.point === null || fold.back.point === null || fold.front.check.startsWith("REFUSED") || fold.back.check.startsWith("REFUSED")) {
        lines.push(`pass ${pass}: level ${level.toFixed(2)}: a fold is refused (${fold.front.check}; ${fold.back.check})`);
        break;
      }
      const previous: V | null = ax.point;
      ax = axilla(mesh, fold.back.point[0], fold.front.point[0]);
      lines.push(`pass ${pass}: level ${level.toFixed(2)}: folds at x ${fold.back.point[0].toFixed(2)} (back) and ${fold.front.point[0].toFixed(2)} (front); axilla ${ax.point === null ? "none" : fixed(ax.point, 2)} (${ax.check})`);
      if (ax.point === null || ax.check.startsWith("REFUSED")) break;
      settled = previous !== null && norm(sub(ax.point, previous)) < 0.5;
      level = ax.point[1] + 3;
    }
    if (!settled && ax.point !== null && !ax.check.startsWith("REFUSED")) ax = { ...ax, check: "REFUSED, NOT SETTLED IN FIVE PASSES: " + ax.check };
    lines.push("");
    const readings: IReading[] = [ac, ax, ...(fold === null ? [] : [fold.front, fold.back])];
    const thorax: SF.IFrame = AutoMovieHumanF1Placement.frame("thorax");
    for (const r of readings) lines.push(r.id + (r.point === null ? "  (none)" : "  " + fixed(r.point, 2) + "; thorax frame " + fixed(SF.toLocal(thorax, r.point), 2)), "  definition: " + r.definition, "  source: " + r.source, "  check: " + r.check, ...(r.sanity === "" ? [] : ["  sanity: " + r.sanity]), "");
    const refused: string[] = readings.filter((r: IReading): boolean => r.point === null || r.check.startsWith("REFUSED")).map((r: IReading): string => r.id);

    // 2. The loop: acromion, anterior fold, axilla, posterior fold, back to the acromion.
    const order: (V | null)[] = [ac.point, fold?.front.point ?? null, ax.point, fold?.back.point ?? null];
    const complete: boolean = order.every((p: V | null): boolean => p !== null) && refused.length === 0;
    const landmark: V[] = complete ? order.flatMap((p: V | null, k: number): V[] => piece(mesh, p!, order[(k + 1) % order.length]!)) : [];
    lines.push(complete ? "LOOP: " + landmark.length + " points, plane-section pieces through GH between consecutive landmarks (acromion, anterior fold, axilla, posterior fold)" : "LOOP: not drawn, refused landmarks " + refused.join(", "), "");

    // 3. Today's port against it.
    const port: V[] = today();
    const table: string[] = [];
    if (complete) {
      // The landmark loop's own plane (Newell's normal) and centroid; clock 0 toward the acromion.
      const centre: V = scale(landmark.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / landmark.length);
      let n: V = [0, 0, 0];
      for (let i: number = 0; i < landmark.length; ++i) n = add(n, cross(sub(landmark[i]!, centre), sub(landmark[(i + 1) % landmark.length]!, centre)));
      n = unit(n);
      const e1: V = perpendicular(sub(ac.point!, centre), n);
      const e2: V = cross(n, e1);
      const clockOf = (p: V): number => (Math.atan2(dot(sub(p, centre), e2), dot(sub(p, centre), e1)) * 180) / Math.PI;
      lines.push("TODAY'S PORT AGAINST THE LANDMARK LOOP: clocks about the landmark loop's centroid " + fixed(centre) + " in its plane (normal " + fixed(n, 3) + "), 0 at the acromion; landmarks at " + readings.map((r: IReading): string => r.id + " " + clockOf(r.point!).toFixed(0) + " deg").join(", "));
      lines.push("  distance: the straight distance between the two loops' points at the same clock, a lower bound of the distance along the skin; today's point's z against the trunk's clip at |v| = 151 mm; its height against the axilla's");
      for (let k: number = 0; k < 24; ++k) {
        const clock: number = (2 * Math.PI * k) / 24;
        const a: V | null = atClock(landmark, centre, e1, e2, clock);
        const b: V | null = atClock(port, centre, e1, e2, clock);
        if (a === null || b === null) {
          table.push(`  ${(k * 15).toString().padStart(3)} deg: ${a === null ? "no landmark loop point" : "no port point"}`);
          continue;
        }
        const d: V = sub(b, a);
        table.push(`  ${(k * 15).toString().padStart(3)} deg: landmark ${fixed(a)} port ${fixed(b)} distance ${norm(d).toFixed(1)} mm (port ${d[0] >= 0 ? "+" : ""}${d[0].toFixed(1)} x, ${d[1] >= 0 ? "+" : ""}${d[1].toFixed(1)} y, ${d[2] >= 0 ? "+" : ""}${d[2].toFixed(1)} z); port z ${b[2].toFixed(1)}${Math.abs(b[2] - 151) < 8 ? " AT THE CLIP" : ""}; port ${(b[1] - ax.point![1]).toFixed(1)} mm above the axilla`);
      }
      lines.push(...table, "");
    }

    // 4. The cap the arm would own: sections square to the humerus about a course from GH, between the loop's extreme stations.
    const humerus: V = unit(sub(J.lowerarm as V, gh));
    if (complete) {
      const stations: number[] = landmark.map((p: V): number => dot(sub(p, gh), humerus));
      const [s0, s1]: number[] = [Math.min(...stations), Math.max(...stations)];
      lines.push(`ARM'S CAP: the landmark loop spans stations ${s0.toFixed(1)} to ${s1.toFixed(1)} mm along the humerus from GH (course GH to the elbow centre)`);
      const fore: V = perpendicular([1, 0, 0], humerus);
      for (let s: number = Math.floor(s0); s <= Math.ceil(s1); s += 4) {
        const origin: V = add(gh, scale(humerus, s));
        const frame: AutoMovieLoftFrame.IFrame = { origin, u: fore, v: cross(humerus, fore) };
        const cut: C.P[] | null = R.cut(mesh, frame).loop;
        if (cut === null) {
          lines.push(`  ${s.toFixed(0)}: no section round the course`);
          continue;
        }
        // The landmark loop's crossings of this plane, in the plane's chart.
        const side = (p: V): number => dot(sub(p, origin), humerus);
        const hits: C.P[] = [];
        for (let i: number = 0; i < landmark.length; ++i) {
          const [a, b]: V[] = [landmark[i]!, landmark[(i + 1) % landmark.length]!];
          if (side(a!) * side(b!) > 0 || side(a!) === side(b!)) continue;
          const t: number = side(a!) / (side(a!) - side(b!));
          const p: V = add(a!, scale(sub(b!, a!), t));
          hits.push([dot(sub(p, origin), frame.u), dot(sub(p, origin), frame.v)]);
        }
        // The cap's piece of the section: past the chord between the two crossings, on the side away from the trunk (+Z in the world).
        let piece: C.P[] = cut;
        let closed: string = "whole section (the plane misses the loop)";
        if (hits.length >= 2) {
          const [h0, h1]: C.P[] = [hits[0]!, hits[hits.length - 1]!];
          const e: C.P = [h1![0] - h0![0], h1![1] - h0![1]];
          const away: C.P = [-e[1], e[0]];
          const outward: number = Math.sign(dot(world(frame, [away[0] + h0![0], away[1] + h0![1]]), [0, 0, 1]) - dot(world(frame, h0!), [0, 0, 1])) || 1;
          piece = [h0!, ...cut.filter((p: C.P): boolean => outward * ((p[0] - h0![0]) * away[0] + (p[1] - h0![1]) * away[1]) > 0), h1!];
          closed = `cap past the chord between the loop's ${hits.length} crossings`;
        }
        // Star-shape about the course point: rays that meet the piece's boundary more than once, and how far apart their crossings stand.
        let foldsCount: number = 0;
        let deepest: number = 0;
        const where: number[] = [];
        for (let j: number = 0; j < 720; ++j) {
          const phi: number = (2 * Math.PI * j) / 720;
          const ts: number[] = crossings(piece, [0, 0], [Math.cos(phi), Math.sin(phi)]).filter((t: number): boolean => t > 0);
          if (ts.length > 1) {
            ++foldsCount;
            deepest = Math.max(deepest, ts.at(-1)! - ts[0]!);
            where.push(Math.round((phi * 180) / Math.PI));
          }
        }
        const inside: boolean = crossings(piece, [0, 0], [1, 0]).filter((t: number): boolean => t > 0).length % 2 === 1;
        lines.push(`  ${s.toFixed(0)}: ${closed}; course point ${inside ? "inside" : "OUTSIDE"} the piece; ${foldsCount === 0 ? "star-shaped about the course" : `NOT STAR-SHAPED: ${foldsCount} of 720 rays cross more than once, up to ${deepest.toFixed(1)} mm apart, at ${where[0]} to ${where.at(-1)} deg (0 forward, 90 toward the chart's v = humerus x forward)`}`);
      }
      lines.push("");
    }

    // Frames: the landmarks, both loops and the construction traces, over the reference and over the generated figure.
    const out: string = path.join(root, "test/.shots/family-conic-armscye-loop", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const crop = (m: M.IMesh, centre: V, radius: number, unitScale: number): N.Mesh => {
      const positions: number[] = [];
      const indices: number[] = [];
      const remap: Map<number, number> = new Map();
      const near = (i: number): boolean => norm(sub([m.positions[3 * i]! * unitScale, m.positions[3 * i + 1]! * unitScale, m.positions[3 * i + 2]! * unitScale], centre)) <= radius;
      for (let t: number = 0; t + 2 < m.indices.length; t += 3) {
        const tri: number[] = [m.indices[t]!, m.indices[t + 1]!, m.indices[t + 2]!];
        if (!tri.every(near)) continue;
        for (const i of tri) {
          let j: number | undefined = remap.get(i);
          if (j === undefined) {
            j = positions.length / 3;
            remap.set(i, j);
            positions.push(m.positions[3 * i]! * unitScale, m.positions[3 * i + 1]! * unitScale, m.positions[3 * i + 2]! * unitScale);
          }
          indices.push(j);
        }
      }
      return { id: "skin", positions, indices, colour: [0.64, 0.65, 0.67] };
    };
    const generatedPieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generatedIndices: number[] = [];
    let offset: number = 0;
    for (const p of generatedPieces) {
      for (const i of p.indices) generatedIndices.push(i + offset);
      offset += p.positions.length / 3;
    }
    const generated: M.IMesh = { positions: generatedPieces.flatMap((p: AutoMovieHumanF1.IPiece): number[] => p.positions), indices: generatedIndices };
    const cross8 = (p: V, colour: string): N.Curve[] => [0, 1, 2].map((c: number): N.Curve => {
      const a: V = [...p];
      const b: V = [...p];
      a[c] -= 8;
      b[c] += 8;
      return { id: "mark" + c, points: [a, b], closed: false, xray: true, colour };
    });
    const curves: N.Curve[] = [
      ...readings.filter((r: IReading): boolean => r.point !== null).flatMap((r: IReading): N.Curve[] => cross8(r.point!, "e0201c")),
      ...cross8(gh, "202020"),
      ...(complete ? [{ id: "landmark-loop", points: landmark, closed: true, xray: true, colour: "1f9d3a" }] : []),
      { id: "port-today", points: port, closed: true, xray: true, colour: "2f6fd0" },
    ];
    const traces: N.Curve[] = [...readings.filter((r: IReading): boolean => r.trace.length > 1).map((r: IReading): N.Curve => ({ id: "trace." + r.id, points: r.trace, closed: false, xray: true, colour: "d08a1f" })), ...(fold === null ? [] : [{ id: "level", points: fold.level.filter((p: V): boolean => p[2] > 40), closed: false, xray: true, colour: "d08a1f" }])];
    const frames: { file: string; sha256: string }[] = [];
    const centre: V = ax.point ?? gh;
    for (const [stage, m] of [["reference", crop(mesh, centre, 220, 1)], ["generated", crop(generated, centre, 220, 1000)]] as [string, N.Mesh][]) {
      const bounds: N.Point[] = [];
      for (let i: number = 0; i < m.positions.length; i += 3) bounds.push([m.positions[i]!, m.positions[i + 1]!, m.positions[i + 2]!]);
      for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
        const file: string = `armscye.${view}.${stage}.png`;
        const png: Buffer = NodeCanvasRaster.render(camera, [m], [...curves, ...(stage === "reference" ? traces : [])], "depth", `f1 armscye | ${stage} | green: landmark loop, blue: today's port, red: landmarks, black: GH | ${view}`).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        const pixels: string = readings.filter((r: IReading): boolean => r.point !== null).map((r: IReading): string => r.id + " " + NodeCanvasCamera.project(r.point!, camera).slice(0, 2).map((x: number): string => x.toFixed(0)).join(",")).join("; ");
        lines.push(`frame ${file}: ${pixels}`);
      }
    }
    lines.push("", "The loop in the thorax frame (every 8th point): " + landmark.filter((_: V, i: number): boolean => i % 8 === 0).map((p: V): string => fixed(SF.toLocal(thorax, p))).join(" "));
    await fs.writeFile(path.join(out, "armscye.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "armscye.json"), JSON.stringify({ gh, readings, landmark, port, frames }, null, 2));
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }
}

void FamilyConicArmscyeLoop.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
