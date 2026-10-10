import type { IHumanSourceAuthoredCompilation } from "./IHumanSourceAuthoredCompilation.ts";
import type { IHumanSourceBodyField } from "./IHumanSourceBodyField.ts";
import type { IHumanSourceBodyReproduction } from "./IHumanSourceBodyReproduction.ts";
import type { IHumanSourceCut } from "./IHumanSourceCut.ts";
import type { IHumanSourceDeltaReader } from "./IHumanSourceDeltaReader.ts";
import type { IHumanSourceFaceReproduction } from "./IHumanSourceFaceReproduction.ts";
import type { IHumanSourceGenerationInputs } from "./IHumanSourceGenerationInputs.ts";
import type { IHumanSourceHeadTraits } from "./IHumanSourceHeadTraits.ts";
import type { IHumanSourceRigReproduction } from "./IHumanSourceRigReproduction.ts";
import type { IHumanSourceTopology } from "./IHumanSourceTopology.ts";

/**
 * Replayed current root and endpoints after source authoring.
 * The input record is frozen at this boundary before generation identity.
 *
 * @author Samchon
 */
export interface IHumanSourcePreparedGeneration extends IHumanSourceGenerationInputs {
  /** Current sampled or authored root in the shared frame. */
  topology: IHumanSourceTopology;

  /** Frozen actual correspondence of root and partition views. */
  cut: IHumanSourceCut;

  /** Same-root endpoint and landmark access. */
  reader: IHumanSourceDeltaReader;

  /** Current body field and unchanged landmark neutral. */
  field: IHumanSourceBodyField;

  /** Replayed face endpoints and original recovery findings. */
  faceRows: IHumanSourceFaceReproduction;

  /** Body rows before shared field derivatives. */
  bodyRowsRaw: IHumanSourceBodyReproduction;

  /** Actual joint and weight replay observations. */
  rigRows: IHumanSourceRigReproduction;

  /** Historical body comparison findings, preserved by revision. */
  stages: Record<string, Record<string, number | boolean | string>>;

  /** Optional current-root compilation and retained refusal. */
  authored?: IHumanSourceAuthoredCompilation;

  /** Optional dimensional source fields and actual sparse rows. */
  headTraits?: IHumanSourceHeadTraits;
}
