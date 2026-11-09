import { AutoMovieMeshExtract, AutoMovieViewAxis, closestPointOnSegmentXZ, createAutoMovieMeshRayCaster, type IAutoMovieLoftChain, tessellateAutoMovieContourStrip64 } from "@automovie/engine";

import { AutoMovieHumanF1Trace } from "../generation/AutoMovieHumanF1Trace";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanF1Fork } from "../generation/trunk/AutoMovieHumanF1Fork";
import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureSpecs } from "../inspection/CaptureSpecs";
import { NodeTrunkArchive } from "./NodeTrunkArchive";
import { NodeTrunkCaptureGeometry } from "./NodeTrunkCaptureGeometry";
import type { NodeTrunkArmscye } from "./NodeTrunkArmscye";

type V3 = CaptureModel.Vec3;
type V2 = [number, number];

type TrunkRail = NodeTrunkArmscye.TrunkRail;
type ShoulderSkin = NodeTrunkArmscye.ShoulderSkin;

const { exactReferenceVertices, readNeck, withoutClosingMarker }: typeof NodeTrunkArchive = NodeTrunkArchive;

const { armDot, indexedTrunkReceipt, increasingPhase, edgeSense, medianReference, drawn, add, sub, scale, cross, STEP, LOFT }: typeof NodeTrunkCaptureGeometry = NodeTrunkCaptureGeometry;

/** Connect archived trunk sections with the measured fork, neck and shoulders. */
export namespace NodeTrunkSkin {
  /** Original open upper-chest chains and endpoints shown in the joins capture. */
  export type UpperCuts = {
    /** The measured open source chains displayed in the join inspection. */
    lines: CaptureModel.ILine[];
    /** Close-up camera targets at the original cut endpoints. */
    ports: CaptureModel.IPort[];
  };

  /** Join the original trunk rails, including the observed waist where the native comparison exceeded tolerance. */
  export function connectedArchive(
    name: string,
    mesh: AutoMovieMeshExtract.IMesh,
    axis: AutoMovieViewAxis.IAxis,
    observations: ReadonlyMap<number, V2[]>,
    cuts: number[],
    fork: AutoMovieHumanF1Fork.IResult,
    armscye: [number, number],
    shoulder: ShoulderSkin,
    forkSections: ReadonlyMap<number, V3[]>,
    upper: UpperCuts,
    diagnostics: string[],
    ms: Record<string, number>,
  ): CaptureModel.IPart {
    const start: number = performance.now();
    const waistCuts: number[] = cuts.filter((cut: number): boolean => cut >= 1000 && cut <= 1190);
    const waistBounds: [number, number] = [waistCuts[0]!, waistCuts[waistCuts.length - 1]!];
    const stations: number[] = waistCuts.filter((_: number, i: number): boolean => i % (STEP.layer / STEP.cut) === 0 || i + 1 === waistCuts.length);
    const fit: AutoMovieHumanF1Trace.IOutput = AutoMovieHumanF1Trace.create({ name: `${name}.waist`, mesh, axis, cuts: waistCuts, stations, order: LOFT.order, samples: LOFT.samples }, observations);
    const measured: AutoMovieHumanF1Trace.ILayer[] = fit.layers.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.fault === null);
    const within: number = measured.filter((layer: AutoMovieHumanF1Trace.ILayer): boolean => layer.max <= AutoMovieHumanF1Trace.TOLERANCE).length;
    const native: IAutoMovieLoftChain | null = fit.part !== null && within > 0 && within === fit.layers.length ? fit.loft?.chain ?? null : null;
    const waistMaximum: string = measured.length === 0 ? "unreadable" : `${Math.max(...measured.map((layer: AutoMovieHumanF1Trace.ILayer): number => layer.max)).toFixed(3)} mm`;
    // Preserve the original closed rings through the waist when its single native chart misses their measured shape.
    diagnostics.push(`waist ${waistBounds[0].toFixed(3)}–${waistBounds[1].toFixed(3)} mm: ${within}/${fit.layers.length} native source and midpoint sections within 0.5 mm, ${fit.layers.length - measured.length} unreadable; ${native === null ? "loft the original observed contours" : "retain the measured native chart"}.`);
    const neckY: number = 1458;
    const neck: V3[] | null = readNeck(mesh, axis, diagnostics);
    const forkY: number = fork.parentPlane.centroid[1];
    const from: number = Math.min(...fork.ring.map((point: V3): number => point[1]));
    const z: number = axis.at(waistBounds[0]).origin[2]!;
    const capture: CaptureModel.IPart = CaptureSpecs.part({
      part: name,
      frames: [{ name: "world", parent: null, basis: { kind: "derived", rule: "F1 source world millimetres with Z negated" }, relative: AutoMovieHumanArmCurveSpec.IDENTITY }],
      root: AutoMovieHumanArmCurveSpec.IDENTITY,
      placement: "F1 source world",
      specs: native === null || fit.part === null ? [] : drawn(fit.part, axis, waistBounds, `${name}.waist`),
      axis: (): null => null,
      chain: native,
      ports: [
        { name: "fork", frame: "world", point: fork.parentPlane.centroid, radius: Math.max(...fork.ring.map((point: V3): number => Math.hypot(...sub(point, fork.parentPlane.centroid)))) },
        ...shoulder.part.ports.map((port: CaptureModel.IPort) => ({ ...port, frame: "world" })),
        ...upper.ports.map((port: CaptureModel.IPort) => ({ ...port, frame: "world" })),
      ],
      diagnostics,
      relations: { parent: null, children: ["head", "arm.left", "arm.right", "leg.left", "leg.right"], shares: ["head", "arm.left", "arm.right", "leg.left", "leg.right"], basis: "measured trunk edges before assembling the neighbouring parts" },
      reference: { status: "available", mesh: medianReference(mesh, [from, neckY], z), cropToLoft: false, measures: { fromY: from, toY: neckY }, method: "original trunk skin in source world" },
      milliseconds: ms,
    });
    if (capture.loft.status !== "available") {
      if (native !== null) throw new Error(capture.loft.cause);
      capture.loft = { status: "available", lines: [], clay: { positions: [], indices: [] }, diagnostics };
    }
    capture.loft.lines.push(...upper.lines);
    const clay: CaptureModel.ITriangles = capture.loft.clay;

