import {
  AutoMovieArchetypeCourse as Course,
  AutoMovieArchetypeDog as Dog,
  AutoMovieArchetypeFrame as Frame,
  AutoMovieArchetypeQuadrupedJoints as Joints,
  AutoMovieArchetypeQuadruped as Quadruped,
  AutoMovieArchetypeQuadrupedBody as QuadrupedBody,
  AutoMovieArchetypeQuadrupedRest as Rest,
  AutoMovieArchetypeQuadrupedSkeleton as Skeleton,
  AutoMovieArchetypeTable as Table,
} from "@automovie/archetypes";
import {
  AutoMovieEngineKinematics,
  AutoMovieEngineMotionSampling,
  AutoMovieEnginePhysics,
  AutoMovieEngineQuaternion as Quaternion,
  AutoMovieEngineVector3 as Vector,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanChain as Chain,
  AutoMovieMotionHumanPerformance as Performance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { FamilyCaseKit } from "../../../../../../packages/motions/src/executable/cases/FamilyCaseKit";

type DogModel = ReturnType<typeof Dog.create>;

const DOG: Dog.IParams = { mass: 22, cohort: "pet", tempo: 0 };
const TACK: Dog.ICollar = {
  width: 0.02,
  thickness: 0.003,
  leadLength: 0.6,
  leadRadius: 0.004,
};
const SEED = "stock-canine-physical-lead";
const ROUNDING = 1e-9;
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * A dog pauses its courtyard walk when called and lowers onto its belly with
 * its paws at the stopped footprints. The alternate take has no response. A
 * handler holds the collared dog's real lead while it stands within reach. The
 * same dog walking beyond reach and the bare dog refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the called and still choices, the original paw positions, the supported rest and both contact refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the stock dog's timed walk, supported rest and head carrier from one placed cue. Reads its posed solids and original joins. Fits a human hand to the same named lead before a real walk along two supported benches, then exercises the bare and later unreachable cases.
 * @evidence contracts/development/testing.md#independent-expectations The 3-second call gives a belly hold from seconds 5 to 6 before standing at 8. Preserve all four stopped X/Z footprints, the placed trunk and the half-length shaft midpoint. The handler's sum of joint-centre lengths and palm offset bounds a target it later cannot reach.
 */
export function test_motions_canine_handler_response(): void {
  const dog: DogModel = Dog.create({ ...DOG, collar: TACK }, 43);
  const { body } = FamilyCaseKit.body("m-average");
  verifySettling(dog, body);
  verifyLead(dog, body);
}

function verifySettling(dog: DogModel, body: IAutoMovieMotionHumanBody): void {
  const ride = Quadruped.ride(
    dog,
    Course.timed("dog", [
      { seconds: 0, x: 0, z: -1.8 },
      { seconds: 3, x: 0, z: 0 },
      { seconds: 8, x: 0, z: 0 },
      { seconds: 11, x: 0, z: 1.8 },
    ]),
    "walk",
  );
  const film = new Performance({
    seed: SEED,
    performers: [handler(body, point(0.35, 0, 0.8))],
    cues: { courtyard: [{ name: "call", seconds: 3 }] },
    composition: Chain.subject("handler").stand({ hold: 11, sway: 0 }).node,
  });
  const call = film.instant({ of: "courtyard", event: "call" });
  const halt = ride.at(call);
  const model = halt.archetype;
  const attachments = carriers(model);
  const span = { startShare: 0, endShare: 1 };
  const rest = {
    ...attachments,
    floorY: -halt.placement.translation.y,
    loweringSeconds: 2,
    restingSeconds: 1,
    risingSeconds: 2,
    restPitch: 0,
    tailDirection: -90,
    folded: {
      fore: { thirdDegrees: -130, fourthDegrees: -40 },
      hind: { thirdDegrees: -95, fourthDegrees: 66 },
    },
    windows: { body: span, fore: span, hind: span },
  };
  let refused: boolean = false;
  try {
    Rest.plan(model, {
      ...rest,
      folded: {
        fore: { thirdDegrees: -120, fourthDegrees: -50 },
        hind: { thirdDegrees: -95, fourthDegrees: 80 },
      },
    }).sample(2.5);
  } catch (error: unknown) {
    refused =
      error instanceof RangeError && error.message.includes("rightForeRadius");
  }
  TestValidator.predicate(
    "the neutral fold refuses this planted fore stance",
    refused,
  );
  const clip = Rest.plan(model, rest);
  const haltedPaws = pawPoints(model, halt.placement);
  const left = ride.at(call + clip.events.standing);
  const joined = [
    { outside: halt, inside: clip.sample(0).animal },
    { outside: left, inside: clip.sample(clip.duration).animal },
  ];
  for (const { outside, inside } of joined) {
    const previous = Frame.compose(
      outside.placement,
      partFrame(outside.archetype, "trunk"),
    );
    const joinedTrunk = Frame.compose(
      halt.placement,
      partFrame(inside, "trunk"),
    );
    TestValidator.predicate(
      "the original gait and rest meet at the same paws and trunk",
      outside.course.speed === 0 &&
        pawPoints(inside, halt.placement).every(
          (paw, i) =>
            Vector.distance(
              paw,
              pawPoints(outside.archetype, outside.placement)[i]!,
            ) < ROUNDING,
        ) &&
        Vector.distance(previous.translation, joinedTrunk.translation) <
          ROUNDING &&
        Quaternion.angle(previous.rotation, joinedTrunk.rotation) < 1e-7,
    );
  }

  for (let i = 0; i <= 80; i++) {
    const local = i / 16;
    const shown = clip.sample(local);
    TestValidator.predicate(
      `the resting dog keeps its footprints and solid floor clearance at ${local}`,
      shown.floorClearance >= -ROUNDING &&
        pawPoints(shown.animal, halt.placement).every(
          (paw, p) =>
            Math.hypot(paw.x - haltedPaws[p]!.x, paw.z - haltedPaws[p]!.z) <
            ROUNDING,
        ),
    );
  }
  const played = (seconds: number, respond: boolean): DogModel => {
    if (!respond || seconds <= call || seconds >= call + clip.duration)
      return ride.at(seconds).archetype;
    const local = seconds - call;
    const posed = clip.sample(local).animal;
    const turn =
      AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, local / 0.35),
      ) *
      AutoMovieEngineMotionSampling.minimumJerkShare(
        Math.min(1, (clip.duration - local) / 0.35),
      );
    const rig = AutoMovieEngineKinematics.prepareArticulatedRig(
      Skeleton.of(posed),
    ).read();
    const head = rig.get("head")!;
    const changed = new Map(rig);
    changed.set("head", {
      ...head,
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(UP, 20 * turn),
        head.rotation,
      ),
    });
    return Skeleton.apply(
      posed,
      rig,
      changed,
      attachments.parts,
      attachments.contacts,
    );
  };
  const seconds = call + 2.5;
  const settled = clip.sample(2.5);
  const active = played(seconds, true);
  const still = played(seconds, false);
  const neutralHead = partFrame(settled.animal, "head").rotation;
  TestValidator.predicate(
    "the call chooses a supported look and settle or the unchanged pause",
    call + clip.events.bellyOn === 5 &&
      call + clip.events.riseStart === 6 &&
      call + clip.events.standing === 8 &&
      settled.bellySupported &&
      Math.abs(
        Quaternion.angle(neutralHead, partFrame(active, "head").rotation) -
          Math.PI / 9,
      ) < ROUNDING &&
      Quaternion.angle(
        partFrame(still, "head").rotation,
        partFrame(model, "head").rotation,
      ) < 1e-7 &&
      Vector.distance(
        partFrame(still, "trunk").translation,
        partFrame(model, "trunk").translation,
      ) < ROUNDING &&
      Vector.distance(
        active.affordance("lead").frame.translation,
        settled.animal.affordance("lead").frame.translation,
      ) < ROUNDING &&
      Vector.distance(
        partFrame(played(call - 0.2, true), "head").translation,
        partFrame(played(call - 0.2, false), "head").translation,
      ) < ROUNDING &&
      Vector.distance(
        ride.at(9).placement.translation,
        left.placement.translation,
      ) > 0.25,
  );
}

