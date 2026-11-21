import { createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBlade,
  HumanChain,
  HumanFoot,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanStagePiste,
  stageBladeFootwork,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

/** One weapon's bout: its blocking, the touches' targets and the scripted result. */
interface IBout {
  /** The weapon. */
  kind: Exclude<HumanStagePiste.Kind, "kendo">;

  /** The first performer's lead foot. */
  lead: AutoMovieHumanSide;

  /** The performers' opening separation along the piste, metres: the sabre, whose cut lands short of its point, starts closer. */
  opening: number;

  /** The first performer's forward mark shift, metres. */
  distance: number;

  /** The region of the second the first performer's attack aims at. */
  attack: AutoMovieHumanoidRegion;

  /** The region of the first the second performer's answer aims at. */
  answer: AutoMovieHumanoidRegion;

  /** The scripted result. */
  result: HumanStagePiste.Result;
}

/** A scoring touch: its action's anchor, the struck performer and the region it lands on. */
type Touch = readonly [
  anchor: string,
  struck: string,
  region: AutoMovieHumanoidRegion,
];

/** One bout per weapon, each with its own result, lead and distance. */
const BOUTS: readonly IBout[] = [
  {
    kind: "foil",
    lead: "right",
    opening: 1.5,
    distance: 0.14,
    attack: "chestLeft",
    answer: "chestRight",
    result: "first",
  },
  {
    kind: "epee",
    lead: "left",
    opening: 1.5,
    distance: 0.1,
    attack: "thighFrontRight",
    answer: "chestLeft",
    result: "first",
  },
  {
    kind: "sabre",
    lead: "right",
    opening: 1.35,
    distance: 0.18,
    attack: "shoulderRight",
    answer: "crown",
    result: "second",
  },
];

/** Duration of the mark shifts, seconds. */
const SECONDS: number = 1.2;

/** A touch lands within this of its target, metres: the blade strokes spec's bound. */
const TOUCH: number = 0.015;

/** Planted support and a held grip hold within this, metres. */
const HOLD: number = 0.005;

/**
 * A fencing bout per weapon: both performers shift to their marks in the
 * weapon's footwork, the first attacks, and the scripted result decides the
 * exchange and is announced at the decisive instant of the touch.
 *
 * Scenarios:
 * 1. The foil's lunge lands on the trunk and the epee's on the thigh, each
 *    scoring for the first; the sabre's cut is parried and the second's
 *    riposte cut lands, scoring for the second.
 * 2. In each shift the first's lead foot leaves first while the rear holds,
 *    and the pelvis follows the mark; each performer keeps its blade's grip.
 * 3. The attacker recovers from the lunge to the stance it lunged from.
 * 4. The epee's double touch places the counter's decisive instant on the
 *    attack's and is announced there, and not once the counter lands later
 *    than the epee's 40 ms window.
 * 5. The rules refuse a double touch in foil, a foil touch on the thigh and
 *    a sabre touch below the waist, and admit an epee touch on the thigh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three weapons' bouts, their results, the support, grip and recovery checks, the double touch's window and the rule refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public bout, samples both performers' displayed feet, pelvis and regions and the blades' displayed points and edges, and reads the announced result from the placed schedule.
 * @evidence contracts/development/testing.md#independent-expectations The results and targets are script inputs; the valid targets are the FIE's; a touch lands within the blade strokes spec's 15 mm of its target region, and the planted foot and the grip hold within the stage footwork spec's 5 mm. Recovery returns the attacker's feet to where they stood before the attack, within the same 15 mm. The double-touch window is the FIE's 40 ms. The double touch's landing is not measured: each blade action reads its target once, at its start, so two simultaneous lunges aim where the other stood.
 * @evidence contracts/development/testing.md#distinguishing-cases Three weapons with different leads, distances and results, a single and a parried touch, a double touch inside and outside its window, and the adjacent inadmissible and admitted targets. Checks are at sampled instants, not swept.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory placement and pose sampling on canonical bodies and archetype props. No viewer or native host is invoked.
 */
export function test_motion_exercise_staged_piste(): void {
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

/**
 * The epee's double touch: the second's counter lunge is placed with its
 * decisive instant on the attack's, and the result is announced only while
 * the two touches lie within the epee's window.
 */
function double(
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const { placed, film }: IStaged = stage(body, {
    kind: "epee",
    lead: "right",
    opening: 1.5,
    distance: 0.1,
    attack: "chestRight",
    answer: "chestLeft",
    result: "both",
  });
  const attack: IAutoMovieScheduleEntry | undefined =
    film.schedule.entries.find(
      (row): boolean => row.intent.anchor === "bout.attack",
    );
  const counter: IAutoMovieScheduleEntry | undefined =
    film.schedule.entries.find(
      (row): boolean => row.intent.anchor === "bout.counter",
    );
  const announced: HumanStagePiste.IAnnouncement | undefined = placed.announced(
    film.schedule,
  );
  complaints.check(
    "epee/both: the counter's touch meets the attack's and the double is announced there",
    attack?.contact !== undefined &&
      counter?.contact !== undefined &&
      nclose(attack.contact, counter.contact) &&
      announced?.result === "both" &&
      nclose(announced.seconds, attack.contact),
  );

  // A counter landing outside the window scores no double touch.
  const late: number = HumanStagePiste.DOUBLE + 0.01;
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

/** A placed bout and its performance. */
interface IStaged {
  /** The composed bout. */
  placed: HumanStagePiste.IPlaced;

  /** Its performance. */
  film: HumanPerformance;
}

/** Arm both performers, compose the bout and place it. */
function stage(body: IAutoMovieMotionHumanBody, bout: IBout): IStaged {
  const blade = createStageBladeProp({ kind: bout.kind, id: "blade" });
  const grip: IAutoMovieVector3 = blade.affordance("grip").frame.translation;
  const held = (
    subject: string,
    root: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanProp => {
    // The blade lies at the right hand's side, at the waist, ahead.
    const side: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
      {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight - grip.y,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
    );
    return HumanObject.prop(`${subject}.blade`, blade, {
      at: Vector3.add(root, side),
      yaw,
    });
  };
  const at: Readonly<Record<string, IAutoMovieVector3>> = {
    a: { x: 0, y: 0, z: 0 },
    b: { x: 0, y: 0, z: bout.opening },
  };
  const props: IAutoMovieMotionHumanProp[] = [
    held("a", at.a!, 0),
    held("b", at.b!, 180),
  ];
  const take: HumanStagePiste.ITake = {
    anchor: "bout",
    kind: bout.kind,
    first: {
      chain: HumanChain.subject("a").pickUp({
        prop: "a.blade",
        handle: "grip",
        hand: "right",
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
      }),
      direction: "forward",
      distance: 0.1,
      lead: "right",
      blade: "b.blade",
      target: { kind: "person", subject: "a", region: bout.answer },
    },
    duration: SECONDS,
    result: bout.result,
  };
  const placed: HumanStagePiste.IPlaced = HumanStagePiste.compose(take);
  const film: HumanPerformance = new HumanPerformance({
    seed: `piste-${bout.kind}`,
    laws: [stageBladeFootwork, ...Object.values(HumanBlade)],
    performers: ["a", "b"].map((subject: string) => ({
      subject,
      body,
      at: at[subject]!,
      yaw: subject === "a" ? 0 : 180,
      proficiency: { level: "trained" as const },
    })),
    props,
    composition: placed.composition,
  });
  return { placed, film };
}

/** Play one weapon's bout and check what it shows. */
function play(
  body: IAutoMovieMotionHumanBody,
  bout: IBout,
  complaints: motionComplaints.IGatherer,
): void {
  const { placed, film }: IStaged = stage(body, bout);
  const blade = createStageBladeProp({ kind: bout.kind, id: "blade" });
  const grip: IAutoMovieVector3 = blade.affordance("grip").frame.translation;
  const point: IAutoMovieVector3 = blade.affordance("point").frame.translation;
  const entry = (anchor: string): IAutoMovieScheduleEntry | undefined =>
    film.schedule.entries.find((row): boolean => row.intent.anchor === anchor);
  const reader = (subject: string): IAutoMovieMotionHumanSignature.IReader =>
    HumanSignature.of(film, subject, body, subject === "a" ? 0 : 180);
  const label: string = `${bout.kind}/${bout.result}`;

  // 1. The announced result at the decisive instant of the scoring touch.
  const announced: HumanStagePiste.IAnnouncement | undefined = placed.announced(
    film.schedule,
  );
  const scoring: readonly Touch[] =
    bout.result === "first"
      ? [["bout.attack", "b", bout.attack]]
      : [["bout.reply", "a", bout.answer]];
  complaints.check(
    `${label}: announces its result at the scoring touch`,
    announced?.result === bout.result &&
      nclose(announced.seconds, entry(scoring[0]![0])?.contact ?? Number.NaN),
  );
  for (const [anchor, struck, region] of scoring) {
    const action: IAutoMovieScheduleEntry | undefined = entry(anchor);
    if (action?.contact === undefined) {
      complaints.list.push(`${label}: ${anchor} has no decisive instant`);
      continue;
    }
    const striker: string = action.subject;
    const frame: IAutoMovieRigidTransform = film.prop(
      `${striker}.blade`,
      action.contact,
    );
    const tip: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, point),
    );
    const aimed: IAutoMovieVector3 = HumanSignature.region(
      reader(struck),
      region,
      action.contact,
    );

    // A thrust lands its point; a cut lands somewhere along the blade.
    let missed: number = Vector3.distance(tip, aimed);
    if (bout.kind === "sabre")
      for (let share: number = 0; share <= 1; share += 0.01)
        missed = Math.min(
          missed,
          Vector3.distance(Vector3.lerp(frame.position, tip, share), aimed),
        );
    complaints.check(
      `${label}: ${anchor} lands ${missed} m from the ${region}`,
      missed <= TOUCH,
    );
  }

  // 2. The shift: the lead leaves first, the rear holds, the pelvis follows.
  const shift: IAutoMovieScheduleEntry | undefined = entry("bout.first");
  if (shift === undefined) {
    complaints.list.push(`${label}: the shift was not placed`);
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
  const early: number = shift.start + 0.27 * SECONDS;
  complaints.check(
    `${label}: the lead foot leaves first, the rear holds and the pelvis follows the mark`,
    sole(bout.lead, early).z - sole(bout.lead, shift.start).z > 0.02 &&
      Vector3.distance(sole(rear, early), sole(rear, shift.start)) <= HOLD &&
      nclose(
        sole(bout.lead, shift.end).z - sole(bout.lead, shift.start).z,
        bout.distance,
        0.008,
      ) &&
      film.bones("a", shift.end).get("hips")!.worldPosition.z -
        film.bones("a", shift.start).get("hips")!.worldPosition.z >
        0.04,
  );

  // 3. The attacker recovers to the stance it attacked from.
  const attack: IAutoMovieScheduleEntry | undefined = entry("bout.attack");
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
      Vector3.distance(gripped(shift.start), gripped(film.schedule.duration)) <=
        HOLD,
    );
  }
}

/** The weapons' rules refuse off-target and double touches before placement. */
function rules(complaints: motionComplaints.IGatherer): void {
  const target = (region: AutoMovieHumanoidRegion): IAutoMovieMotionTarget => ({
    kind: "person",
    subject: "b",
    region,
  });
  const take = (
    kind: HumanStagePiste.Kind,
    region: AutoMovieHumanoidRegion,
    result: HumanStagePiste.Result,
  ): HumanStagePiste.ITake => ({
    anchor: "rule",
    kind,
    first: {
      chain: HumanChain.subject("a").stand({ seconds: 0.2, sway: 0 }),
      direction: "forward",
      distance: 0.1,
      blade: "a.blade",
      target: target(region),
    },
    second: {
      chain: HumanChain.subject("b").stand({ seconds: 0.2, sway: 0 }),
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
      HumanStagePiste.compose(take(kind, region, result));
      complaints.list.push(`${kind}: admitted ${result} on ${region}`);
    } catch (error) {
      if (!(error instanceof HumanRefusal) || error.axis !== axis)
        complaints.list.push(`${kind}: unexpected refusal ${String(error)}`);
    }
  try {
    HumanStagePiste.compose(take("epee", "thighFrontLeft", "first"));
  } catch (error) {
    complaints.list.push(`epee: refused a valid thigh touch ${String(error)}`);
  }
}
