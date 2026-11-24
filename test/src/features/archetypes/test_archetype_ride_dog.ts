import {
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedGait,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  createDog,
  createQuadruped,
  rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../internal/animalTerminalSole";

/**
 * The real dog factory and shared ride retain declared canine contact timing.
 *
 * Scenarios:
 *
 * 1. Every prototype uses Light et al. 2010's pooled 1.11 s stride, .62 s fore
 *    stance and .56 s hind stance at the tested .75 m/s, without invented
 *    reference-height scaling. Duties are ratios of means, not mean
 *    percentages.
 * 2. Griffin et al. 2004's 15% ipsilateral fore lag gives LF=0, RH=.35, RF=.5 and
 *    LH=.85; actual ride instants retain those rebased phases.
 * 3. Fore and hind lower control endpoints stay within 1 mm in world space during
 *    their own stance, including exact landing and its two sides. Hind
 *    endpoints move after .56 s, before .62 s. Exact landing and planted-ground
 *    checks use the entire actual terminal cylinder/capsule sole; the distal
 *    joint is not relabelled as its surface.
 * 4. At three off-grid times under translation/yaw, the moving lead contact
 *    remains at its actual rope centre. Unavailable gaits and speeds refuse.
 *
 * This tests a provisional kinematic prototype, not validated Husky dynamics,
 * paw-skin contact, measured clearance or anatomical joint-range compliance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the source conditions, four scenarios, numerical units and remaining physical gaps.
 * @evidence contracts/development/testing.md#behavioral-verification Calls createQuadruped and rideQuadruped and reads actual posed part endpoints, exact complete terminal primitive supports and published world contact frames. An elevated distal joint cannot hide a buried rim, and its necessary radius clearance is not misreported as a floating sole.
 * @evidence contracts/development/testing.md#independent-expectations Light et al. 2010 Table 1 supplies seconds and Griffin et al. 2004 supplies the ipsilateral phase; no producer table supplies expectations. No-slip and whole-solid ground support retain the existing 1 mm contract. Cylinder support is abs(axisY)*height/2+radius*hypot(axisX,axisZ), capsule support abs(axisY)*height/2+radius, subtracted from the actual world centre.
 * @evidence contracts/development/testing.md#distinguishing-cases Three cohorts, distinct fore/hind lift times, rebased footfall order, nonzero placement, off-grid queries and unsupported requests.
 * @evidence contracts/development/testing.md#execution-ownership In-memory public consumers only; no host, viewer or wall-time assertion.
 */
export function test_archetype_ride_dog(): void {
  const findings: string[] = [];
  const near: (
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ) => void = (
    label: string,
    actual: number,
    expected: number,
    bound: number,
  ): void => {
    if (!(Math.abs(actual - expected) <= bound))
      findings.push(
        `${label}: ${actual}, expected ${expected} within ${bound}`,
      );
  };
  const foot: <Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    seconds: number,
    bone?: AutoMovieArchetypeQuadrupedBody.Bone,
  ) => IAutoMovieVector3 = <Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
    seconds: number,
    bone: AutoMovieArchetypeQuadrupedBody.Bone = "leftForePastern",
  ): IAutoMovieVector3 => {
    const sample: ReturnType<typeof ride.at> = ride.at(seconds);
    const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === bone,
    );
    if (
      part?.geometry.type !== "primitive" ||
      part.transform === null ||
      part.transform === undefined
    )
      throw new Error("the actual dog foot must be a placed primitive");
    const shape: typeof part.geometry.shape = part.geometry.shape;
    if (shape.type !== "cylinder" && shape.type !== "capsule")
      throw new Error("the actual dog foot must be a rod");
    const endpoint: IAutoMovieVector3 = Vector3.add(
      part.transform.translation,
      Quaternion.rotateVector(part.transform.rotation, {
        x: 0,
        y: shape.height / 2,
        z: 0,
      }),
    );
    return AutoMovieArchetypeFrame.point(sample.placement, endpoint);
  };
  for (const cohort of ["pet", "show", "sled"] as const) {
    const animal: ReturnType<typeof createQuadruped> = createQuadruped({
      kind: "dog",
      cohort,
      mass: 22,
      tempo: 0,
    });
    const species: createQuadruped.ISpecies = createQuadruped.species(animal);
    const timing: AutoMovieArchetypeQuadrupedGait.ITiming =
      AutoMovieArchetypeQuadrupedGait.timing(
        species,
        "walk",
        0.75,
        0,
        animal.dimensions.withersHeight!,
      );
    near(`${cohort} pooled stride`, timing.stride, 1.11, 1e-12);
    near(`${cohort} pooled fore duty`, timing.duty, 0.62 / 1.11, 1e-12);
    if (timing.hindDuty === undefined)
      findings.push(
        `${cohort}: separately measured hind contact was discarded`,
      );
    else
      near(`${cohort} pooled hind duty`, timing.hindDuty, 0.56 / 1.11, 1e-12);
    const ride: AutoMovieArchetypeRide.IRide<
      createQuadruped.Affordance,
      createQuadruped.Dimension
    > = rideQuadruped<createQuadruped.Affordance, createQuadruped.Dimension>(
      animal,
      {
        start: { x: 0, z: 0, heading: 0 },
        legs: [{ kind: "straight", length: 6 }],
        cruise: 0.75,
        startSpeed: 0.75,
        endSpeed: 0.75,
      },
      "walk",
    );
    const on: readonly { seconds: number; label: string }[] =
      ride.instants.filter(
        (i: { seconds: number; label: string }): boolean =>
          i.label === "leftForeOn" && i.seconds > 1 && i.seconds < 6,
      );
    if (on.length < 2)
      findings.push(`${cohort}: no complete actual stride was published`);
    for (let k: number = 1; k < on.length; k++)
      near(
        `${cohort} actual stride`,
        on[k]!.seconds - on[k - 1]!.seconds,
        1.11,
        1e-8,
      );
    for (const landing of on) {
      const landed: IAutoMovieVector3 = foot(ride, landing.seconds);
      const before: IAutoMovieVector3 = foot(ride, landing.seconds - 1e-6);
      const after: IAutoMovieVector3 = foot(ride, landing.seconds + 1e-6);
      near(
        `${cohort} exact fore solid landing`,
        sole(ride, landing.seconds),
        0,
        1e-3,
      );
      near(
        `${cohort} fore landing from swing`,
        Vector3.length(Vector3.subtract(before, landed)),
        0,
        1e-3,
      );
      near(
        `${cohort} fore landing into stance`,
        Vector3.length(Vector3.subtract(after, landed)),
        0,
        1e-3,
      );
      const early: IAutoMovieVector3 = foot(ride, landing.seconds + 0.062);
      const late: IAutoMovieVector3 = foot(ride, landing.seconds + 0.496);
      near(`${cohort} planted x`, late.x, early.x, 1e-3);
      near(`${cohort} planted y`, late.y, early.y, 1e-3);
      near(`${cohort} planted z`, late.z, early.z, 1e-3);
      near(
        `${cohort} planted solid ground`,
        sole(ride, landing.seconds + 0.496),
        0,
        1e-3,
      );
    }
    const phaseCases: readonly (readonly [
      `${AutoMovieArchetypeQuadrupedBody.Limb}On`,
      number,
    ])[] = [
      ["rightHindOn", 0.35],
      ["rightForeOn", 0.5],
      ["leftHindOn", 0.85],
    ];
    const base: { seconds: number; label: string } | undefined = on[0];
    if (base !== undefined)
      for (const [label, phase] of phaseCases) {
        const next: { seconds: number; label: string } | undefined =
          ride.instants.find(
            (i: { seconds: number; label: string }): boolean =>
              i.label === label && i.seconds > base.seconds,
          );
        if (next === undefined) findings.push(`${cohort}: missing ${label}`);
        else
          near(
            `${cohort} ${label} phase`,
            next.seconds - base.seconds,
            phase * 1.11,
            1e-8,
          );
      }
    for (const limb of ["leftHind", "rightHind"] as const) {
      const hind: readonly { seconds: number; label: string }[] =
        ride.instants.filter(
          (i: { seconds: number; label: string }): boolean =>
            i.label === `${limb}On` && i.seconds > 1 && i.seconds < 6,
        );
      if (hind.length === 0)
        findings.push(`${cohort}: no actual ${limb} contact`);
      for (const landing of hind) {
        const landed: IAutoMovieVector3 = foot(
          ride,
          landing.seconds,
          `${limb}Pastern`,
        );
        const before: IAutoMovieVector3 = foot(
          ride,
          landing.seconds - 1e-6,
          `${limb}Pastern`,
        );
        const after: IAutoMovieVector3 = foot(
          ride,
          landing.seconds + 1e-6,
          `${limb}Pastern`,
        );
        near(
          `${cohort} ${limb} exact solid landing`,
          sole(ride, landing.seconds, `${limb}Pastern`),
          0,
          1e-3,
        );
        near(
          `${cohort} ${limb} landing from swing`,
          Vector3.length(Vector3.subtract(before, landed)),
          0,
          1e-3,
        );
        near(
          `${cohort} ${limb} landing into stance`,
          Vector3.length(Vector3.subtract(after, landed)),
          0,
          1e-3,
        );
        const early: IAutoMovieVector3 = foot(
          ride,
          landing.seconds + 0.056,
          `${limb}Pastern`,
        );
        const late: IAutoMovieVector3 = foot(
          ride,
          landing.seconds + 0.448,
          `${limb}Pastern`,
        );
        near(
          `${cohort} ${limb} planted`,
          Vector3.length(Vector3.subtract(late, early)),
          0,
          1e-3,
        );
        near(
          `${cohort} ${limb} whole solid ground`,
          sole(ride, landing.seconds + 0.448, `${limb}Pastern`),
          0,
          1e-3,
        );
        const released: IAutoMovieVector3 = foot(
          ride,
          landing.seconds + 0.59,
          `${limb}Pastern`,
        );
        if (!(Vector3.length(Vector3.subtract(released, late)) > 1e-3))
          findings.push(
            `${cohort}: ${limb} incorrectly retained .62 s fore stance`,
          );
      }
    }
  }
  const dressed: ReturnType<typeof createDog> = createDog({
    mass: 22,
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  });
  const led: AutoMovieArchetypeRide.IRide<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = rideQuadruped<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  >(
    dressed,
    {
      start: { x: 2, z: -1, heading: 31 },
      legs: [{ kind: "straight", length: 3 }],
      cruise: 0.75,
      startSpeed: 0.75,
      endSpeed: 0.75,
    },
    "walk",
  );
  for (const seconds of [0.37, 1.13, 2.31]) {
    const sample: ReturnType<typeof led.at> = led.at(seconds);
    const rope: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === "lead",
    );
    if (rope?.transform === null || rope?.transform === undefined)
      findings.push("the shared dog ride lost its physical lead");
    else {
      const centre: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
        sample.placement,
        rope.transform.translation,
      );
      near(
        "moving lead contact follows actual rope",
        Vector3.length(
          Vector3.subtract(led.frame("lead", seconds).translation, centre),
        ),
        0,
        1e-12,
      );
    }
  }
  const species: createQuadruped.ISpecies = createQuadruped.species(dressed);
  const refusals: readonly (() => unknown)[] = [
    (): unknown => AutoMovieArchetypeQuadrupedGait.of(species, "canter"),
    (): unknown => AutoMovieArchetypeQuadrupedGait.timing(species, "walk", 1),
  ];
  for (const refuse of refusals) {
    let error: unknown = null;
    try {
      refuse();
    } catch (caught) {
      error = caught;
    }
    if (!(error instanceof AutoMovieArchetypeRefusal))
      findings.push(
        "an unsupported dog gait request did not explicitly refuse",
      );
  }
  TestValidator.equals("the actual dog ride and contact timing", findings, []);
}

/**
 * The whole actual terminal surface must touch ground; its distal joint need
 * not.
 */
function sole<Id extends string, D extends string>(
  ride: AutoMovieArchetypeRide.IRide<Id, D>,
  seconds: number,
  bone: AutoMovieArchetypeQuadrupedBody.Bone = "leftForePastern",
): number {
  const sample: ReturnType<typeof ride.at> = ride.at(seconds);
  const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === bone,
  );
  if (part === undefined) throw new Error(`Missing actual terminal ${bone}`);
  return animalTerminalSole(part, sample.placement);
}
