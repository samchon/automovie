import {
  AutoMovieSolidBody,
  AutoMovieSolidChain,
  AutoMovieSolidMesh,
  AutoMovieSolidVector,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBodySurface,
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanSurfaceBoundary,
  IAutoMovieHumanSurfaceContext,
  IAutoMovieHumanSurfaceMerge,
  IAutoMovieLoftChain,
  IAutoMovieLoftContract,
  IAutoMovieSolidBody,
  IAutoMovieSolidMesh,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftStations } from "../lofting/AutoMovieHumanLoftStations";
import { AutoMovieHumanBodySurfaceRead } from "./AutoMovieHumanBodySurfaceRead";
import { AutoMovieHumanNailSurface } from "./nail/AutoMovieHumanNailSurface";

type Vec3 = AutoMovieVector3Tuple;

/**
 * The skin of the solids: every chain a merge or diff names, and every face of
 * a published body (`IAutoMovieHumanBodyCalibration.bodies`, merges onto merged
 * hosts), drawn by the solid tessellation (`AutoMovieSolidMesh`) into the
 * body's mesh with the body's loft coordinates.
 *
 * Each merge's seam is drawn first (its two rails, one vertex per column, and
 * its blend chain's rows between them); then each host and part chain once as a
 * face on its own grid, the bisection stations of the body's chord tolerance
 * (`AutoMovieHumanLoftStations.bisect`) and its own uniform phases, trimmed by
 * every rail that lies on it. A face's end that an event owns (a contact ring
 * of the ring loft, today's neck on a new trunk) keeps that ring: the face
 * stops a station short and its edge is bridged to the ring's shared vertices
 * (`AutoMovieSolidMesh.bridge`), so the two tessellations meet watertight. A
 * face's end left open by its trims closes on the chain's pole by a fan, the
 * apex's phase NaN as for every pole of the body. Every other vertex carries
 * `[chain, station, phase]` on the chain that evaluated it, the blend's on its
 * blend chain, so the normals, the binding and the chart read them as they read
 * any lofted vertex. Triangle groups are `<chain>/solid`.
 *
 * Each chain must carry its jets (`AutoMovieLoftJet.carries`): the view
 * operator's chains and the blend chains do. A merge naming a chain without
 * them, or a face end left open without a pole, is one diagnostic and the merge
 * or the end is left out.
 */
export namespace AutoMovieHumanBodySurfaceSolids {
  /**
   * The chains the solids draw.
   *
   * @param calibration The calibration.
   * @returns Their names.
   */
  export function names(
    calibration: IAutoMovieHumanBodyCalibration,
  ): Set<string> {
    const out: Set<string> = new Set();
    for (const m of calibration.merges ?? []) {
      out.add(m.blend);
      out.add(m.host);
      out.add(m.part);
    }
    for (const b of calibration.bodies ?? [])
      for (const f of b.faces) out.add(f.chain);
    return out;
  }

