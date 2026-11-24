// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-robotics-toolkit/src/main/java/us/ihmc/robotics/robotSide/
// RobotQuadrant.java l.12-18, l.148-177, l.418-436 and l.448-508;
// ihmc-quadruped-basics/src/main/java/us/ihmc/
// quadrupedBasics/gait/QuadrupedTimedStep.java l.11-13; ihmc-quadruped-basics/
// .../supportPolygon/QuadrupedSupportPolygon.java
// getCentroidAveragingLowestZHeightsAcrossEnds l.456-510 and getNominalYaw
// l.785-814; ihmc-quadruped-basics/.../referenceFrames/
// QuadrupedReferenceFrames.java l.259-266 and l.416-425. See NOTICE.

/**
 * The quadruped port's shared vocabulary: IHMC's four quadrants and their gait
 * order, the timed step its planners exchange, and the support frame its
 * controllers centre on.
 *
 * Points are in IHMC's z-up world frame, metres: x and y horizontal, z up.
 * automovie's y-up frame maps onto it as (x, y, z) = (Z, X, Y), a proper
 * rotation taking automovie's forward, left and up to IHMC's.
 */
export namespace physicalQuadrupedStep {
  /** A leg, named as IHMC's `RobotQuadrant.getCamelCaseName`. */
  export type Quadrant = "frontLeft" | "frontRight" | "hindRight" | "hindLeft";

  /**
   * The quadrants in `RobotQuadrant.values` order (l.12-18), which every
   * per-leg loop of the port follows, as sums and ties depend on it.
   */
  export const QUADRANTS: readonly Quadrant[] = [
    "frontLeft",
    "frontRight",
    "hindRight",
    "hindLeft",
  ];

  /** A point or vector in IHMC's z-up world frame, metres. */
  export interface IPoint {
    /** Horizontal. */
    x: number;

    /** Horizontal, 90 degrees counter-clockwise of x seen from above. */
    y: number;

    /** Up. */
    z: number;
  }

  /**
   * A step of IHMC's `QuadrupedTimedStep`: the leg, where it lands, how high it
   * clears the ground, and its swing's time interval.
   */
  export interface IStep {
    /** The swinging leg. */
    quadrant: Quadrant;

    /** The touchdown position, metres. */
    goal: IPoint;

    /** The swing's clearance over the ground, metres. */
    groundClearance: number;

    /** Lift-off, seconds on the controller's clock. */
    start: number;

    /** Touchdown, seconds on the controller's clock, at or after `start`. */
    end: number;
  }

  /** A z-up frame: an origin and a heading about z. */
  export interface IPose {
    /** The origin, metres. */
    position: IPoint;

    /** The heading, radians counter-clockwise from x about z. */
    yaw: number;
  }

  /**
   * Whether a leg is a front one (`RobotQuadrant.isQuadrantInFront`,
   * l.428-431).
   *
   * @param quadrant The leg.
   * @returns True for the front legs.
   */
  export function front(quadrant: Quadrant): boolean {
    return quadrant === "frontLeft" || quadrant === "frontRight";
  }

  /**
   * Whether a leg is a left one (`RobotQuadrant.isQuadrantOnLeftSide`,
   * l.418-421).
   *
   * @param quadrant The leg.
   * @returns True for the left legs.
   */
  export function left(quadrant: Quadrant): boolean {
    return quadrant === "frontLeft" || quadrant === "hindLeft";
  }

  /**
   * The leg across the body on the same end (`getAcrossBodyQuadrant`,
   * l.148-177).
   *
   * @param quadrant The leg.
   * @returns The other leg of its end.
   */
  export function across(quadrant: Quadrant): Quadrant {
    return ACROSS[quadrant];
  }

  /**
   * The leg that swings after this one in IHMC's regular gait, front left, hind
   * right, front right, hind left (`getNextRegularGaitSwingQuadrant`,
   * l.448-477).
   *
   * @param quadrant The leg.
   * @returns The next leg to swing.
   */
  export function next(quadrant: Quadrant): Quadrant {
    return NEXT[quadrant];
  }

  /**
   * The leg that swings before this one in the regular gait, the inverse of
   * {@link next} (`getNextReversedRegularGaitSwingQuadrant`, l.479-508).
   *
   * @param quadrant The leg.
   * @returns The previous leg to swing.
   */
  export function previous(quadrant: Quadrant): Quadrant {
    return PREVIOUS[quadrant];
  }

  /**
   * The support frame IHMC's quadruped controllers centre on,
   * `getCenterOfFeetZUpFrameAveragingLowestZHeightsAcrossEnds` (l.416-425): the
   * mean of the four soles, its height the mean of the lowest front and the
   * lowest hind sole (l.456-510), headed along the summed front-to-hind vectors
   * of the two sides (l.785-814).
   *
   * The reference skips the frame's update when a value is not finite
   * (l.259-266); this returns the values as computed, so a caller keeping the
   * last frame does the same.
   *
   * @param soles The four sole positions, contact or not, as the reference uses
   *   all four (l.269-283).
   * @returns The frame.
   */
  export function support(soles: Readonly<Record<Quadrant, IPoint>>): IPose {
    let x: number = 0;
    let y: number = 0;
    let frontZ: number = Number.MAX_VALUE;
    let hindZ: number = Number.MAX_VALUE;
    for (const quadrant of QUADRANTS) {
      const sole: IPoint = soles[quadrant];
      x += sole.x;
      y += sole.y;
      if (front(quadrant)) frontZ = Math.min(frontZ, sole.z);
      else hindZ = Math.min(hindZ, sole.z);
    }

    // The heading sums the left and right front-minus-hind vectors (l.792-808).
    const dx: number =
      soles.frontLeft.x -
      soles.hindLeft.x +
      (soles.frontRight.x - soles.hindRight.x);
    const dy: number =
      soles.frontLeft.y -
      soles.hindLeft.y +
      (soles.frontRight.y - soles.hindRight.y);
    return {
      position: { x: x / 4, y: y / 4, z: (hindZ + frontZ) / 2 },
      yaw: Math.atan2(dy, dx),
    };
  }

  const ACROSS: Readonly<Record<Quadrant, Quadrant>> = {
    frontLeft: "frontRight",
    frontRight: "frontLeft",
    hindRight: "hindLeft",
    hindLeft: "hindRight",
  };

  const NEXT: Readonly<Record<Quadrant, Quadrant>> = {
    frontLeft: "hindRight",
    frontRight: "hindLeft",
    hindRight: "frontRight",
    hindLeft: "frontLeft",
  };

  const PREVIOUS: Readonly<Record<Quadrant, Quadrant>> = {
    frontLeft: "hindLeft",
    frontRight: "hindRight",
    hindRight: "frontLeft",
    hindLeft: "frontRight",
  };
}
