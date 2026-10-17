import type { Mesh } from "../geometry/Mesh.ts";
import type { V3 } from "../geometry/V3.ts";
import { dot } from "../geometry/dot.ts";
import { norm } from "../geometry/norm.ts";
import { sub } from "../geometry/sub.ts";
import { handBone } from "./handBone.ts";

/**
 * Observes a digit's skin support maximum along its last registered bone segment.
 * Source rig weights define the diagnostic digit neighborhood: its combined
 * digit influence must exceed one half. This is a rig partition, not a clinical
 * fingertip or nail boundary. It replaces no missing geometry with a guessed tip.
 *
 * @evidence contracts/common.md#principled-implementation Maximizes the physical support dot product over actual finite source coordinates belonging to a declared rig-weight neighborhood; all identities use the same protocol.
 * @evidence contracts/common.md#clear-and-simple-design Owns one explicit distal datum independently from ray origins that may lie outside source skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stores no fixed source vertex index and has no identity-specific branch; absent qualifying source coordinates fail visibly.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes geometric support, the majority-weight convention, source rig registration and clinical fingertip meaning.
 * @evidence contracts/performance.md#efficient-algorithms One bone scan and one vertex-weight scan take O(b+w) time for b bones and w source influences; the transient bone set is O(b).
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the identity's already loaded source weights and coordinates without reloading the mesh or creating a new triangle index.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one source-supported coordinate; the transient bone set and source references are released with the call.
 */
export function handDistalSupport(
  mesh: Mesh,
  digit: string,
  side: "l" | "r",
): V3 {
  if (!mesh.weights)
    throw new Error("Distal support requires source rig weights");
  const direction: V3 = norm(
    sub(
      handBone(mesh, `${digit}_03`, side),
      handBone(mesh, `${digit}_02`, side),
    ),
  );
  const bones: Set<number> = new Set();
  for (const bone of mesh.bones)
    if (bone.name.startsWith(`${digit}_`) && bone.name.endsWith(`_${side}`))
      bones.add(bone.index);
  let best: V3 | undefined;
  let support: number = -Infinity;
  for (let i: number = 0; i < mesh.vertices.length; i++) {
    const point: V3 = mesh.vertices[i];
    let weight: number = 0;
    for (const influence of mesh.weights[i] ?? [])
      if (bones.has(influence[0])) weight += influence[1];
    if (
      weight <= 0.5 ||
      point.some((value: number): boolean => !Number.isFinite(value))
    )
      continue;
    const value: number = dot(point, direction);
    if (value > support) {
      best = point;
      support = value;
    }
  }
  if (!best)
    throw new Error(`No finite source distal support for ${digit}_${side}`);
  return [...best];
}
