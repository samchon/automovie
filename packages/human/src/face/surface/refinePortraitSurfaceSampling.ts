import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMeshDeformationField,
  IAutoMovieVector3,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IControlMesh } from "../mesh/structures/IControlMesh";

/**
 * Insert shared tangent-guided samples around compact surface fields without
 * moving existing vertices. Outside pending contact, an intersecting face is
 * refined until its edges fit the requested millimetre spacing; neighbours share every inserted
 * midpoint, so a refined region cannot leave a T-junction at its boundary.
 * Original vertex identities and per-face material labels are retained.
 *
 * Input topology and fields are already admitted by the surface assembler.
 * Field boxes use metres. Box intersection is deliberately conservative rather
 * than missing a thin crease between the vertices of a coarse triangle.
 * Interior edge samples follow the two endpoint normal planes with the cubic
 * point-normal midpoint rule. Open edges stay linear, preserving their exact
 * rim. This interpolates existing curvature, not recovered anatomical detail.
 * Exactly coincident free-rim samples are pending tissue contact. Their
 * incident faces request no edge splits. They can still inherit a split
 * requested by an adjacent eligible face to preserve shared-edge conformity;
 * this exemption alone does not guarantee matching opposed fold sampling.
 * New position rows share unchanged original rows; reference and colour rows
 * are copied and interpolated. No iteration or output-size cap exists. The
 * representable-midpoint check refuses a stalled split, but it does not prove
 * convergence of curvature-guided subdivision for every admitted field/mesh.
 *
 * @evidence contracts/common.md#principled-implementation Conservative field boxes select long triangle edges; one shared midpoint per edge uses cubic endpoint-normal interpolation internally and a linear free-rim rule, then conforming triangle subdivision preserves groups and original IDs.
 * @evidence contracts/common.md#clear-and-simple-design Sampling owns shared edge splits and aligned attribute interpolation; the surface assembler owns input admission and later deformation/contact sealing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Faces incident to coincident pending rims request no splits but can inherit neighbouring shared-edge splits; unrepresentable midpoint progress refuses, while matching opposed-fold sampling and general convergence remain unproved.
 * @evidence contracts/common.md#meaningful-documentation Prose gives millimetre spacing versus metre boxes, pending-contact behavior, original-row sharing, attribute copies and absent iteration/population bound.
 * @evidence contracts/performance.md#efficient-algorithms Each round scans triangles/edges and tests F boxes against eligible faces, then emits at most four children per triangle; total work and buffers follow all generated rounds, with no fixed global bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Initial area normals seed the normal array, per-round edge incidences and midpoint IDs serve adjacent faces, and interpolated midpoint normals persist into later rounds of this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Growing geometry, normals and per-round maps are call-local until return/throw; output arrays belong to the caller and subdivision has no configured population limit.
 */
