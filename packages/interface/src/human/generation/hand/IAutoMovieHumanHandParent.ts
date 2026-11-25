import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSourceDefinition } from "../limb/IAutoMovieHumanSourceDefinition";

/**
 * The shared original hand-region field and restricted chart frames used by
 * digit attachments.
 *
 * The interface package owns these declarations; AutoMovieHumanHandParent in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHandParent {
  /**
   * One prepared original hand-region field shared by all five digits before
   * whole-arm demand.
   */
  export interface IOutput {
    /**
     * Only the legacy explicit-part adapter retains a completed original;
     * production controls leave this absent.
     */
    definition?: IAutoMovieHumanSourceDefinition;

    /**
     * Shared identity/frame/pole metadata; no neighbouring scalar curves or
     * completed part is acquired.
     */
    part: Pick<IAutoMovieViewPart, "name" | "axis" | "pole">;

    /** Complete original signed scalar/fullness owner, not emitted layers. */
    source: IAutoMovieLoftViewSource.ISource;

    /** Units and phase orientation shared by both original consumers. */
    coordinates: {
      /** Physical chart length unit. */
      length: "calibration-mm";

      /** Original material phase unit. */
      phase: "radians";

      /** Frame and normal vectors use unitless coordinates. */
      direction: "unitless";

      /** Positive material orientation in the local chart. */
      phaseDirection: "+u toward +v";
    };

    /** This original ViewPart producer has no relief or layer-lift input. */
    relief: "absent from original view definition";

    /**
     * Actual requested chart interval, calibration mm; the native scalar
     * coefficients keep their original global parameter.
     */
    domain: readonly [number, number];

    /**
     * Actual original frames only in this chart, reused to bracket its
     * normal-plane roots.
     */
    stations: {
      /** Original physical station, calibration mm. */
      station: number;

      /** Actual shared frame mapping at this station. */
      frame: Frame;

      /** Normal used only to bracket the original coordinate equation. */
      normal: AutoMovieVector3Tuple;
    }[];
  }

  /** Original normal-plane frame, before any skin or mesh. */
  export type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;
}
