import { validateSpace } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";
import { validationSpaceFixtures } from "./validationSpaceFixtures";

/**
 * Pins exclusive ground spellings and finite constant, plane and lattice admission.
 *
 * Scenarios:
 * 1. Anchors and rules are mutually exclusive, and one ground spelling is required.
 * 2. Dense constant, plane and two-by-two lattice rules pass.
 * 3. Every invalid rule term, lattice dimension, pitch, length and sample is located.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the existing height-rule admission cases.
 *
 * @evidence contracts/development/testing.md#independent-expectations Located errors follow the authored field paths and finite complete lattice contract, independently of the validator's implementation; this does not measure rendered ground.
 *
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps all existing constant, plane and lattice cases; malformed geometry and hole relationships remain in the parent test.
 *
 * @evidence contracts/development/testing.md#execution-ownership Portable engine admission runs through assertValidationSpaceHeights; the discoverable test_validation_space entry owns every synchronous case without a browser or native renderer.
 */
export function assertValidationSpaceHeights(): void {
  const {
    withSurface,
    withHeight,
    lattice,
  }: ReturnType<typeof validationSpaceFixtures> = validationSpaceFixtures();

  TestValidator.equals(
    "a surface states its ground exactly once",
    namedFacts([
      [
        "bothSpellings",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withSurface({ height: { kind: "constant", value: 1 } }),
            }),
            "type",
            "surfaces[1].height",
          ),
      ],
      // A flat patch spells itself with an anchor and no ramp, so the anchor
      // alone is what makes the pair present: dropping it leaves nothing.
      [
        "neitherSpelling",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withSurface({ anchor: undefined, rampTo: null }),
            }),
            "type",
            "surfaces[1].height",
          ),
      ],
      // A lone rampTo is still the anchored spelling, so it collides with a
      // rule rather than reading as no ground at all.
      [
        "loneRampTo",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withSurface({
                anchor: undefined,
                height: { kind: "constant", value: 1 },
              }),
            }),
            "type",
            "surfaces[1].height",
          ),
      ],
    ]),
    { bothSpellings: true, neitherSpelling: true, loneRampTo: true },
  );

  TestValidator.equals(
    "a well-formed height rule of every kind validates",
    namedFacts([
      [
        "constant",
        (): boolean =>
          validateSpace({
            space: withHeight({ kind: "constant", value: 2 }),
          }).success === true,
      ],
      [
        "plane",
        (): boolean =>
          validateSpace({
            space: withHeight({
              kind: "plane",
              originHeight: 0,
              slopeX: 0.5,
              slopeZ: 0,
            }),
          }).success === true,
      ],
      [
        "heightfield",
        (): boolean =>
          validateSpace({ space: withHeight(lattice()) }).success === true,
      ],
    ]),
    { constant: true, plane: true, heightfield: true },
  );

  TestValidator.equals(
    "every height-rule parameter is range-checked",
    namedFacts([
      [
        "latticeSpacingX",
        (): boolean =>
          hasViolation(
            validateSpace({ space: withHeight(lattice({ spacingX: 0 })) }),
            "range",
            ".height.spacingX",
          ),
      ],
      [
        "latticeSpacingZ",
        (): boolean =>
          hasViolation(
            validateSpace({ space: withHeight(lattice({ spacingZ: -2 })) }),
            "range",
            ".height.spacingZ",
          ),
      ],
      [
        "latticeColumns",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight(lattice({ columns: 1, samples: [0, 1] })),
            }),
            "range",
            ".height.columns",
          ),
      ],
      [
        "latticeSamples",
        (): boolean =>
          hasViolation(
            validateSpace({ space: withHeight(lattice({ samples: [0, 1] })) }),
            "range",
            ".height.samples",
          ),
      ],
    ]),
    {
      latticeSpacingX: true,
      latticeSpacingZ: true,
      latticeColumns: true,
      latticeSamples: true,
    },
  );
}
