import { AutoMovieComposition } from "@automovie/engine";

import type { Student } from "../../../../entities/cast/student/Student";
import { PracticePlay } from "../../../../interactions/quidditch/PracticePlay";
import type { PitchStage } from "../PitchStage";

/**
 * The twelve supporting players for the whole film, as one track beside the
 * scenes: the library's practice play until G-B1's swing (the Quaffle
 * passed from G-C1 to G-C2 in the opening, from G-C2 to G-C3 during the
 * race, the Bludgers over the Beaters); at 32 s G-B1 strikes the eastern
 * Bludger toward the east south gap, his head following it onto Harry, and
 * raises his arm; every other player turns to face the trouble and hovers, with
 * G-C2 keeping the Quaffle; G-K, the nearest, flies out through the east
 * south gap toward the runoff, pulls up well short of the riders and, as
 * they ride home past him, falls in alongside on their far side to the end.
 *
 * Concretization: the library's practice play owns the game and the stop
 * (G-B1's strike at 32.4 s toward the east south gap, his head onto Harry,
 * his raised arm; everyone else braking to a hover facing Harry); G-K plays
 * his own Keeper's stretch to 33.6 s so that he can fly out to the runoff,
 * hover off the right of the tandem's way home and, from 53.8 s as it comes
 * level with him, escort it 3.5 m off its right side, the side away from
 * the two-shot camera and outside the stopping rule's 3 m, since the
 * library's rescuer would close on Harry at once.
 *
 * @param stage The pitch stage.
 * @returns The track, from 0 s to past the film's end.
 * @evidence docs/body/screenplay/snitch-before-you.md#s01-b01 The game in play: the pass G-C1 to G-C2, the Bludgers, the Keepers.
 * @evidence docs/body/screenplay/snitch-before-you.md#s02-b01 G-C2 lofts the Quaffle to G-C3 under the race.
 * @evidence docs/body/screenplay/snitch-before-you.md#s02-b02 G-K patrols before the east hoops facing the ball.
 * @evidence docs/body/screenplay/snitch-before-you.md#s05-b01 G-B1's strike, his head following it, his raised arm.
 * @evidence docs/body/screenplay/snitch-before-you.md#s05-b02 Everyone turns east; G-K flies out through the south gap.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b01 G-K far behind the tandem, closing.
 * @evidence docs/body/screenplay/snitch-before-you.md#s07-b03 G-K waits well short, falls in on their far side and keeps his distance; the others wait facing them.
 * @evidence contracts/development/composition.md#screenplay-realization Realizes every supporting player's presence, the passes and the stop of play.
 * @evidence contracts/development/composition.md#composition-only Chains the library's practice play and capabilities; G-K's run is through pitch places.
 * @evidence contracts/development/composition.md#living-scene No player is ever still; all twelve fly from the first frame to the last.
 */
export function practiceTeams(stage: PitchStage): AutoMovieComposition {
  const keeper: Student = stage.players["G-K"]!;
  return AutoMovieComposition.parallel(
    PracticePlay.compose({
      set: stage.pitch,
      players: Object.values(stage.players).filter((p: Student) => p.id !== keeper.id),
      from: 0,
      to: 60,
      seed: "snitch-before-you",
      quaffle: stage.quaffle.id,
      bludgers: stage.bludgers.map((b) => b.id),
      passes: [
        { from: "G-C1", to: "G-C2", at: 1.5 },
        { from: "G-C2", to: "G-C3", at: 9.6 },
        { from: "G-C3", to: "G-C1", at: 13.2 },
        { from: "G-C1", to: "G-C3", at: 16.6 },
        { from: "G-C3", to: "G-C1", at: 20.1 },
        { from: "G-C1", to: "G-C3", at: 23.5 },
        { from: "G-C3", to: "G-C2", at: 27.4 },
      ],
      stop: { at: 32.4, by: "G-B1", strike: "B-2", toward: "eastSouthGap", watch: stage.harry.id },
    }),
    AutoMovieComposition.sequence(
      PracticePlay.compose({ set: stage.pitch, players: [keeper], from: 0, to: 33.6, seed: "snitch-before-you" }),
      keeper
        .fly(["eastSouthGap", "keeper.runoff", "keeper.short"], { speed: 8, start: 33.6 })
        .hover()
        .escort(stage.carina, { start: 53.8, seconds: 6.7, distance: 3.5, side: "right" }),
    ),
  );
}
