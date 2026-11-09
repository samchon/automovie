import { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtyardStage } from "../CourtyardStage";

/**
 * Scene 1, 0–24.9 s: Carina rehearses her invitation to the empty bench. The
 * first try breaks off after "Potter—" and she steps backward to her starting
 * place; the second, softer try ends on "...Please.", which turns her away to
 * touch her forehead and walk back; on the third try Harry comes in through
 * the west gap behind her and stops behind her left shoulder before she says
 * "I just want you to come." to the seat.
 *
 * Concretization: her walks back to the starting place are at her ordinary
 * pace and her approaches at her rehearsing pace; each spoken line holds her
 * still for its words; Harry steps into the side passage as she finishes
 * turning back to the bench and pauses briefly in the gap; he stands behind
 * her left shoulder by the library's named relation; each offer to the seat
 * goes to the seat's seated chest height, the second to waist height; the
 * camera cuts back to the wide as she walks back, at the screenplay's
 * camera anchor.
 *
 * ```ts
 * AutoMovieComposition.sequence(theRehearsal(stage.cast), theNote(stage.cast), thisOne(stage.cast));
 * ```
 *
 * @param cast The courtyard cast.
 * @returns The scene's composition, filling 0–24.9 s.
 * @evidence docs/body/screenplay/three-oclock.md#s01 The scene: the recess, the bench, the note and both students.
 * @evidence docs/body/screenplay/three-oclock.md#s01-b01 The first try, the walk backward and the wide from the east end that holds the bench.
 * @evidence docs/body/screenplay/three-oclock.md#s01-b02 The second try from 6.3 s, the forehead touch, the full shot cut in from the east end and the cut back to the wide at 14.7 s as she walks back.
 * @evidence docs/body/screenplay/three-oclock.md#s01-b03 The third try from 18 s, Harry's entrance seen in the east-end wide; her line at 23.1 s.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's walks, offers, lines, habits and camera are composed in order.
 * @evidence contracts/development/composition.md#composition-only Only student, camera and timing capabilities; absolute seconds only at the beat, line and camera anchors.
 * @evidence contracts/development/composition.md#living-scene Carina acts throughout; Harry is off stage until he enters; the camera cuts and follows.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens and what the code concretized.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the library's intents; durations and positions come from its laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per performer and one for the camera.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate or outcome is set here; the speaking holds are the lines' durations.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure composition with nothing to share.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no resources.
 */
export function theRehearsal(cast: CourtyardStage.ICast): AutoMovieComposition {
  const { carina, harry, note, camera } = cast;
  return StageTime.scene(
    "s01",
    0,
    24.9,
    carina
      .enter("startingPlace", {
        facing: "bench.centre",
        holds: { right: note.id },
      })
      .walkTo("bench.centreFront", { pace: "hesitant", anchor: "s01-b01" })
      .offer(note, "bench.centre", { height: "seatedChest" })
      .say("Potter—")
      .hold(0.6)
      .withdraw()
      .walkTo("startingPlace", { facing: "bench.centre" })
      .walkTo("bench.centreFront", {
        pace: "hesitant",
        start: 6.3,
        anchor: "s01-b02",
      })
      .offer(note, "bench.centre", { height: "waist" })
      .say("Saturday. Three o'clock. If you're free.")
      .hold(1.8)
      .say("...Please.")
      .hold(0.5)
      .withdraw()
      .turnTo("openSouth")
      .touchForehead()
      .walkTo("startingPlace", { facing: "openSouth" })
      .turnTo("bench.centre")
      .walkTo("bench.centreFront", {
        pace: "hesitant",
        start: 18,
        anchor: "s01-b03",
      })
      .offer(note, "bench.centre", { height: "seatedChest" })
      .say("I just want you to come.", { start: 23.1 }),
    AutoMovieComposition.at(
      "scene:s01",
      harry
        .enter("passage", { facing: "westGap.middle", pockets: true })
        .walkTo("westGap.middle", { hands: "pockets" })
        .hold(0.3)
        .walkTo(carina, { at: "behindLeftShoulder", hands: "pockets" }),
      17.3,
    ),
    camera
      .wide([carina, "bench.centre"], { start: 0, from: "eastEnd" })
      .next(
        camera.shot([carina, "bench.centre"], {
          start: 6.3,
          size: "full",
          from: "eastEnd",
        }),
      )
      .next(camera.wide([carina], { start: 14.7, from: "eastEnd" })),
  );
}
