import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeEquine } from "../../animals/AutoMovieArchetypeEquine";
import { AutoMovieArchetypeQuadrupedBody } from "../../animals/AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedRest } from "../../animals/AutoMovieArchetypeQuadrupedRest";
import type { AutoMovieArchetypeQuadrupedRestPlan } from "../../animals/AutoMovieArchetypeQuadrupedRestPlan";
import { QuadrupedCarriage } from "../../animals/quadruped/QuadrupedCarriage";
import { AutoMovieArchetypeDog } from "../../animals/AutoMovieArchetypeDog";
import { AutoMovieArchetypeHorse } from "../../animals/AutoMovieArchetypeHorse";
import { AutoMovieArchetypeQuadruped } from "../../animals/AutoMovieArchetypeQuadruped";
import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core/index";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";

/*
 * Draw canonical dog and saddle-horse authored rest cycles.
 *
 * The two-second transitions, one-second hold, horizontal resting tail and
 * distal carriage are presentation choices, not measured greyhound timings.
 * Ordinary producers build the dog with its authored collar/lead and the
 * short-stirrup saddle horse. Its torso pitch aligns the trunk/rear capsule
 * axes for floor support; it is not a measured horse rest angle. Their rest
 * samples supply geometry, contacts and terminal goals; no second sampling or
 * second root placement supplies marks.
 * Returns: Dog/horse rest subjects with declared goals, current geometry and
 * cycle events.
 */
export function archetypeCaptureRest(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const dog: ReturnType<typeof AutoMovieArchetypeDog.create> = AutoMovieArchetypeDog.create({
    ...AutoMovieArchetypeDog.REFERENCE,
    cohort: "pet",
    tempo: 0,
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  });
  const params: Omit<
    AutoMovieArchetypeQuadrupedRestPlan.IParams,
    "parts" | "contacts" | "folded"
  > = {
    floorY: 0,
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch: 0,
    tailDirection: -90,
    windows: {
      body: { startShare: 0, endShare: 1 },
      fore: { startShare: 0, endShare: 1 },
      hind: { startShare: 0, endShare: 1 },
    },
  };
  const dogCarriers: ReturnType<typeof QuadrupedCarriage.of> =
    QuadrupedCarriage.of(dog, AutoMovieArchetypeQuadruped.species(dog));
  const clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    AutoMovieArchetypeDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = AutoMovieArchetypeQuadrupedRest.plan(dog, {
    ...params,
    ...dogCarriers,
    folded: {
      fore: { thirdDegrees: -120, fourthDegrees: -50 },
      hind: { thirdDegrees: -95, fourthDegrees: 80 },
    },
    parts: { ...dogCarriers.parts, leftEar: "head", rightEar: "head" },
  });
  const horse: ReturnType<typeof AutoMovieArchetypeHorse.create> = AutoMovieArchetypeHorse.create({
    tack: "saddle",
    withersHeight: AutoMovieArchetypeEquine.JENSEN.withers,
    stirrupDrop: AutoMovieArchetypeHorse.BANDS.stirrupDrop.minimum,
    tempo: 0,
  });
  const front: IAutoMovieVector3 = axisEnd(horse, "trunk");
  const rear: IAutoMovieVector3 = axisEnd(horse, "hindquarters");
  const carriers: ReturnType<typeof QuadrupedCarriage.of> =
    QuadrupedCarriage.of(horse, AutoMovieArchetypeQuadruped.species(horse));
  const horseClip: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = AutoMovieArchetypeQuadrupedRest.plan(horse, {
    ...params,
    ...carriers,
    folded: {
      fore: { thirdDegrees: -110, fourthDegrees: 5 },
      hind: { thirdDegrees: -105, fourthDegrees: 55 },
    },
    restPitch: (Math.atan2(front.y - rear.y, front.z - rear.z) * 180) / Math.PI,
  });
  return {
    "rest-dog": subject("dog", dog, clip),
    "rest-horse": subject("horse", horse, horseClip),
  };
}

/*
 * Capsule-axis low end supplies a geometric torso-support pitch, without a
 * species pose preset.
 */
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

/*
 * Preserve one sample for both drawing and its independently observable
 * terminal goals.
 */
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
