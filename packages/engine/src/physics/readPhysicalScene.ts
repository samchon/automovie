import type { IAutoMovieRigidTransform } from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";

/**
 * Own one simultaneous native scene per controller tick. A later ownership
 * write refreshes only its body's changed transforms, preserving snapshots
 * already retained by fitted plans.
 */
export function readPhysicalScene(
  bound: Bound,
  previous?: Readonly<
    Record<string, Readonly<Record<string, IAutoMovieRigidTransform>>>
  >,
  body?: string,
): Record<string, Record<string, IAutoMovieRigidTransform>> {
  let result: Record<
    string,
    Record<string, IAutoMovieRigidTransform>
  > = (previous as Record<string, Record<string, IAutoMovieRigidTransform>>) ??
  Object.create(null);
  for (const [id, segments] of bound.segments) {
    if (body !== undefined && id !== body) continue;
    let current: Record<string, IAutoMovieRigidTransform> =
      result[id] ?? Object.create(null);
    let owned: boolean = previous === undefined || result[id] === undefined;
    for (const [bone, rigid] of segments) {
      const position: IAutoMovieRigidTransform["position"] =
        rigid.translation();
      const rotation: IAutoMovieRigidTransform["rotation"] = rigid.rotation();
      const before: IAutoMovieRigidTransform | undefined = current[bone];
      if (
        before &&
        before.position.x === position.x &&
        before.position.y === position.y &&
        before.position.z === position.z &&
        before.rotation.x === rotation.x &&
        before.rotation.y === rotation.y &&
        before.rotation.z === rotation.z &&
        before.rotation.w === rotation.w
      )
        continue;
      if (!owned) {
        current = { ...current };
        owned = true;
      }
      current[bone] = { position, rotation };
    }
    if (current !== result[id]) {
      if (result === previous) result = { ...result };
      result[id] = current;
    }
  }
  return result;
}
