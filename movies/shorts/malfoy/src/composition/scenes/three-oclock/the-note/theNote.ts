import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CourtyardStage } from "../CourtyardStage";

/**
 * Scene 2, 24.9–50.7 s: Harry asks "Come where?"; Carina hides the note
 * behind her hip, turns and says "Nowhere."; Harry holds out his open palm
 * and her first offer stops a handspan short and snaps back, so he gives her
 * room ("No hurry."); she steps into the room, lets the note fall at his
 * feet ("You dropped something." / "Did I."); both bend for it at once and
 * their foreheads meet, he gives room again and pushes up his glasses
 * ("Sorry."); both start to bend again and stop, he gives room a third time
 * and holds his right palm out; she picks the note up, walks to him and
 * lays it in his palm, letting go only after his fingers close ("Saturday.
 * Three o'clock.").
 *
 * Concretization: each spoken line holds the speaker still for its words;
 * a relation (her step in, the meeting bends, his reach for the note) waits
 * for its anchor first so it reads the counterpart where it is then;
 * Carina reacts to his question after it ends; the step into the room ends
 * at handing distance; Harry straightens before he gives room; her walk
 * back to him with the note is at her ordinary pace; the aborted bend is
 * the library's named lean; Harry's grip closes at the screenplay's handover
 * anchor and her release follows by the ownership rule's transfer phase.
 *
 * ```ts
 * AutoMovieComposition.sequence(theRehearsal(stage.cast), theNote(stage.cast), thisOne(stage.cast));
 * ```
 *
 * @param cast The courtyard cast.
 * @returns The scene's composition, filling 24.9–50.7 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02 The scene: the two students and the note between them.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b01 "Come where?", the hide, the turn and "Nowhere." from 24.9 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b02 The open palm, her chin lift, the withdrawn first offer and the first give-room from 27.9 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b03 The step in, the drop and the two lines from 33 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b04 The shared bend to the forehead contact, the second give-room and the glasses from 37.4 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b05 The aborted second bend, the third give-room and the held palm from 41.2 s.
 * @evidence docs/body/screenplay/three-oclock.md#s02-b06 The pick-up from 45 s and the completed handover, his grip at 49.7 s and her release at 50.1 s.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's actions, habits, lines and camera are composed in order; the note's ownership follows the handover rule.
 * @evidence contracts/development/composition.md#composition-only Only student, camera and timing capabilities; absolute seconds only at beat, line and handover anchors.
 * @evidence contracts/development/composition.md#living-scene Both students act or react through the whole scene; the camera follows the pair and cuts with the action.
 * @evidence contracts/development/common.md#meaningful-documentation States what happens and what the code concretized.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the library's intents; the habit, contact and ownership outcomes come from its laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per performer and one for the camera.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The speaking and reaction holds are the lines' and reactions' durations; the lean is the library's named depth; no outcome is forced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant number of intents.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure composition with nothing to share.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no resources.
 */
export function theNote(cast: CourtyardStage.ICast): AutoMovieComposition {
  const { carina, harry, note, camera } = cast;
  return StageTime.scene(
    "s02",
    24.9,
    50.7,
    carina
      .hold(0.8)
      .hide(note)
      .turnTo(harry)
      .say("Nowhere.")
      .liftChin({ start: 27.9, seconds: 0.9 })
      .offer(note, harry)
      .hold(0.1, { start: 32.9 })
      .walkTo(harry, {
        distance: "handing",
        pace: "hesitant",
        anchor: "s02-b03",
      })
      .drop(note)
      .hold(1.7)
      .say("You dropped something.")
      .hold(0.1, { start: 37.3 })
      .bend(note, { meet: harry, anchor: "s02-b04" })
      .hold(0.3)
      .straighten()
      .bend(note, { depth: "lean", start: 41.2, anchor: "s02-b05" })
      .straighten()
      .pickUp(note, { start: 45, anchor: "s02-b06" })
      .walkTo(harry, { distance: "handing" })
      .offer(note, harry)
      .release(note, { contact: HANDOVER_RELEASE })
      .say("Saturday. Three o'clock."),
    harry
      .say("Come where?", { start: 24.9, anchor: "s02-b01" })
      .lookAt(note, { start: 27.9, anchor: "s02-b02" })
      .openPalm(carina)
      .hold(1.1)
      .giveRoom(carina)
      .say("No hurry.")
      .hold(0.8)
      .lowerHand("left")
      .lowerHand("right")
      .say("Did I.", { start: 37 })
      .hold(0.1, { start: 37.3 })
      .bend(note, { meet: carina })
      .straighten()
      .giveRoom(carina)
      .pushGlasses()
      .say("Sorry.")
      .bend(note, { depth: "lean", start: 41.2 })
      .straighten()
      .giveRoom(carina)
      .lowerHand("left")
      .openPalm(carina)
      .hold(0.1, { start: 48.9 })
      .receive(note, carina, { contact: HANDOVER_GRIP }),
    camera
      .twoShot([harry, carina], { start: 24.9, from: "southEast" })
      .next(camera.twoShot([harry, carina], { start: 33, height: "low" }))
      .next(camera.wide([harry, carina], { start: 43.1, from: "openSouth" }))
      .next(camera.follow(carina, { start: 45 }))
      .next(
        camera.twoShot([harry, carina], {
          start: 48.4,
          from: "southEast",
          keep: "hands",
        }),
      ),
  );
}

/** The screenplay's anchor for Harry's fingers closing on the note (s02-b06), seconds. */
const HANDOVER_GRIP: number = 49.7;

/** The screenplay's anchor for Carina's fingers opening once his have closed (s02-b06), seconds. */
const HANDOVER_RELEASE: number = 50.1;
