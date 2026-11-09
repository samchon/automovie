import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtStage } from "../CourtStage";

/**
 * Scene 4, 36–60 s: Harry looks back at the block where he stood and asks
 * after Carina, his hand still on her forearm; she names the grab, he lets
 * go and answers, she draws her arm in and he gives her room; she walks a
 * few short steps away and touches her forehead with her back to him; she
 * turns, comes on guard and asks him to look at her; he does, and they hold
 * on guard to the end.
 *
 * Concretization: the pair, who stepped out side by side, first turn to
 * face each other; Harry lowers his wand, which stays down until he comes
 * on guard at the end; his look back is a waist turn toward the support
 * zone behind him; Carina's look down at his hand is carried by her line, since the
 * library's look has no hand target; she walks to the centre's south side
 * at her embarrassed pace; Harry lowers his empty left palm while she walks;
 * his eyes lifting to her face is a look at her, the library's only gaze
 * target on a person.
 *
 * ```ts
 * thisTime(stage.cast); // 36–60 s
 * ```
 *
 * @param cast The court stage's cast.
 * @returns The scene's composition, filling 36–60 s.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s04 The scene.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s04-b01 Harry looks back at the block and asks after her.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s04-b02 Her line, his release and answer, her arm drawn in, his room.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s04-b03 Her back to him and the forehead touch.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s04-b04 She turns and challenges; he looks at her and comes on guard; held to 60 s.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's action, lines, spatial change and camera; the concretization names the choices made.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities and the screenplay's anchor seconds.
 * @evidence contracts/development/composition.md#living-scene Both students act or hold through the whole scene; the camera cuts to her walk and arcs into the final profile.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens, the choices made and the window.
 * @evidence contracts/development/implementation.md#principled-implementation The library's everyday and duel laws time every action.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate, offset or tuned constant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a fixed number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns immutable intents; nothing retained.
 */
export function thisTime(cast: CourtStage.ICast): AutoMovieComposition {
  const { carina, harry, camera } = cast;
  return StageTime.scene(
    "s04",
    36,
    60,
    carina
      .turnTo(harry, { start: 36.0 })
      .say("You grabbed again.", { start: 39.5 })
      .drawBack({ hand: "right", start: 42.9 })
      .walkTo("centre.south", { mood: "embarrassed", start: 45.0 })
      .touchForehead()
      .turnTo(harry, { start: 49.0 })
      .onGuard(harry)
      .say("This time, look at me.", { start: 50.8 }),
    harry
      .turnTo(carina, { start: 36.0 })
      .wand("low")
      .lookBack("supportZone")
      .lookAt(carina, { start: 38.2 })
      .say("You all right?", { start: 38.7 })
      .letGo({ contact: 41.3 })
      .say("You got close again.", { start: 41.6 })
      .giveRoom(carina, { start: 43.2 })
      .lowerHand("left", { start: 46.5 })
      .lookAt(carina, { start: 52.8 })
      .say("I am.", { start: 53.4 })
      .onGuard(carina, { start: 54.4 }),
    camera
      .shot([carina, harry], { size: "full", start: 45.0, from: "south" })
      .next(camera.shot([carina, harry, "supportZone"], { size: "full", screen: [carina, harry], start: 49.0, cut: false, motion: "arc", seconds: 2.5 })),
  );
}
