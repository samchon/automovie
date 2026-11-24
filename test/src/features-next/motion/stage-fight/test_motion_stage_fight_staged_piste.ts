import { createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/** One weapon's bout: its blocking, the touches' targets and the scripted result. */
interface IBout {
  /** The weapon. */
  kind: Exclude<AutoMovieMotionHumanStageFight.HumanStagePiste.Kind, "kendo">;

  /** The first performer's lead foot. */
  lead: AutoMovieHumanSide;

  /** The first performer's approach from its on-guard line, metres. */
  distance: number;

  /** The region of the second the first performer's attack aims at. */
  attack: AutoMovieHumanoidRegion;

  /** The region of the first the second performer's answer aims at. */
  answer: AutoMovieHumanoidRegion;

  /** The scripted result. */
  result: AutoMovieMotionHumanStageFight.HumanStagePiste.Result;
}

/** A scoring touch: its action's anchor, the struck performer and the region it lands on. */
type Touch = readonly [
  anchor: string,
  struck: string,
  region: AutoMovieHumanoidRegion,
];

/** One bout per weapon, each with its own result, lead and approach. */
const BOUTS: readonly IBout[] = [
  {
    kind: "foil",
    lead: "right",
    distance: 1.2,
    attack: "chestLeft",
    answer: "chestRight",
    result: "first",
  },
  {
    kind: "epee",
    lead: "left",
    distance: 1.1,
    attack: "thighFrontRight",
    answer: "chestLeft",
    result: "first",
  },
  {
    kind: "sabre",
    lead: "right",
    distance: 1.3,
    attack: "shoulderRight",
    answer: "crown",
    result: "second",
  },
];

/**
 * The performers' opening separation, metres: the FIE piste's on-guard lines
 * stand 2 m either side of its centre line.
 */
const OPENING: number = 4;

/** The second performer's approach from its on-guard line, metres. */
const ANSWERING: number = 1;

/** Duration of each advance, seconds. */
const SECONDS: number = 0.6;

/** A touch lands within this of its target, metres: the blade strokes spec's bound. */
const TOUCH: number = 0.015;

/** Planted support and a held grip hold within this, metres. */
const HOLD: number = 0.005;

/** A foot settles on its mark within this, metres: the stage footwork spec's bound. */
const MARK: number = 0.008;

/**
 * A fencing bout per weapon from the piste's on-guard lines: both performers
 * close in advances of the weapon's footwork, the first attacks, and the
 * scripted result decides the exchange and is announced at the touch.
 *
 * Scenarios:
 * 1. The foil's lunge lands on the trunk and the epee's on the thigh, each
 *    scoring for the first; the sabre's cut is parried and the second's
 *    riposte cut lands, scoring for the second.
 * 2. Over the approach the first's lead foot leaves first while the rear
 *    holds, both feet settle the approach's distance forward and the pelvis
 *    follows; each performer keeps its blade's grip.
 * 3. The attacker recovers from the lunge to the stance it lunged from.
 * 4. The epee's double touch: both performers lunge at once, each blade
 *    following the other as it lunges, and both land at one instant, where
 *    the double is announced, and not once the counter lands later than the
 *    epee's 40 ms window.
 * 5. The rules refuse a double touch in foil, a foil touch on the thigh and
 *    a sabre touch below the waist, and admit an epee touch on the thigh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three weapons' bouts, their results, the approach, grip and recovery checks, the double touch and the rule refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public bout, samples both performers' displayed feet, pelvis and regions and the blades' displayed points and axes, and reads the announced result from the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The opening is the FIE's on-guard lines; the results and targets are script inputs; the valid targets and the 40 ms double-touch window are the FIE's; a touch lands within the blade strokes spec's 15 mm of its target region, a foot settles within the stage footwork spec's 8 mm and the planted foot and the grip hold within its 5 mm. Recovery returns the attacker's feet within the same 15 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Three weapons with different leads, approaches and results, a single, a parried and a double touch, whose two blades each follow a moving target, the window's inside and outside, and the adjacent inadmissible and admitted targets. Checks are at sampled instants, not swept.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory placement and pose sampling on canonical bodies and archetype props. No viewer or native host is invoked.
 */
export function test_motion_stage_fight_staged_piste(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const bout of BOUTS)
    try {
      play(body, bout, complaints);
    } catch (error) {
      complaints.list.push(`${bout.kind}: ${String(error)}`);
    }
  try {
    double(body, complaints);
  } catch (error) {
    complaints.list.push(`epee/both: ${String(error)}`);
  }
  rules(complaints);
  complaints.assert("Staged piste bouts");
}

