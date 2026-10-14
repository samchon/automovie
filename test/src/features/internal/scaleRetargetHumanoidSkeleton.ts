import type { IAutoMovieBone, IAutoMovieSkeleton } from "@automovie/interface";

/** Preserve the original fixture operation: replace id and multiply only every rest translation by factor, copying bone/rest/translation wrappers while borrowing rotations, scales and constraints. Admission remains with the retarget consumer. */
export function scaleRetargetHumanoidSkeleton(
  skeleton: IAutoMovieSkeleton,
  id: string,
  factor: number,
): IAutoMovieSkeleton {
  return {
    id,
    bones: skeleton.bones.map(
      (b: IAutoMovieBone): IAutoMovieBone => ({
        ...b,
        rest: {
          ...b.rest,
          translation: {
            x: b.rest.translation.x * factor,
            y: b.rest.translation.y * factor,
            z: b.rest.translation.z * factor,
          },
        },
      }),
    ),
  };
}
