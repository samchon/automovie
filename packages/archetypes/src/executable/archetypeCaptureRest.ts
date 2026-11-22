import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody } from "../animals/AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedRest } from "../animals/AutoMovieArchetypeQuadrupedRest";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "../animals/AutoMovieArchetypeQuadrupedRestPlan";
import { QuadrupedCarriage } from "../animals/QuadrupedCarriage";
import { createDog } from "../animals/createDog";
import { createHorse } from "../animals/createHorse";
import { createQuadruped } from "../animals/createQuadruped";
import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/**
 * Draw actual canonical dog and saddle-horse authored rest cycles.
 *
 * The two-second transitions, one-second hold, horizontal resting tail and
 * distal carriage are presentation choices, not measured greyhound timings.
 * Ordinary producers build the dog with its authored collar/lead and the
 * short-stirrup saddle horse. Its torso pitch aligns the actual trunk/rear
 * capsule axes for floor support; it is not a measured horse rest angle.
 * Their actual rest samples supply geometry, contacts and
 * terminal goals; no second sampling or second root placement supplies marks.
 *
 * @returns Actual dog/horse rest subjects with declared goals, current geometry and cycle events.
 * @evidence contracts/development/common.md#meaningful-documentation States actual canonical dog and saddle-horse sources, admitted minimum stirrup drop and reference withers height, geometric support pitch, authored clock/carriage, actual contact consumer and model-space placement rule; no horse clinical trajectory is claimed.
 * @evidence contracts/development/implementation.md#principled-implementation Public dog/horse producers supply actual bodies and tack. AutoMovieArchetypeQuadrupedRest computes supported poses from actual bars and one explicit floor. Each sampled animal already includes the root placement; that same sample supplies terminal goals for independent geometry marks, without another root transform or sampler call.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare two actual source/law pairs with explicit authoring values and complete carriers, then a shared adapter exposes their events, actual posed models and terminal targets to the existing instrument.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No static fallback, substituted geometry, fake readiness or measured-timing claim hides a failed sample; the law's ordinary refusals propagate to capture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two bounded source/law preparations and one O(P+B+A) actual pose with four goal references per request; each event mapping contains four entries.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every subject shares its immutable source and prepared time-only law across seeks; the same sample supplies marks and geometry without a completed-frame cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each subject retains its source body and law for its catalogue lifetime, acquires no renderer/process/file, and returns fresh posed transforms per request.
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
  const params: AutoMovieArchetypeQuadrupedRestPlan.IParams = {
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
  const clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = AutoMovieArchetypeQuadrupedRest(dog, params);
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "saddle",
    withersHeight: createHorse.JENSEN.withers,
    stirrupDrop: createHorse.BANDS.stirrupDrop.minimum,
    tempo: 0,
  });
  const front: IAutoMovieVector3 = axisEnd(horse, "trunk");
  const rear: IAutoMovieVector3 = axisEnd(horse, "hindquarters");
  const carriers: ReturnType<typeof QuadrupedCarriage.of> =
    QuadrupedCarriage.of(horse, createQuadruped.species(horse));
  const horseClip: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    createHorse.Affordance,
    createHorse.Dimension
  > = AutoMovieArchetypeQuadrupedRest(horse, {
    ...params,
    ...carriers,
    restPitch: (Math.atan2(front.y - rear.y, front.z - rear.z) * 180) / Math.PI,
  });
  return {
    "rest-dog": subject("dog", dog, clip),
    "rest-horse": subject("horse", horse, horseClip),
  };
}

/** Actual capsule-axis low end supplies a geometric torso-support pitch, without a species pose preset. */
function axisEnd(
  animal: AutoMovieArchetype,
  id: "trunk" | "hindquarters",
): IAutoMovieVector3 {
  const part: IAutoMovieModelPart | undefined = animal.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (
    part?.transform === null ||
    part?.transform === undefined ||
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "capsule"
  )
    throw new RangeError(`Rest capture requires the actual ${id} capsule`);
  return AutoMovieArchetypeFrame.point(part.transform, {
    x: 0,
    y: part.geometry.shape.height / 2,
    z: 0,
  });
}

/** Preserve one actual sample for both drawing and its independently observable terminal goals. */
function subject<Id extends string, Dimension extends string>(
  name: string,
  animal: AutoMovieArchetype<Id, Dimension>,
  clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<Id, Dimension>,
): archetypeCaptureCatalog.ISubject {
  return {
    members: [
      {
        name,
        reference: animal,
        at: (
          seconds: number,
        ): ReturnType<archetypeCaptureCatalog.IMember["at"]> => {
          const sample: AutoMovieArchetypeQuadrupedRestPlan.ISample<
            Id,
            Dimension
          > = clip.sample(seconds);
          return {
            archetype: sample.animal,
            goals: new Map(
              [...sample.feet].map(
                ([limb, point]: [
                  AutoMovieArchetypeQuadrupedBody.Limb,
                  IAutoMovieVector3,
                ]): [
                  AutoMovieArchetypeQuadrupedBody.Bone,
                  IAutoMovieVector3,
                ] => [AutoMovieArchetypeQuadrupedBody.BONES[limb][3]!, point],
              ),
            ),
          };
        },
      },
    ],
    duration: clip.duration,
    instants: Object.entries(clip.events).map(
      ([label, seconds]: [string, number]): {
        seconds: number;
        label: string;
      } => ({ seconds, label }),
    ),
  };
}
