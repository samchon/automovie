import type { IAutoMovieModelPart } from "@automovie/interface";

import { applyPortraitOralContact } from "./applyPortraitOralContact";

/**
 * Keep the enamel of the built face behind the lips and in front of the oral
 * cavity, whichever of the two arches and the cavity the face has.
 *
 * Teeth cannot pass through the lip they sit behind, and the lining cannot
 * pass through the teeth it encloses, yet each component fits itself alone, so
 * the assembled parts can cross. This applies the directional contact of
 * `applyPortraitOralContact` to each resident arch in turn, in the head's
 * metre frame, with zero clearance: touching at most. An arch retreats
 * posteriorly as one rigid body behind the lips; a present cavity is then
 * pushed back behind it, while a closed mouth, which has no cavity, only
 * retreats its enamel. Faces without lips or without an arch are returned as
 * they are. The part identities are those the mouth, cavity and dental
 * components emit (`lips`, `oral-cavity`, `tooth-upper-arch`,
 * `tooth-lower-arch`), and other parts are retained. The fit measures along Z,
 * so it resolves what a frontal view sees; contact of the enamel with the
 * tongue or with a cavity wall that encloses it sideways is not resolved.
 *
 * @evidence contracts/common.md#principled-implementation Each component fits itself alone, so the assembled enamel can cross the lips and the lining; resolving contact after assembly, arch by arch, with the directional fit at zero clearance restores the physical ordering (enamel behind the lips, lining behind the enamel) with the least motion, and a closed mouth, which has no lining, only retreats its enamel.
 * @evidence contracts/common.md#clear-and-simple-design A thin composition over `applyPortraitOralContact` that names the parts the face emits; the fit policy stays with its owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture is named; the part identities are the ones the mouth, cavity and dental components emit, and clearance zero is the least a body can have, not a tuned threshold.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is resolved, which parts are retained, the zero clearance, the closed-mouth case and what is not resolved (tongue contact and sideways enclosure).
 * @evidence contracts/modeling.md#part-identity-and-grouping The function composes existing parts of the mouth region by identity and copies no part's shape.
 * @evidence contracts/modeling.md#spatial-conventions Parts are in the head frame in metres, as the fit requires.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries It is the assembly-level owner of the enamel-lip and lining-enamel boundaries: one zero clearance applied to each present arch through the shared fit, verified by the face builder's scenario where both arches sit at the lip plane and end behind it. Contact with the tongue, and with a cavity wall enclosing the enamel sideways, is not resolved, and measured on the fixture face the tongue crosses the lower enamel when advanced.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 * @author Samchon
 */
export function resolvePortraitOralContact(
  parts: IAutoMovieModelPart[],
): IAutoMovieModelPart[] {
  const has = (id: string): boolean => parts.some((part) => part.id === id);
  if (!has("lips")) return parts;
  return ["tooth-upper-arch", "tooth-lower-arch"]
    .filter(has)
    .reduce(
      (resolved, enamel) =>
        applyPortraitOralContact(resolved, {
          lips: "lips",
          enamel,
          cavity: has("oral-cavity") ? "oral-cavity" : undefined,
          clearance: 0,
        }),
      parts,
    );
}
