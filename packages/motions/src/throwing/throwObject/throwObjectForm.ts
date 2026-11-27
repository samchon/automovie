import type {
  IAutoMovieMotionHumanThrowObjectForm,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The throw's form: every coefficient of its launch, its clock, its trunk and
 * its hand's places by style, each with its source or marked provisional where
 * no study read gives the value. Read by `throwObject`.
 *
 * Rugby uses the side-to-side reactive releases assessed by Pavely et al. (PMID
 * 19897167). Gridiron delivery uses the shoulder loading and torso reversal
 * phases in PMID 40719675 (PMCID PMC12317801). The grounded snap is released
 * between the centre's legs toward the quarterback. Sport coefficients are
 * provisional staging values.
 */
export namespace throwObjectForm {
  /** Release angle above the horizontal by style, degrees (provisional). */
  export const ANGLE: Readonly<
    Record<IAutoMovieMotionHumanThrowObjectForm.Style, number>
  > = {
    overarm: 20,
    underarm: 40,
    toss: 50,
    windmill: 2,
    cricket: -4,
    bowling: -1,
    rugby: 18,
    gridironPass: 17,
    gridironSnap: 22,
  };

  /**
   * Seconds before and after the release through which the hand holds the
   * launch velocity (provisional).
   */
  export const CARRY: number = 0.01;

  /** Windup seconds by style (provisional). */
  export const WINDUP: Readonly<
    Record<IAutoMovieMotionHumanThrowObjectForm.Style, number>
  > = {
    overarm: 0.5,
    underarm: 0.45,
    toss: 0.35,
    windmill: 0.64,
    cricket: 0.42,
    bowling: 0.58,
    rugby: 0.3,
    gridironPass: 0.45,
    gridironSnap: 0.24,
  };

  /**
   * The trunk's turn toward the throwing side in the windup, degrees
   * (provisional).
   */
  export const TURN: Readonly<
    Record<IAutoMovieMotionHumanThrowObjectForm.Style, number>
  > = {
    overarm: 40,
    underarm: 20,
    toss: 10,
    windmill: 31,
    cricket: 30,
    bowling: 19,
    rugby: 30,
    gridironPass: 35,
    gridironSnap: 0,
  };

  /**
   * The trunk's forward inclination at release by style, degrees: about 30
   * degrees in the overarm throw (Fleisig, Barrentine, Zheng, Escamilla and
   * Andrews 1999, J Biomech 32:1371). No study read gives the underarm throw's
   * or the toss's, so they stay upright (provisional).
   */
  export const TILT: Readonly<
    Record<IAutoMovieMotionHumanThrowObjectForm.Style, number>
  > = {
    overarm: 30,
    underarm: 0,
    toss: 0,
    windmill: 7,
    cricket: 21,
    bowling: 39,
    rugby: 6,
    gridironPass: 12,
    gridironSnap: 52,
  };

  /**
   * The throwing elbow's flexion at release by style, degrees, where a study
   * gives it: about 20 to 25 degrees in the overarm throw, so the middle of
   * that range (Fleisig et al. 1999). A style without one keeps its `PLACES`
   * release.
   */
  export const ELBOW: Readonly<
    Partial<Record<IAutoMovieMotionHumanThrowObjectForm.Style, number>>
  > = {
    overarm: 22.5,
    gridironPass: 35,
  };

  /**
   * The hand's grip places around the throwing shoulder, in arm lengths of the
   * performer's floor frame: `x` toward the throwing side, `y` up, `z` forward
   * (provisional). The chamber and the finish are read from the standing
   * shoulder; the release from the shoulder of the trunk's release pose, and
   * for a style with an `ELBOW` only its direction is read, its distance being
   * the arm's at that flexion.
   */
  export const PLACES: Readonly<
    Record<
      IAutoMovieMotionHumanThrowObjectForm.Style,
      Record<EntryEntryItem, IAutoMovieVector3>
    >
  > = {
    overarm: {
      chamber: { x: 0.35, y: 0.25, z: -0.6 },
      release: { x: 0.2, y: 0.35, z: 0.35 },
      finish: { x: -0.5, y: -0.7, z: 0.4 },
    },
    underarm: {
      chamber: { x: 0.3, y: -0.9, z: -0.55 },
      release: { x: 0.15, y: -0.65, z: 0.55 },
      finish: { x: 0.1, y: 0.1, z: 0.6 },
    },
    toss: {
      chamber: { x: 0.2, y: -0.75, z: -0.1 },
      release: { x: 0.1, y: -0.4, z: 0.55 },
      finish: { x: 0.05, y: -0.2, z: 0.6 },
    },
    // Provisional landmarks in arm lengths. The windmill's chamber ends
    // the arm circle and its release runs close to the throwing hip.
    windmill: {
      chamber: { x: 0.26, y: -0.82, z: -0.16 },
      release: { x: 0.22, y: -0.89, z: 0.18 },
      finish: { x: 0.25, y: -0.05, z: 0.77 },
    },
    cricket: {
      chamber: { x: 0.29, y: -0.32, z: -0.76 },
      release: { x: 0.06, y: 0.91, z: 0.13 },
      finish: { x: -0.38, y: -0.71, z: 0.36 },
    },
    bowling: {
      chamber: { x: 0.23, y: -0.5, z: -0.79 },
      release: { x: 0.13, y: -0.94, z: 0.12 },
      finish: { x: 0.23, y: -0.3, z: 0.79 },
    },
    rugby: {
      chamber: { x: -0.1, y: -0.58, z: 0.38 },
      release: { x: -0.85, y: -0.38, z: 0.24 },
      finish: { x: -1.05, y: -0.35, z: 0.2 },
    },
    gridironPass: {
      chamber: { x: 0.4, y: 0.38, z: -0.42 },
      release: { x: 0.15, y: 0.55, z: 0.43 },
      finish: { x: -0.36, y: -0.42, z: 0.52 },
    },
    gridironSnap: {
      chamber: { x: -0.28, y: -0.73, z: 0.29 },
      release: { x: -0.28, y: -0.45, z: -0.76 },
      finish: { x: -0.18, y: -0.52, z: -0.45 },
    },
  };
}

/** The alternatives of `EntryEntryItem`'s site. */
type EntryEntryItem = "chamber" | "release" | "finish";
