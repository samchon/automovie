import type {
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryChartSurface,
} from "..";

/**
 * A selected chart batch shares one boundary-network pass before fitting.
 * Independent fallback networks can preserve fitted siblings when the shared
 * network fails. Read each receipt's type and continuity qualification.
 */
export namespace IAutoMovieRecoveryChartBatch {
  /**
   * Lazily yields the local result for each selected chart. Keep the source
   * arrays and the common boundary owner available until iteration ends.
   */
  export type Operation = (input: IInput) => Generator<IResult, void, void>;

  /** The selected observations, shared boundary owner and fit policy. */
  export interface IInput {
    /** Source charts with millimetre positions and declared boundary ancestry. */
    charts: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]["charts"];

    /** Shared boundary registry used during this observation pass. */
    owner: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]["owner"];

    /** Fit policy applied to each chart after boundary registration. */
    fit: IFitPolicy;
  }

  /** Discrepancy and work limits shared by the chart fits. */
  export interface IFitPolicy {
    /** Positive finite positional discrepancy, in millimetres. */
    toleranceMm: number;

    /** Positive integer limit on fitted boundary spans. */
    maxSpans: number;

    /** Turning-angle threshold for preserving a corner, in degrees. */
    cornerDegrees: number;

    /** Positive integer limit on chart patches. */
    maxPatches: number;

    /** Positive integer limit on numerical iterations. */
    maxIterations: number;

    /** Maximum retained area-quadrature rows per fit. Defaults to 250,000. */
    maxObservationRows?: number;

    /**
     * Maximum residual refinement rounds after the initial fit. Defaults to
     * four.
     */
    maxRefinements?: number;

    /**
     * Nonnegative physical-gradient weight length in millimetres. Defaults to
     * zero.
     */
    physicalGradientLengthMm?: number;
  }

  /** The boundary and fit stage reached by one selected chart. */
  export type IResult = INetworkRefusal | IFitRefusal | IFitted;

  /** Boundary evidence retained alongside each chart outcome. */
  export interface IBoundaryEvidence {
    /** Stable chart name supplied by the caller. */
    name: string;

    /** Whether the shared boundary network succeeded for the selected batch. */
    sharedBoundaryQualified: boolean;

    /**
     * Largest measured displacement in the current boundary network, in
     * millimetres.
     */
    networkMaximumPointChangeMm: number;

    /** Shared boundary diagnostics observed as the batch is consumed. */
    diagnostics: string[];
  }

  /** The chart could not bind to a boundary network, even independently. */
  export interface INetworkRefusal extends IBoundaryEvidence {
    /** The boundary network never produced a chart. */
    type: "boundary-network-refused";

    /** There is no registered chart. */
    chart: null;

    /** Fitting did not start. */
    fit: null;

    /** Boundary admission failure. */
    reason: string;

    /** The shared network failed. */
    sharedBoundaryQualified: false;

    /** No displacement measurement was available for the failed chart. */
    networkMaximumPointChangeMm: 0;
  }

  /** The registered chart could not complete its local map or fit. */
  export interface IFitRefusal extends IBoundaryEvidence {
    /** The chart reached the local map and fit stage. */
    type: "chart-fit-refused";

    /** The boundary network's chart before local chord refinement. */
    chart: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>["charts"][number];

    /** No fit is available. */
    fit: null;

    /** Local chord-refinement, map or fit failure. */
    reason: string;
  }

  /** The registered chart returned its computed fit. */
  export interface IFitted extends IBoundaryEvidence {
    /** Local chord refinement, mapping and fitting produced a receipt. */
    type: "fitted";

    /** The chart with refined boundary chords and physical vertex keys. */
    chart: ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation>["charts"][number];

    /** Read the fit's own qualification and the boundary receipt independently. */
    fit: ReturnType<IAutoMovieRecoveryChartSurface.Fit>;

    /** No local failure prevented this fit receipt. */
    reason: null;
  }
}
