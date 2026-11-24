// Ported from IHMC Open Robotics Software, tag 201903_Stable (Apache-2.0):
// ihmc-quadruped-robotics/src/main/java/us/ihmc/quadrupedRobotics/planning/
// trajectory/QuadrupedPiecewiseConstantCopTrajectory.java initializeTrajectory
// l.100-146; planning/QuadrupedCenterOfPressureTools.java computeCenterOfPressure
// l.21-35 and computeNominalNormalizedContactPressure l.91-144; the weight
// distribution from planning/trajectory/DCMPlanner.java l.77-78 and l.99-103.
// See NOTICE.
import { physicalQuadrupedContactSequence as Sequence } from "./physicalQuadrupedContactSequence";
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/**
 * IHMC's piecewise-constant centre of pressure over a contact sequence: one
 * point per phase, held from the phase's start
 * (`QuadrupedPiecewiseConstantCopTrajectory.initializeTrajectory`).
 *
 * Each phase's standing legs share its load: the front and hind ends each carry
 * half when both stand, and one end carries all otherwise, split evenly among
 * its standing legs (l.124-143). The reference shifts load forward by the
 * ground's pitch, but the DCM planner's default shift is zero (DCMPlanner
 * l.77), so the pitch fit (`PitchEstimator`) changes nothing and is not
 * computed. The point is the pressure-weighted mean of the soles over the total
 * pressure plus 1e-6 (l.25-34), so a phase with no leg standing lies at the
 * frame's origin, as the reference's does.
 *
 * @param phases The contact sequence (`physicalQuadrupedContactSequence`).
 * @returns One interval per phase, in order.
 * @throws {Error} When the sequence is empty, as the reference does
 *   (l.102-105).
 */
export function physicalQuadrupedCopTrajectory(
  phases: readonly Sequence.IPhase[],
): physicalQuadrupedCopTrajectory.IInterval[] {
  if (phases.length < 1)
    throw new Error(
      "Input contact sequence must have at least one time interval.",
    );
  return phases.map(
    (phase: Sequence.IPhase): physicalQuadrupedCopTrajectory.IInterval => {
      const pressure: Record<Step.Quadrant, number> = nominal(phase.contact);

      // The weighted mean, the sum starting from 1e-6 (l.25-34).
      let total: number = 1e-6;
      const cop: Step.IPoint = { x: 0, y: 0, z: 0 };
      for (const quadrant of Step.QUADRANTS) {
        const share: number = pressure[quadrant];
        const sole: Step.IPoint = phase.soles[quadrant];
        total += share;
        cop.x += share * sole.x;
        cop.y += share * sole.y;
        cop.z += share * sole.z;
      }
      return {
        start: phase.start,
        cop: {
          x: cop.x * (1 / total),
          y: cop.y * (1 / total),
          z: cop.z * (1 / total),
        },
      };
    },
  );
}

/** The trajectory's interval. */
export namespace physicalQuadrupedCopTrajectory {
  /** A phase's constant centre of pressure. */
  export interface IInterval {
    /** When the interval starts, seconds; it lasts to the next one's start. */
    start: number;

    /** The centre of pressure, metres. */
    cop: Step.IPoint;
  }
}

/**
 * The nominal normalized pressures with the default zero forward shift
 * (l.91-144): half per end when both ends stand, split evenly within an end.
 */
function nominal(
  contact: Readonly<Record<Step.Quadrant, boolean>>,
): Record<Step.Quadrant, number> {
  let fronts: number = 0;
  let hinds: number = 0;
  for (const quadrant of Step.QUADRANTS)
    if (contact[quadrant]) {
      if (Step.front(quadrant)) fronts++;
      else hinds++;
    }

  // The forward fraction is the default maximum shift, zero, times the
  // clamped pitch ratio (DCMPlanner l.77 and l.99-103).
  const fraction: number = 0.0;
  const both: boolean = fronts > 0 && hinds > 0;
  const forward: number = both ? 0.5 * fraction + 0.5 : 1.0;
  const rear: number = both ? 1.0 - forward : 1.0;
  const share: (quadrant: Step.Quadrant) => number = (
    quadrant: Step.Quadrant,
  ): number =>
    contact[quadrant]
      ? (Step.front(quadrant) ? forward : rear) /
        Math.max(Step.front(quadrant) ? fronts : hinds, 1.0)
      : 0.0;
  return {
    frontLeft: share("frontLeft"),
    frontRight: share("frontRight"),
    hindRight: share("hindRight"),
    hindLeft: share("hindLeft"),
  };
}
