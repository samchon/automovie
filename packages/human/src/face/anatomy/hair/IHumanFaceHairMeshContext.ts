import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";
import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";

/**
 * Per-layer inputs `buildHumanFaceHairMesh` needs beside its curves.
 *
 * `widths`, `budgets` and `attachments` are aligned with the curves, one entry
 * per curve; each budget continues that curve's lock budget and is spent in
 * place. The representation owner emits the actual station/vertex membership
 * through observeContactCurve; assembly never guesses rings from ribbons.
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

  /** Reports a completed curve buffer in its actual representation; whole-mesh validation remains downstream. */
  progress?: (ordinal: number) => void;

  /** Publish actual per-curve emitted vertex membership after its geometry has been certified. */
  observeContactCurve?: (curve: IHumanFaceHairContactCurve) => void;
}
