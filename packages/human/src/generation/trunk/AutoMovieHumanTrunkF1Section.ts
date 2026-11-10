import { AutoMovieCurveMath64 as Vector, AutoMovieMeshCourse } from "@automovie/engine";

/** The fixed world sections used by the ordinary F1 torso lofts. */
export namespace AutoMovieHumanTrunkF1Section {
  /** A physical point or direction in the captured ISB axes. */
  export type V3 = Vector.V;

  /** Array-backed world-millimetre surface for indexed strip assembly. */
  export type Mesh = {
    /** Flat absolute world coordinates in millimetres. */
    positions: number[];
    /** Flat triangle corner indices into the world-coordinate array. */
    indices: number[];
  };

  /** Copy one point from the fixed-coordinate input into the engine's tuple shape. */
  export function point(value: readonly number[]): V3 {
    return [value[0]!, value[1]!, value[2]!];
  }

  /** Keep the world's positive horizontal phase order without changing any point. */
  export function increasingPhase(points: V3[]): V3[] {
    return AutoMovieMeshCourse.newell(points)[1] < 0 ? points : [...points].reverse();
  }

  /** Sum the directed uses of this exact boundary's consecutive edges. */
  export function edgeSense<Point>(ring: Point[], triangles: [Point, Point, Point][]): number {
    const next: Map<Point, Point> = new Map(ring.map((point: Point, i: number): [Point, Point] => [point, ring[(i + 1) % ring.length]!]));
    const edges: Set<Point> = new Set();
    let direction: number = 0;
    for (const triangle of triangles)
      for (let i: number = 0; i < 3; ++i) {
        const a: Point = triangle[i]!;
        const b: Point = triangle[(i + 1) % 3]!;
        const sense: number = next.get(a) === b ? 1 : next.get(b) === a ? -1 : 0;
        if (sense === 0) continue;
        const owner: Point = sense > 0 ? a : b;
        if (edges.has(owner) || (direction !== 0 && direction !== sense)) return 0;
        edges.add(owner);
        direction = sense;
      }
    return direction * edges.size;
  }
}
