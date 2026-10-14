import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieFootprintRing } from "./IAutoMovieFootprintRing";
/**
 * Prepare a borrowed world ring and its owned XZ projection for repeated footprint queries.
 *
 * @evidence contracts/common.md#principled-implementation Mapping XZ to plan XY and the signed shoelace sum preserve authored order and winding; simple admitted rings are the caller premise, and direct products retain binary64 cancellation and overflow limits.
 * @evidence contracts/common.md#clear-and-simple-design One ring owner supplies both membership and area readers without replacing concave geometry with a hull.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No malformed ring is repaired or clamped here; admission belongs to region validation and an empty ring has signed area zero.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed world points, owned projected points, signed doubled square-metre area and the need to rebuild after source mutation.
 * @evidence contracts/performance.md#efficient-algorithms E vertices require O(E) projection and area work with O(E) owned plan storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared plan and area serve subsequent queries of the same point generation; borrowed source mutation invalidates both and is not watched.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh wrapper and projection, which retain the supplied points until discarded; there are no tasks or host handles.
 * @author Samchon
 */
export const footprintRing: (points: readonly IAutoMovieVector3[]) => IAutoMovieFootprintRing = (
  points: readonly IAutoMovieVector3[],
): IAutoMovieFootprintRing => {
  const plan: { x: number; y: number; }[] = points.map((point: IAutoMovieVector3): { x: number; y: number; } => ({ x: point.x, y: point.z }));
  let doubleArea: number = 0;
  for (let index: number = 0; index < plan.length; ++index) {
    const current: { x: number; y: number; } = plan[index]!;
    const next: { x: number; y: number; } = plan[(index + 1) % plan.length]!;
    doubleArea += current.x * next.y - next.x * current.y;
  }
  return { points, plan, doubleArea };
};
