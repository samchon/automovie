/** A sanitized failure whose message is written by the reader, never by I/O. */
export class ReferenceError extends Error {
  /** Keep the provider-authored category and message together without external error data. */
  public constructor(
    /** Stable refusal category consumed by transports and configuration publication callers. */
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Stop one reference operation with its intentional sanitized refusal. */
export const fail = (code: string, message: string): never => {
  throw new ReferenceError(code, message);
};

/** Maximum bytes admitted from one Markdown source. */
export const MAX_SOURCE_BYTES = 8_388_608;
/** Maximum aggregate source bytes observed for one layer revision. */
export const MAX_LAYER_BYTES = 33_554_432;
/** Maximum number of files admitted into one authored-layer inventory. */
export const MAX_FILES = 10_000;
/** Default UTF-8 byte allowance for one serialized success envelope. */
export const DEFAULT_BUDGET = 65_536;
/**
 * Largest explicit serialized-result allowance accepted by either transport.
 */
export const MAX_BUDGET = 1_048_576;
