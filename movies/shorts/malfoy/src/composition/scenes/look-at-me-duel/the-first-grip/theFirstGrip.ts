import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtStage } from "../CourtStage";

/**
 * Scene 2, 15–27 s: Carina runs in past Harry's wand and his left hand
 * closes on her wand wrist; she escapes by the underarm turn and he lets
 * go; he pushes his glasses up and they trade three lines; they part,
 * Harry backing on a diagonal under the cap's front edge without looking
 * behind him while Carina gives one step.
 *
 * Concretization: the run stops at the library's default run-in distance,
 * inside grip range; Harry's grip closes just after she arrives and opens
 * 0.9 s into her turn, within the study's 0.8–1.2 s; Carina re-takes her
 * guard after the lines because the run leaves her stance relaxed, then
 * gives four steps back to the centre's south-west side, near enough for
 * her later run to reach him in time and far enough for his sweep to turn
 * a watched shot; Harry backs three steps to the court's `underCap`
 * place; one medium profile shot holds the grip from first touch to release.
 *
 * ```ts
 * theFirstGrip(stage.cast); // 15–27 s
 * ```
 *
 * @param cast The court stage's cast.
 * @returns The scene's composition, filling 15–27 s.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s02 The scene.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s02-b01 Carina's run-in and Harry's grip on her wand wrist.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s02-b02 The underarm turn and his release.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s02-b03 The glasses push and the three lines.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s02-b04 Both reopen casting distance; Harry backs under the cap.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's cast, contacts, lines, spatial change and camera.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities and the screenplay's anchor seconds.
 * @evidence contracts/development/composition.md#living-scene Both students act through the grip and the parting; the camera pushes in for the hands and pulls back to read the support.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens, the choices made and the window.
 * @evidence contracts/development/implementation.md#principled-implementation The library's duel laws time the run, grip, turn and footwork.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate, offset or tuned constant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a fixed number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns immutable intents; nothing retained.
 */
export function theFirstGrip(cast: CourtStage.ICast): AutoMovieComposition {
  const { carina, harry, camera } = cast;
  return StageTime.scene(
    "s02",
    15,
    27,
    carina
      .runAt(harry, { start: 15.0 })
      .turnUnder({ start: 16.6 })
      .say("Stop grabbing, Potter.", { start: 19.9 })
      .onGuard(harry)
      .retreat(harry, { to: "centre.southWest", steps: 4, start: 23.0 })
      .onGuard(harry, { start: 24.7 }),
    harry
      .grip(carina, { part: "wrist", contact: 16.55 })
      .letGo({ contact: 17.5 })
      .pushGlasses({ hand: "left", start: 17.8 })
      .say("That's new.", { start: 18.7 })
      .say("Stop getting so close.", { start: 21.4 })
      .retreat(carina, { to: "underCap", steps: 3, start: 23.0 })
      .onGuard(carina, { start: 24.3 }),
    camera
      .twoShot([carina, harry], { start: 15.0 })
      .next(camera.twoShot([carina, harry], { start: 16.0, size: "medium", keep: "hands" }))
      .next(camera.shot([carina, harry, "capFrontEdge"], { size: "full", start: 23.0, from: "southEast", motion: "hold" })),
  );
}
