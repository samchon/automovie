

/**
 * Mutable existing status-unit source, compile, document and observation controls.
 *
 * @author Samchon
 */
export interface ISourceStatusState {
  /** Current logical project revision used by the retained answer. */
revision: number;
  /** Current source text arranged by the owning unit. */
source: string;
  /** Source text recorded by the fixture's latest compile operation. */
compiled: string;
  /** Current logical compiled payload text, independently mutable for tamper arrangements. */
generated: string;
  /** Explicit semantic validity arranged by the owning unit. */
valid: boolean;
  /** Optional resident authoring guard; this fixture acquires no native store. */
resident: string | null;
  /** Current screenplay-index text arranged by the unit, or null for absence. */
screenplay: string | null;
  /** Current document text by logical address; null values represent unavailable text. */
documents: Map<string, string | null>;
  /** Requested document addresses in evaluation order, including repeated reads. */
read: string[];
  /** Executed-module names outside the fixture's declared fingerprint closure. */
undeclaredModules: string[];
  /** True when acquisition must report no complete logical snapshot. */
incomplete: boolean;
  /** Whether the answer reports dependence on its logical revision. */
revisionBound: boolean;
}
