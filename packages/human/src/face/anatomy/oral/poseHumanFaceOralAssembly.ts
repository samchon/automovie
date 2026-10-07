import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceRigidMotion } from "../../structures/IAutoMovieHumanFaceRigidMotion";
import type { IHumanFaceDynamicCollider } from "../../basis/IHumanFaceDynamicCollider";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { readHumanFaceOralCrowns } from "./readHumanFaceOralCrowns";
import { createHumanFaceOralArchQueryMesh } from "./createHumanFaceOralArchQueryMesh";

/**
 * Supply exact performed oral query geometry using the existing jaw motion.
 * Each present crown retains the source collider's original cervical closure
 * triangles. Those caps are numerical query topology, not visible root tissue.
 * Absent crowns contribute neither enamel nor their cap. The generated lining
 * and its vestibular wall form one physical open sheet per arch, independent
 * of gingival/palatal material regions, with the resident owner's existing
 * reach and cover policy. Final soft lip strips are not rigid obstacles.
 *
 * @evidence contracts/common.md#principled-implementation Actual displayed crown incidence and original source closure form each closed query; one shared jaw motion carries both native crowns and new lining.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent crowns remove real query geometry; no guessed cap or replacement tolerance enters.
 * @evidence contracts/modeling.md#shared-boundaries Source cervical closure is reused exactly and generated lining query points match drawing before the same rigid motion.
 * @evidence contracts/modeling.md#spatial-conventions Both query states use source head-frame metres and the existing mandibular quaternion/translation.
 * @evidence contracts/anatomy.md#anatomical-source Crown query caps are source numerical closures; open lining is authored visible tissue rather than reconstructed hidden anatomy.
 * @author Samchon
 */
export function poseHumanFaceOralAssembly(
  basis: IAutoMovieHumanFaceBasis,
  rest: ReadonlyMap<string, readonly number[]>,
  assembly: IHumanFaceOralAssembly,
  jaw: IAutoMovieHumanFaceRigidMotion,
): IHumanFaceOralAssembly {
  const dental = rest.get(assembly.dentalSurface)!;
  const source = basis.contact?.colliders.find(collider => collider.surface === assembly.dentalSurface);
  if (source === undefined) throw new Error("Oral assembly needs its registered source dental contact owner.");
  const pose = (mesh: IAutoMovieMesh, mandibular: boolean): IAutoMovieMesh => {
    const result = structuredClone(mesh);
    if (mandibular) for (let at = 0; at < result.positions.length; at += 3) {
      const point = Vector3.create(...result.positions.slice(at, at + 3));
      const placed = Vector3.add(Vector3.add(jaw.pivot, Quaternion.rotateVector(jaw.rotation, Vector3.subtract(point, jaw.pivot))), jaw.translation);
      result.positions.splice(at, 3, placed.x, placed.y, placed.z);
    }
    if (mandibular && result.normals !== null) for (let at = 0; at < result.normals.length; at += 3) {
      const normal = Quaternion.rotateVector(jaw.rotation, Vector3.create(...result.normals.slice(at, at + 3)));
      result.normals.splice(at, 3, normal.x, normal.y, normal.z);
    }
    return result;
  };
  const colliders: IHumanFaceDynamicCollider[] = [];
  const dentalColliders: IHumanFaceDynamicCollider[] = [];
  const dentalColliderIds: IHumanFaceOralCrown["id"][] = [];
  for (const crown of readHumanFaceOralCrowns(basis)) {
    if (crown.vertices.some(vertex => assembly.absentDentalVertices.has(vertex))) continue;
    const allowed = new Set(crown.vertices);
    const closure: number[] = [];
    for (let at = 0; at < source.closure.length; at += 3) {
      const triangle = source.closure.slice(at, at + 3);
      if (triangle.every(vertex => allowed.has(vertex))) closure.push(...triangle);
    }
    if (closure.length === 0) throw new Error("Oral crown needs its source's numerical cervical closure: " + crown.id);
    const indices = new Map(crown.vertices.map((vertex, at) => [vertex, at]));
    const mesh: IAutoMovieMesh = { positions: crown.vertices.flatMap(vertex => dental.slice(3 * vertex, 3 * vertex + 3)),
      indices: [...crown.indices, ...closure].map(vertex => indices.get(vertex)!), normals: null, uvs: null, skin: null };
    const collider = { id: "oral:tooth-" + crown.id, pointIds: crown.vertices.map((vertex) => "dental:" + vertex), rest: mesh, posed: pose(mesh, crown.mandibular) };
    colliders.push(collider); dentalColliders.push(collider); dentalColliderIds.push(crown.id);
  }
  for (const owner of ["head", "jaw"] as const) {
    let pointIds: readonly string[] = [];
    const mesh = createHumanFaceOralArchQueryMesh(assembly.parts, owner, (ids) => { pointIds = ids; });
    colliders.push({ id: "oral:" + (owner === "jaw" ? "mandibular" : "maxillary") + ":lining", pointIds, rest: mesh, posed: pose(mesh, owner === "jaw") });
  }
  return { ...assembly, colliders, dentalColliders, dentalColliderIds };
}