    // Reuse each ordered rail's vertex objects and their existing indices so
    // the adjacent strips meet along one indexed edge rather than two copies.
    const vertex: Map<V3, number> = new Map();
    const outline = (s: number, loop: readonly V2[]): V3[] => {
      const { origin }: ReturnType<AutoMovieViewAxis.IAxis["at"]> = axis.at(s);
      return increasingPhase(loop.map(([u, v]: V2): V3 => [origin[0]! + u, s, origin[2]! + v]));
    };
    const rings: Map<number, V3[]> = new Map();
    rings.set(forkY, increasingPhase(withoutClosingMarker(fork.ring, "fork", diagnostics)));
    for (const [station, points] of forkSections) rings.set(station, points);
    for (const [s, loop] of observations) rings.set(s, outline(s, loop));
    if (neck === null) diagnostics.push("the exact neck boundary at 1458 mm has no holding reference loop");
    else rings.set(neckY, neck);

    // Use the already emitted native vertices on both waist rails.
    if (native !== null) {
      const y: number[] = clay.positions.filter((_: number, i: number): boolean => i % 3 === 1);
      for (const [station, height] of [[waistBounds[0], Math.min(...y)], [waistBounds[1], Math.max(...y)]]) {
        const ring: V3[] = [];
        for (let i: number = 0; i < y.length; ++i) {
          if (y[i] !== height) continue;
          const point: V3 = [clay.positions[3 * i]!, clay.positions[3 * i + 1]!, clay.positions[3 * i + 2]!];
          vertex.set(point, i);
          ring.push(point);
        }
        rings.set(station!, ring);
      }
    }

