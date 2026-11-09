import type { AutoMovieComposition } from "@automovie/engine";

import { StageTime } from "../../../../interactions/staging/StageTime";
import type { CorridorStage } from "../CorridorStage";

/**
 * Scene 3, 30–45 s: Carina at the sill, her back to him, touches her
 * forehead; Harry turns at the waist, sees the two cups, "Two cups.", turns
 * back, slides along the seat toward its left end and says "I'd say yes, by
 * the way."; "You didn't read it." "Didn't have to."; she opens the creased
 * sheet, folds it once and lays it on the sill beside the cups.
 *
 * Concretization: Carina turns toward Harry to open and fold the note so
 * her hands read from the open front, then turns back to the sill to lay
 * it down. Harry slides one shift of 0.6 m, the most one shift
 * moves, which leaves the right half for her with the hip spacing the
 * sitting table gives two people side by side.
 *
 * ```ts
 * twoCups(new CorridorStage().cast);
 * ```
 *
 * @param cast The stage's cast.
 * @returns The scene's composition, filling 30–45 s.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s03 The scene.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s03-b01 Her forehead touch with her back to him; his look back at the cups.
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s03-b02 "Two cups.", his shift along the seat and "I'd say yes, by the way.".
 * @evidence docs/body/screenplay/paper-crane-invitation.md#s03-b03 "You didn't read it." "Didn't have to."; unfold, fold once, put down on the sill.
 * @evidence contracts/development/composition.md#screenplay-realization Every beat's action, line and camera in order.
 * @evidence contracts/development/composition.md#composition-only Only chained library capabilities; absolute seconds only as action starts.
 * @evidence contracts/development/composition.md#living-scene Both act through the scene; the camera holds the two-shot from the open front for her forehead touch, cuts to the right end for his look back, back to the open front for his slide and the lines, then to a medium on Carina from the open front, in profile as she faces Harry, for the unfold and fold, and to a full shot of her from outside the window for the put-down, her face and hands toward the lens.
 * @evidence contracts/development/common.md#meaningful-documentation States the scene and its concretization.
 * @evidence contracts/development/implementation.md#principled-implementation The sitting and handling laws resolve the shift, unfold, fold and put-down.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain per participant inside `StageTime.scene`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate or tuned value; the shift is the sitting law's one-shift limit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds a constant-size composition.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data.
 */
export function twoCups(cast: CorridorStage.ICast): AutoMovieComposition {
  const { carina, harry, crane, camera } = cast;
  return StageTime.scene(
    "s03",
    30,
    45,
    carina
      .touchForehead({ start: 30.4 })
      .say("You didn't read it.", { start: 38.6 })
      .turnTo(harry)
      .unfold(crane)
      .fold(crane)
      .turnTo("sill.rightEnd")
      .putDown(crane, "sill.note"),
    harry
      .lookBack("sill.rightEnd", { start: 32.2 })
      .say("Two cups.")
      .lookAt(null, { start: 34 })
      .shift("right", 0.6)
      .say("I'd say yes, by the way.", { start: 36.4 })
      .say("Didn't have to.", { start: 40.4 }),
    camera
      .twoShot([harry, carina], { start: 30, from: "front", height: "seated" })
      .next(camera.twoShot([harry, carina], { start: 32.0, from: "rightEnd", height: "seated" }))
      .next(camera.twoShot([harry, carina], { start: 34.2, from: "front", height: "seated" }))
      .next(camera.shot([carina], { start: 39.6, size: "medium", from: "front", keep: "hands" }))
      .next(camera.shot([carina], { start: 42.9, size: "full", from: "outsideWindow", keep: "hands" })),
  );
}
