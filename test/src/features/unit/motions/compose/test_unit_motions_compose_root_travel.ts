import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRoot,
} from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one rotation and one sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanRoot.travel` is a root primitive over a window whose
 * write displaces the entry posture by the offset it is given at that second,
 * in the posture's own floor frame.
 *
 * The offset here is a quadratic forward travel, `z = t^2` metres at `t`
 * seconds, so one second gives one metre and two seconds four metres.
 *
 * Scenarios:
 *
 * 1. The primitive claims and reads only the root over the given window.
 * 2. At heading 0 the forward travel moves the root along world +Z.
 * 3. At heading 90 the same travel moves it along world +X, so a write that
 *    ignored the heading fails.
 * 4. At 0 seconds the offset is zero and the root stays.
 */
export function test_unit_motions_compose_root_travel(): void {
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.travel({
      from: 0.5,
      to: 2,
      offset: (seconds: number): IAutoMovieMotionHumanRoot.IOffset => ({
        point: { x: 0, y: 0, z: seconds * seconds },
        yaw: 0,
      }),
    });
  const entry: (yaw: number) => IAutoMovieMotionHumanPosture = (
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x: 2, y: 0, z: 3 },
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });

  // 1. The window and the channels.
  TestValidator.equals(
    "a root primitive over its window",
    [primitive.channels, primitive.reads, primitive.from, primitive.to],
    [["root"], ["root"], 0.5, 2],
  );

  // 2 to 4. The displacement in each heading.
  for (const yaw of [0, 90])
    for (const t of [0, 1, 2]) {
      const forward: number = t * t;
      TestValidator.predicate(
        `heading ${yaw} at ${t} s travels ${forward} m forward`,
        vclose(
          primitive.write(entry(yaw), t).root,
          {
            x: 2 + (yaw === 90 ? forward : 0),
            y: 0,
            z: 3 + (yaw === 0 ? forward : 0),
          },
          ROUNDING,
        ),
      );
    }
}
