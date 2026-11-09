import { AutoMovieComposition } from "@automovie/engine";

import { sameGap } from "../../../../interactions/everyday/sameGap";
import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CorridorStage } from "../CorridorStage";

/**
 * Scene 2, 15–30 s: "Give it back."; Harry holds the half-open crane out in
 * his left hand, Carina's right hand closes on it and pulls at 17.000 before
 * he lets go, the sheet buckles, he opens his fingers and it is hers; she
 * draws it in, he gives room and says "Sorry."; she hides it behind her hip;
 * she pivots to leave, he sidesteps into the same gap, both stop short, he
 * gives room again and pushes his glasses up; she goes back round the
 * bench's right end to her cups and he sits down on the bench's right half,
 * hands in his pockets, out of her way.
 *
 * Concretization: Harry lowers his open palms before the near miss, so his
 * sidestep is the library's same-gap step to his right, into her way out,
 * and she stops a hand's breadth from him; she sets off for the sill as he
 * pushes his glasses up, ahead of his walk to the bench; his hands go into
 * his pockets as he walks, as his walking habit gives.
 *
 * ```ts
 * theTug(new CorridorStage().cast);
 * ```
 *
 * @param cast The stage's cast.
 * @returns The scene's composition, filling 15–30 s.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s02 The scene.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s02-b01 The offer, her early pull at 17.000 (buckled), his release, her withdrawal, his give-room and "Sorry.".
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s02-b02 She hides the sheet behind her hip; his palms come down.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s02-b03 The same gap, his second give-room, the glasses, her return to the sill and his sitting down.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's action, line and camera in order; the buckle sits on its anchor.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities and the library's same-gap interaction; absolute seconds only as the anchor and as action starts.
 * @evidence contracts/development/composition.md#living-scene Both students act for the whole scene; the camera cuts to a medium two-shot on the hands for the tug, back to the full two-shot for the near miss, and to the open front as he sits.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, its anchor and its concretizations.
 * @evidence contracts/development/implementation.md#principled-implementation The handover laws decide the buckle and the transfer; the same-gap interaction decides the stop.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each person's moves before the near miss, the near miss, then each person's moves after it, in sequence inside `StageTime.scene`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate or tuned value.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant-size composition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
 */
export function theTug(cast: CorridorStage.ICast): AutoMovieComposition {
  const { carina, harry, crane, camera } = cast;
  return StageTime.scene(
    "s02",
    15,
    30,
    AutoMovieComposition.sequence(
      AutoMovieComposition.parallel(
        carina
          .say("Give it back.", { start: 15 })
          .receive(crane, harry, { pull: true, contact: 17, anchor: "s02-b01" })
          .withdraw({ start: 17.6 })
          .hide(crane, { start: 19.6 })
          .turnTo("openFront", { start: 20.0 }),
        harry
          .offer(crane, carina, { hand: "left", start: 15.6 })
          .release(crane, { start: 17.4 })
          .giveRoom(carina)
          .say("Sorry.")
          .lookAt(crane)
          .lowerHand("left")
          .lowerHand("right"),
      ),
      sameGap(carina, harry, { start: 21.1 }),
      AutoMovieComposition.parallel(
        carina.hold(0.6).walkTo("rightEndStanding", { pace: "hesitant", facing: "sill.rightEnd" }),
        harry
          .giveRoom(carina)
          .pushGlasses()
          .walkTo("bench.right", { hands: "pockets" })
          .sit("bench.right"),
      ),
      StageTime.until(30, carina, harry),
    ),
    camera
      .twoShot([harry, carina], { start: 15 })
      .next(camera.twoShot([harry, carina], { start: 16, size: "medium", keep: "hands" }))
      .next(camera.twoShot([harry, carina], { start: 17.9 }))
      .next(camera.twoShot([harry, carina], { start: 23.9, from: "front" })),
  );
}
