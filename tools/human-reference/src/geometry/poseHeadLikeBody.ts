import { Bone } from "./Bone.ts";
import { Mesh } from "./Mesh.ts";
import { V3 } from "./V3.ts";
import { affInv } from "./affInv.ts";
import { affMul } from "./affMul.ts";

/**
 * Applies the body's declared linear blend transforms to matching head rig channels.
 * This is a diagnostic pose conversion without tissue correctives or clinical posture equivalence.
 * A supplied native body snaps coincident 0.01 mm neck addresses to the posed body seam explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Declared posed-times-inverse-rest linear blend transforms move matching head rig channels; the result remains a diagnostic without tissue correctives.
 * @evidence contracts/common.md#clear-and-simple-design The optional native-body seam snap is explicit and separate from the blend, using the inherited 0.01 mm address protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms O(bones + influenced vertices) blending with O(vertices + bones) maps and output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated work is reused only inside this operation where source identity is fixed; no cross-call or identity-dependent result cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps are call-local; returned mesh positions are owned by the diagnostic result.
 */
export function poseHeadLikeBody(
  head: Mesh,
  body: Mesh,
  nativeBody?: Mesh,
): Mesh {
  const transforms: Map<string, number[][]> = new Map();
  body.bones.forEach((bone: Bone, i: number): void => {
    if (body.posedM)
      transforms.set(bone.name, affMul(body.posedM[i], affInv(body.restM[i])));
  });
  const channels: (number[][] | null)[] = head.bones.map(
    (bone: Bone): number[][] | null => transforms.get(bone.name) ?? null,
  );
  if (!head.weights)
    throw new Error("Diagnostic head posing requires source weights");
  const vertices: V3[] = head.vertices.map((v: V3, vertex: number): V3 => {
    let x: number = 0,
      y: number = 0,
      z: number = 0,
      sum: number = 0;
    for (const [bone, weight] of head.weights![vertex]) {
      if (!(weight > 0)) continue;
      const matrix: number[][] | null = channels[bone];
      sum += weight;
      if (!matrix) {
        x += weight * v[0];
        y += weight * v[1];
        z += weight * v[2];
      } else {
        x +=
          weight *
          (matrix[0][0] * v[0] +
            matrix[0][1] * v[1] +
            matrix[0][2] * v[2] +
            matrix[0][3]);
        y +=
          weight *
          (matrix[1][0] * v[0] +
            matrix[1][1] * v[1] +
            matrix[1][2] * v[2] +
            matrix[1][3]);
        z +=
          weight *
          (matrix[2][0] * v[0] +
            matrix[2][1] * v[1] +
            matrix[2][2] * v[2] +
            matrix[2][3]);
      }
    }
    return sum > 0 ? [x / sum, y / sum, z / sum] : v;
  });
  if (nativeBody) {
    const key = (point: V3): string =>
      point.map((value: number): number => Math.round(value * 100)).join(",");
    const native: Map<string, number> = new Map();
    nativeBody.vertices.forEach((point: V3, i: number): void => {
      native.set(key(point), i);
    });
    head.vertices.forEach((point: V3, i: number): void => {
      const bodyVertex: number | undefined = native.get(key(point));
      if (bodyVertex !== undefined) vertices[i] = body.vertices[bodyVertex];
    });
  }
  return { ...head, vertices };
}
