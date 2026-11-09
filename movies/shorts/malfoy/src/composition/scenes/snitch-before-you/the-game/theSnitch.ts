import { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { PitchStage } from "../PitchStage";

/**
 * The Golden Snitch for the whole film, as one track beside the scenes: it
 * waits low beside the east south post until the Seekers come, drops
 * through the south gap a second ahead of them, hooks right round the back
 * of the south post and climbs east over the runoff; it dances up to
 * Harry's left hand and out of his closing fingers, hovers a hand's breadth
 * beyond them for his overreach, darts back to hover at Carina's open right
 * hand, slips past her right shoulder and climbs away uncaught; while the
 * two ride on one broom it comes back high over the runoff, hangs there in
 * the sun for about a second as Harry looks up, then darts away and is gone.
 *
 * Concretization: each stretch is a route of the Snitch's own flight with
 * the second it sets off, timed to the riders' reaches; its darting curves
 * are the route's turns; its hang is the rest between arriving at the glint
 * at about 43.2 s and darting off at 44.3 s, inside the close insert.
 *
 * @param stage The pitch stage.
 * @returns The track, from 0 s.
 * @evidence docs/body/screenplay/snitch-before-you.md#s01-b02 The glint beyond the far hoops, low beside the south post.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b01 Through the south gap ahead of them.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b02 The hook round the back of the south post.
 * @evidence docs/body/screenplay/snitch-before-you.md#s03-b03 East and up over the runoff.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b01 Level with Harry's left hand, out of his closing fingers.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b02 A hand's breadth beyond his fingertips.
 * @evidence docs/body/screenplay/snitch-before-you.md#s04-b04 Before Carina's open hand, then past her right shoulder and away.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b01 It hangs in the sun high over the runoff for a moment, then darts away.
 * @evidence docs/body/settings/props/snitch.md#flight Short darting curves, hovers of 0.5–2 s, never above 18 m/s, caught only by a closing hand.
 * @evidence contracts/development/composition.md#composition-only Chains the ball's library capability; every place is the pitch's.
 */
export function theSnitch(stage: PitchStage): AutoMovieComposition {
  const { snitch } = stage;
  return AutoMovieComposition.sequence(
    StageTime.rest(snitch, "snitch.waits", 0),
    snitch.fly(["snitch.gap", "snitch.hook", "snitch.hookOut", "snitch.runoff", "snitch.climb", "snitch.ahead"], { speed: 7.1, start: 13.6 }),
    snitch.fly(["snitch.first"], { speed: 3, start: 25.6 }),
    snitch.fly(["snitch.away"], { speed: 6, start: 26.1 }),
    snitch.fly(["snitch.beyond"], { speed: 4.5, start: 28 }),
    snitch.fly(["snitch.atNorthRider"], { speed: 7, start: 29.8 }),
    snitch.fly(["snitch.pastShoulder", "snitch.climbing", "snitch.high", "snitch.gone"], { speed: 8, start: 31.2 }),
    snitch.fly(["snitch.glint"], { speed: 16, start: 39.4 }),
    snitch.fly(["snitch.gone"], { speed: 16, start: 44.3 }),
  );
}
