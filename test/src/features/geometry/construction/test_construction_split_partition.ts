import {
  AutoMovieSolidBody,
  AutoMovieSolidCycle,
  AutoMovieSolidMesh,
} from "@automovie/engine";
import type {
  IAutoMovieSolidCycle,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * A planar split end has 24 nonuniform exact phases, while each retained row
 * keeps its original count of eight. Its copied cycle carries the subset into
 * the body draw. An ordinary cycle still uses the authored uniform phases.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Draws an actual periodic body face and checks the emitted vertices, the exact terminal ring and its triangle incidences.
 * @evidence contracts/development/testing.md#independent-expectations The fixture repeats identical chord lengths and normal turns in each of the eight angular sectors. Their first vertices have equal cumulative measures. The analytic cylinder gives each expected world point.
 * @evidence contracts/development/testing.md#distinguishing-cases The same exact boundary with and without the split partition mark distinguishes scoped transport from a general endpoint override.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous CPU draw with a made surface and no external assets.
 */
export function test_construction_split_partition(): void {
  const period: number = 2 * Math.PI;
  const stations: number[] = [0, 1, 2];
  const uniform: number[] = Array.from(
    { length: 8 },
    (_, k): number => (period * k) / 8,
  );
  const boundary: number[] = uniform.flatMap((phase): number[] =>
    [1 / 16, 3 / 16, 11 / 16].map(
      (share): number => phase + (share * period) / 8,
    ),
  );
  const wall: IAutoMovieSolidSurface = {
    name: "cylinder",
    period,
    orientation: -1,
    jet(u, v) {
      const y: number = Math.cos(v);
      const z: number = Math.sin(v);
      return {
        p: [u, y, z],
        u: [1, 0, 0],
        v: [0, -z, y],
        uu: [0, 0, 0],
        uv: [0, 0, 0],
        vv: [0, -y, -z],
      };
    },
  };
  for (const transport of [false, true]) {
    const body = AutoMovieSolidBody.create(wall.name, [
      { surface: wall, stations, phases: uniform },
    ]);
    const owner: number = AutoMovieSolidMesh.owner(body.mesh, wall);
    const original: IAutoMovieSolidCycle.ICycle = {
      kind: "end",
      vertices: boundary.map((v): number =>
        AutoMovieSolidMesh.vertex(body.mesh, wall.jet(2, v).p, owner, 2, v),
      ),
      chart: boundary.map((v): [number, number] => [2, v]),
      neighbours: boundary.map((v, k) => ({
        face: -1,
        from: [2, v],
        to: [2, boundary[k + 1] ?? period],
      })),
      ...(transport ? { partition: true } : {}),
    };
    body.faces[0]!.cycles.push(AutoMovieSolidCycle.copy(original));
    const [opened] = AutoMovieSolidBody.draw(body);
    const { coordinates, indices, positions } = body.mesh;
    const expected: number[] = transport
      ? boundary.filter((_, k): boolean => k % 3 === 0)
      : uniform;
    for (const s of stations) {
      const wanted: number[] = s === 2 ? boundary : expected;
      const observed: number[] = [];
      for (let i: number = 0; i < coordinates.length; i += 3) {
        if (coordinates[i + 1] !== s) continue;
        const phase: number = coordinates[i + 2]!;
        observed.push(phase);
        const p = AutoMovieSolidMesh.evaluate(body.mesh, i / 3);
        if (p.some((value, k): boolean => value !== wall.jet(s, phase).p[k]))
          throw new Error(
            "row samples left the cylinder's original world chart",
          );
      }
      observed.sort((a, b): number => a - b);
      if (
        observed.length !== wanted.length ||
        observed.some((phase, k): boolean => phase !== wanted[k])
      )
        throw new Error(
          "split sampling replaced the wrong row addresses: " + s,
        );
    }
    for (const [k, a] of original.vertices.entries()) {
      const b: number = original.vertices[(k + 1) % boundary.length]!;
      let uses: number = 0;
      for (let i: number = 0; i < indices.length; i += 3) {
        const triangle: number[] = indices.slice(i, i + 3);
        if (triangle.includes(a) && triangle.includes(b)) ++uses;
      }
      if (uses !== 1)
        throw new Error(
          "the shared terminal edge lost its one retained incident triangle",
        );
    }
    if (!transport) continue;
    if (opened?.length !== 1 || opened[0]!.end !== "bottom")
      throw new Error("the annular patch left an unintended open row");
    if (indices.length / 3 !== 3 * uniform.length + boundary.length)
      throw new Error("transport changed the original triangle allocation");
    for (let i: number = 0; i < indices.length; i += 3) {
      const point = (k: number): [number, number, number] => {
        const index: number = 3 * indices[i + k]!;
        return [
          positions[index]!,
          positions[index + 1]!,
          positions[index + 2]!,
        ];
      };
      const [a, b, c] = [point(0), point(1), point(2)];
      const crossY: number =
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]);
      const crossZ: number =
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (!(crossY * (a[1] + b[1] + c[1]) + crossZ * (a[2] + b[2] + c[2]) > 0))
        throw new Error("a split parent facet lost its directed winding");
    }
  }
}
