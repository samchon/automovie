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
 * The builder serializes this receipt as its own generated file and lists that
 * file in {@link IAutoMovieGeneratedManifest.files}; it does not mutate or embed
 * the preserved source bytes.
 *
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

  /** Source-to-target compatibility findings before user authorization. */
  characterization: IAutoMovieExternalMotionReceiptCharacterization;

  /** Canonical motion and generated output identities. */
  result: IAutoMovieExternalMotionConversionResult;
}
