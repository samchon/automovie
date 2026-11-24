import { createWoodenDummy } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { chiSau } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionCombatPair } from "../../../features/internal/motionCombatPair";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A held or landed contact lies within this, metres: the grapple specs' 1 cm. */
const GRIP: number = 0.01;

/** A strike lands within this of its prop target, metres: the blade strokes spec's bound. */
const TOUCH: number = 0.015;

/** Chain punches land at least this many per second: amateur boxers' 4 to 6 (as #4014's sources summarise). */
const RATE: readonly [number, number] = [4, 13.4];

/**
 * Wing chun on two bodies: chain punches alternate hands along the
 * centreline at a boxer's rate or faster; in chi sau the partners' wrists
 * keep contact through every roll while the contacts roll; strikes on the
 * wooden dummy land on its trunk, its arm and its leg. Every take passes
 * the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case and what it reads.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the rows and the chi sau action through HumanPerformance and reads the displayed fists, wrists, palms and heels and the dummy's affordances.
 * @evidence contracts/development/testing.md#independent-expectations Contacts are the grapple specs' 1 cm and the blade strokes spec's 15 mm; the punch rate is boxers' typical range up to the recorded wing chun record.
 * @evidence contracts/development/testing.md#distinguishing-cases A pair on a small and an average body and one performer at the dummy.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances, with no host or capture.
 */
export function test_motion_wing_chun_wing_chun(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [label, run] of [
      ["chain punches", chainPunches],
      ["chi sau", rollingHands],
      ["dummy", dummy],
    ] as const)
      try {
        run(name, body, complaints);
      } catch (error) {
        complaints.list.push(`${name} ${label}: ${String(error)}`);
      }
  }
  complaints.assert("wing_chun");
}

/** Four chain punches alternating hands along the centreline. */
function chainPunches(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const at: IAutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "solarPlexus",
  };
  const rows: readonly ("chainPunch" | "rearChainPunch")[] = [
    "chainPunch",
    "rearChainPunch",
    "chainPunch",
    "rearChainPunch",
  ];
  let chain: IAutoMovieMotionHumanChainCore = HumanChain.subject(
    "a",
  ).registered("martialArt", { kind: "wingChunStance" }, "stance");
  rows.forEach((row: "chainPunch" | "rearChainPunch", index: number): void => {
    chain = chain.registered(row, { at }, `punch.${index}`);
  });
  const film: HumanPerformance = motionCombatPair.pair(
    body,
    0.45 * body.measure.stature,
    chain,
    "chain",
  );
  assertTakeClean(`${name} chain punches`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  const impacts: number[] = rows.map(
    (_row: string, index: number): number =>
      motionCombatPair.placed(film, `punch.${index}`).contact!,
  );
  const hands: AutoMovieHumanSide[] = impacts.map(
    (s: number): AutoMovieHumanSide => {
      const target: IAutoMovieVector3 = HumanSignature.region(
        HumanSignature.of(film, "b", body, 180),
        "solarPlexus",
        s,
      );
      return Vector3.distance(HumanSignature.joint(a, s, "leftHand"), target) <
        Vector3.distance(HumanSignature.joint(a, s, "rightHand"), target)
        ? "left"
        : "right";
    },
  );
  complaints.check(
    `${name} chain punches: the hands land ${hands.join(", ")}`,
    hands.every(
      (hand: AutoMovieHumanSide, i: number): boolean =>
        i === 0 || hand !== hands[i - 1],
    ),
  );
  const off: number = Math.max(
    ...impacts.map((s: number, i: number): number =>
      Math.abs(HumanSignature.joint(a, s, `${hands[i]!}Hand`).x),
    ),
  );
  complaints.check(
    `${name} chain punches: the fists land within ${off} m of the centreline`,
    off <= 0.05 * body.measure.stature,
  );
  const rate: number =
    (impacts.length - 1) / (impacts[impacts.length - 1]! - impacts[0]!);
  complaints.check(
    `${name} chain punches: ${rate} punches per second`,
    rate >= RATE[0] && rate <= RATE[1],
  );
}

