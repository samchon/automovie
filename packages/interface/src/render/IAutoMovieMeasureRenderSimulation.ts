import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import type { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import type { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Synchronous inventory extension for effects, cloth, planting and water.
 * Inputs carry the preceding population totals. No frame is simulated; missing
 * prototype or solver facts append gaps rather than certify complete totals.
 *
 * @evidence contracts/development/design.md#principled-representation Keep cumulative drawable counts separate from simulation storage and explicit missing-cost lists; declared domain budgets supply the bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller owns material resolution and gap/owner rows; this phase exposes plain counts and borrowed water records without simulation handles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing planting prototypes and solver facts remain visible gaps; returned partial numbers alone cannot certify the final metrics.
 * @evidence contracts/development/common.md#meaningful-documentation Members state accumulator scope, byte exclusions, null-cost fallback, collection mutation and synchronous callback lifetime.
 */
export namespace IAutoMovieMeasureRenderSimulation {
  /**
   * Extend prior counts with simulated drawable costs and explicit missing inputs.
   *
   * @evidence contracts/development/design.md#principled-representation Prior population counts combine with effect, cloth, planting and water declarations; result counters separate drawable bytes, cells, particles and explicit missing-input lists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureRenderSimulation extends inventory through the existing subject, gap and owner-cost contracts and caller material resolver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unmeasured prototypes and unsupported solver costs remain gaps; null particle cost falls back to zero without making missing cell cost known.
   * @evidence contracts/development/common.md#meaningful-documentation Documents accumulator scope, callbacks, byte exclusions and missing-cost arrays.
   */
  export type IProps = {
    /** Borrowed effects and physical drawable declarations; no mutation or stepping. */
    subject: IAutoMovieRenderSubject;
    /** Triangle total from the population phase, copied into the local accumulator. */
    triangles: number;
    /** Vertex total from the population phase. */
    vertices: number;
    /** Draw-submission total from the population phase. */
    drawCalls: number;
    /** Compact instance-slot total from the population phase. */
    instanceSlots: number;
    /** Prior simulated-node count, including compact formations. */
    simulatedNodes: number;
    /** Caller-owned array appended with missing prototype and unsupported water costs. */
    gaps: IAutoMovieRenderAnalysisGap[];
    /**
     * Append metric-unit costs by stable owner and editable source synchronously.
     * This phase omits kind. Errors propagate; prior sink mutations are not undone.
     * The inventory caller owns owner/source metric accumulation; measureRenderSimulation invokes this synchronous sink and propagates failures with prior effects intact.
     */
    add: (
      owner: string,
      source: string,
      metric: AutoMovieRenderMetric,
      cost: number,
      kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
    ) => void;
    /**
     * Register a drawn material synchronously; null requests the default material.
     * Owner/source attribute use, and cited is diagnostic text. Errors propagate;
     * the callback is not retained after this inventory call.
     * The inventory caller owns material resolution and attribution; measureRenderSimulation supplies borrowed material/owner/source identities synchronously and retains no callback after the call.
     */
    cite: (
      material: string | null,
      owner: string,
      source: string,
      cited: string,
    ) => void;
  };

  /**
   * Extend prior counts with simulated drawable costs and explicit missing inputs.
   *
   * @evidence contracts/development/design.md#principled-representation Prior population counts combine with effect, cloth, planting and water declarations; result counters separate drawable bytes, cells, particles and explicit missing-input lists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measureRenderSimulation extends inventory through the existing subject, gap and owner-cost contracts and caller material resolver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unmeasured prototypes and unsupported solver costs remain gaps; null particle cost falls back to zero without making missing cell cost known.
   * @evidence contracts/development/common.md#meaningful-documentation Documents accumulator scope, callbacks, byte exclusions and missing-cost arrays.
   */
  export type IResult = {
    /** Prior triangles plus measurable drawable bounds; consult gaps for completeness. */
    triangles: number;
    /** Prior vertices plus measurable drawable bounds; missing planting costs are absent. */
    vertices: number;
    /** Prior draws plus nonempty simulated batches; no per-instance draw multiplication. */
    drawCalls: number;
    /** Prior slots plus effect caps and planting batch instance bounds. */
    instanceSlots: number;
    /** Prior nodes plus effects, cloth, planting and domain-bound water drawables. */
    simulatedNodes: number;
    /**
     * Measurable drawable geometry buffer bytes added by this phase. Prototype
     * buffers count once per batch; instance streams and solver memory are excluded.
     */
    simulatedBytes: number;
    /** Sum of domain budgets or supplied solver cell counts for known water bodies. */
    fluidCells: number;
    /** Domain spray caps or supplied particle counts; a supplied null falls back to zero. */
    fluidParticles: number;
    /** New array of planting cluster ids missing a nonempty batch's prototype cost. */
    unmeasured: string[];
    /** New array retaining water records with both domain and cell cost null. */
    unsolved: IAutoMovieRenderWaterBody[];
  };
}
