import type { IAutoMovieAffordance } from "@automovie/interface";
import { HumanRefusal, playWindInstrument } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/** The playing pose reads the mouthpiece socket in the held instrument. */
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
      error instanceof HumanRefusal &&
      error.axis === "point" &&
      error.value === "mouthpiece",
  );
}
