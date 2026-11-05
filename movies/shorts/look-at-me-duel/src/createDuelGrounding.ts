import { AutoMovieHumanGrounding, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame } from "@automovie/human";
import type { AutoMovieHumanPolygon } from "@automovie/viewer/human-polygon";
import type * as THREE from "three";

/**
 * Prepare floor fitting from every actual displayed foot vertex, including toes.
 *
 * @evidence contracts/common.md#implementation-and-ownership The polygon registry supplies real bone-local Float32 vertices; Human owns clinical FK, floor inequalities and residual admission. Every mesh whose rest ancestry reaches either Foot is included, followed by every supplied actual footwear vertex. This adapter neither flattens Human feet nor substitutes a landmark hull. Arrays remain actor-scoped.
 * @evidence contracts/common.md#authoring-interface Supply the fixed body's matching drawing/evaluator and optional actual emitted footwear points in registered bone frames. Returned public solver consumes world roots, targets and channels under its own contract. Consume admitted/unresolved status and residuals; preparation grants no support. Recreate when body or footwear geometry changes.
 */
export function createDuelGrounding(drawing: AutoMovieHumanPolygon.IDrawing, evaluate: AutoMovieHumanSkeleton.PoseEvaluator, footwear: readonly AutoMovieHumanSupportFrame.IPoint[] = []): {
  solve: AutoMovieHumanGrounding.IPrepared;
  points: readonly AutoMovieHumanSupportFrame.IPoint[];
} {
  const reference: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const parents: Map<string, string | null> = new Map(reference.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
  const points: AutoMovieHumanSupportFrame.IPoint[] = [];
  for (const [bone, mesh] of drawing.parts) {
    let ancestor: string | null | undefined = bone;
    const visited: Set<string> = new Set();
    while (ancestor !== undefined && ancestor !== null && ancestor !== "leftFoot" && ancestor !== "rightFoot") {
      if (visited.has(ancestor)) throw new Error("Cyclic generated foot ancestry");
      visited.add(ancestor);
      ancestor = parents.get(ancestor);
    }
    if (ancestor !== "leftFoot" && ancestor !== "rightFoot") continue;
    const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute = mesh.geometry.getAttribute("position");
    for (let index: number = 0; index < attribute.count; index++)
      points.push({ bone: AutoMovieHumanRigControls.joint(bone), localPoint: [attribute.getX(index), attribute.getY(index), attribute.getZ(index)] });
  }
  if (points.length === 0) throw new Error("No actual generated foot vertices available");
  points.push(...footwear.map((point: AutoMovieHumanSupportFrame.IPoint): AutoMovieHumanSupportFrame.IPoint => ({ bone: point.bone, localPoint: [...point.localPoint] })));
  return { solve: AutoMovieHumanGrounding.prepare(evaluate, points), points };
}
