import {
  AutoMovieMeshCourse,
  type IAutoMovieContourLoft64,
  type IAutoMovieCurve64,
  AutoMovieCurveMath64 as Vector,
  tessellateAutoMovieContourLoft64,
  tessellateAutoMovieContourStrip64,
} from "@automovie/engine";

import contours from "./AutoMovieHumanTrunkF1Contours.json";
import { AutoMovieHumanTrunkF1Section } from "./AutoMovieHumanTrunkF1Section";
import type { AutoMovieHumanTrunkPorts } from "./AutoMovieHumanTrunkPorts";

/** A recorded absolute world-mm point or unit direction. */
type V3 = AutoMovieHumanTrunkF1Section.V3;
/** Indexed shoulder skin in the recorded capture-world axes and millimetres. */
type Mesh = AutoMovieHumanTrunkF1Section.Mesh;
/** Retain the engine's original binary64 vector operations. */
const { add, sub, scale }: typeof Vector = Vector;
/** Retain the same exact section ownership and phase conventions as the trunk. */
const {
  edgeSense,
  increasingPhase,
  point,
}: typeof AutoMovieHumanTrunkF1Section = AutoMovieHumanTrunkF1Section;
/** Project a world displacement onto its recorded cutting-plane normal. */
const armDot: (a: V3, b: V3) => number = (a: V3, b: V3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** The two measured shoulder saddles and the short strips to the shared arm roots. */
export namespace AutoMovieHumanTrunkArmscye {
  /** One original trunk rail and its positions in the emitted shoulder skin. */
  export type TrunkRail = {
    /** Height of the archived horizontal rail in millimetres. */
    station: number;
    /** Ordered capture-world points in millimetres. */
    points: V3[];
    /** Position indices in the emitted shoulder mesh in the same order. */
    indices: number[];
    /** Signed directed use of the rail by the retained shoulder triangles. */
    direction: number;
  };

  /** Realize the observed branch incidence and preserve each exact distal arm rail. */
  export function f1(arms: AutoMovieHumanTrunkPorts.IFixed["arm"]): {
    skin: Mesh;
    rails: [TrunkRail, TrunkRail];
  } {
    // These are the 27 ordered section inputs and the actual two saddle events
    // consumed by the accepted capture. Do not resample or refit the cubics.
    const sections: IAutoMovieContourLoft64.ISection[] = contours.sections.map(
      ({
        coordinateMm,
        loops,
      }: (typeof contours.sections)[number]): IAutoMovieContourLoft64.ISection => ({
        coordinateMm,
        loops: loops.map(
          ({
            winding,
            curve,
          }: (typeof contours.sections)[number]["loops"][number]): IAutoMovieContourLoft64.ISection["loops"][number] => ({
            winding: winding === -1 ? -1 : 1,
            curve: {
              type: "cubicBezier",
              name: curve.name,
              closed: true,
              unit: "mm",
              phaseUnit: "mm",
              phaseIntervals: curve.phaseIntervals,
              spans: curve.spans.map(
                (span: readonly number[][]): IAutoMovieCurve64.Span => [
                  point(span[0]!),
                  point(span[1]!),
                  point(span[2]!),
                  point(span[3]!),
                ],
              ),
            },
          }),
        ),
      }),
    );
    const stations: number[] = sections.map(
      ({ coordinateMm }: IAutoMovieContourLoft64.ISection): number =>
        coordinateMm,
    );
    const events: IAutoMovieContourLoft64.IEvent[] = contours.events.map(
      (
        event: (typeof contours.events)[number],
      ): IAutoMovieContourLoft64.IEvent => ({
        ...event,
        kind: "saddle",
        terminal: null,
      }),
    );
    const generated: IAutoMovieContourLoft64.IResult =
      tessellateAutoMovieContourLoft64({
        sections,
        intervals: contours.intervals,
        events,
        chordToleranceMm: contours.chord,
      });
    if (generated.unresolved.length !== 0)
      throw new Error(`F1 armscye: ${JSON.stringify(generated.unresolved)}`);
    const positions: number[] = generated.mesh.positions.map(
      (value: number, index: number): number =>
        value * (index % 3 === 2 ? -1000 : 1000),
    );
    const indices: number[] = [];
    for (let i: number = 0; i < (generated.mesh.indices?.length ?? 0); i += 3)
      indices.push(
        generated.mesh.indices![i]!,
        generated.mesh.indices![i + 2]!,
        generated.mesh.indices![i + 1]!,
      );
    let skin: Mesh = { positions, indices };

    for (const [index, side] of (["left", "right"] as const).entries()) {
      const measured: (typeof contours.collars)[number] =
        contours.collars[index]!;
      const origin: V3 = point(measured.origin);
      const normal: V3 = point(measured.normal);
      const distal:
        | IAutoMovieContourLoft64.IResult["construction"][number]
        | undefined = generated.construction.find(
        (
          loop: IAutoMovieContourLoft64.IResult["construction"][number],
        ): boolean =>
          loop.id.endsWith(`.section.0.loop.${side === "left" ? 2 : 1}`),
      );
      if (distal === undefined)
        throw new Error(`F1 armscye: the ${side} source seed is missing`);
      const seed: V3[] = distal.points.map(
        ([x, y, z]: V3): V3 => [1000 * x, 1000 * y, -1000 * z],
      );
      // The recorded plane is the actual accepted s64.75 trim, followed by
      // the observed s66.25 holding contour and the shared s68 root.
      const trim: ReturnType<typeof trimArmscye> = trimArmscye(
        skin,
        origin,
        normal,
        seed,
      );
      skin = armCollar(
        trim.skin,
        trim.boundary,
        trim.boundaryIndices,
        [measured.points.map(point), [...arms[side]]],
        normal,
      );
    }

    const lower: TrunkRail | null = shoulderRail(
      skin,
      generated.construction,
      0,
      stations[0]!,
    );
    const upper: TrunkRail | null = shoulderRail(
      skin,
      generated.construction,
      stations.length - 1,
      stations.at(-1)!,
    );
    if (lower === null || upper === null || lower.direction === upper.direction)
      throw new Error(
        "F1 armscye: the two original trunk rails did not remain opposite free cycles",
      );
    return { skin, rails: [lower, upper] };
  }

  /** Read one original horizontal rail back from the actual emitted index boundary. */
  export function shoulderRail(
    skin: Mesh,
    construction: IAutoMovieContourLoft64.IResult["construction"],
    section: number,
    station: number,
  ): TrunkRail | null {
    const original:
      | IAutoMovieContourLoft64.IResult["construction"][number]
      | undefined = construction.find(
      (
        loop: IAutoMovieContourLoft64.IResult["construction"][number],
      ): boolean => loop.id.endsWith(`.section.${section}.loop.0`),
    );
    if (original === undefined) return null;
    const points: V3[] = increasingPhase(
      original.points.map(
        ([x, y, z]: V3): V3 => [x * 1000, y * 1000, z * -1000],
      ),
    );
    const candidates: Map<string, number | null> = new Map(
      points.map((point: V3): [string, null] => [point.join(","), null]),
    );
    const used: Set<number> = new Set(skin.indices);
    for (const vertex of used) {
      const key: string = skin.positions
        .slice(3 * vertex, 3 * vertex + 3)
        .join(",");
      if (!candidates.has(key)) continue;
      if (candidates.get(key) !== null) return null;
      candidates.set(key, vertex);
    }
    const indices: number[] = [];
    for (const point of points) {
      const vertex: number | null | undefined = candidates.get(point.join(","));
      if (vertex === null || vertex === undefined) return null;
      indices.push(vertex);
    }
    const faces: [number, number, number][] = [];
    for (let i: number = 0; i < skin.indices.length; i += 3)
      faces.push([
        skin.indices[i]!,
        skin.indices[i + 1]!,
        skin.indices[i + 2]!,
      ]);
    const sense: number = edgeSense(indices, faces);
    return Math.abs(sense) === indices.length
      ? { station, points, indices, direction: Math.sign(sense) }
      : null;
  }

  /** Cut only the positive-side sheet connected to the actual distal arm ring. */
  export function trimArmscye(
    mesh: Mesh,
    origin: V3,
    normal: V3,
    seed: readonly V3[],
  ): { skin: Mesh; boundary: V3[]; boundaryIndices: number[] } {
    const positions: number[] = [...mesh.positions];

    /** Read an existing local vertex without changing the clipping arithmetic. */
    const at: (i: number) => V3 = (i: number): V3 => [
      positions[3 * i]!,
      positions[3 * i + 1]!,
      positions[3 * i + 2]!,
    ];
    const length: number = positions.length / 3;
    const sign: number[] = Array.from(
      { length },
      (_: unknown, i: number): number => armDot(sub(at(i), origin), normal),
    );
    const parents: Int32Array = Int32Array.from(
      { length },
      (_: unknown, i: number): number => i,
    );

    /** Find the positive-side connected component containing an original seed vertex. */
    const owner: (index: number) => number = (index: number): number => {
      while (parents[index] !== index) {
        parents[index] = parents[parents[index]!]!;
        index = parents[index]!;
      }
      return index;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const positive: number[] = mesh.indices
        .slice(i, i + 3)
        .filter((vertex: number): boolean => sign[vertex]! > 0);
      for (let j: number = 1; j < positive.length; ++j)
        parents[owner(positive[j]!)] = owner(positive[0]!);
    }
    const source: Set<string> = new Set(
      seed.map((point: V3): string => point.join(",")),
    );
    const components: Set<number> = new Set();
    for (const vertex of mesh.indices)
      if (sign[vertex]! > 0 && source.has(at(vertex).join(",")))
        components.add(owner(vertex));
    if (components.size !== 1)
      throw new Error(
        `the observed distal ring meets ${components.size} positive-side sheets`,
      );
    const selected: number = [...components][0]!;
    const indices: number[] = [];
    const crossings: Map<string, number> = new Map();
    const cutVertices: Set<number> = new Set();
    const cutEdges: Map<string, { a: number; b: number; uses: number }> =
      new Map();

    /** Give both incident triangles the same exact cut-edge address. */
    const key: (a: number, b: number) => string = (
      a: number,
      b: number,
    ): string => (a < b ? `${a},${b}` : `${b},${a}`);

    /** Reuse one actual edge-plane intersection, retaining the original evaluation order. */
    const intersection: (a: number, b: number) => number = (
      a: number,
      b: number,
    ): number => {
      if (sign[a] === 0 || sign[b] === 0) {
        const vertex: number = sign[a] === 0 ? a : b;
        cutVertices.add(vertex);
        return vertex;
      }
      const edge: string = key(a, b);
      const old: number | undefined = crossings.get(edge);
      if (old !== undefined) return old;
      const vertex: number = positions.length / 3;
      positions.push(
        ...add(
          at(a),
          scale(sub(at(b), at(a)), sign[a]! / (sign[a]! - sign[b]!)),
        ),
      );
      crossings.set(edge, vertex);
      cutVertices.add(vertex);
      return vertex;
    };
    for (let i: number = 0; i < mesh.indices.length; i += 3) {
      const face: number[] = mesh.indices.slice(i, i + 3);
      const positive: number | undefined = face.find(
        (vertex: number): boolean => sign[vertex]! > 0,
      );
      if (positive === undefined || owner(positive) !== selected) {
        indices.push(face[0]!, face[1]!, face[2]!);
        continue;
      }
      const kept: number[] = [];
      for (let j: number = 0; j < 3; ++j) {
        const a: number = face[j]!;
        const b: number = face[(j + 1) % 3]!;
        if (sign[a]! <= 0) kept.push(a);
        if (sign[a]! > 0 !== sign[b]! > 0) kept.push(intersection(a, b));
      }
      const polygon: number[] = kept.filter(
        (vertex: number, j: number): boolean =>
          vertex !== kept[(j + kept.length - 1) % kept.length],
      );
      if (polygon.length < 3) continue;
      for (let j: number = 0; j < polygon.length; ++j) {
        const a: number = polygon[j]!;
        const b: number = polygon[(j + 1) % polygon.length]!;
        if (!cutVertices.has(a) || !cutVertices.has(b)) continue;
        const edge: string = key(a, b);
        const previous: { a: number; b: number; uses: number } | undefined =
          cutEdges.get(edge);
        if (previous === undefined) cutEdges.set(edge, { a, b, uses: 1 });
        else ++previous.uses;
      }
      for (let j: number = 2; j < polygon.length; ++j)
        indices.push(polygon[0]!, polygon[j - 1]!, polygon[j]!);
    }
    const next: Map<number, number> = new Map();
    for (const { a, b, uses } of cutEdges.values()) {
      if (uses !== 1) continue;
      if (next.has(a)) throw new Error("the local trim boundary branches");
      next.set(a, b);
    }
    if (next.size < 3)
      throw new Error("the selected arm did not leave a closed boundary");
    const start: number = next.keys().next().value!;
    const boundary: V3[] = [];
    const boundaryIndices: number[] = [];
    let current: number = start;
    do {
      boundary.push(at(current));
      boundaryIndices.push(current);
      const following: number | undefined = next.get(current);
      if (following === undefined || boundary.length > next.size)
        throw new Error("the local trim boundary is open");
      current = following;
    } while (current !== start);
    if (boundary.length !== next.size)
      throw new Error("the local trim has more than one boundary loop");
    return { skin: { positions, indices }, boundary, boundaryIndices };
  }

  /** Continue the retained edge through the original parallel arm sections. */
  export function armCollar(
    skin: Mesh,
    boundary: V3[],
    boundaryIndices: number[],
    observed: V3[][],
    normal: V3,
  ): Mesh {
    const positions: number[] = [...skin.positions];
    const indices: number[] = [...skin.indices];
    const owned: Map<V3, number> = new Map(
      boundary.map((point: V3, i: number): [V3, number] => [
        point,
        boundaryIndices[i]!,
      ]),
    );
    const increasing: boolean =
      armDot(AutoMovieMeshCourse.newell(boundary), normal) > 0;
    let before: V3[] = boundary;
    for (const ring of observed) {
      const after: V3[] =
        armDot(AutoMovieMeshCourse.newell(ring), normal) > 0 === increasing
          ? ring
          : [...ring].reverse();
      const triangles: [V3, V3, V3][] = [];
      tessellateAutoMovieContourStrip64(
        before,
        after,
        (a: V3, b: V3, c: V3): void => {
          triangles.push([a, b, c]);
        },
        undefined,
        (observation): void => {
          if (!observation.qualified)
            throw new Error(
              observation.diagnostics.join(" | ") ||
                "ordinary collar did not qualify",
            );
        },
      );
      const first: number = edgeSense(before, triangles);
      const second: number = edgeSense(after, triangles);
      if (
        Math.abs(first) !== before.length ||
        Math.abs(second) !== after.length ||
        Math.sign(first) === Math.sign(second)
      )
        throw new Error(
          "ordinary collar does not consume both full original edge cycles",
        );
      for (const [a, b, c] of triangles)
        for (const point of first < 0 ? [a, b, c] : [a, c, b]) {
          let vertex: number | undefined = owned.get(point);
          if (vertex === undefined) {
            vertex = positions.length / 3;
            positions.push(...point);
            owned.set(point, vertex);
          }
          indices.push(vertex);
        }
      before = after;
    }
    return { positions, indices };
  }
}
