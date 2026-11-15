import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieMeshExtract as M, AutoMovieNaturalSpline, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanBendArc, AutoMovieHumanConicLoft as H, AutoMovieHumanConicPose, AutoMovieHumanConicSection,AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort } from "@automovie/interface";
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
    const slit: V[] = slitSkin();
    const gh0: V = P.frame("humerus").origin as V;
    const sides: number[] = slit.map((p: V): number => dot(sub(p, gh0), n));
    lines.push(`THE AXILLA'S SLIT (its cutter's skin, ${slit.length} points): ${Math.min(...sides).toFixed(1)} .. ${Math.max(...sides).toFixed(1)} mm from the girdle's plane (negative: the trunk's side, medial); ${sides.filter((x: number): boolean => x > 0).length} points on the arm's side`, "");

    const drawn: { k: number; curves: N.Curve[] }[] = [];
    const stored: Map<number, { s: number; centres: V[] }> = new Map();
    for (const pose of ["reference", "neutral"] as const) {
      const frames: P.IFrames = pose === "reference" ? P.frames() : P.frames(P.NEUTRAL);
      const gh: V = frames.get("humerus")!.origin as V;
      const elbow: V = frames.get("forearm")!.origin as V;
      lines.push(`${pose.toUpperCase()}:`);
      const later: V[] = (T_COURSE_AFTER as readonly string[]).map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V);
      for (const k of TURN_KS) {
        // The corner stands on the ring's normal at the set-back of its own turn (the supervisor's ruling): at the reference pose `s` is
        // the fixed point of `s = h share(angle(s))`, the angle the engine's between the normal and the line from the corner to the elbow
        // centre (`AutoMovieHumanConicPose.angles`, `share`); at another pose the set-back is kept (`AutoMovieHumanConicPose.halves`), so
        // `s` stays and the turn's angle and half take the pose. The engine refuses a set-back that reaches its segment's end exactly, so
        // the corner stands 1e-6 mm past it.
        const given: number[] = [k * r, ...arm.halves.slice(1)];
        const atReference: { s: number; centres: V[] } | undefined = stored.get(k);
        let s: number = atReference?.s ?? k * r;
        if (atReference === undefined)
          for (let i: number = 0; i < 100; ++i) {
            const angle: number = AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s)), elbow])[0]!;
            const next: number = k * r * AutoMovieHumanConicPose.share(angle);
            if (Math.abs(next - s) < 1e-9) break;
            s = next;
          }
        const corner: V = add(centre, scale(n, s + 1e-6));
        const referenceCentres: V[] = [centre, corner, ...later];
        if (atReference === undefined) stored.set(k, { s, centres: referenceCentres });
        const halves: number[] = atReference === undefined ? given : AutoMovieHumanConicPose.halves(atReference.centres, given, referenceCentres);
        // How far the second run, from the corner to the elbow centre, misses GH: the course placement `c` of the field model.
        const run: V = unit(sub(elbow, corner));
        const along: number = dot(sub(gh, corner), run);
        const miss: number = norm(sub(sub(gh, corner), scale(run, along)));
        const angleAt: number = degrees(AutoMovieHumanConicPose.angles(referenceCentres)[0]!);
        lines.push(`  k ${k} (half ${(k * r).toFixed(1)} mm${atReference === undefined ? "" : `, ${halves[0]!.toFixed(1)} mm here by the set-back law`}): s = ${s.toFixed(2)} mm along the ring's normal, corner ${fixed(corner)}; turn ${angleAt.toFixed(1)} deg; the second run misses GH by ${miss.toFixed(1)} mm, GH ${along.toFixed(1)} mm along it from the corner`);
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

  /**
   * The turn's half at the arm course's corner, as a share of the arm's radius: 1.5, the least of the multiples tried at which the band
   * leaves the girdle's ring square (0.3 degrees), where 1 left 0.8 degrees with 20 sections folding behind the armpit and 0.5 left 5 degrees
   * with 13 (the supervisor's ruling on #3151, R3a, run 2026-11-14T19-39-49).
   */
  const TURN_K: number = 1.5;

  /** Spacing of the rings the crossing check reads, mm: the engine's sections' own scale over a turn of 127 mm. */
  const ADVANCE_STEP_MM: number = 1;

  /**
   * R3b's pre-checks: (a) over the k = 1.5 course's turn, every phase point advances along the course from ring to ring 1 mm apart, so
   * neighbouring sections do not cross inside the skin, on the reference and on f1 as generated; (c) the girdle's ring as a port loop on
   * the trunk's chart: star-shaped about its centre with the phase read as millimetres at the armpit's side distance (as `around` reads
   * it), clear of the breast's port, inside the trunk's clip.
   */
  async function precheck(): Promise<void> {
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
    const gh: V = P.frame("humerus").origin as V;
    const elbow: V = P.frame("forearm").origin as V;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((s: V, p: V): V => add(s, p), [0, 0, 0]), 1 / ringPoints.length);
    let s: number = TURN_K * r;
    for (let i: number = 0; i < 100; ++i) {
      const next: number = TURN_K * r * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s)), elbow])[0]!);
      if (Math.abs(next - s) < 1e-9) break;
      s = next;
    }
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const frames: P.IFrames = P.frames();
    const centres: V[] = [centre, add(centre, scale(n, s + 1e-6)), ...T_COURSE_AFTER.map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V)];
    const axis = H.axis({ centres, halves: [TURN_K * r, ...arm.halves.slice(1)], up: P.direction("arm.up", frames) as V });
    const turnEnd: number = 2 * TURN_K * r + 20;
    const lines: string[] = [`R3b pre-checks; the k ${TURN_K} course: s ${s.toFixed(2)} mm, the turn's half ${(TURN_K * r).toFixed(1)} mm; rings every ${ADVANCE_STEP_MM} mm from the ring to ${turnEnd.toFixed(0)} mm`, ""];

    // (a) The crossing check: at each station the skin's section lateral of the girdle's plane, read along 720 rays from the course point
    // at the outermost crossing; each ray's point must move forward along the course's tangent from one ring to the next.
    for (const [skin, mesh] of [["reference", source.all], ["generated", generated]] as [string, M.IMesh][]) {
      const read = (station: number): ({ p: V; skin: boolean } | null)[] => {
        const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
        const cut: C.P[] | null = R.cut(mesh, frame).loop;
        if (cut === null) return Array.from({ length: RAYS }, (): null => null);
        const world = (p: C.P): V => add(frame.origin as V, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
        const side = (p: C.P): number => dot(sub(world(p), gh), n);
        const kept: C.P[] = [];
        for (let i: number = 0; i < cut.length; ++i) {
          const [a, b]: C.P[] = [cut[i]!, cut[(i + 1) % cut.length]!];
          if (side(a!) >= 0) kept.push(a!);
          if (side(a!) * side(b!) < 0) {
            const t: number = side(a!) / (side(a!) - side(b!));
            kept.push([a![0] + t * (b![0] - a![0]), a![1] + t * (b![1] - a![1])]);
          }
        }
        // Each ray's point, and whether it is skin or the closure along the girdle's plane (within 0.5 mm of it), which is no skin.
        return Array.from({ length: RAYS }, (_: unknown, j: number): { p: V; skin: boolean } | null => {
          const d: C.P = [Math.cos((2 * Math.PI * j) / RAYS), Math.sin((2 * Math.PI * j) / RAYS)];
          let best: number = -Infinity;
          for (let i: number = 0; i < kept.length; ++i) {
            const a: C.P = kept[i]!;
            const e: C.P = [kept[(i + 1) % kept.length]![0] - a[0], kept[(i + 1) % kept.length]![1] - a[1]];
            const den: number = d[0] * e[1] - d[1] * e[0];
            if (den === 0) continue;
            const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
            const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
            if (w >= 0 && w < 1 && t > 0 && t > best) best = t;
          }
          if (!Number.isFinite(best)) return null;
          const p: V = world([best * d[0], best * d[1]]);
          return { p, skin: dot(sub(p, gh), n) > 0.5 };
        });
      };
      let previous: ({ p: V; skin: boolean } | null)[] = read(0);
      const least: Record<"skin" | "closure", { value: number; at: string }> = { skin: { value: Infinity, at: "" }, closure: { value: Infinity, at: "" } };
      const back: { s: number; phase: number; skin: boolean }[] = [];
      for (let station: number = ADVANCE_STEP_MM; station <= turnEnd; station += ADVANCE_STEP_MM) {
        const current: ({ p: V; skin: boolean } | null)[] = read(station);
        const tangent: V = unit(sub(axis.at(station - ADVANCE_STEP_MM / 2 + 0.25).origin as V, axis.at(station - ADVANCE_STEP_MM / 2 - 0.25).origin as V));
        current.forEach((now: { p: V; skin: boolean } | null, j: number): void => {
          const before: { p: V; skin: boolean } | null = previous[j]!;
          if (now === null || before === null) return;
          const skinStep: boolean = now.skin && before.skin;
          const advance: number = dot(sub(now.p, before.p), tangent) / ADVANCE_STEP_MM;
          const kind: "skin" | "closure" = skinStep ? "skin" : "closure";
          if (advance < least[kind].value) least[kind] = { value: advance, at: `${(station - ADVANCE_STEP_MM).toFixed(0)}..${station.toFixed(0)} mm at ${((360 * j) / RAYS).toFixed(1)} deg` };
          if (advance <= 0) back.push({ s: station, phase: (360 * j) / RAYS, skin: skinStep });
        });
        previous = current;
      }
      for (const kind of ["skin", "closure"] as const) {
        const steps = back.filter((b): boolean => b.skin === (kind === "skin"));
        const stations: number[] = [...new Set(steps.map((b): number => b.s))];
        lines.push(`(a) ${skin}, ${kind === "skin" ? "skin to skin" : "steps touching the closure along the girdle's plane"}: least advance ${least[kind].value.toFixed(3)} mm per mm at ${least[kind].at}; ${steps.length} ray steps go back or stand still${steps.length === 0 ? "" : `, over stations ${Math.min(...stations)} .. ${Math.max(...stations)} mm (${stations.length} ring intervals) at phases ${Math.min(...steps.map((b): number => b.phase)).toFixed(1)} .. ${Math.max(...steps.map((b): number => b.phase)).toFixed(1)} deg`}`);
      }
    }

    // (c) The girdle's ring as a port loop on the trunk's chart, on f1's trunk wall.
    const trunk: M.IMesh = trunkMesh();
    const onTrunk: V[] = ring(trunk, girdle.frame).filter((h: V | null): h is V => h !== null);
    const chart = trunkChart();
    const armpit = chart(P.point("armpit") as V);
    const q: [number, number][] = onTrunk.map((p: V): [number, number] => {
      const c = chart(p);
      return [c.station, armpit.v * Math.atan2(c.v, c.u)];
    });
    const middle: [number, number] = [q.reduce((t, x): number => t + x[0], 0) / q.length, q.reduce((t, x): number => t + x[1], 0) / q.length];
    // Each step's turn about the centre; a reversal is a step against the loop's own sense, read with its size and where it stands.
    const steps: number[] = q.map((a, i): number => {
      const b = q[(i + 1) % q.length]!;
      const d: number = Math.atan2(b[1] - middle[1], b[0] - middle[0]) - Math.atan2(a[1] - middle[1], a[0] - middle[0]);
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const loopSense: number = Math.sign(steps.reduce((t: number, x: number): number => t + x, 0)) || 1;
    const against: number[] = steps.map((x: number, i: number): number => (loopSense * x < 0 ? i : -1)).filter((i: number): boolean => i >= 0);
    const reversals: number = against.length;
    if (reversals > 0) lines.push(`(c) the reversals: ${against.map((i: number): string => `step ${i} at station ${q[i]![0].toFixed(1)}, ${degrees(-loopSense * steps[i]!).toFixed(3)} deg back`).join("; ")}`);
    const breast: V[] = breastPort(trunk);
    const v: number[] = onTrunk.map((p: V): number => Math.abs(chart(p).v));
    const stations: number[] = q.map((x): number => x[0]);
    lines.push(`(c) the ring on f1's trunk wall: ${onTrunk.length} of ${RAYS} rays; in the trunk's chart (phase as mm at the armpit's side distance ${armpit.v.toFixed(1)}) ${reversals === 0 ? "star-shaped about its centre" : `NOT STAR-SHAPED: ${reversals} reversals of the angle about its centre`}; trunk stations ${Math.min(...stations).toFixed(1)} .. ${Math.max(...stations).toFixed(1)}; |v| ${Math.min(...v).toFixed(1)} .. ${Math.max(...v).toFixed(1)} mm against the clip ${CLIP_MM}; the breast's port ${Math.min(...onTrunk.map((p: V): number => distanceTo(p, breast))).toFixed(1)} mm away`);
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "precheck-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "precheck.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** A course's axis: its frame at each station. */
  type IAxis = ReturnType<typeof H.axis>;

  /** A cut piece in a station's chart, mm about the course point; a closed piece's last point joins its first. */
  interface IPiece {
    points: C.P[];
    closed: boolean;
  }

  /** A closed loop's winding number about its chart's origin. */
  function winding(points: readonly C.P[]): number {
    let total: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const [a, b]: C.P[] = [points[i]!, points[(i + 1) % points.length]!];
      const turn: number = Math.atan2(b![1], b![0]) - Math.atan2(a![1], a![0]);
      total += Math.atan2(Math.sin(turn), Math.cos(turn));
    }
    return total / (2 * Math.PI);
  }

  /** A closed loop's enclosed area, square mm. */
  function area(points: readonly C.P[]): number {
    return Math.abs(points.reduce((t: number, a: C.P, i: number): number => t + a[0] * points[(i + 1) % points.length]![1] - points[(i + 1) % points.length]![0] * a[1], 0)) / 2;
  }

  /**
   * Each ray's outermost kept crossing of the pieces from the chart's origin, all `RAYS` rays at once, with the index of the segment it lies
   * on (the pieces' segments in order): each segment is binned under the rays its angular span covers, a ray's step of margin either side
   * (a segment through the origin under every ray), so a ray tests only the segments it can meet.
   */
  function cast(pieces: readonly IPiece[], keep: (p: C.P) => boolean): { t: number; segment: number }[] {
    const step: number = (2 * Math.PI) / RAYS;
    const bins: number[][] = Array.from({ length: RAYS }, (): number[] => []);
    const segments: number[] = [];
    for (const { points, closed } of pieces)
      for (let i: number = 0; i < (closed ? points.length : points.length - 1); ++i) {
        const a: C.P = points[i]!;
        const b: C.P = points[(i + 1) % points.length]!;
        const index: number = segments.length / 4;
        segments.push(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        const from: number = Math.atan2(a[1], a[0]);
        const turn: number = Math.atan2(b[1], b[0]) - from;
        const sweep: number = Math.atan2(Math.sin(turn), Math.cos(turn));
        if (Math.hypot(a[0], a[1]) < 1e-9 || Math.hypot(b[0], b[1]) < 1e-9 || Math.abs(sweep) > Math.PI - 1e-6) {
          for (const bin of bins) bin.push(index);
          continue;
        }
        for (let j: number = Math.floor(Math.min(from, from + sweep) / step) - 1; j <= Math.ceil(Math.max(from, from + sweep) / step) + 1; ++j) bins[((j % RAYS) + RAYS) % RAYS]!.push(index);
      }
    return bins.map((bin: number[], j: number): { t: number; segment: number } => {
      const phi: number = (2 * Math.PI * j) / RAYS;
      const d: C.P = [Math.cos(phi), Math.sin(phi)];
      let best: { t: number; segment: number } = { t: NaN, segment: -1 };
      for (const index of bin) {
        const [ax, ay, ex, ey]: number[] = [segments[4 * index]!, segments[4 * index + 1]!, segments[4 * index + 2]!, segments[4 * index + 3]!];
        const den: number = d[0] * ey! - d[1] * ex!;
        if (den === 0) continue;
        const t: number = (ax! * ey! - ay! * ex!) / den;
        const w: number = (ax! * d[1] - ay! * d[0]) / den;
        if (w >= 0 && w < 1 && t > 0 && !(t <= best.t) && keep([t * d[0], t * d[1]])) best = { t, segment: index };
      }
      return best;
    });
  }

  /** A realized figure in millimetres: shared vertices, and each triangle's owning face. */
  interface IRealized {
    positions: number[];
    indices: number[];
    owners: string[];
  }

  /**
   * The realized skin at a pose in millimetres, whole: a ray's outermost crossing may lie anywhere on its section, and a crop of 260 mm
   * about GH cut the reference's sections (they reached 270 mm), so nothing is cropped. Each triangle's owner is two of its corners'
   * agreeing (else the middle one's), as `FamilyConicFigure --owners` reads it. Realizing the whole figure at a chord of 1 mm takes six
   * minutes, so the mesh is kept in `test/.shots/family-conic-armscye-rule/realized-whole-<hash>.bin`, the hash over the human and engine
   * packages' sources and the pose, and read back while those stay unchanged; positions are kept in single precision (under 0.0002 mm at
   * 2 m) on both paths, so a fresh and a read-back run cut the same skin. Vertices stay shared, so a section's crossings chain into loops (a
   * mesh of unshared corners cut into thousands of two-point pieces and took minutes a section).
   */
  async function realizedSkin(root: string, pose: "reference" | "neutral", progress: (what: string) => void): Promise<IRealized> {
    const { createHash } = await import("node:crypto");
    const hash = createHash("sha1");
    hash.update(pose === "reference" ? "whole; chord 0.001" : "whole; chord 0.001; neutral");
    for (const directory of ["packages/human/src", "packages/engine/src"]) {
      const names: string[] = (await fs.readdir(path.join(root, directory), { recursive: true })).sort((a: string, b: string): number => a.localeCompare(b));
      for (const name of names) {
        const file: string = path.join(root, directory, name);
        if (!(await fs.stat(file)).isFile()) continue;
        hash.update(name);
        hash.update(await fs.readFile(file));
      }
    }
    const cache: string = path.join(root, "test/.shots/family-conic-armscye-rule", `realized-whole-${hash.digest("hex").slice(0, 16)}.bin`);
    const cached: Buffer | null = await fs.readFile(cache).catch((): null => null);
    if (cached !== null) {
      // Layout: the header's length (uint32), the header (JSON, padded to 4 bytes), positions (float32), indices (uint32), owners (uint8).
      const length: number = cached.readUInt32LE(0);
      const header: { owners: string[]; vertices: number; triangles: number } = JSON.parse(cached.subarray(4, 4 + length).toString("utf8")) as { owners: string[]; vertices: number; triangles: number };
      const at: number = cached.byteOffset + 4 + length + ((4 - (length % 4)) % 4);
      const positions: Float32Array = new Float32Array(cached.buffer.slice(at, at + header.vertices * 12));
      const indices: Uint32Array = new Uint32Array(cached.buffer.slice(at + header.vertices * 12, at + header.vertices * 12 + header.triangles * 12));
      const owners: Uint8Array = new Uint8Array(cached.buffer.slice(at + header.vertices * 12 + header.triangles * 12, at + header.vertices * 12 + header.triangles * 13));
      progress(`read the realized ${pose} skin from ${cache}`);
      return { positions: Array.from(positions), indices: Array.from(indices), owners: Array.from(owners, (o: number): string => header.owners[o]!) };
    }
    const declared = AutoMovieHumanF1.construction(undefined, pose === "reference" ? undefined : P.NEUTRAL);
    const real = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
    const mesh = real.mesh;
    progress(`realized the ${pose} figure`);
    const vertexOwner = (v: number): string => mesh.owners[mesh.coordinates[v * 3]!]!;
    const positions: number[] = Array.from(mesh.positions, (x: number): number => Math.fround(1000 * x));
    const indices: number[] = Array.from(mesh.indices);
    const owners: string[] = Array.from({ length: indices.length / 3 }, (_: unknown, t: number): string => {
      const names: string[] = [indices[3 * t]!, indices[3 * t + 1]!, indices[3 * t + 2]!].map(vertexOwner);
      return names[0] === names[1] || names[0] === names[2] ? names[0]! : names[1]!;
    });
    const names: string[] = [...new Set(owners)];
    const index: Map<string, number> = new Map(names.map((owner: string, i: number): [string, number] => [owner, i]));
    const header: Buffer = Buffer.from(JSON.stringify({ owners: names, vertices: positions.length / 3, triangles: indices.length / 3 }), "utf8");
    const size: Buffer = Buffer.alloc(4);
    size.writeUInt32LE(header.length);
    await fs.mkdir(path.dirname(cache), { recursive: true });
    await fs.writeFile(cache, Buffer.concat([size, header, Buffer.alloc((4 - (header.length % 4)) % 4), Buffer.from(Float32Array.from(positions).buffer), Buffer.from(Uint32Array.from(indices).buffer), Buffer.from(Uint8Array.from(owners, (o: string): number => index.get(o)!))]));
    progress(`kept the realized ${pose} skin in ${cache}`);
    return { positions, indices, owners };
  }

  /** The skins a course is read on at one pose, with what the readings need. */
  interface ISkins {
    /** The pose. */
    pose: "reference" | "neutral";

    /** The reference's stored skin; null at a pose it was not recorded in. */
    reference: M.IMesh | null;

    /** The generated figure, realized whole. */
    generated: M.IMesh;

    /** The generated triangles the arm owns. */
    armFace: M.IMesh;

    /** The generated figure's owning faces, sorted. */
    owners: string[];

    /** A point's owning face: the triangle whose centroid lies nearest, found through a grid of 10 mm cells. */
    ownerOf: (p: V) => string;

    /** The axillary fold as a line: the slit cutter's course centres at the pose. */
    fold: V[];

    /** A point's nearest place on the fold: its z there and its distance from it. */
    foldAt: (p: V) => { z: number; distance: number };

    /** The girdle's plane, fixed in the thorax: a point on it (GH at the reference pose) and its lateral normal. */
    girdle: { point: V; normal: V };

    /** GH at the pose. */
    gh: V;
  }

  /** The skins at a pose from its realized figure and, at the reference pose, the reference's stored skin. */
  function skinsOf(realized: IRealized, reference: M.IMesh | null, pose: "reference" | "neutral"): ISkins {
    const armName: string = AutoMovieHumanF1.BODY.arm.name;
    const centroid = (t: number): V => {
      const [i, j, k]: number[] = [realized.indices[3 * t]!, realized.indices[3 * t + 1]!, realized.indices[3 * t + 2]!];
      return [0, 1, 2].map((c: number): number => (realized.positions[3 * i! + c]! + realized.positions[3 * j! + c]! + realized.positions[3 * k! + c]!) / 3) as V;
    };
    const cell = (p: V): string => p.map((x: number): number => Math.floor(x / 10)).join(",");
    const grid: Map<string, number[]> = new Map();
    for (let t: number = 0; t < realized.owners.length; ++t) {
      const key: string = cell(centroid(t));
      const list: number[] | undefined = grid.get(key);
      if (list === undefined) grid.set(key, [t]);
      else list.push(t);
    }
    const ownerOf = (p: V): string => {
      let best: { d: number; owner: string } = { d: Infinity, owner: "?" };
      const [x, y, z]: number[] = p.map((u: number): number => Math.floor(u / 10));
      for (let i: number = -1; i <= 1; ++i)
        for (let j: number = -1; j <= 1; ++j)
          for (let k: number = -1; k <= 1; ++k)
            for (const index of grid.get(`${x! + i},${y! + j},${z! + k}`) ?? []) {
              const d: number = norm(sub(centroid(index), p));
              if (d < best.d) best = { d, owner: realized.owners[index]! };
            }
      return best.owner;
    };
    const fold: V[] = (pose === "reference" ? AutoMovieHumanF1.CUTTERS[0]!.family : AutoMovieHumanF1.assemble(P.NEUTRAL).axilla).centres.map((c): V => [c[0], c[1], c[2]]);
    const foldAt = (p: V): { z: number; distance: number } => {
      let best: { z: number; distance: number } = { z: NaN, distance: Infinity };
      for (let i: number = 0; i + 1 < fold.length; ++i) {
        const [a, b]: V[] = [fold[i]!, fold[i + 1]!];
        const e: V = sub(b!, a!);
        const t: number = Math.max(0, Math.min(1, dot(sub(p, a!), e) / dot(e, e)));
        const q: V = add(a!, scale(e, t));
        const d: number = norm(sub(p, q));
        if (d < best.distance) best = { z: q[2], distance: d };
      }
      return best;
    };
    return {
      pose,
      reference,
      generated: { positions: realized.positions, indices: realized.indices },
      armFace: { positions: realized.positions, indices: realized.indices.filter((_: number, i: number): boolean => realized.owners[Math.floor(i / 3)] === armName) },
      owners: [...new Set(realized.owners)].sort((a: string, b: string): number => a.localeCompare(b)),
      ownerOf,
      fold,
      foldAt,
      girdle: { point: P.frame("humerus").origin as V, normal: plane(0, 0).normal },
      gh: (pose === "reference" ? P.frames() : P.frames(P.NEUTRAL)).get("humerus")!.origin as V,
    };
  }

  /**
   * One station read on one skin: each ray's kept point (null where none), whether it lies on the arm's own skin, the read loop's largest
   * extent from the course point and from GH, and a note where the station has no such loop.
   */
  interface IRead {
    rays: (V | null)[];
    arm: boolean[];
    course: number;
    shoulder: number;
    note: string | null;
  }

  /** A station not read, with why. */
  function unread(note: string): IRead {
    return { rays: Array.from({ length: RAYS }, (): null => null), arm: Array.from({ length: RAYS }, (): boolean => false), course: 0, shoulder: 0, note };
  }

  /**
   * A station of a course read four ways: the reference's and the generated skin's family section, the one closed loop of the cut that
   * encloses the course point (the loft's premise is a section star-shaped about its course; the smallest by area where several enclose
   * it); the reference's arm arc, that loop cut where the axillary fold (the slit cutter's course) crosses the station's plane, at the loop's
   * points nearest the two crossings, and the arc on the course point's side of the chord between them kept (taken whole where the plane
   * meets the fold nowhere, unread where it meets it other than twice); and the generated arm's face alone, the triangles the arm owns,
   * which the slit bounds, read on every piece. The girdle plane's clip applies to every ray. With `all` false the generated skin's loop is
   * not read (the turn's radius needs only the arm's own skin).
   */
  function readStation(axis: IAxis, station: number, skins: ISkins, all: boolean): IRead[] {
    const armName: string = AutoMovieHumanF1.BODY.arm.name;
    const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
    const normal: V = cross(frame.v as V, frame.u as V);
    const origin: V = [...frame.origin] as V;
    const world = (p: C.P): V => add(origin, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
    const chartOf = (p: V): C.P => [dot(sub(p, origin), frame.u as V), dot(sub(p, origin), frame.v as V)];
    const keep = (p: C.P): boolean => dot(sub(world(p), skins.girdle.point), skins.girdle.normal) > 0.5;
    const cut = (surface: M.IMesh): IPiece[] => M.outline(surface, { origin, axes: [normal, [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): IPiece => ({ points: [...loop.points], closed: loop.closed }));
    const extents = (pieces: readonly IPiece[]): { course: number; shoulder: number } => ({
      course: Math.max(0, ...pieces.flatMap((piece: IPiece): number[] => piece.points.map((p: C.P): number => Math.hypot(p[0], p[1])))),
      shoulder: Math.max(0, ...pieces.flatMap((piece: IPiece): number[] => piece.points.map((p: C.P): number => norm(sub(world(p), skins.gh))))),
    });
    const rays = (hits: { t: number; segment: number }[]): (V | null)[] => hits.map((h, j: number): V | null => (Number.isFinite(h.t) ? world([h.t * Math.cos((2 * Math.PI * j) / RAYS), h.t * Math.sin((2 * Math.PI * j) / RAYS)]) : null));
    const enclosing = (pieces: readonly IPiece[]): IPiece | null => pieces.filter((piece: IPiece): boolean => piece.closed && Math.abs(winding(piece.points)) >= 0.5).sort((a: IPiece, b: IPiece): number => area(a.points) - area(b.points))[0] ?? null;
    // Where the loop opened: the open pieces' ends, the one nearest the fold, by its distance from the fold, from the girdle plane and from GH.
    const opened = (pieces: readonly IPiece[]): string => {
      const ends: V[] = pieces.filter((piece: IPiece): boolean => !piece.closed).flatMap((piece: IPiece): V[] => [world(piece.points[0]!), world(piece.points.at(-1)!)]);
      if (ends.length === 0) return `open: no closed loop round the course point and no open piece (${pieces.length} closed loops elsewhere)`;
      const nearest: V = ends.reduce((a: V, b: V): V => (skins.foldAt(b).distance < skins.foldAt(a).distance ? b : a));
      return `open: ${ends.length / 2} open pieces; the end nearest the fold ${skins.foldAt(nearest).distance.toFixed(1)} mm from it, ${dot(sub(nearest, skins.girdle.point), skins.girdle.normal).toFixed(1)} mm lateral of the girdle plane, ${norm(sub(nearest, skins.gh)).toFixed(1)} mm from GH`;
    };
    // The fold's crossings of the station's plane.
    const crossings: V[] = [];
    for (let i: number = 0; i + 1 < skins.fold.length; ++i) {
      const [ha, hb]: number[] = [dot(sub(skins.fold[i]!, origin), normal), dot(sub(skins.fold[i + 1]!, origin), normal)];
      if ((ha! < 0) !== (hb! < 0)) crossings.push(add(skins.fold[i]!, scale(sub(skins.fold[i + 1]!, skins.fold[i]!), ha! / (ha! - hb!))));
    }

    const out: IRead[] = [];
    const stored: IPiece[] = skins.reference === null ? [] : cut(skins.reference);
    const loop: IPiece | null = enclosing(stored);
    if (skins.reference === null) out.push(unread(`no reference skin at the ${skins.pose} pose`), unread(`no reference skin at the ${skins.pose} pose`));
    else if (loop === null) out.push(unread(opened(stored)), unread(opened(stored)));
    else {
      const length: number = loop.points.length;
      const span = (from: number, to: number): number => (((to - from) % length) + length) % length;
      const arc = ((): { from: number; count: number; gap: number } | null => {
        if (crossings.length === 0) return { from: 0, count: length, gap: 0 };
        if (crossings.length !== 2) return null;
        const nearest = (x: C.P): { i: number; d: number } => loop.points.reduce((best: { i: number; d: number }, p: C.P, i: number): { i: number; d: number } => (Math.hypot(p[0] - x[0], p[1] - x[1]) < best.d ? { i, d: Math.hypot(p[0] - x[0], p[1] - x[1]) } : best), { i: -1, d: Infinity });
        const [c1, c2] = crossings.map((x: V): { i: number; d: number } => nearest(chartOf(x)));
        if (c1!.i === c2!.i) return null;
        const [p1, p2]: C.P[] = [loop.points[c1!.i]!, loop.points[c2!.i]!];
        const side = (p: C.P): number => Math.sign((p2![0] - p1![0]) * (p[1] - p1![1]) - (p2![1] - p1![1]) * (p[0] - p1![0]));
        const middle: C.P = loop.points[(c1!.i + Math.floor(span(c1!.i, c2!.i) / 2)) % length]!;
        const [from, to]: number[] = side(middle) === side([0, 0]) ? [c1!.i, c2!.i] : [c2!.i, c1!.i];
        return { from: from!, count: span(from!, to!), gap: Math.max(c1!.d, c2!.d) };
      })();
      const hits = cast([loop], keep);
      out.push({ rays: rays(hits), arm: hits.map((h): boolean => arc !== null && h.segment >= 0 && span(arc.from, h.segment) < arc.count), ...extents([loop]), note: null });
      if (arc === null) out.push(unread(`unread: the plane meets the fold ${crossings.length} times`));
      else {
        const piece: IPiece = { points: Array.from({ length: arc.count + 1 }, (_: unknown, k: number): C.P => loop.points[(arc.from + k) % length]!), closed: arc.count === length };
        const note: string | null = crossings.length === 0 ? "the plane meets the fold nowhere: the loop taken whole" : `cut at the fold, the loop's points ${arc.gap.toFixed(1)} mm from its crossings at most; the arc ${arc.count} of ${length} points`;
        out.push({ rays: rays(cast([piece], keep)), arm: Array.from({ length: RAYS }, (): boolean => true), ...extents([piece]), note });
      }
    }

    if (!all) out.push(unread("not read"));
    else {
      const whole: IPiece[] = cut(skins.generated);
      const round: IPiece | null = enclosing(whole);
      if (round === null) out.push(unread(opened(whole)));
      else {
        const points: (V | null)[] = rays(cast([round], keep));
        out.push({ rays: points, arm: points.map((p: V | null): boolean => p !== null && skins.ownerOf(p) === armName), ...extents([round]), note: null });
      }
    }
    const face: IPiece[] = cut(skins.armFace);
    out.push({ rays: rays(cast(face, keep)), arm: Array.from({ length: RAYS }, (): boolean => true), ...extents(face), note: face.length === 0 ? "no arm skin in the plane" : null });
    return out;
  }

  /** The course's local radius of curvature at a station: the circle through its points 1 mm either side. */
  function courseRadius(axis: IAxis, station: number): number {
    const [a, b, c]: V[] = [axis.at(station - 1).origin as V, axis.at(station).origin as V, axis.at(station + 1).origin as V];
    const twice: number = norm(cross(sub(b!, a!), sub(c!, a!)));
    return twice < 2e-12 ? Infinity : (norm(sub(b!, a!)) * norm(sub(c!, b!)) * norm(sub(c!, a!))) / (2 * twice);
  }

  /** A ray step that goes back: its station, phase, point and distance from the course, the course's radius there, and where it lies. */
  interface IStep {
    s: number;
    phase: number;
    p: V;
    d: number;
    R: number;
    owner: string;
    side: string;
    arm: boolean;
  }

  /**
   * The crossing check over a course's turn: at each station `ADVANCE_STEP_MM` apart from 0 to `turnEnd`, the four readings of
   * `readStation`; each ray's point must move forward along the course's tangent from one station to the next. Reported per reading: the
   * read loop's extent, the least advance and its place, the steps that go back with their distance from the course against the course's
   * radius, their owner (generated) or side of the slit (reference), and whether they lie on the arm's own skin.
   */
  function crossingCheck(axis: IAxis, turnEnd: number, skins: ISkins, progress: (what: string) => void): { lines: string[]; failing: IStep[][] } {
    const labels: string[] = ["reference, the loop round the course point", "reference, the arm's arc cut at the fold", "generated, the loop round the course point", "generated, the arm's face alone"].map((label: string): string => `${label} (${skins.pose} pose)`);
    const failing: IStep[][] = labels.map((): IStep[] => []);
    const notes: { s: number; note: string }[][] = labels.map((): { s: number; note: string }[] => []);
    const reach: { course: number; shoulder: number }[] = labels.map((): { course: number; shoulder: number } => ({ course: 0, shoulder: 0 }));
    const least: { value: number; at: string }[] = labels.map((): { value: number; at: string } => ({ value: Infinity, at: "-" }));
    const lateral = (p: V): boolean => p[2] > skins.foldAt(p).z;
    let previous: IRead[] = readStation(axis, 0, skins, true);
    for (let station: number = ADVANCE_STEP_MM; station <= turnEnd; station += ADVANCE_STEP_MM) {
      const current: IRead[] = readStation(axis, station, skins, true);
      const tangent: V = unit(sub(axis.at(station - 0.25).origin as V, axis.at(station - 0.75).origin as V));
      const R: number = courseRadius(axis, station - ADVANCE_STEP_MM / 2);
      current.forEach((read: IRead, k: number): void => {
        reach[k]!.course = Math.max(reach[k]!.course, read.course);
        reach[k]!.shoulder = Math.max(reach[k]!.shoulder, read.shoulder);
        if (read.note !== null) notes[k]!.push({ s: station, note: read.note });
        read.rays.forEach((p: V | null, j: number): void => {
          const before: V | null = previous[k]!.rays[j]!;
          if (p === null || before === null) return;
          const advance: number = dot(sub(p, before), tangent) / ADVANCE_STEP_MM;
          if (advance < least[k]!.value) least[k] = { value: advance, at: `${(station - ADVANCE_STEP_MM).toFixed(0)}..${station.toFixed(0)} mm at ${((360 * j) / RAYS).toFixed(1)} deg` };
          if (advance > 0) return;
          const d: number = norm(sub(p, axis.at(station).origin as V));
          failing[k]!.push({ s: station, phase: (360 * j) / RAYS, p, d, R, owner: k >= 2 ? skins.ownerOf(p) : "-", side: k < 2 ? (lateral(p) ? "lateral of the slit" : "medial of the slit") : "-", arm: read.arm[j]! });
        });
      });
      previous = current;
      if (station % 20 === 0) progress(`${skins.pose}: station ${station} of ${turnEnd.toFixed(0)} mm: ${failing.map((f: IStep[]): number => f.length).join(" / ")} ray steps go back`);
    }
    const lines: string[] = [];
    labels.forEach((label: string, k: number): void => {
      const list: IStep[] = failing[k]!;
      const tally = (key: (f: IStep) => string): string => {
        const counts: Map<string, number> = new Map();
        for (const f of list) counts.set(key(f), (counts.get(key(f)) ?? 0) + 1);
        return [...counts.entries()].map(([name, c]): string => `${name} ${c}`).join(", ");
      };
      progress(`${label}: ${list.length} ray steps go back`);
      lines.push(`${label}: uncropped (the whole figure cut), so no section can touch a crop; the read loop reaches ${reach[k]!.course.toFixed(1)} mm from the course point and ${reach[k]!.shoulder.toFixed(1)} mm from GH`);
      lines.push(`${label}: least advance ${least[k]!.value.toFixed(3)} mm per mm at ${least[k]!.at}`);
      lines.push(`${label}: ${list.length} ray steps go back${list.length === 0 ? "" : `; on the arm's own skin ${list.filter((f: IStep): boolean => f.arm).length}; by ${k >= 2 ? `owner: ${tally((f: IStep): string => f.owner)}` : `side of the slit by z: ${tally((f: IStep): string => f.side)}`}`}`);
      const general = (note: string): string => note.replace(/[\d.]+ mm/g, "# mm").replace(/\d+ of \d+/g, "# of #");
      const byNote: Map<string, number[]> = new Map();
      for (const { s: at, note } of notes[k]!) byNote.set(general(note), [...(byNote.get(general(note)) ?? []), at]);
      for (const [note, at] of byNote) lines.push(`  ${at.length} stations (${Math.min(...at)}..${Math.max(...at)} mm): ${note}`);
      for (const { s: at, note } of notes[k]!.filter((x): boolean => x.note.startsWith("open") || x.note.startsWith("cut"))) lines.push(`    ${at} mm: ${note}`);
      const byStation: Map<number, IStep[]> = new Map();
      for (const f of list) byStation.set(f.s, [...(byStation.get(f.s) ?? []), f]);
      for (const [station, steps] of [...byStation.entries()].sort((a, b): number => a[0] - b[0])) {
        const worst: IStep = steps.reduce((a: IStep, b: IStep): IStep => (b.d / b.R > a.d / a.R ? b : a));
        lines.push(`  ${(station - ADVANCE_STEP_MM).toFixed(0)}..${station.toFixed(0)} mm: ${steps.length} rays at ${Math.min(...steps.map((f: IStep): number => f.phase)).toFixed(1)}..${Math.max(...steps.map((f: IStep): number => f.phase)).toFixed(1)} deg, ${steps.filter((f: IStep): boolean => f.arm).length} on the arm's own skin; d ${Math.min(...steps.map((f: IStep): number => f.d)).toFixed(1)}..${Math.max(...steps.map((f: IStep): number => f.d)).toFixed(1)} mm against the course's radius ${worst.R.toFixed(1)} mm (d / R up to ${(worst.d / worst.R).toFixed(2)})${k >= 2 ? `; owners ${[...new Set(steps.map((f: IStep): string => f.owner))].join(", ")}` : ""}`);
      }
      lines.push("");
    });
    return { lines, failing };
  }

  /**
   * The pre-check's measured cause (the supervisor's four items on #3151, R3b): for every skin step that goes back over the k = 1.5 turn,
   * its distance from the course against the course's local radius there; the surface it lies on (the generated figure's owning face, the
   * reference's side of the axillary slit); the same check with the section kept to the arm's own skin; and the girdle ring's reversal
   * against the slit.
   */
  async function cause(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const skins: ISkins = skinsOf(await realizedSkin(root, "reference", progress), source.all, "reference");
    progress(`${skins.generated.indices.length / 3} realized triangles over ${skins.generated.positions.length / 3} vertices`);

    // The k = 1.5 course, as in the pre-check.
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const elbow: V = P.frame("forearm").origin as V;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / ringPoints.length);
    let s: number = TURN_K * r;
    for (let i: number = 0; i < 100; ++i) {
      const next: number = TURN_K * r * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s)), elbow])[0]!);
      if (Math.abs(next - s) < 1e-9) break;
      s = next;
    }
    const frames: P.IFrames = P.frames();
    const centres: V[] = [centre, add(centre, scale(n, s + 1e-6)), ...T_COURSE_AFTER.map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V)];
    const axis: IAxis = H.axis({ centres, halves: [TURN_K * r, ...AutoMovieHumanF1.BODY.arm.halves.slice(1)], up: P.direction("arm.up", frames) as V });
    const turnEnd: number = 2 * TURN_K * r + 20;
    const lines: string[] = [`R3b pre-check, the measured cause; the k ${TURN_K} course (s ${s.toFixed(2)} mm, half ${(TURN_K * r).toFixed(1)} mm); the generated figure's owners: ${skins.owners.join(", ")}`, ""];
    lines.push(...crossingCheck(axis, turnEnd, skins, progress).lines);

    // (c) The ring's reversal against the slit.
    const trunk: M.IMesh = trunkMesh();
    const onTrunk: V[] = ring(trunk, girdle.frame).filter((h: V | null): h is V => h !== null);
    const chart = trunkChart();
    const armpit = chart(P.point("armpit") as V);
    const q: [number, number][] = onTrunk.map((p: V): [number, number] => {
      const c = chart(p);
      return [c.station, armpit.v * Math.atan2(c.v, c.u)];
    });
    const middle: [number, number] = [q.reduce((t, x): number => t + x[0], 0) / q.length, q.reduce((t, x): number => t + x[1], 0) / q.length];
    const steps: number[] = q.map((a, i): number => {
      const b = q[(i + 1) % q.length]!;
      const d: number = Math.atan2(b[1] - middle[1], b[0] - middle[0]) - Math.atan2(a[1] - middle[1], a[0] - middle[0]);
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const loopSense: number = Math.sign(steps.reduce((t: number, x: number): number => t + x, 0)) || 1;
    steps.forEach((x: number, i: number): void => {
      if (loopSense * x >= 0) return;
      const [a, b] = [q[i]!, q[(i + 1) % q.length]!];
      const p: V = onTrunk[i]!;
      const c = chart(p);
      lines.push(`(c) reversal at ring step ${i}: ${degrees(-loopSense * x).toFixed(3)} deg about the ring's centre in the chart, ${Math.hypot(b[0] - a[0], b[1] - a[1]).toFixed(2)} mm between the two points; trunk station ${c.station.toFixed(1)}, phase ${degrees(Math.atan2(c.v, c.u)).toFixed(1)} deg; ${skins.foldAt(p).distance.toFixed(1)} mm from the slit's line`);
    });
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "cause-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    await fs.writeFile(path.join(out, "cause.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The axilla's slit as its cutter's skin at the reference pose: the cutter lofted at 21 stations, 36 phases each. */
  function slitSkin(): V[] {
    const cutter: H.IFamily = AutoMovieHumanF1.CUTTERS[0]!.family;
    const at = (i: number): number => cutter.knots[0]! + ((cutter.knots[cutter.knots.length - 1]! - cutter.knots[0]!) * i) / 20;
    const cutterLoft = H.create({ ...cutter, tips: undefined, reliefs: undefined }, cutter.knots.length >= 2 ? Array.from({ length: 21 }, (_: unknown, i: number): number => at(i)) : cutter.knots);
    const slit: V[] = [];
    if (cutterLoft.chain !== null)
      for (let i: number = 0; i <= 20; ++i) {
        const read = AutoMovieLoftChain.sampler(cutterLoft.chain, at(i));
        for (let j: number = 0; j < 36; ++j) slit.push(read((2 * Math.PI * j) / 36) as V);
      }
    return slit;
  }

  /**
   * R3a's measurements on a course at a pose: its sections from the ring to the elbow `CAP_STEP_MM` apart, star-shaped about the course
   * point or not, on each skin given; the band's turn at the ring and its gap on the first skin; the slit's skin against the first sections;
   * how the second run and the course pass GH; and each segment's length against the set-backs of the turns at its ends.
   */
  function courseFacts(axis: IAxis, centres: V[], halves: number[], frames: P.IFrames, meshes: [string, M.IMesh][], ringPoints: V[], slit: V[], n: V): { lines: string[]; sections: N.Curve[]; elbowStation: number } {
    const onPlane: V = P.frame("humerus").origin as V;
    const gh: V = frames.get("humerus")!.origin as V;
    const elbow: V = frames.get("forearm")!.origin as V;
    const lines: string[] = [];
    let elbowStation: number = 0;
    for (let s: number = 0; s < 800; s += 0.5) if (norm(sub(axis.at(s).origin as V, elbow)) < norm(sub(axis.at(elbowStation).origin as V, elbow))) elbowStation = s;
    const sections: N.Curve[] = [];
    meshes.forEach(([skin, mesh]: [string, M.IMesh], m: number): void => {
      const bad: string[] = [];
      let index: number = -1;
      for (let s: number = 0; s <= elbowStation; s += CAP_STEP_MM) {
        ++index;
        const section = clippedSection(mesh, axis.at(s), onPlane, n);
        if (section === null) {
          bad.push(`${s}: no section`);
          continue;
        }
        if (section.folds > 0 || !section.inside) bad.push(`${s}: ${section.inside ? "" : "course point OUTSIDE; "}${section.folds} rays, ${section.deepest.toFixed(1)} mm${section.phases === null ? "" : ` at ${section.phases[0]}..${section.phases[1]} deg`}`);
        if (m === 0 && index % 5 === 0) sections.push({ id: "s" + s, points: section.loop, closed: true, xray: true, colour: section.folds > 0 || !section.inside ? "c0392b" : "1f9d3a" });
      }
      lines.push(`  ${skin}: elbow at station ${elbowStation.toFixed(1)}; ${bad.length} of ${index + 1} sections not star-shaped about the course or off it${bad.length === 0 ? "" : ": " + bad.slice(0, 16).join("; ") + (bad.length > 16 ? `; ... ${bad.length - 16} more` : "")}`);
    });
    const first = clippedSection(meshes[0]![1], axis.at(ARM_RAIL_MM), onPlane, n);
    const tangent: V = unit(sub(axis.at(ARM_RAIL_MM + 0.5).origin as V, axis.at(ARM_RAIL_MM - 0.5).origin as V));
    const gaps: number[] = first === null ? [] : first.loop.map((p: V): number => distanceTo(p, ringPoints));
    lines.push(`  the band from the girdle's ring to the arm's ring ${ARM_RAIL_MM} mm in: turn ${degrees(Math.acos(Math.min(1, Math.abs(dot(tangent, n))))).toFixed(1)} deg; ${first === null ? "no first section" : `nearest-point gap ${Math.min(...gaps).toFixed(1)} .. ${Math.max(...gaps).toFixed(1)} mm on the ${meshes[0]![0]} skin`}`);
    const stations: number[] = slit.map((p: V): number => {
      let best: number = 0;
      for (let s: number = 0; s <= 120; s += 1) if (norm(sub(axis.at(s).origin as V, p)) < norm(sub(axis.at(best).origin as V, p))) best = s;
      return best;
    });
    lines.push(`  the slit's skin points stand nearest to course stations ${Math.min(...stations)} .. ${Math.max(...stations)} mm`);
    const run: V = unit(sub(elbow, centres[1]!));
    const along: number = dot(sub(gh, centres[1]!), run);
    const miss: number = norm(sub(sub(gh, centres[1]!), scale(run, along)));
    let closest: { d: number; s: number } = { d: Infinity, s: 0 };
    for (let s: number = 0; s <= elbowStation; s += 0.5) if (norm(sub(axis.at(s).origin as V, gh)) < closest.d) closest = { d: norm(sub(axis.at(s).origin as V, gh)), s };
    lines.push(`  GH: the second run (the corner to the elbow) misses it by ${miss.toFixed(1)} mm, GH ${along.toFixed(1)} mm along it from the corner; the course passes ${closest.d.toFixed(1)} mm from GH at station ${closest.s.toFixed(1)}`);
    const angles: number[] = AutoMovieHumanConicPose.angles(centres);
    const backs: number[] = halves.map((h: number, k: number): number => h * AutoMovieHumanConicPose.share(angles[k]!));
    const names: string[] = ["the ring's centre", "the corner", "the elbow", "the wrist", "the middle finger's first joint", "the hand's end"];
    lines.push(`  turns: ${halves.map((h: number, k: number): string => `${names[k + 1]} ${degrees(angles[k]!).toFixed(1)} deg, half ${h.toFixed(2)} mm, set-back ${backs[k]!.toFixed(2)} mm`).join("; ")}`);
    for (let i: number = 0; i + 1 < centres.length; ++i) {
      const length: number = norm(sub(centres[i + 1]!, centres[i]!));
      const start: number = i >= 1 ? backs[i - 1]! : 0;
      const end: number = i < backs.length ? backs[i]! : 0;
      lines.push(`  segment ${names[i]} to ${names[i + 1]}: ${length.toFixed(2)} mm against set-backs ${start.toFixed(2)} + ${end.toFixed(2)} = ${(start + end).toFixed(2)} mm (spare ${(length - start - end).toFixed(2)} mm)`);
    }
    return { lines, sections, elbowStation };
  }

  /**
   * The girdle's ring as the plane's real cut of the trunk wall: the intersection loops traced by `M.outline`, against the near-side ray
   * ring read from the plane's centre (`ring`). Reported: how many pieces the cut has and whether they close; how far each piece leaves the
   * ray ring (where the ray ring bridges a hollow) and where; the ray ring's widest step between neighbouring rays against the real cut's
   * length between its ends; and each closed piece's star-shape in the trunk's chart (phase read as millimetres at the armpit's side
   * distance), as the port's loop is read.
   */
  function realCut(trunk: M.IMesh, girdle: { frame: AutoMovieLoftFrame.IFrame; normal: V }, foldAt: (p: V) => { z: number; distance: number }): { lines: string[]; rayRing: V[]; pieces: { points: V[]; closed: boolean }[]; trunk: M.IMesh } {
    const frame: AutoMovieLoftFrame.IFrame = girdle.frame;
    const origin: V = [...frame.origin] as V;
    const normal: V = cross(frame.v as V, frame.u as V);
    const world = (p: C.P): V => add(origin, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
    const chartOf = (p: V): C.P => [dot(sub(p, origin), frame.u as V), dot(sub(p, origin), frame.v as V)];
    const pieces: IPiece[] = M.outline(trunk, { origin, axes: [normal, [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): IPiece => ({ points: [...loop.points], closed: loop.closed }));
    const rays: (V | null)[] = ring(trunk, frame);
    const rayRing: V[] = rays.filter((h: V | null): h is V => h !== null);
    const flat: C.P[] = rayRing.map(chartOf);
    const toRing = (p: C.P): number => {
      let best: number = Infinity;
      for (let i: number = 0; i < flat.length; ++i) {
        const [a, b]: C.P[] = [flat[i]!, flat[(i + 1) % flat.length]!];
        const e: C.P = [b![0] - a![0], b![1] - a![1]];
        const t: number = Math.max(0, Math.min(1, ((p[0] - a![0]) * e[0] + (p[1] - a![1]) * e[1]) / Math.max(1e-12, e[0] * e[0] + e[1] * e[1])));
        best = Math.min(best, Math.hypot(p[0] - a![0] - t * e[0], p[1] - a![1] - t * e[1]));
      }
      return best;
    };
    const chart = trunkChart();
    const armpit = chart(P.point("armpit") as V);
    const where = (p: V): string => {
      const c = chart(p);
      return `trunk station ${c.station.toFixed(1)}, phase ${degrees(Math.atan2(c.v, c.u)).toFixed(1)} deg, ${foldAt(p).distance.toFixed(1)} mm from the fold's line`;
    };
    const lines: string[] = [`  the real cut: ${pieces.length} pieces, ${pieces.filter((p: IPiece): boolean => p.closed).length} closed and ${pieces.filter((p: IPiece): boolean => !p.closed).length} open (${pieces.map((p: IPiece): number => p.points.length).join(", ")} points); the ray ring: ${rayRing.length} of ${RAYS} rays meet the wall`];
    pieces.forEach((piece: IPiece, i: number): void => {
      const off: number[] = piece.points.map(toRing);
      const worst: number = off.reduce((best: number, d: number, k: number): number => (d > off[best]! ? k : best), 0);
      const length: number = piece.points.reduce((t: number, p: C.P, k: number): number => (k + 1 < piece.points.length || piece.closed ? t + Math.hypot(piece.points[(k + 1) % piece.points.length]![0] - p[0], piece.points[(k + 1) % piece.points.length]![1] - p[1]) : t), 0);
      lines.push(`  piece ${i} (${piece.closed ? "closed" : "open"}, ${piece.points.length} points, ${length.toFixed(1)} mm long): ${off.filter((d: number): boolean => d > 1).length} points more than 1 mm off the ray ring; the farthest ${off[worst]!.toFixed(1)} mm off at ${where(world(piece.points[worst]!))}`);
      if (!piece.closed) return;
      const q: [number, number][] = piece.points.map((p: C.P): [number, number] => {
        const c = chart(world(p));
        return [c.station, armpit.v * Math.atan2(c.v, c.u)];
      });
      const middle: [number, number] = [q.reduce((t, x): number => t + x[0], 0) / q.length, q.reduce((t, x): number => t + x[1], 0) / q.length];
      const steps: number[] = q.map((a, k): number => {
        const b = q[(k + 1) % q.length]!;
        const d: number = Math.atan2(b[1] - middle[1], b[0] - middle[0]) - Math.atan2(a[1] - middle[1], a[0] - middle[0]);
        return Math.atan2(Math.sin(d), Math.cos(d));
      });
      const sense: number = Math.sign(steps.reduce((t: number, x: number): number => t + x, 0)) || 1;
      const against: number[] = steps.map((x: number, k: number): number => (sense * x < 0 ? k : -1)).filter((k: number): boolean => k >= 0);
      lines.push(`  piece ${i} in the trunk's chart (phase as mm at the armpit's side distance ${armpit.v.toFixed(1)}): ${against.length === 0 ? "star-shaped about its centre" : `NOT STAR-SHAPED: ${against.length} steps turn back about its centre, ${degrees(against.reduce((t: number, k: number): number => t - sense * steps[k]!, 0)).toFixed(2)} deg in all`}`);
      for (const k of against.slice(0, 12)) lines.push(`    step ${k}: ${degrees(-sense * steps[k]!).toFixed(3)} deg back at ${where(world(piece.points[k]!))}`);
    });
    let widest: number = 0;
    for (let i: number = 1; i < flat.length; ++i) if (Math.hypot(flat[i]![0] - flat[i - 1]![0], flat[i]![1] - flat[i - 1]![1]) > Math.hypot(flat[widest]![0] - flat[(widest + flat.length - 1) % flat.length]![0], flat[widest]![1] - flat[(widest + flat.length - 1) % flat.length]![1])) widest = i;
    const [a, b]: C.P[] = [flat[(widest + flat.length - 1) % flat.length]!, flat[widest]!];
    const chord: number = Math.hypot(b![0] - a![0], b![1] - a![1]);
    // The real cut between the chord's two ends: each end's piece and point (the cut's nearest vertex), and, where both lie on one piece,
    // the shorter way along it between them.
    const onCut = (x: C.P): { piece: number; i: number; d: number } => {
      let best: { piece: number; i: number; d: number } = { piece: -1, i: -1, d: Infinity };
      pieces.forEach((piece: IPiece, k: number): void => piece.points.forEach((p: C.P, i: number): void => {
        if (Math.hypot(p[0] - x[0], p[1] - x[1]) < best.d) best = { piece: k, i, d: Math.hypot(p[0] - x[0], p[1] - x[1]) };
      }));
      return best;
    };
    const [ea, eb] = [onCut(a!), onCut(b!)];
    const between = ((): string => {
      if (ea.piece !== eb.piece) return `its two ends lie on different pieces of the real cut (piece ${ea.piece}, ${ea.d.toFixed(2)} mm from its nearest vertex, and piece ${eb.piece}, ${eb.d.toFixed(2)} mm), so the ray ring jumps from one loop of the cut to the other there`;
      const piece: IPiece = pieces[ea.piece]!;
      const run = (from: number, to: number): number => {
        let total: number = 0;
        for (let k: number = from; k !== to; k = (k + 1) % piece.points.length) total += Math.hypot(piece.points[(k + 1) % piece.points.length]![0] - piece.points[k]![0], piece.points[(k + 1) % piece.points.length]![1] - piece.points[k]![1]);
        return total;
      };
      const forward: number = run(Math.min(ea.i, eb.i), Math.max(ea.i, eb.i));
      return `both ends lie on piece ${ea.piece} (${Math.max(ea.d, eb.d).toFixed(2)} mm from its vertices at most), which runs ${(piece.closed ? Math.min(forward, run(Math.max(ea.i, eb.i), Math.min(ea.i, eb.i))) : forward).toFixed(1)} mm between them`;
    })();
    lines.push(`  the ray ring's widest step between neighbouring rays: ${chord.toFixed(2)} mm, from ${where(world(a!))} to ${where(world(b!))}; ${between}`);
    return { lines, rayRing, pieces: pieces.map((piece: IPiece): { points: V[]; closed: boolean } => ({ points: piece.points.map(world), closed: piece.closed })), trunk };
  }

  /** A mesh kept to the triangles whose corners all lie within `radius` of `focus`, for a frame. */
  function cropMesh(id: string, mesh: M.IMesh, focus: V, radius: number): N.Mesh {
    const positions: number[] = [];
    const indices: number[] = [];
    const remap: Map<number, number> = new Map();
    const near = (i: number): boolean => norm(sub([mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!], focus)) <= radius;
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const tri: number[] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      if (!tri.every(near)) continue;
      for (const i of tri) {
        let j: number | undefined = remap.get(i);
        if (j === undefined) {
          j = positions.length / 3;
          remap.set(i, j);
          positions.push(mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!);
        }
        indices.push(j);
      }
    }
    return { id, positions, indices, colour: [0.64, 0.65, 0.67] };
  }

  /** An orthographic camera looking along `-back`, screen-up nearest `upHint`, fitted to the points as `NodeCanvasCamera.fit` fits. */
  function facing(name: string, back: V, upHint: V, points: readonly V[], width: number, height: number): N.Camera {
    const b: V = unit(back);
    const right: V = unit(cross(upHint, b));
    const up: V = cross(b, right);
    const low: V = [Infinity, Infinity, Infinity];
    const high: V = [-Infinity, -Infinity, -Infinity];
    for (const p of points)
      for (let c: number = 0; c < 3; ++c) {
        low[c] = Math.min(low[c]!, p[c]!);
        high[c] = Math.max(high[c]!, p[c]!);
      }
    const target: V = scale(add(low, high), 0.5);
    const extentX: number = Math.max(...points.map((p: V): number => Math.abs(dot(sub(p, target), right))));
    const extentY: number = Math.max(...points.map((p: V): number => Math.abs(dot(sub(p, target), up))));
    return { name, target, back: b, right, up, scale: 0.88 * Math.min((width - 40) / Math.max(2 * extentX, 0.001), (height - 110) / Math.max(2 * extentY, 0.001)), width, height };
  }

  /** How far the shoulder turn's least bend radius may move between two iterates and count as converged, mm (the supervisor's ruling on #3151, R3b). */
  const CONVERGED_MM: number = 0.5;

  /** The iterates the radius may take before it is reported as not converging: a bound for the report, far past what a settling iteration needs. */
  const ITERATES: number = 20;

  /**
   * R3b, the shoulder turn by the digits' rule (the supervisor's ruling on #3151, after k = 1.5 was rejected). `AutoMovieHumanDigitWalk`
   * sets each joint's least bend radius to its section box's farthest corner, the farthest any section point stands from the course, and
   * converts it to the turn's half by `AutoMovieHumanBendArc.half` (h = 15 R theta / 16, the quintic angle law's peak curvature 1 / R). The
   * shoulder takes the same rule: R is the farthest read point of the arm's own skin (the generated arm's face) from its course point over
   * the turn, stations 0 to 2h; the reference's arm arc is read beside it as the check. The cause run measured why: every step that went
   * back on the arm's own skin stood farther from the course than the course's radius there (d / R 1.01 to 1.53, d up to 99.2 mm against a
   * least radius of 59.6 mm), the sweep's own fold where a section reaches past its course's centre of curvature; a multiple of the arm's
   * radius is no measure of that reach. The loops depend on the course, so R is a fixed point (R, the course, the loops, R), seeded at the
   * arm's own radius, the least a section's farthest point can be; the corner stands at the set-back fixed point of its turn as before.
   * Then, on the converged course at the reference pose and at neutral (the set-backs kept, `AutoMovieHumanConicPose.halves`): the
   * crossing check of `crossingCheck`, R3a's course measurements, the girdle ring as the plane's real cut of the trunk wall, and frames.
   */
  async function bend(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / ringPoints.length);
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const reference: ISkins = skinsOf(await realizedSkin(root, "reference", progress), source.all, "reference");
    const frames: P.IFrames = P.frames();
    const elbow: V = frames.get("forearm")!.origin as V;
    const later: V[] = T_COURSE_AFTER.map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V);
    const lines: string[] = [`R3b, the shoulder turn by the digits' rule; the girdle's ring centre ${fixed(centre)}, its normal ${fixed(n, 3)}; the arm's radius r ${r.toFixed(2)} mm seeds R`, ""];

    // The course at the reference pose for a least bend radius R: the corner on the ring's normal at the set-back of its own turn, the
    // fixed point of s = h share(angle(s)) with h = AutoMovieHumanBendArc.half(the ring's centre, the corner, the elbow, R); today's halves
    // after it. The engine refuses a set-back that reaches its segment's end exactly, so the corner stands 1e-6 mm past it.
    interface ICourse {
      R: number;
      s: number;
      h: number;
      angle: number;
      centres: V[];
      halves: number[];
      axis: IAxis | null;
      refusal: string;
    }
    const courseFor = (radius: number): ICourse => {
      let s: number = radius;
      const trace: string[] = [];
      for (let i: number = 0; i < 200; ++i) {
        const corner: V = add(centre, scale(n, s));
        const angle: number = AutoMovieHumanConicPose.angles([centre, corner, elbow])[0]!;
        trace.push(`s ${s.toFixed(2)} mm at ${degrees(angle).toFixed(2)} deg`);
        let next: number;
        try {
          next = AutoMovieHumanBendArc.half(centre, corner, elbow, radius) * AutoMovieHumanConicPose.share(angle);
        } catch (error: unknown) {
          return { R: radius, s, h: NaN, angle: degrees(angle), centres: [], halves: [], axis: null, refusal: `the set-back's fixed point has no course: ${(error as Error).message.slice(0, 200)}; its iterates ${trace.slice(-8).join(", ")}` };
        }
        const settled: boolean = Math.abs(next - s) < 1e-9;
        s = next;
        if (settled) break;
      }
      const h: number = AutoMovieHumanBendArc.half(centre, add(centre, scale(n, s)), elbow, radius);
      const centres: V[] = [centre, add(centre, scale(n, s + 1e-6)), ...later];
      const halves: number[] = [h, ...arm.halves.slice(1)];
      const angle: number = degrees(AutoMovieHumanConicPose.angles(centres)[0]!);
      try {
        return { R: radius, s, h, angle, centres, halves, axis: H.axis({ centres, halves, up: P.direction("arm.up", frames) as V }), refusal: "" };
      } catch (error: unknown) {
        return { R: radius, s, h, angle, centres, halves, axis: null, refusal: (error as Error).message.slice(0, 300) };
      }
    };
    // The farthest read point of the arm's own skin from the course point over the turn, stations 0 to 2h `ADVANCE_STEP_MM` apart: on the
    // generated arm's face (the rule's R) and on the reference's arm arc (the check).
    const farthest = (axis: IAxis, h: number): { face: number; faceAt: string; arc: number; arcAt: string } => {
      const most = { face: 0, faceAt: "-", arc: 0, arcAt: "-" };
      for (let station: number = 0; station <= 2 * h; station += ADVANCE_STEP_MM) {
        const reads: IRead[] = readStation(axis, station, reference, false);
        const origin: V = axis.at(station).origin as V;
        reads[3]!.rays.forEach((p: V | null, j: number): void => {
          if (p !== null && norm(sub(p, origin)) > most.face) Object.assign(most, { face: norm(sub(p, origin)), faceAt: `station ${station} mm, ${((360 * j) / RAYS).toFixed(1)} deg` });
        });
        reads[1]!.rays.forEach((p: V | null, j: number): void => {
          if (p !== null && norm(sub(p, origin)) > most.arc) Object.assign(most, { arc: norm(sub(p, origin)), arcAt: `station ${station} mm, ${((360 * j) / RAYS).toFixed(1)} deg` });
        });
      }
      return most;
    };

    lines.push("THE FIXED POINT of R, the farthest read point of the arm's own skin from its course point over the turn:");
    let bendRadius: number = r;
    let converged: ICourse | null = null;
    for (let i: number = 1; i <= ITERATES; ++i) {
      const course: ICourse = courseFor(bendRadius);
      if (course.axis === null) {
        lines.push(`  iterate ${i}: R ${bendRadius.toFixed(2)} mm: NO COURSE (the engine refuses it): ${course.refusal}`);
        progress(`iterate ${i}: R ${bendRadius.toFixed(2)} mm: no course: ${course.refusal}`);
        break;
      }
      const far = farthest(course.axis, course.h);
      const line: string = `  iterate ${i}: R ${bendRadius.toFixed(2)} mm -> turn ${course.angle.toFixed(2)} deg, half h ${course.h.toFixed(2)} mm, set-back s ${course.s.toFixed(2)} mm; over the turn (0..${(2 * course.h).toFixed(0)} mm) the arm face's farthest read point ${far.face.toFixed(2)} mm (${far.faceAt}), the reference arm arc's ${far.arc.toFixed(2)} mm (${far.arcAt})`;
      lines.push(line);
      progress(line);
      if (Math.abs(far.face - bendRadius) < CONVERGED_MM) {
        converged = courseFor(far.face);
        break;
      }
      bendRadius = far.face;
    }
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "bend-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const slit: V[] = slitSkin();
    const files: string[] = [];

    // 3. The girdle ring as the plane's real cut of the trunk wall, and its frame: neither depends on the course.
    const real = realCut(trunkMesh(), girdle, reference.foldAt);
    NodeCanvasRaster.initialize();
    const wall: N.Mesh = cropMesh("trunk", real.trunk, scale(real.rayRing.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / real.rayRing.length), 160);
    const ringFile: string = path.join(out, "bend.ring.armpit.png");
    await fs.writeFile(
      ringFile,
      NodeCanvasRaster.render(
        facing("armpit", n, [0, 1, 0], [...real.rayRing, ...real.pieces.flatMap((piece): V[] => piece.points)], 900, 900),
        [wall],
        [{ id: "ray-ring", points: real.rayRing, closed: true, xray: true, colour: "9a3fb5" }, ...real.pieces.map((piece, i: number): N.Curve => ({ id: "cut" + i, points: piece.points, closed: piece.closed, xray: true, colour: "1f9d3a" })), { id: "slit", points: slit, closed: false, xray: true, colour: "d08a1f" }],
        "depth",
        "f1 girdle ring on the trunk wall, seen from the armpit along the plane's normal | purple: the ray ring from the plane's centre; green: the plane's real cut; orange: the slit",
      ).png,
    );
    files.push(ringFile);
    const ringLines: string[] = ["3. THE GIRDLE RING AS THE PLANE'S REAL CUT OF THE TRUNK WALL:", ...real.lines, ""];
    if (converged === null || converged.axis === null) {
      lines.push(converged === null ? `NOT CONVERGED: the fixed point ended without R settling within ${CONVERGED_MM} mm (see the iterates above); 1, 2 and the course's frames are not measured` : `THE CONVERGED R ${converged.R.toFixed(2)} mm HAS NO COURSE: ${converged.refusal}`, "");
      lines.push(...ringLines, "4. FRAMES:", ...files.map((file: string): string => `  ${file}`));
      await fs.writeFile(path.join(out, "bend.txt"), lines.join("\n") + "\n");
      process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
      return;
    }
    const axis: IAxis = converged.axis;
    lines.push(`THE CONVERGED COURSE: R ${converged.R.toFixed(2)} mm; the turn ${converged.angle.toFixed(2)} deg, its half ${converged.h.toFixed(2)} mm, the set-back ${converged.s.toFixed(2)} mm; the corner ${fixed(converged.centres[1]!)}; R against the girdle ring's depth: the ring spans ${(Math.max(...ringPoints.map((p: V): number => p[2])) - Math.min(...ringPoints.map((p: V): number => p[2]))).toFixed(1)} mm in z and ${(Math.max(...ringPoints.map((p: V): number => p[1])) - Math.min(...ringPoints.map((p: V): number => p[1]))).toFixed(1)} mm in y`, "");

    // 1 and 2 at the reference pose.
    const checkReference = crossingCheck(axis, 2 * converged.h + 20, reference, progress);
    lines.push("1. THE CROSSING CHECK AT THE REFERENCE POSE, stations 0 to 2h + 20 mm:", ...checkReference.lines);
    const factsReference = courseFacts(axis, converged.centres, converged.halves, frames, [["reference", source.all], ["generated", reference.generated]], ringPoints, slit, n);
    lines.push("2. THE COURSE AT THE REFERENCE POSE:", ...factsReference.lines, "");

    // 1 and 2 at neutral: the corner stays (fixed in the thorax), the turns keep their set-backs.
    const neutralFrames: P.IFrames = P.frames(P.NEUTRAL);
    const neutralCentres: V[] = [centre, converged.centres[1]!, ...T_COURSE_AFTER.map((name: string): V => SF.toWorld(neutralFrames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V)];
    const neutralHalves: number[] = AutoMovieHumanConicPose.halves(converged.centres, converged.halves, neutralCentres);
    let neutralAxis: IAxis | null = null;
    try {
      neutralAxis = H.axis({ centres: neutralCentres, halves: neutralHalves, up: P.direction("arm.up", neutralFrames) as V });
    } catch (error: unknown) {
      lines.push(`1-2 AT NEUTRAL: THE ENGINE REFUSES THE COURSE: ${(error as Error).message.slice(0, 300)}`, "");
    }
    if (neutralAxis !== null) {
      const neutral: ISkins = skinsOf(await realizedSkin(root, "neutral", progress), null, "neutral");
      lines.push(`1. THE CROSSING CHECK AT NEUTRAL (the turn's half ${neutralHalves[0]!.toFixed(2)} mm by the set-back law), stations 0 to 2h + 20 mm, on the generated figure at neutral:`, ...crossingCheck(neutralAxis, 2 * neutralHalves[0]! + 20, neutral, progress).lines);
      lines.push("2. THE COURSE AT NEUTRAL:", ...courseFacts(neutralAxis, neutralCentres, neutralHalves, neutralFrames, [["generated", neutral.generated]], ringPoints, slit, n).lines, "");
    }

    lines.push(...ringLines);

    // 4. Frames.
    const gh: V = P.frame("humerus").origin as V;
    const shoulder: N.Mesh = cropMesh("reference", source.all, add(gh, scale(unit(sub(elbow, gh)), 120)), 230);
    const points = (mesh: N.Mesh): V[] => Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): V => [mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!]);
    const failingPoints: V[] = [...checkReference.failing[0]!, ...checkReference.failing[1]!].map((f: IStep): V => f.p);
    const curves: N.Curve[] = [
      ...factsReference.sections,
      { id: "course", points: Array.from({ length: 80 }, (_: unknown, i: number): V => axis.at((factsReference.elbowStation * i) / 79).origin as V), closed: false, xray: true, colour: "202020" },
      { id: "ring", points: ringPoints, closed: true, xray: true, colour: "9a3fb5" },
      { id: "slit", points: slit, closed: false, xray: true, colour: "d08a1f" },
      ...marks(failingPoints, "e01b1b", "back"),
    ];
    for (const view of ["front", "back", "left", "low-oblique"]) {
      const file: string = path.join(out, `bend.course.${view}.reference.png`);
      await fs.writeFile(file, NodeCanvasRaster.render(NodeCanvasCamera.fit(view, points(shoulder), 900, 900), [shoulder], curves, "depth", `f1 arm course, the shoulder turn by the digits' rule: R ${converged.R.toFixed(1)} mm, half ${converged.h.toFixed(1)} mm | sections every 10 mm: green star-shaped, red not; black course; purple ring; orange slit; red marks: steps back on the reference (${failingPoints.length}) | ${view}`).png);
      files.push(file);
    }
    lines.push("4. FRAMES:", ...files.map((file: string): string => `  ${file}`));
    await fs.writeFile(path.join(out, "bend.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** Short crosses at points, for a frame: three 3 mm strokes along the axes through each. */
  function marks(at: readonly V[], colour: string, id: string): N.Curve[] {
    return at.flatMap((p: V, i: number): N.Curve[] =>
      [0, 1, 2].map((c: number): N.Curve => {
        const a: V = [...p];
        const b: V = [...p];
        a[c] -= 1.5;
        b[c] += 1.5;
        return { id: `${id}${i}.${c}`, points: [a, b], closed: false, xray: true, colour };
      }),
    );
  }

  /** The points of a frame's mesh, for fitting its camera. */
  function meshPoints(mesh: N.Mesh): V[] {
    return Array.from({ length: mesh.positions.length / 3 }, (_: unknown, i: number): V => [mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!]);
  }

  /** Each ray's outermost kept point of a mesh's cut at a course station, every piece read, open or closed; null where a ray meets none. */
  function castSection(axis: IAxis, station: number, mesh: M.IMesh, keep: (p: V) => boolean): (V | null)[] {
    const frame: AutoMovieLoftFrame.IFrame = axis.at(station);
    const origin: V = [...frame.origin] as V;
    const world = (p: C.P): V => add(origin, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
    const pieces: IPiece[] = M.outline(mesh, { origin, axes: [cross(frame.v as V, frame.u as V), [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): IPiece => ({ points: [...loop.points], closed: loop.closed }));
    return cast(pieces, (p: C.P): boolean => keep(world(p))).map((h, j: number): V | null => (Number.isFinite(h.t) ? world([h.t * Math.cos((2 * Math.PI * j) / RAYS), h.t * Math.sin((2 * Math.PI * j) / RAYS)]) : null));
  }

  /**
   * The folds of a course's sweep: each ray's point at every station `ADVANCE_STEP_MM` apart from `from` to `to`, the steps that go back
   * along the course's tangent, and per phase the no-fold boundary, the last station a step of that phase goes back at (`from` where none),
   * after which that phase never steps back again.
   */
  function folds(axis: IAxis, from: number, to: number, read: (station: number) => (V | null)[]): { stations: number[]; points: (V | null)[][]; back: { s: number; phase: number; p: V }[]; boundary: number[] } {
    const stations: number[] = [];
    for (let s: number = from; s <= to + 1e-9; s += ADVANCE_STEP_MM) stations.push(s);
    const points: (V | null)[][] = stations.map(read);
    const back: { s: number; phase: number; p: V }[] = [];
    const boundary: number[] = Array.from({ length: RAYS }, (): number => from);
    for (let k: number = 1; k < stations.length; ++k) {
      const s: number = stations[k]!;
      const tangent: V = unit(sub(axis.at(s - 0.25).origin as V, axis.at(s - 0.75).origin as V));
      points[k]!.forEach((p: V | null, j: number): void => {
        const before: V | null = points[k - 1]![j]!;
        if (p === null || before === null || dot(sub(p, before), tangent) > 0) return;
        back.push({ s, phase: (360 * j) / RAYS, p });
        boundary[j] = s;
      });
    }
    return { stations, points, back, boundary };
  }

  /** A per-phase value summarized every 10 degrees of phase (20 rays): each band's least and greatest, as `0..10 deg: a..b`. */
  function everyTen(values: readonly number[], digits: number = 1): string[] {
    const per: number = RAYS / 36;
    return Array.from({ length: 36 }, (_: unknown, b: number): string => {
      const band: number[] = values.slice(b * per, (b + 1) * per).filter((x: number): boolean => Number.isFinite(x));
      return `${b * 10}..${b * 10 + 10} deg: ${band.length === 0 ? "-" : `${Math.min(...band).toFixed(digits)}..${Math.max(...band).toFixed(digits)}`}`;
    });
  }

  /**
   * The axilla cutter's volume at the reference pose, as a test: a point lies inside where, between two of the cutter's sections 0.5 mm
   * apart whose planes it stands between, it falls inside the nearer section's loop (72 phases). The cutter's tips are left out, so the
   * volume is its tube between its first and last knots.
   */
  function cutterVolume(): (p: V) => boolean {
    const cutter: H.IFamily = AutoMovieHumanF1.CUTTERS[0]!.family;
    const axis: IAxis = H.axis(cutter);
    const stations: number[] = [];
    for (let s: number = cutter.knots[0]!; s <= cutter.knots.at(-1)!; s += 0.5) stations.push(s);
    const loft: AutoMovieViewLoft.IResult = H.create({ ...cutter, tips: undefined, reliefs: undefined }, stations);
    if (loft.chain === null) throw new Error("the axilla cutter does not loft");
    const chain = loft.chain;
    const rings = stations.map((s: number) => {
      const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
      const origin: V = [...frame.origin] as V;
      const read = AutoMovieLoftChain.sampler(chain, s);
      return { origin, normal: cross(frame.v as V, frame.u as V), u: frame.u as V, v: frame.v as V, loop: Array.from({ length: 72 }, (_: unknown, j: number): C.P => {
        const p: V = read((2 * Math.PI * j) / 72) as V;
        return [dot(sub(p, origin), frame.u as V), dot(sub(p, origin), frame.v as V)];
      }) };
    });
    const within = (q: C.P, loop: readonly C.P[]): boolean => {
      let inside: boolean = false;
      for (let i: number = 0, k: number = loop.length - 1; i < loop.length; k = i++) {
        const [a, b]: C.P[] = [loop[i]!, loop[k]!];
        if ((a![1] > q[1]) !== (b![1] > q[1]) && q[0] < ((b![0] - a![0]) * (q[1] - a![1])) / (b![1] - a![1]) + a![0]) inside = !inside;
      }
      return inside;
    };
    return (p: V): boolean => {
      for (let k: number = 0; k + 1 < rings.length; ++k) {
        const [a, b] = [rings[k]!, rings[k + 1]!];
        const [ha, hb]: number[] = [dot(sub(p, a.origin), a.normal), dot(sub(p, b.origin), b.normal)];
        if ((ha! < 0) === (hb! < 0)) continue;
        const ring = Math.abs(ha!) <= Math.abs(hb!) ? a : b;
        if (within([dot(sub(p, ring.origin), ring.u), dot(sub(p, ring.origin), ring.v)], ring.loop)) return true;
      }
      return false;
    };
  }

  /** One source of f1's construction realized alone at a chord of 1 mm, mm: the family's own wall, no port, band or cutter applied. */
  function alone(name: string): M.IMesh {
    const declared = AutoMovieHumanF1.construction();
    const real = realizeAutoMovieConstruction({ name: "f1." + name, root: { type: "source", name, source: name }, fills: [] }, { chord: 0.001, sources: declared.sources });
    return { positions: Array.from(real.mesh.positions, (x: number): number => 1000 * x), indices: Array.from(real.mesh.indices) };
  }

  /**
   * The armscye as a port whose rails stand past the arm's folds (the supervisor's ruling on #3151, after the shoulder turn by the digits'
   * rule diverged): sections square to a course meet on its centre-of-curvature line, and a course that starts at the ring's centre and ends
   * on the arm's axis cannot keep every section on the inner side, so the band carries the skin there (`construction.md`, Ports: the child
   * extends its field past its root rail and the band blends two real fields; `IAutoMovieConstructionPort.rails` per phase, `profiles` into
   * a hollow and up again). The rule: rail(phase) is the first station after which that phase's ray never steps back on the arm's own skin,
   * plus the band's margin (`ARM_RAIL_MM`) read along the skin. Measured: (1) the current f1 arm on its own course, its own wall realized
   * alone, for folds and their overlap with the axilla cutter's volume; (2) the no-fold boundary per phase, on (a) that arm and (b) the k
   * = 1.5 course reading the reference's arm arc; (3) the girdle ring on the trunk family's own wall realized alone; (4) the band's span on
   * the k = 1.5 course with those rails; (5) frames.
   */
  async function rails(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const gh: V = P.frame("humerus").origin as V;
    const elbow: V = P.frame("forearm").origin as V;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / ringPoints.length);
    const reference: ISkins = skinsOf(await realizedSkin(root, "reference", progress), source.all, "reference");
    const slit: V[] = slitSkin();
    const inCutter = cutterVolume();
    const lines: string[] = ["R3b, the armscye's rails past the arm's folds; measurement only", ""];
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "rails-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });

    // 1. The current f1 arm on its own course: its stored family's frames (armRoot, armTurn, its halves), its own wall realized alone.
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const armAxis: IAxis = H.axis(arm);
    const from: number = arm.knots[0]!;
    let elbowStation: number = from;
    for (let s: number = from; s < from + 800; s += 0.5) if (norm(sub(armAxis.at(s).origin as V, elbow)) < norm(sub(armAxis.at(elbowStation).origin as V, elbow))) elbowStation = s;
    const armWall: M.IMesh = alone(arm.name);
    progress(`realized the arm's own wall: ${armWall.indices.length / 3} triangles`);
    const own = folds(armAxis, from, elbowStation, (station: number): (V | null)[] => castSection(armAxis, station, armWall, (): boolean => true));
    progress(`the arm on its own course: ${own.back.length} steps go back`);
    const ownInside: number = own.back.filter((b): boolean => inCutter(b.p)).length;
    const ownStations: number[] = own.back.map((b): number => b.s - from);
    // What the check read: the rays that met the wall per station, and how far the read points stand from the course against the course's
    // least radius of curvature (a section folds where it reaches past its course's centre of curvature).
    const counts: number[] = own.points.map((ps: (V | null)[]): number => ps.filter((p: V | null): boolean => p !== null).length);
    let ownReach: { d: number; s: number } = { d: 0, s: from };
    own.points.forEach((ps: (V | null)[], k: number): void => {
      const origin: V = armAxis.at(own.stations[k]!).origin as V;
      for (const p of ps) if (p !== null && norm(sub(p, origin)) > ownReach.d) ownReach = { d: norm(sub(p, origin)), s: own.stations[k]! };
    });
    let ownLeast: { R: number; s: number } = { R: Infinity, s: from };
    for (const s of own.stations) if (courseRadius(armAxis, s) < ownLeast.R) ownLeast = { R: courseRadius(armAxis, s), s };
    lines.push(
      `1. THE CURRENT F1 ARM ON ITS OWN COURSE (its stored family's frames, its own wall realized alone, every piece of each cut read, no clip), stations ${from.toFixed(1)} to the elbow's ${elbowStation.toFixed(1)} mm, ${ADVANCE_STEP_MM} mm apart; the arm's turn ${degrees(AutoMovieHumanConicPose.angles(arm.centres.map((c): V => [c[0], c[1], c[2]]))[0]!).toFixed(1)} deg, half ${arm.halves[0]!.toFixed(1)} mm:`,
      `  read: ${Math.min(...counts)} .. ${Math.max(...counts)} of ${RAYS} rays meet the wall per station (${counts.filter((c: number): boolean => c === 0).length} of ${counts.length} stations read nothing); the read points stand up to ${ownReach.d.toFixed(1)} mm from the course (at station ${ownReach.s.toFixed(0)}), against the course's least radius of curvature ${ownLeast.R.toFixed(1)} mm (at station ${ownLeast.s.toFixed(0)})`,
      `  ${own.back.length} ray steps go back${own.back.length === 0 ? "" : ` over stations ${Math.min(...ownStations).toFixed(0)} .. ${Math.max(...ownStations).toFixed(0)} mm past the arm's first knot, at phases ${Math.min(...own.back.map((b): number => b.phase)).toFixed(1)} .. ${Math.max(...own.back.map((b): number => b.phase)).toFixed(1)} deg`}`,
      `  inside the axilla cutter's volume (its tube between its first and last knots): ${ownInside} of ${own.back.length} of those points`,
      "  steps back per 10 deg of phase (count; stations past the first knot):",
      ...Array.from({ length: 36 }, (_: unknown, b: number): string => {
        const band = own.back.filter((x): boolean => x.phase >= b * 10 && x.phase < b * 10 + 10);
        return `    ${b * 10}..${b * 10 + 10} deg: ${band.length}${band.length === 0 ? "" : ` (${Math.min(...band.map((x): number => x.s - from)).toFixed(0)}..${Math.max(...band.map((x): number => x.s - from)).toFixed(0)} mm; ${band.filter((x): boolean => inCutter(x.p)).length} inside the cutter)`}`;
      }),
      "",
    );

    // 2. The no-fold boundary per phase: (a) that arm, (b) the k = 1.5 course on the reference's arm arc.
    let s15: number = TURN_K * r;
    for (let i: number = 0; i < 100; ++i) {
      const next: number = TURN_K * r * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s15)), elbow])[0]!);
      if (Math.abs(next - s15) < 1e-9) break;
      s15 = next;
    }
    const frames: P.IFrames = P.frames();
    const centres15: V[] = [centre, add(centre, scale(n, s15 + 1e-6)), ...T_COURSE_AFTER.map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V)];
    const axis15: IAxis = H.axis({ centres: centres15, halves: [TURN_K * r, ...arm.halves.slice(1)], up: P.direction("arm.up", frames) as V });
    const turnEnd: number = 2 * TURN_K * r + 20;
    const rule = folds(axis15, 0, turnEnd, (station: number): (V | null)[] => readStation(axis15, station, reference, false)[1]!.rays);
    progress(`the k ${TURN_K} course on the reference's arm arc: ${rule.back.length} steps go back`);
    const boundaryLines = (label: string, boundary: readonly number[], start: number): string[] => {
      const past: number[] = boundary.map((s: number): number => s - start);
      const needs: number[] = past.map((s: number, j: number): number => (s > 0 ? (360 * j) / RAYS : NaN)).filter((x: number): boolean => Number.isFinite(x));
      return [`  ${label}: the boundary's greatest ${Math.max(...past).toFixed(0)} mm; ${needs.length} of ${RAYS} phases need a rail past the start${needs.length === 0 ? "" : `, phases ${Math.min(...needs).toFixed(1)} .. ${Math.max(...needs).toFixed(1)} deg`}; per 10 deg (mm past the start):`, ...everyTen(past, 0).map((x: string): string => `    ${x}`)];
    };
    lines.push("2. THE NO-FOLD BOUNDARY PER PHASE (the last station a step of that phase goes back at; the start where none):", ...boundaryLines(`(a) the current arm on its own course (past its first knot ${from.toFixed(1)} mm)`, own.boundary, from), ...boundaryLines(`(b) the k ${TURN_K} course on the reference's arm arc (past the ring's centre)`, rule.boundary, 0), "");

    // 3. The girdle ring on the trunk family's own wall, realized alone (the port cuts the host's face, not the cutter's result), and on its
    // loft as the earlier runs read it.
    const trunkWall: M.IMesh = alone(AutoMovieHumanF1.BODY.trunk.name);
    progress(`realized the trunk's own wall: ${trunkWall.indices.length / 3} triangles`);
    const ownCut = realCut(trunkWall, girdle, reference.foldAt);
    const loftCut = realCut(trunkMesh(), girdle, reference.foldAt);
    lines.push("3. THE GIRDLE RING ON THE TRUNK FAMILY'S OWN WALL (realized alone, no cutter):", ...ownCut.lines, "  the same on the trunk's loft (its nets, a ring every millimetre), as the bend run read it:", ...loftCut.lines, "");

    // 4. The band's span on the k = 1.5 course: per phase, the ring's point (the ray from the ring's centre in the course's first frame) and
    // the rail's (the boundary of 2b, then ARM_RAIL_MM along that phase's points on the skin); their distance, and the angle between the
    // reference skin's normals there (triangle winding, the nearest triangle's).
    const first: AutoMovieLoftFrame.IFrame = axis15.at(0);
    const flatRing: C.P[] = ringPoints.map((p: V): C.P => [dot(sub(p, centre), first.u as V), dot(sub(p, centre), first.v as V)]);
    const ringHits = cast([{ points: flatRing, closed: true }], (): boolean => true);
    const ringAt: (V | null)[] = ringHits.map((h, j: number): V | null => (Number.isFinite(h.t) ? add(centre, add(scale(first.u as V, h.t * Math.cos((2 * Math.PI * j) / RAYS)), scale(first.v as V, h.t * Math.sin((2 * Math.PI * j) / RAYS)))) : null));
    const railAt: { s: number; p: V | null }[] = rule.boundary.map((b: number, j: number): { s: number; p: V | null } => {
      let k: number = rule.stations.findIndex((s: number): boolean => s >= b);
      while (k < rule.stations.length && rule.points[k]![j] === null) ++k;
      let walked: number = 0;
      for (; k + 1 < rule.stations.length && walked < ARM_RAIL_MM; ++k) {
        const [p, q] = [rule.points[k]![j], rule.points[k + 1]![j]];
        if (p === null || q === null) continue;
        walked += norm(sub(q!, p!));
      }
      return k < rule.stations.length && walked >= ARM_RAIL_MM ? { s: rule.stations[k]!, p: rule.points[k]![j]! } : { s: NaN, p: null };
    });
    const normalAt = normalsOf(source.all);
    const span: number[] = ringAt.map((p: V | null, j: number): number => (p === null || railAt[j]!.p === null ? NaN : norm(sub(railAt[j]!.p!, p))));
    const angle: number[] = ringAt.map((p: V | null, j: number): number => (p === null || railAt[j]!.p === null ? NaN : degrees(Math.acos(Math.max(-1, Math.min(1, dot(normalAt(p), normalAt(railAt[j]!.p!))))))));
    const outward: number = railAt.filter((x): boolean => x.p !== null && dot(normalAt(x.p), sub(x.p, axis15.at(x.s).origin as V)) > 0).length;
    const read: number = railAt.filter((x): boolean => x.p !== null).length;
    lines.push(
      `4. THE BAND'S SPAN ON THE k ${TURN_K} COURSE with rails at the boundary of 2b plus ${ARM_RAIL_MM} mm along the skin: ${read} of ${RAYS} phases have a rail point, ${ringAt.filter((p): boolean => p !== null).length} a ring point; the skin's normals by the reference's winding (${outward} of ${read} rail normals point away from the course)`,
      "  the rail's station per 10 deg (mm along the course):",
      ...everyTen(railAt.map((x): number => x.s), 0).map((x: string): string => `    ${x}`),
      "  the band's length from the ring to the rail per 10 deg (mm, straight):",
      ...everyTen(span).map((x: string): string => `    ${x}`),
      "  the angle between the trunk skin's normal at the ring and the arm skin's normal at the rail per 10 deg:",
      ...everyTen(angle).map((x: string): string => `    ${x}`),
      "",
    );

    // 5. Frames.
    NodeCanvasRaster.initialize();
    const files: string[] = [];
    const render = async (file: string, camera: N.Camera, meshes: N.Mesh[], curves: N.Curve[], title: string): Promise<void> => {
      await fs.writeFile(path.join(out, file), NodeCanvasRaster.render(camera, meshes, curves, "depth", title).png);
      files.push(path.join(out, file));
    };
    const cutterRings: N.Curve[] = Array.from({ length: slit.length / 36 }, (_: unknown, i: number): N.Curve => ({ id: "cutter" + i, points: slit.slice(36 * i, 36 * i + 36), closed: true, xray: true, colour: "d08a1f" }));
    const figure: N.Mesh = cropMesh("generated", reference.generated, gh, 200);
    const foldMarks: N.Curve[] = marks(own.back.map((b): V => b.p), "e01b1b", "fold");
    for (const [view, camera] of [["armpit", facing("armpit", n, [0, 1, 0], meshPoints(figure), 900, 900)], ["front", NodeCanvasCamera.fit("front", meshPoints(figure), 900, 900)]] as [string, N.Camera][])
      await render(`rails.arm-folds.${view}.png`, camera, [figure], [...cutterRings, ...foldMarks], `f1 as generated near the shoulder | red: where the current arm's own wall steps back along its own course (${own.back.length}); orange: the axilla cutter's sections | ${view}`);
    const trunkView: N.Mesh = cropMesh("trunk", trunkWall, scale(ownCut.rayRing.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / ownCut.rayRing.length), 160);
    // Fitted to the ray ring: the plane's cut also crosses the trunk's lower wall far below the shoulder, which would shrink the ring.
    await render("rails.ring.trunk-wall.armpit.png", facing("armpit", n, [0, 1, 0], ownCut.rayRing, 900, 900), [trunkView], [{ id: "ray-ring", points: ownCut.rayRing, closed: true, xray: true, colour: "9a3fb5" }, ...ownCut.pieces.map((piece, i: number): N.Curve => ({ id: "cut" + i, points: piece.points, closed: piece.closed, xray: true, colour: "1f9d3a" })), ...cutterRings], "f1's trunk family's own wall, realized alone, seen from the armpit along the plane's normal | purple: the ray ring; green: the plane's real cut; orange: the axilla cutter");
    const shoulder: N.Mesh = cropMesh("reference", source.all, add(gh, scale(unit(sub(elbow, gh)), 60)), 200);
    const railPoints: V[] = railAt.map((x): V | null => x.p).filter((p: V | null): p is V => p !== null);
    const bands: N.Curve[] = Array.from({ length: 36 }, (_: unknown, b: number): N.Curve | null => {
      const j: number = b * (RAYS / 36);
      return ringAt[j] === null || railAt[j]!.p === null ? null : { id: "band" + b, points: [ringAt[j]!, railAt[j]!.p!], closed: false, xray: true, colour: "2f6fd0" };
    }).filter((c: N.Curve | null): c is N.Curve => c !== null);
    const railCurves: N.Curve[] = [{ id: "ring", points: ringPoints, closed: true, xray: true, colour: "9a3fb5" }, { id: "rail", points: railPoints, closed: true, xray: true, colour: "e01b1b" }, ...bands];
    for (const [view, camera] of [["armpit", facing("armpit", n, [0, 1, 0], meshPoints(shoulder), 900, 900)], ["back", NodeCanvasCamera.fit("back", meshPoints(shoulder), 900, 900)]] as [string, N.Camera][])
      await render(`rails.rails.${view}.reference.png`, camera, [shoulder], railCurves, `f1 reference | purple: the girdle ring; red: the arm's rail on the k ${TURN_K} course (the no-fold boundary + ${ARM_RAIL_MM} mm along the skin); blue: the band every 10 deg | ${view}`);
    lines.push("5. FRAMES:", ...files.map((file: string): string => `  ${file}`));
    await fs.writeFile(path.join(out, "rails.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** One ray's outermost crossing of pieces from their chart's origin at an angle: its distance, NaN where it meets none. */
  function rayHit(pieces: readonly IPiece[], phi: number): number {
    const d: C.P = [Math.cos(phi), Math.sin(phi)];
    let best: number = NaN;
    for (const { points, closed } of pieces)
      for (let i: number = 0; i < (closed ? points.length : points.length - 1); ++i) {
        const a: C.P = points[i]!;
        const e: C.P = [points[(i + 1) % points.length]![0] - a[0], points[(i + 1) % points.length]![1] - a[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (den === 0) continue;
        const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
        const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
        if (w >= 0 && w < 1 && t > 0 && !(t <= best)) best = t;
      }
    return best;
  }

  /** A mesh's surface normal at a point: the nearest triangle's (by centroid, through a grid of 10 mm cells), by the triangle's winding. */
  function normalsOf(mesh: M.IMesh): (p: V) => V {
    const corner = (t: number, c: number): V => {
      const v: number = mesh.indices[3 * t + c]!;
      return [mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!];
    };
    const centroid = (t: number): V => scale(add(add(corner(t, 0), corner(t, 1)), corner(t, 2)), 1 / 3);
    const cell = (p: V): string => p.map((x: number): number => Math.floor(x / 10)).join(",");
    const grid: Map<string, number[]> = new Map();
    for (let t: number = 0; t < mesh.indices.length / 3; ++t) {
      const key: string = cell(centroid(t));
      const list: number[] | undefined = grid.get(key);
      if (list === undefined) grid.set(key, [t]);
      else list.push(t);
    }
    return (p: V): V => {
      let best: { d: number; t: number } = { d: Infinity, t: -1 };
      const [x, y, z]: number[] = p.map((u: number): number => Math.floor(u / 10));
      for (let i: number = -1; i <= 1; ++i)
        for (let j: number = -1; j <= 1; ++j)
          for (let k: number = -1; k <= 1; ++k)
            for (const t of grid.get(`${x! + i},${y! + j},${z! + k}`) ?? []) {
              const d: number = norm(sub(centroid(t), p));
              if (d < best.d) best = { d, t };
            }
      return best.t < 0 ? [NaN, NaN, NaN] : unit(cross(sub(corner(best.t, 1), corner(best.t, 0)), sub(corner(best.t, 2), corner(best.t, 0))));
    };
  }

  /**
   * The trunk's chart (`trunkChart`) read back onto a wall: at a station the plane square to the chart's course, and in it the wall's
   * outermost crossing of the ray from the course along a phase; null where the ray meets none. `axis` is the chart's course point.
   */
  function lifter(wall: M.IMesh): { lift: (station: number, phase: number) => V | null; axis: (station: number) => V } {
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const pelvis: SF.IFrame = P.frame("pelvis");
    const floor: V = SF.toLocal(pelvis, trunk.centres[0]!) as V;
    const t: V = unit(sub(SF.toLocal(pelvis, trunk.centres[1]!) as V, floor));
    const u: V = perpendicular(SF.toLocalDirection(pelvis, trunk.up) as V, t);
    const v: V = cross(u, t);
    const [tw, uw, vw]: V[] = [t, u, v].map((d: V): V => SF.toWorldDirection(pelvis, d) as V);
    const axis = (station: number): V => SF.toWorld(pelvis, add(floor, scale(t, station))) as V;
    return {
      axis,
      lift: (station: number, phase: number): V | null => {
        const origin: V = axis(station);
        const pieces: IPiece[] = M.outline(wall, { origin, axes: [tw!, uw!, vw!] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): IPiece => ({ points: [...loop.points], closed: loop.closed }));
        const r: number = rayHit(pieces, phase);
        return Number.isFinite(r) ? add(origin, add(scale(uw!, r * Math.cos(phase)), scale(vw!, r * Math.sin(phase)))) : null;
      },
    };
  }

  /**
   * A closed loop resampled by arc length to `count` points from its highest point (largest y), turning counter-clockwise about `normal`,
   * so two loops' points pair by the share of their length from the top.
   */
  function resample(loop: readonly V[], count: number, normal: V): V[] {
    const middle: V = scale(loop.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / loop.length);
    const turning: number = loop.reduce((t: number, p: V, i: number): number => t + dot(cross(sub(p, middle), sub(loop[(i + 1) % loop.length]!, middle)), normal), 0);
    const ordered: V[] = turning >= 0 ? [...loop] : [...loop].reverse();
    const top: number = ordered.reduce((best: number, p: V, i: number): number => (p[1] > ordered[best]![1] ? i : best), 0);
    const ring: V[] = [...ordered.slice(top), ...ordered.slice(0, top)];
    const lengths: number[] = [0];
    for (let i: number = 0; i < ring.length; ++i) lengths.push(lengths[i]! + norm(sub(ring[(i + 1) % ring.length]!, ring[i]!)));
    const total: number = lengths.at(-1)!;
    let i: number = 0;
    return Array.from({ length: count }, (_: unknown, k: number): V => {
      const at: number = (total * k) / count;
      while (lengths[i + 1]! < at) ++i;
      const w: number = (at - lengths[i]!) / Math.max(1e-12, lengths[i + 1]! - lengths[i]!);
      return add(ring[i]!, scale(sub(ring[(i + 1) % ring.length]!, ring[i]!), w));
    });
  }

  /** How far apart two neighbouring rays' envelope points must stand in the trunk's chart to count as a bridge, mm: over three times the rays' spacing (0.6 mm at 70 mm). */
  const BRIDGE_MM: number = 2;

  /** The shoulder's pieces of the girdle plane's cut: within this distance of the girdle ring's centre, mm (the ring reaches about 90 mm from it; the plane's other crossing of the trunk lies by its foot, over 400 mm away). */
  const SHOULDER_PIECES_MM: number = 200;

  /**
   * The armscye's port loop by rule against today's (the supervisor's ruling on #3151, R3b, after k = 1.5 was kept). The rule loop: the girdle
   * plane's cut of the trunk family's own wall (realized alone: the port cuts the host's face, not the cutter's result) has a notch and an
   * island in the axillary pocket, so the loop is the cut's star-shaped envelope in the trunk's chart (station, and phase as mm at the
   * armpit's side distance), read by rays from the loop's centre in the chart, the outermost crossing per ray. Where neighbouring rays' points
   * jump across the pocket the envelope's bridge is the chart's straight line between them read back onto the skin (`lifter`), a curve on
   * the skin and not a chord through air, and the region inside it goes with the port. Measured against today's armRoot and armTurn course
   * and today's `armscye` loop: (1) the two courses; (2) the two loops on the skin and the region the envelope bridges; (3) with today's arm
   * family's ring at the ordinary margin (`ARM_RAIL_MM`), each port's band length and surface angle per 10 degrees; (4) frames.
   */
  async function port(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const gh: V = P.frame("humerus").origin as V;
    const elbow: V = P.frame("forearm").origin as V;
    const ringPoints: V[] = ring(source.all, girdle.frame).filter((h: V | null): h is V => h !== null);
    const centre: V = scale(ringPoints.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / ringPoints.length);
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const lines: string[] = ["R3b, the armscye's port loop by rule and the k 1.5 course against today's shoulder; measurement only", ""];
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "port-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });

    // 1. The k = 1.5 rule course against today's armRoot, armTurn course.
    let s15: number = TURN_K * r;
    for (let i: number = 0; i < 100; ++i) {
      const next: number = TURN_K * r * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s15)), elbow])[0]!);
      if (Math.abs(next - s15) < 1e-9) break;
      s15 = next;
    }
    const frames: P.IFrames = P.frames();
    const centres15: V[] = [centre, add(centre, scale(n, s15 + 1e-6)), ...T_COURSE_AFTER.map((name: string): V => SF.toWorld(frames.get(PLACED[name]!.frame)!, PLACED[name]!.local) as V)];
    const halves15: number[] = [TURN_K * r, ...arm.halves.slice(1)];
    const axis15: IAxis = H.axis({ centres: centres15, halves: halves15, up: P.direction("arm.up", frames) as V });
    const armAxis: IAxis = H.axis(arm);
    const s0: number = arm.knots[0]!;
    const nearestTo = (axis: IAxis, from: number, p: V): number => {
      let best: number = from;
      for (let s: number = from; s < from + 800; s += 0.5) if (norm(sub(axis.at(s).origin as V, p)) < norm(sub(axis.at(best).origin as V, p))) best = s;
      return best;
    };
    const ruleElbow: number = nearestTo(axis15, 0, elbow);
    const todayElbow: number = nearestTo(armAxis, s0, elbow);
    const todayPath: V[] = [];
    for (let s: number = s0; s <= todayElbow + 20; s += 0.5) todayPath.push(armAxis.at(s).origin as V);
    const toToday = (p: V): number => {
      let best: number = Infinity;
      for (let i: number = 0; i + 1 < todayPath.length; ++i) {
        const [a, b]: V[] = [todayPath[i]!, todayPath[i + 1]!];
        const e: V = sub(b!, a!);
        const w: number = Math.max(0, Math.min(1, dot(sub(p, a!), e) / Math.max(1e-12, dot(e, e))));
        best = Math.min(best, norm(sub(p, add(a!, scale(e, w)))));
      }
      return best;
    };
    let agree: number = 0;
    for (let s: number = ruleElbow; s >= 0; s -= 1)
      if (toToday(axis15.at(s).origin as V) >= 1) {
        agree = s + 1;
        break;
      }
    const names: string[] = ["the corner", "the elbow", "the wrist", "the middle finger's first joint"];
    const ruleAngles: number[] = AutoMovieHumanConicPose.angles(centres15);
    const todayAngles: number[] = AutoMovieHumanConicPose.angles(arm.centres.map((c): V => [c[0], c[1], c[2]]));
    lines.push(
      `1. THE k ${TURN_K} RULE COURSE (the ring's centre, the set-back corner ${s15.toFixed(2)} mm along the ring's normal, today's later centres) AGAINST TODAY'S (armRoot, armTurn, its own halves), stations from each course's start to its elbow (the rule's ${ruleElbow.toFixed(1)} mm, today's ${todayElbow.toFixed(1)} mm from its first knot at ${s0.toFixed(1)}):`,
      `  turns, the rule's: ${halves15.map((h: number, k: number): string => `${names[k]} ${degrees(ruleAngles[k]!).toFixed(1)} deg, half ${h.toFixed(1)} mm`).join("; ")}`,
      `  turns, today's: ${arm.halves.map((h: number, k: number): string => `${k === 0 ? "armTurn" : names[k]} ${degrees(todayAngles[k]!).toFixed(1)} deg, half ${h.toFixed(1)} mm`).join("; ")}`,
      `  the rule course's distance from today's every 10 mm of its station: ${Array.from({ length: Math.floor(ruleElbow / 10) + 1 }, (_: unknown, k: number): string => `${k * 10} ${toToday(axis15.at(k * 10).origin as V).toFixed(1)}`).join(", ")} (mm)`,
      `  the two agree within 1 mm from the rule's station ${agree.toFixed(0)} mm to the elbow`,
      "",
    );
    progress("1. the courses");

    // 2. The rule port loop (the chart envelope of the girdle plane's cut of the trunk family's own wall) against today's armscye loop.
    const trunkWall: M.IMesh = alone(AutoMovieHumanF1.BODY.trunk.name);
    const armWall: M.IMesh = alone(arm.name);
    progress("realized the trunk's and the arm's own walls");
    const chart = trunkChart();
    const armpitV: number = chart(P.point("armpit") as V).v;
    const toQ = (p: V): C.P => {
      const c = chart(p);
      return [c.station, armpitV * Math.atan2(c.v, c.u)];
    };
    const { lift, axis: trunkAxis } = lifter(trunkWall);
    const frame: AutoMovieLoftFrame.IFrame = girdle.frame;
    const planeOrigin: V = [...frame.origin] as V;
    const planeWorld = (p: C.P): V => add(planeOrigin, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1])));
    const cutPieces: { world: V[]; closed: boolean }[] = M.outline(trunkWall, { origin: planeOrigin, axes: [cross(frame.v as V, frame.u as V), [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!
      .loops.map((loop: M.ILoop): { world: V[]; closed: boolean } => ({ world: loop.points.map(planeWorld), closed: loop.closed }))
      .filter((piece: { world: V[]; closed: boolean }): boolean => piece.world.some((p: V): boolean => norm(sub(p, centre)) < SHOULDER_PIECES_MM));
    const charted: IPiece[] = cutPieces.map((piece): IPiece => ({ points: piece.world.map(toQ), closed: piece.closed }));
    const main: number = charted.reduce((best: number, piece: IPiece, k: number): number => (piece.closed && (best < 0 || area(piece.points) > area(charted[best]!.points)) ? k : best), -1);
    const qc: C.P = [charted[main]!.points.reduce((t: number, q: C.P): number => t + q[0], 0) / charted[main]!.points.length, charted[main]!.points.reduce((t: number, q: C.P): number => t + q[1], 0) / charted[main]!.points.length];
    const shifted: IPiece[] = charted.map((piece: IPiece): IPiece => ({ points: piece.points.map((q: C.P): C.P => [q[0] - qc[0], q[1] - qc[1]]), closed: piece.closed }));
    const owners: { piece: number; i: number }[] = shifted.flatMap((piece: IPiece, k: number): { piece: number; i: number }[] => Array.from({ length: piece.closed ? piece.points.length : piece.points.length - 1 }, (_: unknown, i: number): { piece: number; i: number } => ({ piece: k, i })));
    // A ray's hit on chart pieces read back to the world along the hit segment's own world points.
    const onSegment = (pieces: readonly IPiece[], worlds: readonly (readonly (V | null)[])[], hit: { t: number; segment: number }, j: number, table: readonly { piece: number; i: number }[]): { q: C.P; p: V | null } => {
      const h: C.P = [hit.t * Math.cos((2 * Math.PI * j) / RAYS), hit.t * Math.sin((2 * Math.PI * j) / RAYS)];
      const { piece, i } = table[hit.segment]!;
      const points: C.P[] = pieces[piece]!.points;
      const [a, b]: C.P[] = [points[i]!, points[(i + 1) % points.length]!];
      const w: number = ((h[0] - a![0]) * (b![0] - a![0]) + (h[1] - a![1]) * (b![1] - a![1])) / Math.max(1e-12, (b![0] - a![0]) ** 2 + (b![1] - a![1]) ** 2);
      const [pa, pb] = [worlds[piece]![i]!, worlds[piece]![(i + 1) % points.length]!];
      return { q: [h[0] + qc[0], h[1] + qc[1]], p: pa === null || pb === null ? null : add(pa, scale(sub(pb, pa), w)) };
    };
    const envelope: { q: C.P; p: V | null }[] = cast(shifted, (): boolean => true).map((hit, j: number): { q: C.P; p: V | null } => (Number.isFinite(hit.t) ? onSegment(shifted, cutPieces.map((piece): V[] => piece.world), hit, j, owners) : { q: [NaN, NaN], p: null }));
    // The bridges: neighbouring rays whose points jump across the pocket, each read back onto the skin along the chart's straight line.
    const bridges: { from: number; gap: number; chord: number; skin: number; sag: number; points: V[] }[] = [];
    envelope.forEach((a, j: number): void => {
      const b = envelope[(j + 1) % RAYS]!;
      const gap: number = Math.hypot(b.q[0] - a.q[0], b.q[1] - a.q[1]);
      if (!(gap > BRIDGE_MM) || a.p === null || b.p === null) return;
      const count: number = Math.ceil(gap);
      const inner: V[] = Array.from({ length: count - 1 }, (_: unknown, k: number): V | null => {
        const q: C.P = [a.q[0] + ((b.q[0] - a.q[0]) * (k + 1)) / count, a.q[1] + ((b.q[1] - a.q[1]) * (k + 1)) / count];
        return lift(q[0], q[1] / armpitV);
      }).filter((p: V | null): p is V => p !== null);
      const path: V[] = [a.p, ...inner, b.p];
      const chord: V = sub(b.p, a.p);
      bridges.push({ from: j, gap, chord: norm(chord), skin: path.reduce((t: number, p: V, k: number): number => (k === 0 ? t : t + norm(sub(p, path[k - 1]!))), 0), sag: Math.max(0, ...inner.map((p: V): number => norm(sub(sub(p, a.p!), scale(unit(chord), dot(sub(p, a.p!), unit(chord))))))), points: path });
    });
    const ruleLoop: V[] = envelope.flatMap((x, j: number): V[] => {
      const bridge = bridges.find((b): boolean => b.from === j);
      return x.p === null ? [] : bridge === undefined ? [x.p] : bridge.points.slice(0, -1);
    });
    const envelopeChart: C.P[] = envelope.filter((x): boolean => Number.isFinite(x.q[0])).map((x): C.P => x.q);
    // The other closed pieces (the island) and how many of their points the envelope encloses, by the crossing count in the chart.
    const enclosed = (q: C.P): boolean => {
      let inside: boolean = false;
      for (let i: number = 0, k: number = envelopeChart.length - 1; i < envelopeChart.length; k = i++) {
        const [a, b]: C.P[] = [envelopeChart[i]!, envelopeChart[k]!];
        if ((a![1] > q[1]) !== (b![1] > q[1]) && q[0] < ((b![0] - a![0]) * (q[1] - a![1])) / (b![1] - a![1]) + a![0]) inside = !inside;
      }
      return inside;
    };
    const islands: string = charted
      .map((piece: IPiece, k: number): string => (piece.closed && k !== main ? `piece ${k}, ${area(piece.points).toFixed(0)} sq mm, ${piece.points.filter(enclosed).length} of its ${piece.points.length} points inside the envelope` : ""))
      .filter((x: string): boolean => x !== "")
      .join("; ");

    // Today's loop: its ILoop in the trunk's chart, its shares read at 720 clocks, each point read back onto the trunk's own wall.
    const today = AutoMovieHumanF1.armscye(1);
    const shape: number[] = today.shape === undefined ? [1] : [...today.shape];
    const todayQ: C.P[] = Array.from({ length: RAYS }, (_: unknown, k: number): C.P => {
      const clock: number = (2 * Math.PI * k) / RAYS;
      const x: number = (shape.length * k) / RAYS;
      const share: number = shape[Math.floor(x) % shape.length]! + (shape[(Math.floor(x) + 1) % shape.length]! - shape[Math.floor(x) % shape.length]!) * (x - Math.floor(x));
      return [1000 * (today.centre[0] + share * today.semi[0] * Math.cos(clock)), armpitV * (today.centre[1] + (share * today.semi[1] * Math.sin(clock)) / today.sense)];
    });
    const todayP: (V | null)[] = todayQ.map((q: C.P): V | null => lift(q[0], q[1] / armpitV));
    progress(`read today's loop onto the trunk's wall: ${todayP.filter((p): boolean => p !== null).length} of ${RAYS} points`);
    const todayShifted: IPiece[] = [{ points: todayQ.map((q: C.P): C.P => [q[0] - qc[0], q[1] - qc[1]]), closed: true }];
    const todayTable: { piece: number; i: number }[] = todayQ.map((_: C.P, i: number): { piece: number; i: number } => ({ piece: 0, i }));
    const todayOnRays: { q: C.P; p: V | null }[] = cast(todayShifted, (): boolean => true).map((hit, j: number): { q: C.P; p: V | null } => (Number.isFinite(hit.t) ? onSegment(todayShifted, [todayP], hit, j, todayTable) : { q: [NaN, NaN], p: null }));
    const apart: number[] = envelope.map((x, j: number): number => (x.p === null || todayOnRays[j]!.p === null ? NaN : norm(sub(x.p, todayOnRays[j]!.p!))));
    const chartApart: number[] = envelope.map((x, j: number): number => Math.hypot(x.q[0] - todayOnRays[j]!.q[0], x.q[1] - todayOnRays[j]!.q[1]));
    lines.push(
      `2. THE RULE PORT LOOP (the star-shaped envelope, in the trunk's chart, of the girdle plane's cut of the trunk family's own wall; phase as mm at the armpit's side distance ${armpitV.toFixed(1)} mm) AGAINST TODAY'S armscye LOOP, both on the trunk's own wall:`,
      `  the cut near the shoulder: ${charted.length} pieces (${charted.map((piece: IPiece): string => `${piece.closed ? "closed" : "open"}, ${area(piece.points).toFixed(0)} sq mm in the chart`).join("; ")}); the envelope's centre in the chart: station ${qc[0].toFixed(1)}, ${qc[1].toFixed(1)} mm of phase`,
      `  the envelope encloses ${area(envelopeChart).toFixed(0)} sq mm in the chart against the main loop's ${area(charted[main]!.points).toFixed(0)}: it bridges ${(area(envelopeChart) - area(charted[main]!.points)).toFixed(0)} sq mm of the pocket; the other closed pieces: ${islands === "" ? "none" : islands}`,
      `  ${bridges.length} bridges (neighbouring rays over ${BRIDGE_MM} mm apart in the chart):`,
      ...bridges.map((b): string => `    from ray ${b.from} (${((360 * b.from) / RAYS).toFixed(1)} deg about the centre): ${b.gap.toFixed(1)} mm in the chart; on the skin ${b.skin.toFixed(1)} mm against a chord through the air of ${b.chord.toFixed(1)} mm, standing up to ${b.sag.toFixed(1)} mm off that chord; starting at ${where3(envelope[b.from]!.p!)}`),
      "  the two loops' distance on the skin, ray by ray from the envelope's centre in the chart, per 10 deg (mm):",
      ...everyTen(apart).map((x: string): string => `    ${x}`),
      "  the same in the chart (mm):",
      ...everyTen(chartApart).map((x: string): string => `    ${x}`),
      "",
    );
    progress("2. the loops");

    // 3. The bands: each loop to today's arm family's ring at the ordinary margin, paired by the share of their lengths from their tops.
    const loft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined, reliefs: undefined }, [s0, s0 + ARM_RAIL_MM, s0 + 2 * ARM_RAIL_MM]);
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const railRead = AutoMovieLoftChain.sampler(loft.chain, s0 + ARM_RAIL_MM);
    const rail: V[] = resample(Array.from({ length: RAYS }, (_: unknown, j: number): V => railRead((2 * Math.PI * j) / RAYS) as V), RAYS, n);
    const trunkNormal = normalsOf(trunkWall);
    const armNormal = normalsOf(armWall);
    const railCentre: V = armAxis.at(s0 + ARM_RAIL_MM).origin as V;
    const outwardArm: number = rail.filter((p: V): boolean => dot(armNormal(p), sub(p, railCentre)) > 0).length;
    const band = (loop: V[]): { span: number[]; angle: number[]; outward: number; at: V[] } => {
      const at: V[] = resample(loop, RAYS, n);
      return {
        at,
        span: at.map((p: V, k: number): number => norm(sub(rail[k]!, p))),
        angle: at.map((p: V, k: number): number => degrees(Math.acos(Math.max(-1, Math.min(1, dot(trunkNormal(p), armNormal(rail[k]!))))))),
        outward: at.filter((p: V): boolean => {
          const station: number = chart(p).station;
          return dot(trunkNormal(p), sub(p, trunkAxis(station))) > 0;
        }).length,
      };
    };
    const todayBand = band(todayP.filter((p: V | null): p is V => p !== null));
    const ruleBand = band(ruleLoop);
    const bin = (values: number[], b: number): number[] => values.slice((b * RAYS) / 36, ((b + 1) * RAYS) / 36);
    const worse: string[] = [];
    lines.push(
      `3. THE BANDS to today's arm ring at the ordinary margin (${ARM_RAIL_MM} mm past the arm's first knot), each loop and the ring paired by the share of their lengths from their highest points, both turning the same way about the girdle's normal; normals by each wall's winding (outward: the ring's ${outwardArm} of ${RAYS} from the arm's course, today's loop's ${todayBand.outward} and the rule's ${ruleBand.outward} of ${RAYS} from the trunk chart's course):`,
      "  per 10 deg of the share from the top: band length today | rule (mm); surface angle today | rule (deg)",
      ...Array.from({ length: 36 }, (_: unknown, b: number): string => {
        const range = (values: number[]): string => `${Math.min(...values).toFixed(1)}..${Math.max(...values).toFixed(1)}`;
        const more: number = Math.max(...bin(ruleBand.angle, b)) - Math.max(...bin(todayBand.angle, b));
        if (more > 0) worse.push(`${b * 10}..${b * 10 + 10} deg by ${more.toFixed(1)} deg`);
        return `    ${b * 10}..${b * 10 + 10} deg: ${range(bin(todayBand.span, b))} | ${range(bin(ruleBand.span, b))} mm; ${range(bin(todayBand.angle, b))} | ${range(bin(ruleBand.angle, b))} deg${more > 0 ? `; the rule's greatest angle ${more.toFixed(1)} deg more` : ""}`;
      }),
      `  where the rule's greatest angle is more than today's: ${worse.length === 0 ? "nowhere" : worse.join("; ")}`,
      "",
    );
    progress("3. the bands");

    // 4. Frames.
    NodeCanvasRaster.initialize();
    const files: string[] = [];
    const figure: N.Mesh = cropMesh("generated", skinsOf(await realizedSkin(root, "reference", progress), source.all, "reference").generated, gh, 200);
    const loops: N.Curve[] = [
      { id: "rule", points: ruleLoop, closed: true, xray: true, colour: "e01b1b" },
      { id: "today", points: todayP.filter((p: V | null): p is V => p !== null), closed: true, xray: true, colour: "2f6fd0" },
    ];
    const armpitView: N.Camera = facing("armpit", n, [0, 1, 0], meshPoints(figure), 900, 900);
    for (const [view, camera] of [["armpit", armpitView], ["front", NodeCanvasCamera.fit("front", meshPoints(figure), 900, 900)], ["back", NodeCanvasCamera.fit("back", meshPoints(figure), 900, 900)]] as [string, N.Camera][]) {
      const file: string = path.join(out, `port.loops.${view}.png`);
      await fs.writeFile(file, NodeCanvasRaster.render(camera, [figure], loops, "depth", `f1 as generated | red: the rule's port loop (the chart envelope of the girdle plane's cut); blue: today's armscye loop | ${view}`).png);
      files.push(file);
    }
    const strokes = (at: V[], colour: string, id: string): N.Curve[] => Array.from({ length: 36 }, (_: unknown, b: number): N.Curve => ({ id: id + b, points: [at[(b * RAYS) / 36]!, rail[(b * RAYS) / 36]!], closed: false, xray: true, colour }));
    const bandFile: string = path.join(out, "port.bands.armpit.png");
    await fs.writeFile(bandFile, NodeCanvasRaster.render(armpitView, [figure], [...loops, { id: "rail", points: rail, closed: true, xray: true, colour: "202020" }, ...strokes(todayBand.at, "2f6fd0", "today"), ...strokes(ruleBand.at, "e01b1b", "rule")], "depth", `f1 as generated | the bands every 10 deg to today's arm ring at ${ARM_RAIL_MM} mm (black): blue today's, red the rule's | armpit`).png);
    files.push(bandFile);
    lines.push("4. FRAMES:", ...files.map((file: string): string => `  ${file}`));
    await fs.writeFile(path.join(out, "port.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** Where a point stands in the trunk's chart and against the axillary fold's line, for a report. */
  function where3(p: V): string {
    const c = trunkChart()(p);
    const fold: V[] = AutoMovieHumanF1.CUTTERS[0]!.family.centres.map((q): V => [q[0], q[1], q[2]]);
    let distance: number = Infinity;
    for (let i: number = 0; i + 1 < fold.length; ++i) {
      const e: V = sub(fold[i + 1]!, fold[i]!);
      const w: number = Math.max(0, Math.min(1, dot(sub(p, fold[i]!), e) / dot(e, e)));
      distance = Math.min(distance, norm(sub(p, add(fold[i]!, scale(e, w)))));
    }
    return `trunk station ${c.station.toFixed(1)}, phase ${degrees(Math.atan2(c.v, c.u)).toFixed(1)} deg, ${distance.toFixed(1)} mm from the fold's line`;
  }

  /** A closed loop's area centroid in its chart. */
  function areaCentroid(points: readonly C.P[]): C.P {
    let [a, x, y]: number[] = [0, 0, 0];
    for (let i: number = 0; i < points.length; ++i) {
      const [p, q]: C.P[] = [points[i]!, points[(i + 1) % points.length]!];
      const c: number = p![0] * q![1] - q![0] * p![1];
      a = a! + c;
      x = x! + (p![0] + q![0]) * c;
      y = y! + (p![1] + q![1]) * c;
    }
    return [x! / (3 * a!), y! / (3 * a!)];
  }

  /**
   * The ring's centre by rule (the supervisor's ruling on #3151, R3b): the area centroid of the largest closed loop of the trunk family's own
   * wall (its loft with its nets, `trunkMesh`) cut by the girdle plane, against the reference skin's ray ring centroid the earlier runs used,
   * and the k = 1.5 corner and turn each gives.
   */
  async function centreRule(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const girdle = plane(0, 0);
    const n: V = girdle.normal;
    const elbow: V = P.frame("forearm").origin as V;
    const frame: AutoMovieLoftFrame.IFrame = girdle.frame;
    const origin: V = [...frame.origin] as V;
    const pieces: IPiece[] = M.outline(trunkMesh(), { origin, axes: [cross(frame.v as V, frame.u as V), [...frame.u] as V, [...frame.v] as V] }, [0], 0, 0.5, 0)[0]!.loops.map((loop: M.ILoop): IPiece => ({ points: [...loop.points], closed: loop.closed }));
    const loop: IPiece = pieces.filter((piece: IPiece): boolean => piece.closed).sort((a: IPiece, b: IPiece): number => area(b.points) - area(a.points))[0]!;
    const c: C.P = areaCentroid(loop.points);
    const byRule: V = add(origin, add(scale(frame.u as V, c[0]), scale(frame.v as V, c[1])));
    const rays: V[] = ring(source.all, frame).filter((h: V | null): h is V => h !== null);
    const byRays: V = scale(rays.reduce((t: V, p: V): V => add(t, p), [0, 0, 0]), 1 / rays.length);
    const corner = (centre: V): { s: number; corner: V; turn: number } => {
      let s: number = TURN_K * r;
      for (let i: number = 0; i < 100; ++i) {
        const next: number = TURN_K * r * AutoMovieHumanConicPose.share(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s)), elbow])[0]!);
        if (Math.abs(next - s) < 1e-9) break;
        s = next;
      }
      return { s, corner: add(centre, scale(n, s)), turn: degrees(AutoMovieHumanConicPose.angles([centre, add(centre, scale(n, s)), elbow])[0]!) };
    };
    const [a, b] = [corner(byRays), corner(byRule)];
    const lines: string[] = [
      `the ring's centre by rule (the area centroid of the trunk wall's girdle cut, ${pieces.length} pieces, the largest closed loop ${area(loop.points).toFixed(0)} sq mm): ${fixed(byRule, 2)}`,
      `the reference ray ring's centroid: ${fixed(byRays, 2)}; apart ${norm(sub(byRule, byRays)).toFixed(2)} mm`,
      `the k ${TURN_K} corner from the reference centroid: s ${a.s.toFixed(2)} mm, ${fixed(a.corner, 2)}, turn ${a.turn.toFixed(2)} deg`,
      `the k ${TURN_K} corner from the rule's centre: s ${b.s.toFixed(2)} mm, ${fixed(b.corner, 2)}, turn ${b.turn.toFixed(2)} deg`,
      `the corner moves ${norm(sub(b.corner, a.corner)).toFixed(2)} mm and the turn ${(b.turn - a.turn).toFixed(2)} deg`,
    ];
    process.stdout.write(lines.join("\n") + "\n");
  }

  /**
   * The accepted armscye plane's tilt about the thorax's anterior-posterior axis, degrees, negative leaning its top out over the shoulder:
   * the least-error plane over ASTM D5219's four armscye points (the shoulder point, the front and back break points, the armpit), whose cut
   * of the trunk's own wall passed the acromion and the two axillary fold points of f1 at 7.88, 4.03 and 6.54 mm, root-mean-square 6.35 mm
   * (`tiltfit`, run 2026-11-15T03-44-18; the supervisor accepted it on #3151).
   */
  const SEAM_TILT_DEG: number = -13.594;

  /** The accepted armscye plane's offset from GH along its normal, mm, out toward the arm: the second number of `SEAM_TILT_DEG`'s fit. */
  const SEAM_OFFSET_MM: number = 30;

  /**
   * The accepted armscye plane at the reference pose, fixed in the thorax: its normal the thorax's lateral axis turned toward the thorax's
   * up by `SEAM_TILT_DEG`, its point GH moved `SEAM_OFFSET_MM` along it, charted by `u` (the thorax's up squared to it) and `v = n x u`.
   */
  function seamPlane(): { point: V; normal: V; u: V; v: V } {
    const thorax: SF.IFrame = P.frame("thorax");
    const tilt: number = (SEAM_TILT_DEG * Math.PI) / 180;
    const normal: V = unit(add(scale(thorax.axes[2] as V, Math.cos(tilt)), scale(thorax.axes[1] as V, Math.sin(tilt))));
    const u: V = perpendicular(thorax.axes[1] as V, normal);
    return { point: add(P.frame("humerus").origin as V, scale(normal, SEAM_OFFSET_MM)), normal, u, v: cross(normal, u) };
  }

  /**
   * A family's four guide lines, its `+u`, `+v`, `-u` and `-v` extremes in its own chart (the engine's view outlines: front positive, side
   * positive, front negative, side negative; `AutoMovieHumanConicLoft.part`), as world points every `step` mm from `from` to `to`.
   */
  function guideLines(family: H.IFamily, from: number, to: number, step: number): V[][] {
    const read: (s: number) => number[] = H.reader(family);
    const axis: IAxis = H.axis(family);
    const lines: V[][] = [[], [], [], []];
    for (let s: number = from; s <= to + 1e-9; s += step) {
      const chain: AutoMovieHumanConicSection.IChain = AutoMovieHumanConicSection.resolve(read(s), family.layout);
      const frame: AutoMovieLoftFrame.IFrame = axis.at(s);
      chain.guides.forEach((g: number, q: number): void => {
        const p = chain.input.points[g]!;
        lines[q]!.push(add(frame.origin as V, add(scale(frame.u as V, p[0]), scale(frame.v as V, p[1]))));
      });
    }
    return lines;
  }

  /** Where a line leaves from its course point, by the world axis it runs farthest along: front, back, up, down, or toward either side. */
  function heading(d: V): string {
    const k: number = [0, 1, 2].reduce((best: number, c: number): number => (Math.abs(d[c]!) > Math.abs(d[best]!) ? c : best), 0);
    return [["front", "back"], ["up", "down"], ["+Z side", "-Z side"]][k]![d[k]! >= 0 ? 0 : 1]!;
  }

  /** Runs of flagged rays as phase ranges in degrees. */
  function phaseRanges(flags: readonly boolean[]): string {
    const out: string[] = [];
    let start: number = -1;
    for (let j: number = 0; j <= flags.length; ++j) {
      const on: boolean = j < flags.length && flags[j]!;
      if (on && start < 0) start = j;
      if (!on && start >= 0) {
        out.push(`${((360 * start) / flags.length).toFixed(1)}..${((360 * (j - 1)) / flags.length).toFixed(1)}`);
        start = -1;
      }
    }
    return out.length === 0 ? "none" : out.join(", ") + " deg";
  }

  /** Whether a point lies inside a closed polygon, by the crossing count. */
  function enclosedBy(q: C.P, polygon: readonly C.P[]): boolean {
    let inside: boolean = false;
    for (let i: number = 0, k: number = polygon.length - 1; i < polygon.length; k = i++) {
      const [a, b]: C.P[] = [polygon[i]!, polygon[k]!];
      if ((a![1] > q[1]) !== (b![1] > q[1]) && q[0] < ((b![0] - a![0]) * (q[1] - a![1])) / (b![1] - a![1]) + a![0]) inside = !inside;
    }
    return inside;
  }

  /**
   * The seam by rule with the arm as stored (the supervisor's survey on #3151, after construction.md's Repair, Ports and Recesses: the
   * region's fix stays on the seam; the arm keeps its family, its armRoot and armTurn course, its halves and its ordinary rail; the slit's
   * cutter stays as its recess). The rule loop is the accepted plane's (`seamPlane`) cut of the trunk family's own wall (its loft with its
   * nets, `trunkMesh`), the largest closed loop, as its star envelope in the trunk's chart (station, and phase as mm at the armpit's side
   * distance) about the loop's area centroid; today's is `AutoMovieHumanF1.armscye`. Both are read onto the trunk's own wall. Measured:
   * (a) the lines at the joint, the trunk's and the arm's guide lines (their view outlines) against both loops; (b) the arm's field past the
   * rule loop at every phase of the arm; (c) the band from each loop to today's arm ring at its ordinary rail, length and surface angle; (d)
   * the band's surface against the slit cutter's volume. The bands are read as ruled surfaces between paired points, not as the engine's
   * strip, so (c) and (d) say where the band must go, not how the engine draws it. Frames over f1 as generated, both sides.
   */
  async function seam(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "seam-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const { point, normal: n, u: pu, v: pv } = seamPlane();
    const gh: V = P.frame("humerus").origin as V;
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const s0: number = arm.knots[0]!;
    const armAxis: IAxis = H.axis(arm);
    const side = (p: V): number => dot(sub(p, point), n);
    const inPlane = (p: V): C.P => [dot(sub(p, point), pu), dot(sub(p, point), pv)];
    const lines: string[] = [`The seam by rule with the arm as stored (#3151): measurement only; nothing fitted, emitted or edited. The plane: tilt ${SEAM_TILT_DEG} deg, offset ${SEAM_OFFSET_MM} mm from GH, normal ${fixed(n, 4)}, point ${fixed(point, 2)}`, ""];

    // The rule loop: the plane's cut of the trunk's own wall, its largest closed loop, as its star envelope in the trunk's chart.
    const wall: M.IMesh = trunkMesh();
    const { lift, axis: trunkAxis } = lifter(wall);
    const chart = trunkChart();
    const armpitV: number = chart(P.point("armpit") as V).v;
    const toQ = (p: V): C.P => {
      const c = chart(p);
      return [c.station, armpitV * Math.atan2(c.v, c.u)];
    };
    const cut: M.ILoop[] = M.outline(wall, { origin: point, axes: [cross(pv, pu), pu, pv] }, [0], 0, 0.5, 0)[0]!.loops;
    const closed: M.ILoop[] = cut.filter((loop: M.ILoop): boolean => loop.closed).sort((a: M.ILoop, b: M.ILoop): number => area([...b.points]) - area([...a.points]));
    if (closed.length === 0) throw new Error("the plane cuts no closed loop of the trunk's wall");
    const ringPlane: C.P[] = [...closed[0]!.points];
    const ringWorld: V[] = ringPlane.map((q: C.P): V => add(point, add(scale(pu, q[0]), scale(pv, q[1]))));
    const ringQ: C.P[] = ringWorld.map(toQ);
    const qc: C.P = areaCentroid(ringQ);
    const shifted: IPiece = { points: ringQ.map((q: C.P): C.P => [q[0] - qc[0], q[1] - qc[1]]), closed: true };
    const meetings = (piece: IPiece, phi: number): number => {
      const d: C.P = [Math.cos(phi), Math.sin(phi)];
      let count: number = 0;
      for (let i: number = 0; i < piece.points.length; ++i) {
        const a: C.P = piece.points[i]!;
        const b: C.P = piece.points[(i + 1) % piece.points.length]!;
        const e: C.P = [b[0] - a[0], b[1] - a[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (den === 0) continue;
        const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
        const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
        if (w >= 0 && w < 1 && t > 0) ++count;
      }
      return count;
    };
    const notStar: boolean[] = Array.from({ length: RAYS }, (_: unknown, j: number): boolean => meetings(shifted, (2 * Math.PI * j) / RAYS) > 1);
    const hits = cast([shifted], (): boolean => true);
    const missed: number = hits.filter((hit): boolean => hit.segment < 0).length;
    const envelope: { q: C.P; p: V }[] = hits.flatMap((hit, j: number): { q: C.P; p: V }[] => {
      if (hit.segment < 0) return [];
      const h: C.P = [hit.t * Math.cos((2 * Math.PI * j) / RAYS), hit.t * Math.sin((2 * Math.PI * j) / RAYS)];
      const i: number = hit.segment;
      const [a, b]: C.P[] = [shifted.points[i]!, shifted.points[(i + 1) % shifted.points.length]!];
      const w: number = ((h[0] - a![0]) * (b![0] - a![0]) + (h[1] - a![1]) * (b![1] - a![1])) / Math.max(1e-12, (b![0] - a![0]) ** 2 + (b![1] - a![1]) ** 2);
      const [pa, pb]: V[] = [ringWorld[i]!, ringWorld[(i + 1) % ringWorld.length]!];
      return [{ q: [h[0] + qc[0], h[1] + qc[1]], p: add(pa!, scale(sub(pb!, pa!), w)) }];
    });
    // Where neighbouring rays' points jump across a hollow, the envelope's bridge is the chart's straight line read back onto the wall.
    const bridges: { from: number; gap: number }[] = [];
    const ruleLoop: V[] = envelope.flatMap((a, j: number): V[] => {
      const b = envelope[(j + 1) % envelope.length]!;
      const gap: number = Math.hypot(b.q[0] - a.q[0], b.q[1] - a.q[1]);
      if (!(gap > BRIDGE_MM)) return [a.p];
      bridges.push({ from: j, gap });
      const count: number = Math.ceil(gap);
      const inner: V[] = Array.from({ length: count - 1 }, (_: unknown, k: number): V | null => lift(a.q[0] + ((b.q[0] - a.q[0]) * (k + 1)) / count, (a.q[1] + ((b.q[1] - a.q[1]) * (k + 1)) / count) / armpitV)).filter((p: V | null): p is V => p !== null);
      return [a.p, ...inner];
    });
    const ruleQ: C.P[] = envelope.map((x): C.P => x.q);

    // Today's loop: its ILoop in the trunk's chart, its shares read at every ray's clock, each point read back onto the trunk's own wall.
    const today = AutoMovieHumanF1.armscye(1);
    const shape: number[] = today.shape === undefined ? [1] : [...today.shape];
    const todayQ: C.P[] = Array.from({ length: RAYS }, (_: unknown, k: number): C.P => {
      const clock: number = (2 * Math.PI * k) / RAYS;
      const x: number = (shape.length * k) / RAYS;
      const share: number = shape[Math.floor(x) % shape.length]! + (shape[(Math.floor(x) + 1) % shape.length]! - shape[Math.floor(x) % shape.length]!) * (x - Math.floor(x));
      return [1000 * (today.centre[0] + share * today.semi[0] * Math.cos(clock)), armpitV * (today.centre[1] + (share * today.semi[1] * Math.sin(clock)) / today.sense)];
    });
    const todayLoop: V[] = todayQ.map((q: C.P): V | null => lift(q[0], q[1] / armpitV)).filter((p: V | null): p is V => p !== null);
    progress(`the loops: the rule's ${ruleLoop.length} points, today's ${todayLoop.length} of ${RAYS} read onto the trunk's wall`);
    lines.push(
      "THE LOOPS:",
      `  the plane's cut of the trunk's own wall: ${cut.length} pieces (${cut.map((loop: M.ILoop): string => `${loop.closed ? "closed" : "open"} ${area([...loop.points]).toFixed(0)} sq mm`).join("; ")}); the rule loop is the largest closed one, ${ringWorld.length} points, its area centroid in the trunk's chart at station ${qc[0].toFixed(1)}, ${qc[1].toFixed(1)} mm of phase (at the armpit's side distance ${armpitV.toFixed(1)} mm)`,
      `  star-shaped in the chart about that centre: ${notStar.some((x: boolean): boolean => x) ? `no, rays meeting it more than once at ${phaseRanges(notStar)}` : "yes, every ray meets it once"}; rays meeting it nowhere: ${missed}; ${bridges.length} bridges over ${BRIDGE_MM} mm${bridges.length === 0 ? "" : ` (${bridges.map((b): string => `ray ${b.from}, ${b.gap.toFixed(1)} mm`).join("; ")})`}`,
      `  the checks (ASTM D5219's points), nearest distance: ${Object.entries(LANDMARKS).map(([name, p]: [string, V]): string => `${name} rule ${distanceTo(p, ruleLoop).toFixed(2)} | today ${distanceTo(p, todayLoop).toFixed(2)} mm`).join("; ")}; the armpit ${distanceTo(P.point("armpit") as V, ruleLoop).toFixed(2)} | ${distanceTo(P.point("armpit") as V, todayLoop).toFixed(2)} mm`,
      `  the two loops' areas in the chart: the rule's ${area(ruleQ).toFixed(0)}, today's ${area(todayQ).toFixed(0)} sq mm; the rule's points ${ruleQ.filter((q: C.P): boolean => enclosedBy(q, todayQ)).length} of ${RAYS} inside today's, today's ${todayQ.filter((q: C.P): boolean => enclosedBy(q, ruleQ)).length} of ${RAYS} inside the rule's`,
      `  the rule loop against the plane: its points from ${Math.min(...ruleLoop.map(side)).toFixed(2)} to ${Math.max(...ruleLoop.map(side)).toFixed(2)} mm off it; today's loop from ${Math.min(...todayLoop.map(side)).toFixed(1)} to ${Math.max(...todayLoop.map(side)).toFixed(1)} mm`,
      "",
    );

    // The rule loop in the plane about its own area centroid, for the in-plane gaps.
    const pc: C.P = areaCentroid(ringPlane);
    const planePiece: IPiece[] = [{ points: ringPlane.map((q: C.P): C.P => [q[0] - pc[0], q[1] - pc[1]]), closed: true }];
    const gapTo = (p: V): number => {
      const q: C.P = inPlane(p);
      const x: C.P = [q[0] - pc[0], q[1] - pc[1]];
      return rayHit(planePiece, Math.atan2(x[1], x[0])) - Math.hypot(x[0], x[1]);
    };

    // (a) The lines at the joint.
    const trunkFamily: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const trunkLines: V[][] = guideLines(trunkFamily, 440, 700, 2);
    const armLines: V[][] = guideLines(arm, s0, s0 + 150, 1);
    const trunkAxisFamily: IAxis = H.axis(trunkFamily);
    const guideNames: string[] = ["+u (front positive)", "+v (side positive)", "-u (front negative)", "-v (side negative)"];
    lines.push(`(a) THE LINES AT THE JOINT: each family's guide lines (its view outlines), the arm's from its first knot (${s0} mm) to ${s0 + 150} mm, the trunk's from 440 to 700 mm:`);
    armLines.forEach((line: V[], q: number): void => {
      const name: string = `the arm's ${guideNames[q]}, ${heading(sub(line[0]!, armAxis.at(s0).origin as V))}`;
      const k: number = line.findIndex((p: V, i: number): boolean => i > 0 && side(line[i - 1]!) < 0 && side(p) >= 0);
      const nearestToday: number = Math.min(...line.map((p: V): number => distanceTo(p, todayLoop)));
      if (k < 0) {
        lines.push(`  ${name}: does not cross the plane: at its first knot ${side(line[0]!).toFixed(1)} mm ${side(line[0]!) >= 0 ? "lateral of the plane already" : "medial, and stays medial"}; nearest today's loop ${nearestToday.toFixed(1)} mm`);
        return;
      }
      const w: number = -side(line[k - 1]!) / (side(line[k]!) - side(line[k - 1]!));
      const x: V = add(line[k - 1]!, scale(sub(line[k]!, line[k - 1]!), w));
      const tangent: V = unit(sub(line[k]!, line[k - 1]!));
      lines.push(`  ${name}: crosses the plane at ${(s0 + k - 1 + w).toFixed(1)} mm (${(k - 1 + w).toFixed(1)} mm past the first knot, which stands ${side(line[0]!).toFixed(1)} mm off the plane), ${gapTo(x) >= 0 ? `${gapTo(x).toFixed(1)} mm inside` : `${(-gapTo(x)).toFixed(1)} mm outside`} the rule loop in the plane, ${distanceTo(x, ruleLoop).toFixed(1)} mm from its nearest point, at ${degrees(Math.acos(Math.max(-1, Math.min(1, dot(tangent, n))))).toFixed(1)} deg to the plane's normal; nearest today's loop ${nearestToday.toFixed(1)} mm`);
    });
    trunkLines.forEach((line: V[], q: number): void => {
      const name: string = `the trunk's ${guideNames[q]}, ${heading(sub(line[0]!, trunkAxisFamily.at(440).origin as V))}`;
      const near = (loop: V[]): string => {
        const k: number = line.reduce((best: number, p: V, i: number): number => (distanceTo(p, loop) < distanceTo(line[best]!, loop) ? i : best), 0);
        return `${distanceTo(line[k]!, loop).toFixed(1)} mm at ${440 + 2 * k} mm`;
      };
      const inside = (polygon: C.P[]): number => line.filter((p: V): boolean => enclosedBy(toQ(p), polygon)).length;
      lines.push(`  ${name}: nearest the rule loop ${near(ruleLoop)}, today's ${near(todayLoop)}; inside the rule loop at ${inside(ruleQ)} and today's at ${inside(todayQ)} of its ${line.length} stations`);
    });
    lines.push("");
    progress("(a) the lines");

    // (b) The arm's field past the rule loop: its wall from its first knot, every 0.5 mm over 160 mm, at every ray's phase.
    const armStations: number[] = Array.from({ length: 321 }, (_: unknown, i: number): number => s0 + 0.5 * i);
    const armLoft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined }, armStations);
    if (armLoft.chain === null) throw new Error("the arm's first stations do not loft");
    const armChain = armLoft.chain;
    const grid: V[][] = armStations.map((s: number): V[] => {
      const read = AutoMovieLoftChain.sampler(armChain, s);
      return Array.from({ length: RAYS }, (_: unknown, j: number): V => read((2 * Math.PI * j) / RAYS) as V);
    });
    const armIndices: number[] = [];
    for (let i: number = 0; i + 1 < grid.length; ++i)
      for (let j: number = 0; j < RAYS; ++j) {
        const a: number = i * RAYS + j;
        const b: number = i * RAYS + ((j + 1) % RAYS);
        armIndices.push(a, a + RAYS, b, b, a + RAYS, b + RAYS);
      }
    const armMesh: M.IMesh = { positions: grid.flatMap((ring: V[]): number[] => ring.flatMap((p: V): number[] => [...p])), indices: armIndices };
    const RAIL_INDEX: number = 2 * ARM_RAIL_MM;
    const start: number[] = grid[0]!.map(side);
    const rail: number[] = grid[RAIL_INDEX]!.map(side);
    const reach: number[] = [];
    const gaps: number[] = [];
    const changes: number[] = [];
    for (let j: number = 0; j < RAYS; ++j) {
      const d: number[] = grid.map((ring: V[]): number => side(ring[j]!));
      changes.push(d.filter((x: number, i: number): boolean => i > 0 && (x < 0) !== (d[i - 1]! < 0)).length);
      const k: number = d.findIndex((x: number, i: number): boolean => i > 0 && d[i - 1]! < 0 && x >= 0);
      if (k < 0) {
        reach.push(NaN);
        gaps.push(NaN);
        continue;
      }
      const w: number = -d[k - 1]! / (d[k]! - d[k - 1]!);
      reach.push(0.5 * (k - 1 + w));
      gaps.push(gapTo(add(grid[k - 1]![j]!, scale(sub(grid[k]![j]!, grid[k - 1]![j]!), w))));
    }
    const armPhase0: string = heading(sub(grid[0]![0]!, armAxis.at(s0).origin as V));
    const armPhase90: string = heading(sub(grid[0]![RAYS / 4]!, armAxis.at(s0).origin as V));
    lines.push(
      `(b) THE ARM'S FIELD PAST THE RULE LOOP, per 10 deg of the arm's own phase (0 deg toward ${armPhase0}, 90 deg toward ${armPhase90}): the arm's wall, stored, from its first knot ${s0} mm; signed distances from the plane, + lateral:`,
      "  the wall's first section off the plane (mm; negative: the arm's field starts medial of the loop's plane, inside the trunk):",
      ...everyTen(start).map((x: string): string => `    ${x}`),
      "  the arm's field past the loop: the wall's length along its course from its first knot to its crossing of the plane (mm):",
      ...everyTen(reach).map((x: string): string => `    ${x}`),
      `  the ordinary rail's ring (${ARM_RAIL_MM} mm past the first knot) off the plane (mm):`,
      ...everyTen(rail).map((x: string): string => `    ${x}`),
      "  in the plane, the arm's wall's crossing inside the rule loop by (mm; negative: outside the loop):",
      ...everyTen(gaps).map((x: string): string => `    ${x}`),
      `  flags: the wall's first section lateral of the plane (the rule loop outside the arm's wall start) at ${phaseRanges(start.map((x: number): boolean => x > 0))}; the wall never crossing the plane in 160 mm at ${phaseRanges(reach.map((x: number): boolean => Number.isNaN(x)))}; the rail's ring medial of the plane at ${phaseRanges(rail.map((x: number): boolean => x < 0))}; the wall's crossing outside the rule loop at ${phaseRanges(gaps.map((x: number): boolean => x < 0))}; crossing the plane more than once at ${phaseRanges(changes.map((x: number): boolean => x > 1))}`,
      "",
    );
    progress("(b) the arm's field");

    // (c) The bands to today's arm ring at its ordinary rail, each loop and the ring paired by the share of their lengths from their tops.
    const ring10: V[] = resample(grid[RAIL_INDEX]!, RAYS, n);
    const railCentre: V = armAxis.at(s0 + ARM_RAIL_MM).origin as V;
    const armTangent: V = unit(sub(armAxis.at(s0 + ARM_RAIL_MM + 0.5).origin as V, armAxis.at(s0 + ARM_RAIL_MM - 0.5).origin as V));
    const trunkNormalRaw = normalsOf(wall);
    const armNormalRaw = normalsOf(armMesh);
    const trunkNormal = (p: V): V => {
      const m: V = trunkNormalRaw(p);
      return dot(m, sub(p, trunkAxis(chart(p).station))) >= 0 ? m : scale(m, -1);
    };
    const armNormal = (p: V): V => {
      const m: V = armNormalRaw(p);
      return dot(m, sub(p, railCentre)) >= 0 ? m : scale(m, -1);
    };
    const ringNormals: V[] = ring10.map(armNormal);
    const band = (loop: V[]): { at: V[]; span: number[]; angle: number[]; back: boolean[]; medial: boolean[] } => {
      const at: V[] = resample(loop, RAYS, n);
      return {
        at,
        span: at.map((p: V, k: number): number => norm(sub(ring10[k]!, p))),
        angle: at.map((p: V, k: number): number => degrees(Math.acos(Math.max(-1, Math.min(1, dot(trunkNormal(p), ringNormals[k]!)))))),
        back: at.map((p: V, k: number): boolean => dot(sub(ring10[k]!, p), armTangent) <= 0),
        medial: at.map((p: V, k: number): boolean => dot(sub(ring10[k]!, p), n) < 0),
      };
    };
    const todayBand = band(todayLoop);
    const ruleBand = band(ruleLoop);
    const bin = (values: number[], b: number): number[] => values.slice((b * RAYS) / 36, ((b + 1) * RAYS) / 36);
    const range = (values: number[]): string => `${Math.min(...values).toFixed(1)}..${Math.max(...values).toFixed(1)}`;
    const worst = (values: number[], at: V[], unitName: string): string =>
      values
        .map((x: number, k: number): { x: number; k: number } => ({ x, k }))
        .sort((a, b): number => b.x - a.x)
        .filter((e, i: number, all): boolean => all.slice(0, i).every((f): boolean => Math.abs(f.k - e.k) > RAYS / 36))
        .slice(0, 3)
        .map((e): string => `${e.x.toFixed(1)} ${unitName} at ${((360 * e.k) / RAYS).toFixed(1)} deg (${where3(at[e.k]!)})`)
        .join("; ");
    lines.push(
      `(c) THE BANDS to today's arm ring at its ordinary rail (${ARM_RAIL_MM} mm past the first knot), each loop and the ring paired by the share of their lengths from their highest points, turning the same way about the plane's normal; read as straight columns:`,
      "  per 10 deg of the share from the top: length today | rule (mm); surface angle between the trunk's and the arm's outward normals today | rule (deg)",
      ...Array.from({ length: 36 }, (_: unknown, b: number): string => `    ${b * 10}..${b * 10 + 10} deg: ${range(bin(todayBand.span, b))} | ${range(bin(ruleBand.span, b))} mm; ${range(bin(todayBand.angle, b))} | ${range(bin(ruleBand.angle, b))} deg`),
      `  the worst lengths, today: ${worst(todayBand.span, todayBand.at, "mm")}`,
      `  the worst lengths, the rule: ${worst(ruleBand.span, ruleBand.at, "mm")}`,
      `  the worst angles, today: ${worst(todayBand.angle, todayBand.at, "deg")}`,
      `  the worst angles, the rule: ${worst(ruleBand.angle, ruleBand.at, "deg")}`,
      `  columns that reach the ring against the arm's own direction: today ${phaseRanges(todayBand.back)}; the rule ${phaseRanges(ruleBand.back)}`,
      `  columns that run medially (the ring medial of the loop along the plane's normal): today ${phaseRanges(todayBand.medial)}; the rule ${phaseRanges(ruleBand.medial)}`,
      "",
    );
    progress("(c) the bands");

    // (d) The bands' surfaces against the slit cutter's volume.
    const inside: (p: V) => boolean = cutterVolume();
    const ROWS: number = 48;
    const through = (b: { at: V[] }): { columns: boolean[]; rows: number[]; first: V | null; seed: number } => {
      const rows: number[] = [];
      let first: V | null = null;
      let seed: number = Infinity;
      const columns: boolean[] = b.at.map((p: V, k: number): boolean => {
        let hit: boolean = false;
        for (let r: number = 0; r <= ROWS; ++r) {
          const x: V = add(p, scale(sub(ring10[k]!, p), r / ROWS));
          seed = Math.min(seed, norm(sub(x, AXILLA_SEED_POINT)));
          if (!inside(x)) continue;
          hit = true;
          rows.push(r / ROWS);
          first ??= x;
        }
        return hit;
      });
      return { columns, rows, first, seed };
    };
    const [todayCut, ruleCut] = [through(todayBand), through(ruleBand)];
    const cutterLine = (name: string, c: ReturnType<typeof through>, loop: V[]): string =>
      `  ${name}: ${c.columns.filter((x: boolean): boolean => x).length} of ${RAYS} columns pass through the cutter's volume, at ${phaseRanges(c.columns)} of the share from the top${c.rows.length === 0 ? "" : `, from ${Math.min(...c.rows).toFixed(2)} to ${Math.max(...c.rows).toFixed(2)} of the way from the loop to the ring; the first at ${where3(c.first!)}`}; the loop's own points inside the cutter: ${loop.filter(inside).length} of ${loop.length}; nearest the slit's seed today ${fixed(AXILLA_SEED_POINT, 1)}: ${c.seed.toFixed(1)} mm`;
    lines.push("(d) THE CUTTER (the slit's recess, `AutoMovieHumanF1Axilla` between its first and last knots) AGAINST THE BANDS, each column sampled at 49 points:", cutterLine("today", todayCut, todayLoop), cutterLine("the rule", ruleCut, ruleLoop), "");
    progress("(d) the cutter");

    // Frames over f1 as generated.
    NodeCanvasRaster.initialize();
    const realized: IRealized = await realizedSkin(root, "reference", progress);
    const generated: M.IMesh = { positions: realized.positions, indices: realized.indices };
    const mirror = (p: V): V => [p[0], p[1], -p[2]];
    const files: string[] = [];
    const render = async (file: string, camera: N.Camera, mesh: N.Mesh, curves: N.Curve[], title: string): Promise<void> => {
      const target: string = path.join(out, file);
      await fs.writeFile(target, NodeCanvasRaster.render(camera, [mesh], curves, "depth", title).png);
      files.push(target);
    };
    const plus: N.Mesh = cropMesh("generated", generated, gh, 200);
    const loopCurves = (sign: 1 | -1): N.Curve[] => {
      const m = (p: V): V => (sign > 0 ? p : mirror(p));
      return [
        { id: "rule", points: ruleLoop.map(m), closed: true, xray: true, colour: "e01b1b" },
        { id: "today", points: todayLoop.map(m), closed: true, xray: true, colour: "2f6fd0" },
        { id: "ring", points: ring10.map(m), closed: true, xray: true, colour: "202020" },
      ];
    };
    const trunkColours: string[] = ["1b5e20", "2e7d32", "43a047", "00897b"];
    const armColours: string[] = ["e65100", "bf360c", "ff9800", "8d6e63"];
    const lineCurves: N.Curve[] = [...trunkLines.map((line: V[], q: number): N.Curve => ({ id: "trunk" + q, points: line, closed: false, xray: true, colour: trunkColours[q]! })), ...armLines.map((line: V[], q: number): N.Curve => ({ id: "arm" + q, points: line, closed: false, xray: true, colour: armColours[q]! }))];
    for (const [view, camera] of [["front", NodeCanvasCamera.fit("front", meshPoints(plus), 900, 900)], ["side", NodeCanvasCamera.fit("left", meshPoints(plus), 900, 900)], ["top", NodeCanvasCamera.fit("top", meshPoints(plus), 900, 900)], ["armpit", facing("armpit", n, [0, 1, 0], meshPoints(plus), 900, 900)]] as [string, N.Camera][])
      await render(`seam.lines.${view}.png`, camera, plus, [...lineCurves, ...loopCurves(1).slice(0, 2)], `f1 as generated, +Z side | (a) guide lines: the trunk's green (+u, +v, -u, -v dark to teal), the arm's orange (+u, +v, -u, -v: orange, rust, amber, brown); red the rule loop, blue today's | ${view}`);
    for (const sign of [1, -1] as const) {
      const mesh: N.Mesh = sign > 0 ? plus : cropMesh("generated", generated, mirror(gh), 200);
      const name: string = sign > 0 ? "plusZ" : "minusZ";
      const facingN: V = sign > 0 ? n : mirror(n);
      for (const [view, back] of [["front", [1, 0, 0]], ["back", [-1, 0, 0]], ["low-oblique", [1, -0.5, sign]], ["armpit", facingN]] as [string, V][])
        await render(`seam.loops.${name}.${view}.png`, facing(view, back, [0, 1, 0], meshPoints(mesh), 900, 900), mesh, loopCurves(sign), `f1 as generated, ${sign > 0 ? "+Z" : "-Z"} side | red: the rule loop; blue: today's armscye loop; black: today's arm ring at ${ARM_RAIL_MM} mm | ${view}`);
    }
    const strokes = (b: { at: V[] }, colour: string, id: string): N.Curve[] => Array.from({ length: 36 }, (_: unknown, k: number): N.Curve => ({ id: id + k, points: [b.at[(k * RAYS) / 36]!, ring10[(k * RAYS) / 36]!], closed: false, xray: true, colour }));
    const crossing = (b: { at: V[] }, c: ReturnType<typeof through>, id: string): N.Curve[] => b.at.flatMap((p: V, k: number): N.Curve[] => (c.columns[k] && k % 4 === 0 ? [{ id: id + k, points: [p, ring10[k]!], closed: false, xray: true, colour: "c2185b" }] : []));
    const fold: N.Curve = { id: "fold", points: AutoMovieHumanF1.CUTTERS[0]!.family.centres.map((c): V => [c[0], c[1], c[2]]), closed: false, xray: true, colour: "1f9d3a" };
    for (const [view, camera] of [["armpit", facing("armpit", n, [0, 1, 0], meshPoints(plus), 900, 900)], ["low-oblique", facing("low-oblique", [1, -0.5, 1], [0, 1, 0], meshPoints(plus), 900, 900)]] as [string, N.Camera][]) {
      await render(`seam.bands.today.${view}.png`, camera, plus, [...loopCurves(1), ...strokes(todayBand, "2f6fd0", "today"), ...crossing(todayBand, todayCut, "cut"), fold], `f1 as generated, +Z | today's band every 10 deg (blue) to the ring at ${ARM_RAIL_MM} mm (black); magenta: columns through the slit cutter; green: the cutter's course | ${view}`);
      await render(`seam.bands.rule.${view}.png`, camera, plus, [...loopCurves(1), ...strokes(ruleBand, "e01b1b", "rule"), ...crossing(ruleBand, ruleCut, "cut"), fold], `f1 as generated, +Z | the rule's band every 10 deg (red) to the ring at ${ARM_RAIL_MM} mm (black); magenta: columns through the slit cutter; green: the cutter's course | ${view}`);
    }
    lines.push("FRAMES:", ...files.map((file: string): string => `  ${file}`));
    await fs.writeFile(path.join(out, "seam.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** How many rail values the arm's port stores round the arm (`AutoMovieHumanF1.armRails`): one every 7.5 degrees of the arm's phase. */
  const RAIL_VALUES: number = 48;

  /** The station step the arm's wall is read at for its rails, mm: a quarter millimetre, under the 0.1 mm the values are stored to after rounding up. */
  const RAIL_STEP_MM: number = 0.25;

  /**
   * The arm's rails by rule (the supervisor's plan on #3151: the seam's dependents decided with the loop; construction.md, Ports: the port's
   * margin is read from the loop along the skin): at each of the arm's phases, the station where the stored arm's wall crosses the armscye
   * plane (`seamPlane`) along its course, then the band's margin (`ARM_RAIL_MM`) along the skin, the phase line's own arc length; where
   * the wall's first section already stands lateral of the plane, from the first knot. The values stored are the least that keep the
   * engine's periodic cubic through them (`AutoMovieConstructionPortRealize`, 8 columns to a value) at or above that rule at every column:
   * each value starts at the rule at its own phase, the lower bound, since the cubic passes through it, and is raised by the shortfall at
   * its nearest column until none falls short, then rounded up to 0.1 mm. Reported: the rule per 10 degrees, the values, and the cubic's
   * least margin over the rule at its columns and at 720 phases.
   */
  function seamRails(): void {
    const { point, normal: n } = seamPlane();
    const side = (p: V): number => dot(sub(p, point), n);
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const s0: number = arm.knots[0]!;
    const stations: number[] = Array.from({ length: 241 }, (_: unknown, i: number): number => s0 + RAIL_STEP_MM * i);
    const loft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined }, stations);
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const chain = loft.chain;
    const readers = stations.map((s: number) => AutoMovieLoftChain.sampler(chain, s));
    const crossing: number[] = [];
    const rule: number[] = Array.from({ length: RAYS }, (_: unknown, j: number): number => {
      const psi: number = (2 * Math.PI * j) / RAYS;
      const line: V[] = readers.map((read): V => read(psi) as V);
      const d: number[] = line.map(side);
      // The crossing: its index along the line and its share of the step; at the first knot where the wall already stands lateral.
      let [k, w]: number[] = [0, 0];
      if (d[0]! < 0) {
        k = d.findIndex((x: number, i: number): boolean => i > 0 && d[i - 1]! < 0 && x >= 0) - 1;
        if (k < 0) throw new Error(`the arm's wall at phase ${((360 * j) / RAYS).toFixed(1)} deg does not cross the plane within ${RAIL_STEP_MM * 240} mm`);
        w = -d[k]! / (d[k + 1]! - d[k]!);
      }
      crossing.push(RAIL_STEP_MM * (k! + w!));
      // The margin along the skin from the crossing.
      let left: number = ARM_RAIL_MM;
      let from: V = add(line[k!]!, scale(sub(line[k! + 1]!, line[k!]!), w!));
      for (let i: number = k! + 1; i < line.length; ++i) {
        // The step from the last point reached, at index `before` along the line, to the line's point `i`.
        const before: number = Math.max(i - 1, k! + w!);
        const step: number = norm(sub(line[i]!, from));
        if (step >= left) return RAIL_STEP_MM * (before + ((i - before) * left) / Math.max(1e-12, step));
        left -= step;
        from = line[i]!;
      }
      throw new Error(`the arm's wall at phase ${((360 * j) / RAYS).toFixed(1)} deg is shorter than the margin past its crossing`);
    });
    const at = (values: readonly number[], psi: number): number => {
      const x: number = ((psi / (2 * Math.PI)) * values.length + values.length) % values.length;
      const i: number = Math.floor(x);
      return values[i]! + (values[(i + 1) % values.length]! - values[i]!) * (x - i);
    };
    const COLUMNS: number = 8 * RAIL_VALUES;
    const need: number[] = Array.from({ length: COLUMNS }, (_: unknown, k: number): number => at(rule, (2 * Math.PI * k) / COLUMNS));
    let chosen: number[] = Array.from({ length: RAIL_VALUES }, (_: unknown, m: number): number => at(rule, (2 * Math.PI * m) / RAIL_VALUES));
    // Raised until no column falls short, rounded up, and raised again where rounding one value up pulled its neighbours' columns down.
    let rounds: number = 0;
    for (; rounds < 1000; ++rounds) {
      const spline = AutoMovieNaturalSpline.periodic(chosen);
      const raise: number[] = chosen.map((): number => 0);
      let worst: number = 0;
      need.forEach((x: number, k: number): void => {
        const short: number = x - spline((2 * Math.PI * k) / COLUMNS);
        if (short <= 0) return;
        const m: number = Math.round((k * RAIL_VALUES) / COLUMNS) % RAIL_VALUES;
        raise[m] = Math.max(raise[m]!, short);
        worst = Math.max(worst, short);
      });
      if (worst <= 0) break;
      chosen = chosen.map((v: number, m: number): number => Math.ceil((v + raise[m]!) * 10 - 1e-9) / 10);
    }
    const check = AutoMovieNaturalSpline.periodic(chosen);
    const atColumns: number[] = need.map((x: number, k: number): number => check((2 * Math.PI * k) / COLUMNS) - x);
    const atPhases: number[] = rule.map((x: number, j: number): number => check((2 * Math.PI * j) / RAYS) - x);
    const least = (values: number[], count: number): string => {
      const k: number = values.reduce((best: number, x: number, i: number): number => (x < values[best]! ? i : best), 0);
      return `${values[k]!.toFixed(3)} mm at ${((360 * k) / count).toFixed(2)} deg`;
    };
    const lines: string[] = [
      `The arm's rails by rule on the armscye plane (tilt ${SEAM_TILT_DEG} deg, offset ${SEAM_OFFSET_MM} mm), the arm as stored (first knot ${s0} mm); mm past the first knot`,
      "the wall's crossing of the plane along its course, per 10 deg of the arm's phase:",
      ...everyTen(crossing, 2).map((x: string): string => `  ${x}`),
      `the rule (the crossing plus ${ARM_RAIL_MM} mm along the skin), per 10 deg:`,
      ...everyTen(rule, 2).map((x: string): string => `  ${x}`),
      `the values to store (${RAIL_VALUES}, at the arm's phases 2 pi m / ${RAIL_VALUES}; ${rounds} rounds of raising, then rounded up to 0.1 mm): ${chosen.join(", ")}`,
      `the least ${Math.min(...chosen).toFixed(1)}, the greatest ${Math.max(...chosen).toFixed(1)}; the cubic's least margin over the rule at its ${COLUMNS} columns ${least(atColumns, COLUMNS)}, at ${RAYS} phases ${least(atPhases, RAYS)}; its greatest excess at the columns ${Math.max(...atColumns).toFixed(3)} mm`,
    ];
    process.stdout.write(lines.join("\n") + "\n");
  }

  /** The cross shares the band's hollow is read at: every tenth of the way from the loop to the rail, the ends left out since the depth is zero there. */
  const HOLLOW_SHARES: number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  /** How far along the band's normal either way the reference's skin is looked for, mm: past the deepest hollow under the armpit's band (the survey's 44.5 mm span). */
  const HOLLOW_REACH_MM: number = 40;

  /** The hollow that earns the band a profile, mm (the supervisor's plan on #3151): deeper than this under the plain blend. */
  const HOLLOW_LEAST_MM: number = 1;

  /**
   * The reference's hollow under the arm's plain band (the supervisor's plan on #3151, the band profile): the +Z arm's port as `construction`
   * declares it, realized alone on the trunk's and the arm's own faces, so the band is the plain blend of the two sides' 2-jets; at each of
   * its columns and at `HOLLOW_SHARES` of the way across, the reference's skin along the band's inward normal (the engine's own:
   * `AutoMovieConstructionSplitBand` carries a profile in along it), the nearest crossing within `HOLLOW_REACH_MM` either way. Positive: the
   * skin lies inward of the band, a hollow the band bridges. Reported per 10 degrees of the band's clock, and the columns deeper than
   * `HOLLOW_LEAST_MM` with their depths per share.
   */
  async function seamProfile(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const declared = AutoMovieHumanF1.construction();
    const find = (node: AutoMovieConstructionNode): IAutoMovieConstructionPort | null => {
      if (node.type === "port" && node.name.startsWith("armscye.") && !node.name.endsWith(".mirror")) return node;
      for (const child of [(node as { host?: AutoMovieConstructionNode }).host, (node as { part?: AutoMovieConstructionNode }).part]) {
        if (child === undefined) continue;
        const found: IAutoMovieConstructionPort | null = find(child);
        if (found !== null) return found;
      }
      return null;
    };
    const port: IAutoMovieConstructionPort | null = find(declared.root);
    if (port === null) throw new Error("the figure declares no +Z armscye port");
    const part: AutoMovieConstructionNode = port.part.type === "continue" ? port.part.host : port.part;
    const trunkName: string = AutoMovieHumanF1.BODY.trunk.name;
    const alone: IAutoMovieConstructionPort = { ...port, host: { type: "source", name: trunkName, source: trunkName }, part };
    const real = realizeAutoMovieConstruction({ name: "f1.armscye", root: alone, fills: [] }, { chord: 0.001, sources: declared.sources });
    const lines: string[] = [`The arm's band, ${port.name}, realized alone on the trunk's and the arm's own faces: ${real.diagnostics.length === 0 ? "no diagnostics" : real.diagnostics.map((d): string => `${d.node} (${d.contract}): ${d.detail}`).join("; ")}`];
    const band = real.surfaces.find((s): boolean => s.name === port.band);
    const chain = real.chains.find((c): boolean => c.name === port.band);
    if (band === undefined || chain === undefined) {
      process.stdout.write(lines.join("\n") + "\nthe band was not realized\n");
      return;
    }
    const L: number = chain.layers.at(-1)!.y - chain.layers[0]!.y;
    const y0: number = chain.layers[0]!.y;
    const n: number = port.count;

    // The band's points and inward normals, and the reference's triangles within 20 mm cells of them.
    const samples: { k: number; t: number; p: V; inward: V }[] = [];
    for (let k: number = 0; k < n; ++k)
      for (const t of HOLLOW_SHARES) {
        const jet = band.jet(y0 + t * L, (2 * Math.PI * k) / n);
        samples.push({ k, t, p: [jet.p[0], jet.p[1], jet.p[2]], inward: scale(unit(cross(jet.u as V, jet.v as V)), -band.orientation) });
      }
    const cell = (p: V): string => p.map((x: number): number => Math.floor(x / 20)).join(",");
    const near: Set<string> = new Set();
    for (const { p, inward } of samples)
      for (let s: number = -HOLLOW_REACH_MM; s <= HOLLOW_REACH_MM; s += 10) {
        const [x, y, z]: number[] = add(p, scale(inward, s)).map((u: number): number => Math.floor(u / 20));
        for (let i: number = -1; i <= 1; ++i) for (let j: number = -1; j <= 1; ++j) for (let l: number = -1; l <= 1; ++l) near.add(`${x! + i},${y! + j},${z! + l}`);
      }
    const reference: M.IMesh = source.all;
    const corner = (t: number, c: number): V => {
      const v: number = reference.indices[3 * t + c]!;
      return [reference.positions[3 * v]!, reference.positions[3 * v + 1]!, reference.positions[3 * v + 2]!];
    };
    const triangles: [V, V, V][] = [];
    for (let t: number = 0; t < reference.indices.length / 3; ++t) {
      const [a, b, c] = [corner(t, 0), corner(t, 1), corner(t, 2)];
      if (near.has(cell(scale(add(add(a, b), c), 1 / 3)))) triangles.push([a, b, c]);
    }
    // The nearest crossing along the line through a point, signed along its direction (Moller and Trumbore).
    const crossing = (p: V, d: V): number => {
      let best: number = NaN;
      for (const [a, b, c] of triangles) {
        const e1: V = sub(b, a);
        const e2: V = sub(c, a);
        const h: V = cross(d, e2);
        const det: number = dot(e1, h);
        if (Math.abs(det) < 1e-12) continue;
        const q: V = sub(p, a);
        const u: number = dot(q, h) / det;
        if (u < 0 || u > 1) continue;
        const r: V = cross(q, e1);
        const w: number = dot(d, r) / det;
        if (w < 0 || u + w > 1) continue;
        const s: number = dot(e2, r) / det;
        if (Math.abs(s) <= HOLLOW_REACH_MM && !(Math.abs(s) >= Math.abs(best))) best = s;
      }
      return best;
    };
    const depth: number[][] = Array.from({ length: n }, (): number[] => []);
    for (const { k, p, inward } of samples) depth[k]!.push(crossing(p, inward));
    const deepest: number[] = depth.map((row: number[]): number => Math.max(...row.filter((x: number): boolean => Number.isFinite(x))));
    lines.push(
      `the band: ${n} columns, span ${L.toFixed(1)} mm along its station, its first column's loop point ${fixed(samples[0]!.p, 1)}; ${triangles.length} reference triangles near it; depth of the reference's skin along the band's inward normal, mm (positive: a hollow under the band)`,
      "per 10 deg of the band's clock, the deepest over its shares (least..greatest over the columns):",
      ...Array.from({ length: 36 }, (_: unknown, b: number): string => {
        const here: number[] = deepest.filter((_x: number, k: number): boolean => Math.floor((36 * k) / n) === b).filter((x: number): boolean => Number.isFinite(x));
        return `  ${b * 10}..${b * 10 + 10} deg: ${here.length === 0 ? "-" : `${Math.min(...here).toFixed(2)}..${Math.max(...here).toFixed(2)}`}`;
      }),
      `columns deeper than ${HOLLOW_LEAST_MM} mm: ${phaseRanges(deepest.map((x: number): boolean => x > HOLLOW_LEAST_MM))}`,
      ...depth.flatMap((row: number[], k: number): string[] => (deepest[k]! > HOLLOW_LEAST_MM ? [`  column ${k} (${((360 * k) / n).toFixed(1)} deg): ${row.map((x: number, i: number): string => `${HOLLOW_SHARES[i]} ${Number.isFinite(x) ? x.toFixed(2) : "-"}`).join(", ")}`] : [])),
    );
    process.stdout.write(lines.join("\n") + "\n");
  }

  /**
   * The arm's band's correspondence premise (`AutoMovieConstructionSplitBand`, `phases`): with `correspondence` "angle", the port's loop and
   * the arm's rail ring must each turn once, strictly monotonically, round the ring's centroid in the ring's Newell plane. Read as the engine
   * reads it: the ring at `8 n` phases of the arm on its rail curve (`AutoMovieHumanF1.armRails`), the loop's `n` columns on the trunk's own
   * wall; reported, every column whose angle steps back, with how far, where it lies, and its distance from the plane of the ring.
   */
  function seamAngle(): string[] {
    const declared = AutoMovieHumanF1.armscye(1);
    if (declared.shape === undefined) throw new Error("the armscye loop declares no shape, so its columns are unknown here");
    const shape: number[] = [...declared.shape];
    const n: number = shape.length;
    const { lift } = lifter(trunkMesh());
    const loop: (V | null)[] = shape.map((share: number, k: number): V | null => {
      const clock: number = (2 * Math.PI * k) / n;
      return lift(1000 * (declared.centre[0] + share * declared.semi[0] * Math.cos(clock)), declared.centre[1] + declared.sense * share * declared.semi[1] * Math.sin(clock));
    });
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const s0: number = arm.knots[0]!;
    const rails: number[] = AutoMovieHumanF1.armRails(1);
    const along = AutoMovieNaturalSpline.periodic(rails);
    const loft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined }, Array.from({ length: 121 }, (_: unknown, i: number): number => s0 + 0.25 * i));
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const chain = loft.chain;
    const samples: number = 8 * n;
    const ring: V[] = Array.from({ length: samples }, (_: unknown, j: number): V => {
      const psi: number = (2 * Math.PI * j) / samples;
      return AutoMovieLoftChain.point(chain, s0 + along(psi), psi) as V;
    });
    const centre: V = scale(ring.reduce((t: V, q: V): V => add(t, q), [0, 0, 0]), 1 / samples);
    const normal: V = unit(ring.reduce((t: V, q: V, j: number): V => add(t, cross(sub(q, centre), sub(ring[(j + 1) % samples]!, centre))), [0, 0, 0]));
    const d0: V = sub(ring[0]!, centre);
    const e1: V = unit(sub(d0, scale(normal, dot(d0, normal))));
    const e2: V = cross(normal, e1);
    const angle = (p: V): number => Math.atan2(dot(sub(p, centre), e2), dot(sub(p, centre), e1));
    const wrap = (x: number): number => x - 2 * Math.PI * Math.round(x / (2 * Math.PI));
    const steps = (points: V[]): number[] => points.map((p: V, j: number): number => wrap(angle(points[(j + 1) % points.length]!) - angle(p)));
    const ringSteps: number[] = steps(ring);
    const loopPoints: V[] = loop.filter((p: V | null): p is V => p !== null);
    const loopSteps: number[] = steps(loopPoints);
    const sense: number = Math.sign(loopSteps.reduce((t: number, x: number): number => t + x, 0));
    const back: number[] = loopSteps.map((x: number, k: number): number => (sense * x > 0 ? -1 : k)).filter((k: number): boolean => k >= 0);
    const lines: string[] = [
      `the correspondence premise of the arm's band (angle round the rail ring's centroid ${fixed(centre, 1)}, in its Newell plane, normal ${fixed(normal, 3)}):`,
      `  the rail ring (${samples} points): turns ${degrees(ringSteps.reduce((t: number, x: number): number => t + x, 0)).toFixed(2)} deg; steps against its turn: ${ringSteps.filter((x: number): boolean => Math.sign(x) !== Math.sign(ringSteps.reduce((t: number, y: number): number => t + y, 0))).length}`,
      `  the loop (${loopPoints.length} of ${n} columns read on the wall): turns ${degrees(loopSteps.reduce((t: number, x: number): number => t + x, 0)).toFixed(2)} deg; ${back.length} steps against its turn${back.length === 0 ? "" : ":"}`,
      ...back.map((k: number): string => {
        const p: V = loopPoints[k]!;
        return `    column ${k} (clock ${((360 * k) / n).toFixed(1)} deg) to ${k + 1}: ${degrees(loopSteps[k]!).toFixed(3)} deg; ${dot(sub(p, centre), normal).toFixed(1)} mm off the ring's plane, ${norm(sub(sub(p, centre), scale(normal, dot(sub(p, centre), normal)))).toFixed(1)} mm from its centroid in it; ${where3(p)}`;
      }),
      `  the loop's distance from the ring's plane: ${Math.min(...loopPoints.map((p: V): number => dot(sub(p, centre), normal))).toFixed(1)} to ${Math.max(...loopPoints.map((p: V): number => dot(sub(p, centre), normal))).toFixed(1)} mm; in the plane, from the centroid ${Math.min(...loopPoints.map((p: V): number => norm(sub(sub(p, centre), scale(normal, dot(sub(p, centre), normal)))))).toFixed(1)} to ${Math.max(...loopPoints.map((p: V): number => norm(sub(sub(p, centre), scale(normal, dot(sub(p, centre), normal)))))).toFixed(1)} mm`,
    ];
    return lines;
  }

  /** A surface's 2-jet across a rail as `AutoMovieSolidRibbon.of` takes it: the point, and the first and second derivatives along `a (du, dv)`. */
  function ribbonOf(jet: { p: readonly number[]; u: readonly number[]; v: readonly number[]; uu: readonly number[]; uv: readonly number[]; vv: readonly number[] }, du: number, dv: number, a: number): { point: V; first: V; second: V } {
    const at = (c: number): [number, number] => [a * (jet.u[c]! * du + jet.v[c]! * dv), a * a * (jet.uu[c]! * du * du + 2 * jet.uv[c]! * du * dv + jet.vv[c]! * dv * dv)];
    const [x, y, z] = [at(0), at(1), at(2)];
    return { point: [jet.p[0]!, jet.p[1]!, jet.p[2]!], first: [x[0], y[0], z[0]], second: [x[1], y[1], z[1]] };
  }

  /**
   * Every premise the arm's band is admitted on, read before the figure is realized (verification.md, Shared Connections; the supervisor's
   * ruling on #3151): on the trunk's and the arm's own faces realized alone (the engine's surfaces, so every point is the engine's), the
   * +Z port as `AutoMovieHumanF1.construction` declares it, its columns built as `AutoMovieConstructionSplitBand.strip` builds them. (0)
   * The angle correspondence's premise (`seamAngle`), which the band no longer takes. (1) The length correspondence as the engine makes it
   * (`lengths`: the ring sampled at 8 points a column on the rail curve, the same sense when the two Newell normals agree, the first column
   * where the two curves at equal shares of their lengths stand closest about their centroids, every other at its share): per 10 degrees of
   * clock, each column's length and the angle between the trunk's and the arm's outward normals at its ends; the columns that reach the
   * ring against the arm's own direction and those that run medially along the armscye plane's normal, both to be none. (2) The ribbons:
   * the columns that point back against their chord (the engine's `backward`, which turn back at any scale) and, under one common scale,
   * the largest at which every other column advances monotonically along its chord (`monotone`, `largest`), with the column that sets it.
   * (3) The loop in the trunk's chart and the rail ring in its Newell plane, each closed and simple. Written to `seamcheck.txt`.
   */
  async function seamCheck(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "seamcheck-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["The arm's band's premises before the figure is realized (+Z side; the twin is its reflection)", "", "(0) THE ANGLE CORRESPONDENCE (not taken):", ...seamAngle(), ""];
    const declared = AutoMovieHumanF1.construction();
    await bandPremises(armPort(declared.root), declared.sources, lines, out);
  }

  /** The +Z arm's port in a construction tree. */
  function armPort(root: AutoMovieConstructionNode): IAutoMovieConstructionPort {
    const find = (node: AutoMovieConstructionNode): IAutoMovieConstructionPort | null => {
      if (node.type === "port" && node.name.startsWith("armscye.") && !node.name.endsWith(".mirror")) return node;
      for (const child of [(node as { host?: AutoMovieConstructionNode }).host, (node as { part?: AutoMovieConstructionNode }).part]) {
        if (child === undefined) continue;
        const found: IAutoMovieConstructionPort | null = find(child);
        if (found !== null) return found;
      }
      return null;
    };
    const port: IAutoMovieConstructionPort | null = find(root);
    if (port === null) throw new Error("the figure declares no +Z armscye port");
    return port;
  }

  /**
   * The band premises of `seamCheck` (1 to 3) for a port, on its host's and its part's faces realized alone from `sources`, appended to
   * `lines` and written with them to `seamcheck.txt` under `out`.
   */
  async function bandPremises(port: IAutoMovieConstructionPort, sources: ReadonlyMap<string, IAutoMovieViewPart>, lines: string[], out: string): Promise<void> {
    const realizeAlone = (name: string) => {
      const real = realizeAutoMovieConstruction({ name: "f1." + name, root: { type: "source", name, source: name }, fills: [] }, { chord: 0.001, sources });
      const surface = real.surfaces.find((s): boolean => s.name === name);
      const chain = real.chains.find((c): boolean => c.name === name);
      if (surface === undefined || chain === undefined) throw new Error(`${name} did not realize alone`);
      return { surface, chain };
    };
    const host = realizeAlone(port.hostFace).surface;
    const child = realizeAlone(port.partFace);
    const S: number = 1000;
    const into: number = port.partEnd === "bottom" ? 1 : -1;
    const end: number = child.chain.layers[port.partEnd === "bottom" ? 0 : child.chain.layers.length - 1]!.y;
    const railCurve = AutoMovieNaturalSpline.periodic(port.rails!.map((x: number): number => end + into * x * S));
    const n: number = port.count;
    const { normal: planeNormal } = seamPlane();

    // The loop on the host: each column's chart point, its jet, and the chart direction toward the curve's centre.
    const [a, b]: [number, number] = [port.loop.semi[0] * S, port.loop.semi[1]];
    const chart: [number, number][] = Array.from({ length: n }, (_: unknown, k: number): [number, number] => {
      const c: number = (2 * Math.PI * k) / n;
      const share: number = port.loop.shape?.[k] ?? 1;
      return [port.loop.centre[0] * S + share * a * Math.cos(c), port.loop.centre[1] + share * port.loop.sense * b * Math.sin(c)];
    });
    const inward: [number, number][] = Array.from({ length: n }, (_: unknown, k: number): [number, number] => [-a * Math.cos((2 * Math.PI * k) / n), -port.loop.sense * b * Math.sin((2 * Math.PI * k) / n)]);
    const jets = chart.map((c: [number, number]) => host.jet(c[0], c[1]));
    const loop: V[] = jets.map((j): V => [j.p[0], j.p[1], j.p[2]]);

    // (1) The length correspondence, as `lengths` makes it.
    const samples: number = 8 * n;
    const ringAt = (psi: number): V => {
      const p = child.surface.point?.(railCurve(psi), psi) ?? child.surface.jet(railCurve(psi), psi).p;
      return [p[0], p[1], p[2]];
    };
    const ring: V[] = Array.from({ length: samples + 1 }, (_: unknown, j: number): V => ringAt((2 * Math.PI * j) / samples));
    const newell = (points: readonly V[]): { centre: V; normal: V } => {
      const centre: V = scale(points.reduce((t: V, q: V): V => add(t, q), [0, 0, 0]), 1 / points.length);
      return { centre, normal: unit(points.reduce((t: V, q: V, j: number): V => add(t, cross(sub(q, centre), sub(points[(j + 1) % points.length]!, centre))), [0, 0, 0])) };
    };
    const rim = newell(ring.slice(0, samples));
    const lap = newell(loop);
    const sense: number = dot(rim.normal, lap.normal) > 0 ? 1 : -1;
    const along: number[] = [0];
    for (let j: number = 1; j <= samples; ++j) along.push(along[j - 1]! + norm(sub(ring[j]!, ring[j - 1]!)));
    const total: number = along[samples]!;
    const lapAlong: number[] = [0];
    for (let k: number = 1; k <= n; ++k) lapAlong.push(lapAlong[k - 1]! + norm(sub(loop[k % n]!, loop[k - 1]!)));
    const lapTotal: number = lapAlong[n]!;
    const below = (x: number): number => {
      let [lo, hi]: number[] = [0, samples - 1];
      while (lo! < hi!) {
        const mid: number = (lo! + hi! + 1) >> 1;
        if (along[mid]! <= x) lo = mid;
        else hi = mid - 1;
      }
      return lo!;
    };
    const readAt = (length: number): { psi: number; p: V } => {
      const x: number = ((length % total) + total) % total;
      const j: number = below(x);
      const span: number = along[j + 1]! - along[j]!;
      const f: number = span > 0 ? (x - along[j]!) / span : 0;
      return { psi: (2 * Math.PI * (j + f)) / samples, p: add(scale(ring[j]!, 1 - f), scale(ring[j + 1]!, f)) };
    };
    let [anchor, least]: number[] = [0, Infinity];
    for (let j: number = 0; j < samples; ++j) {
      let cost: number = 0;
      for (let k: number = 0; k < n && cost < least!; ++k) {
        const d: V = sub(sub(readAt(along[j]! + sense * (lapAlong[k]! / lapTotal) * total).p, rim.centre), sub(loop[k]!, lap.centre));
        cost += dot(d, d);
      }
      if (cost < least!) [least, anchor] = [cost, j];
    }
    const phases: number[] = [];
    let stalled: number = -1;
    for (let k: number = 0; k < n; ++k) {
      const psi: number = readAt(along[anchor!]! + sense * (lapAlong[k]! / lapTotal) * total).psi;
      if (k === 0) {
        phases.push(psi);
        continue;
      }
      const step: number = sense * ((((sense * (psi - phases[k - 1]!)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
      if (!(step !== 0) && stalled < 0) stalled = k;
      phases.push(phases[k - 1]! + step);
    }

    // The columns: the host's ribbon toward the curve's centre and the arm's own at its rail, each scaled to the chord's length.
    const columns = phases.map((psi: number, k: number) => {
      const station: number = railCurve(psi);
      const far = child.surface.jet(station, psi);
      const chord: V = sub([far.p[0], far.p[1], far.p[2]], loop[k]!);
      const L: number = norm(chord);
      const [du, dv]: [number, number] = inward[k]!;
      const j = jets[k]!;
      const speed: number = norm(add(scale(j.u as V, du), scale(j.v as V, dv)));
      const start = ribbonOf(j, du, dv, L / speed);
      const own = ribbonOf(far, into, 0, L / norm(far.u as V));
      const hostNormal: V = unit(scale(cross(j.u as V, j.v as V), host.orientation));
      const armNormal: V = unit(scale(cross(far.u as V, far.v as V), child.surface.orientation));
      return { k, psi, station, chord, L, start, end: own, angle: degrees(Math.acos(Math.max(-1, Math.min(1, dot(hostNormal, armNormal))))), against: dot(chord, scale(far.u as V, into)) <= 0, medial: dot(chord, planeNormal) < 0 };
    });
    const bin = (b: number) => columns.filter((c): boolean => Math.floor((36 * c.k) / n) === b);
    const range = (values: number[]): string => `${Math.min(...values).toFixed(1)}..${Math.max(...values).toFixed(1)}`;
    lines.push(
      `(1) THE LENGTH CORRESPONDENCE as the engine makes it: the ring ${samples} samples on the rail curve (${(end + into * Math.min(...port.rails!) * S).toFixed(1)} to ${(end + into * Math.max(...port.rails!) * S).toFixed(1)} mm of the arm's station), length ${total.toFixed(1)} mm; the loop ${lapTotal.toFixed(1)} mm; the two Newell normals ${sense > 0 ? "agree" : "oppose"} (${dot(rim.normal, lap.normal).toFixed(3)}); the first column lands at the ring's sample ${anchor} (phase ${((360 * anchor!) / samples).toFixed(2)} deg); ${stalled < 0 ? "every column's rail phase advances" : `the rail phase does not advance at column ${stalled}`}`,
      "  per 10 deg of the band's clock: column length (mm); the angle between the trunk's and the arm's outward normals at its ends (deg); the arm's phase it lands at (deg)",
      ...Array.from({ length: 36 }, (_: unknown, b: number): string => `    ${b * 10}..${b * 10 + 10} deg: ${range(bin(b).map((c): number => c.L))} mm; ${range(bin(b).map((c): number => c.angle))} deg; ${range(bin(b).map((c): number => (((degrees(c.psi) % 360) + 360) % 360)))} deg`),
      `  columns reaching the ring against the arm's own direction: ${columns.filter((c): boolean => c.against).length}${columns.some((c): boolean => c.against) ? ` (${phaseRanges(columns.map((c): boolean => c.against))} of clock)` : ""}`,
      `  columns running medially along the armscye plane's normal: ${columns.filter((c): boolean => c.medial).length}${columns.some((c): boolean => c.medial) ? ` (${phaseRanges(columns.map((c): boolean => c.medial))} of clock)` : ""}`,
      `  the longest column ${Math.max(...columns.map((c): number => c.L)).toFixed(1)} mm, the greatest angle ${Math.max(...columns.map((c): number => c.angle)).toFixed(1)} deg; the worst three by angle: ${[...columns].sort((x, y): number => y.angle - x.angle).slice(0, 3).map((c): string => `column ${c.k} (${((360 * c.k) / n).toFixed(1)} deg) ${c.angle.toFixed(1)} deg, ${c.L.toFixed(1)} mm, ${where3(loop[c.k]!)}`).join("; ")}`,
      "",
    );

    // (2) The ribbons under one common scale, as `strip` finds it.
    const monotone = (c: (typeof columns)[number], f: number): boolean => {
      const [p0, p5]: V[] = [c.start.point, c.end.point];
      const controls: V[] = [p0!, add(p0!, scale(c.start.first, f / 5)), add(add(p0!, scale(c.start.first, (2 * f) / 5)), scale(c.start.second, (f * f) / 20)), add(add(p5!, scale(c.end.first, (-2 * f) / 5)), scale(c.end.second, (f * f) / 20)), add(p5!, scale(c.end.first, -f / 5)), p5!];
      const chord: V = sub(p5!, p0!);
      const projected: number[] = controls.map((p: V): number => dot(sub(p, p0!), chord));
      return projected.every((x: number, i: number): boolean => i === 0 || x >= projected[i - 1]!);
    };
    const largest = (c: (typeof columns)[number], from: number): number | null => {
      if (monotone(c, from)) return from;
      let [hi, lo]: number[] = [from, from / 2];
      while (!monotone(c, lo!)) {
        hi = lo;
        lo = lo! / 2;
        if (!(lo > 1e-9)) return null;
      }
      for (let step: number = 0; step < 40; ++step) {
        const mid: number = (lo! + hi!) / 2;
        if (monotone(c, mid)) lo = mid;
        else hi = mid;
      }
      return lo!;
    };
    const backward = columns.filter((c): boolean => !(dot(c.chord, c.start.first) > 0 && dot(c.chord, c.end.first) > 0));
    const forward = columns.filter((c): boolean => !backward.includes(c));
    const own: { k: number; f: number | null }[] = forward.map((c) => ({ k: c.k, f: largest(c, 1) }));
    const refused = own.filter((x): boolean => x.f === null);
    let factor: number = refused.length > 0 || own.length === 0 ? NaN : Math.min(...own.map((x): number => x.f!));
    for (let settled: boolean = Number.isNaN(factor); !settled; ) {
      settled = true;
      for (const c of forward) {
        if (monotone(c, factor)) continue;
        const lower: number | null = largest(c, factor);
        if (lower === null) {
          factor = NaN;
          break;
        }
        factor = lower;
        settled = false;
      }
    }
    const setter = own.filter((x): boolean => x.f !== null).sort((x, y): number => x.f! - y.f!)[0];
    lines.push(
      "(2) THE RIBBONS:",
      `  columns pointing back against their chord (turn back at any scale): ${backward.length}${backward.length === 0 ? "" : ` (${backward.map((c): string => `${c.k}`).join(", ")}; clock ${phaseRanges(columns.map((c): boolean => backward.includes(c)))})`}`,
      `    the trunk's ribbon against the chord: ${backward.filter((c): boolean => dot(c.chord, c.start.first) <= 0).length}; the arm's: ${backward.filter((c): boolean => dot(c.chord, c.end.first) <= 0).length}; the angle between the trunk's ribbon and the chord over them ${backward.length === 0 ? "-" : range(backward.map((c): number => degrees(Math.acos(Math.max(-1, Math.min(1, dot(unit(c.chord), unit(c.start.first))))))))} deg, the arm's ${backward.length === 0 ? "-" : range(backward.map((c): number => degrees(Math.acos(Math.max(-1, Math.min(1, dot(unit(c.chord), unit(c.end.first))))))))} deg; the chord's angle below the plane of the loop's tangent and the trunk's ribbon ${backward.length === 0 ? "-" : range(backward.map((c): number => degrees(Math.asin(Math.max(-1, Math.min(1, dot(unit(c.chord), unit(scale(cross(jets[c.k]!.u as V, jets[c.k]!.v as V), host.orientation)))))))))} deg (+ outward of the trunk's skin)`,
      `  columns with no monotone scale at all: ${refused.length}`,
      `  the common scale: ${Number.isNaN(factor) ? "none" : factor.toFixed(4)}, set by column ${setter?.k ?? "-"} (${setter === undefined ? "-" : ((360 * setter.k) / n).toFixed(1)} deg); every column's own largest scale ${range(own.filter((x): boolean => x.f !== null).map((x): number => x.f!))}; columns under 0.5: ${own.filter((x): boolean => x.f !== null && x.f < 0.5).length}`,
      "",
    );

    // (3) Each curve closed and simple: no two non-neighbouring segments cross, the loop in the trunk's chart, the ring in its Newell plane.
    const crossings = (points: C.P[]): number => {
      let count: number = 0;
      const m: number = points.length;
      const side = (p: C.P, q: C.P, r: C.P): number => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      for (let i: number = 0; i < m; ++i)
        for (let j: number = i + 2; j < m; ++j) {
          if (i === 0 && j === m - 1) continue;
          const [p, q, r, s] = [points[i]!, points[(i + 1) % m]!, points[j]!, points[(j + 1) % m]!];
          if (side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0) ++count;
        }
      return count;
    };
    const armpitV: number = trunkChart()(P.point("armpit") as V).v;
    const e1: V = unit(sub(sub(ring[0]!, rim.centre), scale(rim.normal, dot(sub(ring[0]!, rim.centre), rim.normal))));
    const e2: V = cross(rim.normal, e1);
    lines.push(
      "(3) THE CURVES:",
      `  the loop: ${n} columns, closed by its periodic clock (the last column to the first ${norm(sub(loop[0]!, loop[n - 1]!)).toFixed(2)} mm, against ${(lapTotal / n).toFixed(2)} mm a column); ${crossings(chart.map((c: [number, number]): C.P => [c[0], armpitV * c[1]]))} self-crossings in the trunk's chart`,
      `  the rail ring: ${samples} samples, closed by its periodic phase (the last to the first ${norm(sub(ring[samples]!, ring[0]!)).toFixed(4)} mm); ${crossings(ring.slice(0, samples).map((p: V): C.P => [dot(sub(p, rim.centre), e1), dot(sub(p, rim.centre), e2)]))} self-crossings in its Newell plane`,
    );
    await fs.writeFile(path.join(out, "seamcheck.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /**
   * The seam's frames over f1 as generated (the supervisor's plan on #3151): the shoulder and the armpit of each side from the front, the
   * back, the side, low oblique and along the armscye plane's normal, in clay and coloured by the face that owns each triangle (two of its
   * corners agreeing, as `realizedSkin` reads it), with the port loop drawn; the figure from the front and the side in clay.
   */
  async function seamFrames(): Promise<void> {
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "seamframes-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const realized: IRealized = await realizedSkin(root, "reference", progress);
    const { normal: n } = seamPlane();
    const gh: V = P.frame("humerus").origin as V;
    const mirror = (p: V): V => [p[0], p[1], -p[2]];
    // The port loop on the skin: each column's chart point read back onto the trunk's own wall.
    const { lift } = lifter(trunkMesh());
    const loopOf = (side: 1 | -1): V[] => {
      const loop = AutoMovieHumanF1.armscye(side);
      const shape: number[] = loop.shape === undefined ? [1] : [...loop.shape];
      return shape.map((share: number, k: number): V | null => {
        const clock: number = (2 * Math.PI * k) / shape.length;
        return lift(1000 * (loop.centre[0] + share * loop.semi[0] * Math.cos(clock)), loop.centre[1] + loop.sense * share * loop.semi[1] * Math.sin(clock));
      }).filter((p: V | null): p is V => p !== null);
    };
    const loops: V[][] = [loopOf(1), loopOf(-1)];
    progress(`the port loops read onto the trunk's wall: ${loops[0]!.length} and ${loops[1]!.length} points`);
    // A colour per owner: the trunk grey, the arm blue, the arm's band orange, a cutter's cut magenta, any other by its name's hash.
    const colourOf = (owner: string): V => {
      if (owner === AutoMovieHumanF1.BODY.trunk.name) return [0.72, 0.72, 0.72];
      if (owner.startsWith(AutoMovieHumanF1.BODY.arm.name)) return [0.42, 0.58, 0.86];
      if (owner.startsWith("band." + AutoMovieHumanF1.BODY.arm.name)) return [0.93, 0.56, 0.24];
      if (owner.startsWith("cut.")) return [0.85, 0.3, 0.7];
      const h: number = [...owner].reduce((t: number, c: string): number => (t * 31 + c.charCodeAt(0)) % 997, 7);
      return [0.35 + ((h * 13) % 50) / 100, 0.35 + ((h * 29) % 50) / 100, 0.35 + ((h * 41) % 50) / 100];
    };
    const crop = (focus: V, radius: number, owned: boolean): N.Mesh[] => {
      const groups: Map<string, { positions: number[]; indices: number[]; remap: Map<number, number> }> = new Map();
      const near = (i: number): boolean => norm(sub([realized.positions[3 * i]!, realized.positions[3 * i + 1]!, realized.positions[3 * i + 2]!], focus)) <= radius;
      for (let t: number = 0; t < realized.indices.length / 3; ++t) {
        const tri: number[] = [realized.indices[3 * t]!, realized.indices[3 * t + 1]!, realized.indices[3 * t + 2]!];
        if (!tri.every(near)) continue;
        const key: string = owned ? realized.owners[t]! : "clay";
        let group = groups.get(key);
        if (group === undefined) groups.set(key, (group = { positions: [], indices: [], remap: new Map() }));
        for (const i of tri) {
          let j: number | undefined = group.remap.get(i);
          if (j === undefined) {
            j = group.positions.length / 3;
            group.remap.set(i, j);
            group.positions.push(realized.positions[3 * i]!, realized.positions[3 * i + 1]!, realized.positions[3 * i + 2]!);
          }
          group.indices.push(j);
        }
      }
      return [...groups.entries()].map(([key, g]): N.Mesh => ({ id: key, positions: g.positions, indices: g.indices, colour: key === "clay" ? [0.64, 0.65, 0.67] : colourOf(key) }));
    };
    NodeCanvasRaster.initialize();
    const files: string[] = [];
    const owners: string[] = [...new Set(realized.owners)].sort((a: string, b: string): number => a.localeCompare(b));
    for (const sign of [1, -1] as const) {
      const name: string = sign > 0 ? "plusZ" : "minusZ";
      const focus: V = sign > 0 ? gh : mirror(gh);
      const loop: N.Curve = { id: "loop", points: loops[sign > 0 ? 0 : 1]!, closed: true, xray: false, colour: "e01b1b" };
      for (const [zone, centre, radius] of [["shoulder", focus, 170], ["armpit", add(focus, [0, -70, -25 * sign]), 110]] as [string, V, number][]) {
        const clay: N.Mesh[] = crop(centre, radius, false);
        const owned: N.Mesh[] = crop(centre, radius, true);
        const points: V[] = clay.flatMap(meshPoints);
        for (const [view, back] of [["front", [1, 0, 0]], ["back", [-1, 0, 0]], ["side", [0, 0, sign]], ["low-oblique", [1, -0.5, sign]], ["armpit", sign > 0 ? n : mirror(n)]] as [string, V][]) {
          const camera: N.Camera = facing(view, back, [0, 1, 0], points, 900, 900);
          for (const [shade, meshes] of [["clay", clay], ["owners", owned]] as [string, N.Mesh[]][]) {
            const file: string = path.join(out, `${zone}.${name}.${view}.${shade}.png`);
            await fs.writeFile(file, NodeCanvasRaster.render(camera, meshes, [loop], "depth", `f1 as generated, ${sign > 0 ? "+Z" : "-Z"} side | the armscye by rule; red: the port loop on the trunk's wall | ${shade}${shade === "owners" ? ": trunk grey, arm blue, the arm's band orange, a cut magenta" : ""} | ${zone} ${view}`).png);
            files.push(file);
          }
        }
      }
    }
    const whole: N.Mesh = { id: "figure", positions: realized.positions, indices: realized.indices, colour: [0.64, 0.65, 0.67] };
    for (const view of ["front", "left"]) {
      const file: string = path.join(out, `figure.${view}.clay.png`);
      await fs.writeFile(file, NodeCanvasRaster.render(NodeCanvasCamera.fit(view, meshPoints(whole), 900, 1200), [whole], [], "depth", `f1 as generated | the armscye by rule | figure ${view}`).png);
      files.push(file);
    }
    const lines: string[] = [`owners: ${owners.join(", ")}`, "frames:", ...files.map((file: string): string => `  ${file}`)];
    await fs.writeFile(path.join(out, "seamframes.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** Spacing of the sections across the axilla the crest is read in, mm along the thorax's anterior axis. */
  const CREST_STEP_MM: number = 1;

  /**
   * How far down the trunk's wall must face to count as the axilla's vault, its outward normal's component along the thorax's up: under
   * -0.5, within 60 degrees of straight down, a ceiling, where the trunk's side wall faces out (about 0) and the shoulder up.
   */
  const CREST_FACING: number = -0.5;

  /**
   * How far each join reaches back along the two curves it joins, mm of the trunk's chart (phase read as mm at the armpit's side
   * distance): the band's margin (`ARM_RAIL_MM`), so no corner of the loop is turned within a shorter run than the band's own blend spans.
   */
  const CREST_JOIN_MM: number = ARM_RAIL_MM;

  /** The values of `AutoMovieHumanF1.armRails`: the least that keep the engine's periodic cubic at or above a per-phase rule (`seamRails`). */
  function leastRails(rule: readonly number[]): { chosen: number[]; rounds: number; atColumns: number[]; atPhases: number[] } {
    const at = (values: readonly number[], psi: number): number => {
      const x: number = ((psi / (2 * Math.PI)) * values.length + values.length) % values.length;
      const i: number = Math.floor(x);
      return values[i]! + (values[(i + 1) % values.length]! - values[i]!) * (x - i);
    };
    const COLUMNS: number = 8 * RAIL_VALUES;
    const need: number[] = Array.from({ length: COLUMNS }, (_: unknown, k: number): number => at(rule, (2 * Math.PI * k) / COLUMNS));
    let chosen: number[] = Array.from({ length: RAIL_VALUES }, (_: unknown, m: number): number => Math.ceil(at(rule, (2 * Math.PI * m) / RAIL_VALUES) * 10 - 1e-9) / 10);
    let rounds: number = 0;
    for (; rounds < 1000; ++rounds) {
      const spline = AutoMovieNaturalSpline.periodic(chosen);
      const raise: number[] = chosen.map((): number => 0);
      let worst: number = 0;
      need.forEach((x: number, k: number): void => {
        const short: number = x - spline((2 * Math.PI * k) / COLUMNS);
        if (short <= 0) return;
        const m: number = Math.round((k * RAIL_VALUES) / COLUMNS) % RAIL_VALUES;
        raise[m] = Math.max(raise[m]!, short);
        worst = Math.max(worst, short);
      });
      if (worst <= 0) break;
      chosen = chosen.map((v: number, m: number): number => Math.ceil((v + raise[m]!) * 10 - 1e-9) / 10);
    }
    const check = AutoMovieNaturalSpline.periodic(chosen);
    return { chosen, rounds, atColumns: need.map((x: number, k: number): number => check((2 * Math.PI * k) / COLUMNS) - x), atPhases: rule.map((x: number, j: number): number => check((2 * Math.PI * j) / rule.length) - x) };
  }

  /** The self-crossings of a closed polygon: pairs of segments that are not neighbours and cross. */
  function selfCrossings(points: readonly C.P[]): number {
    let count: number = 0;
    const m: number = points.length;
    const side = (p: C.P, q: C.P, r: C.P): number => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    for (let i: number = 0; i < m; ++i)
      for (let j: number = i + 2; j < m; ++j) {
        if (i === 0 && j === m - 1) continue;
        const [p, q, r, s] = [points[i]!, points[(i + 1) % m]!, points[j]!, points[(j + 1) % m]!];
        if (side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0) ++count;
      }
    return count;
  }

  /** How many times a ray from a centre at an angle meets a closed polygon. */
  function rayMeetings(points: readonly C.P[], centre: C.P, phi: number): number {
    const d: C.P = [Math.cos(phi), Math.sin(phi)];
    let count: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: C.P = [points[i]![0] - centre[0], points[i]![1] - centre[1]];
      const q: C.P = points[(i + 1) % points.length]!;
      const e: C.P = [q[0] - points[i]![0], q[1] - points[i]![1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const w: number = (a[0] * d[1] - a[1] * d[0]) / den;
      if (w >= 0 && w < 1 && t > 0) ++count;
    }
    return count;
  }

  /** A port loop written as `AutoMovieHumanF1`'s `around` writes one with no margin: the ellipse on the outline's half extents, a share per column. */
  function aroundLoop(outline: readonly [number, number][], columns: number, sense: 1 | -1): IAutoMovieConstructionPort.ILoop {
    const span = (c: 0 | 1): [number, number] => [Math.min(...outline.map((q: [number, number]): number => q[c])), Math.max(...outline.map((q: [number, number]): number => q[c]))];
    const [stations, phases]: [number, number][] = [span(0), span(1)];
    const centre: [number, number] = [(stations[0] + stations[1]) / 2, (phases[0] + phases[1]) / 2];
    const semi: [number, number] = [(stations[1] - stations[0]) / 2, (phases[1] - phases[0]) / 2];
    const polar: [number, number][] = outline
      .map((q: [number, number]): [number, number] => {
        const x: number = (q[0] - centre[0]) / semi[0];
        const y: number = (sense * (q[1] - centre[1])) / semi[1];
        return [(Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI), Math.hypot(x, y)];
      })
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const shape: number[] = Array.from({ length: columns }, (_: unknown, k: number): number => {
      const clock: number = (2 * Math.PI * k) / columns;
      const after: number = polar.findIndex((q: [number, number]): boolean => q[0] >= clock);
      const [a, b]: [number, number][] = after > 0 ? [polar[after - 1]!, polar[after]!] : after === 0 ? [[polar.at(-1)![0] - 2 * Math.PI, polar.at(-1)![1]], polar[0]!] : [polar.at(-1)!, [polar[0]![0] + 2 * Math.PI, polar[0]![1]]];
      return b[0] === a[0] ? a[1] : a[1] + ((b[1] - a[1]) * (clock - a[0])) / (b[0] - a[0]);
    });
    return { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense, shape };
  }

  /**
   * The armscye loop over the axilla's crest (the supervisor's ruling on #3151, after the band's premise check found 48 columns under the
   * armpit whose trunk-side ribbon points 91 to 140 degrees off the chord; construction.md, Ports: over a crest of the landmark loop, such
   * as the axilla's vault, place the port on the landmark loop; ASTM D5219's armscye runs from the front break point through the armpit, the
   * vault's apex, to the back break point). Measurement only. The crest is read on the trunk's own wall (`trunkMesh`): in sections square
   * to the thorax's anterior axis every `CREST_STEP_MM` across the armscye plane's cut, within the cut's box in the trunk's chart, the
   * highest point, along the thorax's up, of the wall where it faces down (`CREST_FACING`), the vault's apex where the trunk's side turns
   * over onto the arm. The loop is the plane's cut over the shoulder between its two crossings with the crest, and the crest under the arm
   * between them; each junction is joined G1 in the trunk's chart by the cubic Hermite between the points `CREST_JOIN_MM` back along each
   * curve, its end tangents the curves' own directions there, scaled to its chord. Then: (1) the loop closed, simple and star-shaped in the
   * chart, and its distances to the definition's four points; (2) the arm's rails by `seamRails`' rule, the crossing read on the plane where
   * the loop lies on it and, where it does not, as the arm wall's nearest approach to the loop along its course; (3) every band premise of
   * `seamCheck` on that loop and those rails. Written to `crest.txt` and `seamcheck.txt` under one directory.
   */
  async function crest(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", "crest-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["The armscye loop over the axilla's crest, the arm as stored (#3151): measurement only; nothing realized, fitted or edited", ""];
    const wall: M.IMesh = trunkMesh();
    const { lift, axis: trunkAxis } = lifter(wall);
    const chart = trunkChart();
    const armpitV: number = chart(P.point("armpit") as V).v;
    const toQ = (p: V): C.P => {
      const c = chart(p);
      return [c.station, armpitV * Math.atan2(c.v, c.u)];
    };
    const thorax: SF.IFrame = P.frame("thorax");
    const [tx, ty, tz]: V[] = [thorax.axes[0] as V, thorax.axes[1] as V, thorax.axes[2] as V];
    const gh: V = P.frame("humerus").origin as V;
    const rawNormal = normalsOf(wall);
    const outward = (p: V): V => {
      const m: V = rawNormal(p);
      return dot(m, sub(p, trunkAxis(chart(p).station))) >= 0 ? m : scale(m, -1);
    };

    // The plane's cut: its largest closed loop, in the world and in the chart.
    const { point, normal: n, u: pu, v: pv } = seamPlane();
    const cutLoop: M.ILoop | undefined = M.outline(wall, { origin: point, axes: [cross(pv, pu), pu, pv] }, [0], 0, 0.5, 0)[0]!.loops.filter((l: M.ILoop): boolean => l.closed).sort((a: M.ILoop, b: M.ILoop): number => area([...b.points]) - area([...a.points]))[0];
    if (cutLoop === undefined) throw new Error("the plane cuts no closed loop of the trunk's wall");
    const ringWorld: V[] = cutLoop.points.map((q: C.P): V => add(point, add(scale(pu, q[0]), scale(pv, q[1]))));
    const ringQ: C.P[] = ringWorld.map(toQ);
    const box = (c: 0 | 1): [number, number] => [Math.min(...ringQ.map((q: C.P): number => q[c])), Math.max(...ringQ.map((q: C.P): number => q[c]))];
    const [stations, phases] = [box(0), box(1)];
    const across: number[] = ringWorld.map((p: V): number => dot(sub(p, gh), tx));

    // The crest: in each section across the axilla, the highest point of the wall that faces down.
    const crestLine: { c: number; p: V; facing: number }[] = [];
    // Beside the crest, each section's most downward-facing point in the box, and every 10 mm the wall's profile through the box: its
    // points about 5 mm apart along the cut as (lateral, height) from GH along the thorax's lateral and up axes, with the outward normal's
    // component along the up (facing).
    const turns: string[] = [];
    const profiles: string[] = [];
    let unread: number = 0;
    for (let c: number = Math.ceil(Math.min(...across)); c <= Math.floor(Math.max(...across)); c += CREST_STEP_MM) {
      const origin: V = add(gh, scale(tx, c));
      let best: { p: V; facing: number; height: number } | null = null;
      let turn: { p: V; facing: number } | null = null;
      let profile: { lateral: number; height: number; facing: number }[] = [];
      for (const loop of M.outline(wall, { origin, axes: [tx, ty, tz] }, [0], 0, 0.5, 0)[0]!.loops) {
        const inBox: { lateral: number; height: number; facing: number }[] = [];
        let since: number = Infinity;
        let last: V | null = null;
        for (const q of loop.points) {
          const p: V = add(origin, add(scale(ty, q[0]), scale(tz, q[1])));
          const Q: C.P = toQ(p);
          if (Q[0] < stations[0] || Q[0] > stations[1] || Q[1] < phases[0] || Q[1] > phases[1]) continue;
          const facing: number = dot(outward(p), ty);
          const height: number = dot(sub(p, gh), ty);
          since += last === null ? Infinity : norm(sub(p, last));
          last = p;
          if (since >= 5) {
            inBox.push({ lateral: dot(sub(p, gh), tz), height, facing });
            since = 0;
          }
          if (turn === null || facing < turn.facing) turn = { p, facing };
          if (facing >= CREST_FACING) continue;
          if (best === null || height > best.height) best = { p, facing, height };
        }
        if (inBox.length > profile.length) profile = inBox;
      }
      if (best === null) ++unread;
      else crestLine.push({ c, p: best.p, facing: best.facing });
      if (c % 10 === 0 && turn !== null) turns.push(`${c}: ${fixed(turn.p, 1)}, facing ${turn.facing.toFixed(2)}, ${where3(turn.p)}`);
      if (c % 10 === 0) profiles.push(`    ${c}: ${profile.map((x): string => `(${x.lateral.toFixed(0)}, ${x.height.toFixed(0)}, ${x.facing.toFixed(2)})`).join(" ")}`);
    }
    const crestQ: C.P[] = crestLine.map((x): C.P => toQ(x.p));
    lines.push(
      "THE CREST:",
      `  sections across the axilla every ${CREST_STEP_MM} mm along the thorax's anterior axis from ${Math.ceil(Math.min(...across))} to ${Math.floor(Math.max(...across))} mm of GH (the plane cut's span): ${crestLine.length} read, ${unread} with no downward-facing wall in the cut's box (station ${stations[0].toFixed(1)} to ${stations[1].toFixed(1)}, phase ${phases[0].toFixed(1)} to ${phases[1].toFixed(1)} mm)`,
      `  its points every 10 mm: ${crestLine.filter((x): boolean => x.c % 10 === 0).map((x): string => `${x.c}: ${fixed(x.p, 1)}, facing ${x.facing.toFixed(2)}, ${where3(x.p)}`).join("; ")}`,
      `  beside it, each section's most downward-facing point in the box, every 10 mm: ${turns.join("; ")}`,
      "  the wall's profile through the box every 10 mm, (lateral, height) mm from GH along the thorax's lateral and up axes and the facing, about 5 mm apart along the cut:",
      ...profiles,
    );

    // The crest's crossings with the plane's cut in the chart: the first and the last along the crest.
    const meet = (a: C.P, b: C.P, c: C.P, d: C.P): [number, number] | null => {
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const f: C.P = [d[0] - c[0], d[1] - c[1]];
      const den: number = e[0] * f[1] - e[1] * f[0];
      if (den === 0) return null;
      const t: number = ((c[0] - a[0]) * f[1] - (c[1] - a[1]) * f[0]) / den;
      const s: number = ((c[0] - a[0]) * e[1] - (c[1] - a[1]) * e[0]) / den;
      return t >= 0 && t < 1 && s >= 0 && s < 1 ? [t, s] : null;
    };
    const crossings: { i: number; t: number; r: number; s: number }[] = [];
    for (let i: number = 0; i + 1 < crestQ.length; ++i)
      for (let r: number = 0; r < ringQ.length; ++r) {
        const hit = meet(crestQ[i]!, crestQ[i + 1]!, ringQ[r]!, ringQ[(r + 1) % ringQ.length]!);
        if (hit !== null) crossings.push({ i, t: hit[0], r, s: hit[1] });
      }
    crossings.sort((x, y): number => x.i + x.t - (y.i + y.t));
    lines.push(`  crossings with the plane's cut in the chart: ${crossings.length}${crossings.map((x): string => ` (at the crest's ${(x.i + x.t).toFixed(1)}, ${where3(add(crestLine[x.i]!.p, scale(sub(crestLine[x.i + 1]!.p, crestLine[x.i]!.p), x.t)))})`).join(";")}`, "");
    if (crossings.length < 2) {
      lines.push("the crest does not cross the plane's cut twice: no loop is joined");
      await fs.writeFile(path.join(out, "crest.txt"), lines.join("\n") + "\n");
      process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
      return;
    }
    const [A, B] = [crossings[0]!, crossings.at(-1)!];

    // The loop in the chart: the cut's arc over the shoulder (the one holding its highest station) from A to B, then the crest from B to A.
    type Q = { q: C.P; p: V | null; kind: "plane" | "crest" | "join" };
    const at = (points: readonly V[], i: number, t: number): V => add(points[i]!, scale(sub(points[(i + 1) % points.length]!, points[i]!), t));
    const pointA: V = at(crestLine.map((x): V => x.p), A.i, A.t);
    const pointB: V = at(crestLine.map((x): V => x.p), B.i, B.t);
    const top: number = ringQ.reduce((best: number, q: C.P, r: number): number => (q[0] > ringQ[best]![0] ? r : best), 0);
    const forwardArc: number[] = [];
    for (let r: number = (A.r + 1) % ringQ.length; ; r = (r + 1) % ringQ.length) {
      forwardArc.push(r);
      if (r === B.r) break;
    }
    const arc: number[] = forwardArc.includes(top) ? forwardArc : ((): number[] => {
      const back: number[] = [];
      for (let r: number = A.r; ; r = (r - 1 + ringQ.length) % ringQ.length) {
        back.push(r);
        if (r === (B.r + 1) % ringQ.length) break;
      }
      return back;
    })();
    const polyline: Q[] = [
      { q: toQ(pointA), p: pointA, kind: "plane" },
      ...arc.map((r: number): Q => ({ q: ringQ[r]!, p: ringWorld[r]!, kind: "plane" })),
      { q: toQ(pointB), p: pointB, kind: "crest" },
      ...Array.from({ length: Math.max(0, B.i - A.i) }, (_: unknown, k: number): Q => ({ q: crestQ[B.i - k]!, p: crestLine[B.i - k]!.p, kind: "crest" })),
    ];
    // The joins, G1: at each junction (index 0, A, and the first crest point, B), the cubic Hermite between the points `CREST_JOIN_MM`
    // back along each side, tangent to each side's own direction there.
    const length = (a: C.P, b: C.P): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
    const joined = ((): Q[] => {
      const m: number = polyline.length;
      const junctions: number[] = [0, arc.length + 1];
      const drop: Set<number> = new Set();
      const inserts: Map<number, Q[]> = new Map();
      for (const j of junctions) {
        // Walk back and forward from the junction by the join's reach.
        const walk = (dir: 1 | -1): { index: number; tangent: C.P } => {
          let travelled: number = 0;
          let k: number = j;
          while (travelled < CREST_JOIN_MM) {
            const next: number = (k + dir + m) % m;
            travelled += length(polyline[k]!.q, polyline[next]!.q);
            k = next;
            if (k !== j) drop.add(k);
          }
          drop.delete(k);
          const beyond: C.P = polyline[(k + dir + m) % m]!.q;
          const here: C.P = polyline[k]!.q;
          const d: C.P = [dir * (beyond[0] - here[0]), dir * (beyond[1] - here[1])];
          const size: number = Math.hypot(d[0], d[1]);
          return { index: k, tangent: [d[0] / size, d[1] / size] };
        };
        const before = walk(-1);
        const after = walk(1);
        drop.add(j);
        const [p0, p1]: C.P[] = [polyline[before.index]!.q, polyline[after.index]!.q];
        const chord: number = length(p0!, p1!);
        // The Hermite runs from `before` toward the junction: its start tangent is the incoming direction, its end the outgoing.
        const t0: C.P = [before.tangent[0] * chord, before.tangent[1] * chord];
        const t1: C.P = [after.tangent[0] * chord, after.tangent[1] * chord];
        const count: number = Math.max(4, Math.ceil(chord));
        inserts.set(before.index, Array.from({ length: count - 1 }, (_: unknown, k: number): Q => {
          const s: number = (k + 1) / count;
          const [h00, h10, h01, h11]: number[] = [2 * s ** 3 - 3 * s ** 2 + 1, s ** 3 - 2 * s ** 2 + s, -2 * s ** 3 + 3 * s ** 2, s ** 3 - s ** 2];
          return { q: [h00! * p0![0] + h10! * t0[0] + h01! * p1![0] + h11! * t1[0], h00! * p0![1] + h10! * t0[1] + h01! * p1![1] + h11! * t1[1]], p: null, kind: "join" };
        }));
      }
      return polyline.flatMap((x: Q, k: number): Q[] => (drop.has(k) ? [] : [x, ...(inserts.get(k) ?? [])]));
    })();
    for (const x of joined) if (x.p === null) x.p = lift(x.q[0], x.q[1] / armpitV);
    const loopQ: C.P[] = joined.map((x: Q): C.P => x.q);
    const loopWorld: V[] = joined.filter((x: Q): boolean => x.p !== null).map((x: Q): V => x.p!);

    // (1) The loop's checks.
    const qc: C.P = areaCentroid(loopQ);
    const notStar: number = Array.from({ length: RAYS }, (_: unknown, j: number): number => rayMeetings(loopQ, qc, (2 * Math.PI * j) / RAYS)).filter((x: number): boolean => x !== 1).length;
    const definitional: [string, V][] = [...Object.entries(LANDMARKS), ["armpit", P.point("armpit") as V]];
    lines.push(
      "(1) THE LOOP:",
      `  ${joined.length} points: ${joined.filter((x): boolean => x.kind === "plane").length} on the plane's cut, ${joined.filter((x): boolean => x.kind === "crest").length} on the crest, ${joined.filter((x): boolean => x.kind === "join").length} in the two joins (${joined.filter((x): boolean => x.kind === "join" && x.p === null).length} not read back onto the wall); closed by construction, its last point to its first ${length(loopQ.at(-1)!, loopQ[0]!).toFixed(2)} mm in the chart`,
      `  self-crossings in the trunk's chart: ${selfCrossings(loopQ)}; rays from its area centroid (station ${qc[0].toFixed(1)}, ${qc[1].toFixed(1)} mm of phase) meeting it other than once: ${notStar} of ${RAYS}`,
      `  the definition's points, nearest distance: ${definitional.map(([name, p]): string => `${name} ${distanceTo(p, loopWorld).toFixed(2)} mm`).join("; ")}`,
      `  the chart area ${area(loopQ).toFixed(0)} sq mm against the plane's cut's ${area(ringQ).toFixed(0)}`,
      "",
    );

    // The loop as the port writes it: its star envelope about the centroid, four rays to a column, then `around`.
    const outline: [number, number][] = [];
    for (let j: number = 0; j < 4 * SHOULDER_COLUMNS; ++j) {
      const phi: number = (2 * Math.PI * j) / (4 * SHOULDER_COLUMNS);
      const t: number = rayHit([{ points: loopQ.map((q: C.P): C.P => [q[0] - qc[0], q[1] - qc[1]]), closed: true }], phi);
      if (Number.isFinite(t)) outline.push([qc[0] + t * Math.cos(phi), (qc[1] + t * Math.sin(phi)) / armpitV]);
    }
    const loop: IAutoMovieConstructionPort.ILoop = aroundLoop(outline, SHOULDER_COLUMNS, 1);

    // (2) The rails: on the plane where the loop lies on it, else the arm wall's nearest approach to the loop.
    const arm: H.IFamily = AutoMovieHumanF1.BODY.arm;
    const s0: number = arm.knots[0]!;
    const railStations: number[] = Array.from({ length: 241 }, (_: unknown, i: number): number => s0 + RAIL_STEP_MM * i);
    const armLoft: AutoMovieViewLoft.IResult = H.create({ ...arm, tips: undefined }, railStations);
    if (armLoft.chain === null) throw new Error("the arm's first stations do not loft");
    const armChain = armLoft.chain;
    const readers = railStations.map((s: number) => AutoMovieLoftChain.sampler(armChain, s));
    const planar: boolean[] = joined.filter((x: Q): boolean => x.p !== null).map((x: Q): boolean => x.kind === "plane");
    const nearestLoop = (p: V): { d: number; index: number } => loopWorld.reduce((best: { d: number; index: number }, q: V, index: number): { d: number; index: number } => (norm(sub(p, q)) < best.d ? { d: norm(sub(p, q)), index } : best), { d: Infinity, index: -1 });
    const how: string[] = [];
    const crossingAt: number[] = [];
    const rule: number[] = Array.from({ length: RAYS }, (_: unknown, j: number): number => {
      const psi: number = (2 * Math.PI * j) / RAYS;
      const line: V[] = readers.map((read): V => read(psi) as V);
      const d: number[] = line.map((p: V): number => dot(sub(p, point), n));
      let [k, w]: number[] = [-1, 0];
      if (d[0]! >= 0) [k, w] = [0, 0];
      else {
        const i: number = d.findIndex((x: number, index: number): boolean => index > 0 && d[index - 1]! < 0 && x >= 0);
        if (i > 0) [k, w] = [i - 1, -d[i - 1]! / (d[i]! - d[i - 1]!)];
      }
      const onPlane: boolean = k! >= 0 && planar[nearestLoop(at(line, k!, w!)).index]!;
      if (!onPlane) {
        // The nearest approach to the loop along the course.
        let bestI: number = 0;
        let bestD: number = Infinity;
        line.forEach((p: V, index: number): void => {
          const near: number = nearestLoop(p).d;
          if (near < bestD) [bestD, bestI] = [near, index];
        });
        [k, w] = [Math.min(bestI, line.length - 2), bestI === line.length - 1 ? 1 : 0];
      }
      how.push(onPlane ? "plane" : "nearest");
      crossingAt.push(RAIL_STEP_MM * (k! + w!));
      let left: number = ARM_RAIL_MM;
      let from: V = at(line, k!, w!);
      for (let i: number = k! + 1; i < line.length; ++i) {
        const before: number = Math.max(i - 1, k! + w!);
        const step: number = norm(sub(line[i]!, from));
        if (step >= left) return RAIL_STEP_MM * (before + ((i - before) * left) / Math.max(1e-12, step));
        left -= step;
        from = line[i]!;
      }
      return NaN;
    });
    const short: number = rule.filter((x: number): boolean => Number.isNaN(x)).length;
    const chosen = short > 0 ? null : leastRails(rule);
    const least = (values: number[], count: number): string => {
      const k: number = values.reduce((best: number, x: number, i: number): number => (x < values[best]! ? i : best), 0);
      return `${values[k]!.toFixed(3)} mm at ${((360 * k) / count).toFixed(2)} deg`;
    };
    lines.push(
      `(2) THE RAILS (the crossing plus ${ARM_RAIL_MM} mm along the skin), per 10 deg of the arm's phase; mm past the first knot ${s0}:`,
      `  read on the plane at ${phaseRanges(how.map((x: string): boolean => x === "plane"))}; by the nearest approach at ${phaseRanges(how.map((x: string): boolean => x === "nearest"))}`,
      "  the crossing:",
      ...everyTen(crossingAt, 2).map((x: string): string => `    ${x}`),
      "  the rule:",
      ...everyTen(rule, 2).map((x: string): string => `    ${x}`),
      chosen === null
        ? `  ${short} phases are shorter than the margin past their crossing: no rails`
        : `  the values (${RAIL_VALUES}; ${chosen.rounds} rounds): ${chosen.chosen.join(", ")}; the least ${Math.min(...chosen.chosen).toFixed(1)}, the greatest ${Math.max(...chosen.chosen).toFixed(1)}; the cubic's least margin over the rule at its ${8 * RAIL_VALUES} columns ${least(chosen.atColumns, 8 * RAIL_VALUES)}, at ${RAYS} phases ${least(chosen.atPhases, RAYS)}`,
      "",
    );
    await fs.writeFile(path.join(out, "crest.txt"), lines.join("\n") + "\n");
    if (chosen === null) {
      process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
      return;
    }

    // (3) Every band premise on that loop and those rails.
    const declared = AutoMovieHumanF1.construction();
    const declaredPort: IAutoMovieConstructionPort = armPort(declared.root);
    const candidate: IAutoMovieConstructionPort = { ...declaredPort, loop, rail: Math.min(...chosen.chosen) / 1000, rails: chosen.chosen.map((mm: number): number => mm / 1000) };
    lines.push("(3) THE BAND'S PREMISES on that loop and those rails:");
    await bandPremises(candidate, declared.sources, lines, out);
  }

  /** The band's columns at the armscye (`AutoMovieHumanF1`'s `SHOULDER_COLUMNS`). */
  const SHOULDER_COLUMNS: number = 192;

  /** The slit cut's seed on today's band, mm: the trunk side's middle of the cutter's crossing with the band (`AutoMovieHumanF1`'s `AXILLA_SEED`). */
  const AXILLA_SEED_POINT: V = [-37.4, 1266.5, 149.4];

  export async function main(): Promise<void> {
    if (process.argv[2] === "seam") return seam();
    if (process.argv[2] === "seamrails") return seamRails();
    if (process.argv[2] === "seamprofile") return seamProfile();
    if (process.argv[2] === "seamframes") return seamFrames();
    if (process.argv[2] === "seamangle") {
      process.stdout.write(seamAngle().join("\n") + "\n");
      return;
    }
    if (process.argv[2] === "seamcheck") return seamCheck();
    if (process.argv[2] === "crest") return crest();
    if (process.argv[2] === "cause") return cause();
    if (process.argv[2] === "bend") return bend();
    if (process.argv[2] === "rails") return rails();
    if (process.argv[2] === "port") return port();
    if (process.argv[2] === "centre") return centreRule();
    if (process.argv[2] === "precheck") return precheck();
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