  /**
   * Draw every merge's seam and faces into the body's mesh.
   *
   * @param context The body's surface context.
   * @param calibration The calibration.
   * @param observe Optional observer of the prepared solid charts used by the
   *   skin.
   * @param observePlate Receives each plate actually retained in the skin.
   * @returns Every broken premise.
   */
  export function draw(
    context: IAutoMovieHumanSurfaceContext,
    calibration: IAutoMovieHumanBodyCalibration,
    observe?: IAutoMovieHumanBodySurface.SolidObserver,
    observePlate?: (plate: IAutoMovieLoftChain) => void,
  ): IAutoMovieLoftContract.IDiagnostic[] {
    const diagnostics: IAutoMovieLoftContract.IDiagnostic[] = [];
    const merges: IAutoMovieHumanSurfaceMerge[] = calibration.merges ?? [];
    if (merges.length === 0 && (calibration.bodies ?? []).length === 0)
      return diagnostics;
    const report: (contract: string, detail: string) => void = (
      contract: string,
      detail: string,
    ): void => {
      diagnostics.push({ producer: "body.solids", level: 7, contract, detail });
    };

    // Prepare the original surface range selected by the complete body and
    // its shared points. A published face remains its own explicit owner.
    const published = new Map<string, IAutoMovieSolidSurface>();
    const explicit = new Map<string, { stations: number[]; phases?: number[] }>();
    const required = names(calibration);
    for (const body of calibration.bodies ?? []) {
      for (const point of body.points) required.add(point.chain);
      for (const face of body.faces)
        if (face.surface !== undefined) {
          published.set(face.chain, face.surface);
          explicit.set(face.chain, {
            stations: face.stations ?? [],
            phases: face.samplePhases,
          });
        }
    }
    const surfaces: Map<string, IAutoMovieSolidSurface> = new Map(
      [...required].flatMap((name): [string, IAutoMovieSolidSurface][] => {
        const owned = published.get(name);
        if (owned !== undefined) return [[name, owned]];
        const chain = context.chains.get(name);
        const surface =
          chain === undefined ? null : AutoMovieSolidChain.surface(chain);
        return surface === null ? [] : [[name, surface]];
      }),
    );
    const surface = (name: string): IAutoMovieSolidSurface | null =>
      surfaces.get(name) ?? null;

    // Seams first: their rails become the faces' trims.
    const mesh: IAutoMovieSolidMesh.IMesh = { ...AutoMovieSolidMesh.create(), normals: [] };
    const groups: { name: string; start: number }[] = [];
    const gridReads: IAutoMovieSolidMesh.IGridReport[] = [];
    const loops: Map<string, IAutoMovieSolidMesh.ILoop[]> = new Map();
    const domains: Map<string, IAutoMovieSolidMesh.ILoop[]> = new Map();
    const grids: Map<
      string,
      NonNullable<IAutoMovieSolidBody.IPublished["faces"][number]["grid"]>
    > = new Map();
    const inverted: Set<string> = new Set();
    const terminals = new Map<string, IAutoMovieSolidMesh.ITerminal>();
    for (const m of merges) {
      const host: IAutoMovieSolidSurface | null = surface(m.host);
      const part: IAutoMovieSolidSurface | null = surface(m.part);
      const blend: IAutoMovieSolidSurface | null = surface(m.blend);
      if (host === null || part === null || blend === null) {
        report(
          "solid chains",
          `merge ${m.blend}: ${[m.host, m.part, m.blend].filter((n: string): boolean => surface(n) === null).join(", ")} carries no jets or is missing`,
        );
        continue;
      }
      groups.push({ name: `${m.blend}/solid`, start: mesh.indices.length });
      const joined: IAutoMovieSolidMesh.IJoined = AutoMovieSolidMesh.seam(
        mesh,
        {
          host,
          part,
          blend,
          length: m.length,
          hostLoop: m.hostLoop,
          partLoop: m.partLoop,
          rows: m.rows,
        },
      );
      loops.set(m.host, [...(loops.get(m.host) ?? []), joined.host]);
      loops.set(m.part, [...(loops.get(m.part) ?? []), joined.part]);
      if (m.diff === true) inverted.add(m.part);
    }

    // Each published body: one vertex per shared boundary point, and its
    // faces' original domain sides and actual cuts in their distinct roles.
    for (const body of calibration.bodies ?? []) {
      const ids: (number | null)[] = body.points.map(
        (p: { chain: string; chart: [number, number] }): number | null => {
          const s: IAutoMovieSolidSurface | null = surface(p.chain);
          if (s === null) return null;
          return AutoMovieSolidMesh.vertex(
            mesh,
            s.point?.(p.chart[0], p.chart[1]) ??
              s.jet(p.chart[0], p.chart[1]).p,
            AutoMovieSolidMesh.owner(mesh, s),
            p.chart[0],
            p.chart[1],
          );
        },
      );
      const missing: string[] = body.faces
        .map(
          (f: IAutoMovieSolidBody.IPublished["faces"][number]): string =>
            f.chain,
        )
        .filter((n: string): boolean => surface(n) === null);
      if (
        missing.length > 0 ||
        ids.some((v: number | null): boolean => v === null)
      ) {
        report(
          "solid chains",
          `body ${body.name}: ${[...new Set(missing)].join(", ")} carries no jets or is missing`,
        );
        continue;
      }
      for (const f of body.faces) {
        /**
         * Both roles retain the same published point identities and this-face
         * chart.
         */
        const restore: (
          c: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number],
        ) => IAutoMovieSolidMesh.ILoop = (
          c: IAutoMovieSolidBody.IPublished["faces"][number]["cycles"][number],
        ): IAutoMovieSolidMesh.ILoop => ({
          kind: c.kind,
          vertices: c.points.map((k: number): number => ids[k]!),
          chart: c.chart,
          ...(c.along === undefined ? {} : { along: c.along }),
          ...(c.partition === true
            ? { partition: true, segments: c.segments }
            : {}),
        });
        const trims: IAutoMovieSolidMesh.ILoop[] = f.cycles.map(restore);
        loops.set(f.chain, [...(loops.get(f.chain) ?? []), ...trims]);
        if (f.domainLoops !== undefined)
          domains.set(f.chain, [
            ...(domains.get(f.chain) ?? []),
            ...f.domainLoops.map(restore),
          ]);
        if (f.grid !== undefined) grids.set(f.chain, f.grid);
        if (f.inverted === true) inverted.add(f.chain);
        if (f.terminal !== undefined) terminals.set(f.chain, f.terminal.prepare);
      }
    }

