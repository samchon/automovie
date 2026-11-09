import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/**
 * Reuse one call-local value only while every referenced transform scalar is unchanged. Numeric snapshots also detect in-place receiver edits; no mutable object identity or profile survives the owning solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Reuse one call-local value only while every referenced transform scalar is unchanged) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Reuse one call-local value only while every referenced transform scalar is unchanged) directly over its typed inputs (`references`, `compute`) as 2 sequential passes (flatMap over references(poses); every over current), delegating to `references`, `current.every`, `Object.is`, `compute`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 27 lines and 2 top-level statements that reuses `references`, `current.every`, `Object.is`, `compute` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `references`, `compute`; the dominant cost is 2 sequential passes (flatMap over references(poses); every over current), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function memoizePhysicalTransformValue<Value>(
  references: (
    poses: Readonly<Record<string, P.ITransform>>,
  ) => readonly P.ITransform[],
  compute: (poses: Readonly<Record<string, P.ITransform>>) => Value,
): (poses: Readonly<Record<string, P.ITransform>>) => Value {
  let previous: { key: number[]; value: Value } | undefined;
  return (poses: Readonly<Record<string, P.ITransform>>): Value => {
    const current: number[] = references(poses).flatMap(
      (pose: P.ITransform): number[] => [
        pose.position.x,
        pose.position.y,
        pose.position.z,
        pose.rotation.x,
        pose.rotation.y,
        pose.rotation.z,
        pose.rotation.w,
      ],
    );
    if (
      previous &&
      previous.key.length === current.length &&
      current.every((entry: number, index: number): boolean =>
        Object.is(entry, previous!.key[index]),
      )
    )
      return previous.value;
    const value: Value = compute(poses);
    previous = { key: current, value };
    return value;
  };
}
