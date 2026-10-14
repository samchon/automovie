import { IAutoMovieExternalMotionConversionCompiler } from "./IAutoMovieExternalMotionConversionCompiler";
import { IAutoMovieExternalMotionConversionDecision } from "./IAutoMovieExternalMotionConversionDecision";
import { IAutoMovieExternalMotionConversionResult } from "./IAutoMovieExternalMotionConversionResult";
import { IAutoMovieExternalMotionConversionSource } from "./IAutoMovieExternalMotionConversionSource";
import { IAutoMovieExternalMotionConversionTarget } from "./IAutoMovieExternalMotionConversionTarget";
import { IAutoMovieExternalMotionLossEntry } from "./IAutoMovieExternalMotionLossEntry";
import { IAutoMovieExternalMotionReceiptCharacterization } from "./IAutoMovieExternalMotionReceiptCharacterization";
import { IAutoMovieExternalMotionTransformActivity } from "./IAutoMovieExternalMotionTransformActivity";

/**
 * Compiler-sealed receipt for one external motion conversion.
 *
 * The builder serializes this receipt as its own generated file and lists that file in {@link IAutoMovieGeneratedManifest.files}; it does not mutate or embed the preserved source bytes.
 *
 * @evidence contracts/common.md#principled-implementation The receipt seals compiler law, exact source closure and inspected basis, actor-bound decision, target basis, transformation and loss ledgers, compatibility findings and canonical output identities into one generated provenance record.
 * @evidence contracts/common.md#clear-and-simple-design Separate source, decision, target, transform, loss, characterization and result groups expose each authority without mutating preserved source assets or conflating compatibility analysis with user choice.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A generated receipt cannot rewrite the source bytes it describes, and converted motion carries distinct canonical-value and exact-file digests rather than borrowing source identity as its output proof.
 * @evidence contracts/common.md#meaningful-documentation Names compiler and generated-file ownership, preserved source bytes and the responsibilities of each source, decision, target, analysis, transform, loss and output group.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionReceipt {
  /** External motion conversion receipt schema version. */
  version: 1;

  /** Compiler tool and protocol identity that produced the conversion. */
  builder: IAutoMovieExternalMotionConversionCompiler;

  /** Production-declared external motion adoption identity. */
  adoption: string;

  /** Pinned source closure, take, and byte-inspected basis. */
  source: IAutoMovieExternalMotionConversionSource;

  /** Actor-bound authored adoption decision. */
  decision: IAutoMovieExternalMotionConversionDecision;

  /** Exact model and skeleton basis receiving the motion. */
  target: IAutoMovieExternalMotionConversionTarget;

  /** Ordered builder-performed transform ledger. */
  transforms: IAutoMovieExternalMotionTransformActivity[];

  /** Ordered ledger of dropped, approximated, or altered source facts. */
  losses: IAutoMovieExternalMotionLossEntry[];

  /** Compatibility findings for the authored adoption; no separate override-authorization workflow is implemented. */
  characterization: IAutoMovieExternalMotionReceiptCharacterization;

  /** Canonical motion and generated output identities. */
  result: IAutoMovieExternalMotionConversionResult;
}
