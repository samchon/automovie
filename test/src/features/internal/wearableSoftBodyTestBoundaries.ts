import { AutoMovieEngineSoftBody } from "@automovie/engine";
import type {
  IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "./predicates";
import { wearableSoftBodyTestDomain as domain } from "./wearableSoftBodyTestDomain";

/**
 * Preserve original Scenario 8 complete moving-boundary admission refusals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real lower boundary solver with each original incomplete, misnumbered, foreign, duplicated or malformed record and observes the existing cause-specific error.
 * @evidence contracts/development/testing.md#independent-expectations The authored moving particle0 and torso capsule define completeness and identity independently; literal invalid indices/vectors/radii establish refusal expectations rather than expected solver positions.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains every original Scenario 8 input/error/order, including static-anchor override, zero radius and both nonfinite capsule endpoints. The existing valid boundary only arranges negative twins and supplies no oracle values.
 * @evidence contracts/development/testing.md#execution-ownership The main unit directly invokes this synchronous assertion owner and lends its original static-domain identity; all temporary boundary rows stay local, with no host, file, renderer, browser/GPU or foreign-method replacement.
 */
export function wearableSoftBodyTestBoundaries(
  staticDomain: IAutoMovieSoftBodyDomain,
): void {
  /**
   * Construct the original complete boundary as the unchanged negative-twin
   * base.
   */
  const validBoundary: () => IAutoMovieSoftBodyBoundarySample =
    (): IAutoMovieSoftBodyBoundarySample => ({
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
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries> =>
          AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, []),
        "one moving boundary",
      ),
      wrongBoundaryStep: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries> =>
          AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
            { ...validBoundary(), step: 1 },
          ]),
        "must name absolute step 0",
      ),
      negativeParticle: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries> =>
          AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: -1, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      outOfRangeParticle: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries> =>
          AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
            {
              ...validBoundary(),
              anchors: [{ particle: 2, position: { x: 0, y: 1, z: 0 } }],
            },
          ]),
        "invalid anchor particle",
      ),
      staticAnchorOverride: throwsError(
        (): ReturnType<typeof AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries> =>
          AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(
            { ...domain(), anchors: staticDomain.anchors },
            0,
            [validBoundary()],
          ),
        "not an authored moving anchor",
      ),
      duplicateAnchor: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            anchors: [...boundary.anchors, boundary.anchors[0]!],
          },
        ]);
      }, "repeats anchor particle"),
      duplicateCapsule: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [...boundary.capsules, boundary.capsules[0]!],
          },
        ]);
      }, "repeats capsule"),
      foreignCapsule: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
          {
            ...boundary,
            capsules: [{ ...boundary.capsules[0]!, id: "foreign" }],
          },
        ]);
      }, "not an authored body capsule"),
      zeroRadius: throwsError((): void => {
        const boundary: ReturnType<typeof validBoundary> = validBoundary();
        AutoMovieEngineSoftBody.simulateSoftBodyWithBoundaries(domain(), 0, [
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
      negativeParticle: true,
      outOfRangeParticle: true,
      staticAnchorOverride: true,
      duplicateAnchor: true,
      duplicateCapsule: true,
      foreignCapsule: true,
      zeroRadius: true,
    },
  );
}