function verifyLead(dog: DogModel, body: IAutoMovieMotionHumanBody): void {
  const bench = Table.create({ kind: "workbench", height: 0.9 });
  const top = bench.affordance("top");
  const departure = 0.7;
  const ride = Quadruped.ride(
    dog,
    Course.timed("dog", [
      { seconds: 0, x: 0, z: 0 },
      { seconds: departure, x: 0, z: 0 },
      { seconds: 2.85, x: 0, z: 1.15 },
    ]),
    "walk",
  );
  const raised = Frame.upright(point(0, top.frame.translation.y, 0));
  const placement = (seconds: number): IAutoMovieRigidTransform =>
    rigid(Frame.compose(raised, ride.plan.at(seconds).placement));
  const contact = (seconds: number): IAutoMovieTransform =>
    Frame.compose(raised, ride.frame("lead", seconds));
  const leadSkin = (seconds: number): IAutoMovieVector3 =>
    Frame.point(contact(seconds), point(0, TACK.leadRadius, 0));
  const site = contact(0).translation;
  const person = handler(body, point(site.x + 0.24, 0, site.z - 0.31));
  const stands = Chain.subject("handler").stand({ hold: 2.85, sway: 0 });
  const supports = [0, top.width!].map((z, i) =>
    AutoMovieMotionHumanObject.prop(`platform${i}`, bench, {
      at: point(0, 0, z),
      yaw: 90,
      fixed: true,
    }),
  );
  const prop = AutoMovieMotionHumanObject.prop(
    "dog",
    ride.at(0).archetype,
    placement(0),
    placement,
    (_, seconds) => contact(seconds),
    undefined,
    (seconds) => ride.at(seconds).archetype,
  );
  const bare = AutoMovieMotionHumanObject.prop(
    "dog",
    Dog.create(DOG, 43),
    placement(0),
  );
  const prepare = (
    chain: typeof stands,
    shown: typeof prop = prop,
  ): Performance =>
    new Performance({
      seed: SEED,
      performers: [person],
      laws: [AutoMovieMotionHumanMount.leadHorse],
      props: [shown, ...supports],
      composition: chain.node,
      cues: { courtyard: [{ name: "call", seconds: 0.2 }] },
    });
  const grip = (duration: number): typeof stands =>
    stands.over((hand) =>
      hand.registered(
        "leadHorse",
        {
          on: "dog",
          hand: "right",
          duration,
          transition: 0.17,
        },
        "lead",
      ),
    );
  const take = prepare(grip(0.65));
  const t = take.instant({ of: "courtyard", event: "call" });
  const hand = take.bones("handler", t);
  const palm = body.surfaces.regions.palmRight;
  const placedPalm =
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      palm,
      hand.get(palm.bone)!,
    );
  const dogAtHold = ride.at(t).archetype;
  const shaft = dogAtHold.parts.find(({ id }) => id === "lead")!;
  const shaftShape =
    shaft.geometry.type === "primitive" ? shaft.geometry.shape : undefined;
  TestValidator.predicate(
    "the closed interval has the palm on the actual 600 mm lead",
    Math.abs(take.instant({ of: "lead", event: "leadOn" }) - 0.17) < ROUNDING &&
      Math.abs(take.instant({ of: "lead", event: "leadOff" }) - 0.48) <
        ROUNDING &&
      shaftShape?.type === "cylinder" &&
      Math.abs(shaftShape.height - 0.6) < ROUNDING &&
      Vector.distance(
        take.site("dog", "lead", t).position,
        contact(t).translation,
      ) < ROUNDING &&
      Vector.distance(
        Frame.point(
          Frame.compose(raised, ride.at(t).placement),
          shaft.transform!.translation,
        ),
        contact(t).translation,
      ) < ROUNDING &&
      Vector.distance(placedPalm, leadSkin(t)) <= 0.01,
  );

  const late = 2;
  const at = ride.at(late);
  const footIds = new Set<string>(
    QuadrupedBody.LIMBS.map((limb) => QuadrupedBody.BONES[limb][3]!),
  );
  const feet = at.archetype.shapes().filter(({ id }) => footIds.has(id));
  const bounds = feet.map((shape) =>
    AutoMovieEnginePhysics.physicalShapeBounds(placement(late), shape),
  );
  const shoulder = prepare(stands)
    .bones("handler", late)
    .get("rightUpperArm")!.worldPosition;
  const maximum =
    body.measure.upperArm +
    body.measure.forearm +
    Vector.length(palm.point) +
    0.01;
  TestValidator.predicate(
    "the moving dog still has grounded paws when the lead exceeds the arm length",
    bounds.length === 4 &&
      bounds.every(
        ({ min, max }) =>
          Math.abs(min.x) < top.depth! / 2 &&
          Math.abs(max.x) < top.depth! / 2 &&
          min.z > -top.width! / 2 &&
          max.z < (3 * top.width!) / 2 &&
          min.y >= top.frame.translation.y - ROUNDING,
      ) &&
      bounds.filter(
        ({ min }) => Math.abs(min.y - top.frame.translation.y) < 0.002,
      ).length >= 2 &&
      Vector.distance(leadSkin(late), shoulder) > maximum + 0.05,
  );
  for (const [label, axis, run] of [
    ["bare dog", "point", () => prepare(grip(0.65), bare)],
    [
      "late live lead",
      "leadReach",
      () => prepare(grip(2.5)).bones("handler", late),
    ],
  ] as const) {
    let refused: boolean = false;
    try {
      run();
    } catch (error: unknown) {
      refused =
        error instanceof AutoMovieMotionHumanRefusal && error.axis === axis;
    }
    TestValidator.predicate(`${label} refuses at ${axis}`, refused);
  }
}

