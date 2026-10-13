import type { IAutoMovieHumanFaceContactCollider as ImportedIAutoMovieHumanFaceContactCollider } from "@automovie/human";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceDynamicCollider } from "../../basis/IHumanFaceDynamicCollider";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { createHumanFaceOralArchQueryMesh } from "./createHumanFaceOralArchQueryMesh";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";

/**
 * Supply exact performed oral query geometry using the existing jaw motion. Each present crown retains the source collider's original cervical closure triangles. Those caps are numerical query topology, not visible root tissue. Absent crowns contribute neither enamel nor their cap. The generated lining and its vestibular wall form one physical open sheet per arch, independent of gingival/palatal material regions, with the resident owner's existing reach and cover policy. Final soft lip strips are not rigid obstacles.
 *
 * @evidence contracts/common.md#principled-implementation Present native crowns keep exact cervical query caps and complete arch sheets receive the existing jaw transform.
 * @evidence contracts/common.md#clear-and-simple-design Material-independent rigid queries remain separate from visible root tissue and performed soft lip strips.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent crowns add neither enamel nor cap; missing original numerical closure refuses and caps are not biological tissue.
 * @evidence contracts/common.md#meaningful-documentation Rest/posed meshes retain head metres and stable dental/lining point-id order.
 * @evidence contracts/performance.md#efficient-algorithms Source crown extraction, closure filtering, per-mesh cloning/transforms and physical arch gathering dominate work.
 * @evidence contracts/performance.md#reuse-equivalent-work One source dental contact owner and canonical arch-query builder serve all current colliders.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned collider snapshots are owned and retained with the new assembly; original parts/absence sets remain borrowed.
 *
 * @author Samchon
 */
export function poseHumanFaceOralAssembly(
  basis: IAutoMovieHumanFaceBasis,
  rest: ReadonlyMap<string, readonly number[]>,
  assembly: IHumanFaceOralAssembly,
  jaw: IAutoMovieHumanFaceRigidMotion,
): IHumanFaceOralAssembly {
  const dental: readonly number[] = rest.get(assembly.dentalSurface)!;
  const source: ImportedIAutoMovieHumanFaceContactCollider | undefined = basis.contact?.colliders.find(
    (collider: ImportedIAutoMovieHumanFaceContactCollider): boolean => collider.surface === assembly.dentalSurface,
  );
  if (source === undefined)
    throw new Error(
      "Oral assembly needs its registered source dental contact owner.",
    );
  const pose: (mesh: IAutoMovieMesh, mandibular: boolean) => IAutoMovieMesh = (mesh: IAutoMovieMesh, mandibular: boolean): IAutoMovieMesh => {
    const result: IAutoMovieMesh = structuredClone(mesh);
    if (mandibular)
      for (let at: number = 0; at < result.positions.length; at += 3) {
        const point: ImportedIAutoMovieVector3 = Vector3.create(...result.positions.slice(at, at + 3));
        const placed: ImportedIAutoMovieVector3 = Vector3.add(
          Vector3.add(
            jaw.pivot,
            Quaternion.rotateVector(
              jaw.rotation,
              Vector3.subtract(point, jaw.pivot),
            ),
          ),
          jaw.translation,
        );
        result.positions.splice(at, 3, placed.x, placed.y, placed.z);
      }
    if (mandibular && result.normals !== null)
      for (let at: number = 0; at < result.normals.length; at += 3) {
        const normal: ImportedIAutoMovieVector3 = Quaternion.rotateVector(
          jaw.rotation,
          Vector3.create(...result.normals.slice(at, at + 3)),
        );
        result.normals.splice(at, 3, normal.x, normal.y, normal.z);
      }
    return result;
  };
  const colliders: IHumanFaceDynamicCollider[] = [];
  const dentalColliders: IHumanFaceDynamicCollider[] = [];
  const dentalColliderIds: IHumanFaceOralCrown["id"][] = [];
  for (const crown of readHumanFaceOralCrowns(basis)) {
    if (
      crown.vertices.some((vertex: number): boolean => assembly.absentDentalVertices.has(vertex))
    )
      continue;
    const allowed: Set<number> = new Set(crown.vertices);
    const closure: number[] = [];
    for (let at: number = 0; at < source.closure.length; at += 3) {
      const triangle: number[] = source.closure.slice(at, at + 3);
      if (triangle.every((vertex: number): boolean => allowed.has(vertex)))
        closure.push(...triangle);
    }
    if (closure.length === 0)
      throw new Error(
        "Oral crown needs its source's numerical cervical closure: " + crown.id,
      );
    const indices: Map<number, number> = new Map(crown.vertices.map((vertex: number, at: number): [number, number] => [vertex, at]));
    const mesh: IAutoMovieMesh = {
      positions: crown.vertices.flatMap((vertex: number): number[] =>
        dental.slice(3 * vertex, 3 * vertex + 3),
      ),
      indices: [...crown.indices, ...closure].map(
        (vertex: number): number => indices.get(vertex)!,
      ),
      normals: null,
      uvs: null,
      skin: null,
    };
    const collider: { id: string; pointIds: string[]; rest: IAutoMovieMesh; posed: IAutoMovieMesh; } = {
      id: "oral:tooth-" + crown.id,
      pointIds: crown.vertices.map((vertex: number): string => "dental:" + vertex),
      rest: mesh,
      posed: pose(mesh, crown.mandibular),
    };
    colliders.push(collider);
    dentalColliders.push(collider);
    dentalColliderIds.push(crown.id);
  }
  for (const owner of ["head", "jaw"] as const) {
    let pointIds: readonly string[] = [];
    const mesh: IAutoMovieMesh = createHumanFaceOralArchQueryMesh(
      assembly.parts,
      owner,
      (ids: readonly string[]): void => {
        pointIds = ids;
      },
    );
    colliders.push({
      id: "oral:" + (owner === "jaw" ? "mandibular" : "maxillary") + ":lining",
      pointIds,
      rest: mesh,
      posed: pose(mesh, owner === "jaw"),
    });
  }
  return { ...assembly, colliders, dentalColliders, dentalColliderIds };
}
