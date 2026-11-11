import {
  type AutoMovieSolidMeshPlan,
  triangulateAutoMovieSolidBoundary,
} from "@automovie/engine";

import { nclose } from "../nclose";

/** Original station/phase values; selection never changes these coordinates. */
type Point = readonly [number, number];

/** Independent world coordinates of the made cylindrical strip. */
type WorldPoint = readonly [number, number, number];

/** Independent concave geometry and represented-cut preservation regressions. */
export namespace ConstructionMeshSelectionGeometry {
  /** A diagonal already used on another face must leave the other quad diagonal available. */
  export function occupied(failures: string[]): void {
    for (const scale of [0.001, 1, 1000]) {
      const vertices: Map<number, Point> = new Map([
        [0, [0, 0]],
        [1, [2 * scale, 0]],
        [2, [2 * scale, 1]],
        [3, [0, 1]],
      ]);
      const made: AutoMovieSolidMeshPlan.ITriangle[] | string =
        triangulateAutoMovieSolidBoundary(
          vertices,
          { vertices: [0, 1, 2, 3], lifts: [0, 0, 0, 0], winding: 0 },
          undefined,
          true,
          new Set<string>(["1/3"]),
        );
      if (typeof made === "string" || keys(made) !== "0/1/2;0/2/3")
        failures.push(
          `Occupied shared diagonal at scale ${scale}: ${typeof made === "string" ? made : keys(made)}`,
        );
    }
  }

  /** Compare oriented populations modulo cyclic corner and triangle publication order. */
  export function keys(
    triangles: readonly AutoMovieSolidMeshPlan.ITriangle[],
  ): string {
    const result: string[] = triangles.map(
      (triangle: AutoMovieSolidMeshPlan.ITriangle): string => {
        const ids: number[] = triangle.vertices;
        const at: number = ids.indexOf(Math.min(...ids));
        return [...ids.slice(at), ...ids.slice(0, at)].join("/");
      },
    );
    result.sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
    return result.join(";");
  }

