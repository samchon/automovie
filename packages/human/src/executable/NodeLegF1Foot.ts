import fs from "node:fs";

import { AutoMovieMeshCourse, AutoMovieViewAxis, type AutoMovieMeshExtract } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFootWebTrim } from "../generation/foot/AutoMovieHumanFootWebTrim";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeLegF1Archive } from "./NodeLegF1Archive";
import { NodeLegF1Rings } from "./NodeLegF1Rings";
import type { NodeTrunkReference } from "./NodeTrunkReference";

/**
 * The F1 foot and toe boundaries, native web and terminal skin.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps this source contract with its region owner.
 */
export namespace NodeLegF1Foot {
  type V2 = NodeLegF1Archive.V2;
  type V3 = NodeLegF1Archive.V3;
  type Side = NodeLegF1Archive.Side;
  type Frame = NodeLegF1Archive.Frame;
  type IArchiveStation = NodeLegF1Archive.IArchiveStation;

  /** Original limb chart operations and archive names. */
  const { SOURCE, DIGITS, chartLoop, place, world, scale, sub }: typeof NodeLegF1Archive = NodeLegF1Archive;

  /** Existing closed-ring comparisons and physical ray reads. */
  const { sampleRay, sectionDeviation }: typeof NodeLegF1Rings = NodeLegF1Rings;

  const Trace: typeof AutoMovieHumanF1Trace = AutoMovieHumanF1Trace;
  const Geometry: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;

  interface IFootBoundary {
    name: string;
    frame: Frame;
    points: V3[];
    error: number;
  }