/** Chi sau: the wrists keep contact through every roll. */
function rollingHands(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = motionCombatPair.pair(
    body,
    0.45 * body.measure.stature,
    HumanChain.subject("a")
      .registered("chiSau", { partner: "b", count: 4 }, "rollA")
      .with(
        HumanChain.subject("b").registered(
          "chiSau",
          { partner: "a", count: 4 },
          "rollB",
        ),
      ),
    "chiSau",
  );
  assertTakeClean(`${name} chi sau`, film);
  const roll: IAutoMovieScheduleEntry = motionCombatPair.placed(film, "rollA");
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  const b: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "b",
    body,
    180,
  );
  const touching: number = 2 * chiSau.WRIST * body.measure.stature;
  let worst: number = 0;
  let low: number = Number.POSITIVE_INFINITY;
  let high: number = Number.NEGATIVE_INFINITY;
  for (
    let s: number = roll.start + chiSau.BLEND;
    s <= roll.end - chiSau.BLEND;
    s += 1 / 24
  )
    for (const [mine, theirs] of [
      ["leftHand", "rightHand"],
      ["rightHand", "leftHand"],
    ] as const) {
      const here: IAutoMovieVector3 = HumanSignature.joint(a, s, mine);
      const there: IAutoMovieVector3 = HumanSignature.joint(b, s, theirs);
      worst = Math.max(
        worst,
        Math.abs(Vector3.distance(here, there) - touching),
      );
      low = Math.min(low, here.y);
      high = Math.max(high, here.y);
    }
  complaints.check(
    `${name} chi sau: the wrists stay within ${worst} m of touching while the contacts roll ${high - low} m`,
    worst <= GRIP && high - low >= chiSau.RADIUS * body.measure.stature,
  );
}

/** The wooden dummy drill: a palm strike on the trunk, a slap on the arm and a kick on the leg. */
function dummy(
  name: motionCombatPair.Name,
  body: IAutoMovieMotionHumanBody,
  complaints: motionComplaints.IGatherer,
): void {
  const model: ReturnType<typeof createWoodenDummy> = createWoodenDummy({
    id: "dummy",
  });
  const distance: number = 0.45 * body.measure.stature;
  const at = (point: string): IAutoMovieMotionTarget => ({
    kind: "prop",
    subject: "dummy",
    point,
  });
  const film: HumanPerformance = new HumanPerformance({
    seed: "dummy",
    laws: [...Object.values(AutoMovieMotionHumanStrike.HumanStrike)],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("dummy", model, {
        position: { x: 0, y: 0, z: distance },
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      }),
    ],
    composition: HumanChain.subject("a")
      .registered("martialArt", { kind: "wingChunStance" }, "stance")
      .registered("palmHeel", { at: at("trunk") }, "trunk")
      .registered(
        "touch",
        { target: at("armRight"), kind: "tap", effector: "palm" },
        "arm",
      )
      .registered("sideKick", { at: at("leg") }, "leg").node,
  });
  assertTakeClean(`${name} dummy`, film);
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    film,
    "a",
    body,
    0,
  );
  for (const [anchor, point] of [
    ["trunk", "trunk"],
    ["arm", "armRight"],
  ] as const) {
    const entry: IAutoMovieScheduleEntry = motionCombatPair.placed(
      film,
      anchor,
    );
    const s: number = entry.contact ?? 0.5 * (entry.start + entry.end);
    const frame: IAutoMovieRigidTransform = film.prop("dummy", s);
    const target: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        model.affordance(point).frame.translation,
      ),
    );
    const gap: number = Math.min(
      ...(["palmLeft", "palmRight"] as const).map(
        (palm: AutoMovieHumanoidRegion): number =>
          Vector3.distance(HumanSignature.region(a, palm, s), target),
      ),
    );
    complaints.check(
      `${name} dummy ${anchor}: the palm lands ${gap} m from the ${point}`,
      gap <= TOUCH,
    );
  }
  const kick: IAutoMovieScheduleEntry = motionCombatPair.placed(film, "leg");
  const s: number = kick.contact!;
  const frame: IAutoMovieRigidTransform = film.prop("dummy", s);
  const leg: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      model.affordance("leg").frame.translation,
    ),
  );
  const heel: number = Math.min(
    Vector3.distance(motionCombatPair.foot(body, a, "left", "heel", s), leg),
    Vector3.distance(motionCombatPair.foot(body, a, "right", "heel", s), leg),
  );
  complaints.check(
    `${name} dummy leg: the heel lands ${heel} m from the leg`,
    heel <= TOUCH,
  );
}
