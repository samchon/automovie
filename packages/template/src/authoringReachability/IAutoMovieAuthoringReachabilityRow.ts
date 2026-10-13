import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import type { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

/**
 * One public capability's complete route from author decision to consumer.
 *
 * @author Samchon
 */
export interface IAutoMovieAuthoringReachabilityRow {
  /** Addressable capability family. */
  capability: AuthoringReachabilityRules.AutoMovieAuthoringCapability;

  /** Closed executable choices when the capability has a literal vocabulary. */
  choices: readonly string[] | null;

  /** Runtime or builder symbol that consumes the authored value. */
  consumer: string | null;

  /** Production-design field, only for a field-level row. */
  field: AuthoringReachabilityRules.AutoMovieProductionDesignField | null;

  /** Concrete reason the selected production kind cannot use this row. */
  inapplicableReason: string | null;

  /** Production shape to which the row applies. */
  kind: AutoMovieAuthoringProductionKind;

  /** Generated-project document or source location that owns the decision. */
  owner: string | null;

  /** Generated-project document that points to the owner and installed public APIs. */
  route: AuthoringReachabilityRules.AutoMovieAuthoringRoute | null;

  /** Typed value or document passed directly to the named public consumer. */
  input: string | null;
}
