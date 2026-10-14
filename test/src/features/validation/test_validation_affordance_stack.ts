import {
  type IAutoMovieSupportResult,
  affordanceSupportContacts,
  detectSupportToppling,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  namedFacts,
  validationHasNoWarnings,
  validationHasWarningCount,
  vclose,
} from "../internal/predicates";

const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
const UNIT: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Authored stack-top contacts support a placed crate's center of mass.
 *
 * Scenarios:
 * 1. A centered mass at (3,1,2) projects inside the unit-square top carried by a parent at (3,0,2), producing no warning or toppling.
 * 2. Moving that mass 0.7 metres along +X overhangs the half-metre edge and produces one physics warning with a +X fall direction.
 *
 * @evidence contracts/testing.md#behavioral-verification Converts an authored affordance face into support contacts and runs toppling admission, asserting both the stable result and the warning/fall direction for an overhang.
 * @evidence contracts/testing.md#independent-expectations The translated unit square spans X from 2.5 to 3.5 and Z from 1.5 to 2.5, so X=3 is inside and X=3.7 lies beyond its positive edge; these hand-defined positions supply the expectations.
 * @evidence contracts/testing.md#distinguishing-cases Keeps centered and overhung mass cases on the same support face, distinguishing warning-free stability from one directional toppling suggestion; support geometry tests own rotated contacts and malformed affordances.
 * @evidence contracts/testing.md#execution-ownership The exported validation unit entry owns both portable support/physics cases and calls engine source without an attachment application, renderer or native artifact.
 */
export function test_validation_affordance_stack(): void {
  const top: IAutoMovieAffordance = {
    id: "top",
    kind: "stack-top",
    frame: {
      translation: { x: 0, y: 0.5, z: 0 },
      rotation: IDENTITY,
      scale: UNIT,
    },
    extent: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const crateA: IAutoMovieTransform = {
    translation: { x: 3, y: 0, z: 2 },
    rotation: IDENTITY,
    scale: UNIT,
  };
  const support: IAutoMovieVector3[] = affordanceSupportContacts({
    affordance: top,
    parentWorld: crateA,
  });
  const stable: IAutoMovieSupportResult = detectSupportToppling({
    node: "crateB",
    centerOfMass: { x: 3, y: 1, z: 2 },
    support,
  });
  TestValidator.predicate(
    "no warning for a stable stack",
    validationHasNoWarnings("centered affordance stack", stable.validation),
  );
  TestValidator.equals("no toppling suggested", stable.toppling, null);
  const overhung: IAutoMovieSupportResult = detectSupportToppling({
    node: "crateB",
    centerOfMass: { x: 3.7, y: 1, z: 2 },
    support,
  });
  TestValidator.predicate(
    "overhang raises one physics warning",
    validationHasWarningCount(
      "overhung affordance stack",
      overhung.validation,
      1,
    ),
  );
  TestValidator.equals(
    "toppling falls toward the overhang (+X)",
    namedFacts([
      ["overhungToppling", (): boolean => overhung.toppling !== null],
      [
        "vcloseOverhungToppling",
        (): boolean =>
          overhung.toppling !== null &&
          vclose(overhung.toppling.fallDirection, { x: 1, y: 0, z: 0 }),
      ],
    ]),
    { overhungToppling: true, vcloseOverhungToppling: true },
  );
}
