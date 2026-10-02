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
 * @evidence contracts/common.md#principled-implementation Each arm's total elevation is searched in one-degree steps from hanging straight down toward the body's measured A-pose rest elevation, and the first elevation at which that arm's chain crosses no skin beyond what it crosses at rest is kept. A linear scan is used because contact can vanish and return as the arm passes different body regions, which bisection would skip; both arms share one build per degree, and cross-arm contact is judged in the combined result, which refuses any new crossing. The premises are the builder's own evaluated skin and the whole-degree resolution.
 * @evidence contracts/common.md#clear-and-simple-design A synchronous driver over the step generator that owns the search, so the editor's incremental path and this path run one implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No elevation is typed per body and no crossing is hidden: the preset is read on the document's own surface, a document the builder refuses is refused with the builder's reason, and nothing is clamped.
 * @evidence contracts/common.md#meaningful-documentation States why a fixed elevation fails, the plane, axial rotation and elbow convention, the search order and cost, the cross-arm check, the returned pose and shoulder data and the refusal behavior.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group; it chooses shoulder goals for existing joints.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no morph channel; it returns pose and shoulder goals.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits document pose data and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are whole degrees in the thorax-tt shoulder coordinates (plane 0 lateral, axial rotation 0) and flexion is degrees; crossings are counted on the builder's rest-frame meshes, and no unit or frame is converted here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary; it reads crossings between the builder's existing segments.
 * @evidence contracts/anatomy.md#permitted-range Each sampled goal is built by the builder, which refuses a girdle or elbow past its clinical range with its own reason, and this solve passes that refusal on instead of clamping. The goals are searched only between hanging straight down and the measured rest elevation, and cross-arm combinations are checked together after both arms are chosen.
 * @evidence contracts/anatomy.md#parametric-authority It returns an ordinary document pose and shoulder goals for named joints (lower-arm flexion 0, upper-arm TT plane, elevation and axial rotation), derived deterministically from the document's own skin, so no input addresses a vertex or surface; there is no inverse because the result is authored pose data the caller applies as one edit.
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
