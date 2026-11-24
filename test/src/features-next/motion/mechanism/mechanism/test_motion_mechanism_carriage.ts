import {
  createBag,
  createBowl,
  createServingTray,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON, HumanPropFrame } from "@automovie/motions/internal";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** A worn or held prop drifts at most this on its carrier, metres. */
const HOLD: number = 0.005;
/** A tray's surface stays within this of level, degrees. */
const LEVEL: number = 10;
/** Wheels on the floor within this, metres. */
const FLOOR: number = 0.02;
/** A strap lies over its shoulder within this, metres. */
const STRAP: number = 0.1;
/** A hand change's two-handed overlap lasts at most this, seconds. */
const OVERLAP: number = 1.5;
/** Turned half round: a bag's back toward a wearer facing `+Z`. */
const BEHIND: IAutoMovieQuaternion = { x: 0, y: 1, z: 0, w: 0 };

/**
 * Carriage through real affordances (#3992).
 *
 * Scenarios, on m-average and f-small:
 * 1. Airport arrival: a backpack is put on by its strap onto the back,
 *    both straps over the shoulders, and stays on its worn mount through a
 *    walk and a turn, then comes off by its strap; a suitcase's handle is
 *    drawn out and it is pulled through the turn, its wheels on the floor
 *    and the case behind the walker.
 * 2. A waiter's tray on the flat palm, with a bowl on it, carried level
 *    through a walk and a turn, the bowl staying on it.
 * 3. A porter's tray load on the head stays on the crown through a walk,
 *    no hand on it.
 * 4. A child rides the shoulders: seat on the yoke behind the neck, which
 *    faces up, the carrier's hands on the shins, lifted and set down with one coupled support throughout.
 * 5. A bag changes hands without being set down, both hands holding only
 *    briefly. A load over the carriage band is refused.
 * Every take passes the shipped verdicts, which include prop and body
 * penetration: no backpack strap passes through an arm or the trunk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, putDown on a bone, operate, workHeld, walk, release and the coupled carry, and reads displayed props and bones.
 * @evidence contracts/development/testing.md#independent-expectations The worn offsets and places are authored here; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Worn against held, palm against head, a one-hand against a two-hand interval, a load within against over the band.
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

/** The take with the shipped verdicts. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
  others: readonly everydayTake.IOther[] = [],
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `carriage-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
    others,
  );
  everydayTake.clean(label, take);
  return take;
}

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
  subject: string = "actor",
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments(subject)
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** A prop's largest drift on a bone over a span. */
function onBone(
  take: HumanPerformance,
  bone: AutoMovieHumanoidBone,
  subject: string,
  from: number,
  to: number,
): number {
  const read: (t: number) => IAutoMovieRigidTransform = (
    t: number,
  ): IAutoMovieRigidTransform =>
    HumanPropFrame.relative(
      HumanPropFrame.bone(take.bones("actor", t).get(bone)!),
      take.prop(subject, t),
    );
  const rest: IAutoMovieRigidTransform = read(from);
  let most: number = 0;
  for (let i: number = 1; i <= 24; ++i)
    most = Math.max(
      most,
      Vector3.distance(
        read(from + ((to - from) * i) / 24).position,
        rest.position,
      ),
    );
  return most;
}

/** A bone-local frame that puts a prop at a world frame, read off a still standing body. */
function offsetOn(
  body: IAutoMovieMotionHumanBody,
  bone: "chest" | "head",
  world: (b: IAutoMovieResolvedBone) => IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const still: HumanPerformance = everydayTake.perform(
    "carriage-rest",
    body,
    [],
    HumanChain.subject("actor").stand({ hold: 0.2, sway: 0 }),
  );
  const b: IAutoMovieResolvedBone = still.bones("actor", 0.1).get(bone)!;
  return HumanPropFrame.relative(HumanPropFrame.bone(b), world(b));
}

