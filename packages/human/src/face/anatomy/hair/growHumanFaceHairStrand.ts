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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps every generated strand outside the shared surface, growing the ones a projection cannot place.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Projects interpolated stations by the guides' contact rule and integrates the strand when that projection refuses or its chords exceed the integrator's step.
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
  try {
    const points = strand.points.map((point, index) =>
      index === 0 ? point : contact.project(point),
    );
    // The root's own emergence is the clearance, as it is for a guide, and
    // stands outside this bound like the integrator's launch segment.
    const chord = contact.step + contact.epsilon;
    for (let at = 2; at < points.length; at++) {
      const span = points[at],
        before = points[at - 1];
      if (
        Math.hypot(span.x - before.x, span.y - before.y, span.z - before.z) >
        chord
      )
        return props.integrate();
    }
    return {
      points,
      length: strand.length,
      clearance: contact.clearance - contact.epsilon,
      normal: { ...strand.normal },
    };
  } catch {
    return props.integrate();
  }
}