  /**
   * Read the single forefoot seed and each observed root from the native triangles.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function footBoundaries(
    side: Side,
    seed: Frame,
    seedLoop: V2[],
    mesh: AutoMovieMeshExtract.IMesh,
  ): { ports: IFootBoundary[]; diagnostics: string[] } {
    const code = side === "left" ? "l" : "r";
    const sources = [{ name: "toe-web seed", frame: seed, loop: seedLoop }];
    for (const [i, digit] of DIGITS.entries()) {
      const family = `${digit}_${code}`;
      const path = HumanNodePaths.resolve(`${SOURCE}/${family}/${family}-root-v3-001.json`);
      const pack: { stations: IArchiveStation[] } = JSON.parse(fs.readFileSync(path, "utf8"));
      const root = pack.stations[0];
      const loops = root?.loops.filter((loop): boolean => loop.kind === "closed");
      if (pack.stations.length !== 1 || root === undefined || loops?.length !== 1)
        throw new Error(`foot.${side}: toe ${i + 1} lacks its one observed root contour`);
      const frame: Frame = { origin: world(root.originMm), u: world(root.u), v: scale(world(root.v), -1) };
      sources.push({ name: `toe ${i + 1} root`, frame, loop: chartLoop(loops[0]!.curve, frame) });
    }
    const planes = sources.map(({ name, frame, loop }, station): AutoMovieMeshCourse.IPlane => {
      const centre = AutoMovieMeshCourse.centroid(loop.map((uv): V3 => place(frame, uv)));
      if (centre === null) throw new Error(`foot.${side}: ${name} has no area centroid`);
      return { station, origin: centre, u: frame.u as V3, v: frame.v as V3 };
    });
    const cuts = AutoMovieMeshCourse.cut(mesh, planes, Trace.TOLERANCE);
    const diagnostics: string[] = [];
    const ports = sources.flatMap(({ name, frame, loop }, i): IFootBoundary[] => {
      const cut = cuts[i]!;
      if (cut.loop === null) {
        diagnostics.push(`${name}: no holding native outer ring (${cut.flags.join(", ")}).`);
        return [];
      }
      const plane = planes[i]!;
      const actual: Frame = { origin: plane.origin, u: plane.u, v: plane.v };
      const observed = loop.map((uv): V2 => {
        const p = sub(place(frame, uv), plane.origin);
        return [Geometry.dot(p, plane.u), Geometry.dot(p, plane.v)];
      });
      const error = sectionDeviation(observed, cut.loop);
      if (error > Trace.TOLERANCE) {
        diagnostics.push(`${name}: native contour differs from its observed boundary by ${error.toFixed(3)} mm.`);
        return [];
      }
      return [{ name, frame: actual, points: cut.loop.map((uv): V3 => place(actual, uv)), error }];
    });
    return { ports, diagnostics };
  }

  type Face = [number, number, number];
  type INativeSkin = { points: V3[]; faces: Face[] };
  type INativeWeb = { skin: INativeSkin; seed: V3[]; roots: V3[][] };

  /**
   * Select the native surface on the forward side of one observed boundary.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function nativeHalfSkin(
    reference: NodeTrunkReference.IMesh,
    side: Side,
    seed: Pick<IFootBoundary, "name" | "frame" | "points">,
  ): { skin: INativeSkin; ring: V3[] } {
    const welded = new Map<string, number>();
    const skin: INativeSkin = { points: [], faces: [] };
    const key = (p: V3): string => p.join(",");
    const add = (p: V3): number => {
      const existing = welded.get(key(p));
      if (existing !== undefined) return existing;
      const index = skin.points.length;
      skin.points.push(p);
      welded.set(key(p), index);
      return index;
    };
    const normal = AutoMovieViewAxis.normal(seed.frame) as V3;
    const origin = seed.frame.origin as V3;
    const direction = side === "left" ? -1 : 1;
    for (const face of reference.triangles) {
      const triangle = face.map((i): V3 => reference.points[i]!);
      if (triangle.every((p): boolean => direction * p[2] > 0) && triangle.some((p): boolean => Geometry.dot(sub(p, origin), normal) >= 0)) {
        const ids = triangle.map(add) as Face;
        if (new Set(ids).size === 3) skin.faces.push(ids);
      }
    }
    skin.faces = splitSkin(skin, seed.frame).positive;
    const seeds = skinComponents(skin.faces).flatMap((faces) => matchingRims(skin.points, faces, seed));
    if (seeds.length !== 1) throw new Error(`foot.${side}: native ${seed.name} matched ${seeds.length} clipped boundary rings`);
    const [parent] = seeds;
    skin.faces = parent!.faces;
    return { skin, ring: parent!.ring.map((id): V3 => skin.points[id]!) };
  }

  /**
   * Clip the native web with its actual seed and five disjoint root planes.
   * The leg seed is the last regular host section. Each digit plane removes
   * only the distal component with the corresponding observed root rim.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function nativeWeb(reference: NodeTrunkReference.IMesh, side: Side, ports: IFootBoundary[]): INativeWeb {
    if (ports.length !== DIGITS.length + 1) throw new Error(`foot.${side}: the native web needs all six measured boundaries`);
    const { skin } = nativeHalfSkin(reference, side, ports[0]!);
    for (const port of ports.slice(1)) {
      const { positive, negative } = splitSkin(skin, port.frame);
      const components = skinComponents(positive);
      const matches = components.flatMap((faces) => matchingRims(skin.points, faces, port));
      if (matches.length !== 1) throw new Error(`foot.${side}: ${port.name} matched ${matches.length} disjoint native skin components`);
      const match = matches[0]!;
      skin.faces = negative.concat(...components.filter((faces): boolean => faces !== match.faces));
    }
    const rims = ports.map((port): number[] => {
      const result = matchingRims(skin.points, skin.faces, port);
      if (result.length !== 1) throw new Error(`foot.${side}: ${port.name} has ${result.length} matching rims on the retained skin`);
      return result[0]!.ring;
    });
    const expected = new Set(rims.flatMap((ring) => ring.map((id, i): string => edgeKey(id, ring[(i + 1) % ring.length]!))));
    const incidence = new Map<string, number>();
    for (const face of skin.faces) for (let k = 0; k < 3; ++k) {
      const key = edgeKey(face[k]!, face[(k + 1) % 3]!);
      incidence.set(key, (incidence.get(key) ?? 0) + 1);
    }
    for (const [edge, count] of incidence) if (count !== (expected.has(edge) ? 1 : 2))
      throw new Error(`foot.${side}: retained native skin has unexpected edge incidence ${count}`);
    const [rim, ...digits] = rims.map((ring): V3[] => ring.map((id): V3 => skin.points[id]!));
    return { skin, seed: rim!, roots: digits };
  }

  /** Clip the observed indexed foot through one recorded toe plane. */
  export const splitSkin: typeof AutoMovieHumanFootWebTrim.splitSkin = AutoMovieHumanFootWebTrim.splitSkin;

