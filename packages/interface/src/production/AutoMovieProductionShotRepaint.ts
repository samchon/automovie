import { IAutoMovieRepaintRuntimeIdentity } from "./capture/IAutoMovieRepaintRuntimeIdentity";
import { IAutoMovieProductionRepaintInput } from "./IAutoMovieProductionRepaintInput";

/**
 * Host-owned optional diffusion adapter.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `AutoMovieProductionShotRepaint` as the portable data boundary for the repaint reference roles requirement.
 * @evidence requirements/repaint/retries-seeds-and-variation.md#repaint-retry-budget-stop Carries provider-reported cost into the bounded attempt policy without granting the adapter control over that policy.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `AutoMovieProductionShotRepaint` for the asset spec repaint controls references system contract.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-attempt-selection Returns metered cost from one attempt so orchestration can enforce the reviewed request budget.
 */
export type AutoMovieProductionShotRepaint = (
  input: IAutoMovieProductionRepaintInput,
) => Promise<{
  /** Actual encoded rendition bytes. */
  bytes: Uint8Array;
  /** Required video media type. */
  mediaType: "video/mp4";
  /** Structured provider/model identity. */
  runtimeIdentity: IAutoMovieRepaintRuntimeIdentity;
  /** Non-negative metered cost in the unit declared by the execution policy. */
  costUnits?: number;
}>;
