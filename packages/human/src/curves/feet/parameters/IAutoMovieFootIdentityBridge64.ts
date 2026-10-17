import type { IAutoMovieCurve64 as C } from "@automovie/engine";

/** Physical measurements resolved before generating a bilateral rest-foot recipe. */
export namespace IAutoMovieFootIdentityBridge64 {
  /** Digit values in hallux-to-little-toe order, independent on each side. */
  export type Five = readonly [number, number, number, number, number];

  /**
   * Optional rest-form measurements in millimetres, with splay angles in radians.
   * Values control named physical traits, not points, normals or output controls.
   * Defaults are declared geometric conventions rather than clinical admission.
   *
   * @author Samchon
   */
  export interface Independent {
    /** Maximum transverse soft heel breadth. */
    heelBreadthMm: number;

    /** Positive posterior horizontal reach from the actual Foot joint to the heel. */
    heelBehindAnkleMm: number;

    /** Heel rear pole height above the explicit standing datum. */
    heelPadHeightMm: number;

    /** Dorsal height at the actual shared Toes fulcrum, above that datum. */
    ballHeightMm: number;

    /** Maximum dorsal instep height above the standing datum. */
    instepHeightMm: number;

    /** Medial plantar soft-arch rise, distinct from bony navicular height. */
    plantarArchHeightMm: number;

    /** Straight length in the foot plane from each nominal MTP row to its tip. */
    toeLengthMm: Five;

    /** Transverse soft breadth of each digit. */
    toeBreadthMm: Five;

    /** Dorsal-to-plantar soft thickness of each digit. */
    toeThicknessMm: Five;

    /** Proximal horizontal displacement from the shared Toes fulcrum per digit. */
    toeRootRetractionMm: Five;

    /** Rest splay from forward toward anatomical lateral, with magnitude below pi/4. */
    toeSplayRad: Five;

    /** Distal plantar pad elevation above the standing datum. */
    toePadHeightMm: number;

    /** Positive transverse gap between adjacent root bands. */
    webGapMm: number;
  }

  /**
   * Current-context measurements used to derive main rows, branches and toe rows.
   * World vectors are in millimetres; U/Y/W denote outward/up/forward foot axes.
   *
   * @author Samchon
   */
  export interface Resolved {
    /** Anatomical side; the proper Foot gauge and outward chirality remain separate. */
    side: "left" | "right";

    /** Resolved independent dimensions after applying explicit side overrides. */
    measurements: Independent;

    /** Actual joint centres queried through the current shared parent context. */
    joint: {
      /** Foot bone origin in world millimetres, not the canonical cut centre. */
      ankle: C.Vector;

      /** Shared Toes bone origin in world millimetres. */
      toes: C.Vector;
    };

    /** Current Foot +Y unit direction in world coordinates. */
    upAxisWorld: C.Vector;

    /** Unit direction toward Toes, projected perpendicular to Foot +Y. */
    forwardAxisWorld: C.Vector;

    /** Public heel-to-longest-tip extent. */
    footLengthMm: number;

    /** Public transverse ball breadth. */
    footBreadthMm: number;

    /** Negative posterior heel W relative to the current Foot joint. */
    heelW: number;

    /** Nominal per-digit root W, before adding the emitted root-section gap. */
    rootW: readonly number[];

    /** Per-digit forward root-to-tip extent after projecting rest splay. */
    projectedToeLengthMm: readonly number[];

    /** Per-digit lateral root centre U, including four intervening gaps. */
    toeCenterU: readonly number[];

    /** Main parent section W preceding every toe branch. */
    parentW: number;

    /** Positive forward scale reaching beyond the most anterior nominal root. */
    webReach: number;

    /** Minimum/maximum W of the actual lower ankle collar, from cubic extrema. */
    collarRangeW: readonly [number, number];

    /** Standing datum Y relative to Foot; transported with the current parent. */
    floorLocalY: number;

    /** Shared Toes origin elevation above that explicit datum. */
    toeJointHeightAboveFloorMm: number;
  }
}