/** The airport arrival: backpack on, suitcase pulled through a turn, backpack off. */
function arrival(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const pack = createBag({ id: "pack", kind: "backpack" });
  const case_ = createBag({ id: "case", kind: "suitcase" });
  const telescope: IAutoMovieAffordance = case_.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "telescope",
  )!;
  const worn: IAutoMovieRigidTransform = offsetOn(
    body,
    "chest",
    (b: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
      position: Vector3.add(b.worldPosition, { x: 0, y: -0.35, z: -0.2 }),
      rotation: BEHIND,
    }),
  );
  const props: IAutoMovieMotionHumanProp[] = [
    // Before the right shoulder, by the hand that takes it and swings it on
    // round that side.
    everydayTake.prop(
      "pack",
      pack,
      { x: -body.measure.shoulderHalfWidth, y: 0.75, z: 0.25 },
      BEHIND,
    ),
    // Standing ahead on the left, by the hand that draws and pulls it.
    everydayTake.prop("case", case_, { x: 0.2, y: 0, z: 0.4 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "pack", handle: "rightStrap", hand: "right", lift: 0 })
    .putDown({
      prop: "pack",
      on: { bone: "chest", offset: worn },
      hand: "right",
    })
    // Stooped to the case, the left hand draws its pull handle out and
    // takes it.
    .operate({
      hand: "left",
      kind: {
        kind: "slider",
        at: { kind: "prop", subject: "case", point: "telescope" },
        travel: telescope.travel!,
      },
    })
    .pickUp({ prop: "case", handle: "pull", hand: "left", lift: 0 })
    .walk({ to: { x: 0, y: 0, z: 1.5 } })
    .walk({ to: { x: 1.2, y: 0, z: 2.2 } })
    // Off the shoulder by its strap and swung round before the body.
    .pickUp({ prop: "pack", handle: "rightStrap", hand: "right", lift: 0 })
    .registered("workHeld", {
      prop: "pack",
      hand: "right",
      at: {
        out: body.measure.shoulderHalfWidth + 0.05,
        up: body.measure.hipHeight + 0.1,
        forward: 0.15,
      },
      duration: 0.6,
    });
  const take: HumanPerformance = play(`${label} arrival`, body, props, chain);
  const walks: IAutoMovieMotionHumanSegment[] = named(take, "walk");
  const donned: number = named(take, "putDown")[0]!.end;
  for (const side of ["left", "right"] as const) {
    const strap: IAutoMovieVector3 = everydayTake.point(
      take,
      pack,
      "pack",
      `${side}Strap`,
      donned,
    );
    const shoulder: IAutoMovieVector3 = take
      .bones("actor", donned)
      .get(`${side}UpperArm`)!.worldPosition;
    checks.check(
      `${label}: the ${side} strap passes over the ${side} shoulder`,
      Vector3.distance({ ...strap, y: 0 }, { ...shoulder, y: 0 }) <= STRAP,
    );
  }
  checks.check(
    `${label}: the backpack stays on its worn mount through the walk`,
    onBone(take, "chest", "pack", walks[0]!.start, walks[1]!.end) <= HOLD,
  );
  let wheels: number = 0;
  let behind: boolean = true;
  for (const walk of walks)
    for (let i: number = 0; i <= 12; ++i) {
      const t: number = walk.start + ((walk.end - walk.start) * i) / 12;
      const frame: IAutoMovieRigidTransform = take.prop("case", t);
      wheels = Math.max(wheels, Math.abs(frame.position.y));
      const hips: IAutoMovieResolvedBone = take.bones("actor", t).get("hips")!;
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        hips.worldRotation,
        { x: 0, y: 0, z: 1 },
      );
      behind &&=
        Vector3.dot(
          Vector3.subtract(frame.position, hips.worldPosition),
          forward,
        ) < 0.1;
    }
  checks.check(
    `${label}: the suitcase's wheels stay on the floor (${wheels.toFixed(3)} m)`,
    wheels <= FLOOR,
  );
  checks.check(
    `${label}: the suitcase tracks behind the walker through the turn`,
    behind,
  );
  // Taken off: the grip lifts it off the back, and it rides the hand.
  const doff: IAutoMovieMotionHumanSegment = named(take, "pickUp").at(-1)!;
  checks.check(
    `${label}: the backpack comes off by its strap`,
    onBone(take, "chest", "pack", doff.start, take.duration) >= 0.05 &&
      everydayTake.drift(take, "right", "pack", doff.end, take.duration) <=
        HOLD,
  );
}

