import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";
import { HumanSkinStationarity } from "./HumanSkinStationarity";
import { HumanSkinVariation } from "./HumanSkinVariation";

/** Independent reconstruction of a declared path from its original emitted triangles and shared edge identities. */
export namespace HumanSkinPathAudit {
  /** Physical observer output, independent of the producer's length and unfolded chart. */
  export interface IReading {
    /** Sum of independently reconstructed physical segment lengths, mm. */
    length: number;
    /** Actual mesh points reconstructed from endpoints and source edge addresses. */
    points: [number, number, number][];
    /** Original triangle witnesses, unchanged. */
    triangles: number[];
  }

  /** Reconstruct every point, check every face and transition, then fail once with all physical witnesses. */
  export function read(skin: Surface.IGeometry, course: Pick<Course.IReading, "points" | "bindings" | "triangles">, from: { station: number; lateral: number }, to: { station: number; lateral: number }): IReading {
    const failures: object[] = [];
    const points: ([number, number, number] | undefined)[] = [];
    const materials: number[] = [];
    if (course.bindings.length !== course.points.length || course.triangles.length !== course.points.length - 1 || course.points.length < 2) throw new Error("An emitted path omitted its point or original triangle correspondence");
    for (let index: number = 0; index < course.bindings.length; index++) {
      const binding: Course.IReading["bindings"][number] = course.bindings[index]!;
      let actual: [number, number, number] | undefined;
      if ("edge" in binding) {
        materials.push(skin.coordinates[3 * binding.edge[0] + 1]! * (1 - binding.unit) + skin.coordinates[3 * binding.edge[1] + 1]! * binding.unit);
        const bound: number = 256 * Number.EPSILON * Math.max(1, Math.abs(binding.unit));
        const valid: boolean = Number.isFinite(binding.unit) && binding.unit >= -bound && binding.unit <= 1 + bound && binding.edge.length === 2 && binding.edge.every((vertex: number): boolean => Number.isInteger(vertex) && vertex >= 0 && 3 * vertex + 2 < skin.mesh.positions.length);
        if (!valid) failures.push({ stage: "physical portal address", index, binding, expected: "One finite interpolation on the original shared mesh edge", units: "vertex index and normalized fraction" });
        else {
          const a: number[] = skin.mesh.positions.slice(3 * binding.edge[0], 3 * binding.edge[0] + 3);
          const b: number[] = skin.mesh.positions.slice(3 * binding.edge[1], 3 * binding.edge[1] + 3);
          actual = a.map((value: number, axis: number): number => (1 - binding.unit) * value + binding.unit * b[axis]!) as [number, number, number];
          for (const face of [course.triangles[index - 1], course.triangles[index]]) {
            if (face === undefined) continue;
            const ids: number[] = skin.mesh.indices.slice(face, face + 3);
            if (binding.edge.some((vertex: number): boolean => !ids.includes(vertex))) failures.push({ stage: "actual indexed portal continuity", index, binding, triangle: face, ids, expected: "The same original edge belongs to both consecutive physical triangles", reason: "Coincident coordinates on another sheet do not share indexed incidence" });
          }
        }
      } else {
        const address: { station: number; lateral: number } = index === 0 ? from : to;
        materials.push(address.station);
        const expectedFace: number | undefined = index === 0 ? course.triangles[0] : course.triangles.at(-1);
        const ids: number[] = skin.mesh.indices.slice(binding.triangle, binding.triangle + 3);
        if (binding.triangle !== expectedFace || ids.length !== 3 || index !== 0 && index !== course.points.length - 1) failures.push({ stage: "physical endpoint ownership", index, binding, expectedFace, expected: "An endpoint on its adjacent original face" });
        else {
          const vertices: [number, number, number][] = ids.map((vertex: number): [number, number, number] => skin.mesh.positions.slice(3 * vertex, 3 * vertex + 3) as [number, number, number]);
          const stations: number[] = ids.map((vertex: number): number => skin.coordinates[3 * vertex + 1]!);
          const cut: [number, number, number][] = intersect(vertices, stations, address.station);
          const crossing: [number, number, number][] = intersect(cut, cut.map((p: [number, number, number]): number => p[2]), address.lateral);
          if (crossing.length === 0) failures.push({ stage: "independent endpoint intersection", index, triangle: binding.triangle, address, vertices, stations, observed: "unavailable", expected: "An actual triangle intersection at the unchanged endpoint", units: "mm" });
          else actual = crossing.reduce((a: [number, number, number], b: [number, number, number]): [number, number, number] => a[0] >= b[0] ? a : b);
        }
      }
      points.push(actual);
      const producer: number[] | undefined = course.points[index];
      if (actual === undefined || actual.length !== 3 || !actual.every(Number.isFinite) || producer === undefined || producer.length !== 3 || !producer.every(Number.isFinite)) failures.push({ stage: "finite independently reconstructed point", index, binding, observed: actual ?? "unavailable", producer, expected: "Three finite actual coordinates", units: "mm" });
      else {
        const deviation: number = Math.hypot(actual[0] - producer[0]!, actual[1] - producer[1]!, actual[2] - producer[2]!);
        const tolerance: number = 512 * Number.EPSILON * Math.max(1, ...actual.map(Math.abs), ...producer.map(Math.abs));
        if (deviation > tolerance) failures.push({ stage: "independent point correspondence", index, binding, coordinates: actual, producerCoordinates: producer, observed: deviation, expected: 0, deviation, tolerance, units: "mm", reason: "Independent emitted-edge/triangle reconstruction disagrees" });
      }
    }
    const direction: number = Math.sign(to.station - from.station);
    for (let index: number = 0; index < materials.length; index++) {
      const observed: number = materials[index]!;
      const previous: number = materials[index - 1] ?? from.station;
      const tolerance: number = 512 * Number.EPSILON * Math.max(1, Math.abs(observed), Math.abs(previous), Math.abs(from.station), Math.abs(to.station));
      if (!Number.isFinite(observed) || observed < Math.min(from.station, to.station) - tolerance || observed > Math.max(from.station, to.station) + tolerance || (observed - previous) * direction < -tolerance) failures.push({ stage: "independent directed material domain", index, coordinates: points[index], observed, previous, expected: "Original edge stations monotonically inside unchanged endpoint interval", from, to, tolerance, units: "mm" });
    }
    for (let index: number = 0; index < course.triangles.length; index++) {
      const face: number = course.triangles[index]!;
      const ids: number[] = skin.mesh.indices.slice(face, face + 3);
      if (!Number.isInteger(face) || face < 0 || face % 3 !== 0 || ids.length !== 3 || ids.some((vertex: number): boolean => !Number.isInteger(vertex) || vertex < 0 || vertex * 3 + 2 >= skin.mesh.positions.length)) { failures.push({ stage: "original physical face", index, triangle: face, ids }); continue; }
      const vertices: [number, number, number][] = ids.map((vertex: number): [number, number, number] => skin.mesh.positions.slice(vertex * 3, vertex * 3 + 3) as [number, number, number]);
      const ab: number[] = vertices[1]!.map((n: number, axis: number): number => n - vertices[0]![axis]!);
      const ac: number[] = vertices[2]!.map((n: number, axis: number): number => n - vertices[0]![axis]!);
      const normal: number[] = cross(ab, ac);
      const squared: number = normal.reduce((sum: number, n: number): number => sum + n * n, 0);
      if (!(squared > 0) || !Number.isFinite(squared) || vertices.some((p: number[]): boolean => !p.every(Number.isFinite))) { failures.push({ stage: "physical face regularity", index, triangle: face, vertices, squaredArea: squared, units: "mm^4" }); continue; }
      for (const endpoint of [index, index + 1]) {
        const p: [number, number, number] | undefined = points[endpoint];
        if (p === undefined) continue;
        const scale: number = Math.max(1, ...vertices.flat().map(Math.abs), ...p.map(Math.abs));
        const plane: number = normal.reduce((sum: number, n: number, axis: number): number => sum + n * (p[axis]! - vertices[0]![axis]!), 0) / Math.sqrt(squared);
        const tolerance: number = 512 * Number.EPSILON * scale;
        if (Math.abs(plane) > tolerance) failures.push({ stage: "actual triangle plane", index: endpoint, triangle: face, coordinates: p, observed: plane, expected: 0, deviation: Math.abs(plane), tolerance, units: "mm" });
        for (let edge: number = 0; edge < 3; edge++) {
          const a: number[] = vertices[edge]!;
          const b: number[] = vertices[(edge + 1) % 3]!;
          const side: number[] = cross(b.map((n: number, axis: number): number => n - a[axis]!), p.map((n: number, axis: number): number => n - a[axis]!));
          const inward: number = side.reduce((sum: number, n: number, axis: number): number => sum + n * normal[axis]!, 0);
          const arithmetic: number = 1024 * Number.EPSILON * scale * Math.sqrt(squared) * Math.hypot(...b.map((n: number, axis: number): number => n - a[axis]!));
          if (inward < -arithmetic) failures.push({ stage: "actual triangle interior", index: endpoint, triangle: face, edge: [ids[edge], ids[(edge + 1) % 3]], coordinates: p, observed: inward, expected: "nonnegative oriented edge half-plane", tolerance: arithmetic, units: "mm^4" });
        }
      }
    }
    if (failures.length > 0) throw new Error("An emitted path failed independent surface continuity", { cause: { failures } });
    const physical: [number, number, number][] = points as [number, number, number][];
    const shortening: object[] = HumanSkinStationarity.inspect(skin, course, physical, Math.min(from.station, to.station), Math.max(from.station, to.station));
    if (shortening.length > 0) throw new Error("An emitted path has a shorten-able actual vertex corner", { cause: { failures: shortening } });
    const variation: object[] = HumanSkinVariation.inspect(skin, course, physical, from.station, to.station);
    if (variation.length > 0) throw new Error("An emitted path failed independent constrained first variation", { cause: { failures: variation } });
    const length: number = physical.reduce((sum: number, p: [number, number, number], index: number): number => index === 0 ? sum : sum + Math.sqrt(p.reduce((squared: number, n: number, axis: number): number => squared + (n - physical[index - 1]![axis]!) ** 2, 0)), 0);
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("An independently observed physical path has no finite positive length");
    return { points: physical, triangles: [...course.triangles], length };
  }

  /** Independent edge clipping in the actual polygon, preserving contained edges and every intersection. */
  function intersect(points: readonly [number, number, number][], values: readonly number[], target: number): [number, number, number][] {
    const result: [number, number, number][] = [];
    for (let index: number = 0; index < points.length; index++) {
      const next: number = (index + 1) % points.length;
      const a: number = values[index]! - target;
      const b: number = values[next]! - target;
      const arithmetic: number = 128 * Number.EPSILON * Math.max(1, Math.abs(target), Math.abs(values[index]!), Math.abs(values[next]!));
      if (Math.abs(a) <= arithmetic) result.push(points[index]!);
      if (a * b < 0) {
        const ratio: number = a / (a - b);
        result.push(points[index]!.map((value: number, axis: number): number => value * (1 - ratio) + points[next]![axis]! * ratio) as [number, number, number]);
      }
    }
    return result;
  }

  /** Independent physical cross product. */
  function cross(a: readonly number[], b: readonly number[]): number[] { return [a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!]; }
}
