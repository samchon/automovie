import type { AutoMovieHumanSkeleton } from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import * as THREE from "three";

/**
 * Inspect the actual fixed model consumed by this movie, without regenerating it.
 * @evidence contracts/common.md#implementation-and-ownership Reads every attached mesh position/index and independently compares all canonical foot course samples with the emitted ring-major Float32 vertices in their actual bind-joint frames. Retains the actual geometry bytes as numbers for a downstream SHA receipt. This proves this fixed model's finite construction and source projection, not Human's global shape quality or motion clearance.
 * @evidence contracts/common.md#authoring-interface Supply the same neutral source and completed drawing used by the actor. Throws on nonfinite/invalid geometry or source correspondence loss. Returned model data is an owned fixed snapshot; live pose/root transforms and actual floor admission remain separately measured.
 */
export function inspectHumanModel(source: AutoMovieHumanSkeleton.IOutput, drawing: AutoMovieHumanPolygon.IDrawing): {
  meshes: { ordinal: number; parent: string[]; transform: number[]; positions: number[]; indices: number[] | null }[];
  bind: AutoMovieHumanSkeleton.IBone[];
  neutral: AutoMovieHumanSkeleton.IPlacement[];
  vertices: number;
  footSamples: number;
  maximumFootProjectionError: number;
  initialPlantarSupport: AutoMovieHumanPolygon.IDrawing["plantarSupport"];
} {
  const meshes: { ordinal: number; parent: string[]; transform: number[]; positions: number[]; indices: number[] | null }[] = [];
  let vertices: number = 0;
  drawing.object.traverse((object: THREE.Object3D): void => {
    if (!(object instanceof THREE.Mesh)) return;
    const positions: THREE.BufferAttribute = object.geometry.getAttribute("position") as THREE.BufferAttribute;
    const values: number[] = Array.from(positions.array);
    const index: THREE.BufferAttribute | null = object.geometry.getIndex();
    const indices: number[] | null = index ? Array.from(index.array) : null;
    if (!values.every(Number.isFinite) || (indices !== null && !indices.every((value: number): boolean => Number.isSafeInteger(value) && value >= 0 && value < positions.count)))
      throw new Error("Actual movie model has invalid geometry");
    const parent: string[] = [];
    let owner: THREE.Object3D | null = object.parent;
    while (owner && owner !== drawing.object) { parent.unshift(owner.name); owner = owner.parent; }
    meshes.push({ ordinal: meshes.length, parent, transform: [...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray()], positions: values, indices }); vertices += positions.count;
  });
  if (!source.footSurface) throw new Error("Movie model requires its actual foot exterior source");
  let samples: number = 0;
  let maximum: number = 0;
  for (const side of ["left", "right"] as const) for (const name of ["hindfoot", "forefoot"] as const) {
    const module: NonNullable<typeof source.footSurface>[typeof side][typeof name] = source.footSurface[side][name];
    const bone: AutoMovieHumanSkeleton.IBone | undefined = source.bones.find((item: AutoMovieHumanSkeleton.IBone): boolean => item.bone === module.bone);
    const mesh: THREE.Mesh | undefined = drawing.parts.get(module.bone);
    if (!bone || !mesh) throw new Error("Actual foot projection module is absent");
    const positions: THREE.BufferAttribute = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    let index: number = 0;
    for (const course of module.courses) for (const point of course.points) {
      if (index >= positions.count) throw new Error("Foot projection omits source samples");
      const expected: THREE.Vector3 = new THREE.Vector3(Math.fround(point[0] - bone.position[0]), Math.fround(point[1] - bone.position[1]), Math.fround(point[2] - bone.position[2]));
      maximum = Math.max(maximum, expected.distanceTo(new THREE.Vector3().fromBufferAttribute(positions, index++))); samples++;
    }
  }
  if (maximum > 1e-7) throw new Error("Movie foot projection differs from its canonical source: " + maximum);
  return { meshes, bind: structuredClone(source.bones), neutral: structuredClone(source.posed), vertices, footSamples: samples, maximumFootProjectionError: maximum, initialPlantarSupport: drawing.plantarSupport };
}