    // Then every host and part chain as one trimmed face. An end that an
    // event owns (a contact ring at the chain's far end, made before this
    // step by the events' ring loft) keeps that ring: the face's grid stops
    // one station short of it and its edge there is bridged to the ring's
    // shared vertices.
    const poles: { at: number; chain: string; station: number; point: Vec3 }[] =
      [];
    const bridges: {
      chain: string;
      ring: number[];
      cycle: number[];
      out: Vec3;
    }[] = [];
    const appendFace = AutoMovieSolidBody.prepareFaces(mesh);
    const nailSources: ReadonlyMap<string, IAutoMovieHumanDigitNails.IPlaced> =
      new Map(
        calibration.nailSources?.map((source) => [
          source.original.source.name,
          source,
        ]),
      );
    for (const [name, trims] of loops) {
      const chain: IAutoMovieLoftChain = context.chains.get(name)!;
      const s: IAutoMovieSolidSurface = surfaces.get(name)!;
      const grid: IAutoMovieSolidBody.IPublished["faces"][number]["grid"] =
        grids.get(name);
      const terminal = terminals.get(name);
      if (terminal !== undefined) {
        groups.push({ name: `${name}/solid`, start: mesh.indices.length });
        appendFace({
          surface: s,
          stations: [],
          phases: [],
          loops: trims,
          inverted: inverted.has(name),
          terminal,
          onFailure: (detail): void =>
            report("terminal face triangulation", name + ": " + detail),
        });
        continue;
      }
      const first: number = chain.layers[0]!.y;
      const last: number = chain.layers[chain.layers.length - 1]!.y;
      const ringOf: (end: "bottom" | "top") => number[] | null = (
        end: "bottom" | "top",
      ): number[] | null => {
        const b: IAutoMovieHumanSurfaceBoundary | undefined =
          context.boundaries.get(`${name}:${end}`);
        return b !== undefined && (b.kind === "own" || b.kind === "inherited")
          ? b.ring
          : null;
      };
      const rings: { bottom: number[] | null; top: number[] | null } = {
        bottom: ringOf("bottom"),
        top: ringOf("top"),
      };
      const bottomTip: number | null =
        rings.bottom === null
          ? AutoMovieHumanBodySurfaceRead.capHeight(chain, "bottom")
          : null;
      const topTip: number | null =
        rings.top === null
          ? AutoMovieHumanBodySurfaceRead.capHeight(chain, "top")
          : null;

      // Retained positive cap sections share the actual public Point0 owner.
      // Only the exact collapsed tips are left to the endpoint fan; event
      // boundaries do not restore an end that assembly already cut away.
      const from = grid?.stations[0] ?? bottomTip ?? first;
      const to = grid?.stations[1] ?? topTip ?? last;
      const rows = explicit.has(name)
        ? AutoMovieHumanLoftStations.bisectRings(
            [
              from,
              ...explicit.get(name)!.stations.filter((y) => y > from && y < to),
              to,
            ],
            (phases) => {
              if (s.pointAlong !== undefined) {
                const lines = phases.map((phase) => s.pointAlong!(phase));
                return (station) => lines.map((line) => line(station));
              }
              return (station) => {
                const point =
                  s.pointAt?.(station) ??
                  ((phase: number): Vec3 => s.jet(station, phase).p);
                return phases.map(point);
              };
            },
            context.tolerance,
          )
        : AutoMovieHumanLoftStations.bisect(chain, from, to, context.tolerance);
      const regular = (sampled: number[]): number[] => {
        let stations: number[] = sampled.filter(
          (station: number): boolean =>
            station !== bottomTip && station !== topTip,
        );
        if (grid === undefined && rings.bottom !== null)
          stations = stations.slice(1);
        if (grid === undefined && rings.top !== null)
          stations = stations.slice(0, -1);
        return stations;
      };
      const stations: number[] = regular(rows);
      if (stations.length < 2) {
        report(
          "closed face",
          `${name}: its event rings leave ${stations.length} stations of its own`,
        );
        continue;
      }
      const phases: number[] = explicit.get(name)?.phases ?? Array.from(
        { length: chain.samples },
        (_: unknown, k: number): number =>
          grid === undefined
            ? (2 * Math.PI * k) / chain.samples
            : grid.phases[0] +
              (s.period !== undefined
                ? (s.period * k) / chain.samples
                : ((grid.phases[1] - grid.phases[0]) * k) /
                  (chain.samples - 1)),
      );
      groups.push({ name: `${name}/solid`, start: mesh.indices.length });
      const face: IAutoMovieSolidMesh.IFace = {
        surface: s,
        stations,
        phases,
        loops: trims,
        domainLoops: domains.get(name),
        inverted: inverted.has(name),
        onFailure: (detail: string): void =>
          report("face triangulation", `${name}: ${detail}`),
        onGrid: observe === undefined ? undefined : (read): void => { gridReads.push(read); },
      };
      const nail: IAutoMovieHumanDigitNails.IPlaced | undefined =
        nailSources.get(name);
      let retained: AutoMovieHumanNailSurface.IRetained | undefined;
      if (nail !== undefined) {
        try {
          retained = AutoMovieHumanNailSurface.append(
            mesh,
            face,
            nail,
            { range: [from, to], chord: context.tolerance, regular },
            appendFace,
          );
        } catch (error: unknown) {
          report(
            "native indexed nail",
            `${name}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      const open: IAutoMovieSolidMesh.IOpen[] =
        retained?.open ?? appendFace(face);
      const drawn: IAutoMovieSolidSurface = retained?.surface ?? s;
      if (retained !== undefined) {
        groups.push({
          name: `${retained.plate.name}/solid`,
          start: retained.plateFrom,
        });
        groups.push({ name: `${name}/solid`, start: mesh.indices.length });
        context.chains.set(name, retained.skin);
        surfaces.set(name, drawn);
        observePlate?.(retained.plate);
      }

      // An open end meets its event's ring, closes on the chain's pole, or is reported.
      for (const boundary of open) {
        const cycle: number[] = boundary.vertices;
        const end: "bottom" | "top" | null = boundary.end;
        if (cycle.length === 0 || end === null) continue;
        const station: number = boundary.chart[0]![0];
        const ring: number[] | null = rings[end];
        if (ring !== null) {
          const j: IAutoMovieSolidSurface.IJet = drawn.jet(
            station,
            boundary.chart[0]![1],
          );
          const n: Vec3 = AutoMovieSolidVector.cross(j.u, j.v);
          const sign: number =
            drawn.orientation * (inverted.has(name) ? -1 : 1);
          bridges.push({
            chain: name,
            ring,
            cycle,
            out: [n[0] * sign, n[1] * sign, n[2] * sign],
          });
          continue;
        }
        const pole: IAutoMovieLoftChain["pole"] =
          chain.pole?.end === end
            ? chain.pole
            : chain.opposite?.end === end
              ? chain.opposite
              : undefined;
        if (pole === undefined) {
          report(
            "closed face",
            `${name}: its ${end} end at station ${station} mm is left open by its trims and has no pole`,
          );
          continue;
        }
        const apex: number = AutoMovieSolidMesh.vertex(
          mesh,
          pole.point,
          NaN,
          NaN,
          NaN,
        );
        poles.push({
          at: apex,
          chain: name,
          station: pole.source?.station ?? (end === "bottom" ? first : last),
          point: pole.point,
        });
        const fan: [number, number, number][] = cycle.map(
          (v: number, k: number): [number, number, number] => [
            v,
            cycle[(k + 1) % cycle.length]!,
            apex,
          ],
        );
        AutoMovieSolidMesh.close(mesh, fan, drawn, inverted.has(name));
      }
    }

    // Into the body's buffers, owners turned into chain indices.
    const offset: number = context.mesh.positions.length / 3;
    context.solidNormals = { start: 3 * offset, values: mesh.normals! };
    while (context.coordinates.length < 3 * offset)
      context.coordinates.push(NaN);
    const chainOf: number[] = mesh.owners.map(
      (o: IAutoMovieSolidMesh.IOwner): number =>
        context.indices.get(o.name) ?? NaN,
    );
    // One by one: a spread of a whole mesh's buffer overflows the call stack.
    for (const x of mesh.positions) context.mesh.positions.push(x);
    for (let v: number = 0; v < mesh.coordinates.length / 3; v++) {
      const owner: number = mesh.coordinates[3 * v]!;
      context.coordinates.push(
        Number.isFinite(owner) ? chainOf[owner]! : NaN,
        mesh.coordinates[3 * v + 1]!,
        mesh.coordinates[3 * v + 2]!,
      );
    }
    for (const p of poles) {
      context.coordinates[3 * (offset + p.at)] = context.indices.get(p.chain)!;
      context.coordinates[3 * (offset + p.at) + 1] = p.station;
    }
    groups.forEach((g: { name: string; start: number }, k: number): void => {
      AutoMovieHumanLoftMesh.group(context.mesh, g.name);
      const end: number = groups[k + 1]?.start ?? mesh.indices.length;
      for (let i: number = g.start; i < end; i++)
        context.mesh.indices.push(mesh.indices[i]! + offset);
    });

    // The bands to the event rings, on the body's buffers where the rings live.
    const view: IAutoMovieSolidMesh.IMesh = {
      positions: context.mesh.positions,
      indices: [],
      coordinates: [],
      owners: [],
    };
    for (const b of bridges) {
      AutoMovieHumanLoftMesh.group(context.mesh, `${b.chain}/solid`);
      const band: [number, number, number][] = AutoMovieSolidMesh.bridge(
        view,
        b.ring,
        b.cycle.map((v: number): number => v + offset),
        b.out,
      );
      for (const t of band) context.mesh.indices.push(t[0], t[1], t[2]);
    }
    observe?.(surfaces, gridReads);
    return diagnostics;
  }
}
