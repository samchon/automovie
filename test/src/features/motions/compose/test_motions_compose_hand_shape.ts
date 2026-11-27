import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";
import {
  AutoMovieMotionClock
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionClock";
import {
  AutoMovieMotionHumanHand
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanHand";
import {
  HumanHand
} from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A posture holding the left index's base at 30 degrees, nothing else. */
const HELD: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: { leftIndexProximal: [30, 0, 0] },
  limbs: {},
};

/**
 * `AutoMovieMotionHumanHand` shapes a hand's segments between the flexion the
 * posture holds (the relaxed cascade where it holds none) and an asked shape,
 * `r + (a + c − r) w` for the fingers under a curl `c` and with no curl for the
 * thumb.
 *
 * Scenarios, the left hand formed into a fist:
 *
 * 1. At weight 1 each segment is the fist's, at weight 0 the relaxed cascade's,
 *    and the prepared reader agrees.
 * 2. At a half weight under a 10-degree curl the index base is halfway to the
 *    fist's plus 10 and the thumb's base halfway to the fist's.
 * 3. The primitive writes the hand's channel only, from the posture's own 30
 *    degrees at the index base, its weight clamped into [0, 1].
 * 4. Formed on a clock, the fist is reached at the rise's end and released at the
 *    fall's end, the primitive's window its rise's start to its fall's end.
 */
export function test_motions_compose_hand_shape(): void {
  const fist: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
    "left",
    "fist",
  );
  const relaxed: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
    "left",
    "relaxed",
  );
  const full: IAutoMovieMotionHumanPosture["joints"] =
    AutoMovieMotionHumanHand.fingers("left", "fist", 0, 1);
  const none: IAutoMovieMotionHumanPosture["joints"] =
    AutoMovieMotionHumanHand.fingers("left", "fist", 0, 0);
  TestValidator.predicate(
    "the fist and the cascade",
    Object.keys(full).length === 15 &&
      full.leftIndexProximal![0] === fist.leftIndexProximal![0] &&
      full.leftLittleDistal![0] === fist.leftLittleDistal![0] &&
      full.leftThumbProximal![0] === fist.leftThumbProximal![0] &&
      none.leftIndexProximal![0] === relaxed.leftIndexProximal![0] &&
      none.leftLittleDistal![0] === relaxed.leftLittleDistal![0] &&
      none.leftThumbProximal![0] === relaxed.leftThumbProximal![0],
  );
  const half: IAutoMovieMotionHumanPosture["joints"] =
    AutoMovieMotionHumanHand.fingers("left", "fist", 10, 0.5);
  const index: number = fist.leftIndexProximal![0];
  const thumb: number = fist.leftThumbProximal![0];
  const r: number = relaxed.leftIndexProximal![0];
  const rt: number = relaxed.leftThumbProximal![0];
  TestValidator.predicate(
    "halfway under a curl",
    nclose(half.leftIndexProximal![0], r + (index + 10 - r) / 2, 1e-12) &&
      nclose(half.leftThumbProximal![0], rt + (thumb - rt) / 2, 1e-12) &&
      nclose(
        AutoMovieMotionHumanHand.prepareFingers("left", "fist")(10, 0.5)
          .leftIndexProximal![0],
        half.leftIndexProximal![0],
        0,
      ),
  );

  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanHand.shape({
      side: "left",
      shape: "fist",
      from: 0,
      to: 1,
      weight: (seconds: number): number => seconds,
    });
  TestValidator.predicate(
    "the primitive",
    primitive.channels.length === 1 &&
      primitive.channels[0] === "leftHand" &&
      nclose(
        primitive.write(HELD, 0.5).joints.leftIndexProximal![0],
        30 + (index - 30) / 2,
        1e-12,
      ) &&
      primitive.write(HELD, 2).joints.leftIndexProximal![0] === index,
  );

  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(4, [
    { name: "open", seconds: 0.5 },
    { name: "formed", seconds: 1 },
    { name: "release", seconds: 3 },
    { name: "released", seconds: 3.5 },
  ]);
  const formed: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHand.form(
    clock,
    "left",
    ["open", "formed"],
    ["release", "released"],
    "fist",
  );
  TestValidator.predicate(
    "formed on a clock",
    formed.from === 0.5 &&
      formed.to === 3.5 &&
      nclose(
        formed.write(HELD, 2).joints.leftIndexProximal![0],
        index,
        1e-12,
      ) &&
      nclose(formed.write(HELD, 3.5).joints.leftIndexProximal![0], 30, 1e-12),
  );
}
