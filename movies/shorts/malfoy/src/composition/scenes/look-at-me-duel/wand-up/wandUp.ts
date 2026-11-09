import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtStage } from "../CourtStage";

/**
 * Scene 1, 0–15 s: Carina challenges and both come on guard at long range;
 * Harry circles her and back while she keeps square and needles him about
 * where he looks; her practice jinx at his wand hand is swept to the floor;
 * his disarming charm dies on her shield.
 *
 * Concretization: they open at the court's far casting places across the
 * centre; Harry circles four steps to his right and four back; Carina's
 * keeping square is her on-guard stance squaring live to him; Harry gives
 * one step back after his sweep, which lengthens the disarm's flight enough
 * for Carina's shield, raised one reaction time after his gesture, to stand
 * when it arrives; every incantation is spoken as its cast begins.
 *
 * ```ts
 * wandUp(stage.cast); // 0–15 s
 * ```
 *
 * @param cast The court stage's cast.
 * @returns The scene's composition, filling 0–15 s.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01 The scene.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01-b01 The challenge and both on guard, held wide with the support.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01-b02 Harry circles and back; Carina squares; the two lines.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01-b03 The jinx at the wand hand, deflected to the floor.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s01-b04 The disarming charm against Carina's shield.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's cast, action, lines and camera; the concretization paragraph names the choices the code made.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities and the screenplay's anchor seconds.
 * @evidence contracts/development/composition.md#living-scene Both students act or hold their guard throughout and the camera follows the circle.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens, the choices made and the window.
 * @evidence contracts/development/implementation.md#principled-implementation The library's duel and everyday laws time every action; the scene pins only anchors.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate, offset or tuned constant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a fixed number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns immutable intents; nothing retained.
 */
export function wandUp(cast: CourtStage.ICast): AutoMovieComposition {
  const { carina, harry, carinasWand, harrysWand, camera } = cast;
  return StageTime.scene(
    "s01",
    0,
    15,
    carina
      .enter("centre.farSouthWest", { facing: harry, holds: { right: carinasWand.id } })
      .onGuard(harry, { start: 1.0 })
      .say("Wand up, Potter.")
      .say("Look at me, Potter. Not the wand.", { start: 6.2 })
      .say("Flipendo!", { start: 11.9 })
      .jinx(harry, { aim: "wand-hand" })
      .say("Protego!", { start: 13.96 })
      .shield(0.15),
    harry
      .enter("centre.farNorthEast", { facing: carina, holds: { right: harrysWand.id } })
      .say("After you.", { start: 2.8 })
      .onGuard(carina)
      .circle(carina, "right", { steps: 4, start: 4.1 })
      .say("The wand's the dangerous part.", { start: 8.1 })
      .circle(carina, "left", { steps: 4 })
      .deflect("floor", { contact: 12.75 })
      .retreat(carina, { steps: 1 })
      .say("Expelliarmus!", { start: 13.5 })
      .disarm(carina),
    camera
      .wide([carina, harry, "supportZone"], { start: 0, from: "southWest" })
      .next(camera.twoShot([carina, harry], { start: 4.1 }))
      .next(camera.medium([carina], { start: 6.0 }))
      .next(camera.shot([harry], { size: "full", start: 8.0, motion: "hold" }))
      .next(camera.medium([carina], { start: 10.0 }))
      .next(camera.twoShot([carina, harry], { start: 11.5, from: "southWest", motion: "hold" })),
  );
}
