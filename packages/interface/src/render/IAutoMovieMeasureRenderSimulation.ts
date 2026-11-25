import type { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";
import type { IAutoMovieRenderAnalysisGap } from "./IAutoMovieRenderAnalysisGap";
import type { IAutoMovieRenderOwnerCost } from "./IAutoMovieRenderOwnerCost";
import type { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Synchronous inventory extension for effects, cloth, planting and water.
 * Inputs carry the preceding population totals. No frame is simulated; missing
 * prototype or solver facts append gaps rather than certify complete totals.
 */
export namespace IAutoMovieMeasureRenderSimulation {
  /**
   * Extend prior counts with simulated drawable costs and explicit missing
   * inputs.
   */
  export type IProps = {
    /**
     * Borrowed effects and physical drawable declarations; no mutation or
     * stepping.
     */
    subject: IAutoMovieRenderSubject;
    /**
     * Triangle total from the population phase, copied into the local
     * accumulator.
     */
    triangles: number;
    /** Vertex total from the population phase. */
    vertices: number;
    /** Draw-submission total from the population phase. */
    drawCalls: number;
    /** Compact instance-slot total from the population phase. */
    instanceSlots: number;
    /** Prior simulated-node count, including compact formations. */
    simulatedNodes: number;
    /**
     * Caller-owned array appended with missing prototype and unsupported water
     * costs.
     */
    gaps: IAutoMovieRenderAnalysisGap[];
    /**
     * Append metric-unit costs by stable owner and editable source
     * synchronously. This phase omits kind. Errors propagate; prior sink
     * mutations are not undone. The inventory caller owns owner/source metric
     * accumulation; measureRenderSimulation invokes this synchronous sink and
     * propagates failures with prior effects intact.
     */
    add: (
      owner: string,
      source: string,
      metric: AutoMovieRenderMetric,
      cost: number,
      kind?: NonNullable<IAutoMovieRenderOwnerCost["kind"]>,
    ) => void;
    /**
     * Register a drawn material synchronously; null requests the default
     * material. Owner/source attribute use, and cited is diagnostic text.
     * Errors propagate; the callback is not retained after this inventory call.
     * The inventory caller owns material resolution and attribution;
     * measureRenderSimulation supplies borrowed material/owner/source
     * identities synchronously and retains no callback after the call.
     */
    cite: (
      material: string | null,
      owner: string,
      source: string,
      cited: string,
    ) => void;
  };

  /**
   * Extend prior counts with simulated drawable costs and explicit missing
   * inputs.
   */
  export type IResult = {
    /**
     * Prior triangles plus measurable drawable bounds; consult gaps for
     * completeness.
     */
    triangles: number;
    /**
     * Prior vertices plus measurable drawable bounds; missing planting costs
     * are absent.
     */
    vertices: number;
    /**
     * Prior draws plus nonempty simulated batches; no per-instance draw
     * multiplication.
     */
    drawCalls: number;
    /** Prior slots plus effect caps and planting batch instance bounds. */
    instanceSlots: number;
    /**
     * Prior nodes plus effects, cloth, planting and domain-bound water
     * drawables.
     */
    simulatedNodes: number;
    /**
     * Measurable drawable geometry buffer bytes added by this phase. Prototype
     * buffers count once per batch; instance streams and solver memory are
     * excluded.
     */
    simulatedBytes: number;
    /**
     * Sum of domain budgets or supplied solver cell counts for known water
     * bodies.
     */
    fluidCells: number;
    /**
     * Domain spray caps or supplied particle counts; a supplied null falls back
     * to zero.
     */
    fluidParticles: number;
    /**
     * New array of planting cluster ids missing a nonempty batch's prototype
     * cost.
     */
    unmeasured: string[];
    /** New array retaining water records with both domain and cell cost null. */
    unsolved: IAutoMovieRenderWaterBody[];
  };
}
