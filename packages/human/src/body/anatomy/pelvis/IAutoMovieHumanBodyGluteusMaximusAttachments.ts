import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type GluteusMaximusOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}CoxalBone`; site: "posteriorIlium" }
  | { structure: "sacrum"; site: "dorsalSurface" }
  | { structure: `${Side}SacrotuberousLigament`; site: "pelvicAttachment" };

type GluteusMaximusInsertion<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Femur`; site: "glutealTuberosity" }
  | { structure: `${Side}IliotibialTract`; site: "proximalTract" };

/**
 * Same-side anatomical origins and insertions of a generated gluteus maximus.
 *
 * Named sites are output relations among the resolved coxal bone, sacrum,
 * femur and fascia. They are never user-supplied XYZ positions. A nearest
 * segmented bone voxel alone cannot identify a tendon attachment.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGluteusMaximusAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** At least one named pelvic origin in the same anatomical side. */
  readonly origins: readonly [
    GluteusMaximusOrigin<Side>,
    ...GluteusMaximusOrigin<Side>[],
  ];
  /** At least one femoral or iliotibial insertion on that side. */
  readonly insertions: readonly [
    GluteusMaximusInsertion<Side>,
    ...GluteusMaximusInsertion<Side>[],
  ];
}
