import { createCannon, createLongTool } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The working point keeps to the bore's axis within this, metres. */
const AXIS: number = 0.01;
/** The working point reaches the bore's bottom within this, metres. */
const HOME: number = 0.01;
/** The carrying hand returns to its entry grip within this, metres. */
const GRIP: number = 0.005;
/** Readings across the operation. */
const READS: number = 48;

/**
 * A sponge and rammer driven down a field gun's bore to its full depth and
 * drawn out (#3718), `operate`'s long insertion: deeper than one grip
 * reaches, so the hands regrip along the staff and the body steps toward
 * the muzzle and back.
 *
 * Scenarios, on both bodies:
 * 1. The rammer head reaches the bore's bottom, the depth the muzzle
 *    declares, and comes back to the mouth.
 * 2. It keeps to the bore's axis throughout.
 * 3. The carrying hand slides along the staff by more than a hand's breadth
 *    and ends on the grip it took.
 * 4. The take passes the shipped verdicts, feet and hands included.
 * 5. Refused, once: a depth the staff cannot reach, and an insertion that
 *    names no depth into a socket that declares none.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scenarios and the tolerances.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp and operate through HumanPerformance and reads the displayed rammer and hands.
 * @evidence contracts/development/testing.md#independent-expectations The bore's length and axis are the gun's own marks; the tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases In against out, reachable against unreachable depth, declared against undeclared socket depth, both bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_operate_long_insert(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    try {
      ram(body, name, checks);
    } catch (error) {
      checks.check(
        `${name} ram refused: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("long insert");
}

/** The gun, its bore's mouth and axis, and the rammer for one body. */
function stage(body: IAutoMovieMotionHumanBody): IStage {
  const gun: ReturnType<typeof createCannon> = createCannon({
    kind: "fieldGun",
  });
  const staff: ReturnType<typeof createLongTool> = createLongTool({
    kind: "spongeRammer",
  });
  // The gun points to the performer's left (+X): its muzzle on the right,
  // the staff running out of it across before the body, a forearm ahead of
  // the chest, the carrying right hand holding nearer the mouth.
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const grip: number = Vector3.distance(
    staff.affordance("shaft").frame.translation,
    staff.affordance("rammer").frame.translation,
  );
  const local: IAutoMovieVector3 = gun.affordance("muzzle").frame.translation;
  const ahead: number = body.measure.chestDepth / 2 + body.measure.forearm;
  // The staff's grip, its head at the mouth, abeam of the right shoulder.
  const mouth: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth - grip,
    y: local.y,
    z: ahead,
  };
  const at: IAutoMovieVector3 = Vector3.subtract(
    mouth,
    Quaternion.rotateVector(turn, local),
  );
  const out: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(turn, gun.affordance("muzzle").frame.rotation),
    { x: 0, y: 1, z: 0 },
  );
  // The rammer lies before the right hip, its staff along +X, the rammer
  // head toward the gun.
  const lying: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    -90,
  );
  const held: IAutoMovieVector3 = {
    x: -body.measure.shoulderHalfWidth,
    y: body.measure.hipHeight + 0.1,
    z: ahead / 2,
  };
  return {
    staff,
    mouth,
    out,
    depth: gun.affordance("muzzle").depth!,
    props: [
      everydayTake.prop("gun", gun, at, turn, true),
      everydayTake.prop(
        "rammer",
        staff,
        Vector3.subtract(
          held,
          Quaternion.rotateVector(
            lying,
            staff.affordance("shaft").frame.translation,
          ),
        ),
        lying,
      ),
    ],
  };
}

