import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import type { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";

/**
 * One public capability's complete route from author decision to consumer.
 *
 * @evidence requirements/product/authorability.md#product-discoverable-control Carries the owner, input, consumer, and route fields one capability needs to be provably reachable, or its concrete inapplicable reason.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-tool-choice-discovery Is the typed row the production-kind route query returns.
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
