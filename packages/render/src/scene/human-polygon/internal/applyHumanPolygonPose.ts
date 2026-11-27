import type {
  IAutoMovieHumanBonePlacement,
  IAutoMovieHumanSkeleton,
} from "@automovie/interface";
import type * as THREE from "three";

/*
 * Apply one complete evaluated body-frame pose to the actual flat polygon
 * groups and their diagnostics. Each local probe is a registered rest point
 * minus its bone's rest joint; the actor parent transform composes once.
 */
export function applyHumanPolygonPose(
  object: THREE.Group,
  bindings: ReadonlyMap<string, readonly THREE.Object3D[]>,
  required: readonly string[],
  output: Pick<
    Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed">,
    "posed"
  >,
): void {
  const placements: Map<string, IAutoMovieHumanBonePlacement> = new Map();
  for (const placement of output.posed) {
    const p: IAutoMovieHumanBonePlacement["position"] = placement.position;
    const q: IAutoMovieHumanBonePlacement["rotation"] = placement.rotation;
    if (
      placements.has(placement.bone) ||
      p.length !== 3 ||
      q.length !== 4 ||
      Math.abs(q[0] ** 2 + q[1] ** 2 + q[2] ** 2 + q[3] ** 2 - 1) > 1e-6
    )
      throw new Error(
        `Invalid or duplicate polygon placement: ${placement.bone}`,
      );
    placements.set(placement.bone, placement);
  }
  for (const bone of required)
    if (!placements.has(bone))
      throw new Error(`Missing polygon placement: ${bone}`);

  for (const [bone, targets] of bindings) {
    const placement: IAutoMovieHumanBonePlacement = placements.get(bone)!;
    for (const target of targets) {
      target.position.set(...placement.position);
      target.quaternion.set(...placement.rotation);
      target.updateMatrix();
    }
  }
  object.updateWorldMatrix(true, true);
}
