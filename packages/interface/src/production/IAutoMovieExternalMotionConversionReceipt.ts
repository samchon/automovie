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
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires a canonical receipt and output digest for every meaningful conversion result.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Types the builder-owned receipt whose file identity is inventoried beside its output.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionReceipt {
  /**
   * External motion conversion receipt schema version.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires meaningful schema or version changes to change receipt identity.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Makes canonical serialization explicitly versioned.
   */
  version: 1;
  /**
   * Compiler tool and protocol identity that produced the conversion.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires the conversion tool and version to remain bound to the receipt result.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Makes tool and profile versions part of deterministic receipt identity.
   */
  builder: IAutoMovieExternalMotionConversionCompiler;
  /**
   * Production-declared external motion adoption identity.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-receipt Keeps every conversion attached to the explicit non-destructive adoption.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Joins source, decision, characterization, and result to one adoption.
   */
  adoption: string;
  /**
   * Pinned source closure, take, and byte-inspected basis.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires the full input basis to remain bound to the result.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Types the deterministic source input of the conversion receipt.
   */
  source: IAutoMovieExternalMotionConversionSource;
  /**
   * Actor-bound authored adoption decision.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Keeps conversion mode and destination under production authority.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Types the selected shot, actor, clip, mode, mapping, and scale.
   */
  decision: IAutoMovieExternalMotionConversionDecision;
  /**
   * Exact model and skeleton basis receiving the motion.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Grounds compatibility and mapping in the selected target controls.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Binds the decision to one target basis digest.
   */
  target: IAutoMovieExternalMotionConversionTarget;
  /**
   * Ordered builder-performed transform ledger.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-mapping Requires all mapping and conversion facts in the receipt.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-element-mapping Preserves semantic transform order in canonical identity.
   */
  transforms: IAutoMovieExternalMotionTransformActivity[];
  /**
   * Ordered ledger of dropped, approximated, or altered source facts.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-loss Requires explicit element-level consequences for every loss.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-loss-ledger Types loss independently of successful result generation.
   */
  losses: IAutoMovieExternalMotionLossEntry[];
  /**
   * Source-to-target compatibility findings before user authorization.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Keeps compatibility findings separate from overrides and mapping decisions.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Preserves the builder's characterization beside the authored decision.
   */
  characterization: IAutoMovieExternalMotionReceiptCharacterization;
  /**
   * Canonical motion and generated output identities.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-canonical-result Requires the receipt to bind its adopted identity and output bytes.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Seals result paths and digests into canonical receipt identity.
   */
  result: IAutoMovieExternalMotionConversionResult;
}
