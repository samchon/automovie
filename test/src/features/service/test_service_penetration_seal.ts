import { validateServiceNetwork } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieConstraintViolation,
  IAutoMovieServiceNetwork,
  IAutoMovieServicePenetration,
  IAutoMovieServiceSegment,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  hasViolation,
  namedFacts,
  nclose,
  validationHasWarning,
  validationHasWarningCount,
  violationCount,
} from "../internal/predicates";
import {
  serviceEnvironment,
  serviceNetwork,
  sleeve,
  withSegment,
  withSleeve,
} from "../internal/serviceFixtures";

const environment: IAutoMovieBuiltEnvironment = serviceEnvironment();
const refuse: (network?: IAutoMovieServiceNetwork) => IAutoMovieValidation = (
  network: IAutoMovieServiceNetwork = serviceNetwork(),
): IAutoMovieValidation => validateServiceNetwork({ network, environment });

/** The same building with every room reduced to a name and no volume. */
const semantic: () => IAutoMovieBuiltEnvironment =
  (): IAutoMovieBuiltEnvironment => {
    const built: IAutoMovieBuiltEnvironment = serviceEnvironment();
    return {
      ...built,
      spaces: built.spaces.map(
        (space: IAutoMovieBuiltSpace): IAutoMovieBuiltSpace => ({
          ...space,
          cells: [],
        }),
      ),
    };
  };

/**
 * A run that leaves the room it started in has been through a wall, and the
 * record has to say so.
 *
 * Crossing detection reads logical spaces separately from optional boundary
 * faces. Changed room membership between consecutive centre-line vertices
 * requires a sleeve on a boundary of one of those rooms. That membership
 * comparison uses declared space volumes and remains silent where none exist;
 * a purely semantic
 * partition is a name on a plan, not a wall anybody drilled. Vertex sampling
 * does not independently detect crossings between equal-membership endpoints.
 *
 * The sleeve then answers for itself. It must be wide enough for what passes
 * through it, it must sit on the run that claims it, it must belong to a
 * boundary that exists, and where it cites a declared opening that opening must
 * be cut through the same boundary. A sleeve through waterproofing must be made
 * good, which is the one place this file and the wet zones meet.
 *
 * Scenarios:
 *
 * 1. A run stripped of its sleeves is refused for the crossing it makes, and the
 *    now-unused sleeves are reported as unused rather than silently forgiven.
 * 2. An extra sleeve nobody runs through is advice, not a failure: validation
 *    succeeds carrying exactly one warning.
 * 3. A sleeve narrower than the run through it is refused with the measured
 *    overshoot; one wide enough is not.
 * 4. A sleeve that does not sit on the run citing it is refused.
 * 5. A run citing an unknown sleeve, and one citing the same sleeve twice, are
 *    each refused on the citation rather than on the sleeve.
 * 6. A sleeve on a boundary that does not resolve is refused, and its crossing is
 *    still covered by the run's other sleeve rather than double-reported.
 * 7. The opening seam holds in both directions: an unknown opening and an opening
 *    cut through a different boundary are refused, while the fixture's chase is
 *    accepted.
 * 8. A sleeve through a waterproofed boundary must be sealed; the same sleeve
 *    through an untanked boundary need not be, which the clean fixture already
 *    carries unsealed.
 * 9. Where no space declares a volume, no crossing can be read and none is
 *    invented.
 * 10. Now that a boundary can carry a face, a sleeve is held on it: off the
 *     separation's own thickness, wider than the face it pierces, or outside
 *     the void it claims to pass through, each refused. A boundary with no face
 *     and an opening with no profile are skipped rather than guessed at.
 *
 * @evidence contracts/testing.md#behavioral-verification Validates actual crossing, sleeve citation, radius/route fit, opening/boundary and waterproof-seal decisions; reads exact authored finding paths, selected counts, warnings and metre overshoots to catch dropped or duplicate diagnoses.
 * @evidence contracts/testing.md#independent-expectations Authored references and tanking membership define citation/seal obligations, while 0.025-0.01 metre radius and 0.5-0.1 metre face-offset differences pin overshoots independently. Typed fixtures do not independently prove continuous crossing geometry, exact circular corner fit or built waterproof performance.
 * @evidence contracts/testing.md#distinguishing-cases Covers missing/unused/unknown/duplicate sleeves, narrow/adrift penetrations, missing/wrong openings and boundaries, sealed/untanked twins, off-face/oversized/off-void placements and absent face/profile/space volumes. Successful skipped checks are admission only; exact warning counts are separately asserted where owned.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit calls maintained portable Engine validation with the existing service fixture and local record mutations, owning all cases without a browser, renderer, process, native artifact or dynamic registration.
 */
