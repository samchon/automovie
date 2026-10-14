import { type IAutoMovieSoftBodyBoundarySample, simulateSoftBodyWithBoundaries } from "@automovie/engine";
import type { IAutoMovieSoftBodyDomain } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "./predicates";
import { wearableSoftBodyTestDomain as domain } from "./wearableSoftBodyTestDomain";

/**
 * Preserve original Scenario 8 complete moving-boundary admission refusals.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real lower boundary solver with each original incomplete, misnumbered, foreign, duplicated or malformed record and observes the existing cause-specific error.
 * @evidence contracts/testing.md#independent-expectations The authored moving particle0 and torso capsule define completeness and identity independently; literal invalid indices/vectors/radii establish refusal expectations rather than expected solver positions.
 * @evidence contracts/testing.md#distinguishing-cases Retains every original Scenario 8 input/error/order, including static-anchor override, zero radius and both nonfinite capsule endpoints. The existing valid boundary only arranges negative twins and supplies no oracle values.
 * @evidence contracts/testing.md#execution-ownership The main unit directly invokes this synchronous assertion owner and lends its original static-domain identity; all temporary boundary rows stay local, with no host, file, renderer, browser/GPU or foreign-method replacement.
 */
export function wearableSoftBodyTestBoundaries(staticDomain: IAutoMovieSoftBodyDomain): void {
  /** Construct the original complete boundary as the unchanged negative-twin base. */
  const validBoundary: () => IAutoMovieSoftBodyBoundarySample = (): IAutoMovieSoftBodyBoundarySample => ({
    step: 0,
    anchors: [{ particle: 0, position: { x: 0, y: 1, z: 0 } }],
    capsules: [
      {
        id: "torso",
        from: { x: 0, y: 0, z: 0 },
        to: { x: 0, y: 1, z: 0 },
        radius: 0.25,
      },
    ],
  });
  TestValidator.equals(
    "the lower moving-boundary solver refuses incomplete and foreign records",
    {
      missingSequence: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> => simulateSoftBodyWithBoundaries(domain(), 0, []),
        "one moving boundary",
      ),
      wrongBoundaryStep: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            { ...validBoundary(), step: 1 },
          ]),
        "must name absolute step 0",
      ),
      fractionalParticle: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 0.5, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      negativeParticle: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: -1, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      outOfRangeParticle: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 2, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      staticAnchorOverride: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(
            { ...domain(), anchors: staticDomain.anchors },
            0,
            [validBoundary()],
          ),
        "not an authored moving anchor",
      ),
      duplicateAnchor: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            anchors: [...boundary.anchors, boundary.anchors[0]!],
          },
        ]);
      }, "repeats anchor particle"),
      nonfiniteAnchor: throwsError(
        (): ReturnType<typeof simulateSoftBodyWithBoundaries> =>
          simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 0, position: { x: NaN, y: 1, z: 0 } }],
            },
          ]),
        "finite coordinates",
      ),
      blankCapsule: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, id: " " }],
          },
        ]);
      }, "id must not be blank"),
      duplicateCapsule: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [...boundary.capsules, boundary.capsules[0]!],
          },
        ]);
      }, "repeats capsule"),
      foreignCapsule: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, id: "foreign" }],
          },
        ]);
      }, "not an authored body capsule"),
      nonfiniteCapsuleFrom: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [
              {
                ...boundary.capsules[0]!,
                from: { x: NaN, y: 0, z: 0 },
              },
            ],
          },
        ]);
      }, "finite coordinates"),
      nonfiniteCapsuleTo: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [
              {
                ...boundary.capsules[0]!,
                to: { x: 0, y: NaN, z: 0 },
              },
            ],
          },
        ]);
      }, "finite coordinates"),
      nonfiniteRadius: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, radius: NaN }],
          },
        ]);
      }, "radius must be finite"),
      zeroRadius: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, radius: 0 }],
          },
        ]);
      }, "radius must be finite"),
    },
    {
      missingSequence: true,
      wrongBoundaryStep: true,
      fractionalParticle: true,
      negativeParticle: true,
      outOfRangeParticle: true,
      staticAnchorOverride: true,
      duplicateAnchor: true,
      nonfiniteAnchor: true,
      blankCapsule: true,
      duplicateCapsule: true,
      foreignCapsule: true,
      nonfiniteCapsuleFrom: true,
      nonfiniteCapsuleTo: true,
      nonfiniteRadius: true,
      zeroRadius: true,
    },
  );
}
