import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWrite,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";

const { write } = AutoMovieMotionHumanOperate;

/** Each leg of the authored test stroke is a centimetre long. */
const EDGE: number = 0.01;

/** The allowed writing-tip miss in #3446 and grip slip in #3447, metres. */
const BOUND: number = 0.001;

/**
 * Trace a right angle with the working point of a held stylus.
 *
 * The support's affordance turns the authored polyline a quarter turn in
 * world. Its origin is offset from the poised tip. The contact oracle is
 * the resulting world polyline, written from the translated quarter-turn.
 *
 * Scenarios:
 *
 * 1. The tip reaches both edge midpoints and the corner in four equal
 *    time intervals after contacting the surface.
 * 2. The tool still holds its rigid offset through the trace and return.
 * 3. The same nib is refused when its frame rides a separate mechanism.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the angled stroke, rigid grip and moving-nib refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Registers and performs the write law, then observes the displayed tip and grip in the same performance.
 * @evidence contracts/development/testing.md#independent-expectations At the temporal midpoint of each equal edge, a symmetric progress profile has covered half the edge. The quarter-turn geometry gives each target independently of the writer. The two issue bounds constrain contact miss and grip slip.
 * @evidence contracts/development/testing.md#distinguishing-cases A translated, rotated writing affordance and an angled polyline distinguish the surface frame from world axes and a single straight reach. A mechanically moving nib is refused.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory performance and one planned arm trajectory on a polygon man. No host or capture.
 */
export function test_motion_operate_write(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const initial: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, at, 0);
  const fingers: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
    "right",
    "fist",
  );
  const carrying: IAutoMovieMotionHumanPosture = {
    ...initial,
    joints: { ...initial.joints, ...fingers },
  };
  const placed: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture(body, carrying));
  const wrist: IAutoMovieResolvedBone = placed.get("rightHand")!;
  const tip: IAutoMovieVector3 = { x: 0, y: -body.measure.hand, z: 0 };
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    placed,
    "right",
    "grip",
  ).point;
  const start: IAutoMovieVector3 = Vector3.add(grip, tip);
  const pen: IAutoMovieMotionHumanProp = {
    subject: "pen",
    frame: { position: grip, rotation: Quaternion.identity() },
    points: {},
    affordances: [
      {
        id: "nib",
        kind: "surface",
        frame: { ...Transform.identity(), translation: tip },
        extent: null,
      },
    ],
  };
  const translation: IAutoMovieVector3 = { x: EDGE, y: 0, z: 0 };
  const paper: IAutoMovieMotionHumanProp = {
    subject: "paper",
    fixed: true,
    frame: {
      position: start,
      rotation: Quaternion.identity(),
    },
    points: {},
    affordances: [
      {
        id: "sheet",
        kind: "surface",
        frame: {
          ...Transform.identity(),
          translation,
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        },
        extent: null,
      },
    ],
  };
  const held: IAutoMovieMotionHumanActionLaw<never> = {
    name: "poisePen",
    interrupts: {},
    plan: (): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      contacts: [],
      events: [],
      holds: [{ side: "right", prop: "pen", from: 0, fingers }],
      posture: (): IAutoMovieMotionHumanPosture => carrying,
    }),
  };
  const params: IAutoMovieMotionHumanWrite = {
    tool: "pen",
    tip: "nib",
    on: "paper",
    surface: "sheet",
    stroke: [
      [0, 0],
      [0, -EDGE],
      [-EDGE, -EDGE],
    ],
    duration: 0.6,
  };
  const run = (
    tool: IAutoMovieMotionHumanProp,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "held-stroke",
      laws: [held, write],
      performers: [
        {
          subject: "scribe",
          body,
          at,
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [tool, paper],
      composition: HumanChain.subject("scribe")
        .registered("poisePen")
        .registered("write", params).node,
    });
  const performance: IAutoMovieMotionHumanPerformance = run(pen);
  const scene: IAutoMovieMotionHumanSegment = performance
    .segments("scribe")
    .at(-1)!;
  const strokeStart: number =
    scene.start +
    scene.plan.duration *
      scene.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "strokeStart",
      )!.share;
  const strokeEnd: number =
    scene.start +
    scene.plan.duration *
      scene.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === "strokeEnd",
      )!.share;
  const strokeSeconds: number = strokeEnd - strokeStart;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(wrist.worldRotation);
  const seat: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(grip, wrist.worldPosition),
  );
  const offsets: readonly (readonly [number, number])[] = [
    [0, 0],
    [-EDGE / 2, 0],
    [-EDGE, 0],
    [-EDGE, EDGE / 2],
    [-EDGE, EDGE],
  ];

  // A +90 degree turn about +Y takes local -Z to world -X and local -X to +Z.
  for (const [index, offset] of [...offsets, null].entries()) {
    const seconds: number =
      offset === null
        ? scene.start + scene.plan.duration
        : strokeStart + (index * strokeSeconds) / (offsets.length - 1);
    const prop: IAutoMovieRigidTransform = performance.prop("pen", seconds);
    if (offset !== null) {
      const [x, z]: readonly [number, number] = offset;
      const point: IAutoMovieVector3 = Vector3.add(
        prop.position,
        Quaternion.rotateVector(prop.rotation, tip),
      );
      const expected: IAutoMovieVector3 = Vector3.add(start, {
        x: translation.x + x,
        y: 0,
        z,
      });
      TestValidator.predicate(
        `working point is within 1 mm at stroke sample ${index}`,
        nclose(Vector3.length(Vector3.subtract(point, expected)), 0, BOUND),
      );
    }

    if (index !== 2 && offset !== null) continue;
    const hand: IAutoMovieResolvedBone = performance
      .bones("scribe", seconds)
      .get("rightHand")!;
    const worldToHand: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const carried: IAutoMovieVector3 = Quaternion.rotateVector(
      worldToHand,
      Vector3.subtract(prop.position, hand.worldPosition),
    );
    TestValidator.predicate(
      "the pen keeps the same grip through the trace and return",
      nclose(Vector3.length(Vector3.subtract(carried, seat)), 0, BOUND) &&
        qclose(Quaternion.multiply(worldToHand, prop.rotation), inverse),
    );
  }

  const riding: NonNullable<IAutoMovieMotionHumanProp["affordances"]> = [
    { ...pen.affordances![0]!, rides: "slide" },
    {
      id: "slide",
      kind: "slider",
      frame: Transform.identity(),
      extent: null,
      travel: EDGE,
    },
  ];
  let refusal: unknown;
  try {
    run({
      ...pen,
      affordances: riding,
      articulate: (): IAutoMovieMotionHumanProp.IPosed => ({
        affordances: riding,
      }),
    }).segments("scribe");
  } catch (error: unknown) {
    refusal = error;
  }
  TestValidator.predicate(
    "an articulated nib is refused",
    refusal instanceof HumanRefusal &&
      refusal.kind === "affordance" &&
      refusal.axis === "tip",
  );
}
