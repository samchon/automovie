import type { IAutoMovieAffordance } from "@automovie/interface";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  playWindInstrument
} from "../../../../../packages/motions/src/daily/internal/playWindInstrument";
import { strict as assert } from "node:assert";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/**
 * Check selection of the mouthpiece socket on a held instrument.
 *
 * Scenarios:
 *
 * 1. When a handle and socket both use `mouthpiece` , select the socket
 *    despite the alternate `bell` socket.
 * 2. With only the handle and alternate socket, refuse on `point` with value
 *    `mouthpiece` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases distinguish affordance kind and name and state the refusal payload.
 * @evidence contracts/development/testing.md#behavioral-verification The socket selector receives two lists that differ only in the presence of the matching socket.
 * @evidence contracts/development/testing.md#independent-expectations Assert object identity against the fixture's explicitly named socket and the literal missing-point fields.
 */
export function test_motions_daily_play_wind_instrument(): void {
  const handle: IAutoMovieAffordance = testAffordance("mouthpiece", "handle", {
    x: 0, y: 0, z: 0,
  });
  const alternate: IAutoMovieAffordance = testAffordance("bell", "socket", {
    x: 0, y: 0, z: 0.3,
  });
  const socket: IAutoMovieAffordance = testAffordance("mouthpiece", "socket", {
    x: 0, y: 0, z: -0.1,
  });
  assert.equal(
    playWindInstrument.mouthpiece(
      { affordances: [handle, alternate, socket] },
      "horn",
    ),
    socket,
  );
  assert.throws(
    () =>
      playWindInstrument.mouthpiece({ affordances: [handle, alternate] }, "horn"),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.axis === "point" &&
      error.value === "mouthpiece",
  );
}
