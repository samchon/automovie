import type { IAutoMovieInspectSubject } from "../../../../packages/production/src/production/IAutoMovieInspectSubject";
import type { IAutoMovieSubjectInspectionView } from "../../../../packages/production/src/production/IAutoMovieSubjectInspectionView";
import { autoMovieSubjectInspectionElevations } from "../../../../packages/production/src/production/autoMovieSubjectInspectionElevations";
import { autoMovieSubjectInspectionPlan } from "../../../../packages/production/src/production/autoMovieSubjectInspectionPlan";
import { autoMovieSubjectInspectionPose } from "../../../../packages/production/src/production/autoMovieSubjectInspectionPose";
import { autoMovieViewerTurntableViewpoints } from "../../../../packages/viewer/src/subjectViewpoint/autoMovieViewerTurntableViewpoints";
import { frameAutoMovieViewerSubject } from "../../../../packages/viewer/src/subjectViewpoint/frameAutoMovieViewerSubject";
import { TestValidator } from "@nestia/e2e";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/** One elevation the size of a wall, and one mullion inside it. */
const ELEVATION: Parameters<typeof autoMovieSubjectInspectionPlan>[0]["bounds"] = {
  min: { x: -25, y: 0, z: -0.4 },
  max: { x: 25, y: 18, z: 0.4 },
};
const MULLION: Parameters<typeof autoMovieSubjectInspectionPlan>[0]["bounds"] = {
  min: { x: 3.11, y: 4.2, z: -0.025 },
  max: { x: 3.16, y: 6.4, z: 0.025 },
};

const LENS: { fovDeg: number; aspect: number } = { fovDeg: 35, aspect: 16 / 9 };
const RULE: { azimuthCount: number; elevationsDeg: number[]; distanceFactor: number } = {
  azimuthCount: 6,
  elevationsDeg: [20, -10],
  distanceFactor: 1.25,
};

/** What a caller must give before the plan will produce a viewpoint. */
function refusal(act: () => unknown): string {
  try {
    act();
    return "accepted";
  } catch (error) {
    return error instanceof RangeError ? "refused" : "wrong-error";
  }
}

/**
 * The tool surface and the in-process harness are one instrument.
 *
 * Scenarios:
 *
 * 1. For a 50 m elevation and a 0.05 m mullion alike, the plan the production surface
 *    states and the plan the viewer harness lays out name the same viewpoints
 *    in the same order and resolve to bit-identical camera state. That equality
 *    is what lets a reviewer looking through the browser and an authoring agent
 *    calling the tool argue about one object rather than two pictures.
 * 2. Framing follows each subject's extent above the shared 0.5-metre radius
 *    floor, so the mullion remains below the wall's distance under one rule;
 *    small and degenerate boxes still receive the conventional minimum framing.
 * 3. Each arranged impossible viewpoint rule is refused with a range error rather than
 *    silently normalised, including two elevation rings that would round to one
 *    viewpoint identity.
 * 4. An inspection answer cannot be handed to a consumer that requires delivery
 *    evidence; the refusal is in the type, not in a reviewer's memory.
 */
/**
 * @evidence contracts/testing.md#behavioral-verification Builds production and viewer plans/poses for authored wall/mullion bounds, checking ordered ids and exact finite camera-state parity, grounding and rule refusal; drift between the inspection surfaces or silent admission of an invalid rule fails.
 * @evidence contracts/testing.md#independent-expectations Camera comparisons intentionally check cross-surface parity and can miss a shared fitting error; authored degenerate center and the ground-angle arcsine provide independent scalar expectations. The compile-only negative consumer retains its @ts-expect-error type refusal and is not a runtime behavior assertion or image-quality proof.
 * @evidence contracts/testing.md#distinguishing-cases Keeps wall/small/degenerate bounds, grounded/raised subjects, duplicate collapsed rings, zero distance and all thirteen invalid rule/lens cases, plus the negative delivery-evidence type contract; real rendered coverage is outside this CPU population.
 * @evidence contracts/testing.md#execution-ownership The normal runner discovers this exported CPU entry, which directly imports actual production/viewer framing source and uses no canvas, browser, GPU, process or native build; the delivery consumer body remains unexecuted and is checked only by configured compilation.
 */
