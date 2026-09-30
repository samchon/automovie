import { liftHumanBodySimpleAnatomicalTargets } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Simple physical targets become equal named detailed targets on both sides.
 * No legacy appearance morph or invented bone/fat volume enters the result.
 */
export const test_human_body_simple_anatomical_lift = (): void => {
  const minimal = liftHumanBodySimpleAnatomicalTargets({
    ageYears: 25,
    standingStatureMetres: 1.7,
    bodyMassKilograms: 60,
  });
  TestValidator.equals(
    "minimum physical scale, no fabricated detail",
    minimal,
    {
      age: { kind: "target", years: 25 },
      surface: {
        stature: { kind: "target", metres: 1.7 },
        mass: { kind: "target", kilograms: 60 },
      },
    },
  );
  const detailed = liftHumanBodySimpleAnatomicalTargets({
    ageYears: 30,
    standingStatureMetres: 1.8,
    bodyMassKilograms: 78,
    bustAtNippleLevelMetres: 0.98,
    waistAtRibIliacMidpointMetres: 0.78,
    buttockGirthMetres: 0.96,
    biacromialBreadthMetres: 0.41,
    pairedMidUpperArmGirthMetres: 0.31,
    pairedMidThighGirthMetres: 0.52,
    pairedMaximumCalfGirthMetres: 0.36,
  });
  TestValidator.equals(
    "bust and two distinct waist protocols stay named",
    detailed.surface.trunk,
    {
      bustGirth: { kind: "target", metres: 0.98 },
      ribIliacMidpointWaistGirth: { kind: "target", metres: 0.78 },
      buttockGirth: { kind: "target", metres: 0.96 },
      biacromialBreadth: { kind: "target", metres: 0.41 },
    },
  );
  TestValidator.equals(
    "symmetric requested arm girth",
    [
      detailed.surface.leftUpperLimb?.upperArm?.midUpperArmGirth?.metres,
      detailed.surface.rightUpperLimb?.upperArm?.midUpperArmGirth?.metres,
    ],
    [0.31, 0.31],
  );
  TestValidator.equals(
    "symmetric requested thigh and calf girths",
    [
      detailed.surface.leftLowerLimb?.thigh?.midThighGirth?.metres,
      detailed.surface.rightLowerLimb?.leg?.maximumCalfGirth?.metres,
    ],
    [0.52, 0.36],
  );
  TestValidator.predicate(
    "paired upper-arm records are independent",
    detailed.surface.leftUpperLimb !== detailed.surface.rightUpperLimb,
  );
  TestValidator.predicate(
    "paired lower-leg records are independent",
    detailed.surface.leftLowerLimb !== detailed.surface.rightLowerLimb,
  );
  TestValidator.predicate(
    "negative anatomical girth refuses",
    throwsError(() =>
      liftHumanBodySimpleAnatomicalTargets({
        ageYears: 25,
        standingStatureMetres: 1.7,
        bodyMassKilograms: 60,
        pairedMidThighGirthMetres: -0.5,
      }),
    ),
  );
  TestValidator.predicate(
    "legacy morph does not silently disappear",
    throwsError(() =>
      liftHumanBodySimpleAnatomicalTargets({
        ageYears: 25,
        standingStatureMetres: 1.7,
        bodyMassKilograms: 60,
        muscle: 1,
      } as never),
    ),
  );
};
