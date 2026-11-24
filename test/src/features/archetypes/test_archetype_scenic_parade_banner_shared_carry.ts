import {
  createScenicParadeBanner,
  createZipperPouch,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanSharedCarry,
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Two performers carry the archetype's single rigid panel by its two poles.
 *
 * Scenarios:
 *
 * 1. Stage an already-held, 1.8 m wide panel with the two grips 0.45 m above its
 *    base. A shared carry moves this prop 35 mm forward in one second.
 * 2. Read the displayed hand bones at the start, midpoint and end. Each grip
 *    center stays within 15 mm of its own authored moving pole axis.
 * 3. A prop with actual internal articulation still refuses steady rigid carry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the panel geometry, translation, sampling and grip bound.
 * @evidence contracts/development/testing.md#behavioral-verification Gives the real banner to the shared carry and reads displayed bones from HumanPerformance.
 * @evidence contracts/development/testing.md#independent-expectations Calculates the expected pole sites from fixed authored dimensions and translation, independent of prop points and planner output.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite pole positions distinguish the two carriers, and the translation exceeds the grip bound.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory plan for each carrier and three displayed time samples.
 */
export function test_archetype_scenic_parade_banner_shared_carry(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ready: IAutoMovieMotionHumanPosture = readyGrip(
    body,
    Vector3.create(0, 0, 0),
  );
  const initialHand: IAutoMovieVector3 = HumanHand.frame(
    body,
    poseBones(body, resolveHumanPosture(body, ready)),
    "left",
    "grip",
  ).point;
  const origin: IAutoMovieVector3 = Vector3.create(
    0,
    initialHand.y - 0.45,
    initialHand.z,
  );
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    "banner",
    createScenicParadeBanner({ width: 1.8, poleHeight: 1.4, panelHeight: 0.5 }),
    { at: origin, yaw: 0 },
  );
  const carrier = (
    site: string,
    x: number,
  ): IAutoMovieMotionHumanSharedCarry.ICarrier => {
    const at: IAutoMovieVector3 = Vector3.create(x - initialHand.x, 0, 0);
    const posture: IAutoMovieMotionHumanPosture = readyGrip(body, at);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, posture),
    );
    return {
      performer: {
        subject: site,
        body,
        at,
        yaw: 0,
        proficiency: { level: "trained" },
      },
      side: "left",
      site,
      rotation: bones.get("leftHand")!.worldRotation,
      posture: (): IAutoMovieMotionHumanPosture => posture,
    };
  };
  const carriers: IAutoMovieMotionHumanSharedCarry.IInput["carriers"] = [
    carrier("leftGrip", -0.9),
    carrier("rightGrip", 0.9),
  ];
  const input: IAutoMovieMotionHumanSharedCarry.IInput = {
    prop,
    carriers,
    from: 0,
    to: 1,
    path: (seconds: number): IAutoMovieRigidTransform => ({
      position: Vector3.add(origin, Vector3.create(0, 0, 0.035 * seconds)),
      rotation: prop.frame.rotation,
    }),
  };
  TestValidator.predicate(
    "a model with actual articulation still refuses rigid carry",
    throwsError(
      () =>
        AutoMovieMotionHumanSharedCarry({
          ...input,
          prop: HumanObject.prop("zipper", createZipperPouch(), {
            at: origin,
            yaw: 0,
          }),
        }),
      "available rigid prop",
    ),
  );
  const prepared: IAutoMovieMotionHumanSharedCarry.IPrepared =
    AutoMovieMotionHumanSharedCarry(input);

  const laws: IAutoMovieMotionHumanActionLaw[] = ([0, 1] as const).map(
    (index: 0 | 1): IAutoMovieMotionHumanActionLaw => ({
      name: `banner-carry-${index}`,
      interrupts: {},
      plan: (): IAutoMovieMotionHumanActionPlan => ({
        duration: 1,
        events: [],
        contacts: [
          {
            part: "leftHand",
            kind: "grip",
            from: 0,
            to: 1,
            support: { kind: "prop", subject: prop.subject },
          },
        ],
        posture: prepared.postures[index],
      }),
    }),
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "banner-carry",
    performers: carriers.map(
      (
        actor: IAutoMovieMotionHumanSharedCarry.ICarrier,
      ): IAutoMovieMotionHumanSharedCarry.ICarrier["performer"] =>
        actor.performer,
    ),
    laws,
    composition: {
      kind: "parallel",
      parts: [
        HumanChain.subject(carriers[0].performer.subject).registered(
          laws[0]!.name,
          {},
        ).node,
        HumanChain.subject(carriers[1].performer.subject).registered(
          laws[1]!.name,
          {},
        ).node,
      ],
    },
    props: [prepared.prop],
  });

  for (const seconds of [0, 0.5, 1])
    for (const [subject, x] of [
      ["leftGrip", -0.9],
      ["rightGrip", 0.9],
    ] as const) {
      const expected: IAutoMovieVector3 = Vector3.create(
        x,
        origin.y + 0.45,
        origin.z + 0.035 * seconds,
      );
      const actual: IAutoMovieVector3 = HumanHand.frame(
        body,
        performance.bones(subject, seconds),
        "left",
        "grip",
      ).point;
      TestValidator.predicate(
        `${subject} stays on its pole at ${seconds} s`,
        nclose(Vector3.length(Vector3.subtract(actual, expected)), 0, 0.015),
      );
    }
}

/** A standing performer with a bent elbow and a closed hand ahead of the body. */
function readyGrip(
  body: IAutoMovieMotionHumanBody,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanPosture {
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, at, 0);
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, standing),
  ).get("leftUpperArm")!.worldPosition;
  return {
    ...standing,
    joints: { ...standing.joints, ...HumanHand.shape("left", "fist") },
    limbs: {
      ...standing.limbs,
      leftArm: {
        point: Vector3.add(shoulder, Vector3.create(0, -0.22, 0.32)),
        bend: Vector3.add(shoulder, Vector3.create(0, -1, 0)),
      },
    },
  };
}