  /** Read connected sheets using the actual clipped mesh indices. */
  export const skinComponents: typeof AutoMovieHumanFootWebTrim.skinComponents = AutoMovieHumanFootWebTrim.skinComponents;

  function edgeKey(a: number, b: number): string {
    return a < b ? `${a},${b}` : `${b},${a}`;
  }

  function matchingRims(points: V3[], faces: Face[], port: Pick<IFootBoundary, "name" | "frame" | "points">): { faces: Face[]; ring: number[] }[] {
    return AutoMovieHumanFootWebTrim.matchingRims(points, faces, port, Trace.TOLERANCE);
  }

  /**
   * Sew the observed foot or toe rings by shared vertex indices.
   * Reuse exact boundary coordinates to join the host, native skin and digit
   * pieces. Every rim edge must have one use in each direction before the
   * receipt authorizes the body to omit separate toes.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function sewWeb(
    host: CaptureModel.ILoft,
    web: INativeWeb,
    toes: CaptureModel.IPart[],
    diagnostics: string[],
    surfaceName: string = "forefoot",
  ): CaptureModel.ILoft {
    if (host.status !== "available") throw new Error(host.cause);
    const rings = [web.seed, ...web.roots];
    const key = (point: V3): string => point.join(",");
    const boundary = new Set(rings.flatMap((ring): string[] => ring.map(key)));
    const shared = new Map<string, number>();
    const positions: number[] = [];
    const indices: number[] = [];
    const append = (clay: CaptureModel.ITriangles): void => {
      const remap = new Map<number, number>();
      for (const source of clay.indices) {
        let target = remap.get(source);
        if (target === undefined) {
          const point: V3 = [clay.positions[source * 3]!, clay.positions[source * 3 + 1]!, clay.positions[source * 3 + 2]!];
          const id = key(point);
          target = shared.get(id);
          if (target === undefined) {
            target = positions.length / 3;
            positions.push(...point);
            if (boundary.has(id)) shared.set(id, target);
          }
          remap.set(source, target);
        }
        indices.push(target);
      }
    };
    append(host.clay);
    const patchFrom = indices.length;
    append({ positions: web.skin.points.flat(), indices: web.skin.faces.flat() });
    const patchTo = indices.length;
    const lines = [...host.lines];
    for (const toe of toes) {
      if (toe.loft.status !== "available") throw new Error(`${toe.name}: ${toe.loft.cause}`);
      append(toe.loft.clay);
      for (const line of toe.loft.lines) lines.push({ ...line, id: `${toe.name}:${line.id}` });
    }
    const edges = new Map<string, [number, number]>();
    for (const ring of rings) for (let k = 0; k < ring.length; ++k) {
      const a = shared.get(key(ring[k]!));
      const b = shared.get(key(ring[(k + 1) % ring.length]!));
      if (a === undefined || b === undefined || a === b) throw new Error("A native web seam is absent or collapsed in the assembled skin");
      edges.set(edgeKey(a, b), [0, 0]);
    }
    const check = (): boolean => {
      for (const count of edges.values()) {
        count[1] = 0;
        count[0] = 0;
      }
      for (let i = 0; i < indices.length; i += 3) for (let k = 0; k < 3; ++k) {
        const a = indices[i + k]!;
        const b = indices[i + (k + 1) % 3]!;
        const count = edges.get(edgeKey(a, b));
        if (count !== undefined) ++count[a < b ? 0 : 1];
      }
      return [...edges.values()].every(([forward, backward]): boolean => forward === 1 && backward === 1);
    };
    if (!check()) {
      // The raw capture conversion reflects Z. Reversing the whole native skin
      // preserves its geometry and lets the actual edge uses decide its winding.
      for (let i = patchFrom; i < patchTo; i += 3) [indices[i + 1], indices[i + 2]] = [indices[i + 2]!, indices[i + 1]!];
      if (!check()) throw new Error("The native web and generated parts do not have reciprocal use of every shared edge");
    }
    diagnostics.push(`Sewn native ${surfaceName} skin: ${web.skin.faces.length} retained triangles, ${rings.length === 6 ? "six matching rims" : "one matching rim"} and ${edges.size} reciprocal shared edges.`);
    return { status: "available", lines, clay: { positions, indices }, diagnostics: CaptureSpecs.counted(diagnostics) };
  }

  /** Read a disappearing digit branch's native vertex and test it against its last observed plane. */
  /**
   * Read the digit’s native terminal event and admit its actual vertex only beyond the final plane.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function observedToeTip(
    family: string,
    side: Side,
    last: Frame,
    reference: NodeTrunkReference.IMesh,
  ): { point: V3 | null; diagnostic: string } {
    const code = side === "left" ? "l" : "r";
    const path = HumanNodePaths.resolve(`${SOURCE}/records/foot_${code}-terminal-v1.json`);
    const record: {
      terminal: { events: { name: string; pointMm: V3; lowerComponents: number; upperComponents: number }[] };
      splits: { name: string; branches: { owners: string[] }[] }[];
    } = JSON.parse(fs.readFileSync(path, "utf8"));
    const matches = record.terminal.events.flatMap((event): { name: string; point: V3; forward: number }[] => {
      const i = record.splits.findIndex((split): boolean => split.name === event.name);
      if (i < 1 || event.lowerComponents !== 1 || event.upperComponents !== 0) return [];
      const owners = (index: number): Set<string> => new Set(record.splits[index]!.branches.flatMap((branch): string[] => branch.owners));
      if (!owners(i - 1).has(family) || owners(i).has(family)) return [];
      const native = world(event.pointMm);
      const point = reference.points.find((p): boolean => Math.hypot(...sub(p, native)) < 1e-7);
      if (point === undefined) return [];
      const forward = Geometry.dot(sub(point, last.origin as V3), AutoMovieViewAxis.normal(last) as V3);
      return [{ name: event.name, point, forward }];
    });
    const distal = matches.filter((event): boolean => event.forward > 0);
    if (distal.length === 1) {
      const { name, point, forward } = distal[0]!;
      return { point, diagnostic: `Terminal event ${name} owns the native toe vertex ${forward.toFixed(3)} mm beyond the last observed plane.` };
    }
    return {
      point: null,
      diagnostic: `The terminal event record has ${distal.length} native vertices beyond the last observed plane for this digit.`,
    };
  }

  /**
   * Read the native instep cut where the existing strip departs from its source.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the measured source in its original chart and preserves its existing construction.
   */
  export function observedFootMidpoints(
    rows: readonly IArchiveStation[],
    axis: AutoMovieViewAxis.IAxis,
    mesh: AutoMovieMeshExtract.IMesh,
    observations: Map<number, V2[]>,
  ): { station: number; label: string; points: number }[] {
    const instep = rows.findIndex((row): boolean => row.station === 217);
    const segments: { label: string; from: IArchiveStation; to: IArchiveStation }[] = [];
    // The native instep arch between F1 archive sections 217 and 218 departs from the straight strip.
    if (instep >= 0 && rows[instep + 1]?.station === 218)
      segments.push({ label: "Observed instep turn", from: rows[instep]!, to: rows[instep + 1]! });
    const planes = segments.map(({ from, to }): AutoMovieMeshCourse.IPlane => {
      const station = (from.stationMm + to.stationMm) / 2;
      const frame = axis.at(station);
      return { station, origin: frame.origin as V3, u: frame.u as V3, v: frame.v as V3 };
    });
    return AutoMovieMeshCourse.cut(mesh, planes, Trace.TOLERANCE, 0).map(({ plane, loop }, i) => {
      const regular = loop !== null && Array.from({ length: 72 }, (_, k): boolean => {
        const phi = k * Math.PI / 36;
        return sampleRay(plane, loop, Math.cos(phi), Math.sin(phi)) !== null;
      }).every(Boolean);
      if (regular) observations.set(plane.station, loop);
      return { station: plane.station, label: segments[i]!.label, points: regular ? loop.length : 0 };
    });
  }
}
