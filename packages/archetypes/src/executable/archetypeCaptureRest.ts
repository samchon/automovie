import type { QuadrupedBody } from "../animals/QuadrupedBody";
import { QuadrupedRest } from "../animals/QuadrupedRest";
import type { QuadrupedRestPlan } from "../animals/QuadrupedRestPlan";
import { createDog } from "../animals/createDog";
import type { Archetype } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * Draw the actual canonical dog's authored lowering, sternal hold and rise.
 *
 * The two-second transitions, one-second hold, horizontal resting tail and
 * distal carriage are presentation choices, not measured greyhound timings.
 * The ordinary producer builds the actual dog and its authored collar/lead;
 * the rest sampler supplies both model geometry and current contact frames.
 *
 * @returns The rest-dog inspection subject with actual cycle events and geometry.
 * @evidence contracts/development/common.md#meaningful-documentation States the canonical source, authored mass/tack/clock/carriage, actual contact consumer and model-space placement rule.
 * @evidence contracts/development/implementation.md#principled-implementation The canonical public dog producer supplies the body and real lead contact; QuadrupedRest computes the supported pose from actual bars and one explicit floor. Its sampled animal already includes the root placement, so the capture member returns that animal without applying a second placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build one explicit specimen, prepare one actual rest law and map its named events and sample into the existing capture subject contract.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No static fallback, substituted geometry, fake readiness or measured-timing claim hides a failed sample; the law's ordinary refusals propagate to capture.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded body/law preparation and one O(P+B+A) actual pose per capture request; event mapping contains four entries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All frame requests share the immutable source dog and prepared time-only law; no completed frame cache changes seeking behavior.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The subject retains one source body and law for its catalogue lifetime, acquires no renderer/process/file, and returns fresh posed transforms per request.
 */
export function archetypeCaptureRest(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const dog: ReturnType<typeof createDog> = createDog({
    ...createDog.REFERENCE,
    cohort: "pet",
    tempo: 0,
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  });
  const params: QuadrupedRestPlan.IParams = {
    floorY: 0,
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch: 0,
    tailDirection: -90,
    folded: { fore: [90, 0], hind: [-90, 0] },
    windows: { body: [0, 1], fore: [0, 1], hind: [0, 1] },
    parts: {
      withers: "trunk",
      leftEar: "head",
      rightEar: "head",
      collar: "neck",
      lead: "neck",
    },
    contacts: { lead: "neck" },
  };
  const clip: QuadrupedRestPlan.IClip<
    createDog.Affordance,
    QuadrupedBody.Dimension
  > = QuadrupedRest(dog, params);
  return {
    "rest-dog": {
      members: [
        {
          name: "dog",
          at: (seconds: number): { archetype: Archetype } => ({
            archetype: clip.sample(seconds).animal,
          }),
        },
      ],
      duration: clip.duration,
      instants: Object.entries(clip.events).map(
        ([label, seconds]: [string, number]): {
          seconds: number;
          label: string;
        } => ({ seconds, label }),
      ),
    },
  };
}
