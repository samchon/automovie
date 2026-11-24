// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/estimator/
// footSwitch/QuadrupedWrenchBasedFootSwitch.java l.36 and hasFootHitGround
// l.48-54; its construction from QuadrupedFootSwitchFactory.java l.114-138.
// Not used: the default `TouchdownBased` switch of
// .../simulation/QuadrupedSimulationFactory.java l.480-482 and
// QuadrupedTouchdownDetectorBasedFootSwitch.java l.19 and l.68-80, with
// ForceBasedTouchDownDetection.java l.31. See NOTICE.

/**
 * IHMC's wrench-based quadruped foot switch, the `WrenchBased` variant the
 * 201903 simulation builds from its ground contact points
 * (QuadrupedFootSwitchFactory l.114-138): the foot has hit the ground when its
 * measured vertical force exceeds 4 % of the robot's weight in magnitude,
 * unfiltered (l.36 and l.52).
 *
 * The simulation's default is the touchdown-detector switch instead
 * (QuadrupedSimulationFactory l.480): a knee torque above 20 N m (l.482) and an
 * estimated vertical force above 40 N (`ForceBasedTouchDownDetection` l.31),
 * filtered over 10 queries. Those thresholds are absolute, set for the generic
 * quadruped's size; on a 78 N body a foot carries about 19.5 N in four-leg
 * stance and about 39 N in two-leg support, so 40 N would rarely or never
 * detect a touchdown. This variant's threshold is relative to the weight, so it
 * carries over to any body.
 *
 * @param input The foot's measured vertical contact force, newtons, the robot's
 *   total weight, newtons, and the threshold's share of it, the reference's by
 *   default.
 * @returns Whether the foot has hit the ground.
 */
export function physicalQuadrupedWrenchFootSwitch(input: {
  force: number;
  weight: number;
  share?: number;
}): boolean {
  return (
    Math.abs(input.force) >
    (input.share ?? physicalQuadrupedWrenchFootSwitch.SHARE) * input.weight
  );
}

/** The switch's threshold. */
export namespace physicalQuadrupedWrenchFootSwitch {
  /** The force threshold's share of the robot's weight (l.36). */
  export const SHARE: number = 0.04;
}
