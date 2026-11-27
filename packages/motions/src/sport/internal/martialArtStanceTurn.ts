import type { AutoMovieHumanSide } from "@automovie/interface";

import type { MartialArtStanceForms } from "./MartialArtStanceForms";

/*
 * A stance form's pelvis turn from the entry heading, degrees: the opening
 * offset as the form opens and the further turn over the back transfer, both
 * away from the lead (clockwise seen from above for a left lead).
 * Parameter form: The form's turns.
 * Parameter lead: The leading foot.
 * Parameter shown: How far the form has opened, in [0, 1].
 * Parameter recover: The back transfer's progress, in [0, 1].
 * Returns: The heading offset, degrees about +Y.
 */
export function martialArtStanceTurn(
  form: Pick<MartialArtStanceForms.IForm, "turn">,
  lead: AutoMovieHumanSide,
  shown: number,
  recover: number,
): number {
  return (
    (lead === "left" ? -1 : 1) * (form.turn[0] + form.turn[1] * recover) * shown
  );
}
