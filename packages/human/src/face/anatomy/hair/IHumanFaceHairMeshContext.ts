import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";

/**
 * Per-layer inputs `buildHumanFaceHairMesh` needs beside its curves.
 *
 * `widths`, `budgets` and `attachments` are aligned with the curves, one entry
 * per curve; each budget continues that curve's lock budget and is spent in
 * place.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the density widths, host readers, shared budgets and canonical root seats the mesher certifies with.
 * @evidence contracts/common.md#clear-and-simple-design Named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no subject, tolerance or per-curve exception.
 * @evidence contracts/common.md#meaningful-documentation States alignment with the curves and budget mutation.
 * @evidence contracts/modeling.md#spatial-conventions Widths and readers use head-local metres.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The mesher names the layer part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The mesher emits the ribbons.
 * @evidence contracts/modeling.md#shared-boundaries The readers and root seats describe the one host skin the ribbons must clear.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical inputs only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived inputs, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairMeshContext {
  /** Nominal ribbon width per curve, from the density rule, in metres. */
  widths: readonly number[];

  /** Signed closed-collider query of the host skin. */
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>;

  /** Source and represented separation readers of the host skin. */
  separation: IHumanFaceHairSeparationReaders;

  /** Each curve's shared lock budget, spent in place. */
  budgets: readonly IAutoMovieMeshQueryBudget[];

  /** Each curve's canonical root seat on the host skin. */
  attachments: readonly IAutoMovieMeshSeparationAttachment[];
}