    let ordered: number[] = [forkY, ...forkSections.keys(), ...cuts, neckY];
    let joinedShoulder: [number, number] | null = null;
    diagnostics.push(...shoulder.part.diagnostics);
    if (shoulder.part.loft.status === "available" && shoulder.rails !== null) {
      const [lower, upper]: [TrunkRail, TrunkRail] = shoulder.rails;
      const skin: CaptureModel.ITriangles = shoulder.part.loft.clay;
      const start: number = clay.positions.length / 3;
      const flip: boolean = lower.direction > 0;
      for (const value of skin.positions) clay.positions.push(value);
      for (let i: number = 0; i < skin.indices.length; i += 3)
        clay.indices.push(start + skin.indices[i]!, start + skin.indices[i + (flip ? 2 : 1)]!, start + skin.indices[i + (flip ? 1 : 2)]!);
      for (const rail of shoulder.rails) {
        rings.set(rail.station, rail.points);
        for (const [i, point] of rail.points.entries()) vertex.set(point, start + rail.indices[i]!);
      }
      joinedShoulder = [lower.station, upper.station];
      ordered = [...ordered.filter((station: number): boolean => station < lower.station || station > upper.station), lower.station, upper.station].sort((a: number, b: number): number => a - b);
      capture.loft.lines.push(...shoulder.part.loft.lines);
    }
    let strips: number = 0;
    let retainedEdges: number = 0;
    let shoulderEdges: number = 0;
    for (let i: number = 1; i < ordered.length; ++i) {
      const low: number = ordered[i - 1]!;
      const high: number = ordered[i]!;
      if (native !== null && low >= waistBounds[0] && high <= waistBounds[1]) continue;
      if (joinedShoulder !== null && low === joinedShoulder[0] && high === joinedShoulder[1]) continue;
      if (joinedShoulder === null && low < armscye[1] && high > armscye[0]) {
        diagnostics.push(`no strip ${low.toFixed(3)} to ${high.toFixed(3)} mm: the original armscye band needs its own trimmed boundaries`);
        continue;
      }
      const before: V3[] | undefined = rings.get(low);
      const after: V3[] | undefined = rings.get(high);
      if (before === undefined || after === undefined) {
        diagnostics.push(`no strip ${low.toFixed(3)} to ${high.toFixed(3)} mm: an original boundary is unavailable`);
        continue;
      }
      const triangles: [V3, V3, V3][] = [];
      let fault: string | null = null;
      try {
        tessellateAutoMovieContourStrip64(before, after, (a: V3, b: V3, c: V3): void => { triangles.push([a, b, c]); }, undefined, (observation): void => {
          if (!observation.qualified) fault = observation.diagnostics.join(" | ") || "the ordinary strip did not qualify";
        });
      } catch (error: unknown) {
        fault = error instanceof Error ? error.message : String(error);
      }
      const a: number = edgeSense(before, triangles);
      const b: number = edgeSense(after, triangles);
      if (fault !== null || Math.abs(a) !== before.length || Math.abs(b) !== after.length || Math.sign(a) === Math.sign(b)) {
        diagnostics.push(`no strip ${low.toFixed(3)} to ${high.toFixed(3)} mm: ${fault ?? "the original edge order was not retained"}`);
        continue;
      }
      for (const [p, q, r] of triangles) {
        const oriented: [V3, V3, V3] = a < 0 ? [p, q, r] : [p, r, q];
        for (const point of oriented) {
          let id: number | undefined = vertex.get(point);
          if (id === undefined) {
            id = clay.positions.length / 3;
            vertex.set(point, id);
            clay.positions.push(...point);
          }
          clay.indices.push(id);
        }
      }
      strips += 1;
      if (high === waistBounds[0]) retainedEdges += after.length;
      if (low === waistBounds[1]) retainedEdges += before.length;
      if (high === joinedShoulder?.[0]) shoulderEdges += after.length;
      if (low === joinedShoulder?.[1]) shoulderEdges += before.length;
    }
    ms.connected = performance.now() - start;
    if (name === "trunk.joins")
      auditTrunkJoins(mesh, clay, axis, fork, rings.get(forkY)!, waistBounds.map((station: number) => ({ station, points: rings.get(station)! })), vertex, capture.ports, capture.loft.lines, diagnostics);
    diagnostics.unshift(`The measured armscye band is ${armscye[0].toFixed(3)} to ${armscye[1].toFixed(3)} mm; ${shoulderEdges} actual shoulder-to-trunk rail edges are shared by index.`, ...indexedTrunkReceipt(clay));
    diagnostics.unshift(`archived trunk: ${observations.size}/${cuts.length} original closed cuts; ${strips} ordinary strips; ${retainedEdges} waist boundary edges shared by index; tested native waist maximum ${waistMaximum}`);
    capture.diagnostics = diagnostics;
    capture.loft.diagnostics = diagnostics;
    console.log(diagnostics.join("\n"));
    return capture;
  }

  /** Read the existing indexed fork and chest joints against the same original planes. */
  function auditTrunkJoins(
    mesh: AutoMovieMeshExtract.IMesh,
    clay: CaptureModel.ITriangles,
    axis: AutoMovieViewAxis.IAxis,
    fork: AutoMovieHumanF1Fork.IResult,
    forkRing: V3[],
    waist: { station: number; points: V3[] }[],
    vertex: ReadonlyMap<V3, number>,
    ports: CaptureModel.IPort[],
    lines: CaptureModel.ILine[],
    diagnostics: string[],
  ): void {
    const physical: AutoMovieMeshExtract.IMesh = exactReferenceVertices(mesh);
    const reference = createAutoMovieMeshRayCaster({
      positions: Array.from(mesh.positions, (value: number): number => value / 1000),
      indices: Array.from(mesh.indices),
      normals: null,
      uvs: null,
      skin: null,
    });
    const point = (surface: AutoMovieMeshExtract.IMesh, i: number): V3 => [surface.positions[3 * i]!, surface.positions[3 * i + 1]!, surface.positions[3 * i + 2]!];
    const faceNormal = (surface: AutoMovieMeshExtract.IMesh, first: number): V3 => {
      const a: V3 = point(surface, surface.indices[first]!);
      return cross(sub(point(surface, surface.indices[first + 1]!), a), sub(point(surface, surface.indices[first + 2]!), a));
    };
    const ray = (origin: V3, direction: V3, min: number = 0, max: number = Infinity) =>
      reference.nearestHit(scale(origin, 0.001), direction, max / 1000, min / 1000);
    const angle = (a: V3, b: V3, unoriented: boolean = false): number => {
      const cosine: number = armDot(a, b) / (Math.hypot(...a) * Math.hypot(...b));
      return Math.acos(Math.max(-1, Math.min(1, unoriented ? Math.abs(cosine) : cosine))) * 180 / Math.PI;
    };
    const key = (a: number, b: number): string => a < b ? `${a},${b}` : `${b},${a}`;
    const arcs = (ring: V3[]) => ring.map((a: V3, i: number) => {
      const b: V3 = ring[(i + 1) % ring.length]!;
      return { edge: key(vertex.get(a)!, vertex.get(b)!), middle: scale(add(a, b), 0.5), normals: [] as V3[] };
    });
    const forkEdges = arcs(forkRing);
    const waistEdges = waist.map(({ station, points }, index: number) => ({ station, label: index === 0 ? "Lower waist" : "Lower chest", edges: arcs(points) }));
    const wanted = new Map([...forkEdges, ...waistEdges.flatMap(({ edges }) => edges)].map((edge) => [edge.edge, edge]));
    for (let i: number = 0; i < clay.indices.length; i += 3)
      for (let e: number = 0; e < 3; ++e) {
        const edge = wanted.get(key(clay.indices[i + e]!, clay.indices[i + (e + 1) % 3]!));
        if (edge !== undefined) edge.normals.push(faceNormal(clay, i));
      }
    const describe = (label: string, values: number[]): void => {
      const sorted: number[] = values.filter(Number.isFinite).sort((a: number, b: number): number => a - b);
      if (sorted.length === 0) diagnostics.push(`${label}: no comparable samples.`);
      else diagnostics.push(`${label}: ${sorted.length} samples, median ${sorted[Math.floor(sorted.length / 2)]!.toFixed(3)}, p95 ${sorted[Math.ceil(sorted.length * 0.95) - 1]!.toFixed(3)}, max ${sorted.at(-1)!.toFixed(3)}.`);
    };
    const pivot: V3 = fork.parentPlane.centroid;
    describe("Fork outer rim body-side tangent-plane difference from its raw face, degrees", forkEdges.flatMap(({ middle, normals }): number[] => {
      if (normals.length !== 1) return [];
      const direction: V3 = sub(middle, pivot);
      const reach: number = Math.hypot(...direction);
      const hit = ray(pivot, direction, Math.max(0, reach - 0.5), reach + 0.5);
      return hit === null ? [] : [angle(normals[0]!, faceNormal(mesh, hit.triangle * 3), true)];
    }));
    for (const { label, station, edges } of waistEdges) {
      describe(`${label} y${station.toFixed(3)} actual two-face indexed dihedral, degrees`, edges.flatMap(({ normals }): number[] => normals.length === 2 ? [angle(normals[0]!, normals[1]!)] : []));
      const center: V3 = axis.at(station).origin as V3;
      describe(`${label} original normals at the same rays one millimetre either side, degrees`, edges.flatMap(({ middle }): number[] => {
        const direction: V3 = [middle[0] - center[0], 0, middle[2] - center[2]];
        const below = ray([center[0], station - 1, center[2]], direction);
        const above = ray([center[0], station + 1, center[2]], direction);
        return below === null || above === null ? [] : [angle(faceNormal(mesh, below.triangle * 3), faceNormal(mesh, above.triangle * 3))];
      }));
    }

    const read = (surface: AutoMovieMeshExtract.IMesh, height: number) => AutoMovieMeshExtract.outline(surface, { origin: [0, height, 0], axes: [[0, 1, 0], [1, 0, 0], [0, 0, 1]] }, [0], 0, AutoMovieHumanF1Trace.TOLERANCE, 0)[0]!;
    const chestY: number = waist[1]!.station;
    const lowerY: number = waist[0]!.station;
    for (const height of [835, lowerY - STEP.cut, lowerY, lowerY + STEP.cut, chestY - STEP.cut, chestY, chestY + STEP.cut]) {
      const raw: AutoMovieMeshExtract.ISection = read(physical, height);
      const built: AutoMovieMeshExtract.ISection = read(clay, height);
      const segments: [V2, V2][] = raw.loops.flatMap(({ points, closed }): [V2, V2][] => points.slice(closed ? 0 : 1).map((p: V2, i: number): [V2, V2] => [points[(i + points.length - Number(closed)) % points.length]!, p]));
      let peak: { point: V2; gap: number } | undefined;
      for (const { points } of built.loops)
        for (const [x, z] of points) {
          let gap: number = Infinity;
          for (const [[ax, az], [bx, bz]] of segments) {
            const closest = closestPointOnSegmentXZ({ x, z }, { x: ax, z: az }, { x: bx, z: bz });
            gap = Math.min(gap, Math.hypot(x - closest.x, z - closest.z));
          }
          if (Number.isFinite(gap) && (peak === undefined || gap > peak.gap)) peak = { point: [x, z], gap };
        }
      const id: string = height === 835 ? "pelvis-835" : `${height < chestY - STEP.cut ? "lower-waist" : "lower-chest"}-${height.toFixed(3)}`;
      for (const [name, section, colour] of [["raw", raw, "9e3265"], ["clay", built, "1d70ad"]] as const)
        for (const [index, loop] of section.loops.entries())
          lines.push({ id: `${id}.${name}.${index}`, closed: loop.closed, colour, points: loop.points.map(([x, z]: V2): V3 => [x, height, z]) });
      diagnostics.push(`${id}: ${built.loops.length} body-only chains, ${raw.loops.length} raw chains, body-only vertex to raw segment maximum ${peak === undefined ? "unreadable" : `${peak.gap.toFixed(3)} mm at (${peak.point[0]}, ${height}, ${peak.point[1]})`}; original flags ${raw.flags.join(" | ") || "none"}.`);
      if (peak !== undefined && (height === 835 || height === lowerY || height === chestY)) ports.push({ name: id, point: [peak.point[0], height, peak.point[1]], radius: 45 });
    }
  }
}
