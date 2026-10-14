import { simulateSoftBody } from "../../../../packages/engine/src/soft/simulateSoftBody";
import { softBodyRestConfiguration } from "../../../../packages/engine/src/soft/softBodyRestConfiguration";
import { softBodyStateDigest } from "../../../../packages/engine/src/soft/softBodyStateDigest";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose, throwsError } from "../internal/predicates";
import { exactValues, softPanel } from "../internal/softFixtures";
import { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState } from "@automovie/interface";
/** A panel in free space with no body force and every anchor left where it is. */
const undisturbed: () => IAutoMovieSoftBodyDomain = (): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 4,
    rows: 3,
    overrides: {
      id: "still",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: 0, z: 0 },
        drag: 0,
        iterations: 4,
        stiffness: { structural: 1, shear: 1, bend: 1 },
        referenceSpeed: 4,
        maxSteps: 512,
      },
      anchors: [
        { id: "left", particle: 0, position: null },
        { id: "right", particle: 3, position: null },
      ],
    },
  });

/** Verify the anchored rest configuration and an undisturbed cloth replay, with gravity as a control that must change the result.
 *
 * Scenarios:
 *
 * 1. Two hundred and fifty-six steps of an undisturbed panel leave every position
 *    bit-identical to the authored rest mesh and every velocity at exactly
 *    zero, with no strain and no contact.
 * 2. Two independent integrations to step 256 repeat their selected-field digest;
 *    authored-rest and zero-velocity checks independently pin this witness,
 *    while checksum collisions remain possible.
 * 3. An anchor declared with `position: null` holds its particle exactly at its
 *    own rest coordinate, which is what makes the default anchor spelling safe
 *    to use instead of restating a coordinate.
 * 4. Turning gravity on breaks the property, proving the assertion above is
 *    measuring the solver and not an accidental no-op: the same panel under
 *    gravity moves.

 *
 * @evidence contracts/testing.md#behavioral-verification Static solver positions/velocities and rest-target precedence are observed directly; a changed canonical distance expression, lost anchor/state override or accidental no-op fails preserved assertions.
 * @evidence contracts/testing.md#independent-expectations Authored rest coordinates, exact zero velocities/measurements and explicitly authored anchor targets supply the expectations. Repeated digest equality is only an auxiliary collision-prone diagnostic, not independent proof of whole-state identity.
 * @evidence contracts/testing.md#distinguishing-cases The preserved 256-step rest, null target, gravity control, explicit target, named override and missing-state refusal cases distinguish integration from boundary setup; moving boundaries belong to the wearable owning tests.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_soft_body_rest_exactness; fixture builders supply only authored records and no browser, native solver artifact or live host is installed.
 */
export function test_soft_body_rest_exactness(): void {
  const domain: IAutoMovieSoftBodyDomain = undisturbed();
  const settled: IAutoMovieSoftBodyState = simulateSoftBody(domain, 256);
  TestValidator.equals(
    "an undisturbed panel is bit-identical to its rest mesh",
    namedFacts([
      ["positions", (): boolean => exactValues(settled.positions, domain.rest)],
      [
        "velocities",
        (): boolean => settled.velocities.every((value: number): boolean => Object.is(value, 0)),
      ],
      ["strain", (): boolean => Object.is(settled.maxStrain, 0)],
      ["speed", (): boolean => Object.is(settled.maxSpeed, 0)],
      ["contacts", (): boolean => settled.contacts === 0],
      [
        "digest",
        (): boolean =>
          softBodyStateDigest(settled) ===
          softBodyStateDigest(simulateSoftBody(domain, 256)),
      ],
    ]),
    {
      positions: true,
      velocities: true,
      strain: true,
      speed: true,
      contacts: true,
      digest: true,
    },
  );

  const anchored: IAutoMovieSoftBodyState = simulateSoftBody(domain, 1);
  TestValidator.equals(
    "a null anchor position holds the particle at its own rest coordinate",
    namedFacts([
      ["x", (): boolean => Object.is(anchored.positions[9], domain.rest[9])],
      ["y", (): boolean => Object.is(anchored.positions[10], domain.rest[10])],
      ["z", (): boolean => Object.is(anchored.positions[11], domain.rest[11])],
    ]),
    { x: true, y: true, z: true },
  );

  const falling: IAutoMovieSoftBodyState = simulateSoftBody(
    softPanel({
      columns: 4,
      rows: 3,
      overrides: {
        id: "falling",
        anchors: [{ id: "left", particle: 0, position: null }],
      },
    }),
    64,
  );
  TestValidator.equals(
    "the same panel under gravity does move, so the rest claim measures something",
    namedFacts([
      ["moved", (): boolean => falling.positions[10] < -0.5],
      ["strained", (): boolean => falling.maxStrain > 0],
    ]),
    { moved: true, strained: true },
  );

  const gathered: IAutoMovieSoftBodyDomain = softPanel({
    columns: 4,
    rows: 3,
    overrides: {
      id: "gathered",
      anchors: [{ id: "left", particle: 0, position: { x: 2, y: 1, z: 0 } }],
      states: [
        {
          id: "drawn",
          anchors: [{ anchor: "left", position: { x: -3, y: 1, z: 0.5 } }],
        },
      ],
    },
  });
  TestValidator.equals(
    "the published rest configuration is what the solve starts from",
    namedFacts([
      [
        "default",
        (): boolean =>
          exactValues(
            softBodyRestConfiguration(domain),
            simulateSoftBody(domain, 0).positions,
          ),
      ],
      [
        "anchored",
        (): boolean =>
          exactValues(
            softBodyRestConfiguration(gathered),
            simulateSoftBody(gathered, 0).positions,
          ),
      ],
      [
        "named",
        (): boolean =>
          exactValues(
            softBodyRestConfiguration(gathered, "drawn"),
            simulateSoftBody(gathered, 0, "drawn").positions,
          ),
      ],
      [
        "notTheAuthoredMesh",
        (): boolean =>
          exactValues(softBodyRestConfiguration(gathered), gathered.rest) ===
            false &&
          nclose(softBodyRestConfiguration(gathered)[0], 2, 0) &&
          nclose(softBodyRestConfiguration(gathered, "drawn")[0], -3, 0),
      ],
      [
        "undeclaredStateThrows",
        (): boolean =>
          throwsError(
            (): number[] => softBodyRestConfiguration(gathered, "shut"),
            'does not declare a named state "shut"',
          ),
      ],
    ]),
    {
      default: true,
      anchored: true,
      named: true,
      notTheAuthoredMesh: true,
      undeclaredStateThrows: true,
    },
  );
}
