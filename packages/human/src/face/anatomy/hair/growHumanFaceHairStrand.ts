import type { IAutoMovieVector3 } from "@automovie/interface";

import type { humanFaceHairContact } from "./humanFaceHairContact";

/**
 * Place one interpolated strand outside the collider: every station after
 * the root is projected by the guides' own contact rule, so a strand keeps
 * the clearance its guides were integrated with without being integrated
 * itself.
 *
 * The hierarchy is an optimization and the integrator is the definition, so
 * a strand the projection cannot place is grown instead. That happens where
 * a blend runs deep into a fold and the nearest feature alternates between
 * its walls, which the projection reports by refusing; `integrate` then
 * grows that one root like a guide. The caller owns the station budget of
 * whichever curve comes back.
 * Projection refusal chooses integration; an integration refusal is propagated
 * unchanged. The integrator is called once outside the placement's catch.
 *
 * A placed strand is also held to the chord its guides were integrated with.
 * Interpolation scales the blended displacements to the strand's own regional
 * length, so guides that disagree blend to a short curve and that scale grows
 * without bound, spreading stations far apart; the projection still places
 * each one outside, but the straight segments between them have no clearance
 * argument left and can cut through the head. Such a strand is grown instead,
 * which is the hierarchy admitting that these guides do not describe this
 * root's flow. The segment out of the root is the emergence the guides also
 * take and is held to the clearance instead, not to the step.
 *
 * @evidence contracts/common.md#principled-implementation Every station after
 *   the root is projected by the same contact rule the guides were integrated
 *   with, and the strand is kept only if no later chord exceeds the step plus
 *   its rounding allowance, because the clearance argument for the straight
 *   segments between stations rests on that chord. The segment out of the root
 *   is exempt, being the emergence. A strand that fails, or that the projection
 *   refuses, is grown by the integrator instead, which is the definition the
 *   hierarchy approximates. The fallback catches the projection's refusal and
 *   returns to the definition, so it corrects a real difference between an
 *   interpolated and an integrated curve and does not mask a wrong premise.
 *   The placement catch never retries a refusing integrator: integration runs
 *   once after the decision, and its own failure is propagated unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One decision per
 *   strand between placing and growing; the caller owns the station budget of
 *   whichever curve returns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a subject or style: the placement test and the fallback are the
 *   same for every strand.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   why the hierarchy is an optimisation, when it grows a strand instead and
 *   what the chord bound protects.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines no channel and reads the hairstyle document's fields without varying
 *   a form; the document type owns their meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive; it returns a centreline whose stations are the strand's or the
 *   integrator's.
 * @evidence contracts/modeling.md#spatial-conventions Points are posed metres
 *   in the head frame, the chord bound is the contact's step in metres, and the
 *   returned clearance is the contact's fibre clearance in metres; nothing is
 *   converted.
 * @evidence contracts/modeling.md#shared-boundaries The strand meets the skin
 *   through the guides' shared contact rule and nominal half-step plus requested
 *   clearance. Each curve owns a separate instance with a rounding allowance
 *   scaled to its own root and length; these are not the same object.
 *   Where blended guides disagree the chord test fails and the strand is
 *   integrated, which is the configuration in which the interpolated join would
 *   open.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function growHumanFaceHairStrand(props: {
  strand: {
    points: readonly IAutoMovieVector3[];
    length: number;
    normal: IAutoMovieVector3;
  };
  contact: ReturnType<typeof humanFaceHairContact>;
  integrate: () => {
    points: IAutoMovieVector3[];
    length: number;
    clearance: number;
    normal: IAutoMovieVector3;
  };
}): {
  points: IAutoMovieVector3[];
  length: number;
  clearance: number;
  normal: IAutoMovieVector3;
} {
  const { strand, contact } = props;
  const points: IAutoMovieVector3[] = [];
  let placed = true;
  try {
    // The root's own emergence is the clearance, as it is for a guide, and
    // stands outside this bound like the integrator's launch segment. Each
    // station is projected and its chord checked before the next is queried,
    // so a strand that has to be grown is recognised at its first bad chord
    // and the stations after it are never projected.
    const chord = contact.step + contact.epsilon;
    for (let at = 0; at < strand.points.length; at++) {
      const point =
        at === 0 ? strand.points[0] : contact.project(strand.points[at]);
      if (at >= 2) {
        const before = points[at - 1];
        if (
          Math.hypot(
            point.x - before.x,
            point.y - before.y,
            point.z - before.z,
          ) > chord
        ) {
          placed = false;
          break;
        }
      }
      points.push(point);
    }
  } catch {
    placed = false;
  }
  if (!placed) return props.integrate();
  return {
    points,
    length: strand.length,
    clearance: contact.clearance - contact.epsilon,
    normal: { ...strand.normal },
  };
}