  /** Periodic sampling locality must preserve an independently specified concave region. */
  export function concave(failures: string[]): void {
    let reference: string | undefined;
    for (const scale of [0.001, 1, 1000])
      for (const offset of [0, 0.375]) {
        const outline: Point[] = [
          [0, 0],
          [4, 0],
          [4, 3],
          [3, 3],
          [3, 1],
          [1, 1],
          [1, 3],
          [0, 3],
        ];
        const points: Point[] = outline.map(
          ([u, v]: Point): Point => [u * scale, v + offset],
        );
        const vertices: Map<number, Point> = new Map(
          points.map((point: Point, id: number): [number, Point] => [
            id,
            point,
          ]),
        );
        const before: string = JSON.stringify([...vertices]);
        for (const first of [0, 2, 4, 6]) {
          const ring: number[] = points.map(
            (_: Point, id: number): number => id,
          );
          const made: AutoMovieSolidMeshPlan.ITriangle[] | string =
            triangulateAutoMovieSolidBoundary(
              vertices,
              {
                vertices: [...ring.slice(first), ...ring.slice(0, first)],
                lifts: ring.map((): number => 0),
                winding: 0,
              },
              8,
            );
          if (typeof made === "string") {
            failures.push(
              `concave sampling selection/${scale}/${offset}/${first}: ${made}`,
            );
            continue;
          }
          const topology: string = keys(made);
          if (reference === undefined) reference = topology;
          else if (reference !== topology)
            failures.push(
              "Concave topology changed with units, cyclic start or phase translation.",
            );
          if (made.length !== 6)
            failures.push("The eight-corner U needs six triangles.");
          let area: number = 0;
          for (const triangle of made) {
            const [a, b, c]: [Point, Point, Point] = triangle.vertices.map(
              (id: number): Point => points[id]!,
            ) as [Point, Point, Point];
            const signed: number =
              ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) /
              2;
            if (!(signed > 0))
              failures.push("A concave U triangle lost positive area.");
            area += signed;
            for (const weights of [
              [1 / 3, 1 / 3, 1 / 3],
              [0.6, 0.2, 0.2],
              [0.2, 0.6, 0.2],
              [0.2, 0.2, 0.6],
            ]) {
              const u: number =
                (a[0] * weights[0]! + b[0] * weights[1]! + c[0] * weights[2]!) /
                scale;
              const v: number =
                a[1] * weights[0]! +
                b[1] * weights[1]! +
                c[1] * weights[2]! -
                offset;
              if (
                !(
                  u > 0 &&
                  u < 4 &&
                  v > 0 &&
                  v < 3 &&
                  !(u > 1 && u < 3 && v > 1)
                )
              )
                failures.push("A concave U triangle left its analytic region.");
            }
          }
          if (!nclose(area / scale, 8, 1e-12))
            failures.push("The U lost its 4*3-2*2 chart area.");
        }
        if (JSON.stringify([...vertices]) !== before)
          failures.push(
            "Sampling selection changed an original concave point.",
          );
      }
  }

  /** The captured three-point sliver is not snapped or dropped behind a new diagonal. */
  export function thin(failures: string[]): void {
    const points: Point[] = [
      [6.3, -1],
      [5, 3],
      [6.363961030678933, 0.7853981633974483],
      [4.242640687119288, 0.5235987755982988],
      [8.485281374238577, 1.0471975511965976],
    ];
    const vertices: Map<number, Point> = new Map(
      points.map((point: Point, id: number): [number, Point] => [id, point]),
    );
    const ring: number[] = [1, 2, 3, 0, 4];
    const before: string = JSON.stringify([...vertices]);
    const made: AutoMovieSolidMeshPlan.ITriangle[] | string =
      triangulateAutoMovieSolidBoundary(vertices, {
        vertices: ring,
        lifts: [0, 0, 0, 0, 0],
        winding: 0,
      });
    if (typeof made === "string") {
      failures.push(`representable diagonal protection: ${made}`);
      return;
    }
    if (
      made.length !== 3 ||
      new Set(
        made.flatMap(
          (triangle: AutoMovieSolidMeshPlan.ITriangle): number[] =>
            triangle.vertices,
        ),
      ).size !== 5
    )
      failures.push(
        "Thin diagonal protection lost an original point or triangle.",
      );
    let area: number = 0;
    for (const triangle of made) {
      const [a, b, c]: [Point, Point, Point] = triangle.vertices.map(
        (id: number): Point => points[id]!,
      ) as [Point, Point, Point];
      const signed: number =
        ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      if (!(signed > 0))
        failures.push(
          "Thin diagonal protection published a nonpositive triangle.",
        );
      area += signed;
      for (let k: number = 0; k < 3; k++)
        if (
          [triangle.vertices[k]!, triangle.vertices[(k + 1) % 3]!]
            .sort((a: number, b: number): number => a - b)
            .join("/") === "3/4"
        )
          failures.push(
            "The diagonal stranded the original midpoint in an unrepresentable sliver.",
          );
    }
    let expected: number = 0;
    for (let k: number = 0; k < ring.length; k++) {
      const a: Point = points[ring[k]!]!;
      const b: Point = points[ring[(k + 1) % ring.length]!]!;
      expected += (a[0] * b[1] - b[0] * a[1]) / 2;
    }
    if (!nclose(area, expected, 1e-12))
      failures.push(
        "Thin diagonal protection changed the authored polygon area.",
      );
    if (JSON.stringify([...vertices]) !== before)
      failures.push("Thin diagonal protection changed an original coordinate.");
  }

  /** Unequally sampled cylinder rims need local chords as well as scale-covariant ID choices. */
  export function strip(failures: string[]): void {
    const references: Map<number, string> = new Map();
    for (const scale of [0.001, 1, 1000])
      for (const offset of [0, 0.375]) {
        const points: Point[] = [];
        for (let k: number = 0; k <= 20; k++)
          points.push([0, offset + (3 * k) / 20]);
        for (let k: number = 15; k >= 0; k--)
          points.push([2 * scale, offset + (3 * k) / 15]);
        const vertices: Map<number, Point> = new Map(
          points.map((point: Point, id: number): [number, Point] => [
            id,
            point,
          ]),
        );
        const before: string = JSON.stringify([...vertices]);
        for (const first of [0, 9, 21, 30]) {
          const ring: number[] = points
            .map((_point: Point, id: number): number => id)
            .reverse();
          const made: AutoMovieSolidMeshPlan.ITriangle[] | string =
            triangulateAutoMovieSolidBoundary(
              vertices,
              {
                vertices: [...ring.slice(first), ...ring.slice(0, first)],
                lifts: ring.map((): number => 0),
                winding: 0,
              },
              2 * Math.PI,
              true,
            );
          if (typeof made === "string") {
            failures.push(
              `cylinder strip/${scale}/${offset}/${first}: ${made}`,
            );
            continue;
          }
          const topology: string = keys(made);
          const reference: string | undefined = references.get(offset);
          if (reference === undefined) references.set(offset, topology);
          else if (reference !== topology)
            failures.push(
              "Cylinder strip topology changed with units or start.",
            );
          if (made.length !== points.length - 2)
            failures.push("The 37-corner cylinder strip needs 35 triangles.");
          let area: number = 0;
          const used: Set<number> = new Set();
          for (const triangle of made) {
            const [a, b, c]: [Point, Point, Point] = triangle.vertices.map(
              (id: number): Point => points[id]!,
            ) as [Point, Point, Point];
            const signed: number =
              ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) /
              2;
            if (!(signed > 0))
              failures.push("Cylinder strip lost positive native orientation.");
            area += signed;
            for (const id of triangle.vertices) used.add(id);
            const world: [WorldPoint, WorldPoint, WorldPoint] = [a, b, c].map(
              ([u, v]: Point): WorldPoint => [
                20 * scale * Math.cos(v),
                20 * scale * Math.sin(v),
                u,
              ],
            ) as [WorldPoint, WorldPoint, WorldPoint];
            const ab: WorldPoint = [
              world[1][0] - world[0][0],
              world[1][1] - world[0][1],
              world[1][2] - world[0][2],
            ];
            const ac: WorldPoint = [
              world[2][0] - world[0][0],
              world[2][1] - world[0][1],
              world[2][2] - world[0][2],
            ];

            // The cylinder's declared outward sign reverses native u/phase.
            const normal: WorldPoint = [
              ac[1] * ab[2] - ac[2] * ab[1],
              ac[2] * ab[0] - ac[0] * ab[2],
              ac[0] * ab[1] - ac[1] * ab[0],
            ];
            const x: number = (world[0][0] + world[1][0] + world[2][0]) / 3;
            const y: number = (world[0][1] + world[1][1] + world[2][1]) / 3;
            const radial: number = Math.hypot(x, y);
            if (
              !(
                (normal[0] * x) / radial +
                  (normal[1] * y) / radial +
                  normal[2] >
                0
              )
            )
              failures.push(
                "Cylinder strip chord failed radial-plus-z facing.",
              );
          }
          if (used.size !== points.length || !nclose(area / scale, 6, 1e-10))
            failures.push("Cylinder strip lost an original point or area 6.");
        }
        if (JSON.stringify([...vertices]) !== before)
          failures.push("Cylinder strip changed its original chart points.");
      }
  }
}
