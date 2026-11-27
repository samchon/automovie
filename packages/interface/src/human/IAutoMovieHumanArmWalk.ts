import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanSectionSite } from "./IAutoMovieHumanSectionSite";
import type { IAutoMovieHumanSiteControls } from "./IAutoMovieHumanSiteControls";
import type { IAutoMovieHumanArmBones } from "./IAutoMovieHumanArmBones";
import type { IAutoMovieHumanArmFrame } from "./IAutoMovieHumanArmFrame";
import type { IAutoMovieHumanArmHandControls } from "./IAutoMovieHumanArmHandControls";

/**
 * Type contracts exchanged by AutoMovieHumanArmWalk; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanArmWalk {
  /** Symmetric arms-down width and the independently placed GH, calibration mm. */
  export interface IMeasuring {
    /** Public maximum horizontal breadth in the deltoid region. */
    breadth: number;
    /** Absolute lateral GH coordinate in the neutral measuring convention. */
    lateral: number;
    /** Actual rigid GH-to-elbow length. */
    humerus: number;
  }

  /** One site's law: its name, place, box and owner. */
  export interface ISiteLaw {
    /** The measurement site, named in diagnostics. */
    site: string;

    /**
     * Bone: 1 the humerus, 2 the forearm, 3 the third metacarpal (0 is the run
     * inside the girdle).
     */
    bone: number;

    /** Share of the bone from its proximal centre. */
    share: number;

    /**
     * Signed edges [+u,+v,-u,-v] from the course axis, calibration mm. Base RMF
     * carries forward +u through WJC; an explicitly supplied hand target adds
     * the WJC-to-MCP3 material roll, making palm +u radial and +v its
     * palmar/dorsal short direction.
     */
    edges: [number, number, number, number];

    /** A tape solved on the box, or a sourced shoulder. */
    fullness: IAutoMovieHumanSectionSite["fullness"];
  }

  /**
   * Common original controls and the declared hand region; no completed arm is
   * retained.
   */
  export interface IPrepared extends IAutoMovieHumanSiteControls.IOutput {
    /**
     * Null controls preserve failure; a null hand chart means the caller
     * supplied no named wrist.
     */
    controls:
      | (IAutoMovieHumanSiteControls.IControls & {
          /**
           * Required physical chart for production hand contacts, without
           * refitting any global scalar.
           */
          hand: IHandChart | null;
        })
      | null;
  }

  /**
   * Physical hand chart on the common distal scalar law, beginning at its named
   * wrist tape.
   */
  export interface IHandChart {
    /** Actual wrist measurement station through the distal cap, calibration mm. */
    domain: readonly [number, number];

    /**
     * Only original hand-chart bracketing stations; no proximal-arm coordinates
     * are prepared.
     */
    stations: readonly number[];
  }

  /**
   * One invocation shares direct frame and local hand controls across both
   * original consumers.
   */
  export interface IShared {
    /** Bone-relative chart without section solves or part publication. */
    frame: IAutoMovieHumanArmFrame.IOutput;

    /** Local forearm-to-palm owner, independent of upper-arm measurements. */
    hand: IAutoMovieHumanArmHandControls.IOutput;
  }

  /**
   * The args argument of AutoMovieHumanArmWalk.define. Publish this actual arm
   * from its shared generating controls; callers needing the palm request
   * prepare directly.
   */
  export type DefineArgs = [
    name: string,
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">,
    knuckle: AutoMovieVector3Tuple,
    reach: number,
    sites: ISiteLaw[],
    joints: {
      /**
       * Full depth of the elbow, defining its C2 turning window along the arm,
       * millimetres.
       */
      elbow: number;
      /**
       * Full depth of the wrist, defining its C2 turning window along the arm,
       * millimetres.
       */
      wrist: number;
    },
    gap: number,
    crease?: AutoMovieVector3Tuple,
    radial?: AutoMovieVector3Tuple,
    measuring?: IMeasuring,
    connection?: IShared,
  ];
}
