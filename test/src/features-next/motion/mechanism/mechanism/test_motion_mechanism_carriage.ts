import { createBag } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";

/**
 * The carriage band's top, a share of the body's mass: the carry contract's [0,
 * 0.25] (`IAutoMovieMotionHumanCarry`).
 */
const BAND: number = 0.25;

/** The original's load over the band, a share of the body's mass. */
const OVER: number = 0.4;

/** The child's seat lies on the yoke within this, read level, metres. */
const SEAT: number = 0.15;

/** A carrier's hand holds the child's shin within this, metres. */
const SHIN: number = 0.2;

/**
 * Carriage through real affordances (#3992).
 *
 * Scenarios, on m-average and f-small, each scene and its verdict gathering
 * their own results, so one failure hides no other check:
 *
 * 1. Airport arrival: a backpack is put on by its strap onto the back, both straps
 *    over the shoulders, and stays on its worn mount from its placing through
 *    the operation, the pickUp, a walk and a turn, then comes off by its strap;
 *    a suitcase's handle is drawn out and it is pulled through the turn, its
 *    wheels on the floor and the case behind the walker.
 * 2. A waiter's tray on the flat palm, with a bowl on it, raised and carried level
 *    through a walk and a turn, the palm under its centre as the walk starts
 *    and the bowl staying on it from the tray's pickUp to the end.
 * 3. A porter's tray load on the head stays on the crown from its placing through
 *    a walk, no hand on it, and still rests on the head at the end.
 * 4. A child rides the shoulders: seat on the yoke behind the neck, which faces
 *    up, the carrier's hands on the shins, lifted and set down with one coupled
 *    support throughout.
 * 5. A bag changes hands without being set down, both hands holding only briefly.
 *    A load over the carriage band is refused as a parameter on the load axis
 *    whose range ends at the band's top, and a load at the band's top is not.
 *    Every take passes the shipped verdicts, which include prop and body
 *    penetration: no backpack strap passes through an arm or the trunk.
 *
 * Each pickUp's grasp is `test_motion_action_pick_up`'s; whether a putDown on a
 * bone lands at its asked frame or is refused is
 * `test_motion_owner_out_of_reach`'s; a slider's drawn travel is
 * `test_motion_posture_hinge_drive`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the refusal and the goals other specs own.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, putDown on a bone, operate, workHeld, walk, release and the coupled carry, and reads displayed props and bones.
 * @evidence contracts/development/testing.md#independent-expectations The worn offsets and places are authored here (`carriageScene`); tolerances are named; the band is the carry contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases Worn against held, palm against head, a one-hand against a two-hand interval, a load over against at the band's top.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_mechanism_carriage(): void {
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
  checks.assert("carriage");
}

/** The take, its shipped verdicts gathered as one check. */
function play(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
  others: readonly everydayTake.IOther[] = [],
): HumanPerformance {
  const take: HumanPerformance = carriageScene.perform(
    label,
    body,
    props,
    chain,
    others,
  );
  try {
    everydayTake.clean(label, take);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  return take;
}

/** The film second of a segment's named event. */
function mark(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      )!.share
  );
}

/**
 * The airport arrival: backpack on, suitcase pulled through a turn, backpack
 * off.
 */
function arrival(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = play(
    checks,
    `${label} arrival`,
    body,
    a.props,
    carriageScene.doff(
      carriageScene.walks(
        carriageScene.pull(
          carriageScene.draw(
            carriageScene.don(HumanChain.subject("actor").stand(), a),
            a,
          ),
        ),
      ),
      body,
    ),
  );
  const walks: IAutoMovieMotionHumanSegment[] = carriageScene.named(
    take,
    "walk",
  );
  const donning: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "putDown",
  )[0]!;
  for (const side of ["left", "right"] as const) {
    const strap: IAutoMovieVector3 = everydayTake.point(
      take,
      a.pack,
      "pack",
      `${side}Strap`,
      donning.end,
    );
    const shoulder: IAutoMovieVector3 = take
      .bones("actor", donning.end)
      .get(`${side}UpperArm`)!.worldPosition;
    checks.check(
      `${label}: the ${side} strap passes over the ${side} shoulder`,
      Vector3.distance({ ...strap, y: 0 }, { ...shoulder, y: 0 }) <=
        carriageScene.STRAP,
    );
  }
  checks.check(
    `${label}: the backpack stays on its worn mount from its placing through the walk`,
    carriageScene.onBone(
      take,
      "chest",
      "pack",
      mark(donning, "placed"),
      walks[1]!.end,
    ) <= carriageScene.HOLD,
  );
  const towed: carriageScene.ITowed = carriageScene.towed(take, walks);
  checks.check(
    `${label}: the suitcase's wheels stay on the floor (${towed.wheels.toFixed(3)} m)`,
    towed.wheels <= carriageScene.FLOOR,
  );
  checks.check(
    `${label}: the suitcase tracks behind the walker through the turn`,
    towed.behind,
  );
  // Taken off: the grip lifts it off the back, and it rides the hand.
  const doff: IAutoMovieMotionHumanSegment = carriageScene
    .named(take, "pickUp")
    .at(-1)!;
  checks.check(
    `${label}: the backpack comes off by its strap`,
    carriageScene.onBone(take, "chest", "pack", doff.start, take.duration) >=
      carriageScene.OFF &&
      everydayTake.drift(take, "right", "pack", doff.end, take.duration) <=
        carriageScene.HOLD,
  );
}