/** A placed bout and its performance. */
interface IStaged {
  /** The composed bout. */
  placed: AutoMovieMotionHumanStageFight.HumanStagePiste.IPlaced;

  /** Its performance. */
  film: HumanPerformance;
}

/** Arm both performers on the on-guard lines, compose the bout and place it. */
function stage(body: IAutoMovieMotionHumanBody, bout: IBout): IStaged {
  const blade = createStageBladeProp({ kind: bout.kind, id: "blade" });
  const grip: IAutoMovieVector3 = blade.affordance("grip").frame.translation;

  // A thrusting point continues the forearm; the sabre's grip lies across
  // the palm (`IAutoMovieMotionHumanGraspUse`).
  const use: IAutoMovieMotionHumanGraspUse.IUse = {
    tip: "point",
    line: bout.kind === "sabre" ? "oblique" : "forearm",
  };
  const held = (
    subject: string,
    root: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanProp => {
    // The blade lies level before the right hand, its point ahead, so the
    // hand takes it with the point along the line, as the blade specs lay
    // their swords.
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      yaw,
    );
    const stature: number = body.measure.stature;
    return HumanObject.prop(`${subject}.blade`, blade, {
      position: Vector3.add(
        root,
        Quaternion.rotateVector(turn, {
          x: -0.1 * stature,
          y: 0.6 * stature,
          z: 0.18 * stature - grip.y,
        }),
      ),
      rotation: Quaternion.multiply(
        turn,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      ),
    });
  };
  const at: Readonly<Record<string, IAutoMovieVector3>> = {
    a: { x: 0, y: 0, z: 0 },
    b: { x: 0, y: 0, z: OPENING },
  };
  const take: AutoMovieMotionHumanStageFight.HumanStagePiste.ITake = {
    anchor: "bout",
    kind: bout.kind,
    first: {
      chain: HumanChain.subject("a").pickUp({
        prop: "a.blade",
        handle: "grip",
        hand: "right",
        use,
      }),
      direction: "forward",
      distance: bout.distance,
      lead: bout.lead,
      blade: "a.blade",
      target: { kind: "person", subject: "b", region: bout.attack },
    },
    second: {
      chain: HumanChain.subject("b").pickUp({
        prop: "b.blade",
        handle: "grip",
        hand: "right",
        use,
      }),
      direction: "forward",
      distance: ANSWERING,
      lead: "right",
      blade: "b.blade",
      target: { kind: "person", subject: "a", region: bout.answer },
    },
    duration: SECONDS,
    result: bout.result,
  };
  const placed: AutoMovieMotionHumanStageFight.HumanStagePiste.IPlaced =
    AutoMovieMotionHumanStageFight.HumanStagePiste.compose(take);
  const film: HumanPerformance = new HumanPerformance({
    seed: `piste-${bout.kind}-${bout.result}`,
    laws: [
      AutoMovieMotionHumanStageFight.stageBladeFootwork,
      ...Object.values(AutoMovieMotionHumanBlade.HumanBlade),
    ],
    performers: ["a", "b"].map((subject: string) => ({
      subject,
      body,
      at: at[subject]!,
      yaw: subject === "a" ? 0 : 180,
      proficiency: { level: "trained" as const },
    })),
    props: [held("a", at.a!, 0), held("b", at.b!, 180)],
    composition: placed.composition,
  });
  assertTakeClean(
    `piste ${bout.kind} ${bout.result} ${body.measure.stature}`,
    film,
  );
  return { placed, film };
}

/** The placed action of an anchor. */
function entry(
  film: HumanPerformance,
  anchor: string,
): IAutoMovieScheduleEntry | undefined {
  return film.schedule.entries.find(
    (row): boolean => row.intent.anchor === anchor,
  );
}

/**
 * How far a scoring touch lands from its region at its decisive instant:
 * a thrust's point, or for a cut the nearest place on the blade's axis.
 */
