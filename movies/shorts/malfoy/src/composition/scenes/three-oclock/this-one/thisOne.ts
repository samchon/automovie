import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtyardStage } from "../CourtyardStage";

/**
 * Scene 3, 50.7–60 s: Harry reads the note ("Courtyard."), looks up ("This
 * one?") and Carina answers "This one."; she steps past his shoulder toward
 * the west gap while his head goes back down over the note, and with nobody
 * facing her she touches her forehead as she goes; she hurries out through
 * the gap and the side passage while Harry walks back to the bench, sits in
 * the middle of the seat she talked to and rests the note on his knee, to the
 * end.
 *
 * Concretization: each spoken line holds the speaker still for its words;
 * her forehead touch rides on her walk to the gap, starting a second after
 * she turns away, once she is past Harry and his eyes are back on the note;
 * she walks to the gap at her ordinary pace and leaves at her hurried pace;
 * Harry starts for the bench as she reaches the gap; the two-shot from the
 * south-east holds them both until 56.3 s, when, as she goes, the camera cuts
 * to a wide from the open south that holds his walk to the bench and his
 * sitting to the end.
 *
 * ```ts
 * AutoMovieComposition.sequence(theRehearsal(stage.cast), theNote(stage.cast), thisOne(stage.cast));
 * ```
 *
 * @param cast The courtyard cast.
 * @returns The scene's composition, filling 50.7–60 s.
 * @evidence docs/body/screenplay/three-oclock.md#s03 The scene: Harry with the note, Carina's exit, the bench.
 * @evidence docs/body/screenplay/three-oclock.md#s03-b01 The reading and the three lines from 50.7 s, her answer at 53.1 s, her walk past him and her forehead touch as she goes.
 * @evidence docs/body/screenplay/three-oclock.md#s03-b02 Her exit, his walk to the bench from 54.5 s, his sitting and the note on his knee to the end.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's actions, habits, lines and camera are composed in order to the film's end.
 * @evidence contracts/development/composition.md#composition-only Only student, camera and timing capabilities; absolute seconds only at beat and line anchors.
 * @evidence contracts/development/composition.md#living-scene Harry reads and reacts while she leaves; the camera cuts from her exit to his walk and the seat.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens and what the code concretized.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the library's intents; durations, routes around Harry and positions come from its laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per performer and one for the camera.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate or outcome is set here; the speaking holds are the lines' durations and the touch's delay is the habit's reaction window.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure composition with nothing to share.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no resources.
 */
export function thisOne(cast: CourtyardStage.ICast): AutoMovieComposition {
  const { carina, harry, note, camera } = cast;
  return StageTime.scene(
    "s03",
    50.7,
    60,
    harry
      .read(note, { anchor: "s03-b01" })
      .say("Courtyard.")
      .hold(0.6)
      .lookAt(carina)
      .say("This one?")
      .hold(0.6)
      .lookAt(note)
      .hold(0.1, { start: 54.4 })
      .walkTo("bench.centre", { anchor: "s03-b02" })
      .sit("bench.centre")
      .lowerHand("right", { to: "knee" }),
    carina
      .say("This one.", { start: 53.1 })
      .walkTo("westGap.middle", {
        gesture: { kind: "touchForehead", after: TOUCH_AFTER_TURNING },
      })
      .walkTo("passage", { pace: "hurried" }),
    camera
      .twoShot([harry, carina], { start: 50.7, from: "southEast" })
      .next(
        camera.wide([harry, "bench.centre"], { start: 56.3, from: "openSouth" }),
      ),
  );
}

/**
 * Seconds into her walk away before her fingertips go to her forehead: inside
 * her habit's 0.5–1.5 s after turning away
 * (docs/body/settings/cast/carina-malfoy.md#forehead-touch), and after Harry's
 * eyes have gone back down to the note and she has passed his shoulder, so
 * nobody faces her and he does not hide her from the camera.
 */
const TOUCH_AFTER_TURNING: number = 1;
