import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieMeshExtract as M, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicPose, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The armscye's loop by a rule from the skeleton (issue #3151, R1). The armscye is the trunk's opening bounded by the clavicle and the
 * acromion above, the pectoralis major's fold in front and the latissimus's and teres major's fold behind, all of which run from the
 * shoulder girdle to the arm, so its loop is fixed in the thorax's frame, and the arm's pose is taken by the port's band between that loop
 * and the arm's own ring (the supervisor's ruling, after the humerus-fixed planes and cones of the first run cut the torso across).
 *
 * Each candidate is a plane fixed in the thorax's frame: its normal the thorax's lateral axis turned forward about the thorax's vertical by
 * `beta`, placed `m = k r` medial of the shoulder joint centre GH along that normal, `r` the arm's own radius (the relaxed mid upper arm
 * girth, ISO 8559-1, 266.4 mm on f1's wall, over 2 pi). `beta` 0 is the record's own armscye plane, the sagittal plane at the armpit's side
 * distance (`AutoMovieHumanF1` `armscye`); 15 and 30 degrees turn it toward the scapular plane, which stands about 30 degrees forward of the
 * frontal plane in the anatomy texts, and 41.1 degrees is the scapula's internal rotation on the thorax at rest measured with bone pins
 * (Ludewig et al. 2009, Table I; `packages/human/docs/sources/ludewig-2009-shoulder-complex.md`).
 *
 * The ring is read near-side: on each of 720 rays in the plane from the plane's point under GH (GH projected onto it), the first skin
 * crossing only, so it stays round the arm's root. Checks: rays that meet no skin; jumps between neighbouring rays (an occlusion, where the
 * section is not star-shaped from that point); straight distances to the accepted acromion and fold points (a lower bound along the skin);
 * the ring's reach past the trunk's clip at |v| = 151 mm; its clearance from the breast's port; and, at the reference and the neutral pose,
 * the arm's own ring against it: the distance between their centres and the angle between the plane's normal and the arm's course there,
 * which is how far the port's band must turn. The ring does not move with the arm's pose or its depth: it is fixed in the thorax, the
 * limb law holds the shoulder, and the segment lengths do not move GH.
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicArmscyeRule.cjs`. It writes `rule.txt` and the frames under
 * `test/.shots/family-conic-armscye-rule/<time>/`.
 */
namespace FamilyConicArmscyeRule {
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
  const degrees = (rad: number): number => (rad * 180) / Math.PI;

  /** f1's relaxed mid upper arm girth, mm: ISO 8559-1, read on the stored wall by `FamilyConicLimbLaw` (run 2026-11-14T17-26-42). */
  const UPPER_ARM_GIRTH_MM: number = 266.374;

  /** The landmarks the supervisor accepted on #3151 (`FamilyConicArmscyeLoop`, run 2026-11-14T18-15-24): checks, not targets. */
  const LANDMARKS: Record<string, V> = {
    acromion: [-16.33, 1382.48, 187.16],
    "fold-anterior": [36.55, 1317.35, 160.71],
    "fold-posterior": [-65.95, 1317.35, 157.84],
  };

  /** The trunk's clip: its sections are cut at the armscye's sagittal plane, |v| <= 151 mm (`FamilyConicBody`, `ARMPIT_MM`). */
  const CLIP_MM: number = 151;

  /** How far the ring must stay from the breast's port loop, mm: the arm's band's rail, 10 mm (`AutoMovieHumanF1.RAIL_MM.arm`). */
  const CLEAR_MM: number = 10;

  /** Rays a ring is read along: half a degree apart, a sample every 0.6 mm on a ring of 70 mm radius. */
  const RAYS: number = 720;

  /** A jump between neighbouring rays' radii that marks an occlusion, mm: ten times the ray spacing at that radius. */
  const JUMP_MM: number = 6;

  /** The arm's ring the band lands on, mm past the arm's first knot: the arm's rail (`AutoMovieHumanF1.RAIL_MM.arm`). */
  const ARM_RAIL_MM: number = 10;

  const BETAS: { beta: number; basis: string }[] = [
    { beta: 0, basis: "the record's own armscye plane (sagittal)" },
    { beta: 15, basis: "between" },
    { beta: 30, basis: "the scapular plane of the anatomy texts" },
    { beta: 41.1, basis: "scapulothoracic internal rotation at rest, Ludewig 2009 Table I" },
  ];
  const KS: number[] = [0, 0.5, 1];

  /** The trunk's chart at the reference pose (`AutoMovieHumanF1` `trunkChart`): `v` across the course toward the stored side. */
  function trunkChart(): (p: V) => { station: number; u: number; v: number } {
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const pelvis: SF.IFrame = P.frame("pelvis");
    const floor: V = SF.toLocal(pelvis, trunk.centres[0]!) as V;
    const t: V = unit(sub(SF.toLocal(pelvis, trunk.centres[1]!) as V, floor));
    const u: V = perpendicular(SF.toLocalDirection(pelvis, trunk.up) as V, t);
    const v: V = cross(u, t);
    return (p: V) => {
      const q: V = sub(SF.toLocal(pelvis, p) as V, floor);
      return { station: dot(q, t), u: dot(q, u), v: dot(q, v) };
    };
  }

  /** The stored trunk round the shoulder as a mesh, mm: its loft with its nets, a ring every millimetre at 720 phases. */
  function trunkMesh(): M.IMesh {
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const stations: number[] = [];
    for (let s: number = 380; s <= 760; s += 1) stations.push(s);
    const loft: AutoMovieViewLoft.IResult = H.create(trunk, stations);
    if (loft.chain === null) throw new Error("the trunk does not loft round the shoulder");
    const chain = loft.chain;
    const K: number = 720;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const s of stations) {
      const read = AutoMovieLoftChain.sampler(chain, s);
      for (let j: number = 0; j < K; ++j) positions.push(...read((2 * Math.PI * j) / K));
    }
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < K; ++j) {
        const a: number = i * K + j, b: number = i * K + ((j + 1) % K);
        indices.push(a, a + K, b, b, a + K, b + K);
      }
    return { positions, indices };
  }

  /** The breast's port loop in the world, read on the trunk's skin (`AutoMovieHumanF1.mammary`). */
  function breastPort(trunk: M.IMesh): V[] {
    const loop = AutoMovieHumanF1.mammary(1, AutoMovieHumanF1.assemble());
    const chart = trunkChart();
    const shape: number[] = loop.shape === undefined ? Array.from({ length: 64 }, (): number => 1) : [...loop.shape];
    const targets: { station: number; phase: number }[] = shape.map((share: number, k: number) => ({ station: 1000 * (loop.centre[0] + share * loop.semi[0] * Math.cos((2 * Math.PI * k) / shape.length)), phase: loop.centre[1] + (share * loop.semi[1] * Math.sin((2 * Math.PI * k) / shape.length)) / loop.sense }));
    const points: { p: V; station: number; phase: number }[] = [];
    for (let i: number = 0; i < trunk.positions.length; i += 3 * 7) {
      const p: V = [trunk.positions[i]!, trunk.positions[i + 1]!, trunk.positions[i + 2]!];
      const c = chart(p);
      points.push({ p, station: c.station, phase: Math.atan2(c.v, c.u) });
    }
    return targets.map((t) => points.reduce((a, b) => (Math.hypot(b.station - t.station, CLIP_MM * (b.phase - t.phase)) < Math.hypot(a.station - t.station, CLIP_MM * (a.phase - t.phase)) ? b : a)).p);
  }

  /** A plane fixed in the thorax: its point under GH and its chart. */
  function plane(beta: number, k: number): { centre: V; frame: AutoMovieLoftFrame.IFrame; normal: V } {
    const thorax: SF.IFrame = P.frame("thorax");
    const [x, y, z]: V[] = [thorax.axes[0] as V, thorax.axes[1] as V, thorax.axes[2] as V];
    const b: number = (beta * Math.PI) / 180;
    const normal: V = unit(add(scale(z!, Math.cos(b)), scale(x!, Math.sin(b))));
    const gh: V = P.frame("humerus").origin as V;
    const centre: V = sub(gh, scale(normal, (k * UPPER_ARM_GIRTH_MM) / (2 * Math.PI)));
    const u: V = perpendicular(y!, normal);
    return { centre, frame: { origin: centre, u, v: cross(normal, u) }, normal };
  }

  /**
   * The near-side ring: on each ray in the plane from its centre, the first skin crossing; null where a ray meets no skin. Every piece of
   * the plane's cut counts, open or closed: the trunk wall is a tube whose ends the plane can cross, and the reference's skins meet at
   * seams, so a cut through either is in open pieces, which a closed-loop reading (`FamilyConicSource.loops`) drops and the first run
   * read as rays meeting no skin.
   */
  function ring(mesh: M.IMesh, frame: AutoMovieLoftFrame.IFrame): (V | null)[] {
    const n: V = cross(frame.v as V, frame.u as V);
    const section: M.ISection = M.outline(mesh, { origin: [...frame.origin] as V, axes: [n, [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!;
    const pieces: { points: C.P[]; closed: boolean }[] = section.loops.map((loop: M.ILoop) => ({ points: [...loop.points], closed: loop.closed }));
    return Array.from({ length: RAYS }, (_: unknown, j: number): V | null => {
      const d: C.P = [Math.cos((2 * Math.PI * j) / RAYS), Math.sin((2 * Math.PI * j) / RAYS)];
      let best: number = Infinity;
      for (const { points: loop, closed } of pieces)
        for (let i: number = 0; i < (closed ? loop.length : loop.length - 1); ++i) {
          const a: C.P = loop[i]!;
          const e: C.P = [loop[(i + 1) % loop.length]![0] - a[0], loop[(i + 1) % loop.length]![1] - a[1]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (den === 0) continue;
          const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
          const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
          if (w >= 0 && w < 1 && t > 0 && t < best) best = t;
        }
      return Number.isFinite(best) ? add(frame.origin as V, add(scale(frame.u as V, best * d[0]), scale(frame.v as V, best * d[1]))) : null;
    });
  }

  /** The arm's own ring at its rail at a pose, as world points, with its centre and the arm's course direction there. */
  function armRing(frames: P.IFrames): { centre: V; along: V; points: V[] } {
    const arm: H.IFamily = AutoMovieHumanF1.assemble(frames === P.frames() ? undefined : P.NEUTRAL).body.arm;
    const s0: number = arm.knots[0]!;
    const loft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined, reliefs: undefined }, [s0, s0 + ARM_RAIL_MM, s0 + 2 * ARM_RAIL_MM]);
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const read = AutoMovieLoftChain.sampler(loft.chain, s0 + ARM_RAIL_MM);
    const points: V[] = Array.from({ length: 128 }, (_: unknown, j: number): V => read((2 * Math.PI * j) / 128) as V);
    const axis = H.axis(arm);
    const [a, b] = [axis.at(s0 + ARM_RAIL_MM - 1).origin as V, axis.at(s0 + ARM_RAIL_MM + 1).origin as V];
    return { centre: scale(points.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / points.length), along: unit(sub(b, a)), points };
  }

  const distanceTo = (p: V, loop: readonly V[]): number => Math.min(...loop.map((q: V): number => norm(sub(p, q))));

  /** Spacing of the cap's sections along the course from GH, mm (the supervisor's brief for R2). */
  const CAP_STEP_MM: number = 2;

  /** How near today's arm course must come to the GH course for the two to agree, mm (the supervisor's brief for R2). */
  const AGREE_MM: number = 2;

  /**
   * One cap section: the skin's section square to the GH course at a station, kept on the arm's side of the girdle's plane (lateral of
   * it), closed along the plane's line where it crosses; and whether it is star-shaped about the course point.
   */
  function capSection(mesh: M.IMesh, gh: V, distal: V, girdle: V, s: number): { loop: V[]; inside: boolean; folds: number; deepest: number; phases: [number, number] | null } | null {
    const origin: V = add(gh, scale(distal, s));
    const fore: V = perpendicular([1, 0, 0], distal);
    const frame: AutoMovieLoftFrame.IFrame = { origin, u: fore, v: cross(distal, fore) };
    const cut: C.P[] | null = R.cut(mesh, frame).loop;
    if (cut === null) return null;
    const world = (p: C.P): V => add(origin, add(scale(fore, p[0]), scale(frame.v as V, p[1])));
    // Lateral of the girdle's plane: the plane through GH with the thorax's lateral axis as its normal.
    const side = (p: C.P): number => dot(sub(world(p), gh), girdle);
    const kept: C.P[] = [];
    for (let i: number = 0; i < cut.length; ++i) {
      const [a, b]: C.P[] = [cut[i]!, cut[(i + 1) % cut.length]!];
      if (side(a!) >= 0) kept.push(a!);
      if (side(a!) * side(b!) < 0) {
        const t: number = side(a!) / (side(a!) - side(b!));
        kept.push([a![0] + t * (b![0] - a![0]), a![1] + t * (b![1] - a![1])]);
      }
    }
    if (kept.length < 3) return null;
    const crossings = (d: C.P): number[] => {
      const out: number[] = [];
      for (let i: number = 0; i < kept.length; ++i) {
        const a: C.P = kept[i]!;
        const e: C.P = [kept[(i + 1) % kept.length]![0] - a[0], kept[(i + 1) % kept.length]![1] - a[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (den === 0) continue;
        const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
        const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
        if (w >= 0 && w < 1 && t > 0) out.push(t);
      }
      return out.sort((x: number, y: number): number => x - y);
    };
    let folds: number = 0;
    let deepest: number = 0;
    let range: [number, number] | null = null;
    for (let j: number = 0; j < RAYS; ++j) {
      const phi: number = (2 * Math.PI * j) / RAYS;
      const ts: number[] = crossings([Math.cos(phi), Math.sin(phi)]);
      if (ts.length > 1) {
        ++folds;
        deepest = Math.max(deepest, ts.at(-1)! - ts[0]!);
        const d: number = Math.round(degrees(phi));
        range = range === null ? [d, d] : [Math.min(range[0], d), Math.max(range[1], d)];
      }
    }
    return { loop: kept.map(world), inside: crossings([1, 0]).length % 2 === 1, folds, deepest, phases: range };
  }

  /**
   * R2: the cap lateral of the girdle's ring, sectioned about the GH course (GH along the humerus's long axis to the elbow centre) every
   * `CAP_STEP_MM`, on the reference and on f1 as generated; today's arm course against the GH course; the gap and turn a band spans from
   * the ring to the arm's ring on the GH course at the reference, the neutral pose and the upper arm's depth ends; the ring's and the cap's
   * distance from the breast's port and the chest fold's window.
   */
  async function cap(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generatedIndices: number[] = [];
    let offset: number = 0;
    for (const piece of pieces) {
      for (const i of piece.indices) generatedIndices.push(i + offset);
      offset += piece.positions.length / 3;
    }
    const generated: M.IMesh = { positions: pieces.flatMap((piece: AutoMovieHumanF1.IPiece): number[] => piece.positions.map((x: number): number => 1000 * x)), indices: generatedIndices };
    const trunk: M.IMesh = trunkMesh();
    const breast: V[] = breastPort(trunk);
    const gh: V = P.frame("humerus").origin as V;
    const elbow: V = P.frame("forearm").origin as V;
    const distal: V = unit(sub(elbow, gh));
    const length: number = norm(sub(elbow, gh));
    const girdle = plane(0, 0);
    const lines: string[] = [`R2: the arm's cap against the girdle's ring (the plane through GH ${fixed(gh)} with the thorax's lateral axis ${fixed(girdle.normal, 3)} as its normal); the GH course runs ${length.toFixed(1)} mm to the elbow centre`, ""];

    // 1. The ring on both skins, and its stations on the GH course.
    const rings: Record<string, V[]> = {};
    for (const [skin, mesh] of [["reference", source.all], ["generated", generated]] as [string, M.IMesh][]) {
      rings[skin] = ring(mesh, girdle.frame).filter((h: V | null): h is V => h !== null);
      const stations: number[] = rings[skin]!.map((p: V): number => dot(sub(p, gh), distal));
      lines.push(`ring on the ${skin}: ${rings[skin]!.length} points, GH-course stations ${Math.min(...stations).toFixed(1)} .. ${Math.max(...stations).toFixed(1)} mm`);
    }
    const ringEnd: number = Math.max(...rings["reference"]!.map((p: V): number => dot(sub(p, gh), distal)));
    lines.push("");

    // The cap's sections.
    const drawn: N.Curve[] = [];
    for (const [skin, mesh] of [["reference", source.all], ["generated", generated]] as [string, M.IMesh][]) {
      lines.push(`CAP SECTIONS on the ${skin}, square to the GH course every ${CAP_STEP_MM} mm, lateral of the girdle's plane:`);
      let firstStar: number | null = null;
      const bad: string[] = [];
      // Every fifth section, 10 mm apart, is drawn; the stations start where the ring does, so they are counted, not read off the station.
      let index: number = -1;
      for (let s: number = Math.floor(Math.min(...rings[skin]!.map((p: V): number => dot(sub(p, gh), distal)))); s <= length; s += CAP_STEP_MM) {
        ++index;
        const section = capSection(mesh, gh, distal, girdle.normal, s);
        if (section === null) {
          bad.push(`${s}: no section`);
          continue;
        }
        if (section.folds === 0 && section.inside) firstStar ??= s;
        if (section.folds > 0 || !section.inside) bad.push(`${s}: ${section.inside ? "" : "course point OUTSIDE; "}${section.folds} of ${RAYS} rays cross more than once, ${section.deepest.toFixed(1)} mm apart${section.phases === null ? "" : `, at ${section.phases[0]} to ${section.phases[1]} deg (0 forward, 90 toward humerus x forward)`}`);
        if (skin === "reference" && index % 5 === 0) drawn.push({ id: "cap." + s, points: section.loop, closed: true, xray: true, colour: section.folds > 0 || !section.inside ? "c0392b" : "1f9d3a" });
      }
      lines.push(`  first star-shaped section about the course at ${firstStar ?? "none"} mm; not star-shaped or off the course at ${bad.length} stations:`, ...bad.slice(0, 40).map((x: string): string => "    " + x), ...(bad.length > 40 ? [`    ... ${bad.length - 40} more`] : []));
    }
    lines.push("");

    // 2. Today's arm course against the GH course.
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const armAxis = H.axis(arm);
    const lineDistance = (p: V): number => norm(sub(sub(p, gh), scale(distal, dot(sub(p, gh), distal))));
    let agree: number | null = null;
    const rows: string[] = [];
    for (let s: number = 0; s <= arm.knots[arm.knots.length - 1]!; s += 5) {
      const o: V = armAxis.at(s).origin as V;
      const tangent: V = unit(sub(armAxis.at(s + 0.5).origin as V, armAxis.at(Math.max(0, s - 0.5)).origin as V));
      const off: number = lineDistance(o);
      const station: number = dot(sub(o, gh), distal);
      if (agree === null && off < AGREE_MM && station > 0) agree = station;
      if (station > length + 5) break;
      if (s % 20 === 0) rows.push(`  arm station ${s}: GH-course station ${station.toFixed(1)}, ${off.toFixed(1)} mm off the GH course, sections ${degrees(Math.acos(Math.min(1, Math.abs(dot(tangent, distal))))).toFixed(1)} deg from square to it`);
    }
    const armRoot: number = dot(sub(armAxis.at(arm.knots[0]!).origin as V, gh), distal);
    lines.push(`TODAY'S ARM: course armRoot -> armTurn -> elbow; its first knot (${arm.knots[0]}) at GH-course station ${armRoot.toFixed(1)}; GH ${lineDistance(armAxis.at(0).origin as V).toFixed(1)} mm from its start; it agrees with the GH course within ${AGREE_MM} mm from GH-course station ${agree === null ? "nowhere" : agree.toFixed(1)}; the girdle's ring reaches ${ringEnd.toFixed(1)}, so the cap from the ring to that agreement is ${agree === null ? "-" : (agree - ringEnd).toFixed(1)} mm long`, ...rows, "");

    // 3. Bands: the gap and the turn from the ring to the arm's ring on the GH course at the ring's end plus the arm's rail.
    const capRing = (s: number): V[] => capSection(source.all, gh, distal, girdle.normal, s)?.loop ?? [];
    const armAt: number = ringEnd + ARM_RAIL_MM;
    const target: V[] = capRing(armAt);
    const clocks = (loop: V[], centre: V, axis: V, k: number): V | null => {
      const e1: V = perpendicular([0, 1, 0], axis);
      const e2: V = cross(axis, e1);
      const want: number = (2 * Math.PI * k) / 24;
      let best: V | null = null;
      let gap: number = Infinity;
      for (const p of loop) {
        const q: V = sub(p, centre);
        const a: number = Math.atan2(dot(q, e2), dot(q, e1));
        const d: number = Math.abs(Math.atan2(Math.sin(a - want), Math.cos(a - want)));
        if (d < gap) [gap, best] = [d, p];
      }
      return best;
    };
    const ringCentre: V = scale(rings["reference"]!.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / rings["reference"]!.length);
    const band = (label: string, armLoop: V[], axis: V): string => {
      if (armLoop.length === 0) return `  ${label}: no arm ring`;
      const centre: V = scale(armLoop.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / armLoop.length);
      const gaps: number[] = Array.from({ length: 24 }, (_: unknown, k: number): number => {
        const [a, b] = [clocks(rings["reference"]!, ringCentre, girdle.normal, k), clocks(armLoop, centre, axis, k)];
        return a === null || b === null ? NaN : norm(sub(a, b));
      });
      return `  ${label}: gap ${Math.min(...gaps).toFixed(1)} .. ${Math.max(...gaps).toFixed(1)} mm round 24 clocks; turn ${degrees(Math.acos(Math.min(1, Math.abs(dot(axis, girdle.normal))))).toFixed(1)} deg between the ring's plane and the arm's ring`;
    };
    // The neutral pose turns the humerus about GH: the reference arm ring carried rigidly by that rotation.
    const neutral: SF.IFrame = P.frames(P.NEUTRAL).get("humerus")!;
    const reference: SF.IFrame = P.frame("humerus");
    const carry = (p: V): V => SF.toWorld(neutral, SF.toLocal(reference, p)) as V;
    const scaled = (loop: V[], k: number): V[] => {
      const centre: V = add(gh, scale(distal, armAt));
      return loop.map((p: V): V => {
        const q: V = sub(p, centre);
        const along: number = dot(q, distal);
        return add(centre, add(scale(distal, along), scale(sub(q, scale(distal, along)), k)));
      });
    };
    lines.push(`BANDS from the girdle's ring to the arm's ring on the GH course ${armAt.toFixed(1)} mm from GH (the ring's far end plus the arm's rail, ${ARM_RAIL_MM} mm):`);
    lines.push(band("reference", target, distal));
    lines.push(band("neutral (the humerus turned to the identity, the arm ring carried with it)", target.map(carry), unit(sub(carry(add(gh, distal)), gh))));
    lines.push(band("upper arm depth -20 % (the arm ring scaled about its course by 0.8)", scaled(target, 0.8), distal));
    lines.push(band("upper arm depth +20 %", scaled(target, 1.2), distal));
    const todayArm = armRing(P.frames());
    const todayPort: V[] = [];
    {
      const loop = AutoMovieHumanF1.armscye(1, AutoMovieHumanF1.assemble());
      const chart = trunkChart();
      const shape: number[] = loop.shape === undefined ? [] : [...loop.shape];
      const pts: { p: V; station: number; phase: number }[] = [];
      for (let i: number = 0; i < trunk.positions.length; i += 3 * 5) {
        const p: V = [trunk.positions[i]!, trunk.positions[i + 1]!, trunk.positions[i + 2]!];
        const c = chart(p);
        pts.push({ p, station: c.station, phase: Math.atan2(c.v, c.u) });
      }
      shape.forEach((share: number, k: number): void => {
        const t = { station: 1000 * (loop.centre[0] + share * loop.semi[0] * Math.cos((2 * Math.PI * k) / shape.length)), phase: loop.centre[1] + (share * loop.semi[1] * Math.sin((2 * Math.PI * k) / shape.length)) / loop.sense };
        todayPort.push(pts.reduce((a, b) => (Math.hypot(b.station - t.station, CLIP_MM * (b.phase - t.phase)) < Math.hypot(a.station - t.station, CLIP_MM * (a.phase - t.phase)) ? b : a)).p);
      });
    }
    const todayGaps: number[] = todayPort.map((p: V): number => distanceTo(p, todayArm.points));
    lines.push(`  today's band (port loop to the arm's ring at its rail, rails ${ARM_RAIL_MM} mm with the ARM_RAILS_MM profile): nearest-point gap ${Math.min(...todayGaps).toFixed(1)} .. ${Math.max(...todayGaps).toFixed(1)} mm; turn ${degrees(Math.acos(Math.min(1, Math.abs(dot(todayArm.along, [0, 0, 1]))))).toFixed(1)} deg between its sagittal plane and the arm's course`, "");

    // 4. The breast's port and the chest fold's window against the ring and the cap.
    const fold = AutoMovieHumanF1.BODY.trunk.reliefs?.find((r): boolean => r.name === "trunk.fold");
    const foldEdge: V[] = [];
    if (fold !== undefined) {
      const loft: AutoMovieViewLoft.IResult = H.create(AutoMovieHumanF1.BODY.trunk, [fold.stations[0], (fold.stations[0] + fold.stations[1]) / 2, fold.stations[1]]);
      if (loft.chain !== null)
        for (let s: number = fold.stations[0]; s <= fold.stations[1]; s += 2) {
          const read = AutoMovieLoftChain.sampler(loft.chain, s);
          for (let t: number = fold.phases[0]; t <= fold.phases[1]; t += 0.05) foldEdge.push(read(t) as V);
        }
    }
    const capPoints: V[] = drawn.flatMap((c: N.Curve): V[] => c.points.map((p: N.Point): V => [p[0], p[1], p[2]]));
    lines.push(`BREAST AND FOLD: the ring stands ${Math.min(...rings["reference"]!.map((p: V): number => distanceTo(p, breast))).toFixed(1)} mm from the breast's port and ${foldEdge.length === 0 ? "-" : Math.min(...rings["reference"]!.map((p: V): number => distanceTo(p, foldEdge))).toFixed(1)} mm from the chest fold's window (trunk.fold); the cap's sections (every 10 mm) ${Math.min(...capPoints.map((p: V): number => distanceTo(p, breast))).toFixed(1)} mm and ${foldEdge.length === 0 ? "-" : Math.min(...capPoints.map((p: V): number => distanceTo(p, foldEdge))).toFixed(1)} mm; the fold's window reaches ${foldEdge.length === 0 ? "-" : Math.max(...foldEdge.map((p: V): number => dot(sub(p, gh), girdle.normal))).toFixed(1)} mm past the girdle's plane (positive: on the arm's side)`);

    // Frames.
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "cap-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    const near = (i: number): boolean => norm(sub([source.all.positions[3 * i]!, source.all.positions[3 * i + 1]!, source.all.positions[3 * i + 2]!], add(gh, scale(distal, 120)))) <= 230;
    for (let t: number = 0; t + 2 < source.all.indices.length; t += 3) {
      const tri: number[] = [source.all.indices[t]!, source.all.indices[t + 1]!, source.all.indices[t + 2]!];
      if (!tri.every(near)) continue;
      for (const i of tri) {
        let j: number | undefined = remap.get(i);
        if (j === undefined) {
          j = positions.length / 3;
          remap.set(i, j);
          positions.push(source.all.positions[3 * i]!, source.all.positions[3 * i + 1]!, source.all.positions[3 * i + 2]!);
        }
        indices.push(j);
      }
    }
    const mesh: N.Mesh = { id: "reference", positions, indices, colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < positions.length; i += 3) bounds.push([positions[i]!, positions[i + 1]!, positions[i + 2]!]);
    const courses: N.Curve[] = [
      { id: "gh-course", points: [gh, elbow], closed: false, xray: true, colour: "202020" },
      { id: "arm-course", points: Array.from({ length: 60 }, (_: unknown, k: number): V => armAxis.at((k * arm.knots[arm.knots.length - 1]!) / 59).origin as V).filter((p: V): boolean => dot(sub(p, gh), distal) <= length + 10), closed: false, xray: true, colour: "2f6fd0" },
      { id: "ring", points: rings["reference"]!, closed: true, xray: true, colour: "9a3fb5" },
    ];
    for (const view of ["front", "back", "left", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
      await fs.writeFile(path.join(out, `cap.${view}.reference.png`), NodeCanvasRaster.render(camera, [mesh], [...drawn, ...courses], "depth", `f1 armscye cap | sections every 10 mm on the GH course: green star-shaped, red not; purple: girdle ring; black: GH course; blue: today's arm course | ${view}`).png);
    }
    await fs.writeFile(path.join(out, "cap.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The turn's half-lengths at the derived corner, as shares of the arm's radius: the supervisor's brief for R3a. */
  const TURN_KS: number[] = [0.5, 1, 1.5];

  /**
   * A section of the skin on a course frame, kept lateral of the girdle's plane and closed along it, with its star check about the course
   * point (the clipped form of `capSection`, on any frame).
   */
  function clippedSection(mesh: M.IMesh, frame: AutoMovieLoftFrame.IFrame, gh: V, girdle: V): { loop: V[]; inside: boolean; folds: number; deepest: number; phases: [number, number] | null } | null {
    const origin: V = frame.origin as V;
    const cut: C.P[] | null = R.cut(mesh, frame).loop;
    if (cut === null) return null;
    const world = (p: C.P): V => add(origin, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
    const side = (p: C.P): number => dot(sub(world(p), gh), girdle);
    const kept: C.P[] = [];
    for (let i: number = 0; i < cut.length; ++i) {
      const [a, b]: C.P[] = [cut[i]!, cut[(i + 1) % cut.length]!];
      if (side(a!) >= 0) kept.push(a!);
      if (side(a!) * side(b!) < 0) {
        const t: number = side(a!) / (side(a!) - side(b!));
        kept.push([a![0] + t * (b![0] - a![0]), a![1] + t * (b![1] - a![1])]);
      }
    }
    if (kept.length < 3) return null;
    const crossings = (d: C.P): number[] => {
      const out: number[] = [];
      for (let i: number = 0; i < kept.length; ++i) {
        const a: C.P = kept[i]!;
        const e: C.P = [kept[(i + 1) % kept.length]![0] - a[0], kept[(i + 1) % kept.length]![1] - a[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (den === 0) continue;
        const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
        const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
        if (w >= 0 && w < 1 && t > 0) out.push(t);
      }
      return out.sort((x: number, y: number): number => x - y);
    };
    let folds: number = 0;
    let deepest: number = 0;
    let range: [number, number] | null = null;
    for (let j: number = 0; j < RAYS; ++j) {
      const phi: number = (2 * Math.PI * j) / RAYS;
      const ts: number[] = crossings([Math.cos(phi), Math.sin(phi)]);
      if (ts.length > 1) {
        ++folds;
        deepest = Math.max(deepest, ts.at(-1)! - ts[0]!);
        const d: number = Math.round(degrees(phi));
        range = range === null ? [d, d] : [Math.min(range[0], d), Math.max(range[1], d)];
      }
    }
    return { loop: kept.map(world), inside: crossings([1, 0]).length % 2 === 1, folds, deepest, phases: range };
  }

  /**
   * R3a: the arm's course by rule. It leaves the girdle's ring square to it and turns into the humerus: its first centre the ring's centre,
   * its corner the midpoint of the common perpendicular of the ring's normal line through that centre and the humerus's long-axis line
   * (GH to the elbow centre), its next centres today's (elbow, wrist, the middle finger's first joint, the hand's end); the turn's half
   * `k r` at the corner, today's halves after it. At the neutral pose the corner is read from the posed humerus line and the halves keep
   * their set-backs (`AutoMovieHumanConicPose.halves`).
   */
  async function armCourse(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generatedIndices: number[] = [];
    let offset: number = 0;
    for (const piece of pieces) {
      for (const i of piece.indices) generatedIndices.push(i + offset);
      offset += piece.positions.length / 3;
    }
    const generated: M.IMesh = { positions: pieces.flatMap((piece: AutoMovieHumanF1.IPiece): number[] => piece.positions.map((x: number): number => 1000 * x)), indices: generatedIndices };
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / ringPoints.length);
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const lines: string[] = [`R3a: the arm's course by rule; the girdle's ring centre ${fixed(centre)}, its normal ${fixed(n, 3)}; r = ${r.toFixed(2)} mm`, ""];

    // The axilla's slit: its cutter's skin, lofted, against the girdle's plane.
    const cutter: H.IFamily = AutoMovieHumanF1.CUTTERS[0]!.family;
    const cutterLoft = H.create({ ...cutter, tips: undefined, reliefs: undefined }, cutter.knots.length >= 2 ? Array.from({ length: 21 }, (_: unknown, i: number): number => cutter.knots[0]! + ((cutter.knots[cutter.knots.length - 1]! - cutter.knots[0]!) * i) / 20) : cutter.knots);
    const slit: V[] = [];
    if (cutterLoft.chain !== null)
      for (let i: number = 0; i <= 20; ++i) {
        const read = AutoMovieLoftChain.sampler(cutterLoft.chain, cutter.knots[0]! + ((cutter.knots[cutter.knots.length - 1]! - cutter.knots[0]!) * i) / 20);
        for (let j: number = 0; j < 36; ++j) slit.push(read((2 * Math.PI * j) / 36) as V);
      }
    const gh0: V = P.frame("humerus").origin as V;
    const sides: number[] = slit.map((p: V): number => dot(sub(p, gh0), n));
    lines.push(`THE AXILLA'S SLIT (its cutter's skin, ${slit.length} points): ${Math.min(...sides).toFixed(1)} .. ${Math.max(...sides).toFixed(1)} mm from the girdle's plane (negative: the trunk's side, medial); ${sides.filter((x: number): boolean => x > 0).length} points on the arm's side`, "");

    const drawn: { k: number; curves: N.Curve[] }[] = [];
    const stored: Map<number, V[]> = new Map();
    for (const pose of ["reference", "neutral"] as const) {
      const frames: P.IFrames = pose === "reference" ? P.frames() : P.frames(P.NEUTRAL);
      const gh: V = frames.get("humerus")!.origin as V;
      const elbow: V = frames.get("forearm")!.origin as V;
      const d: V = unit(sub(elbow, gh));
      // The common perpendicular of the ring's normal line (centre + a n) and the humerus line (gh + b d).
      const w0: V = sub(centre, gh);
      const [aa, bb, cc, dd, ee]: number[] = [dot(n, n), dot(n, d), dot(d, d), dot(n, w0), dot(d, w0)];
      const den: number = aa! * cc! - bb! * bb!;
      const a: number = (bb! * ee! - cc! * dd!) / den;
      const b: number = (aa! * ee! - bb! * dd!) / den;
      const [p1, p2]: V[] = [add(centre, scale(n, a)), add(gh, scale(d, b))];
      const corner: V = scale(add(p1!, p2!), 0.5);
      const turnAngle: number = degrees(Math.acos(Math.max(-1, Math.min(1, dot(n, d)))));
      lines.push(`${pose.toUpperCase()}: corner ${fixed(corner)}, ${a.toFixed(1)} mm along the ring's normal from its centre and ${b.toFixed(1)} mm along the humerus from GH; the two lines miss by ${norm(sub(p1!, p2!)).toFixed(1)} mm; the turn at the corner ${turnAngle.toFixed(1)} deg`);
      const later: V[] = (T_COURSE_AFTER as readonly string[]).map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V);
      for (const k of TURN_KS) {
        const referenceCentres: V[] = [centre, corner, ...later];
        const given: number[] = [k * r, ...arm.halves.slice(1)];
        // At the neutral pose the halves keep their set-backs at the reference pose (`AutoMovieHumanConicPose.halves`).
        const atReference: V[] | undefined = stored.get(k);
        if (pose === "reference") stored.set(k, referenceCentres);
        const halves: number[] = atReference === undefined ? given : AutoMovieHumanConicPose.halves(atReference, given, referenceCentres);
        const family = { centres: referenceCentres, halves, up: P.direction("arm.up", frames) as V };
        let axis: ReturnType<typeof H.axis>;
        try {
          axis = H.axis(family);
        } catch (error: unknown) {
          lines.push(`  k ${k}: the course is refused: ${(error as Error).message.slice(0, 200)}`);
          continue;
        }
        // The elbow's station: the course's nearest approach to the elbow centre.
        let elbowStation: number = 0;
        for (let s: number = 0; s < 800; s += 0.5) if (norm(sub(axis.at(s).origin as V, elbow)) < norm(sub(axis.at(elbowStation).origin as V, elbow))) elbowStation = s;
        const curves: N.Curve[] = [];
        for (const [skin, mesh] of (pose === "reference" ? [["reference", source.all], ["generated", generated]] : [["generated", generated]]) as [string, M.IMesh][]) {
          const bad: string[] = [];
          let index: number = -1;
          for (let s: number = 0; s <= elbowStation; s += CAP_STEP_MM) {
            ++index;
            const section = clippedSection(mesh, axis.at(s), gh0, n);
            if (section === null) {
              bad.push(`${s}: no section`);
              continue;
            }
            if (section.folds > 0 || !section.inside) bad.push(`${s}: ${section.inside ? "" : "course point OUTSIDE; "}${section.folds} rays, ${section.deepest.toFixed(1)} mm${section.phases === null ? "" : ` at ${section.phases[0]}..${section.phases[1]} deg`}`);
            if (pose === "reference" && skin === "reference" && index % 5 === 0) curves.push({ id: "s" + s, points: section.loop, closed: true, xray: true, colour: section.folds > 0 || !section.inside ? "c0392b" : "1f9d3a" });
          }
          lines.push(`  k ${k} (half ${(k * r).toFixed(1)} mm), ${skin}: elbow at station ${elbowStation.toFixed(1)}; ${bad.length} of ${index + 1} sections not star-shaped about the course or off it${bad.length === 0 ? "" : ": " + bad.slice(0, 16).join("; ") + (bad.length > 16 ? `; ... ${bad.length - 16} more` : "")}`);
        }
        // The band: the girdle's ring to the arm's first ring at its rail on this course.
        const first = clippedSection(source.all, axis.at(ARM_RAIL_MM), gh0, n);
        if (first !== null && pose === "reference") {
          const gaps: number[] = first.loop.map((p: V): number => distanceTo(p, ringPoints));
          const tangent: V = unit(sub(axis.at(ARM_RAIL_MM + 0.5).origin as V, axis.at(ARM_RAIL_MM - 0.5).origin as V));
          lines.push(`  k ${k}: band from the ring to the arm's ring ${ARM_RAIL_MM} mm in: nearest-point gap ${Math.min(...gaps).toFixed(1)} .. ${Math.max(...gaps).toFixed(1)} mm; turn ${degrees(Math.acos(Math.min(1, Math.abs(dot(tangent, n))))).toFixed(1)} deg`);
          // Where the slit stands against the arm's first sections: its points' nearest course station.
          const stations: number[] = slit.map((p: V): number => {
            let best: number = 0;
            for (let s: number = 0; s <= 120; s += 1) if (norm(sub(axis.at(s).origin as V, p)) < norm(sub(axis.at(best).origin as V, p))) best = s;
            return best;
          });
          lines.push(`  k ${k}: the slit's points stand nearest to course stations ${Math.min(...stations)} .. ${Math.max(...stations)} mm`);
        }
        if (pose === "reference") drawn.push({ k, curves: [...curves, { id: "course", points: Array.from({ length: 80 }, (_: unknown, i: number): V => axis.at((elbowStation * i) / 79).origin as V), closed: false, xray: true, colour: "202020" }, { id: "ring", points: ringPoints, closed: true, xray: true, colour: "9a3fb5" }, { id: "slit", points: slit, closed: false, xray: true, colour: "d08a1f" }] });
      }
      lines.push("");
    }

    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "course-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    const focus: V = add(gh0, scale(unit(sub(P.frame("forearm").origin as V, gh0)), 120));
    const near = (i: number): boolean => norm(sub([source.all.positions[3 * i]!, source.all.positions[3 * i + 1]!, source.all.positions[3 * i + 2]!], focus)) <= 230;
    for (let t: number = 0; t + 2 < source.all.indices.length; t += 3) {
      const tri: number[] = [source.all.indices[t]!, source.all.indices[t + 1]!, source.all.indices[t + 2]!];
      if (!tri.every(near)) continue;
      for (const i of tri) {
        let j: number | undefined = remap.get(i);
        if (j === undefined) {
          j = positions.length / 3;
          remap.set(i, j);
          positions.push(source.all.positions[3 * i]!, source.all.positions[3 * i + 1]!, source.all.positions[3 * i + 2]!);
        }
        indices.push(j);
      }
    }
    const mesh: N.Mesh = { id: "reference", positions, indices, colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < positions.length; i += 3) bounds.push([positions[i]!, positions[i + 1]!, positions[i + 2]!]);
    for (const { k, curves } of drawn)
      for (const view of ["front", "back", "left", "low-oblique"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
        await fs.writeFile(path.join(out, `course.k${k}.${view}.reference.png`), NodeCanvasRaster.render(camera, [mesh], curves, "depth", `f1 arm course by rule, half ${k} r | sections every 10 mm: green star-shaped, red not; black course; purple ring; orange slit | ${view}`).png);
      }
    await fs.writeFile(path.join(out, "course.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** Today's arm centres after `armTurn`, by their placing names: the elbow, the wrist, the middle finger's first joint and the hand's end. */
  const T_COURSE_AFTER: readonly string[] = ["lowerarm", "hand", "middle1", "handEnd"];

  /** The placing table's points, for the centres the course reads through a pose's frames. */
  const PLACED: Record<string, { frame: string; local: [number, number, number] }> = Object.fromEntries(T_COURSE_AFTER.map((name: string): [string, { frame: string; local: [number, number, number] }] => [name, AutoMovieHumanF1Placing.POINTS[name]!]));

  export async function main(): Promise<void> {
    if (process.argv[2] === "cap") return cap();
    if (process.argv[2] === "course") return armCourse();
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const trunk: M.IMesh = trunkMesh();
    const breast: V[] = breastPort(trunk);
    const chart = trunkChart();
    const arms: { pose: string; ring: ReturnType<typeof armRing> }[] = [
      { pose: "reference", ring: armRing(P.frames()) },
      { pose: "neutral", ring: armRing(P.frames(P.NEUTRAL)) },
    ];
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const lines: string[] = [`f1 armscye ring by a thorax-fixed plane; r = upper arm girth ${UPPER_ARM_GIRTH_MM} / 2 pi = ${r.toFixed(2)} mm; GH ${fixed(P.frame("humerus").origin)}`, "the ring is fixed in the thorax: it does not move with the arm's pose, the arm's depth (the limb law holds the shoulder) or its segment lengths (GH stays)", ""];
    lines.push("| beta (basis) | k (m mm) | skin | rays without skin | occlusion jumps over " + JUMP_MM + " mm (largest) | acromion / front fold / back fold, straight mm | past the clip, mm | breast port, mm | arm ring at reference: distance, turn | arm ring at neutral: distance, turn |", "| --- | --- | --- | ---: | --- | --- | ---: | ---: | --- | --- |");
    const drawn: { k: number; beta: number; points: V[] }[] = [];
    for (const { beta, basis } of BETAS)
      for (const k of KS) {
        const p = plane(beta, k);
        for (const [skin, mesh] of [["reference", source.all], ["trunk wall", trunk]] as [string, M.IMesh][]) {
          const hits: (V | null)[] = ring(mesh, p.frame);
          const points: V[] = hits.filter((h: V | null): h is V => h !== null);
          const radii: number[] = hits.map((h: V | null): number => (h === null ? NaN : norm(sub(h, p.centre))));
          const jumps: number[] = radii.map((x: number, j: number): number => Math.abs(x - radii[(j + 1) % RAYS]!)).filter((x: number): boolean => Number.isFinite(x));
          const big: number[] = jumps.filter((x: number): boolean => x > JUMP_MM);
          if (points.length === 0) {
            lines.push(`| ${beta} (${basis}) | ${k} (${(k * r).toFixed(1)}) | ${skin} | ${RAYS} | - | - | - | - | - | - |`);
            continue;
          }
          const past: number = Math.max(0, ...points.map((q: V): number => Math.abs(chart(q).v) - CLIP_MM));
          const clear: number = Math.min(...points.map((q: V): number => distanceTo(q, breast)));
          const centre: V = scale(points.reduce((s: V, q: V): V => add(s, q), [0, 0, 0]), 1 / points.length);
          const turn = (arm: ReturnType<typeof armRing>): string => `${norm(sub(arm.centre, centre)).toFixed(1)} mm, ${degrees(Math.acos(Math.min(1, Math.abs(dot(arm.along, p.normal))))).toFixed(1)} deg`;
          lines.push(`| ${beta} (${basis}) | ${k} (${(k * r).toFixed(1)}) | ${skin} | ${RAYS - points.length} | ${big.length} (${Math.max(0, ...jumps).toFixed(1)}) | ${Object.values(LANDMARKS).map((q: V): string => distanceTo(q, points).toFixed(1)).join(" / ")} | ${past.toFixed(1)} | ${clear.toFixed(1)}${clear < CLEAR_MM ? " TOO NEAR" : ""} | ${turn(arms[0]!.ring)} | ${turn(arms[1]!.ring)} |`);
          // A ray that met no skin is drawn at the next ray's hit, so the drawn ring stays closed.
          const first: V = points[0]!;
          if (skin === "reference") drawn.push({ k, beta, points: hits.map((h: V | null, j: number): V => h ?? hits.find((x: V | null, i: number): boolean => x !== null && i > j) ?? first) });
        }
      }
    lines.push("", "turn: the angle between the plane's normal and the arm's course at its ring 10 mm in; distance: between the ring's and the arm ring's centres");

    // Frames: per k, the four betas' reference rings, the arm's ring and the landmarks, over the reference and the generated figure.
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const gh: V = P.frame("humerus").origin as V;
    const crop = (m: M.IMesh, radius: number, k: number): N.Mesh => {
      const positions: number[] = [];
      const indices: number[] = [];
      const remap: Map<number, number> = new Map();
      const near = (i: number): boolean => norm(sub([m.positions[3 * i]! * k, m.positions[3 * i + 1]! * k, m.positions[3 * i + 2]! * k], gh)) <= radius;
      for (let t: number = 0; t + 2 < m.indices.length; t += 3) {
        const tri: number[] = [m.indices[t]!, m.indices[t + 1]!, m.indices[t + 2]!];
        if (!tri.every(near)) continue;
        for (const i of tri) {
          let j: number | undefined = remap.get(i);
          if (j === undefined) {
            j = positions.length / 3;
            remap.set(i, j);
            positions.push(m.positions[3 * i]! * k, m.positions[3 * i + 1]! * k, m.positions[3 * i + 2]! * k);
          }
          indices.push(j);
        }
      }
      return { id: "skin", positions, indices, colour: [0.64, 0.65, 0.67] };
    };
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generatedIndices: number[] = [];
    let offset: number = 0;
    for (const piece of pieces) {
      for (const i of piece.indices) generatedIndices.push(i + offset);
      offset += piece.positions.length / 3;
    }
    const generated: M.IMesh = { positions: pieces.flatMap((piece: AutoMovieHumanF1.IPiece): number[] => piece.positions), indices: generatedIndices };
    const marks: N.Curve[] = Object.values(LANDMARKS).flatMap((q: V): N.Curve[] => [0, 1, 2].map((c: number): N.Curve => {
      const a: V = [...q];
      const b: V = [...q];
      a[c] -= 8;
      b[c] += 8;
      return { id: "mark" + c, points: [a, b], closed: false, xray: true, colour: "e0201c" };
    }));
    const colours: Record<number, string> = { 0: "1f9d3a", 15: "2f6fd0", 30: "d08a1f", 41.1: "9a3fb5" };
    lines.push("Colours: beta 0 #1f9d3a, 15 #2f6fd0, 30 #d08a1f, 41.1 #9a3fb5; black: the arm's ring at the reference pose; red: acromion and fold points");
    const meshes: [string, N.Mesh][] = [["reference", crop(source.all, 230, 1)], ["generated", crop(generated, 230, 1000)]];
    for (const k of KS)
      for (const [stage, m] of meshes) {
        const bounds: N.Point[] = [];
        for (let i: number = 0; i < m.positions.length; i += 3) bounds.push([m.positions[i]!, m.positions[i + 1]!, m.positions[i + 2]!]);
        const curves: N.Curve[] = [...drawn.filter((d): boolean => d.k === k).map((d): N.Curve => ({ id: "beta" + d.beta, points: d.points, closed: true, xray: true, colour: colours[d.beta]! })), { id: "arm-ring", points: arms[0]!.ring.points, closed: true, xray: true, colour: "202020" }, ...marks];
        for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) {
          const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
          const file: string = `ring.k${k}.${view}.${stage}.png`;
          const png: Buffer = NodeCanvasRaster.render(camera, [m], curves, "depth", `f1 armscye ring, thorax plane, k ${k} | ${stage} | ${view}`).png;
          await fs.writeFile(path.join(out, file), png);
        }
      }
    await fs.writeFile(path.join(out, "rule.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "rule.json"), JSON.stringify({ r, drawn }, null, 2));
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }
}

void FamilyConicArmscyeRule.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
