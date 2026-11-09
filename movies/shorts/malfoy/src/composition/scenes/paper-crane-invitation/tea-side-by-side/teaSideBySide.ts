import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CorridorStage } from "../CorridorStage";

/**
 * Scene 4, 45–60 s: Carina lifts both cups off the sill, steps back from it
 * and carries them round the bench's right end to stand before Harry; she
 * holds out the cup in her left hand, his right hand comes up under it, and
 * at 51.000 her fingers leave the handle; "Drink it, Potter."; she backs to
 * the bench's right half and sits beside him; both raise their cups and
 * drink, to the end at 60 s.
 *
 * Concretization: she stops in front of Harry and a little toward the empty
 * half, so the turn to her seat is one step; Harry rests his cup on his
 * knee until he lifts it first, and she follows.
 *
 * ```ts
 * teaSideBySide(new CorridorStage().cast);
 * ```
 *
 * @param cast The stage's cast.
 * @returns The scene's composition, filling 45–60 s.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s04 The scene.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s04-b01 Both cups lifted and carried round the bench's right end to him.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s04-b02 The cup handover with her release at 51.000 and "Drink it, Potter.".
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s04-b03 She sits on the right half; both raise and drink.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's action, line and camera in order; the release sits on its anchor.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities; absolute seconds only as the anchor and as action starts; the stop is a place in Harry's own frame, not a world coordinate.
 * @evidence contracts/development/composition.md#living-scene Both act to the last second; the full shot from outside the window, carried over from scene 3, holds her lifting the cups; the two-shot from the open front follows her carry, cuts to a medium two-shot on the cup and then back to the frontal two-shot.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, its anchor and its concretizations.
 * @evidence contracts/development/implementation.md#principled-implementation The handover and carrying laws decide the transfer and the walk.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant inside `StageTime.scene`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No world coordinate or tuned value.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant-size composition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
 */
export function teaSideBySide(cast: CorridorStage.ICast): AutoMovieComposition {
  const { carina, harry, cupA, cupB, camera } = cast;
  return StageTime.scene(
    "s04",
    45,
    60,
    carina
      .pickUp([cupA, cupB], { start: 45 })
      .step("back", 0.5)
      .walkTo(harry, { pace: "hesitant", offset: { forward: 0.8, left: 0.35 } })
      .offer(cupB, harry, { hand: "left" })
      .release(cupB, { start: 51, anchor: "s04-b02" })
      .say("Drink it, Potter.")
      .hold(0.5)
      .walkTo("bench.right", { pace: "hesitant" })
      .sit("bench.right")
      .raise(cupA, { start: 56.4 })
      .drink(cupA, { start: 57.4 }),
    harry
      .receive(cupB, carina, { hand: "right", contact: 50.6 })
      .lowerHand("right", { start: 51.2 })
      .raise(cupB, { start: 56.2 })
      .drink(cupB, { start: 57.2 }),
    camera
      .twoShot([harry, carina], { start: 46.3, from: "front", height: "seated" })
      .next(camera.twoShot([harry, carina], { start: 49.2, size: "medium", height: "seated", keep: "hands" }))
      .next(camera.twoShot([harry, carina], { start: 52.6, from: "front", height: "seated" })),
  );
}