function missed(
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  bout: IBout,
  touch: Touch,
): number {
  const [anchor, struck, region] = touch;
  const action: IAutoMovieScheduleEntry | undefined = entry(film, anchor);
  if (action?.contact === undefined) return Number.POSITIVE_INFINITY;
  const point: IAutoMovieVector3 = createStageBladeProp({
    kind: bout.kind,
  }).affordance("point").frame.translation;
  const frame: IAutoMovieRigidTransform = film.prop(
    `${action.subject}.blade`,
    action.contact,
  );
  const tip: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, point),
  );
  const aimed: IAutoMovieVector3 = HumanSignature.region(
    HumanSignature.of(film, struck, body, struck === "a" ? 0 : 180),
    region,
    action.contact,
  );
  let gap: number = Vector3.distance(tip, aimed);
  if (bout.kind === "sabre")
    for (let share: number = 0; share <= 1; share += 0.01)
      gap = Math.min(
        gap,
        Vector3.distance(Vector3.lerp(frame.position, tip, share), aimed),
      );
  return gap;
}

/** Play one weapon's bout and check what it shows. */
function play(
  body: IAutoMovieMotionHumanBody,
  bout: IBout,
  complaints: motionComplaints.IGatherer,
): void {
  const { placed, film }: IStaged = stage(body, bout);
  const grip: IAutoMovieVector3 = createStageBladeProp({
    kind: bout.kind,
  }).affordance("grip").frame.translation;
  const label: string = `${bout.kind}/${bout.result}`;

  // 1. The announced result at the decisive instant of the scoring touch.
  const announced:
    | AutoMovieMotionHumanStageFight.HumanStagePiste.IAnnouncement
    | undefined = placed.announced(film.schedule);
  const touch: Touch =
    bout.result === "first"
      ? ["bout.attack", "b", bout.attack]
      : ["bout.reply", "a", bout.answer];
  const gap: number = missed(body, film, bout, touch);
  complaints.check(
    `${label}: ${touch[0]} lands ${gap} m from the ${touch[2]} and the result is announced there`,
    gap <= TOUCH &&
      announced?.result === bout.result &&
      nclose(announced.seconds, entry(film, touch[0])?.contact ?? Number.NaN),
  );

  // 2. The approach: the lead leaves first, the rear holds, both feet settle
  // the approach's distance forward and the pelvis follows.
  const count: number = Math.ceil(
    Math.max(bout.distance, ANSWERING) /
      AutoMovieMotionHumanStageFight.HumanStagePiste.ADVANCE,
  );
  const first: IAutoMovieScheduleEntry | undefined = entry(film, "bout.first");
  const last: IAutoMovieScheduleEntry | undefined = entry(
    film,
    count === 1 ? "bout.first" : `bout.${count - 1}.first`,
  );
  if (first === undefined || last === undefined) {
    complaints.list.push(`${label}: the approach was not placed`);
    return;
  }
  const sole = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 => {
    const foot: IAutoMovieResolvedBone = film
      .bones("a", seconds)
      .get(`${side}Foot`)!;
    return HumanFoot.point(body, side, "ball", {
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    });
  };
  const rear: AutoMovieHumanSide = bout.lead === "left" ? "right" : "left";
  const early: number = first.start + 0.27 * SECONDS;
  complaints.check(
    `${label}: the lead foot leaves first, the rear holds, both settle ${bout.distance} m ahead and the pelvis follows`,
    sole(bout.lead, early).z - sole(bout.lead, first.start).z > 0.02 &&
      Vector3.distance(sole(rear, early), sole(rear, first.start)) <= HOLD &&
      (["left", "right"] as const).every((side: AutoMovieHumanSide): boolean =>
        nclose(
          sole(side, last.end).z - sole(side, first.start).z,
          bout.distance,
          MARK,
        ),
      ) &&
      nclose(
        film.bones("a", last.end).get("hips")!.worldPosition.z -
          film.bones("a", first.start).get("hips")!.worldPosition.z,
        bout.distance,
        MARK,
      ),
  );

  // 3. The attacker recovers to the stance it attacked from.
  const attack: IAutoMovieScheduleEntry | undefined = entry(
    film,
    "bout.attack",
  );
  if (attack !== undefined)
    complaints.check(
      `${label}: the attacker recovers to its stance`,
      (["left", "right"] as const).every(
        (side: AutoMovieHumanSide): boolean =>
          Vector3.distance(sole(side, attack.end), sole(side, attack.start)) <=
          TOUCH,
      ),
    );

  // Each performer keeps its blade's grip through the bout.
  for (const subject of ["a", "b"] as const) {
    const gripped = (seconds: number): IAutoMovieVector3 => {
      const hand: IAutoMovieResolvedBone = film
        .bones(subject, seconds)
        .get("rightHand")!;
      const pose: IAutoMovieRigidTransform = film.prop(
        `${subject}.blade`,
        seconds,
      );
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(
          Vector3.add(
            pose.position,
            Quaternion.rotateVector(pose.rotation, grip),
          ),
          hand.worldPosition,
        ),
      );
    };
    complaints.check(
      `${label}: ${subject} keeps its grip`,
      Vector3.distance(gripped(first.start), gripped(film.schedule.duration)) <=
        HOLD,
    );
  }
}

