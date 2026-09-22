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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Keeps every generated strand outside the shared surface, growing the ones a projection cannot place.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Projects interpolated stations by the guides' contact rule and integrates the strand when that projection refuses.
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
    return {
      points: strand.points.map((point, index) =>
        index === 0 ? point : contact.project(point),
      ),
      length: strand.length,
      clearance: contact.clearance - contact.epsilon,
      normal: { ...strand.normal },
    };
  } catch {
    return props.integrate();
  }
}