/** A waiter's tray on the palm, level through a walk and a turn. */
function tray(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const take: HumanPerformance = play(
    checks,
    `${label} tray`,
    body,
    carriageScene.trayProps(),
    carriageScene
      .raise(carriageScene.lift(HumanChain.subject("actor").stand()), body)
      .walk({ to: { x: 0, y: 0, z: 1.5 } })
      .walk({ to: { x: -1.2, y: 0, z: 2.2 } }),
  );
  const walks: IAutoMovieMotionHumanSegment[] = carriageScene.named(
    take,
    "walk",
  );
  const frame: number = 1 / 24;
  let tilt: number = 0;
  for (let t: number = walks[0]!.start; t <= walks[1]!.end; t += frame)
    tilt = Math.max(tilt, carriageScene.tilt(take, "tray", t));
  checks.check(
    `${label}: the tray stays level (${tilt.toFixed(1)} degrees, ${carriageScene.tilt(take, "tray", walks[0]!.start).toFixed(1)} as the walk starts)`,
    tilt <= carriageScene.LEVEL,
  );
  const taken: number = carriageScene.named(take, "pickUp")[0]!.start;
  let slid: number = 0;
  for (let t: number = taken; t <= take.duration; t += frame)
    slid = Math.max(
      slid,
      Math.abs(carriageScene.bowl(take, t) - carriageScene.bowl(take, taken)),
    );
  checks.check(
    `${label}: the bowl stays on the tray from its pickUp (${(slid * 1000).toFixed(1)} mm)`,
    slid <= carriageScene.HOLD,
  );
  const palm: IAutoMovieVector3 = take
    .bones("actor", walks[0]!.start)
    .get("rightHand")!.worldPosition;
  const centre: IAutoMovieVector3 = take.prop("tray", walks[0]!.start).position;
  checks.check(
    `${label}: the palm stays under the tray's centre`,
    Vector3.distance({ ...palm, y: 0 }, { ...centre, y: 0 }) <=
      carriageScene.CENTRE && palm.y < centre.y,
  );
}

/** A basket carried on the head through a walk. */
function headLoad(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const h: carriageScene.IHeadLoad = carriageScene.headLoad(body);
  const take: HumanPerformance = play(
    checks,
    `${label} head load`,
    body,
    h.props,
    carriageScene
      .place(HumanChain.subject("actor").stand(), h)
      .walk({ to: { x: 0, y: 0, z: 2 } }),
  );
  const walk: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "walk",
  )[0]!;
  const placed: number = mark(
    carriageScene.named(take, "putDown")[0]!,
    "placed",
  );
  checks.check(
    `${label}: the basket's base stays on the crown from its placing through the walk`,
    carriageScene.onBone(take, "head", "basket", placed, walk.end) <=
      carriageScene.HOLD,
  );
  checks.check(
    `${label}: the basket rests on the head`,
    take.prop("basket", walk.end).position.y >
      take.bones("actor", walk.end).get("head")!.worldPosition.y,
  );
}