function handler(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanPerformer {
  return {
    subject: "handler",
    body,
    at,
    yaw: 0,
    proficiency: { level: "trained" },
  };
}

function partFrame(model: DogModel, id: string): IAutoMovieTransform {
  return model.parts.find((part) => part.id === id)!.transform!;
}

function pawPoints(
  model: DogModel,
  at: IAutoMovieTransform,
): IAutoMovieVector3[] {
  return Object.values(Joints.read(model.parts).limbs).map((limb) =>
    Frame.point(at, limb[4]!),
  );
}

function rigid(transform: IAutoMovieTransform): IAutoMovieRigidTransform {
  return { position: transform.translation, rotation: transform.rotation };
}

function carriers(model: DogModel) {
  const bones = new Set<string>(
    Skeleton.of(model).bones.map(({ bone }) => bone),
  );
  const nodding = new Set(Quadruped.species(model).nodding);
  const parts = Object.fromEntries(
    model.parts
      .filter(({ id }) => !bones.has(id))
      .map(({ id }) => {
        const carrier: QuadrupedBody.Bone = id.endsWith("Ear")
          ? "head"
          : nodding.has(id)
            ? "neck"
            : "trunk";
        return [id, carrier];
      }),
  );
  return { parts, contacts: { lead: "neck" as const } };
}