export function refinePortraitSurfaceSampling(
  input: IControlMesh,
  fields: readonly IAutoMovieMeshDeformationField[],
  spacing: number,
): IControlMesh {
  if (!Number.isFinite(spacing) || spacing <= 0)
    throw new Error(
      "Surface sample spacing must be positive finite millimetres.",
    );
  const boxes: { min: number[]; max: number[] }[] = fields.map(
    (f: IAutoMovieMeshDeformationField): { min: number[]; max: number[] } => ({
      min: [
        f.center.x - f.radius.x,
        f.center.y - f.radius.y,
        f.center.z - f.radius.z,
      ].map((x: number): number => x * 1000),
      max: [
        f.center.x + f.radius.x,
        f.center.y + f.radius.y,
        f.center.z + f.radius.z,
      ].map((x: number): number => x * 1000),
    }),
  );
  const key: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}/${b}` : `${b}/${a}`);
  const packedNormals: number[] = areaWeightedNormals(
    input.positions.flat(),
    input.indices,
  );
  const normals: number[][] = input.positions.map(
    (_: number[], i: number): number[] => packedNormals.slice(i * 3, i * 3 + 3),
  );
  let mesh: IControlMesh = input;
  for (;;) {
    const split: Map<string, number> = new Map<string, number>();
    const positions: number[][] = [...mesh.positions];
    const reference: number[][] | undefined = mesh.reference?.map(
      (p: number[]): number[] => [...p],
    );
    const colors: number[][] | undefined = mesh.colors?.map(
      (p: number[]): number[] => [...p],
    );
    const incidences: Map<string, number> = new Map<string, number>();
    for (let face: number = 0; face < mesh.indices.length; face += 3)
      for (let edge: number = 0; edge < 3; edge++) {
        const id: string = key(
          mesh.indices[face + edge],
          mesh.indices[face + ((edge + 1) % 3)],
        );
        incidences.set(id, (incidences.get(id) ?? 0) + 1);
      }
    const boundary: Set<number> = new Set<number>();
    for (const [id, count] of incidences)
      if (count === 1)
        for (const vertex of id.split("/").map(Number)) boundary.add(vertex);
    const coordinates: Map<string, number> = new Map<string, number>();
    const contact: Set<number> = new Set<number>();
    for (const vertex of boundary) {
      const coordinate: string = mesh.positions[vertex].join("/");
      const previous: number | undefined = coordinates.get(coordinate);
      if (previous === undefined) coordinates.set(coordinate, vertex);
      else {
        contact.add(previous);
        contact.add(vertex);
      }
    }
    for (let face: number = 0; face < mesh.indices.length; face += 3) {
      const ids: number[] = mesh.indices.slice(face, face + 3),
        points: number[][] = ids.map(
          (i: number): number[] => mesh.positions[i],
        );
      if (ids.some((id: number): boolean => contact.has(id))) continue;
      const min: number[] = [0, 1, 2].map((axis: number): number =>
        Math.min(...points.map((p: number[]): number => p[axis])),
      );
      const max: number[] = [0, 1, 2].map((axis: number): number =>
        Math.max(...points.map((p: number[]): number => p[axis])),
      );
      if (
        !boxes.some((box: { min: number[]; max: number[] }): boolean =>
          [0, 1, 2].every(
            (axis: number): boolean =>
              min[axis] <= box.max[axis] && max[axis] >= box.min[axis],
          ),
        )
      )
        continue;
      for (let edge: number = 0; edge < 3; edge++) {
        const a: number = ids[edge],
          b: number = ids[(edge + 1) % 3],
          pa: number[] = mesh.positions[a],
          pb: number[] = mesh.positions[b],
          id: string = key(a, b);
        if (
          split.has(id) ||
          Math.hypot(
            ...pa.map((p: number, axis: number): number => p - pb[axis]),
          ) <= spacing
        )
          continue;
        const delta: number[] = pa.map(
            (p: number, axis: number): number => pb[axis] - p,
          ),
          na: number[] = normals[a],
          nb: number[] = normals[b];
        const dotA: number = delta.reduce(
            (s: number, p: number, axis: number): number => s + p * na[axis],
            0,
          ),
          dotB: number = delta.reduce(
            (s: number, p: number, axis: number): number => s + p * nb[axis],
            0,
          );
        const midpoint: number[] = pa.map(
          (p: number, axis: number): number =>
            p / 2 +
            pb[axis] / 2 +
            (incidences.get(id) === 2
              ? (dotB * nb[axis] - dotA * na[axis]) / 8
              : 0),
        );
        if (
          midpoint.every(
            (p: number, axis: number): boolean => p === pa[axis],
          ) ||
          midpoint.every((p: number, axis: number): boolean => p === pb[axis])
        )
          throw new Error(
            "Surface sample spacing is below representable coordinate precision.",
          );
        split.set(id, positions.push(midpoint) - 1);
        for (const attribute of [reference, colors])
          if (attribute !== undefined)
            attribute.push(
              attribute[a].map(
                (value: number, axis: number): number =>
                  (value + attribute[b][axis]) / 2,
              ),
            );
        const normal: IAutoMovieVector3 = Vector3.normalize({
          x: na[0] + nb[0],
          y: na[1] + nb[1],
          z: na[2] + nb[2],
        });
        normals.push([normal.x, normal.y, normal.z]);
      }
    }
    if (split.size === 0) return mesh;
    const indices: number[] = [],
      groups: number[] = [];
    for (let face: number = 0; face < mesh.indices.length; face += 3) {
      const v: number[] = mesh.indices.slice(face, face + 3),
        m: (number | undefined)[] = v.map(
          (a: number, i: number): number | undefined =>
            split.get(key(a, v[(i + 1) % 3])),
        );
      const count: number = m.filter(
        (x: number | undefined): boolean => x !== undefined,
      ).length;
      const emit: (...ids: number[]) => void = (...ids: number[]): void => {
        indices.push(...ids);
        for (let n: number = 0; n < ids.length; n += 3)
          groups.push(mesh.groups[face / 3]);
      };
      if (count === 0) emit(...v);
      else if (count === 3)
        emit(
          v[0],
          m[0]!,
          m[2]!,
          m[0]!,
          v[1],
          m[1]!,
          m[2]!,
          m[1]!,
          v[2],
          m[0]!,
          m[1]!,
          m[2]!,
        );
      else {
        // Rotate to the only split edge, or to the first of two adjacent splits.
        const start: number =
          count === 1
            ? m.findIndex((x: number | undefined): boolean => x !== undefined)
            : m.findIndex(
                (x: number | undefined, i: number): boolean =>
                  x !== undefined && m[(i + 1) % 3] !== undefined,
              );
        const [a, b, c]: number[] = [0, 1, 2].map(
          (i: number): number => v[(start + i) % 3],
        );
        const ab: number = m[start]!;
        if (count === 1) emit(a, ab, c, ab, b, c);
        else {
          const bc: number = m[(start + 1) % 3]!;
          emit(ab, b, bc, a, ab, c, ab, bc, c);
        }
      }
    }
    mesh = {
      positions,
      indices,
      groups,
      ...(reference === undefined ? {} : { reference }),
      ...(colors === undefined ? {} : { colors }),
    };
  }
}
