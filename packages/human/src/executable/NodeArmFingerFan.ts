import {
  AutoMovieContourLoftCurves64,
  AutoMovieMeshCourse,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
  tessellateAutoMovieContourLoft64,
} from "@automovie/engine";
import { type IAutoMovieRecoverySlabObservation, observeAutoMovieRecoverySections } from "@automovie/recovery";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { CaptureModel } from "../inspection/CaptureModel";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = CaptureModel.Vec3;

/** Observe the four finger ports in the original middle-finger planes. */
export namespace NodeArmFingerFan {
  /** One observed native-world cut and its closed original curve. */
  export interface IPhysicalDigitRow {
    /** Recorded archive row label for matching the course's original sections. */
    station: number;

    /** Distance along the recorded digit course in millimetres. */
    stationMm: number;

    /** Cutting-plane origin in native reference-world millimetres. */
    originMm: V3;

    /** Observed unit cutting-plane normal in native reference-world axes. */
    normal: V3;

    /** First unit tangent of the original section chart in native reference-world axes. */
    u: V3;

    /** Second unit tangent in the original section chart's handedness. */
    v: V3;

    /** Signed cut coordinate in millimetres used to recover the source slab. */
    coordinateMm: number;

    /** Closed source Bézier contours in native reference-world millimetres. */
    loops: { curve: IAutoMovieCurve64.Cubic }[];
  }

  /** Sample a closed source curve with the diagnostic's physical chord tolerance. */
  export function sample(curve: IAutoMovieCurve64.Cubic): V3[] {
    return AutoMovieContourLoftCurves64.tessellate(curve, 0.1).map(({ p }): V3 => p);
  }

  /** The actual generated branch, its proximal opening, and its four owned distal openings. */
  export interface IResult {
    /** Indexed fan loft in native reference-world metres, with its connection rims open. */
    mesh: CaptureModel.ITriangles;

    /** Ordered palm-side boundary vertices in native reference-world metres, with implicit closure. */
    proximal: V3[];

    /** Four separately owned digit boundaries in native reference-world metres, with implicit closure. */
    distal: Readonly<Record<"index" | "middle" | "ring" | "pinky", V3[]>>;
  }