/**
 * The epee's double touch: both lunge at once, each blade following the
 * other performer as it lunges, and both land at one instant, where the
 * double is announced, and not once the counter lands outside the window.
 */
function double(
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const bout: IBout = {
    kind: "epee",
    lead: "right",
    distance: 1.1,
    attack: "chestRight",
    answer: "chestRight",
    result: "both",
  };
  const { placed, film }: IStaged = stage(body, bout);
  const attack: IAutoMovieScheduleEntry | undefined = entry(
    film,
    "bout.attack",
  );
  const counter: IAutoMovieScheduleEntry | undefined = entry(
    film,
    "bout.counter",
  );
  const announced:
    | AutoMovieMotionHumanStageFight.HumanStagePiste.IAnnouncement
    | undefined = placed.announced(film.schedule);
  const gaps: readonly number[] = [
    missed(body, film, bout, ["bout.attack", "b", bout.attack]),
    missed(body, film, bout, ["bout.counter", "a", bout.answer]),
  ];
  complaints.check(
    `epee/both: both blades land, ${gaps.join(" and ")} m from their targets, at one instant announced as the double`,
    gaps.every((gap: number): boolean => gap <= TOUCH) &&
      attack?.contact !== undefined &&
      counter?.contact !== undefined &&
      nclose(attack.contact, counter.contact) &&
      announced?.result === "both" &&
      nclose(announced.seconds, attack.contact),
  );

  // A counter landing outside the window scores no double touch.
  const late: number =
    AutoMovieMotionHumanStageFight.HumanStagePiste.DOUBLE + 0.01;
  complaints.check(
    "epee/both: a counter later than the epee's window is not announced",
    placed.announced({
      ...film.schedule,
      entries: film.schedule.entries.map(
        (row): IAutoMovieScheduleEntry =>
          row === counter
            ? {
                ...row,
                contact: (row.contact ?? 0) + late,
                end: row.end + late,
              }
            : row,
      ),
    }) === undefined,
  );
}

/** The weapons' rules refuse off-target and double touches before placement. */
function rules(complaints: motionComplaints.IGatherer): void {
  const target = (region: AutoMovieHumanoidRegion): IAutoMovieMotionTarget => ({
    kind: "person",
    subject: "b",
    region,
  });
  const take = (
    kind: AutoMovieMotionHumanStageFight.HumanStagePiste.Kind,
    region: AutoMovieHumanoidRegion,
    result: AutoMovieMotionHumanStageFight.HumanStagePiste.Result,
  ): AutoMovieMotionHumanStageFight.HumanStagePiste.ITake => ({
    anchor: "rule",
    kind,
    first: {
      chain: HumanChain.subject("a").stand({ hold: 0.2, sway: 0 }),
      direction: "forward",
      distance: 0.1,
      blade: "a.blade",
      target: target(region),
    },
    second: {
      chain: HumanChain.subject("b").stand({ hold: 0.2, sway: 0 }),
      direction: "forward",
      distance: 0.1,
      blade: "b.blade",
      target: { kind: "person", subject: "a", region: "chestLeft" },
    },
    duration: SECONDS,
    result,
  });
  for (const [kind, region, result, axis] of [
    ["foil", "chestLeft", "both", "result"],
    ["foil", "thighFrontLeft", "first", "first.target"],
    ["sabre", "kneeRight", "first", "first.target"],
  ] as const)
    try {
      AutoMovieMotionHumanStageFight.HumanStagePiste.compose(
        take(kind, region, result),
      );
      complaints.list.push(`${kind}: admitted ${result} on ${region}`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.axis !== axis)
        complaints.list.push(`${kind}: unexpected refusal ${String(error)}`);
    }
  try {
    AutoMovieMotionHumanStageFight.HumanStagePiste.compose(
      take("epee", "thighFrontLeft", "first"),
    );
  } catch (error) {
    complaints.list.push(`epee: refused a valid thigh touch ${String(error)}`);
  }
}
