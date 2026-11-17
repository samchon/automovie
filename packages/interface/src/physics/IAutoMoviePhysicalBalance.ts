import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Capture-point assessment and a possible generic support-step request.
 *
 * @evidence contracts/development/design.md#principled-representation Actual support patches form the horizontal convex hull; COM height and velocity predict a capture point independently of eventual contact outcomes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Generic endpoint ids and footfall policy select recovery without species-specific anatomy or native physics objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid finite state/limits throw; absent hull, insufficient remaining supports or unreachable travel can refuse recovery rather than fabricate a step.
 * @evidence contracts/development/common.md#meaningful-documentation Members define metres, acceleration/velocity units, margin admission, empty-hull Infinity and unavailable endpoint ownership.
 */
export namespace IAutoMoviePhysicalBalance {
  /**
     * Current resolved support points in world metres.
     *
     * @evidence contracts/development/design.md#principled-representation Contact-patch vertices determine support area while the endpoint position determines proposed recovery travel.
     * @evidence contracts/development/design.md#minimal-and-owned-surface The bone id links one actual patch and endpoint to the existing footfall pattern.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Patch vertices are observed contacts, not an invented standing footprint; input geometry is borrowed and must be admitted by its producer.
     * @evidence contracts/development/common.md#meaningful-documentation All positions are world metres; points and position serve distinct hull and endpoint roles.
     */
    export interface ISupport {
      
      /** Endpoint bone from the footfall pattern. */
      bone: string;
      
      /** Contact patch vertices, not an invented standing footprint. */
      points: IAutoMovieVector3[];
      
      /** Current endpoint world position. */
      position: IAutoMovieVector3;
    }

  /**
     * A prediction remains separate from the observed simulation outcome.
     *
     * @evidence contracts/development/design.md#principled-representation Prediction state, capture point and hull distance explain whether a reachable step is requested.
     * @evidence contracts/development/design.md#minimal-and-owned-surface A step exists only for the recovery branch; shared geometric facts remain available for supported and unrecoverable assessments.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Recovery is a proposed endpoint, never a receipt of successful landing; an empty hull retains infinite distance.
     * @evidence contracts/development/common.md#meaningful-documentation Members distinguish prediction from measured outcome and specify world metres, absent step and empty-hull behavior.
     */
    export interface IResult {
      
      /** Stable support, reachable recovery, or predicted loss of recovery. */
      state:
        | "supported"
        | "recovery"
        | "unrecoverable";
      
      /** Horizontal COM plus velocity/sqrt(g/height), world metres. */
      capturePoint: IAutoMovieVector3;
      
      /** Actual convex support hull. */
      polygon: IAutoMovieVector3[];
      
      /** Distance to the horizontal support hull in metres; zero inside, Infinity for no hull. */
      outside: number;
      
      /** Recovery request goes back to the step planner; absent otherwise. */
      step?: {
        
        /** Supported endpoint selected by shortest reachable travel, then footfall phase. */
        bone: string;
        
        /** Proposed support-point position in world metres on the floor plane. */
        target: IAutoMovieVector3;
      };
    }

  /**
   * Order reachable recovery supports by travel distance, then declared footfall phase.
   */
  export type IAssessInput = {
      
      /** Finite actual centre of mass in world metres. */
      center: IAutoMovieVector3;
      
      /** Finite actual COM velocity in world metres per second; vertical component is admitted but unused. */
      velocity: IAutoMovieVector3;
      
      /** Positive finite downward acceleration magnitude in metres per second squared. */
      gravity: number;
      
      /** Finite world support-plane height in metres; nonpositive COM height is unrecoverable. */
      floor: number;
      
      /** Borrowed actual support patches and endpoints; empty yields an unrecoverable result. */
      supports: IAutoMoviePhysicalBalance.ISupport[];
      
      /** Borrowed limb identities, tie-breaking phases and minimum remaining support count. */
      pattern: IAutoMovieFootfallPattern;
      
      /** Positive finite maximum horizontal endpoint travel in metres; invalid limits throw. */
      maximumStep: number;
      
      /** Finite nonnegative outside-hull distance still accepted as supported, in metres. */
      margin: number;
      
      /** Bone ids unavailable for a recovery request; their patches still contribute support. */
      unavailable: readonly string[];
    };
}
