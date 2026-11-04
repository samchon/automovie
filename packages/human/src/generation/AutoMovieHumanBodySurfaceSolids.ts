import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";
import type { AutoMovieHumanSolidBody } from "../lofting/AutoMovieHumanSolidBody";
import { AutoMovieHumanSolidChain } from "../lofting/AutoMovieHumanSolidChain";
import { AutoMovieHumanSolidMesh } from "../lofting/AutoMovieHumanSolidMesh";
import { AutoMovieHumanSolidVector } from "../lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "../lofting/IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceBoundary } from "./IAutoMovieHumanSurfaceBoundary";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * The skin of the solids: every chain a merge or diff names, and every face
 * of a published body (`IAutoMovieHumanBodyCalibration.bodies`, merges onto
 * merged hosts), drawn by the
 * solid tessellation (`AutoMovieHumanSolidMesh`) into the body's mesh with
 * the body's loft coordinates.
 *
 * Each merge's seam is drawn first (its two rails, one vertex per column,
 * and its blend chain's rows between them); then each host and part chain
 * once as a face on its own grid, the bisection stations of the body's chord
 * tolerance (`AutoMovieHumanLoftStations.bisect`) and its own uniform
 * phases, trimmed by every rail that lies on it. A face's end that an event
 * owns (a contact ring of the ring loft, today's neck on a new trunk) keeps
 * that ring: the face stops a station short and its edge is bridged to the
 * ring's shared vertices (`AutoMovieHumanSolidMesh.bridge`), so the two
 * tessellations meet watertight. A face's end left open by
 * its trims closes on the chain's pole by a fan, the apex's phase NaN as for
 * every pole of the body. Every other vertex carries
 * `[chain, station, phase]` on the chain that evaluated it, the blend's on
 * its blend chain, so the normals, the binding and the chart read them as
 * they read any lofted vertex. Triangle groups are `<chain>/solid`.
 *
 * Each chain must carry its jets (`AutoMovieHumanLoftJet.carries`): the view
 * operator's chains and the blend chains do. A merge naming a chain without
 * them, or a face end left open without a pole, is one diagnostic and the
 * merge or the end is left out.
 */
export namespace AutoMovieHumanBodySurfaceSolids {
  /**
   * The chains the solids draw.
   *
   * @param calibration The calibration.
   * @returns Their names.
   */
  export function names(calibration: IAutoMovieHumanBodyCalibration): Set<string> {
    const out: Set<string> = new Set();
    for (const m of calibration.merges ?? []) {
      out.add(m.blend);
      out.add(m.host);
      out.add(m.part);
    }
    for (const b of calibration.bodies ?? []) for (const f of b.faces) out.add(f.chain);
    return out;
  }

  /**
   * Draw every merge's seam and faces into the body's mesh.
   *
   * @param context The body's surface context.
   * @param calibration The calibration.
   * @returns Every broken premise.
   */
  export function draw(context: IContext, calibration: IAutoMovieHumanBodyCalibration): AutoMovieHumanLoftContract.IDiagnostic[] {
    const diagnostics: AutoMovieHumanLoftContract.IDiagnostic[] = [];
    const merges: IAutoMovieHumanBodyCalibration.IMerge[] = calibration.merges ?? [];
    if (merges.length === 0 && (calibration.bodies ?? []).length === 0) return diagnostics;
    const report = (contract: string, detail: string): void => {
      diagnostics.push({ producer: "body.solids", level: 7, contract, detail });
    };

    // Each named chain's surface once.
    const surfaces: Map<string, IAutoMovieHumanSolidSurface> = new Map();
    const surface = (name: string): IAutoMovieHumanSolidSurface | null => {
      const known: IAutoMovieHumanSolidSurface | undefined = surfaces.get(name);
      if (known !== undefined) return known;
      const chain: IAutoMovieHumanLoftChain | undefined = context.chains.get(name);
      const made: IAutoMovieHumanSolidSurface | null = chain === undefined ? null : AutoMovieHumanSolidChain.surface(chain);
      if (made !== null) surfaces.set(name, made);
      return made;
    };

    // Seams first: their rails become the faces' trims.
    const mesh: AutoMovieHumanSolidMesh.IMesh = AutoMovieHumanSolidMesh.create();
    const groups: { name: string; start: number }[] = [];
    const loops: Map<string, AutoMovieHumanSolidMesh.ILoop[]> = new Map();
    const inverted: Set<string> = new Set();
    for (const m of merges) {
      const host: IAutoMovieHumanSolidSurface | null = surface(m.host);
      const part: IAutoMovieHumanSolidSurface | null = surface(m.part);
      const blend: IAutoMovieHumanSolidSurface | null = surface(m.blend);
      if (host === null || part === null || blend === null) {
        report("solid chains", `merge ${m.blend}: ${[m.host, m.part, m.blend].filter((n: string): boolean => surface(n) === null).join(", ")} carries no jets or is missing`);
        continue;
      }
      groups.push({ name: `${m.blend}/solid`, start: mesh.indices.length });
      const joined: AutoMovieHumanSolidMesh.IJoined = AutoMovieHumanSolidMesh.seam(mesh, {
        host,
        part,
        blend,
        length: m.length,
        hostLoop: m.hostLoop,
        partLoop: m.partLoop,
        rows: m.rows,
      });
      loops.set(m.host, [...(loops.get(m.host) ?? []), joined.host]);
      loops.set(m.part, [...(loops.get(m.part) ?? []), joined.part]);
      if (m.diff === true) inverted.add(m.part);
    }

    // Each published body: one vertex per shared boundary point, and its
    // faces' cycles as trims of their chains.
    for (const body of calibration.bodies ?? []) {
      const ids: (number | null)[] = body.points.map((p: { chain: string; chart: [number, number] }): number | null => {
        const s: IAutoMovieHumanSolidSurface | null = surface(p.chain);
        if (s === null) return null;
        return AutoMovieHumanSolidMesh.vertex(mesh, s.jet(p.chart[0], p.chart[1]).p, AutoMovieHumanSolidMesh.owner(mesh, s), p.chart[0], p.chart[1]);
      });
      const missing: string[] = body.faces.map((f: AutoMovieHumanSolidBody.IPublished["faces"][number]): string => f.chain).filter((n: string): boolean => surface(n) === null);
      if (missing.length > 0 || ids.some((v: number | null): boolean => v === null)) {
        report("solid chains", `body ${body.name}: ${[...new Set(missing)].join(", ")} carries no jets or is missing`);
        continue;
      }
      for (const f of body.faces) {
        const trims: AutoMovieHumanSolidMesh.ILoop[] = f.cycles.map(
          (c: AutoMovieHumanSolidBody.IPublished["faces"][number]["cycles"][number]): AutoMovieHumanSolidMesh.ILoop => ({
            kind: c.kind,
            vertices: c.points.map((k: number): number => ids[k]!),
            chart: c.chart,
          }),
        );
        loops.set(f.chain, [...(loops.get(f.chain) ?? []), ...trims]);
        if (f.inverted === true) inverted.add(f.chain);
      }
    }

    // Then every host and part chain as one trimmed face. An end that an
    // event owns (a contact ring at the chain's far end, made before this
    // step by the events' ring loft) keeps that ring: the face's grid stops
    // one station short of it and its edge there is bridged to the ring's
    // shared vertices.
    const poles: { at: number; chain: string; station: number; point: Vec3 }[] = [];
    const bridges: { chain: string; ring: number[]; cycle: number[]; out: Vec3 }[] = [];
    for (const [name, trims] of loops) {
      const chain: IAutoMovieHumanLoftChain = context.chains.get(name)!;
      const s: IAutoMovieHumanSolidSurface = surfaces.get(name)!;
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      const ringOf = (end: "bottom" | "top"): number[] | null => {
        const b: IAutoMovieHumanSurfaceBoundary | undefined = context.boundaries.get(`${name}:${end}`);
        return b !== undefined && (b.kind === "own" || b.kind === "inherited") ? b.ring : null;
      };
      const rings: { bottom: number[] | null; top: number[] | null } = { bottom: ringOf("bottom"), top: ringOf("top") };
      let stations: number[] = AutoMovieHumanLoftStations.bisect(chain, first, last, context.tolerance);
      if (rings.bottom !== null) stations = stations.slice(1);
      if (rings.top !== null) stations = stations.slice(0, -1);
      if (stations.length < 2) {
        report("closed face", `${name}: its event rings leave ${stations.length} stations of its own`);
        continue;
      }
      const phases: number[] = Array.from({ length: chain.samples }, (_: unknown, k: number): number => (2 * Math.PI * k) / chain.samples);
      groups.push({ name: `${name}/solid`, start: mesh.indices.length });
      const open: number[][] = AutoMovieHumanSolidMesh.face(mesh, { surface: s, stations, phases, loops: trims, inverted: inverted.has(name) });

      // An open end meets its event's ring, closes on the chain's pole, or is reported.
      for (const cycle of open) {
        const station: number = mesh.coordinates[3 * cycle[0]! + 1]!;
        const end: "bottom" | "top" = Math.abs(station - first) <= Math.abs(station - last) ? "bottom" : "top";
        const ring: number[] | null = rings[end];
        if (ring !== null) {
          const j: IAutoMovieHumanSolidSurface.IJet = s.jet(station, mesh.coordinates[3 * cycle[0]! + 2]!);
          const n: Vec3 = AutoMovieHumanSolidVector.cross(j.u, j.v);
          const sign: number = s.orientation * (inverted.has(name) ? -1 : 1);
          bridges.push({ chain: name, ring, cycle, out: [n[0] * sign, n[1] * sign, n[2] * sign] });
          continue;
        }
        const pole: IAutoMovieHumanLoftChain["pole"] = chain.pole?.end === end ? chain.pole : chain.opposite?.end === end ? chain.opposite : undefined;
        if (pole === undefined) {
          report("closed face", `${name}: its ${end} end at station ${station} mm is left open by its trims and has no pole`);
          continue;
        }
        const apex: number = mesh.positions.length / 3;
        mesh.positions.push(...pole.point);
        mesh.coordinates.push(NaN, NaN, NaN);
        poles.push({ at: apex, chain: name, station: end === "bottom" ? first : last, point: pole.point });
        const fan: [number, number, number][] = cycle.map((v: number, k: number): [number, number, number] => [v, cycle[(k + 1) % cycle.length]!, apex]);
        AutoMovieHumanSolidMesh.close(mesh, fan, s, inverted.has(name));
      }
    }

    // Into the body's buffers, owners turned into chain indices.
    const offset: number = context.mesh.positions.length / 3;
    while (context.coordinates.length < 3 * offset) context.coordinates.push(NaN);
    const chainOf: number[] = mesh.owners.map((o: AutoMovieHumanSolidMesh.IOwner): number => context.indices.get(o.name)!);
    // One by one: a spread of a whole mesh's buffer overflows the call stack.
    for (const x of mesh.positions) context.mesh.positions.push(x);
    for (let v: number = 0; v < mesh.coordinates.length / 3; v++) {
      const owner: number = mesh.coordinates[3 * v]!;
      context.coordinates.push(Number.isFinite(owner) ? chainOf[owner]! : NaN, mesh.coordinates[3 * v + 1]!, mesh.coordinates[3 * v + 2]!);
    }
    for (const p of poles) {
      context.coordinates[3 * (offset + p.at)] = context.indices.get(p.chain)!;
      context.coordinates[3 * (offset + p.at) + 1] = p.station;
    }
    groups.forEach((g: { name: string; start: number }, k: number): void => {
      AutoMovieHumanLoftMesh.group(context.mesh, g.name);
      const end: number = groups[k + 1]?.start ?? mesh.indices.length;
      for (let i: number = g.start; i < end; i++) context.mesh.indices.push(mesh.indices[i]! + offset);
    });

    // The bands to the event rings, on the body's buffers where the rings live.
    const view: AutoMovieHumanSolidMesh.IMesh = { positions: context.mesh.positions, indices: [], coordinates: [], owners: [] };
    for (const b of bridges) {
      AutoMovieHumanLoftMesh.group(context.mesh, `${b.chain}/solid`);
      const band: [number, number, number][] = AutoMovieHumanSolidMesh.bridge(
        view,
        b.ring,
        b.cycle.map((v: number): number => v + offset),
        b.out,
      );
      for (const t of band) context.mesh.indices.push(t[0], t[1], t[2]);
    }
    return diagnostics;
  }
}
