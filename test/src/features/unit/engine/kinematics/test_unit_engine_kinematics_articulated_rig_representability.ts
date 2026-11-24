import { prepareArticulatedRig } from "@automovie/engine";
import type {
  IAutoMovieArticulatedRig,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Three literal non-humanoid identities for the independent large-coordinate
 * chain.
 */
type Bone = "base" | "link" | "tip";

/**
 * Actual composed rigid frames must remain representable, without a size cap.
 *
 * Scenarios:
 *
 * 1. Finite parent/child X translations of +/-1e308 each prepare normally but
 *    their same-sign world sum exceeds binary64 and read must throw
 *    RangeError.
 * 2. A finite root placement plus a finite base translation likewise refuses at
 *    the actual composed-frame boundary rather than returning Infinity.
 * 3. Three 1e307 local translations under a 2e307 root retain the literal world
 *    coordinates 3e307, 4e307 and 5e307 with finite unit quaternions.
 * 4. The finite chain 1e308, -1e308, 1e308 retains the exact cancelling
 *    coordinates 1e308, zero and 1e308 rather than rejecting large operands.
 */
export function test_unit_engine_kinematics_articulated_rig_representability(): void {
  for (const sign of [-1, 1] as const) {
    const reader: ReturnType<typeof prepareArticulatedRig<Bone>> =
      prepareArticulatedRig(rig([sign * 1e308, sign * 1e308, 0]));
    TestValidator.predicate(
      `finite ${sign} parent and child overflow refuses at read`,
      rangeError((): unknown => reader.read()),
    );
  }

  const reader: ReturnType<typeof prepareArticulatedRig<Bone>> =
    prepareArticulatedRig(rig([1e308, 0, 0]));
  TestValidator.predicate(
    "finite caller root plus finite base overflow refuses",
    rangeError((): unknown =>
      reader.read(undefined, {
        translation: { x: 1e308, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      }),
    ),
  );

  const largeFrames: ReadonlyMap<Bone, IAutoMovieTransform> =
    prepareArticulatedRig(rig([1e307, 1e307, 1e307])).read(undefined, {
      translation: { x: 2e307, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    });
  for (const [bone, expected] of [
    ["base", 3],
    ["link", 4],
    ["tip", 5],
  ] as const) {
    const frame: IAutoMovieTransform = largeFrames.get(bone)!;
    TestValidator.predicate(
      `${bone} preserves a representable large world coordinate`,
      nclose(frame.translation.x / 1e307, expected, 1e-12) &&
        nclose(frame.translation.y, 0, 1e-12) &&
        nclose(frame.translation.z, 0, 1e-12),
    );
    TestValidator.predicate(
      `${bone} returns a finite nonzero unit quaternion`,
      nclose(
        Math.hypot(
          frame.rotation.x,
          frame.rotation.y,
          frame.rotation.z,
          frame.rotation.w,
        ),
        1,
        1e-12,
      ),
    );
  }

  const cancelled: ReadonlyMap<Bone, IAutoMovieTransform> =
    prepareArticulatedRig(rig([1e308, -1e308, 1e308])).read();
  for (const [bone, expected] of [
    ["base", 1],
    ["link", 0],
    ["tip", 1],
  ] as const)
    TestValidator.predicate(
      `${bone} preserves finite large cancellation`,
      nclose(cancelled.get(bone)!.translation.x / 1e308, expected, 1e-12),
    );
}

/**
 * A finite three-link identity-rotation input; its local X values are supplied
 * explicitly.
 */
function rig(
  localX: readonly [number, number, number],
): IAutoMovieArticulatedRig<Bone> {
  return {
    id: "representable-chain",
    bones: (["base", "link", "tip"] as const).map(
      (
        bone: Bone,
        index: number,
      ): IAutoMovieArticulatedRig<Bone>["bones"][number] => ({
        bone,
        parent: bone === "base" ? null : bone === "link" ? "base" : "link",
        rest: {
          translation: { x: localX[index]!, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        axes: {
          flexion: { x: 1, y: 0, z: 0 },
          abduction: { x: 0, y: 0, z: 1 },
          twist: { x: 0, y: 1, z: 0 },
        },
        limits: null,
      }),
    ),
  };
}

/** Derived-frame refusal must be RangeError rather than an incidental exception. */
function rangeError(read: () => unknown): boolean {
  try {
    read();
    return false;
  } catch (error) {
    return error instanceof RangeError;
  }
}
