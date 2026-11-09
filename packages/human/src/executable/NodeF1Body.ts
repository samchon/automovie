import fs from "node:fs";
import path from "node:path";
import { AutoMovieConstructionSplitBand, AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import { AutoMovieHumanBodySurface } from "../generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanF1Body } from "../generation/AutoMovieHumanF1Body";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";

import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeF1BodyMeshDiagnostics } from "./NodeF1BodyMeshDiagnostics";
import { NodeF1Joints } from "./NodeF1Joints";
import { NodeF1Shade } from "./NodeF1Shade";

type V3 = [number, number, number];

/**
 * `node:f1-body` draws F1 from its recorded inputs. Reference comparison
 * and the old direct providers are explicit executable options.
 * The `--construction` inspection realizes the construction tree
 * (`AutoMovieHumanF1Body`) with the engine and tessellates it with the
 * body's skin (`AutoMovieHumanBodySurface`, whose solids draw the seams, the
 * trimmed faces and the shared continuation rings). Writes clay views (front,
 * left, back, top; both shoulders, the neck base and the crotch's split close up) and a manifest
 * (`report.json`: every operator node's status, the missing parts, the
 * diagnostics, the stage times, the skin's open edges and inverted triangles
 * per face) under `.shots/f1_integration/body-<stamp>/`.
 *
 * Checks the manifest reads from the skin itself:
 * - open edges: an edge used by one triangle only is a hole or an open end of
 *   the skin (a watertight skin has none); their height range locates them;
 * - inverted triangles: a triangle whose geometric normal points against the
 *   outward normals of the surfaces its vertices were evaluated on (each
 *   vertex's `[chain, station, phase]`), a fold-over of the tessellation.
 */
