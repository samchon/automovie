import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";

/** Read actual maintained rest joint centres into relative frames before construction.
 * Human already declares the rest rotations as identity. This adapter does not
 * claim to solve or re-certify its clinical constraints or native-A conversion.
 */
export function resolveAutoMovieCurveParentFrames(
  skeleton: IAutoMovieHumanSkeleton,
): C.Frame[] {
  const positions: Map<string, C.Vector> = new Map();
  const output: C.Frame[] = [];
  for (const joint of skeleton.joints) {
    const point: C.Vector = [
      joint.position.x,
      joint.position.y,
      joint.position.z,
    ];
    const parent: C.Vector | undefined =
      joint.parent === null ? undefined : positions.get(joint.parent);
    if (
      positions.has(joint.bone) ||
      !point.every(Number.isFinite) ||
      (joint.parent !== null && parent === undefined)
    )
      throw new Error("A unique parent-first finite rest skeleton is required");
    output.push({
      bone: joint.bone,
      parent: joint.parent,
      rotation: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      translationMm:
        parent === undefined
          ? point
          : (point.map(
              (x: number, i: number): number => x - parent[i]!,
            ) as unknown as C.Vector),
    });
    positions.set(joint.bone, point);
  }
  return output;
}