export function test_service_penetration_seal(): void {
  const clean: IAutoMovieServiceNetwork = serviceNetwork();

  const bare: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        penetrations: [],
      }),
    ),
  );
  TestValidator.equals(
    "a run that leaves its room without a sleeve is refused",
    namedFacts([
      [
        "crossing",
        (): boolean =>
          hasViolation(bare, "type", "$input.segments[0].penetrations"),
      ],
      [
        "message",
        (): boolean =>
          bare.success === false &&
          bare.violations.some((item: IAutoMovieConstraintViolation): boolean =>
            item.expected.includes("crossing between logical spaces"),
          ),
      ],
      [
        "orphanedPlantSleeve",
        (): boolean => hasViolation(bare, "coverage", "$input.penetrations[0]"),
      ],
      [
        "orphanedBathSleeve",
        (): boolean => hasViolation(bare, "coverage", "$input.penetrations[1]"),
      ],
      ["exactly", (): boolean => violationCount(bare) === 3],
    ]),
    {
      crossing: true,
      message: true,
      orphanedPlantSleeve: true,
      orphanedBathSleeve: true,
      exactly: true,
    },
  );

  const spare: IAutoMovieValidation = validateServiceNetwork({
    network: {
      ...clean,
      penetrations: [
        ...clean.penetrations,
        sleeve({
          id: "spare",
          boundary: "hall-plant",
          position: { x: 7, y: 1, z: 2 },
        }),
      ],
    },
    environment,
  });
  TestValidator.equals(
    "a sleeve nobody runs through is advice, not a failure",
    namedFacts([
      [
        "warned",
        (): boolean =>
          validationHasWarning(
            "spare sleeve",
            spare,
            "coverage",
            "$input.penetrations[13]",
          ),
      ],
      [
        "onlyWarning",
        (): boolean => validationHasWarningCount("spare sleeve", spare, 1),
      ],
    ]),
    { warned: true, onlyWarning: true },
  );

  const tight: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        radius: 0.01,
      }),
    ),
  );
  TestValidator.equals(
    "a run does not pass through a sleeve narrower than itself",
    namedFacts([
      [
        "refused",
        (): boolean =>
          hasViolation(tight, "range", "$input.segments[0].radius"),
      ],
      [
        "overshoot",
        (): boolean =>
          tight.success === false &&
          tight.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.015, 1e-12),
          ),
      ],
      ["alone", (): boolean => violationCount(tight) === 1],
    ]),
    { refused: true, overshoot: true, alone: true },
  );

  const adrift: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        position: { x: 4, y: 1, z: 1 },
      }),
    ),
  );
  const unknown: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        penetrations: ["ghost", "cold-plant-hall", "cold-bath-hall"],
      }),
    ),
  );
  const twice: IAutoMovieValidation = refuse(
    withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        penetrations: ["cold-plant-hall", "cold-plant-hall", "cold-bath-hall"],
      }),
    ),
  );
  TestValidator.equals(
    "a citation is checked as a citation, not as the sleeve it names",
    namedFacts([
      [
        "adrift",
        (): boolean =>
          hasViolation(adrift, "range", "$input.segments[0].penetrations[1]") &&
          violationCount(adrift) === 1,
      ],
      [
        "unknown",
        (): boolean =>
          hasViolation(unknown, "type", "$input.segments[0].penetrations[0]") &&
          violationCount(unknown) === 1,
      ],
      [
        "twice",
        (): boolean =>
          hasViolation(twice, "type", "$input.segments[0].penetrations[1]") &&
          violationCount(twice) === 1,
      ],
    ]),
    { adrift: true, unknown: true, twice: true },
  );

  const homeless: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        boundary: "nowhere",
      }),
    ),
  );
  TestValidator.equals(
    "a sleeve on a boundary that does not exist is refused exactly once",
    namedFacts([
      [
        "refused",
        (): boolean =>
          hasViolation(homeless, "type", "$input.penetrations[1].boundary"),
      ],
      ["alone", (): boolean => violationCount(homeless) === 1],
    ]),
    { refused: true, alone: true },
  );

  const ghostOpening: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "waste-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        opening: "no-such-opening",
      }),
    ),
  );
  const wrongOpening: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "waste-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        opening: "plant-hatch",
      }),
    ),
  );
  TestValidator.equals(
    "a sleeve may only cite an opening cut through its own boundary",
    namedFacts([
      [
        "ghost",
        (): boolean =>
          hasViolation(
            ghostOpening,
            "type",
            "$input.penetrations[5].opening",
          ) && violationCount(ghostOpening) === 1,
      ],
      [
        "wrongBoundary",
        (): boolean =>
          hasViolation(
            wrongOpening,
            "type",
            "$input.penetrations[5].opening",
          ) && violationCount(wrongOpening) === 1,
      ],
    ]),
    { ghost: true, wrongBoundary: true },
  );

  const leaking: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        sealed: false,
      }),
    ),
  );
  TestValidator.equals(
    "waterproofing is only waterproof where the sleeves through it were made good",
    namedFacts([
      [
        "refused",
        (): boolean =>
          hasViolation(leaking, "type", "$input.penetrations[1].sealed"),
      ],
      ["alone", (): boolean => violationCount(leaking) === 1],
      [
        "untankedBoundaryUnaffected",
        (): boolean =>
          clean.penetrations[12]!.sealed === false && refuse().success,
      ],
    ]),
    { refused: true, alone: true, untankedBoundaryUnaffected: true },
  );

  const offPlane: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        position: { x: 4.5, y: 2.5, z: 1 },
      }),
    ),
  );
  const oversize: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        radius: 3,
      }),
    ),
  );
  const offVoid: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "waste-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        position: { x: 4, y: 1.5, z: 1 },
      }),
    ),
  );
  const faceless: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "cold-bath-hall",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        boundary: "bath-shell",
      }),
    ),
  );
  const plainHatch: IAutoMovieValidation = refuse(
    withSleeve(
      clean,
      "air-hall-plant",
      (entry: IAutoMovieServicePenetration): IAutoMovieServicePenetration => ({
        ...entry,
        opening: "plant-hatch",
      }),
    ),
  );
  TestValidator.equals(
    "a sleeve is held inside the face it pierces, and inside the void it cites",
    namedFacts([
      [
        "offPlane",
        (): boolean =>
          hasViolation(offPlane, "range", "$input.penetrations[1].position") &&
          offPlane.success === false &&
          offPlane.violations.some(
            (item: IAutoMovieConstraintViolation): boolean =>
              nclose(item.overshoot ?? -1, 0.4, 1e-12),
          ) &&
          violationCount(offPlane) === 1,
      ],
      [
        "oversize",
        (): boolean =>
          hasViolation(oversize, "type", "$input.penetrations[1].position") &&
          violationCount(oversize) === 1,
      ],
      [
        "offVoid",
        (): boolean =>
          hasViolation(offVoid, "type", "$input.penetrations[5].opening"),
      ],
      [
        "offVoidLeftItsRunToo",
        (): boolean =>
          hasViolation(offVoid, "range", "$input.segments[5].penetrations[0]"),
      ],
      ["facelessBoundarySkipped", (): boolean => faceless.success === true],
      ["profilelessOpeningSkipped", (): boolean => plainHatch.success === true],
    ]),
    {
      offPlane: true,
      oversize: true,
      offVoid: true,
      offVoidLeftItsRunToo: true,
      facelessBoundarySkipped: true,
      profilelessOpeningSkipped: true,
    },
  );

  const nowhere: IAutoMovieValidation = validateServiceNetwork({
    network: withSegment(
      clean,
      "cold-run",
      (run: IAutoMovieServiceSegment): IAutoMovieServiceSegment => ({
        ...run,
        penetrations: [],
      }),
    ),
    environment: semantic(),
  });
  TestValidator.equals(
    "where no room declares a volume, no crossing is invented",
    namedFacts([
      ["accepted", (): boolean => nowhere.success === true],
      [
        "warningCount",
        (): boolean =>
          // The `success` comparison is restated only to narrow the union
          // inside this closure.
          nowhere.success === true && (nowhere.warnings ?? []).length === 2,
      ],
    ]),
    { accepted: true, warningCount: true },
  );
}
