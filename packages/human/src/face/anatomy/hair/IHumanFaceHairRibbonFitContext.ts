import type {
  IAutoMovieMeshQueryBudget,
  IAutoMovieMeshSeparationAttachment,
} from "@automovie/engine";

import type { IHumanFaceHairSeparationReaders } from "./IHumanFaceHairSeparationReaders";

/**
 * The per-curve context `fitHumanFaceHairRibbonRows` certifies one ribbon in.
 *
 * The readers and budget are shared with the rest of the curve's lock; the
 * budget is spent in place. `attachment` is the curve's canonical root seat,
 * required whenever the first row is the root.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRibbonFitContext extends IHumanFaceHairSeparationReaders {
  /** Requested free-row clearance in metres; stem rows require strict separation. */
  clearance: number;

  /** The curve's shared work budget, spent in place by every new query. */
  budget: IAutoMovieMeshQueryBudget;

  /** Canonical root seat of the curve, or undefined when no root row exists. */
  attachment: IAutoMovieMeshSeparationAttachment | undefined;
}
