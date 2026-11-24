import type { IAutoMovieMotionHumanRoot } from "@automovie/interface";
import { AutoMovieMotionHumanRoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one product, metres or degrees. */
const ROUNDING: number = 1e-15;

/**
 * `AutoMovieMotionHumanRoot.scale` takes a share of a root displacement: the
 * move's three components and the turn, each multiplied by the share.
 *
 * Scenarios:
 *
 * 1. Share 0 gives no move and no turn.
 * 2. Share 1 gives the displacement itself.
 * 3. Share 0.25 gives a quarter of every component and of the turn, so a function
 *    that scaled only the move or only the turn fails.
 * 4. The input displacement is left as it was.
 */
export function test_unit_motions_compose_root_scale(): void {
  const offset: IAutoMovieMotionHumanRoot.IOffset = {
    point: { x: 0.4, y: -0.8, z: 2 },
    yaw: 60,
  };
  const is: (
    share: number,
    expected: IAutoMovieMotionHumanRoot.IOffset,
  ) => boolean = (
    share: number,
    expected: IAutoMovieMotionHumanRoot.IOffset,
  ): boolean => {
    const scaled: IAutoMovieMotionHumanRoot.IOffset =
      AutoMovieMotionHumanRoot.scale(offset, share);
    return (
      vclose(scaled.point, expected.point, ROUNDING) &&
      nclose(scaled.yaw, expected.yaw, ROUNDING)
    );
  };

  TestValidator.predicate(
    "share 0",
    is(0, { point: { x: 0, y: 0, z: 0 }, yaw: 0 }),
  );
  TestValidator.predicate("share 1", is(1, offset));
  TestValidator.predicate(
    "share 0.25",
    is(0.25, { point: { x: 0.1, y: -0.2, z: 0.5 }, yaw: 15 }),
  );
  TestValidator.predicate(
    "the input is unchanged",
    vclose(offset.point, { x: 0.4, y: -0.8, z: 2 }, 0) && offset.yaw === 60,
  );
}
