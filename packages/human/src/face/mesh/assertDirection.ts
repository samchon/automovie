/**
 * Shared by placePortraitMesh, portraitMeshBuffers, which were one file until each public identity took its own.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-export Preserves each nonredundant face when a static part is placed for export.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export Compares the engine's placed transform with its translation-free local transform, retaining mirror winding and refusing precision-driven face loss.
 * @author Samchon
 */
export function assertDirection(
  before: { x: number; y: number; z: number },
  after: { x: number; y: number; z: number },
  face: number,
  stage: string,
): void {
  const beforeLength = Math.hypot(before.x, before.y, before.z);
  const afterLength = Math.hypot(after.x, after.y, after.z);
  const agreement =
    (before.x / beforeLength) * (after.x / afterLength) +
    (before.y / beforeLength) * (after.y / afterLength) +
    (before.z / beforeLength) * (after.z / afterLength);
  if (!(agreement > 0))
    throw new Error(
      `Portrait ${stage} must preserve nonredundant triangle ${face}.`,
    );
}