/** A waiter's tray on the palm, level through a walk and a turn. */
function tray(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const board = createServingTray({ id: "tray" });
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("tray", board, { x: -0.3, y: 1.0, z: 0.3 }),
    {
      ...everydayTake.prop("bowl", createBowl({ id: "bowl" }), {
        x: -0.3,
        y: 1.01,
        z: 0.3,
      }),
      mounted: {
        prop: "tray",
        point: "rest",
        offset: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
      },
    },
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "tray", handle: "palm", hand: "right", lift: 0 })
    .registered("workHeld", {
      prop: "tray",
      hand: "right",
      at: {
        out: 0.2,
        // The palm just under shoulder height, the forearm level.
        up: body.measure.shoulderHeight - 0.1,
        forward: 0.25,
        level: true,
      },
      duration: 0.5,
    })
    .walk({ to: { x: 0, y: 0, z: 1.5 } })
    .walk({ to: { x: -1.2, y: 0, z: 2.2 } });
  const take: HumanPerformance = play(`${label} tray`, body, props, chain);
  const walks: IAutoMovieMotionHumanSegment[] = named(take, "walk");
  let tilt: number = 0;
  for (let t: number = walks[0]!.start; t <= walks[1]!.end; t += 1 / 24) {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      take.prop("tray", t).rotation,
      { x: 0, y: 1, z: 0 },
    );
    tilt = Math.max(tilt, (Math.acos(Math.min(1, up.y)) * 180) / Math.PI);
  }
  checks.check(
    `${label}: the tray stays level (${tilt.toFixed(1)} degrees, ${(
      (Math.acos(
        Math.min(
          1,
          Quaternion.rotateVector(take.prop("tray", walks[0]!.start).rotation, {
            x: 0,
            y: 1,
            z: 0,
          }).y,
        ),
      ) *
        180) /
      Math.PI
    ).toFixed(1)} as the walk starts)`,
    tilt <= LEVEL,
  );
  const offset: (t: number) => number = (t: number): number =>
    Vector3.distance(
      take.prop("bowl", t).position,
      take.prop("tray", t).position,
    );
  checks.check(
    `${label}: the bowl stays on the tray`,
    Math.abs(offset(take.duration) - offset(walks[0]!.start)) <= HOLD,
  );
  const palm: IAutoMovieVector3 = take
    .bones("actor", walks[0]!.start)
    .get("rightHand")!.worldPosition;
  const centre: IAutoMovieVector3 = take.prop("tray", walks[0]!.start).position;
  checks.check(
    `${label}: the palm stays under the tray's centre`,
    Vector3.distance({ ...palm, y: 0 }, { ...centre, y: 0 }) <= 0.1 &&
      palm.y < centre.y,
  );
}

/** A basket carried on the head through a walk. */
function headLoad(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  // A porter's flat tray, the bundle's base, lifted by its end grip.
  const basket = createServingTray({ id: "basket" });
  const crown: IAutoMovieRigidTransform = offsetOn(
    body,
    "head",
    (b: IAutoMovieResolvedBone): IAutoMovieRigidTransform => ({
      position: Vector3.add(b.worldPosition, { x: 0, y: 0.18, z: 0 }),
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
  );
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("basket", basket, { x: 0.3, y: 0.9, z: 0.3 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "basket", handle: "rightHandle", hand: "right", lift: 0 })
    .putDown({
      prop: "basket",
      on: { bone: "head", offset: crown },
      hand: "right",
    })
    .walk({ to: { x: 0, y: 0, z: 2 } });
  const take: HumanPerformance = play(`${label} head load`, body, props, chain);
  const walk: IAutoMovieMotionHumanSegment = named(take, "walk")[0]!;
  checks.check(
    `${label}: the basket's base stays on the crown through the walk`,
    onBone(take, "head", "basket", walk.start, walk.end) <= HOLD,
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
  const rider: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand({ hold: 0.3 })
    .registered("bearing", { carry: "shoulders", hold: 3 });
  const take: HumanPerformance = play(`${label} shoulders`, body, [], chain, [
    {
      subject: "rider",
      body: rider,
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
  ]);
  const borne: IAutoMovieMotionHumanSegment = named(take, "borne", "rider")[0]!;
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
    Vector3.distance({ ...seat, y: 0 }, { ...on, y: 0 }) <= 0.15 &&
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
      Vector3.distance(hand, shin) <= 0.2,
    );
  }
}

/** A bag passed from hand to hand, and a load over the band refused. */
function changeHands(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const tote = createBag({ id: "tote", kind: "tote" });
  const props: IAutoMovieMotionHumanProp[] = [
    // Before the body, where either hand reaches its handles.
    everydayTake.prop("tote", tote, { x: 0, y: 0.7, z: 0.35 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "tote", handle: "strap", hand: "right", lift: 0 })
    .pickUp({ prop: "tote", handle: "handle", hand: "left", lift: 0 })
    .release({ hand: "right" });
  const take: HumanPerformance = play(
    `${label} change hands`,
    body,
    props,
    chain,
  );
  const second: IAutoMovieMotionHumanSegment = named(take, "pickUp")[1]!;
  const release: IAutoMovieMotionHumanSegment = named(take, "release")[0]!;
  checks.check(
    `${label}: both hands hold only briefly`,
    release.end - second.end <= OVERLAP,
  );
  checks.check(
    `${label}: the left hand bears the bag after the change`,
    everydayTake.drift(take, "left", "tote", release.end, take.duration) <=
      HOLD,
  );
  let low: number = Infinity;
  for (let t: number = second.start; t <= take.duration; t += 1 / 24)
    low = Math.min(low, take.prop("tote", t).position.y);
  checks.check(`${label}: the bag is never set down`, low > 0.3);
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const heavy: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `carriage-${label}-heavy`,
        body,
        [],
        HumanChain.subject("actor")
          .stand()
          .carry({ to: { x: 0, y: 0, z: 2 }, kind: "oneHand", load: 0.4 }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: a load over the carriage band is refused`,
      heavy !== undefined,
    );
  }
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