export namespace NodeF1Body {
  /** Draw the measured body or inspect the construction tree on request. */
  export async function run(): Promise<void> {
    const construction: boolean = process.argv.includes("--construction") || process.env.F1_BODY_STATUS === "1";
    if (process.argv.includes("--direct")) return (await import("./NodeF1BodyDirect.js")).NodeF1BodyDirect.run();
    if (!construction) return (await import("./NodeF1BodyFixed.js")).NodeF1BodyFixed.run(process.argv.includes("--reference"));
    const t0: number = performance.now();
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const t1: number = performance.now();
    const body: AutoMovieHumanF1Body.IOutput = AutoMovieHumanF1Body.create(person.parameters);
    const t2: number = performance.now();
    // Every node's outcome first, before the skin and the views, so a failed
    // join reads in the log at once.
    console.log(["status | node | details", ...body.statuses.map((s: AutoMovieHumanF1Body.IStatus): string => `${s.status} | ${s.node} | ${s.details.join(" || ")}`), `missing | ${body.missing.map((m: AutoMovieHumanF1Body.IMissing): string => `${m.part}: ${m.reason}`).join(" || ")}`, ...(["right", "left"] as const).map((side: "right" | "left"): string => `placement | arm.${side} | ${body.arms[side]?.placement ?? "no arm"}`), `ms | ${JSON.stringify(body.ms)}`].join("\n"));
    // `F1_BODY_STATUS=1`: stop after the statuses (the tree's outcome alone, without skin, checks or views).
    if (process.env.F1_BODY_STATUS === "1") return;
    if (body.tree === null) throw new Error(`f1 body: no tree (${body.missing.map((m: AutoMovieHumanF1Body.IMissing): string => `${m.part}: ${m.reason}`).join("; ")})`);
    const calibration: IAutoMovieHumanBodyCalibration = {
      stature: body.s00.measures.stature,
      chains: body.tree.chains,
      events: [],
      poles: [],
      apertures: [],
      eyes: [],
      bodies: [body.tree.body],
      diagnostics: [],
    };
    const skin: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(calibration);
    const t3: number = performance.now();

    const p: number[] = skin.mesh.positions;
    const ix: number[] = skin.mesh.indices;
    const at: (i: number) => V3 = (i: number): V3 => [p[3 * i]!, p[3 * i + 1]!, p[3 * i + 2]!];

    // Open edges: each undirected edge's triangle count.
    const uses: Map<string, number> = new Map();
    for (let k: number = 0; k + 2 < ix.length; k += 3)
      for (let e: number = 0; e < 3; ++e) {
        const a: number = ix[k + e]!;
        const b: number = ix[k + ((e + 1) % 3)]!;
        const key: string = a < b ? `${a},${b}` : `${b},${a}`;
        uses.set(key, (uses.get(key) ?? 0) + 1);
      }
    let open: number = 0;
    let over: number = 0;
    let low: number = Infinity;
    let high: number = -Infinity;
    for (const [key, n] of uses) {
      if (n > 2) ++over;
      if (n !== 1) continue;
      ++open;
      for (const v of key.split(",")) {
        const y: number = at(Number(v))[1];
        low = Math.min(low, y);
        high = Math.max(high, y);
      }
    }

    // Inverted triangles per face group.
    const surfaces: (IAutoMovieSolidSurface | null)[] = calibration.chains.map((c: IAutoMovieLoftChain): IAutoMovieSolidSurface | null => AutoMovieSolidChain.surface(c));
    const groups: { name: string; start: number }[] = skin.mesh.groups;

    // Geometry-only detectors per face (read on the skin's own triangles,
    // never on the shading): slivers, a triangle whose least angle is under
    // 3 degrees; and sharp edges, an interior edge whose two triangles'
    // geometric normals differ by more than 30 degrees (a crease, a step, a
    // fold or a ledge the shading could otherwise soften). Both thresholds
    // are declared detection bounds, not shape laws.
    const faceOf: (triangle: number) => string = (triangle: number): string => {
      let lo: number = 0;
      let hi: number = groups.length - 1;
      while (lo < hi) {
        const mid: number = (lo + hi + 1) >> 1;
        if (groups[mid]!.start <= 3 * triangle) lo = mid;
        else hi = mid - 1;
      }
      return groups[lo]?.name.split("/")[0] ?? "?";
    };
    const facetNormal: (t: number) => V3 = (t: number): V3 => NodeArmDraw.cross(NodeArmDraw.sub(at(ix[3 * t + 1]!), at(ix[3 * t]!)), NodeArmDraw.sub(at(ix[3 * t + 2]!), at(ix[3 * t]!)));
    const detectors: Record<string, { slivers: number; sharpEdges: number; sharpest: number }> = {};
    const record: (face: string) => { slivers: number; sharpEdges: number; sharpest: number } = (face: string): { slivers: number; sharpEdges: number; sharpest: number } => (detectors[face] ??= { slivers: 0, sharpEdges: 0, sharpest: 0 });
    const sides: Map<string, number[]> = new Map();
    for (let t: number = 0; 3 * t + 2 < ix.length; ++t) {
      const corners: V3[] = [at(ix[3 * t]!), at(ix[3 * t + 1]!), at(ix[3 * t + 2]!)];
      const least: number = Math.min(
        ...[0, 1, 2].map((i: number): number => {
          const a: V3 = NodeArmDraw.sub(corners[(i + 1) % 3]!, corners[i]!);
          const b: V3 = NodeArmDraw.sub(corners[(i + 2) % 3]!, corners[i]!);
          const la: number = Math.hypot(...a);
          const lb: number = Math.hypot(...b);
          return la > 0 && lb > 0 ? (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(a, b) / (la * lb)))) * 180) / Math.PI : 0;
        }),
      );
      if (least < 3) ++record(faceOf(t)).slivers;
      for (let e: number = 0; e < 3; ++e) {
        const a: number = ix[3 * t + e]!;
        const b: number = ix[3 * t + ((e + 1) % 3)]!;
        const key: string = a < b ? `${a},${b}` : `${b},${a}`;
        const list: number[] = sides.get(key) ?? [];
        list.push(t);
        sides.set(key, list);
      }
    }
    for (const list of sides.values()) {
      if (list.length !== 2) continue;
      const na: V3 = facetNormal(list[0]!);
      const nb: V3 = facetNormal(list[1]!);
      const la: number = Math.hypot(...na);
      const lb: number = Math.hypot(...nb);
      if (!(la > 0 && lb > 0)) continue;
      const angle: number = (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(na, nb) / (la * lb)))) * 180) / Math.PI;
      if (angle > 30) {
        const r: { slivers: number; sharpEdges: number; sharpest: number } = record(faceOf(list[0]!));
        ++r.sharpEdges;
        r.sharpest = Math.max(r.sharpest, angle);
      }
    }
    const inverted: Record<string, { count: number; total: number; low: number; high: number }> = {};
    for (let g: number = 0; g < groups.length; ++g) {
      const end: number = g + 1 < groups.length ? groups[g + 1]!.start : ix.length;
      const name: string = groups[g]!.name.split("/")[0]!;
      const record: { count: number; total: number; low: number; high: number } = inverted[name] ?? { count: 0, total: 0, low: Infinity, high: -Infinity };
      for (let k: number = groups[g]!.start; k + 2 < end; k += 3) {
        const ids: number[] = [ix[k]!, ix[k + 1]!, ix[k + 2]!];
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
        }
      }
      inverted[name] = record;
    }
    // Each continuation's shared ring, read on both faces' own surfaces at
    // 320 phases: the point gap, the angle between the outward normals (G1)
    // and the normal curvature across the ring, `(S_ss . n) / |S_s|^2`, on
    // either side (G2); then the skin's facets within 6 mm of the ring
    // height: the angle between each facet's normal and its vertices' mean
    // surface normal, per face group (a tessellation that tilts its facets
    // shades as a band where the geometry is continuous).
    const rings: Record<string, unknown>[] = [];
    for (const status of body.statuses) {
      if (status.kind !== "continue" || body.root === null) continue;
      const names: string[] = status.node.split(".");
      const hostName: string = names[names.length - 1]!;
      const partName: string = names.slice(1, -1).join(".");
      const hostIndex: number = calibration.chains.findIndex((c: IAutoMovieLoftChain): boolean => c.name === hostName);
      const partIndex: number = calibration.chains.findIndex((c: IAutoMovieLoftChain): boolean => c.name === partName);
      const host: IAutoMovieSolidSurface | null | undefined = surfaces[hostIndex];
      const part: IAutoMovieSolidSurface | null | undefined = surfaces[partIndex];
      if (host === null || host === undefined || part === null || part === undefined) continue;
      const hostChain: IAutoMovieLoftChain = calibration.chains[hostIndex]!;
      const partChain: IAutoMovieLoftChain = calibration.chains[partIndex]!;
      const hs: number = hostChain.layers[hostChain.layers.length - 1]!.y;
      const ps: number = partChain.layers[0]!.y;
      const read: (s: IAutoMovieSolidSurface, station: number, phi: number) => { p: V3; n: V3; k: number } = (s: IAutoMovieSolidSurface, station: number, phi: number): { p: V3; n: V3; k: number } => {
        const j: IAutoMovieSolidSurface.IJet = s.jet(station, phi);
        const su: V3 = [j.u[0]!, j.u[1]!, j.u[2]!];
        const n: V3 = NodeArmDraw.scale(NodeArmDraw.unit(NodeArmDraw.cross(su, [j.v[0]!, j.v[1]!, j.v[2]!])), s.orientation);
        return { p: [j.p[0]!, j.p[1]!, j.p[2]!], n, k: NodeArmDraw.dot([j.uu[0]!, j.uu[1]!, j.uu[2]!], n) / NodeArmDraw.dot(su, su) };
      };
      let gap: number = 0;
      let angle: number = 0;
      let curvature: number = 0;
      let worst: { phase: number; host: number; part: number } = { phase: NaN, host: NaN, part: NaN };
      for (let k: number = 0; k < 320; ++k) {
        const phi: number = (2 * Math.PI * k) / 320;
        const a: { p: V3; n: V3; k: number } = read(host, hs, phi);
        const b: { p: V3; n: V3; k: number } = read(part, ps, phi);
        gap = Math.max(gap, Math.hypot(...NodeArmDraw.sub(a.p, b.p)));
        angle = Math.max(angle, (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(a.n, b.n)))) * 180) / Math.PI);
        if (Math.abs(a.k - b.k) > curvature) {
          curvature = Math.abs(a.k - b.k);
          worst = { phase: (phi * 180) / Math.PI, host: a.k, part: b.k };
        }
      }
      const height: number = read(host, hs, 0).p[1];
      const facets: Record<string, { count: number; mean: number; max: number }> = {};
      for (let g: number = 0; g < groups.length; ++g) {
        const end: number = g + 1 < groups.length ? groups[g + 1]!.start : ix.length;
        const name: string = groups[g]!.name.split("/")[0]!;
        if (name !== hostName && name !== partName) continue;
        const record: { count: number; mean: number; max: number } = facets[name] ?? { count: 0, mean: 0, max: 0 };
        for (let k: number = groups[g]!.start; k + 2 < end; k += 3) {
          const ids: number[] = [ix[k]!, ix[k + 1]!, ix[k + 2]!];
          if (ids.some((i: number): boolean => Math.abs(at(i)[1] - height) > 6)) continue;
          const geometric: V3 = NodeArmDraw.cross(NodeArmDraw.sub(at(ids[1]!), at(ids[0]!)), NodeArmDraw.sub(at(ids[2]!), at(ids[0]!)));
          let outward: V3 = [0, 0, 0];
          for (const i of ids) {
            const c: number = skin.coordinates[3 * i]!;
            const surface: IAutoMovieSolidSurface | null | undefined = Number.isFinite(c) ? surfaces[c] : null;
            if (surface === null || surface === undefined) continue;
            outward = NodeArmDraw.add(outward, read(surface, skin.coordinates[3 * i + 1]!, skin.coordinates[3 * i + 2]!).n);
          }
          if (!(Math.hypot(...geometric) > 0) || !(Math.hypot(...outward) > 0)) continue;
          const tilt: number = (Math.acos(Math.max(-1, Math.min(1, Math.abs(NodeArmDraw.dot(NodeArmDraw.unit(geometric), NodeArmDraw.unit(outward)))))) * 180) / Math.PI;
          record.mean += tilt;
          record.max = Math.max(record.max, tilt);
          ++record.count;
        }
        facets[name] = record;
      }
      for (const r of Object.values(facets)) r.mean = r.count === 0 ? 0 : r.mean / r.count;
      rings.push({ node: status.node, height, samples: { host: hostChain.samples, part: partChain.samples }, gap, normalAngle: angle, curvature: { jump: curvature, at: worst }, facets });
    }

    // Each band's columns (a split's or a port's), read on its own chain
    // surface: the angle of the chord (rail to rail) from the host-side cross
    // tangent at station 0 and from the child-side one at station L, the turn
    // between those two tangents, the chord's drop and radial run, and the
    // column's shape (`NodeF1Joints.columns`): orientation reversals between
    // adjacent samples (a fold, the chart's Jacobian changing sign), a
    // retreat along its chord (it turns back), and, as information, whether
    // it turns more than 90 degrees from its start (an S-bend does so without
    // folding; this was the earlier `flips` count, which compared every
    // sample with the start and so counted overturned columns as folds).
    const bands: Record<string, unknown>[] = [];
    const degrees: (a: V3, b: V3) => number = (a: V3, b: V3): number => (Math.acos(Math.max(-1, Math.min(1, NodeArmDraw.dot(NodeArmDraw.unit(a), NodeArmDraw.unit(b))))) * 180) / Math.PI;
    if (body.statuses.some((status: AutoMovieHumanF1Body.IStatus): boolean => status.kind === "split" || status.kind === "port")) {
      for (const name of body.tree.chains.filter((c: IAutoMovieLoftChain): boolean => c.name.startsWith("band.")).map((c: IAutoMovieLoftChain): string => c.name)) {
        const index: number = calibration.chains.findIndex((c: IAutoMovieLoftChain): boolean => c.name === name);
        const s: IAutoMovieSolidSurface | null | undefined = surfaces[index];
        if (s === null || s === undefined) continue;
        const chain: IAutoMovieLoftChain = calibration.chains[index]!;
        const L: number = chain.layers[chain.layers.length - 1]!.y;
        const columns: { clock: number; host: number; child: number; turn: number; drop: number; radial: number; reversals: number; retreats: boolean; overturned: boolean; depth: number; scale: number; applied: number }[] = [];
        for (let k: number = 0; k < chain.samples; ++k) {
          const c: number = (2 * Math.PI * k) / chain.samples;
          const j0: IAutoMovieSolidSurface.IJet = s.jet(0, c);
          const j1: IAutoMovieSolidSurface.IJet = s.jet(L, c);
          const chord: V3 = NodeArmDraw.sub([j1.p[0]!, j1.p[1]!, j1.p[2]!], [j0.p[0]!, j0.p[1]!, j0.p[2]!]);
          // The ribbon scale against the chord law: the applied factor is the
          // start ribbon's length (station speed times the band's span) over
          // the column's chord; the column's own largest monotone factor is
          // the applied one times the largest the published ribbons allow
          // above it (`AutoMovieConstructionSplitBand.largest`).
          const applied: number = (Math.hypot(j0.u[0]!, j0.u[1]!, j0.u[2]!) * L) / Math.hypot(...chord);
          const ribbon: (j: IAutoMovieSolidSurface.IJet) => { point: V3; first: V3; second: V3 } = (j: IAutoMovieSolidSurface.IJet): { point: V3; first: V3; second: V3 } => ({
            point: [j.p[0]!, j.p[1]!, j.p[2]!],
            first: [j.u[0]! * L, j.u[1]! * L, j.u[2]! * L],
            second: [j.uu[0]! * L * L, j.uu[1]! * L * L, j.uu[2]! * L * L],
          });
          const own: number | null = AutoMovieConstructionSplitBand.largest({ start: ribbon(j0), end: ribbon(j1) }, 1 / applied);
          const u0: V3 = [j0.u[0]!, j0.u[1]!, j0.u[2]!];
          const u1: V3 = [j1.u[0]!, j1.u[1]!, j1.u[2]!];
          const shape: NodeF1Joints.IColumn = NodeF1Joints.columns(s, L, c);
          columns.push({ clock: (c * 180) / Math.PI, host: degrees(u0, chord), child: degrees(u1, chord), turn: degrees(u0, u1), drop: -chord[1], radial: Math.hypot(chord[0], chord[2]), ...shape, scale: own === null ? NaN : own * applied, applied });
        }
        const scales: number[] = columns.map((c: (typeof columns)[number]): number => c.scale);
        const worst: (typeof columns)[number][] = [...columns].sort((a: (typeof columns)[number], b: (typeof columns)[number]): number => Math.max(b.host, b.child) - Math.max(a.host, a.child)).slice(0, 6);
        bands.push({
          band: name,
          length: L,
          hostAngle: { max: Math.max(...columns.map((c: (typeof columns)[number]): number => c.host)) },
          childAngle: { max: Math.max(...columns.map((c: (typeof columns)[number]): number => c.child)) },
          turn: { max: Math.max(...columns.map((c: (typeof columns)[number]): number => c.turn)) },
          drop: { min: Math.min(...columns.map((c: (typeof columns)[number]): number => c.drop)), max: Math.max(...columns.map((c: (typeof columns)[number]): number => c.drop)) },
          radial: { max: Math.max(...columns.map((c: (typeof columns)[number]): number => c.radial)) },
          foldedColumns: columns.filter((c: (typeof columns)[number]): boolean => c.reversals > 0).length,
          retreatingColumns: columns.filter((c: (typeof columns)[number]): boolean => c.retreats).length,
          // The engine's `scale.backward`: a column whose own start or end
          // tangent (the band's station derivative at 0 or L) makes more
          // than 90 degrees with its chord; with how far it turns back, mm.
          backward: columns
            .filter((c: (typeof columns)[number]): boolean => c.host > 90 || c.child > 90)
            .map((c: (typeof columns)[number]): { clock: number; host: number; child: number; depth: number } => ({ clock: Math.round(c.clock * 10) / 10, host: Math.round(c.host * 10) / 10, child: Math.round(c.child * 10) / 10, depth: Math.round(c.depth * 100) / 100 })),
          overturnedColumns: columns.filter((c: (typeof columns)[number]): boolean => c.overturned).length,
          ribbonScale: { applied: columns[0]?.applied ?? NaN, ownMin: Math.min(...scales), ownBelowOne: scales.filter((x: number): boolean => x < 1).length },
          worst,
        });
      }
    }
    const t4: number = performance.now();

    // Views.
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_integration/body-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    const lo: V3 = [Infinity, Infinity, Infinity];
    const hi: V3 = [-Infinity, -Infinity, -Infinity];
    for (let k: number = 0; k + 2 < p.length; k += 3)
      for (let c: number = 0; c < 3; ++c) {
        lo[c] = Math.min(lo[c]!, p[k + c]!);
        hi[c] = Math.max(hi[c]!, p[k + c]!);
      }
    const box: (centre: V3, half: number) => V3[] = (centre: V3, half: number): V3[] => [NodeArmDraw.add(centre, [-half, -half, -half]), NodeArmDraw.add(centre, [half, half, half])];
    const all: V3[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i: number): V3 => [i & 1 ? hi[0] : lo[0], i & 2 ? hi[1] : lo[1], i & 4 ? hi[2] : lo[2]]);
    const neck: V3 = body.head?.neckBase.plane.origin as V3 | undefined ?? [body.s00.curves.axis.xs, body.s00.curves.top, 0];
    const shoulder: (side: "left" | "right") => V3 = (side: "left" | "right"): V3 => body.s00.datums.shoulders[side].world.origin as V3;
    // The crotch: S00's open bottom end (the split's host end) on its course's X.
    const crotch: V3 = [body.s00.curves.axis.xs, body.s00.curves.bottom, 0];
    const views: [string, V3, readonly V3[]][] = [
      ["front", [-1, 0, 0], all],
      ["left", [0, 0, 1], all],
      ["back", [1, 0, 0], all],
      ["top", [0, -1, 0], all],
      ["shoulder.right.front", [-1, 0, 0], box(shoulder("right"), 150)],
      ["shoulder.right.oblique", NodeArmDraw.unit([-1, -0.6, -1]), box(shoulder("right"), 150)],
      ["shoulder.left.front", [-1, 0, 0], box(shoulder("left"), 150)],
      ["shoulder.left.oblique", NodeArmDraw.unit([-1, -0.6, 1]), box(shoulder("left"), 150)],
      ["neck.front", [-1, 0, 0], box(neck, 130)],
      ["neck.left", [0, 0, 1], box(neck, 130)],
      ["neck.back", [1, 0, 0], box(neck, 130)],
      ["neck.oblique", NodeArmDraw.unit([-1, 0.4, 1]), box(neck, 130)],
      // The head 120 mm above the neck base (its streak check, f1_head 14:0x).
      ["head.front", [-1, 0, 0], box(NodeArmDraw.add(neck, [0, 120, 0]), 140)],
      ["head.left", [0, 0, 1], box(NodeArmDraw.add(neck, [0, 120, 0]), 140)],
      // Each ear and each hand at its anchor (`AutoMovieHumanF1Body.IOutput.anchors`).
      ...Object.entries(body.anchors).flatMap(([name, at]: [string, V3]): [string, V3, readonly V3[]][] =>
        name.startsWith("ear.")
          ? [
              [`${name}.side`, [0, 0, name.endsWith("right") ? -1 : 1], box(at, 45)],
              [`${name}.oblique`, NodeArmDraw.unit([-1, 0, name.endsWith("right") ? -1 : 1]), box(at, 45)],
            ]
          : [
              [`${name}.front`, [-1, 0, 0], box(at, 110)],
              [`${name}.side`, [0, 0, name.endsWith("right") ? -1 : 1], box(at, 110)],
              [`${name}.back`, [1, 0, 0], box(at, 110)],
            ],
      ),
      ["crotch.front", [-1, 0, 0], box(crotch, 180)],
      ["crotch.back", [1, 0, 0], box(crotch, 180)],
      ["crotch.left", [0, 0, 1], box(crotch, 180)],
      ["crotch.front.below", NodeArmDraw.unit([-1, 0.6, 0]), box(crotch, 180)],
      ["crotch.back.below", NodeArmDraw.unit([1, 0.6, 0]), box(crotch, 180)],
    ];
    const realized: string = body.statuses.map((s: AutoMovieHumanF1Body.IStatus): string => `${s.node} ${s.status}`).join("; ");
    const files: string[] = [];
    for (const [name, forward, bounds] of views) {
      const v: NodeArmDraw.IView = NodeArmDraw.open(forward, bounds);
      NodeF1Shade.clay(v, p, skin.normals, ix);
      NodeArmDraw.caption(v, [`f1 body tree, one skin, ${name}`, realized, `open edges ${open}, missing ${body.missing.map((m: AutoMovieHumanF1Body.IMissing): string => m.part).join(", ")}`]);
      fs.writeFileSync(path.join(out, `${name}.png`), NodeArmDraw.png(v));
      files.push(`${name}.png`);
    }
    const t5: number = performance.now();
    const joints: Record<string, unknown>[] = NodeF1Joints.survey(body, calibration.chains, surfaces);

    const { mesh, where, enclosed }: NodeF1BodyMeshDiagnostics.IResult = NodeF1BodyMeshDiagnostics.inspect(p, ix, faceOf, at);

    // The final gates as one pass/fail table, each read from the numbers
    // above (the watches and the views stay a manual check).
    const sum: (values: number[]) => number = (values: number[]): number => values.reduce((x: number, y: number): number => x + y, 0);
    const read: (o: unknown, ...keys: string[]) => number = (o: unknown, ...keys: string[]): number => {
      let x: unknown = o;
      for (const k of keys) x = x !== null && typeof x === "object" ? (x as Record<string, unknown>)[k] : undefined;
      return typeof x === "number" ? x : NaN;
    };
    const strips: Record<string, unknown>[] = [...bands, ...joints.filter((j: Record<string, unknown>): boolean => j.kind === "strip")];
    const count: (key: string) => number = (key: string): number => sum(strips.map((b: Record<string, unknown>): number => read(b, key)));
    const per: (key: string) => string = (key: string): string =>
      strips
        .filter((b: Record<string, unknown>): boolean => read(b, key) > 0)
        .map((b: Record<string, unknown>): string => `${String(b.band ?? b.joint)} ${read(b, key)}`)
        .join(", ");
    const seams: { joint: string; gap: number; angle: number }[] = joints
      .filter((j: Record<string, unknown>): boolean => j.kind === "seam")
      .map((j: Record<string, unknown>): { joint: string; gap: number; angle: number } => ({
        joint: `${String(j.joint)}${j.corners === undefined ? "" : ` (loop corners apart: ${(j.corners as { clock: number; angle: number }[]).map((c: { clock: number; angle: number }): string => `${c.clock} deg ${c.angle.toFixed(2)} deg`).join(", ")})`}`,
        gap: read(j, "gap", "max"),
        angle: read(j, "angle", "max"),
      }));
    // pass null: information, not a gate.
    const gates: { gate: string; pass: boolean | null; value: string }[] = [
      { gate: "every node realized", pass: body.statuses.every((s: AutoMovieHumanF1Body.IStatus): boolean => s.status === "realized"), value: body.statuses.map((s: AutoMovieHumanF1Body.IStatus): string => `${s.node} ${s.status}${s.details.length === 0 ? "" : ` (${s.details.join(" | ")})`}`).join("; ") },
      { gate: "open edges 0", pass: open === 0, value: String(open) },
      { gate: "edges in more than two triangles 0", pass: over === 0, value: String(over) },
      { gate: "inverted triangles 0", pass: sum(Object.values(inverted).map((r: { count: number }): number => r.count)) === 0, value: String(sum(Object.values(inverted).map((r: { count: number }): number => r.count))) },
      { gate: "folded strip columns 0 (orientation reversal between adjacent samples; bands and blends)", pass: count("foldedColumns") === 0, value: `${count("foldedColumns")} ${per("foldedColumns")}` },
      { gate: "retreating strip columns 0 (a column turning back along its chord; bands and blends)", pass: count("retreatingColumns") === 0, value: `${count("retreatingColumns")} ${per("retreatingColumns")}` },
      { gate: "overturned strip columns (information: turning over 90 deg from the column's start)", pass: null, value: `${count("overturnedColumns")} ${per("overturnedColumns")}` },
      ...bands.map((b: Record<string, unknown>): { gate: string; pass: boolean; value: string } => {
        const list: { clock: number; host: number; child: number; depth: number }[] = (b.backward as { clock: number; host: number; child: number; depth: number }[] | undefined) ?? [];
        return {
          gate: `${String(b.band)}: backward columns 0 (scale.backward: a tangent over 90 deg from its chord; kept, a defect)`,
          pass: list.length === 0,
          value: `${list.length} [clock deg / host deg / child deg / turn-back mm] ${list.map((c: { clock: number; host: number; child: number; depth: number }): string => `${c.clock}/${c.host}/${c.child}/${c.depth}`).join(" ")}`,
        };
      }),
      ...seams.map((s: { joint: string; gap: number; angle: number }): { gate: string; pass: boolean; value: string } => ({ gate: `${s.joint}: gap 0 and normal angle under 1 deg`, pass: s.gap <= 1e-6 && s.angle < 1, value: `gap ${s.gap.toExponential(2)} mm, angle ${s.angle.toFixed(3)} deg` })),
      ...joints.filter((j: Record<string, unknown>): boolean => j.kind === "lines").map((j: Record<string, unknown>): { gate: string; pass: null; value: string } => ({ gate: `${String(j.joint)} lines (information: S00's crotch loop against the leg's own first section)`, pass: null, value: JSON.stringify(j.worst) })),
      { gate: "slivers 0 (least angle under 3 deg)", pass: sum(Object.values(detectors).map((d: { slivers: number }): number => d.slivers)) === 0, value: String(sum(Object.values(detectors).map((d: { slivers: number }): number => d.slivers))) },
      { gate: "sharp edges 0 (dihedral over 30 deg)", pass: sum(Object.values(detectors).map((d: { sharpEdges: number }): number => d.sharpEdges)) === 0, value: String(sum(Object.values(detectors).map((d: { sharpEdges: number }): number => d.sharpEdges))) },
      ...Object.entries(mesh).map(([name, r]: [string, { count: number; byFace: Record<string, number> }]): { gate: string; pass: boolean; value: string } => ({ gate: `mesh: ${name} 0`, pass: r.count === 0, value: `${r.count} ${JSON.stringify(r.byFace)}${name.startsWith("self-intersecting") ? ` where ${JSON.stringify(where)}` : ""}` })),
      { gate: "mesh: enclosed volume positive (outward winding)", pass: enclosed > 0, value: `${(enclosed / 1e6).toFixed(3)} L` },
      {
        // Attached: none listed missing and no digit join (`blend.<toe or digit>.<host>`) left a diagnostic.
        gate: "toes and fingers attached",
        pass: !body.missing.some((m: AutoMovieHumanF1Body.IMissing): boolean => m.part.startsWith("toes") || m.part.startsWith("fingers")) && !body.diagnostics.some((d: { producer: string }): boolean => d.producer.startsWith("tree.blend.")),
        value: `missing: ${body.missing.map((m: AutoMovieHumanF1Body.IMissing): string => m.part).join(", ") || "none"}; digit joins with diagnostics: ${[...new Set(body.diagnostics.filter((d: { producer: string }): boolean => d.producer.startsWith("tree.blend.")).map((d: { producer: string }): string => d.producer))].join(", ") || "none"}; blend chains realized: ${body.tree.chains.filter((c: IAutoMovieLoftChain): boolean => c.name.startsWith("blend.")).length}`,
      },
    ];
    console.log(["gate | pass | value", ...gates.map((g: { gate: string; pass: boolean | null; value: string }): string => `${g.gate} | ${g.pass === null ? "INFO" : g.pass ? "PASS" : "FAIL"} | ${g.value}`)].join("\n"));
    const report: Record<string, unknown> = {
      gates,
      statuses: body.statuses,
      missing: body.missing,
      faces: body.tree.body.faces.map((f: { chain: string; cycles: { kind: string }[] }): string => `${f.chain} [${f.cycles.map((c: { kind: string }): string => c.kind).join(", ")}]`),
      chains: body.tree.chains.map((c: IAutoMovieLoftChain): string => `${c.name}: order ${c.order}, samples ${c.samples}, layers ${c.layers.length}, fingerprint ${fingerprint(c)}`),
      skin: { triangles: ix.length / 3, vertices: p.length / 3, openEdges: open, openHeight: [low, high], edgesOverTwo: over, inverted },
      detectors,
      rings,
      bands,
      joints,
      crossings: where,
      diagnostics: [...body.diagnostics, ...(calibration.diagnostics ?? [])],
      ms: { input: t1 - t0, ...body.ms, skin: t3 - t2, checks: t4 - t3, draw: t5 - t4 },
      files,
    };
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
    console.log(`node:f1-body ${out}`);
    console.log(JSON.stringify({ ...report, files: undefined }, null, 2));
  }

  /**
   * A chain's exact data as one 32-bit FNV-1a digest (Fowler, Noll and Vo):
   * every layer's station and each of its coefficient, slope, curvature and
   * lift arrays, hashed over their IEEE-754 binary64 bytes, so two runs whose
   * digests agree published bit-identical chains (a behaviour-neutral
   * refactor's proof on the real joins).
   */
  export function fingerprint(chain: IAutoMovieLoftChain): string {
    const bytes: Uint8Array = new Uint8Array(8);
    const view: DataView = new DataView(bytes.buffer);
    let hash: number = 0x811c9dc5;
    const feed: (x: number) => void = (x: number): void => {
      view.setFloat64(0, x, true);
      for (const b of bytes) hash = Math.imul(hash ^ b, 0x01000193) >>> 0;
    };
    for (const layer of chain.layers) {
      feed(layer.y);
      for (const list of [layer.coefficients, layer.slopes, layer.curvatures, layer.lift, layer.liftSlopes, layer.liftCurvatures]) for (const x of list ?? []) feed(x);
    }
    return hash.toString(16).padStart(8, "0");
  }
}

void NodeF1Body.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