  /** Trace the source manifold and retain each original saddle and ring. */
  export function create(side: "l" | "r", whole: IPhysicalDigitRow[], verticesMm: V3[], triangles: [number, number, number][]): IResult {
    const name: string = `middle_${side}`;
    const source: IPhysicalDigitRow[] = whole.slice(4, 11);
    const coordinatesMm: number[] = source.map((row): number => row.coordinateMm);
    const slabPairs = coordinatesMm.slice(1).map((afterMm: number, i: number) => ({
      beforeMm: coordinatesMm[i]!, afterMm,
    }));
    const slabs: IAutoMovieRecoverySlabObservation[] = [];
    const observed = observeAutoMovieRecoverySections({
      name, verticesMm, triangles, axis: source[0]!.normal, reference: source[0]!.u,
      coordinatesMm, slabPairs, toleranceMm: 0.2, maxSpans: 256,
      exactCoordinateAliases: true, sourceOrientationSign: 1, cornerDegrees: 45,
    }, { curveFormat: "bezier", onSourceSlab: (slab): void => { slabs.push(slab); } });
    if (!("value" in observed) || slabs.length !== slabPairs.length)
      throw new Error(`Original section observations refused: ${observed.diagnostics.join("; ")}`);
    const rows: number[][] = [];
    const intervalGroups: { before: number[]; after: number[]; event: IAutoMovieRecoverySlabObservation["events"][number] | undefined }[][] = [];

    // Along the original middle-finger course, rows 4–5, 8–9 and 9–10
    // separate the pinky, ring and index ports in that order.
    const splitRows: number[] = [0, 4, 5];
    for (let i: number = 0; i < slabPairs.length; ++i) {
      const slab = slabs.find((item): boolean => item.boundsMm[0] === slabPairs[i]!.beforeMm && item.boundsMm[1] === slabPairs[i]!.afterMm);
      if (!slab) throw new Error("The original slab did not retain its exact requested coordinate pair");
      const localEvent = slab.events.filter(({ qualified, pointMm: [x, y, z] }): boolean =>
        qualified && x > 150 && x < 240 && y > 900 && y < 975 && z * (side === "l" ? 1 : -1) > 420);
      if (localEvent.length !== Number(splitRows.includes(i)))
        throw new Error(`Original row ${i + 4} has unexpected qualified branch incidence`);
      const ports = (component: (typeof slab.components)[number], end: "before" | "after"): number[] =>
        component.cycles.filter((cycle): boolean => cycle.side === end).map((cycle): number => {
          const port = slab.ports.find((candidate): boolean => cycle.portIds.length === 1 && candidate.id === cycle.portIds[0]);
          if (!port || port.status !== "unique-component" || port.publication.kind !== "closed")
            throw new Error(`Unqualified original ${end} loop at row ${i + 4}`);
          return port.publication.loopIndex;
        });
      if (i === 0) {
        const first = slab.components.find(({ id }): boolean => localEvent[0]!.components.includes(id));
        if (!first) throw new Error("The first measured saddle has no original component");
        rows.push(ports(first, "before"));
      }
      const groups: (typeof intervalGroups)[number] = [];
      for (const component of slab.components) {
        const owns = slab.ports.some((port): boolean => port.side === "before" && port.publication.kind === "closed" &&
          rows[i]!.includes(port.publication.loopIndex) && port.components.includes(component.id));
        if (!owns) continue;
        const before: number[] = ports(component, "before");
        const after: number[] = ports(component, "after");
        const event = localEvent.find(({ components }): boolean => components.includes(component.id));
        if (!component.topology.manifold || !component.topology.orientable || component.issueCodes.length !== 0 ||
          before.length !== 1 || !rows[i]!.includes(before[0]!) || after.length !== (event === undefined ? 1 : 2))
          throw new Error(`Unqualified original continuation at row ${i + 4}`);
        groups.push({ before, after, event });
      }
      const next: number[] = groups.flatMap(({ after }): number[] => after).sort((a, b): number => a - b);
      if (groups.length !== rows[i]!.length || new Set(next).size !== next.length)
        throw new Error(`Original ports do not partition row ${i + 4}`);
      rows.push(next);
      intervalGroups.push(groups);
    }
    const candidate = (start: number, initial: number): number | undefined => {
      let loop: number = initial;
      for (const groups of intervalGroups.slice(start)) {
        const owner = groups.find(({ before }): boolean => before.includes(loop));
        if (!owner || owner.after.length !== 1) return undefined;
        loop = owner.after[0]!;
      }
      return loop;
    };
    const afterSplit = (interval: number): number[] =>
      intervalGroups[interval]!.find(({ event }): boolean => event !== undefined)!.after;
    const detached = (interval: number): number => {
      const leaves: number[] = afterSplit(interval).flatMap((index): number[] => {
        const leaf = candidate(interval + 1, index);
        return leaf === undefined ? [] : [leaf];
      });
      if (leaves.length !== 1) throw new Error("The measured detached port is not unique");
      return leaves[0]!;
    };
    const observedSections = observed.value.sections;
    const final: number = observedSections.length - 1;
    const archiveLoop: V3[] = sample(source[final]!.loops[0]!.curve);
    const compare = (points: readonly V3[], target: readonly V3[]): number => Math.max(...points.map((point): number =>
      Math.min(...target.map((a, index): number => {
        const b: V3 = target[(index + 1) % target.length]!;
        const d: V3 = NodeArmDraw.sub(b, a);
        const q: V3 = NodeArmDraw.sub(point, a);
        const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
        const length2: number = S.dot(d, d);
        const t: number = length2 === 0 ? 0 : Math.max(0, Math.min(1, S.dot(q, d) / length2));
        return Math.hypot(...NodeArmDraw.sub(q, NodeArmDraw.scale(d, t)));
      }))));
    const scores = afterSplit(5).map((index): { index: number; errorMm: number } => {
      const loop = observedSections[final]!.loops[index];
      if (!loop) throw new Error("Original last-saddle port has no fitted loop");
      const points: V3[] = sample(loop.curve);
      return { index, errorMm: Math.max(compare(archiveLoop, points), compare(points, archiveLoop)) };
    }).sort((a, b): number => a.errorMm - b.errorMm);
    if (scores[0]!.errorMm > 0.5 || scores[1]!.errorMm <= 0.5)
      throw new Error(`Middle archive ownership is unresolved: ${JSON.stringify(scores)}`);
    const named: Record<string, number> = { pinky: detached(0), ring: detached(4), index: scores[1]!.index, middle: scores[0]!.index };
    if (new Set(Object.values(named)).size !== 4 || rows[final]!.length !== 4)
      throw new Error("The measured fan did not preserve four separate distal rings");
    const sections: IAutoMovieContourLoft64.ISection[] = rows.map((list, i): IAutoMovieContourLoft64.ISection => ({
      coordinateMm: coordinatesMm[i]!,
      loops: list.map((index) => {
        const loop = observedSections[i]!.loops[index];
        if (!loop) throw new Error(`Original row ${i + 4} loop ${index} has no observed curve`);
        return i === final && index === named.middle ? { ...loop, curve: source[i]!.loops[0]!.curve } : loop;
      }),
    }));
    const events: IAutoMovieContourLoft64.IEvent[] = [];
    const intervals: IAutoMovieContourLoft64.IInterval[] = intervalGroups.map((groups, i): IAutoMovieContourLoft64.IInterval => {
      const beforeMm: number = coordinatesMm[i]!;
      const afterMm: number = coordinatesMm[i + 1]!;
      return { beforeMm, afterMm, groups: groups.map(({ before, after, event }) => {
        const a: number[] = before.map((index): number => rows[i]!.indexOf(index));
        const b: number[] = after.map((index): number => rows[i + 1]!.indexOf(index));
        if (event) events.push({
          name: event.id, kind: "saddle", regular: event.qualified, terminal: null,
          coordinateMm: event.coordinateMm, beforeMm, afterMm, before: a, after: b,
        });
        return { before: a, after: b, supported: true, reason: null };
      }) };
    });
    const generated = tessellateAutoMovieContourLoft64({ sections, events, intervals, chordToleranceMm: 0.1 });
    const row10: number = rows[final]!.indexOf(named.middle);
    const ring = generated.construction.find(({ id }): boolean => id.endsWith(`.section.${final}.loop.${row10}`));
    if (generated.mesh.indices === null || ring === undefined || generated.unresolved.length !== 0)
      throw new Error("The fan has no complete actual middle root boundary");
    const proximal: V3[] | undefined = generated.construction.find(({ id }): boolean => id.endsWith(".section.0.loop.0"))?.points;
    if (!proximal) throw new Error("The original finger fan has no proximal ring");
    const distal = (name: "index" | "ring" | "pinky"): V3[] => {
      const index: number = rows[final]!.indexOf(named[name]!);
      const points: V3[] | undefined = generated.construction.find(({ id }): boolean =>
        id.endsWith(`.section.${final}.loop.${index}`))?.points;
      if (!points) throw new Error(`The original ${name} port is missing`);
      return points;
    };
    return {
      mesh: { positions: generated.mesh.positions, indices: generated.mesh.indices },
      proximal,
      distal: { index: distal("index"), middle: ring.points, ring: distal("ring"), pinky: distal("pinky") },
    };
  }

