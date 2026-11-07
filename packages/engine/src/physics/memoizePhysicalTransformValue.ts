import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Reuse one call-local value only while every referenced transform scalar is unchanged. Numeric snapshots also detect in-place receiver edits; no mutable object identity or profile survives the owning solve. */
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
      current.every(
        (entry: number, index: number): boolean =>
          Object.is(entry, previous!.key[index]),
      )
    )
      return previous.value;
    const value: Value = compute(poses);
    previous = { key: current, value };
    return value;
  };
}
