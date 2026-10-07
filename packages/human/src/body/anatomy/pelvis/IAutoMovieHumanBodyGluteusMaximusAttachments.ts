import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type GluteusMaximusOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}CoxalBone`; site: "posteriorIlium" }
  | { structure: "sacrum"; site: "dorsalSurface" }
  | { structure: `${Side}SacrotuberousLigament`; site: "pelvicAttachment" };

type GluteusMaximusInsertion<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Femur`; site: "glutealTuberosity" }
  | { structure: `${Side}IliotibialTract`; site: "proximalTract" };

/** One anatomical side's whole record: its origins and insertions never name the other side. */
interface IAutoMovieHumanBodyGluteusMaximusAttachmentsRecord<
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

/**
 * Same-side anatomical origins and insertions of a generated gluteus maximus.
 *
 * Named sites are output relations among the resolved coxal bone, sacrum,
 * femur and fascia. They are never user-supplied XYZ positions. A nearest
 * segmented bone voxel alone cannot identify a tendon attachment.
 *
 * The type distributes over `Side`: a record is wholly one side's, so a union
 * `Side` admits either side's record and never a record that mixes the two.
 *
 * @evidence contracts/common.md#principled-implementation The origins and insertions are closed unions templated on `Side`, so each site can only name a structure of the same side (`${Side}CoxalBone`, the shared sacrum, `${Side}SacrotuberousLigament`, `${Side}Femur`, `${Side}IliotibialTract`); the tuple `[X, ...X[]]` requires at least one of each, so an attachment record cannot be empty. A conditional type that distributes over `Side` makes a union `Side` admit either side's whole record and never one mixing the two, which a record typed by the union directly would have admitted.
 * @evidence contracts/common.md#clear-and-simple-design The record is one interface of two readonly members, the origins and the insertions, each a closed union of named structure and site, and the exported type only distributes it over `Side`; the distribution is the single added mechanism and exists because a template-literal member typed by a union `Side` would otherwise pair a left origin with a right insertion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is a type and holds no behaviour, so no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The comment states that the sites are output relations among resolved parts and never user-supplied XYZ positions, and that a nearest segmented bone voxel cannot identify a tendon attachment; each member states that at least one same-side site is required.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The declaration defines no part or group: it relates gluteus maximus to bone and fascia parts declared elsewhere by name and copies none of them.
 * @evidenceExclude contracts/modeling.md#parameter-channels The declaration names attachment sites, not shape channels: no value varies a form and nothing here has a neutral zero.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The declaration emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The declaration holds no value with a unit or a frame: every entry is a structure name and a site name.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The declaration builds no surface or volume: it names the sites where a generated muscle must meet bone or fascia, and the generator that resolves them owns that boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is a set of attachment names that no product path draws, so there is no rendered frame of it to observe.
 * @evidenceExclude contracts/anatomy.md#permitted-range The declaration admits no anatomical quantity: a site is a name from a closed union and the closed schema rejects any other value; the sites are relations, not measurements.
 * @evidence contracts/anatomy.md#parametric-authority Every entry is a structure of the same side and a site from a closed union of named landmarks, so a caller can name an attachment but cannot place one: no coordinate, vertex or surface patch is expressible.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMaximusAttachments<
  Side extends AutoMovieHumanBodySide,
> = Side extends AutoMovieHumanBodySide
  ? IAutoMovieHumanBodyGluteusMaximusAttachmentsRecord<Side>
  : never;
