import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";

/** Own one simultaneous native scene per controller tick. A later ownership write refreshes only its body's changed transforms, preserving snapshots already retained by fitted plans. */
export function readPhysicalScene(
  bound: Bound,
  previous?: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
  body?: string,
): Record<string, Record<string, P.ITransform>> {
  let result: Record<
    string,
    Record<string, P.ITransform>
  > = (previous as Record<string, Record<string, P.ITransform>>) ??
  Object.create(null);
  for (const [id, segments] of bound.segments) {
    if (body !== undefined && id !== body) continue;
    let current: Record<string, P.ITransform> =
      result[id] ?? Object.create(null);
    let owned: boolean = previous === undefined || result[id] === undefined;
    for (const [bone, rigid] of segments) {
      const position: P.ITransform["position"] = rigid.translation();
      const rotation: P.ITransform["rotation"] = rigid.rotation();
      const before: P.ITransform | undefined = current[bone];
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
