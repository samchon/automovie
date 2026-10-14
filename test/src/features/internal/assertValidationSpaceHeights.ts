import { validateSpace } from "@automovie/engine";
import { IAutoMovieHeightRule } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation, namedFacts } from "./predicates";
import { validationSpaceFixtures } from "./validationSpaceFixtures";
import { withoutArraySlot } from "./withoutArraySlot";

/**
 * Pins exclusive ground spellings and finite constant, plane and lattice admission.
 *
 * Scenarios:
 * 1. Anchors and rules are mutually exclusive, and one ground spelling is required.
 * 2. Dense constant, plane and two-by-two lattice rules pass.
 * 3. Every invalid rule term, lattice dimension, pitch, length and sample is located.
 * 4. A missing lattice sample is refused at its stored slot; its dense twin still passes.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the existing height-rule admission cases and detects missing lattice samples that forEach previously skipped.
 *
 * @evidence contracts/testing.md#independent-expectations Located errors follow the authored field paths and finite complete lattice contract, independently of the validator's implementation; this does not measure rendered ground.
 *
 * @evidence contracts/testing.md#distinguishing-cases Keeps all existing constant, plane, lattice and unknown-kind cases; malformed geometry and hole relationships remain in the parent test.
 *
 * @evidence contracts/testing.md#execution-ownership Portable engine admission runs through assertValidationSpaceHeights; the discoverable test_validation_space entry owns every synchronous case without a browser or native renderer.
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
        "constantValue",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight({ kind: "constant", value: Number.NaN }),
            }),
            "range",
            ".height.value",
          ),
      ],
      [
        "planeOrigin",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight({
                kind: "plane",
                originHeight: Number.POSITIVE_INFINITY,
                slopeX: 0,
                slopeZ: 0,
              }),
            }),
            "range",
            ".height.originHeight",
          ),
      ],
      [
        "planeSlopeX",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight({
                kind: "plane",
                originHeight: 0,
                slopeX: Number.NaN,
                slopeZ: 0,
              }),
            }),
            "range",
            ".height.slopeX",
          ),
      ],
      [
        "planeSlopeZ",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight({
                kind: "plane",
                originHeight: 0,
                slopeX: 0,
                slopeZ: Number.NaN,
              }),
            }),
            "range",
            ".height.slopeZ",
          ),
      ],
      [
        "latticeOriginX",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight(lattice({ originX: Number.NaN })),
            }),
            "range",
            ".height.originX",
          ),
      ],
      [
        "latticeOriginZ",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight(lattice({ originZ: Number.NaN })),
            }),
            "range",
            ".height.originZ",
          ),
      ],
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
        "latticeRows",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight(lattice({ rows: 1.5, samples: [0, 1, 0] })),
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
      [
        "latticeSample",
        (): boolean =>
          hasViolation(
            validateSpace({
              space: withHeight(lattice({ samples: [0, 1, 0, Number.NaN] })),
            }),
            "range",
            ".height.samples[3]",
          ),
      ],
    ]),
    {
      constantValue: true,
      planeOrigin: true,
      planeSlopeX: true,
      planeSlopeZ: true,
      latticeOriginX: true,
      latticeOriginZ: true,
      latticeSpacingX: true,
      latticeSpacingZ: true,
      latticeColumns: true,
      latticeRows: true,
      latticeSamples: true,
      latticeSample: true,
    },
  );

  TestValidator.predicate(
    "unknown height rule kind",
    hasViolation(
      validateSpace({
        space: withHeight({
          kind: "erosion",
        } as unknown as IAutoMovieHeightRule),
      }),
      "type",
      ".height.kind",
    ),
  );
  TestValidator.predicate(
    "a missing lattice sample is located",
    hasViolation(
      validateSpace({
        space: withHeight(
          lattice({ samples: withoutArraySlot([0, 1, 0, 1], 2) }),
        ),
      }),
      "range",
      ".height.samples[2]",
    ),
  );
}
