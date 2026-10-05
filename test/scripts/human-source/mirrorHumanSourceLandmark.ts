import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import type { IHumanSourceMirror } from "./structures/IHumanSourceMirror.ts";

/**
 * The left twin of a right-side landmark vertex, from the base mesh's mirror
 * table. The twin must sit at the right vertex's neutral position reflected
 * in x within storage, or the left landmark is refused by name.
 */
export function mirrorHumanSourceLandmark(name: string, positions: readonly number[], mirror: IHumanSourceMirror, vertex: number): number {
  const twin = mirror.twin[vertex];
  const gap = Math.hypot(positions[3 * twin] + positions[3 * vertex], positions[3 * twin + 1] - positions[3 * vertex + 1], positions[3 * twin + 2] - positions[3 * vertex + 2]);
  if (twin === vertex || !(gap <= humanSourcePositionTolerance))
    throw new Error(`Head landmark ${name}: vertex ${vertex} has no exact mirror twin (twin ${twin}, ${gap} m).`);
  return twin;
}