  /** Observe a physical cut between two known original end planes. */
  export function between(
    mesh: { positions: readonly number[]; indices: readonly number[] },
    before: readonly V3[],
    after: readonly V3[],
    origins: [V3, V3],
    normals: [V3, V3],
    reference: V3,
    unitMm: number = 1000,
  ): { ring?: { points: V3[]; origin: V3; u: V3; v: V3; normal: V3 }; receipt: Record<string, unknown> } {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const centre = (ring: readonly V3[]): V3 => NodeArmDraw.scale(ring.reduce(add, [0, 0, 0]), unitMm / ring.length);
    const sum: V3 = add(normals[0], normals[1]);
    const normal: V3 = S.unit(sum);
    const offset: number = (S.dot(normals[0], origins[0]) + S.dot(normals[1], origins[1])) / Math.hypot(...sum);
    const middle: V3 = NodeArmDraw.scale(add(centre(before), centre(after)), 0.5);
    const origin: V3 = add(middle, NodeArmDraw.scale(normal, offset - S.dot(middle, normal)));
    const u: V3 = S.unit(NodeArmDraw.sub(reference, NodeArmDraw.scale(normal, S.dot(reference, normal))));
    const v: V3 = S.cross(u, normal);
    const cut = AutoMovieMeshCourse.cut({ positions: mesh.positions.map((x): number => x * unitMm), indices: mesh.indices },
      [{ station: 0, origin, u, v }], 0.5, 0)[0]!;
    const d = (p: V3, o: V3, n: V3): number => S.dot(NodeArmDraw.sub(NodeArmDraw.scale(p, unitMm), o), n);
    const diagnostics = { origin, normal, holding: cut.loop !== null, pieces: cut.pieces, flags: cut.flags, area: cut.area,
      beforeMm: -Math.max(...before.map((p): number => d(p, origin, normal))), afterMm: Math.min(...after.map((p): number => d(p, origin, normal))) };
    if (cut.loop === null) return { receipt: diagnostics };
    const points: V3[] = cut.loop.map(([x, y]): V3 => NodeArmDraw.scale(add(origin, add(NodeArmDraw.scale(u, x), NodeArmDraw.scale(v, y))), 1 / unitMm));
    if (Math.hypot(...NodeArmDraw.sub(points[0]!, points[points.length - 1]!)) < 1e-12) points.pop();
    const lower: number = Math.min(...points.map((p): number => d(p, origins[0], normals[0])));
    const upper: number = -Math.max(...points.map((p): number => d(p, origins[1], normals[1])));
    const receipt = { ...diagnostics, lower, upper, points: points.length };
    if (Math.min(diagnostics.beforeMm, diagnostics.afterMm, lower, upper) <= 1e-6) return { receipt };
    return { ring: { points, origin, u, v, normal }, receipt };
  }
}
