import type { AutoMovieHumanLoftContract } from "../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";
import { AutoMovieHumanSolidChain } from "../lofting/AutoMovieHumanSolidChain";
import { AutoMovieHumanSolidMesh } from "../lofting/AutoMovieHumanSolidMesh";
import type { AutoMovieHumanSolidVector } from "../lofting/AutoMovieHumanSolidVector";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanSolidSurface } from "../lofting/IAutoMovieHumanSolidSurface";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanSurfaceContext as IContext } from "./IAutoMovieHumanSurfaceContext";

type Vec3 = AutoMovieHumanSolidVector.Vec3;

/**
 * The skin of the solids: every chain a merge or diff names, drawn by the
 * solid tessellation (`AutoMovieHumanSolidMesh`) into the body's mesh with
 * the body's loft coordinates.
 *
 * Each merge's seam is drawn first (its two rails, one vertex per column,
 * and its blend chain's rows between them); then each host and part chain
 * once as a face on its own grid, the bisection stations of the body's chord
 * tolerance (`AutoMovieHumanLoftStations.bisect`) and its own uniform
 * phases, trimmed by every rail that lies on it. A face's end left open by
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
    if (merges.length === 0) return diagnostics;
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

    // Then every host and part chain as one trimmed face.
    const poles: { at: number; chain: string; station: number; point: Vec3 }[] = [];
    for (const [name, trims] of loops) {
      const chain: IAutoMovieHumanLoftChain = context.chains.get(name)!;
      const s: IAutoMovieHumanSolidSurface = surfaces.get(name)!;
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      const stations: number[] = AutoMovieHumanLoftStations.bisect(chain, first, last, context.tolerance);
      const phases: number[] = Array.from({ length: chain.samples }, (_: unknown, k: number): number => (2 * Math.PI * k) / chain.samples);
      groups.push({ name: `${name}/solid`, start: mesh.indices.length });
      const open: number[][] = AutoMovieHumanSolidMesh.face(mesh, { surface: s, stations, phases, loops: trims, inverted: inverted.has(name) });

      // An open end closes on the chain's pole, or is reported.
      for (const cycle of open) {
        const station: number = mesh.coordinates[3 * cycle[0]! + 1]!;
        const end: "bottom" | "top" = Math.abs(station - first) <= Math.abs(station - last) ? "bottom" : "top";
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
    context.mesh.positions.push(...mesh.positions);
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
    return diagnostics;
  }
}
