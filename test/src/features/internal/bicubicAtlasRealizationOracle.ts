import { realizeAutoMovieBicubicAtlas64 } from "../../../../packages/engine/src/geometry/realizeAutoMovieBicubicAtlas64";
import { nclose } from "../internal/nclose";

/** Independent indexed-face and signed-area measurements for the public atlas realization scenarios. */
export namespace bicubicAtlasRealizationOracle {
  /** Independent indexed-face measurements for a curve translated along the y station axis. */
  export const translatedFaces: (
    positions: readonly number[],
    indices: readonly number[],
    radiusM: number,
    gapM: number,
    periodic: boolean,
  ) => {
    finite: boolean;
    flatAlongStation: boolean;
    oriented: boolean;
    conforming: boolean;
    middleEdges: number;
    seamEdges: number;
    areaMatchesBoundary: boolean;
    maximumStationNormal: number;
  } = (
    positions: readonly number[],
    indices: readonly number[],
    radiusM: number,
    gapM: number,
    periodic: boolean,
  ): {
    finite: boolean;
    flatAlongStation: boolean;
    oriented: boolean;
    conforming: boolean;
    middleEdges: number;
    seamEdges: number;
    areaMatchesBoundary: boolean;
    maximumStationNormal: number;
  } => {
    const gamma: number = (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);
    // Nested cubic evaluation, subtraction and the 2x2 determinant have a rounding
    // path shorter than 64 scalar operations. The absolute arithmetic allowance is
    // scaled by the squared transverse diameter, rather than an angle threshold.
    const determinantAllowance: number = gamma * (2 * radiusM) ** 2;
    const atStation: (value: number, station: number) => boolean = (
      value: number,
      station: number,
    ): boolean => nclose(value, station, gamma * gapM);
    const point: (id: number) => number[] = (id: number): number[] =>
      positions.slice(id * 3, id * 3 + 3);
    const edges: Map<
      string,
      { a: number; b: number; uses: number; direction: number }
    > = new Map();
    let finite: boolean =
        indices.length > 0 && positions.every(Number.isFinite),
      flatAlongStation: boolean = true,
      oriented: boolean = true,
      area: number = 0,
      maximumStationNormal: number = 0;
    for (let i: number = 0; i < indices.length; i += 3) {
      const ids: number[] = indices.slice(i, i + 3);
      if (
        !ids.every(
          (id: number): boolean =>
            Number.isSafeInteger(id) && id >= 0 && id < positions.length / 3,
        )
      ) {
        finite = false;
        continue;
      }
      const p: number[][] = ids.map(point),
        a: number[] = p[1]!.map(
          (value: number, k: number): number => value - p[0]![k]!,
        ),
        b: number[] = p[2]!.map(
          (value: number, k: number): number => value - p[0]![k]!,
        );
      const n: number[] = [
          a[1]! * b[2]! - a[2]! * b[1]!,
          a[2]! * b[0]! - a[0]! * b[2]!,
          a[0]! * b[1]! - a[1]! * b[0]!,
        ],
        length: number = Math.hypot(...n);
      finite &&= Number.isFinite(length) && length > 0;
      flatAlongStation &&= Math.abs(n[1]!) <= determinantAllowance;
      oriented &&=
        n[0]! * (p[0]![0]! + p[1]![0]! + p[2]![0]!) +
          n[2]! * (p[0]![2]! + p[1]![2]! + p[2]![2]!) <
        0;
      area += length / 2;
      maximumStationNormal = Math.max(
        maximumStationNormal,
        Math.abs(n[1]!) / length,
      );
      for (let k: number = 0; k < 3; k++) {
        const a: number = ids[k]!,
          b: number = ids[(k + 1) % 3]!,
          key: string = a < b ? `${a}:${b}` : `${b}:${a}`;
        const edge: { a: number; b: number; uses: number; direction: number } =
          edges.get(key) ?? { a, b, uses: 0, direction: 0 };
        edge.uses++;
        edge.direction += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    }
    let conforming: boolean = true,
      middleEdges: number = 0,
      seamEdges: number = 0,
      bottomLength: number = 0;
    for (const edge of edges.values()) {
      const a: number[] = point(edge.a),
        b: number[] = point(edge.b);
      const bottom: boolean = atStation(a[1]!, 0) && atStation(b[1]!, 0),
        top: boolean = atStation(a[1]!, 2 * gapM) && atStation(b[1]!, 2 * gapM);
      const end: boolean = [
        [radiusM, 0],
        [0, radiusM],
      ].some(([x, z]: number[]): boolean =>
        [a, b].every(
          (p: number[]): boolean =>
            nclose(p[0]!, x!, gamma * radiusM) &&
            nclose(p[2]!, z!, gamma * radiusM),
        ),
      );
      if (edge.uses === 1) conforming &&= bottom || top || (!periodic && end);
      else conforming &&= edge.uses === 2 && edge.direction === 0;
      if (edge.uses === 1 && bottom)
        bottomLength += Math.hypot(a[0]! - b[0]!, a[2]! - b[2]!);
      if (atStation(a[1]!, gapM) && atStation(b[1]!, gapM)) {
        middleEdges++;
        conforming &&= edge.uses === 2 && edge.direction === 0;
      }
      if (
        periodic &&
        [a, b].every(
          (p: number[]): boolean =>
            nclose(p[0]!, radiusM, gamma * radiusM) &&
            nclose(p[2]!, 0, gamma * radiusM),
        )
      ) {
        seamEdges++;
        conforming &&= edge.uses === 2 && edge.direction === 0;
      }
    }
    const expected: number = bottomLength * 2 * gapM;
    return {
      finite,
      flatAlongStation,
      oriented,
      conforming,
      middleEdges,
      seamEdges,
      areaMatchesBoundary:
        expected > 0 &&
        nclose(
          area,
          expected,
          gamma * indices.length * Math.max(area, expected),
        ),
      maximumStationNormal,
    };
  };

  /** Measure physical area from the output itself without requiring one particular square triangulation. */
  export const squareArea: (
    result: ReturnType<typeof realizeAutoMovieBicubicAtlas64>,
  ) => number = (
    result: ReturnType<typeof realizeAutoMovieBicubicAtlas64>,
  ): number => {
    let area: number = 0;
    for (let i: number = 0; i < result.mesh.indices!.length; i += 3) {
      const p: number[][] = result.mesh
        .indices!.slice(i, i + 3)
        .map((id: number): number[] =>
          result.mesh.positions.slice(id * 3, id * 3 + 3),
        );
      area +=
        ((p[1]![0]! - p[0]![0]!) * (p[2]![1]! - p[0]![1]!) -
          (p[1]![1]! - p[0]![1]!) * (p[2]![0]! - p[0]![0]!)) /
        2;
    }
    return area;
  };
}
