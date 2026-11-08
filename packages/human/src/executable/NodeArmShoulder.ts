import fs from "node:fs";
import path from "node:path";
import { type AutoMovieLoftContract, AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import { AutoMovieHumanBodySurface } from "../generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanArmContact } from "../generation/arm/AutoMovieHumanArmContact";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmShoulderJoin } from "../generation/arm/AutoMovieHumanArmShoulderJoin";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];

/**
 * The shoulder join of f1's left arm as one skin: the trunk's S00 and the
 * arm with its dome joined by the body's join tree
 * (`AutoMovieHumanArmShoulderJoin`), realized by the engine, published as a
 * calibration of the realized chains and trimmed body, and tessellated by the
 * body's skin (`AutoMovieHumanBodySurface`, whose solids draw the seam, the
 * faces trimmed by their rails and the bridges). Writes the trace's
 * diagnostics and timings, then clay views of that one skin (front, left,
 * back, top, shoulder close-ups from front, side, back and both obliques, and
 * dome-top close-ups) under `.shots/f1_arm/shoulder-<stamp>/`.
 */
export namespace NodeArmShoulder {
  /** Build, join, tessellate and draw. */
  export async function run(): Promise<void> {
    const ms: Record<string, number> = {};
    let t: number = performance.now();
    const lap: (name: string) => void = (name: string): void => {
      const now: number = performance.now();
      ms[name] = now - t;
      t = now;
    };
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "left");
    lap("inputs and contact");
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side: "left", arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers);
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.root, order: 32, samples: 64, gap: 6 });
    if (loft.part === null) throw new Error(`arm loft: ${loft.diagnostics.join("; ")}`);
    lap("arm");
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters);
    lap("trunk S00");
    const axilla: number = AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk;
    const join: AutoMovieHumanArmShoulderJoin.IOutput = AutoMovieHumanArmShoulderJoin.create({
      // The composed S00: the wall with its mounds as reliefs, as f1_trunk publishes it.
      trunk: { ...s00.loft.part, ...(s00.chain?.reliefs === undefined ? {} : { reliefs: s00.chain.reliefs }) },
      arm: loft.part,
      stations: { head: loft.station(landmarks.course.port), axilla: loft.station(axilla), length: loft.length },
      shoulder: axilla - landmarks.course.acromion,
      female: landmarks.female,
      gap: 6,
    });
    lap("join (trace, blend, trim)");
    // The blend's own surface: per column, its width (first to last row),
    // whether its normal keeps one side (S_u x S_v against the column's first
    // row) along the rows (a flip is a fold-over of the strip), and the
    // cross-seam normal radius at each rail, `|S_u|^2 / |S_uu . n|`, which the
    // blend copies from the part (first row) and the host (last row).
    const blendChain: IAutoMovieLoftChain | undefined = join.tree.chains.find((c: IAutoMovieLoftChain): boolean => c.name.startsWith("blend."));
    const blendSurface: IAutoMovieSolidSurface | null = blendChain === undefined ? null : AutoMovieSolidChain.surface(blendChain);
    const columns: string[] = [];
    if (blendChain !== undefined && blendSurface !== null) {
      const y0: number = blendChain.layers[0]!.y;
      const y1: number = blendChain.layers[blendChain.layers.length - 1]!.y;
      const radius: (j: IAutoMovieSolidSurface.IJet) => number = (j: IAutoMovieSolidSurface.IJet): number => {
        const su: V3 = [j.u[0]!, j.u[1]!, j.u[2]!];
        const n: V3 = NodeArmDraw.unit(NodeArmDraw.cross(su, [j.v[0]!, j.v[1]!, j.v[2]!]));
        return NodeArmDraw.dot(su, su) / Math.abs(NodeArmDraw.dot([j.uu[0]!, j.uu[1]!, j.uu[2]!], n));
      };
      for (let k: number = 0; k < 32; ++k) {
        const v: number = (2 * Math.PI * k) / 32;
        let first: V3 | null = null;
        let flips: number = 0;
        const ends: V3[] = [];
        const radii: number[] = [];
        const normals: V3[] = [];
        for (let i: number = 0; i <= 20; ++i) {
          const u: number = y0 + ((y1 - y0) * i) / 20;
          const j: IAutoMovieSolidSurface.IJet = blendSurface.jet(u, v);
          const n: V3 = NodeArmDraw.cross([j.u[0]!, j.u[1]!, j.u[2]!], [j.v[0]!, j.v[1]!, j.v[2]!]);
          if (first === null) first = n;
          else if (NodeArmDraw.dot(first, n) < 0) ++flips;
          if (i === 0 || i === 20) {
            ends.push([j.p[0]!, j.p[1]!, j.p[2]!]);
            radii.push(radius(j));
            normals.push(NodeArmDraw.unit(n));
          }
        }
        const width: number = Math.hypot(...NodeArmDraw.sub(ends[1]!, ends[0]!));
        // The blend's turn across the seam: the angle between the part's and
        // the host's normals at their rails (180 deg less the wedge's opening).
        const turn: number = (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(normals[0]!, normals[1]!)))) * 180) / Math.PI;
        columns.push(`phase ${((k * 360) / 32).toFixed(1)}: width ${width.toFixed(1)} mm, flips ${flips}, turn ${turn.toFixed(1)} deg, cross radius part ${radii[0]!.toFixed(1)} host ${radii[1]!.toFixed(1)} mm, part rail at ${ends[0]!.map((x: number): string => x.toFixed(0)).join(",")}`);
      }
    }
    console.log(JSON.stringify({ blend: blendChain === undefined ? null : { layers: blendChain.layers.length, span: [blendChain.layers[0]!.y, blendChain.layers[blendChain.layers.length - 1]!.y] }, columns }, null, 1));
    console.log(JSON.stringify({ slot: slot(loft, s00, inputs.arms.scale, join.fold) }, null, 1));
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: s00.measures.stature,
      chains: join.tree.chains,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      bodies: [join.tree.body],
      diagnostics: [],
    };
    const skin: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration);
    lap("skin");
    // Inverted triangles of the skin: a triangle's geometric normal against
    // its vertices' own outward surface normals, read from each vertex's
    // [chain, station, phase] on its chain; counted per face group with the
    // height range where they occur.
    const surfaces: (IAutoMovieSolidSurface | null)[] = calibration.chains.map((c: IAutoMovieLoftChain): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(c));
    const groups: { name: string; start: number }[] = skin.mesh.groups;
    const rails: [string, V3[]][] =
      blendSurface === null || blendChain === undefined
        ? []
        : ([["part", blendChain.layers[0]!.y], ["host", blendChain.layers[blendChain.layers.length - 1]!.y]] as [string, number][]).map(([rail, u]: [string, number]): [string, V3[]] => [
            rail,
            Array.from({ length: 256 }, (_: unknown, c: number): V3 => {
              const p: readonly number[] = blendSurface.jet(u, (2 * Math.PI * c) / 256).p;
              return [p[0]!, p[1]!, p[2]!];
            }),
          ]);
    const located: string[] = [];
    const inverted: Record<string, { count: number; total: number; low: number; high: number }> = {};
    for (let g: number = 0; g < groups.length; ++g) {
      const end: number = g + 1 < groups.length ? groups[g + 1]!.start : skin.mesh.indices.length;
      const name: string = groups[g]!.name.split("/")[0]!;
      const record: { count: number; total: number; low: number; high: number } = inverted[name] ?? { count: 0, total: 0, low: Infinity, high: -Infinity };
      for (let k: number = groups[g]!.start; k + 2 < end; k += 3) {
        const ids: number[] = [skin.mesh.indices[k]!, skin.mesh.indices[k + 1]!, skin.mesh.indices[k + 2]!];
        const at: (i: number) => V3 = (i: number): V3 => [skin.mesh.positions[3 * i]!, skin.mesh.positions[3 * i + 1]!, skin.mesh.positions[3 * i + 2]!];
        const geometric: V3 = NodeArmDraw.cross(NodeArmDraw.sub(at(ids[1]!), at(ids[0]!)), NodeArmDraw.sub(at(ids[2]!), at(ids[0]!)));
        let outward: V3 = [0, 0, 0];
        for (const i of ids) {
          const [c, s, phi]: number[] = [skin.coordinates[3 * i]!, skin.coordinates[3 * i + 1]!, skin.coordinates[3 * i + 2]!];
          const surface: IAutoMovieSolidSurface | null | undefined = Number.isFinite(c) ? surfaces[c] : null;
          if (surface === null || surface === undefined || !Number.isFinite(s) || !Number.isFinite(phi)) continue;
          try {
            const j: IAutoMovieSolidSurface.IJet = surface.jet(s, phi);
            outward = NodeArmDraw.add(outward, NodeArmDraw.scale(NodeArmDraw.unit(NodeArmDraw.cross([j.u[0]!, j.u[1]!, j.u[2]!], [j.v[0]!, j.v[1]!, j.v[2]!])), surface.orientation));
          } catch {
            continue;
          }
        }
        if (!(Math.hypot(...outward) > 0)) continue;
        ++record.total;
        if (NodeArmDraw.dot(geometric, outward) < 0) {
          ++record.count;
          const y: number = (at(ids[0]!)[1] + at(ids[1]!)[1] + at(ids[2]!)[1]) / 3;
          record.low = Math.min(record.low, y);
          record.high = Math.max(record.high, y);
          // Where it stands against the rails: the nearest of 256 points on
          // each rail (the blend's first and last rows), its rail and column.
          const centroid: V3 = NodeArmDraw.scale(NodeArmDraw.add(NodeArmDraw.add(at(ids[0]!), at(ids[1]!)), at(ids[2]!)), 1 / 3);
          let best: { d: number; rail: string; phase: number } = { d: Infinity, rail: "", phase: NaN };
          for (const [rail, points] of rails)
            points.forEach((q: V3, c: number): void => {
              const d: number = Math.hypot(...NodeArmDraw.sub(centroid, q));
              if (d < best.d) best = { d, rail, phase: (360 * c) / points.length };
            });
          // Which of its vertices are rail vertices (the seam's 64 columns on
          // either rail, within 1e-3 mm), and its shape: longest edge and the
          // height over it.
          const onRail: number = ids.filter((i: number): boolean =>
            rails.some(([, points]: [string, V3[]]): boolean =>
              points.some((q: V3, c: number): boolean => c % 4 === 0 && Math.hypot(...NodeArmDraw.sub(at(i), q)) <= 1e-3),
            ),
          ).length;
          const edges: number[] = [0, 1, 2].map((e: number): number => Math.hypot(...NodeArmDraw.sub(at(ids[(e + 1) % 3]!), at(ids[e]!))));
          const longest: number = Math.max(...edges);
          const height: number = Math.hypot(...geometric) / longest;
          located.push(`${name} at height ${y.toFixed(1)}: ${best.d.toFixed(2)} mm from the ${best.rail} rail at column ${best.phase.toFixed(1)} deg; rail vertices ${onRail}/3, longest edge ${longest.toFixed(2)} mm, height ${height.toFixed(3)} mm`);
        }
      }
      inverted[name] = record;
    }
    console.log(JSON.stringify({ inverted, located }, null, 1));

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm/shoulder-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const p: number[] = skin.mesh.positions;
    const ix: number[] = skin.mesh.indices;
    const triangles: [V3, V3, V3][] = [];
    for (let k: number = 0; k + 2 < ix.length; k += 3) {
      const at: (i: number) => V3 = (i: number): V3 => [p[3 * i]!, p[3 * i + 1]!, p[3 * i + 2]!];
      triangles.push([at(ix[k]!), at(ix[k + 1]!), at(ix[k + 2]!)]);
    }
    const gh: V3 = inputs.root.origin as V3;
    const near: V3[] = [NodeArmDraw.add(gh, [-150, -150, -150]), NodeArmDraw.add(gh, [150, 150, 150])];
    // The dome top: 70 mm about the dome pole.
    const top: V3 = AutoMovieHumanArmCurveSpec.apply(inputs.root, landmarks.points.dome) as V3;
    const dome: V3[] = [NodeArmDraw.add(top, [-70, -70, -70]), NodeArmDraw.add(top, [70, 70, 70])];
    // The skin's bounding box corners frame the whole views (a spread of every
    // vertex overflows the call stack at this size).
    const lo: V3 = [Infinity, Infinity, Infinity];
    const hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (let k: number = 0; k + 2 < p.length; k += 3)
      for (let c: number = 0; c < 3; ++c) {
        lo[c] = Math.min(lo[c]!, p[k + c]!);
        hi[c] = Math.max(hi[c]!, p[k + c]!);
      }
    const all: V3[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i: number): V3 => [i & 1 ? hi[0] : lo[0], i & 2 ? hi[1] : lo[1], i & 4 ? hi[2] : lo[2]]);
    const views: [string, V3, readonly V3[]][] = [
      ["front", [-1, 0, 0], all],
      ["left", [0, 0, 1], all],
      ["back", [1, 0, 0], all],
      ["top", [0, -1, 0], all],
      ["shoulder.front", [-1, 0, 0], near],
      ["shoulder.left", [0, 0, 1], near],
      ["shoulder.back", [1, 0, 0], near],
      ["shoulder.oblique.front", NodeArmDraw.unit([-1, -0.6, 1]), near],
      ["shoulder.oblique.back", NodeArmDraw.unit([1, -0.6, 1]), near],
      ["dome.front", [-1, 0, 0], dome],
      ["dome.left", [0, 0, 1], dome],
    ];
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [...join.diagnostics, ...(calibration.diagnostics ?? [])];
    const files: string[] = [];
    for (const [name, forward, bounds] of views) {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      NodeArmDraw.clay(v, triangles);
      NodeArmDraw.caption(v, [`f1 trunk S00 + left arm joined by the body tree (phase trace), one skin, ${name}`, `fold radius ${join.fold.radius.toFixed(2)} mm, cap ${join.fold.cap.toFixed(1)} mm, ${diagnostics.length} diagnostics`]);
      fs.writeFileSync(path.join(out, `${name}.png`), NodeArmDraw.png(v));
      files.push(`${name}.png`);
    }
    lap("draw");
    const report: Record<string, unknown> = {
      fold: { ...join.fold, part: join.fold.partFace },
      chains: join.tree.chains.map((c: { name: string }): string => c.name),
      faces: join.tree.body.faces.map((f: { chain: string }): string => f.chain),
      triangles: triangles.length,
      contact: inputs.placement,
      diagnostics,
      ms,
      files,
    };
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(`node:arm-shoulder ${out}`);
    console.log(JSON.stringify({ ...report, files: undefined }, null, 2));
  }

  /**
   * The axilla slot per arm phase column (32 about the arm): where the arm's
   * meridian leaves S00 (the trace, bisected to 1e-3 mm on the trunk's signed
   * radial gap, `AutoMovieHumanArmContact.trunk`, the contact's own reading),
   * the fold angle beta there (the arm's outward normal against the trunk's,
   * the gap field's gradient by central differences of 0.01 mm, normal to its
   * zero set, the trunk skin), and the wall-to-wall gap along the meridian
   * below the trace: at fixed station offsets, its largest value within the
   * fold's cap with its offset, and every further sign change. A rolling ball
   * of the fold's radius fits only where the gap reaches its diameter.
   */
  function slot(loft: AutoMovieHumanArmViewLoft.IOutput, s00: AutoMovieHumanTrunkS00.IOutput, scale: number, fold: { radius: number; cap: number }): string[] {
    const chain: IAutoMovieLoftChain | null | undefined = loft.loft?.chain;
    const arm: IAutoMovieSolidSurface | null = chain === undefined || chain === null ? null : AutoMovieSolidChain.surface(chain);
    const trunk: IAutoMovieSolidSurface | null = s00.chain === null ? null : AutoMovieSolidChain.surface(s00.chain);
    if (arm === null || trunk === null) return ["no arm or trunk surface"];
    const gap: (p: V3) => number | null = AutoMovieHumanArmContact.trunk(trunk, s00.curves.axis.turn, scale);
    const at = (s: number, phi: number): V3 => {
      const p: readonly number[] = arm.jet(s, phi).p;
      return [p[0]!, p[1]!, p[2]!];
    };
    const read = (s: number, phi: number): number | null => gap(at(s, phi));
    const rows: string[] = [`fold ball diameter ${(2 * fold.radius).toFixed(2)} mm, cap ${fold.cap.toFixed(1)} mm`];
    const end: number = loft.length - 1;
    for (let k: number = 0; k < 32; ++k) {
      const phi: number = (2 * Math.PI * k) / 32;
      // The first inside-to-outside crossing on a 1 mm walk from the dome pole.
      let trace: number | null = null;
      let previous: number | null = read(0.5, phi);
      for (let s: number = 1.5; s <= end && trace === null; s += 1) {
        const g: number | null = read(s, phi);
        if (previous !== null && g !== null && previous < 0 && g >= 0) {
          let lo: number = s - 1;
          let hi: number = s;
          while (hi - lo > 1e-3) {
            const mid: number = (lo + hi) / 2;
            if ((read(mid, phi) ?? 0) < 0) lo = mid;
            else hi = mid;
          }
          trace = hi;
        }
        previous = g;
      }
      if (trace === null) {
        rows.push(`phase ${((k * 360) / 32).toFixed(1)}: no inside-to-outside crossing`);
        continue;
      }
      const j: IAutoMovieSolidSurface.IJet = arm.jet(trace, phi);
      const na: V3 = NodeArmDraw.unit(NodeArmDraw.cross([j.u[0]!, j.u[1]!, j.u[2]!], [j.v[0]!, j.v[1]!, j.v[2]!]).map((x: number): number => x * arm.orientation) as V3);
      const p: V3 = at(trace, phi);
      const h: number = 0.01;
      const grad: V3 = [0, 1, 2].map((c: number): number => {
        const plus: V3 = [...p];
        const minus: V3 = [...p];
        plus[c] += h;
        minus[c] -= h;
        return ((gap(plus) ?? 0) - (gap(minus) ?? 0)) / (2 * h);
      }) as V3;
      const beta: number = (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(na, NodeArmDraw.unit(grad))))) * 180) / Math.PI;
      const offsets: string[] = [5, 10, 20, 30, 40, 50, 70].map((d: number): string => {
        const g: number | null = trace + d <= end ? read(trace + d, phi) : null;
        return `+${d} ${g === null ? "-" : g.toFixed(1)}`;
      });
      let widest: number = -Infinity;
      let widestAt: number = 0;
      const changes: string[] = [];
      let last: number | null = null;
      for (let d: number = 0.5; trace + d <= end && d <= 3 * fold.cap; d += 0.5) {
        const g: number | null = read(trace + d, phi);
        if (g === null) continue;
        if (d <= fold.cap && g > widest) {
          widest = g;
          widestAt = d;
        }
        if (last !== null && (last < 0) !== (g < 0)) changes.push(`${g < 0 ? "enters" : "leaves"} at +${d.toFixed(1)}`);
        last = g;
      }
      rows.push(`phase ${((k * 360) / 32).toFixed(1)}: trace at station ${trace.toFixed(1)} (${p.map((x: number): string => x.toFixed(0)).join(",")}), beta ${beta.toFixed(1)} deg; gap ${offsets.join(", ")} mm; widest within cap ${widest.toFixed(1)} mm at +${widestAt.toFixed(1)}${changes.length === 0 ? "" : `; ${changes.join(", ")}`}`);
    }
    return rows;
  }
}

void NodeArmShoulder.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
