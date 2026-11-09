import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtStage } from "../CourtStage";

/**
 * Scene 3, 27??6 s: Carina holds a long aim and casts at Harry's wand
 * shoulder; his upward sweep sends the jinx into the cracked fillet under
 * the cap, which fails and tips; one reaction time later Carina runs at him
 * with a cry; his left hand reaches again, her free palm turns it so his
 * grip closes on her forearm; she guides him two quick steps out from under
 * the cap toward the centre before it reaches head height, and raises her
 * shield between them and the fallen block as the fragments fly.
 *
 * Concretization: the long aim is her guard held still until the cast's
 * anchored release, timed so the deflected jinx cracks the fillet at the
 * screenplay's 30.000; the cap fails at that impact with the slowest tipping
 * the stages allow; Carina sprints at the run-in study's fast end and stops
 * at the edge of grip range; in the guide she takes one quick step aside
 * toward the open west while Harry takes the clearance study's two quick
 * steps past her shoulder toward the centre's south side, so he is clear
 * before the cap reaches head height and ends at her side, behind the
 * shield she raises toward the block; the camera holds the run and the
 * contact from the south-east and arcs to the south as they step out, so
 * the shield faces it, then pushes in to a medium two-shot so the faces and
 * the held forearm read at vertical size; Carina's wand drop rides on the
 * run's first step, because a separate wand action before it would leave
 * Harry under the cap too long.
 *
 * ```ts
 * outFromUnder(stage.cast); // 27??6 s
 * ```
 *
 * @param cast The court stage's cast.
 * @returns The scene's composition, filling 27??6 s.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03 The scene.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03-b01 The high shot deflected into the fillet.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03-b02 The cap tips; Carina runs at him with a cry.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03-b03 The same reach turned onto her forearm.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03-b04 Two quick steps out from under the cap; the cap falls where he stood.
 * @evidence docs/body/screenplay/look-at-me-duel.md#s03-b05 Her shield between them and the block stops the fragments.
 * @evidence contracts/development/composition.md#screenplay-realization Every person's beat action and the cap's failure at the screenplay's anchors; the concretization names the one deferred detail.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities and the screenplay's anchor seconds.
 * @evidence contracts/development/composition.md#living-scene Both students act through the whole rescue; the camera pulls back to read the danger and pushes in on the hands.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens, the choices made and what is deferred.
 * @evidence contracts/development/implementation.md#principled-implementation The library's duel and masonry laws time the cast, sweep, failure, run, parry, grip and guide.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant and one for the cap.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate, offset or tuned constant; the tipping is the stages' upper bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a fixed number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is computed twice.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns immutable intents; nothing retained.
 */
export function outFromUnder(cast: CourtStage.ICast): AutoMovieComposition {
  const { carina, harry, cap, camera } = cast;
  return StageTime.scene(
    "s03",
    27,
    36,
    carina
      .onGuard(harry, { start: 27.5 })
      .say("Flipendo!", { start: 28.8 })
      .jinx(harry, { aim: "wand-shoulder", contact: 29.29 })
      .say("Potter!", { start: 30.23 })
      .runAt(harry, { wand: "low", distance: 0.9, pace: "sprint" })
      .parry(harry, { contact: 31.22 })
      .guideAside(harry, "centre.farWest", { start: 31.37, quick: true, steps: 1 })
      .say("Protego!")
      .shield(1.5),
    harry
      .deflect("crackedFillet", { contact: 29.59 })
      .onGuard(carina, { start: 30.1 })
      .grip(carina, { part: "forearm", contact: 31.27 })
      .guidedTo("centre.south", { start: 31.37, quick: true }),
    cap.fail({ tipping: 1.5 }),
    camera
      .shot([carina, harry, "supportZone"], { size: "full", start: 27.0, from: "southEast", screen: [carina, harry] })
      .next(camera.wide([carina, harry, "supportZone"], { start: 30.3, from: "southEast" }))
      .next(camera.wide([carina, harry, "supportZone"], { start: 31.6, from: "south", cut: false, motion: "arc", seconds: 1.5 }))
      .next(camera.shot([carina, harry], { size: "medium", start: 34.0, screen: [carina, harry], cut: false, motion: "push", seconds: 2.0 })),
  );
}
