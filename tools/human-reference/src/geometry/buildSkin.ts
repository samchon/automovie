import { Bone } from "./Bone.ts";
import { GROUPS } from "./GROUPS.ts";
import { Mesh } from "./Mesh.ts";
import { Skin } from "./Skin.ts";
import { V3 } from "./V3.ts";
import { groupOf } from "./groupOf.ts";
import { headComponents } from "./headComponents.ts";
import { weld } from "./weld.ts";

/**
 * Combines fixed source body with its qualified largest head skin component; never changes vertex positions.
 *
 * @evidence contracts/common.md#principled-implementation The qualified body and largest head skin component share one fixed frame and are joined only for private seam connectivity.
 * @evidence contracts/common.md#clear-and-simple-design One assembly owns source remapping and diagnostic weights; no geometry enters the product.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(vertices + triangles) assembly plus source welding; dense weld buckets retain its documented worst case.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned arrays and maps belong to the private assembled skin; no module-global cache is retained.
 */
export function buildSkin(body: Mesh, head: Mesh, pose: Skin["pose"]): Skin {
  const headTriangles: number[] | undefined = headComponents(head)[0]?.tris;
  if (!headTriangles || !body.weights || !head.weights)
    throw new Error(
      "Source skin components and weights must be qualified before assembly",
    );
  const used: Map<number, number> = new Map();
  const vertices: V3[] = [...body.vertices];
  const part: number[] = body.vertices.map((): number => 0);
  const triangles: [number, number, number][] = [...body.triangles];
  for (const i of headTriangles) {
    const triangle: [number, number, number] = head.triangles[i].map(
      (v: number): number => {
        if (!used.has(v)) {
          used.set(v, vertices.length);
          vertices.push(head.vertices[v]);
          part.push(1);
        }
        return used.get(v)!;
      },
    ) as [number, number, number];
    triangles.push(triangle);
  }
  // 0.001 mm is the inherited qualified seam-connectivity protocol, not an anatomical fitting tolerance.
  const canon: Int32Array = weld(vertices, 1e-3);
  const stride: number = GROUPS.length;
  const gw: Float32Array = new Float32Array(vertices.length * stride);
  const bodyGroups: number[] = body.bones.map((b: Bone): number =>
    GROUPS.indexOf(groupOf(b.name)),
  );
  const headGroups: number[] = head.bones.map((b: Bone): number =>
    GROUPS.indexOf(groupOf(b.name)),
  );
  body.weights.forEach((weights: [number, number][], vertex: number): void => {
    for (const [bone, weight] of weights)
      if (weight > 0) gw[vertex * stride + bodyGroups[bone]] += weight;
  });
  for (const [vertex, mapped] of used)
    for (const [bone, weight] of head.weights[vertex])
      if (weight > 0) gw[mapped * stride + headGroups[bone]] += weight;
  return {
    pose,
    vertices,
    triangles,
    canon,
    part: Uint8Array.from(part),
    gw,
    bones: body.boneByName,
    headBones: head.boneByName,
  };
}
