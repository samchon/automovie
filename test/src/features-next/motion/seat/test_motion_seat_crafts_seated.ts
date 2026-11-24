import {
  createCraftTool,
  createPotteryWheel,
  createSeat,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A working point lies on its surface within this, metres. */
const ON: number = 0.005;
/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** A palm stays on the clay wall within this, metres. */
const PALM: number = 0.03;

/**
 * Seated crafts (#3996): knitting and throwing pottery; the standing ones
 * are `test_motion_mechanism_crafts`'s.
 *
 * Scenarios, on m-average and f-small:
 * 1. Knitting: seated, the right needle's tip enters the left needle's
 *    stitch and takes it, both hands holding their needles.
 * 2. Pottery: seated at the wheel, both palms stay on the clay wall as it
 *    rises monotonically on the turning head.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Composes sit, pickUp, write and throwPottery and reads displayed tool tips, surfaces, palms and articulation states.
 * @evidence contracts/development/testing.md#independent-expectations The stitch surface is the archetype's; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Needle against wheel work, start against risen wall.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_seat_crafts_seated(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("seated crafts");
}
/** The take with the shipped verdicts. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `crafts-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
  );
  everydayTake.clean(label, take);
  return take;
}

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments("actor")
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** A point in a surface's frame: its offset along the surface's X, normal and Z. */
function local(
  take: HumanPerformance,
  model: IAutoMovieMotionHumanPropModel,
  subject: string,
  surface: string,
  world: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  const site: IAutoMovieAffordance = model.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === surface,
  )!;
  const frame: IAutoMovieRigidTransform = take.prop(subject, t);
  const origin: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, site.frame.translation),
  );
  return Quaternion.rotateVector(
    Quaternion.inverse(
      Quaternion.multiply(frame.rotation, site.frame.rotation),
    ),
    Vector3.subtract(world, origin),
  );
}

/** A prop model with its affordances. */
type IAutoMovieMotionHumanPropModel = Parameters<typeof HumanObject.prop>[1];

/** Knitting: the right needle takes a stitch off the left one. */
function knitting(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
    fixed: true,
  } as const;
  const left = createCraftTool({ id: "leftNeedle", kind: "knittingNeedle" });
  const right = createCraftTool({ id: "rightNeedle", kind: "knittingNeedle" });
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("chair", chair, placement),
    // Each needle lies pointing across the lap toward the other hand.
    everydayTake.prop(
      "leftNeedle",
      left,
      { x: 0.25, y: 0.7, z: 0.15 },
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    ),
    everydayTake.prop(
      "rightNeedle",
      right,
      { x: -0.25, y: 0.7, z: 0.15 },
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    ),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: HumanObject.seat(chair, placement), hold: 1 })
    .pickUp({ prop: "leftNeedle", handle: "grip", hand: "left", lift: 0.1 })
    .pickUp({ prop: "rightNeedle", handle: "grip", hand: "right", lift: 0.1 })
    .registered("workHeld", {
      prop: "leftNeedle",
      hand: "left",
      at: { out: 0.1, up: 0.72, forward: 0.28 },
      duration: 0.5,
    })
    .registered("workHeld", {
      prop: "rightNeedle",
      hand: "right",
      at: { out: 0.1, up: 0.76, forward: 0.28 },
      duration: 0.5,
    })
    .registered("write", {
      tool: "rightNeedle",
      tip: "tip",
      on: "leftNeedle",
      surface: "stitch",
      stroke: [
        [0, -0.01],
        [0, 0.01],
      ],
      duration: 0.5,
      hand: "right",
    });
  const take: HumanPerformance = play(`${label} knitting`, body, props, chain);
  const stitch: IAutoMovieMotionHumanSegment = named(take, "write")[0]!;
  const t: number = (stitch.start + stitch.end) / 2;
  const tip: IAutoMovieVector3 = everydayTake.point(
    take,
    right,
    "rightNeedle",
    "tip",
    t,
  );
  checks.check(
    `${label}: the right needle's tip enters the left needle's stitch`,
    Math.abs(local(take, left, "leftNeedle", "stitch", tip, t).y) <= ON,
  );
  checks.check(
    `${label}: both hands keep their needles`,
    everydayTake.drift(take, "left", "leftNeedle", stitch.start, stitch.end) <=
      HOLD &&
      everydayTake.drift(
        take,
        "right",
        "rightNeedle",
        stitch.start,
        stitch.end,
      ) <= HOLD,
  );
}

/** Pottery: both palms on the rising wall of the turning clay. */
function pottery(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = {
    at: { x: 0, y: 0, z: -0.3 },
    yaw: 0,
    fixed: true,
  } as const;
  const wheel = createPotteryWheel({ id: "wheel" });
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("chair", chair, placement),
    // Turned so the wall's working faces are on the potter's side, and a
    // thigh's length ahead of the chair: a potter sits with the wheel head
    // over the knees, between the legs, so its distance follows the body.
    everydayTake.prop(
      "wheel",
      wheel,
      { x: 0, y: 0, z: placement.at.z + body.measure.thigh },
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      true,
    ),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: HumanObject.seat(chair, placement), hold: 1 })
    .registered("throwPottery", { wheel: "wheel", duration: 2 });
  const take: HumanPerformance = play(`${label} pottery`, body, props, chain);
  const pull: IAutoMovieMotionHumanSegment = named(take, "throwPottery")[0]!;
  let rise: number = -1;
  let monotone: boolean = true;
  const palms: readonly IPalm[] = [
    { side: "right", face: "outside" },
    { side: "left", face: "inside" },
  ];
  const from: number = pull.start + ((pull.end - pull.start) * 3) / 24;
  // A wall face where the rise puts it, read in closed form: the face rides
  // the wheel's `raise` slider, straight up its axis.
  const face: (id: IPalm["face"], t: number) => IAutoMovieVector3 = (
    id: IPalm["face"],
    t: number,
  ): IAutoMovieVector3 => {
    const site: IAutoMovieAffordance = wheel.affordance(id);
    const frame: IAutoMovieRigidTransform = take.prop("wheel", t);
    return Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        Vector3.add(site.frame.translation, {
          x: 0,
          y: take.state("wheel", t)["raise"] ?? 0,
          z: 0,
        }),
      ),
    );
  };
  const gap: (palm: IPalm, t: number) => number = (
    palm: IPalm,
    t: number,
  ): number =>
    Vector3.distance(
      take.bones("actor", t).get(`${palm.side}Hand`)!.worldPosition,
      face(palm.face, t),
    );
  let touch: number = 0;
  for (let i: number = 3; i <= 21; ++i) {
    const t: number = pull.start + ((pull.end - pull.start) * i) / 24;
    const raised: number = take.state("wheel", t)["raise"] ?? 0;
    monotone &&= raised >= rise - 1e-9;
    rise = raised;
    for (const palm of palms)
      touch = Math.max(touch, Math.abs(gap(palm, t) - gap(palm, from)));
  }
  checks.check(
    `${label}: the wall rises monotonically`,
    monotone && rise > 0.05,
  );
  checks.check(
    `${label}: both palms stay on the wall as it rises (${touch.toFixed(3)} m)`,
    touch <= PALM,
  );
  checks.check(
    `${label}: the head turns`,
    Math.abs(take.state("wheel", pull.end)["head"] ?? 0) > 360,
  );
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** A palm and the wall face it lies on. */
interface IPalm {
  /** The hand. */
  side: "left" | "right";

  /** The wheel's face. */
  face: "outside" | "inside";
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "knitting", run: knitting },
  { label: "pottery", run: pottery },
];
