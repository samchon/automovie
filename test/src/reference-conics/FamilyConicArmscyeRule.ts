import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieMeshExtract as M, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
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

  export async function main(): Promise<void> {
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