/** The ram, in and out, with its checks. */
function ram(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage(body);
  const chain: (
    depth?: number,
    point?: string,
  ) => IAutoMovieMotionHumanChain = (
    depth?: number,
    point: string = "muzzle",
  ): IAutoMovieMotionHumanChain =>
    HumanChain.subject("actor")
      .stand()
      .pickUp({ prop: "rammer", handle: "shaft", hand: "right", lift: 0.05 })
      .operate({
        hand: "right",
        kind: {
          kind: "insert",
          prop: "rammer",
          tip: "rammer",
          into: { kind: "prop", subject: "gun", point },
          ...(depth === undefined ? {} : { depth }),
          withdraw: true,
        },
      });
  const take: HumanPerformance = everydayTake.perform(
    `long-insert-${label}`,
    body,
    s.props,
    chain(),
    Object.values(HUMAN_LEXICON).flat(),
  );
  everydayTake.clean(label, take);
  const work: IAutoMovieMotionHumanSegment = take
    .segments("actor")
    .find(
      (g: IAutoMovieMotionHumanSegment): boolean => g.law.name === "operate",
    )!;
  let deepest: number = -Infinity;
  let off: number = 0;
  let least: number = Infinity;
  let most: number = -Infinity;
  const along: (t: number) => number = (t: number): number => {
    const hand: IAutoMovieResolvedBone = take
      .bones("actor", t)
      .get("rightHand")!;
    const site: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, "right", "grip").point,
      ),
    );
    const head: IAutoMovieVector3 = everydayTake.point(
      take,
      s.staff,
      "rammer",
      "rammer",
      t,
    );
    return Vector3.distance(site, head);
  };
  for (let i: number = 0; i <= READS; ++i) {
    const t: number = work.start + ((work.end - work.start) * i) / READS;
    const head: IAutoMovieVector3 = everydayTake.point(
      take,
      s.staff,
      "rammer",
      "rammer",
      t,
    );
    const from: IAutoMovieVector3 = Vector3.subtract(head, s.mouth);
    const depth: number = -Vector3.dot(from, s.out);
    deepest = Math.max(deepest, depth);
    if (depth > 0)
      off = Math.max(
        off,
        Vector3.length(Vector3.subtract(from, Vector3.scale(s.out, -depth))),
      );
    const a: number = along(t);
    least = Math.min(least, a);
    most = Math.max(most, a);
  }
  const end: IAutoMovieVector3 = everydayTake.point(
    take,
    s.staff,
    "rammer",
    "rammer",
    work.end,
  );
  checks.check(
    `${label}: the rammer head reaches the bore's bottom (${deepest.toFixed(3)} of ${s.depth.toFixed(3)} m) and returns to the mouth`,
    Math.abs(deepest - s.depth) <= HOME &&
      Math.abs(Vector3.dot(Vector3.subtract(end, s.mouth), s.out)) <= HOME,
  );
  checks.check(
    `${label}: the rammer keeps to the bore's axis (${(off * 1000).toFixed(1)} mm)`,
    off <= AXIS,
  );
  checks.check(
    `${label}: the carrying hand slides along the staff and ends on its grip`,
    most - least > everydayTake.BREADTH * body.measure.hand &&
      Math.abs(along(work.end) - along(work.start)) <= GRIP,
  );
  // Refusals are checked once, on the first body.
  if (!label.startsWith("m-average")) return;
  const short: HumanRefusal | undefined = everydayTake.refusal(() =>
    everydayTake.perform(
      `long-insert-${label}-short`,
      body,
      s.props,
      chain(3),
      Object.values(HUMAN_LEXICON).flat(),
    ),
  );
  checks.check(
    `${label}: a depth beyond the staff is refused`,
    short !== undefined && short.kind === "reach",
  );
  const undeclared: HumanRefusal | undefined = everydayTake.refusal(() =>
    everydayTake.perform(
      `long-insert-${label}-undeclared`,
      body,
      s.props,
      chain(undefined, "vent"),
      Object.values(HUMAN_LEXICON).flat(),
    ),
  );
  checks.check(
    `${label}: an insertion with no depth into a socket that declares none is refused`,
    undeclared !== undefined && undeclared.kind === "parameter",
  );
}

/** The staged gun and rammer. */
interface IStage {
  /** The rammer's model. */
  staff: ReturnType<typeof createLongTool>;

  /** The bore's mouth, world metres. */
  mouth: IAutoMovieVector3;

  /** The bore's outward axis, world. */
  out: IAutoMovieVector3;

  /** The bore's declared depth, metres. */
  depth: number;

  /** The props. */
  props: IAutoMovieMotionHumanProp[];
}
