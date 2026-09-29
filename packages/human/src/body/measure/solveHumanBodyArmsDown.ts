import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { stepHumanBodyArmsDown } from "./stepHumanBodyArmsDown";

/**
 * Lower both arms to the side of the body it is asked of, as far as that
 * body's own skin lets them hang.
 *
 * Where a relaxed arm comes to rest depends on the body: the width of the
 * chest, belly and hips, the bulk of the arm, sex and mass. A fixed
 * elevation drives a heavy body's forearms through its flanks and leaves a
 * slender one's arms short of its sides, so the preset is solved on the
 * document's own evaluated surface rather than typed. Each arm hangs in the
 * lateral plane (TT plane 0) with no axial rotation and a straight elbow,
 * and its total elevation is read in one-degree steps from 0 (hanging straight
 * down) toward the measured A-pose rest elevation: the first elevation at
 * which no segment of that arm's chain (the upper arm and everything below
 * it) crosses a non-arm segment or itself more than at rest. Contact between
 * the two arms is assessed after both goals are chosen. The body's existing
 * contact at the arms' rest goals is not charged to the preset. Both
 * arms are read in one body at each degree, so a contact island cannot be
 * skipped by a monotone-search assumption. An arm already clear holds its
 * first-safe goal while the other continues. Cross-arm pairs are checked in
 * the final combined body, which refuses any new contact.
 *
 * The result is ordinary document data: the document's own pose with each
 * lower arm's flexion set to 0 and each upper arm's TT goal replaced; shape,
 * materials and every other joint are untouched. The caller applies it as
 * one edit. A document the builder refuses at a sampled goal, such as a
 * girdle or elbow past its clinical range, refuses here with the
 * builder's reason; nothing is clamped. Cost grows with the larger first-safe
 * whole-degree elevation, with one shared build per degree. The editor runs
 * it off the page one step at a time (`stepHumanBodyArmsDown`).
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Gives the Arms down preset a body-specific rest at first skin contact instead of a fixed angle that drives the arms through heavy bodies.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Solves the preset's lateral-plane elevation per arm against the same segment crossing instrument the contact check uses, charging only contact the rest pose lacks.
 */
export function solveHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
): Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders"> {
  const steps = stepHumanBodyArmsDown(basis, build, document);
  for (;;) {
    const next = steps.next();
    if (next.done === true) return next.value;
  }
}
