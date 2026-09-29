import typia from "typia";

import { admitHumanBodyAnatomicalMeasurements } from "./admitHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyCompleteAnatomicalMeasurements } from "./IAutoMovieHumanBodyCompleteAnatomicalMeasurements";
import type { IAutoMovieHumanBodySimpleAnatomicalTargets } from "./IAutoMovieHumanBodySimpleAnatomicalTargets";
import type { IAutoMovieHumanBodyTrunkSurfaceMeasurements } from "../surface/IAutoMovieHumanBodyTrunkSurfaceMeasurements";
import type { IAutoMovieHumanBodyLowerLimbSurfaceMeasurements } from "../surface/IAutoMovieHumanBodyLowerLimbSurfaceMeasurements";

/**
 * Lift the simple tier's explicit physical targets into the detailed tree.
 *
 * Each field keeps exactly the same clinical landmark and unit. A paired
 * limb target becomes independent equal left/right values, permitting later
 * anatomical asymmetry without aliasing mutable object references. This
 * operation infers no unmeasured bone, muscle, fat depot or skin vertex; a
 * validated population generator must resolve those separately. It refuses
 * unknown legacy morph keys and nonphysical scalars instead of dropping them.
 * @author Samchon
 */
export function liftHumanBodySimpleAnatomicalTargets(
  input: IAutoMovieHumanBodySimpleAnatomicalTargets,
): IAutoMovieHumanBodyCompleteAnatomicalMeasurements {
  const simple = typia.assertEquals<IAutoMovieHumanBodySimpleAnatomicalTargets>(input);
  const length = (metres: number) => ({ kind: "target" as const, metres });
  let trunk: IAutoMovieHumanBodyTrunkSurfaceMeasurements | undefined;
  if (simple.bustAtNippleLevelMetres !== undefined)
    trunk = { bustGirth: length(simple.bustAtNippleLevelMetres) };
  if (simple.waistAtRibIliacMidpointMetres !== undefined)
    trunk = { ...trunk, ribIliacMidpointWaistGirth: length(simple.waistAtRibIliacMidpointMetres) };
  if (simple.buttockGirthMetres !== undefined)
    trunk = { ...trunk, buttockGirth: length(simple.buttockGirthMetres) };
  if (simple.biacromialBreadthMetres !== undefined)
    trunk = { ...trunk, biacromialBreadth: length(simple.biacromialBreadthMetres) };
  const upperLimb = (metres: number) => ({ upperArm: { midUpperArmGirth: length(metres) } });
  const lowerLimb = (): IAutoMovieHumanBodyLowerLimbSurfaceMeasurements | undefined => {
    let limb: IAutoMovieHumanBodyLowerLimbSurfaceMeasurements | undefined;
    if (simple.pairedMidThighGirthMetres !== undefined)
      limb = { thigh: { midThighGirth: length(simple.pairedMidThighGirthMetres) } };
    if (simple.pairedMaximumCalfGirthMetres !== undefined)
      limb = { ...limb, leg: { maximumCalfGirth: length(simple.pairedMaximumCalfGirthMetres) } };
    return limb;
  };
  const leftLowerLimb = lowerLimb();
  const rightLowerLimb = lowerLimb();
  const detailed = {
    age: { kind: "target" as const, years: simple.ageYears },
    surface: {
      stature: length(simple.standingStatureMetres),
      mass: { kind: "target" as const, kilograms: simple.bodyMassKilograms },
      ...(trunk === undefined ? {} : { trunk }),
      ...(simple.pairedMidUpperArmGirthMetres === undefined ? {} : {
        leftUpperLimb: upperLimb(simple.pairedMidUpperArmGirthMetres),
        rightUpperLimb: upperLimb(simple.pairedMidUpperArmGirthMetres),
      }),
      ...(leftLowerLimb === undefined || rightLowerLimb === undefined ? {} : {
        leftLowerLimb,
        rightLowerLimb,
      }),
    },
  } satisfies IAutoMovieHumanBodyCompleteAnatomicalMeasurements;
  admitHumanBodyAnatomicalMeasurements(detailed);
  return detailed;
}
