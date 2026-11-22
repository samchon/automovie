import {
  type AutoMovieArchetype,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedLateralRest,
  AutoMovieArchetypeQuadrupedRest,
  type AutoMovieArchetypeQuadrupedRestPlan,
  createDog,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../internal/animalTerminalSole";
import { archetypeRestObservation } from "../internal/archetypeRestObservation";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * Actual dog and horse geometry lowers onto its trunk support and rises again.
 *
 * Scenarios:
 * 1. A canonical pet dog with authored collar and a saddle horse with admitted
 *    short stirrups and a torso-support pitch complete a bounded 33-time cycle
 *    and its support events. Horse pitch aligns the actual front/rear capsule
 *    axes on the floor; it is a geometric constraint, not measured behavior.
 *    Four actual bars keep their lengths and shared-root origins; terminal
 *    footprints stay fixed and actual soles and all rendered vertices clear
 *    the declared floor. The resting trunk touches it and standing recovers.
 * 2. Current source contact ids, semantics and carrier-local frames survive;
 *    source bytes stay unchanged, output transforms are independent, and
 *    unordered seeking reproduces the same actual geometry.
 * 3. Translating the floor translates the result; nontrivial authored windows
 *    produce their declared support events without inventing clinical timing.
 * 4. Malformed clocks/carriage/windows, incomplete carriers, invalid sample
 *    times and an actual one-millimetre upper-bar contradiction are refused.
 * 5. An untacked horse rolls onto each flank and rises, with mirrored actual
 *    surface and limb support, complete floor clearance and continuous
 *    attachment to the first grounded hoof step. Saddle collision refuses.
 *
 * Ellis et al. 2018 (doi:10.3389/fbioe.2018.00162) supports the symmetrical
 * belly-lying, fixed-footprint greyhound study condition. The two-second
 * transitions, one-second hold, horizontal resting tail and distal carriage
 * below are authored geometric choices. No measured ROM, GRF, clinical
 * hip/knee/ankle timing or sternal no-slip material point is asserted.
 * The lateral roll and inward tuck are authored in the actual equine rig.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists actual body/tack choices, all bounded successful and refusal cases, independent mesh/contact measurements and the distinction between primary-study context and authored performance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public actual producers and rest sampler, measures their current bars, source contacts and renderer-owned primitive vertices, and requires complete successful dog/horse cycles. The actual untacked roll and ride departure make their flank and hoof geometry observable.
 * @evidence contracts/development/testing.md#independent-expectations Euclidean link lengths, rigid placement invariance, fixed X/Z footprints, zero sole/trunk floor gaps and unchanged carrier-local contact coordinates follow from the declared geometry contract. Render tessellation supplies an independent vertex path; the terminal cylinder rim is also measured analytically so polygon sampling cannot hide its true sole. The 1e-9 m/rotation budget is numerical observation precision, not an allowed authored contact gap.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts dog and larger horse, lowering/hold/rise, beginning/recovered standing, current/rest contacts, translated support, nontrivial windows, unordered seeks, independent returned transforms and finite malformed/unreachable inputs. Species gait and clinical validation remain outside this geometric unit.
 * @evidence contracts/development/testing.md#execution-ownership A portable synchronous unit owns the actual in-memory models, bounded sample/vertex loops and local negative cases.
 */
export function test_archetype_animal_rest(): void {
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
  const horse: ReturnType<typeof createHorse> = createHorse({
    tack: "saddle",
    withersHeight: 1.72,
    stirrupDrop: 0.575,
    tempo: 0,
  });
  const dogParams: AutoMovieArchetypeQuadrupedRestPlan.IParams = {
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

  // The horse's rear capsule axis is lower than its trunk axis. One rigid
  // torso pitch aligns their actual low ends; lowering it level would put
  // the rear capsule below the floor while the trunk first reaches support.
  const foreSupport: IAutoMovieVector3 = archetypeRestObservation.endpoint(
    horse.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "trunk",
    )!,
    1,
  );
  const rearSupport: IAutoMovieVector3 = archetypeRestObservation.endpoint(
    horse.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "hindquarters",
    )!,
    1,
  );
  const horseParams: AutoMovieArchetypeQuadrupedRestPlan.IParams = {
    ...dogParams,
    restPitch:
      (Math.atan2(
        foreSupport.y - rearSupport.y,
        foreSupport.z - rearSupport.z,
      ) *
        180) /
      Math.PI,
    parts: {
      withers: "trunk",
      saddle: "trunk",
      pommel: "trunk",
      cantle: "trunk",
      "leather-left": "trunk",
      "leather-right": "trunk",
      "stirrup-left": "trunk",
      "stirrup-right": "trunk",
      "rein-left": "head",
      "rein-right": "head",
      mane: "trunk",
      lead: "head",
      leftEar: "head",
      rightEar: "head",
      jaw: "head",
      lip: "head",
      leftNostril: "head",
      rightNostril: "head",
    },
    contacts: {
      seat: "trunk",
      pommel: "trunk",
      cantle: "trunk",
      leftStirrup: "trunk",
      rightStirrup: "trunk",
      leftRein: "head",
      rightRein: "head",
      mane: "trunk",
      lead: "head",
    },
  };
  const cases: readonly {
    name: string;
    animal: AutoMovieArchetype;
    params: AutoMovieArchetypeQuadrupedRestPlan.IParams;
  }[] = [
    { name: "dog", animal: dog, params: dogParams },
    { name: "horse", animal: horse, params: horseParams },
  ];
  for (const entry of cases)
    archetypeRestObservation.verify(entry.name, entry.animal, entry.params);

  const bare: ReturnType<typeof createHorse> = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const bareParams: AutoMovieArchetypeQuadrupedRestPlan.IParams = {
    ...horseParams,
    parts: {
      withers: "trunk",
      leftEar: "head",
      rightEar: "head",
      jaw: "head",
      lip: "head",
      leftNostril: "head",
      rightNostril: "head",
    },
    contacts: {},
  };
  TestValidator.equals(
    "untacked horse exposes no equipment contacts",
    bare.affordances.length,
    0,
  );
  for (const side of ["left", "right"] as const) {
    TestValidator.error(
      `admission refuses first contact on ${side} saddle gear`,
      () =>
        AutoMovieArchetypeQuadrupedLateralRest(horse, horseParams, {
          side,
          rollDegrees: 90,
          tuckDegrees: 35,
          turnSeconds: 1,
          holdSeconds: 0.8,
          offset: 0.08,
        }),
    );
    const roll: ReturnType<
      typeof AutoMovieArchetypeQuadrupedLateralRest<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      >
    > = AutoMovieArchetypeQuadrupedLateralRest(bare, bareParams, {
      side,
      rollDegrees: 90,
      tuckDegrees: 35,
      turnSeconds: 1,
      holdSeconds: 0.8,
      offset: 0.08,
    });
    const seconds: number = roll.events.lateralOn + 0.4;
    const sampled: ReturnType<typeof roll.sample> = roll.sample(seconds);
    const returned: ReturnType<typeof roll.sample> = roll.sample(
      roll.events.standing,
    );
    const target: IAutoMovieVector3 = Quaternion.rotateVector(
      sampled.placement.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const body: number = Math.min(
      ...sampled.animal.parts
        .filter(
          (part: IAutoMovieModelPart): boolean =>
            part.id === "trunk" || part.id === "hindquarters",
        )
        .map((part: IAutoMovieModelPart): number =>
          animalTerminalSole(part, sampled.placement),
        ),
    );
    const support: Set<string> = new Set();
    for (let step: number = 0; step <= 12; step++) {
      const pose: ReturnType<typeof roll.sample> = roll.sample(
        roll.events.rollStart +
          ((roll.events.sternal - roll.events.rollStart) * step) / 12,
      );
      const low: number = Math.min(
        ...pose.animal.parts.map((part: IAutoMovieModelPart): number => {
          const shape: IAutoMovieModelPart["geometry"] = part.geometry;
          if (shape.type === "primitive" && shape.shape.type === "sphere")
            return (
              AutoMovieArchetypeFrame.point(
                pose.placement,
                part.transform!.translation,
              ).y - shape.shape.radius
            );

          // A box, such as an ear plate, reaches down by each half-extent times its local axis's vertical share.
          if (shape.type === "primitive" && shape.shape.type === "box") {
            const frame: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
              pose.placement,
              part.transform!,
            );
            const down = (axis: IAutoMovieVector3, half: number): number =>
              Math.abs(Quaternion.rotateVector(frame.rotation, axis).y) * half;
            return (
              frame.translation.y -
              down({ x: 1, y: 0, z: 0 }, shape.shape.width / 2) -
              down({ x: 0, y: 1, z: 0 }, shape.shape.height / 2) -
              down({ x: 0, y: 0, z: 1 }, shape.shape.depth / 2)
            );
          }
          return animalTerminalSole(part, pose.placement);
        }),
      );
      TestValidator.predicate(
        `${side} roll sample ${step} touches the floor without penetration`,
        () => Math.abs(low) < 1e-9,
      );
      if (step > 0 && step < 12 && pose.phase !== "lateral")
        pose.support.forEach((id: string): void => {
          support.add(id);
        });
    }
    TestValidator.predicate(
      `${side} rolling transfers support to the side limbs`,
      () => [...support].some((id: string): boolean => id.startsWith(side)),
    );
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const id: AutoMovieArchetypeQuadrupedBody.Bone =
        AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
      const bar: IAutoMovieModelPart = returned.animal.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === id,
      )!;
      const neutral: IAutoMovieModelPart = bare.parts.find(
        (part: IAutoMovieModelPart): boolean => part.id === id,
      )!;
      TestValidator.predicate(
        `${side} ${limb} restores the standing departure anchor`,
        vclose(
          archetypeRestObservation.endpoint(bar, 1),
          archetypeRestObservation.endpoint(neutral, 1),
          1e-8,
        ),
      );
    }
    TestValidator.predicate(
      `actual ${side} flank support and independent recovery`,
      () =>
        sampled.phase === "lateral" &&
        Math.sign(target.x) === (side === "left" ? 1 : -1) &&
        Math.abs(body) < 1e-9 &&
        sampled.support.some(
          (part: string): boolean =>
            part === "trunk" || part === "hindquarters",
        ) &&
        returned.phase === "standing" &&
        Math.abs(returned.placement.translation.x) < 1e-12 &&
        Math.abs(
          roll.sample(seconds).placement.translation.y -
            sampled.placement.translation.y,
        ) < 1e-12,
    );
  }

  const clip: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = AutoMovieArchetypeQuadrupedRest(dog, dogParams);
  const shifted: AutoMovieArchetypeQuadrupedRestPlan.ISample<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = AutoMovieArchetypeQuadrupedRest(dog, {
    ...dogParams,
    floorY: 0.25,
  }).sample(2.5);
  const resting: AutoMovieArchetypeQuadrupedRestPlan.ISample<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = clip.sample(2.5);
  for (let index: number = 0; index < resting.animal.parts.length; index++)
    TestValidator.predicate(
      "floor translation carries actual body",
      vclose(
        shifted.animal.parts[index]!.transform!.translation,
        Vector3.add(resting.animal.parts[index]!.transform!.translation, {
          x: 0,
          y: 0.25,
          z: 0,
        }),
        1e-9,
      ),
    );
  const windowed: AutoMovieArchetypeQuadrupedRestPlan.IClip<
    createDog.Affordance,
    AutoMovieArchetypeQuadrupedBody.Dimension
  > = AutoMovieArchetypeQuadrupedRest(dog, {
    ...dogParams,
    windows: { body: [0.1, 0.8], fore: [0.1, 0.8], hind: [0.1, 0.8] },
  });
  TestValidator.predicate(
    "authored window belly-on",
    nclose(windowed.events.bellyOn, 1.8, 1e-12),
  );
  TestValidator.predicate(
    "authored window belly-off",
    nclose(windowed.events.bellyOff, 3.2, 1e-12),
  );
  TestValidator.predicate(
    "authored window standing",
    nclose(windowed.events.standing, 4.6, 1e-12),
  );
  TestValidator.predicate(
    "pre-hold body window already supports belly",
    windowed.sample(1.9).bellySupported,
  );
  TestValidator.predicate(
    "zero hold has a supported transition boundary",
    AutoMovieArchetypeQuadrupedRest(dog, {
      ...dogParams,
      restingSeconds: 0,
    }).sample(2).bellySupported,
  );

  const invalid: readonly AutoMovieArchetypeQuadrupedRestPlan.IParams[] = [
    { ...dogParams, floorY: NaN },
    { ...dogParams, loweringSeconds: 0 },
    { ...dogParams, restingSeconds: -1 },
    { ...dogParams, risingSeconds: Infinity },
    { ...dogParams, restPitch: 90 },
    { ...dogParams, tailDirection: NaN },
    { ...dogParams, folded: { fore: [181, 0], hind: [-90, 0] } },
    { ...dogParams, folded: { fore: [90, 90], hind: [-90, 0] } },
    { ...dogParams, windows: { ...dogParams.windows, body: [0.5, 0.5] } },
    { ...dogParams, windows: { ...dogParams.windows, body: [NaN, 1] } },
    { ...dogParams, windows: { ...dogParams.windows, hind: [0, 1.1] } },
  ];
  for (const params of invalid)
    TestValidator.predicate(
      "malformed rest input refuses",
      archetypeRestObservation.refuses((): void => {
        AutoMovieArchetypeQuadrupedRest(dog, params);
      }),
    );
  for (const seconds of [-1, NaN, 5.001])
    TestValidator.predicate(
      "time outside the cycle refuses",
      archetypeRestObservation.refuses((): void => {
        clip.sample(seconds);
      }),
    );
  for (const params of [
    { ...dogParams, parts: {} },
    { ...dogParams, contacts: {} },
  ])
    TestValidator.predicate(
      "incomplete actual carrier map refuses",
      archetypeRestObservation.refuses((): void => {
        AutoMovieArchetypeQuadrupedRest(dog, params).sample(2.5);
      }),
    );

  // This actual source contradiction is deliberately not a biological model:
  // a 1 mm upper bar cannot span the existing shoulder-to-wrist geometry.
  const impossible: typeof dog = dog.reposed(
    dog.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (
        part.id !== "leftForeHumerus" ||
        part.geometry.type !== "primitive" ||
        part.geometry.shape.type !== "cylinder"
      )
        return part;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          shape: { ...part.geometry.shape, height: 0.001 },
        },
      };
    }),
  );
  TestValidator.predicate(
    "actual impossible geometry refuses instead of stretching",
    archetypeRestObservation.refuses((): void => {
      AutoMovieArchetypeQuadrupedRest(impossible, dogParams).sample(2.5);
    }),
  );
}
