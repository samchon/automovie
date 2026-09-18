/**
 * Compiler tool and protocol identity sealed into a motion conversion receipt.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Requires the conversion tool and version to remain bound to the receipt result.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Makes tool and profile versions part of deterministic receipt identity.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionConversionCompiler {
  /**
   * Exact builder package version.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Records which conversion tool build interpreted the pinned source closure.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Invalidates receipt identity when the builder implementation version changes.
   */
  packageVersion: string;
  /**
   * Exact builder content-protocol version.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-inputs Records the conversion protocol governing settings and canonical output.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-input-basis Invalidates receipt identity when the interpretation protocol changes.
   */
  protocolVersion: string;
}
