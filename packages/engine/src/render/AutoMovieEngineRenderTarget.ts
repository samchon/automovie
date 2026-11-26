import { autoMovieRenderDigest as autoMovieRenderDigestImplementation } from "./internal/autoMovieRenderDigest";
import { autoMovieRenderHash32 as autoMovieRenderHash32Implementation } from "./internal/autoMovieRenderHash32";
import { type IAutoMovieRenderTargetAsset, type IAutoMovieCompareRenderTarget, type IAutoMovieRenderReport, type IAutoMovieEvaluateRenderBudget, type IAutoMovieRenderTarget, type IAutoMovieSealRenderTarget } from "@automovie/interface";
import { autoMovieRenderTargetAssets as autoMovieRenderTargetAssetsImplementation } from "./internal/autoMovieRenderTargetAssets";
import { autoMovieRenderTargetSummary as autoMovieRenderTargetSummaryImplementation } from "./internal/autoMovieRenderTargetSummary";
import { compareAutoMovieRenderIds as compareAutoMovieRenderIdsImplementation } from "./internal/compareAutoMovieRenderIds";
import { compareAutoMovieRenderTarget as compareAutoMovieRenderTargetImplementation } from "./internal/compareAutoMovieRenderTarget";
import { evaluateAutoMovieRenderBudget as evaluateAutoMovieRenderBudgetImplementation } from "./internal/evaluateAutoMovieRenderBudget";
import { sealAutoMovieRenderTarget as sealAutoMovieRenderTargetImplementation } from "./internal/sealAutoMovieRenderTarget";

/** Public operations for Auto Movie Engine Render Target. */
export namespace AutoMovieEngineRenderTarget {
  /**
   * SHA-256 over a UTF-8 string, in pure TypeScript.
   *
   * The engine cannot reach `node:crypto`: the viewer bundles the engine into a
   * browser, so a Node built-in here would break the one consumer that has to
   * agree with the capture path byte for byte. It also cannot reach
   * `SubtleCrypto`, which is asynchronous and unavailable outside a secure
   * context, and a digest that is sometimes a promise is a digest no synchronous
   * evidence path can use.
   *
   * The string is encoded by `utf8Bytes` and digested by `digestAutoMovieBytes`,
   * the FIPS 180-4 algorithm with no variation, so the same text hashes to the
   * same `sha256:` digest as `createHash("sha256")` does on the capture side, and
   * the test suite proves exactly that against Node's implementation rather than
   * against a stored expectation of this code's own output.
   */
  export function autoMovieRenderDigest(text: string): string {
    return autoMovieRenderDigestImplementation(text);
  }

  /**
   * A deterministic 32-bit FNV-1a hash of a string.
   *
   * Used to place a semantic id in the mask palette. FNV-1a rather than the
   * digest above because a palette slot needs a fast, well-distributed integer
   * and not a cryptographic guarantee; the mask's collision handling, not the
   * hash, is what makes the palette exact.
   */
  export function autoMovieRenderHash32(text: string): number {
    return autoMovieRenderHash32Implementation(text);
  }

  /** Assets shorthand: pair paths with digests already proved elsewhere. */
  export function autoMovieRenderTargetAssets(entries: Readonly<Record<string, string>>): IAutoMovieRenderTargetAsset[] {
    return autoMovieRenderTargetAssetsImplementation(entries);
  }

  /** Read the reported and current digests, for a one-line staleness log. */
  export function autoMovieRenderTargetSummary(props: IAutoMovieCompareRenderTarget.IProps): string {
    return autoMovieRenderTargetSummaryImplementation(props);
  }

  /**
   * Compare two strings by UTF-16 code unit.
   *
   * Relational comparison uses the same code-unit order as the native default
   * string sort, without locale collation. This named comparator also applies
   * that order to ids extracted from records on every host.
   */
  export function compareAutoMovieRenderIds(left: string, right: string): number {
    return compareAutoMovieRenderIdsImplementation(left, right);
  }

  /**
   * Decide whether a report is still evidence about the target in front of you.
   *
   * A budget verdict is a claim about a specific renderer drawing specific bytes
   * at a specific size. Change any of that and the verdict is not conservative,
   * it is wrong in an unknown direction: a smaller shadow map makes a failing
   * report pass and a larger one makes a passing report fail, and neither
   * re-measured anything. So a mismatch is `stale`, never `pass`, and every
   * differing field is named so the drift is actionable instead of mysterious.
   */
  export function compareAutoMovieRenderTarget(props: IAutoMovieCompareRenderTarget.IProps): IAutoMovieCompareRenderTarget.IResult {
    return compareAutoMovieRenderTargetImplementation(props);
  }

  /**
   * Check one inventory against one declared budget and produce the bounded
   * report.
   *
   * The report answers for every metric, always, with one of five outcomes. Four
   * of them are not "pass":
   *
   * - `within`: measured, budgeted, at or below the limit;
   * - `over`: measured, budgeted, above the limit, with the dominant owners and the
   *   exact way back;
   * - `unbudgeted`: measured, but the production declared no limit, so nobody
   *   agreed what large means;
   * - `unsupported`: no analysis exists for what the design declares;
   * - `not-run`: the analysis exists but its input was not supplied.
   *
   * The last two make the whole report `incomplete`. That is the point of them:
   * an artifact whose fluid cost was never computed has not been cleared for
   * fluid cost, and a report that said `within` would be the exact false
   * capability claim this evidence exists to prevent.
   *
   * A budget limit that is negative, fractional or non-finite is an authoring
   * mistake and throws, rather than becoming a budget that can never be met.
   *
   * An `over` finding names somewhere the author can actually go. The limit is
   * compared against the inventory's own total, frame passes and all, but the
   * dominant-owner ranking is over the owners that hold their own cost; the
   * passes are counted among the owners the report does not name and stated in
   * the recovery as passes. A ranking that let them compete would put the same
   * name first in every production that lights nothing, and that name is a guide
   * pass no production declares.
   */
  export function evaluateAutoMovieRenderBudget(props: IAutoMovieEvaluateRenderBudget.IProps): IAutoMovieRenderReport {
    return evaluateAutoMovieRenderBudgetImplementation(props);
  }

  /**
   * Seal one render target: the renderer, its settings, and the exact asset bytes
   * a frame will read.
   *
   * The digest hashes explicit-position JSON tuples, so object property order and
   * embedded tabs/newlines do not collapse different renderer/asset fields.
   * Assets are sorted by UTF-16 code unit rather than locale collation.
   *
   * Buffer dimensions, ratio/exposure, shadow policy, nonblank renderer fields,
   * unique asset paths and SHA spellings are admitted here. Closed policy and
   * boolean field shapes are a caller structural-admission premise.
   */
  export function sealAutoMovieRenderTarget(props: IAutoMovieSealRenderTarget.IProps): IAutoMovieRenderTarget {
    return sealAutoMovieRenderTargetImplementation(props);
  }
}
