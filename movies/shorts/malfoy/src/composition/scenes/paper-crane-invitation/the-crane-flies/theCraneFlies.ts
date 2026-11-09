import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CorridorStage } from "../CorridorStage";

/**
 * Scene 1, 0–15 s: Harry walks in with his hands in his pockets; Carina,
 * waiting at the sill's right end beside the two cups, turns to him and at
 * 5.000 pushes the charmed crane off her fingertip; her empty hand follows it
 * a handspan and draws back; Harry catches it in his left hand, pushes his
 * glasses up, asks "This for me?" and starts to open it; Carina hurries round
 * the bench's right end, "Don't open it.", and he stops with it half open.
 *
 * Concretization: Harry stops on the front route before the bench; Carina
 * stops at conversation distance on the line toward the sill, so his back
 * is to the open front, and lowers her hand so only his hold the sheet;
 * Harry looks at the crane and then at her before he asks; the cups start
 * on the sill's two cup places. The flight
 * is cut on the push: a medium on Carina holds the crane on her
 * fingertip and its release, then a medium on Harry from the bay's right
 * end, on the same side of their line, holds its glide in from screen right
 * to his fist and his glasses push; a two-shot from the open front, the
 * pair on a diagonal in depth, follows her approach (a profile two-shot
 * cannot frame them 2 m apart inside the bay's walls). Her chin lifts for
 * half a second just before the push, her psychological gesture.
 *
 * ```ts
 * theCraneFlies(new CorridorStage().cast);
 * ```
 *
 * @param cast The stage's cast.
 * @returns The scene's composition, filling 0–15 s.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01 The scene.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01-b01 Harry walks in, hands in pockets; Carina waits with the crane by the cups.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01-b02 Her chin lift, the launch at 5.000, her reach after it and his one-handed catch.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01-b03 The glasses push and "This for me?".
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s01-b04 The half unfold, her hurried walk and "Don't open it.".
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's action, line and camera in order; the launch sits on its anchor.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities; absolute seconds only as the anchor and as action starts.
 * @evidence contracts/development/composition.md#living-scene Both students act for the whole scene; the camera holds a wide on Harry's entrance, cuts to a medium on Carina for the turn and the push, to a medium on Harry from the right end for the glide, the catch, the glasses and his question, to a two-shot from the open front for her approach, and to the profile two-shot (Harry screen left) as she reaches him.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, its anchor and its concretizations.
 * @evidence contracts/development/implementation.md#principled-implementation The laws resolve every duration and point from the chained intents.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant inside `StageTime.scene`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate, offset or tuned value.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant-size composition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
 */
export function theCraneFlies(cast: CorridorStage.ICast): AutoMovieComposition {
  const { carina, harry, crane, cupA, cupB, camera } = cast;
  return StageTime.scene(
    "s01",
    0,
    15,
    StageTime.rest(cupA, "sill.cupA"),
    StageTime.rest(cupB, "sill.cupB"),
    carina
      .enter("rightEndStanding", { facing: "openFront", holds: { right: crane.id } })
      .turnTo(harry, { start: 2.6 })
      .liftChin({ start: 3.85, seconds: 0.35 })
      .launch(crane, harry, { contact: 5, anchor: "s01-b02" })
      .reachAfter(crane)
      .drawBack()
      .walkTo(harry, { pace: "hurried", distance: "conversation", start: 9.6 })
      .say("Don't open it.")
      .lowerHand("right"),
    harry
      .enter("corridor", { facing: "openFront", pockets: true })
      .walkTo("frontRoute", { hands: "pockets", facing: carina, start: 0.4 })
      .catch(crane, { hand: "left", start: 5.1 })
      .pushGlasses()
      .lookAt(crane)
      .lookAt(carina, { start: 8.0 })
      .say("This for me?")
      .unfold(crane, { until: "half", start: 9.4 })
      .lookAt(carina),
    camera
      .wide([harry, carina], { start: 0, from: "front" })
      .next(camera.shot([carina], { start: 3.8, size: "medium", screen: [harry, carina] }))
      .next(camera.shot([harry], { start: 5.15, size: "medium", from: "rightEnd", keep: "hands" }))
      .next(camera.twoShot([harry, carina], { start: 8.6, from: "front" }))
      .next(camera.twoShot([harry, carina], { start: 10.4 })),
  );
}