/** A child on the shoulders, lifted, carried and set down. */
function shoulders(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const take: HumanPerformance = play(
    checks,
    `${label} shoulders`,
    body,
    [],
    HumanChain.subject("actor")
      .stand({ hold: 0.3 })
      .registered("bearing", { carry: "shoulders", hold: 3 }),
    [
      {
        subject: "rider",
        body: motionHumanBody("f-small"),
        at: { x: 0, y: 0, z: -0.35 },
        yaw: 0,
        chain: HumanChain.subject("rider")
          .stand({ hold: 0.3 })
          .registered("borne", {
            partner: "actor",
            carry: "shoulders",
            hold: 3,
          }),
      },
    ],
  );
  const borne: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "borne",
    "rider",
  )[0]!;
  const middle: number = (borne.start + borne.end) / 2;
  // The yoke region, read on the carrier standing before the ride: it faces
  // up and lies behind the neck.
  const yoke: (t: number) => IYoke = (t: number): IYoke => {
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.yoke;
    const bone: IAutoMovieResolvedBone = take
      .bones("actor", t)
      .get(region.bone)!;
    return {
      point: Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, region.point),
      ),
      normal: Quaternion.rotateVector(bone.worldRotation, region.normal),
    };
  };
  const rest: IYoke = yoke(0.1);
  checks.check(
    `${label}: the carrier's yoke faces up and lies behind the neck`,
    rest.normal.y > Math.SQRT1_2 &&
      rest.point.z < take.bones("actor", 0.1).get("neck")!.worldPosition.z,
  );
  const seat: IAutoMovieVector3 = take
    .bones("rider", middle)
    .get("hips")!.worldPosition;
  const on: IAutoMovieVector3 = yoke(middle).point;
  checks.check(
    `${label}: the child's seat is on the carrier's yoke`,
    Vector3.distance({ ...seat, y: 0 }, { ...on, y: 0 }) <= SEAT &&
      seat.y > on.y,
  );
  for (const side of ["left", "right"] as const) {
    const hand: IAutoMovieVector3 = take
      .bones("actor", middle)
      .get(`${side}Hand`)!.worldPosition;
    const shin: IAutoMovieVector3 = take
      .bones("rider", middle)
      .get(`${side}LowerLeg`)!.worldPosition;
    checks.check(
      `${label}: the carrier's ${side} hand holds the child's shin`,
      Vector3.distance(hand, shin) <= SHIN,
    );
  }
}

/** A bag passed from hand to hand, and a load over the band refused. */
function changeHands(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const take: HumanPerformance = play(
    checks,
    `${label} change hands`,
    body,
    // Before the body, where either hand reaches its handles.
    [
      everydayTake.prop("tote", createBag({ id: "tote", kind: "tote" }), {
        x: 0,
        y: 0.7,
        z: 0.35,
      }),
    ],
    HumanChain.subject("actor")
      .stand()
      .pickUp({ prop: "tote", handle: "strap", hand: "right", lift: 0 })
      .pickUp({ prop: "tote", handle: "handle", hand: "left", lift: 0 })
      .release({ hand: "right" }),
  );
  const second: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "pickUp",
  )[1]!;
  const release: IAutoMovieMotionHumanSegment = carriageScene.named(
    take,
    "release",
  )[0]!;
  checks.check(
    `${label}: both hands hold only briefly`,
    release.end - second.end <= carriageScene.OVERLAP,
  );
  checks.check(
    `${label}: the left hand bears the bag after the change`,
    everydayTake.drift(take, "left", "tote", release.end, take.duration) <=
      carriageScene.HOLD,
  );
  let low: number = Infinity;
  for (let t: number = second.start; t <= take.duration; t += 1 / 24)
    low = Math.min(low, take.prop("tote", t).position.y);
  checks.check(
    `${label}: the bag is never set down`,
    low > carriageScene.CARRIED,
  );
  // A refusal is checked once, on the first body.
  if (!label.startsWith("m-average")) return;
  const heavy: HumanRefusal | undefined = carry(label, body, OVER);
  const range: IAutoMovieMotionHumanRefusal.Feasible | null =
    heavy?.feasible ?? null;
  checks.check(
    `${label}: a load over the carriage band is refused on the load axis, its range ending at ${BAND} (${describe(heavy)})`,
    heavy !== undefined &&
      heavy.kind === "parameter" &&
      heavy.axis === "load" &&
      range !== null &&
      range.kind === "range" &&
      range.maximum === BAND,
  );
  const top: HumanRefusal | undefined = carry(label, body, BAND);
  checks.check(
    `${label}: a load at the band's top is not refused (${describe(top)})`,
    top === undefined,
  );
}

/**
 * The refusal a one-hand carry two metres ahead throws, if any; a pose is read
 * so a refusal raised where the carry is resolved counts too.
 */
function carry(
  label: string,
  body: IAutoMovieMotionHumanBody,
  load: number,
): HumanRefusal | undefined {
  return everydayTake.refusal(() =>
    carriageScene
      .perform(
        `${label}-load-${load}`,
        body,
        [],
        HumanChain.subject("actor")
          .stand()
          .carry({ to: { x: 0, y: 0, z: 2 }, kind: "oneHand", load }),
      )
      .bones("actor", 1),
  );
}

/** A refusal's kind, axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.kind} on ${refused.axis}: ${refused.message}`;
}

/** A body region's world point and outward normal. */
interface IYoke {
  /** World metres. */
  point: IAutoMovieVector3;

  /** Outward unit normal. */
  normal: IAutoMovieVector3;
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

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "arrival", run: arrival },
  { label: "tray", run: tray },
  { label: "head load", run: headLoad },
  { label: "shoulders", run: shoulders },
  { label: "change hands", run: changeHands },
];
