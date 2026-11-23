import type { IAutoMovieRigidTransform } from "@automovie/interface";

/**
 * Reuse one call-local value only while every referenced transform scalar is unchanged. Numeric snapshots also detect in-place receiver edits; no mutable object identity or profile survives the owning solve.
 */
export function memoizePhysicalTransformValue<Value>(
  references: (
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
  ) => readonly IAutoMovieRigidTransform[],
  compute: (poses: Readonly<Record<string, IAutoMovieRigidTransform>>) => Value,
): (poses: Readonly<Record<string, IAutoMovieRigidTransform>>) => Value {
  let previous: { key: number[]; value: Value } | undefined;
  return (poses: Readonly<Record<string, IAutoMovieRigidTransform>>): Value => {
    const current: number[] = references(poses).flatMap(
      (pose: IAutoMovieRigidTransform): number[] => [
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
