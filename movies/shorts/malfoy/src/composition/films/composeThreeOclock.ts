import { AutoMovieComposition } from "@automovie/engine";

import type { CourtyardStage } from "../scenes/three-oclock/CourtyardStage";
import { theNote } from "../scenes/three-oclock/the-note/theNote";
import { theRehearsal } from "../scenes/three-oclock/the-rehearsal/theRehearsal";
import { thisOne } from "../scenes/three-oclock/this-one/thisOne";

/**
 * The `three-oclock` film's composition: its three scenes in screenplay
 * order on one cast, the rehearsal from 0 s, the note from 24.9 s and the
 * ending from 50.7 s to 60 s, each scene sitting on its own anchors.
 *
 * ```ts
 * composeThreeOclock(new CourtyardStage().cast);
 * ```
 *
 * @param cast The courtyard cast.
 * @returns The composition.
 * @evidence docs/body/screenplay/three-oclock.md Every scene in screenplay order, filling the 60-second film.
 * @evidence contracts/development/composition.md#screenplay-realization The scenes play in screenplay order and fill the running time.
 * @evidence contracts/development/composition.md#composition-only Only orders the scenes through the engine's sequence.
 * @evidence contracts/development/composition.md#living-scene Each scene keeps its own performers and camera alive; the film adds nothing between them.
 * @evidence contracts/development/common.md#meaningful-documentation States the order and the scene starts.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's sequence places each scene after the previous one ends.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call per scene.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No timing or special case is added.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure composition with nothing to share.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no resources.
 */
export function composeThreeOclock(
  cast: CourtyardStage.ICast,
): AutoMovieComposition {
  return AutoMovieComposition.sequence(
    theRehearsal(cast),
    theNote(cast),
    thisOne(cast),
  );
}