export function test_production_subject_inspection_parity(): void {
  for (const [label, bounds] of [
    ["elevation", ELEVATION],
    ["mullion", MULLION],
  ] as const) {
    const plan: ReturnType<typeof autoMovieSubjectInspectionPlan> = autoMovieSubjectInspectionPlan({ bounds, ...RULE, ...LENS });
    const harness: ReturnType<typeof autoMovieViewerTurntableViewpoints> = autoMovieViewerTurntableViewpoints(RULE);
    TestValidator.equals(
      `the ${label} plan names the harness viewpoints in harness order`,
      plan.map((viewpoint: typeof plan[number]): string => viewpoint.id),
      harness.map((viewpoint: typeof harness[number]): string => viewpoint.id),
    );
    TestValidator.predicate(
      `the ${label} resolves to the camera state the harness resolves`,
      plan.length === harness.length && plan.every((viewpoint: typeof plan[number], index: number): boolean => {
        const actual: ReturnType<typeof autoMovieSubjectInspectionPose> = autoMovieSubjectInspectionPose({
          bounds,
          coordinateSpace: "world",
          viewpoint,
          ...LENS,
        });
        const expected: ReturnType<typeof frameAutoMovieViewerSubject> = frameAutoMovieViewerSubject(bounds, harness[index]!, LENS);
        return actual.coordinateSpace === "world" &&
          vclose(actual.position, expected.position, 0) && vclose(actual.target, expected.target, 0) &&
          nclose(actual.fovDeg, expected.lens.fovDeg, 0) && nclose(actual.aspect, expected.lens.aspect, 0) &&
          nclose(actual.near, expected.near, 0) && nclose(actual.far, expected.far, 0);
      }),
    );
  }

  const elevation: ReturnType<typeof autoMovieSubjectInspectionPlan>[number] = autoMovieSubjectInspectionPlan({
    bounds: ELEVATION,
    ...RULE,
    ...LENS,
  })[0]!;
  const mullion: ReturnType<typeof autoMovieSubjectInspectionPlan>[number] = autoMovieSubjectInspectionPlan({
    bounds: MULLION,
    ...RULE,
    ...LENS,
  })[0]!;
  const degenerate: ReturnType<typeof autoMovieSubjectInspectionPlan>[number] = autoMovieSubjectInspectionPlan({
    bounds: { min: { x: 2, y: 1, z: 0 }, max: { x: 2, y: 1, z: 0 } },
    ...RULE,
    ...LENS,
  })[0]!;
  TestValidator.equals(
    "one rule frames a wall and a mullion at their own scales",
    {
      scaled: elevation.distance > mullion.distance * 20,
      mullionWithinReach: mullion.distance < 12,
      degenerateFramed:
        degenerate.distance > 0 && Number.isFinite(degenerate.distance),
      degenerateAtItsOwnPoint: vclose(autoMovieSubjectInspectionPose({
        bounds: { min: { x: 2, y: 1, z: 0 }, max: { x: 2, y: 1, z: 0 } },
        coordinateSpace: "model",
        viewpoint: degenerate,
        ...LENS,
      }).target, { x: 2, y: 1, z: 0 }, 0),
    },
    {
      scaled: true,
      mullionWithinReach: true,
      degenerateFramed: true,
      degenerateAtItsOwnPoint: true,
    },
  );

  const room: typeof ELEVATION = {
    min: { x: -6, y: 0, z: -4 },
    max: { x: 6, y: 9.9, z: 4 },
  };
  const raised: typeof ELEVATION = {
    min: { x: 0, y: 3, z: 0 },
    max: { x: 0.4, y: 3.02, z: 0.4 },
  };
  TestValidator.equals(
    "a low ring is raised only where it would put the eye under the subject",
    {
      grounded: sameElevations(autoMovieSubjectInspectionElevations({
        bounds: room,
        elevationsDeg: [20, -20],
        distance: 20,
      }), [20, -Math.asin(4.95 / 20) * (180 / Math.PI)]),
      offTheGround: sameElevations(autoMovieSubjectInspectionElevations({
        bounds: raised,
        elevationsDeg: [20, -20],
        distance: 2,
      }), [20, -20]),
      collapsed: autoMovieSubjectInspectionElevations({
        bounds: room,
        elevationsDeg: [-20, -30, -40],
        distance: 20,
      }).length,
      unmeasurableDistance: sameElevations(autoMovieSubjectInspectionElevations({
        bounds: room,
        elevationsDeg: [-20, 10],
        distance: 0,
      }), [0, 10]),
    },
    {
      grounded: true,
      offTheGround: true,
      collapsed: 1,
      unmeasurableDistance: true,
    },
  );

  TestValidator.equals(
    "an impossible viewpoint rule is refused rather than normalised",
    {
      fractionalAzimuths: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          azimuthCount: 1.5,
        }),
      ),
      noAzimuths: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          azimuthCount: 0,
        }),
      ),
      tooManyAzimuths: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          azimuthCount: 65,
        }),
      ),
      noRings: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          elevationsDeg: [],
        }),
      ),
      tooManyRings: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          elevationsDeg: [0, 5, 10, 15, 20, 25, 30, 35, 40],
        }),
      ),
      overheadRing: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          elevationsDeg: [90],
        }),
      ),
      collapsingRings: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          elevationsDeg: [20, 20.4],
        }),
      ),
      zeroMargin: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          distanceFactor: 0,
        }),
      ),
      unmeasurableMargin: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          distanceFactor: Number.NaN,
        }),
      ),
      degenerateLens: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          fovDeg: 0,
        }),
      ),
      straightThroughLens: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          fovDeg: 180,
        }),
      ),
      flatViewport: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          aspect: 0,
        }),
      ),
      unmeasurableViewport: refusal((): ReturnType<typeof autoMovieSubjectInspectionPlan> =>
        autoMovieSubjectInspectionPlan({
          bounds: ELEVATION,
          ...RULE,
          ...LENS,
          aspect: Number.NaN,
        }),
      ),
    },
    {
      fractionalAzimuths: "refused",
      noAzimuths: "refused",
      tooManyAzimuths: "refused",
      noRings: "refused",
      tooManyRings: "refused",
      overheadRing: "refused",
      collapsingRings: "refused",
      zeroMargin: "refused",
      unmeasurableMargin: "refused",
      degenerateLens: "refused",
      straightThroughLens: "refused",
      flatViewport: "refused",
      unmeasurableViewport: "refused",
    },
  );

  // Keep the compile-only negative consumer reachable by name, without executing
  // its deliberately invalid call or treating function existence as an assertion.
  void deliveryEvidenceConsumerIsUnreachable;
}

/** Compare every grounded angle while preserving the original exact scalar contract. */
function sameElevations(actual: number[], expected: number[]): boolean {
  return actual.length === expected.length && actual.every((angle: number, index: number): boolean => nclose(angle, expected[index]!, 0));
}

/** A consumer that will only read evidence about a delivered picture. */
function requireDeliveryEvidence(evidence: {
  deliveryEvidence: true;
  views: IAutoMovieSubjectInspectionView[];
}): number { return evidence.views.length; }

/**
 * The delivery-evidence refusal is a type error, not a reviewer's discipline.
 *
 * The body never runs. It exists so the builder is the thing that proves an
 * inspection answer cannot be offered where a delivered frame is required; a
 * runtime assertion could only observe the literal `false`, and a later widening
 * to `boolean` would leave that assertion green while the guarantee was gone.
 */
function deliveryEvidenceConsumerIsUnreachable(
  inspection: IAutoMovieInspectSubject,
): number {
  // @ts-expect-error a subject inspection can never be delivery evidence
  return requireDeliveryEvidence(inspection);
}
