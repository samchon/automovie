import type { AutoMovieHumanoidBone, IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanSurfaceDefinition as D } from "../surface/IAutoMovieHumanSurfaceDefinition";

/**
 * Bind the actual generated skin through its declared skeletal support owners.
 * All incident patches contribute candidates at a shared physical vertex, so UV
 * or normal-fan duplicates receive identical weights. Candidate bone segments
 * belong to the one generated rest skeleton; no old cage address is consulted.
 *
 * Inverse-fourth-distance weighting retains the existing engineering pose
 * placeholder, not calibrated tissue motion. Four strongest influences are
 * normalized. The call scans actual triangle incidence, then each physical
 * vertex's small candidate set. Maps and rankings are call-owned O(V+F+B) data;
 * only the returned joint table and four influences per render vertex survive.
 */
export function skinAutoMovieHumanSurface(props: {
  mesh: IAutoMovieMesh;
  trianglePatches: readonly string[];
  definition: D;
  skeleton: IAutoMovieHumanSkeleton;
}): NonNullable<IAutoMovieMesh["skin"]> {
  const physical: IAutoMovieMesh["physicalVertices"] = props.mesh.physicalVertices;
  const indices: number[] | null = props.mesh.indices;
  if (physical === undefined || indices === null ||
      props.trianglePatches.length * 3 !== indices.length)
    throw new Error("Generated skin binding requires exact triangle and physical ownership");
  const candidates: Map<number, Set<AutoMovieHumanoidBone>> = new Map();
  const representative: Map<number, number> = new Map();
  for (let triangle: number = 0; triangle < props.trianglePatches.length; ++triangle) {
    const owner: D.Patch | undefined = props.definition.patches.get(props.trianglePatches[triangle]!);
    if (owner === undefined || owner.bones.length === 0)
      throw new Error("Generated skin patch needs explicit skeletal supports");
    for (let corner: number = 0; corner < 3; ++corner) {
      const vertex: number = indices[triangle * 3 + corner]!;
      const id: number | null = physical.vertices[vertex]!;
      if (id === null) throw new Error("Generated skin vertex has no physical owner");
      let bones: Set<AutoMovieHumanoidBone> | undefined = candidates.get(id);
      if (bones === undefined) {
        bones = new Set(); candidates.set(id, bones); representative.set(id, vertex);
      }
      for (const bone of owner.bones) bones.add(bone);
    }
  }
  const segments: Map<AutoMovieHumanoidBone, IAutoMovieHumanSkeleton.IJoint> = new Map(
    props.skeleton.joints.map((joint: IAutoMovieHumanSkeleton.IJoint): [AutoMovieHumanoidBone, IAutoMovieHumanSkeleton.IJoint] => [joint.bone, joint]),
  );
  const joints: AutoMovieHumanoidBone[] = [];
  const jointIds: Map<AutoMovieHumanoidBone, number> = new Map();
  const influences: Map<number, [number, number][]> = new Map();
  for (const [id, bones] of candidates) {
    const vertex: number = representative.get(id)!;
    const p: number[] = props.mesh.positions.slice(3 * vertex, 3 * vertex + 3).map(
      (x: number): number => x * 1000,
    );
    const ranked: [AutoMovieHumanoidBone, number][] = [...bones].map(
      (bone: AutoMovieHumanoidBone): [AutoMovieHumanoidBone, number] => {
        const joint: IAutoMovieHumanSkeleton.IJoint | undefined = segments.get(bone);
        if (joint === undefined) throw new Error(`Missing generated skeletal support ${bone}`);
        const a: number[] = [joint.position.x, joint.position.y, joint.position.z];
        const d: number[] = [joint.tail.x-a[0]!, joint.tail.y-a[1]!, joint.tail.z-a[2]!];
        const length2: number = d.reduce((sum: number, x: number): number => sum+x*x, 0);
        const t: number = length2 === 0 ? 0 : Math.max(0, Math.min(1,
          d.reduce((sum: number, x: number, k: number): number => sum+x*(p[k]!-a[k]!), 0)/length2,
        ));
        const squared: number = d.reduce(
          (sum: number, x: number, k: number): number => sum+(p[k]!-a[k]!-t*x)**2, 0,
        );
        return [bone, 1/(squared+1)**2];
      },
    ).sort((a: [AutoMovieHumanoidBone, number], b: [AutoMovieHumanoidBone, number]): number => b[1]-a[1]).slice(0,4);
    const total: number = ranked.reduce((sum: number, pair: [AutoMovieHumanoidBone, number]): number => sum+pair[1], 0);
    const selected: [number, number][] = ranked.map(
      ([bone, weight]: [AutoMovieHumanoidBone, number]): [number, number] => {
        let index: number | undefined = jointIds.get(bone);
        if (index === undefined) { index=joints.length; jointIds.set(bone,index); joints.push(bone); }
        return [index, weight/total];
      },
    );
    while (selected.length < 4) selected.push([0,0]);
    influences.set(id, selected);
  }
  const boneIndices: number[] = [];
  const weights: number[] = [];
  for (const id of physical.vertices) {
    const selected: [number, number][] | undefined = id === null ? undefined : influences.get(id);
    if (selected === undefined) throw new Error("Unreferenced generated skin vertex cannot be bound");
    for (const [bone, weight] of selected) { boneIndices.push(bone); weights.push(weight); }
  }
  return { joints, boneIndices, weights };
}
