import type { AutoMovieInspectionShade } from "@automovie/interface";

/** A host's request for a render operation or its observed completion. */
export type IAutoMovieRenderDrawActivity =
  | IAutoMovieRenderDrawActivity.IRequested
  | IAutoMovieRenderDrawActivity.IAcknowledged;

export namespace IAutoMovieRenderDrawActivity {
  /** The host is about to start the named operation. */
  export interface IRequested extends IOperation {
    type: "requested";
  }

  /** The named operation completed successfully in the host. */
  export interface IAcknowledged extends IOperation {
    type: "acknowledged";

    /** Elapsed host time in milliseconds for the completed operation. */
    elapsedMilliseconds: number;
  }

  /** The stage and any context available to the host that owns it. */
  export interface IOperation {
    /** The operation visible at the host boundary. */
    stage:
      | "mount"
      | "navigate"
      | "wait-for-draw"
      | "describe"
      | "speak"
      | "prepare-render"
      | "draw-frame"
      | "draw-pass"
      | "write-frame"
      | "encode"
      | "audit"
      | "publish";

    /** The zero-based output frame, when the operation knows the frame grid. */
    frame?: number;

    /** Total native output frames, when the rendering plan is available. */
    frameCount?: number;

    /** The requested film time in seconds for a frame or pass. */
    seconds?: number;

    /** The requested pass for an individual draw call. */
    pass?: AutoMovieInspectionShade;

    /** The applied per-operation deadline in milliseconds, when known. */
    budgetMilliseconds?: number;
  }
}
