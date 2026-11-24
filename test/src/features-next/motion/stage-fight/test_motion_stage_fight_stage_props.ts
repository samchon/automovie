import { createStageWeaponProp } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieChain,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Verify the screen cue of a two-hand stage prop beat and the replay of a
 * linked prop's authored movement.
 *
 * Scenarios:
 * 1. The performer picks up the lower and upper shaft sites, then carries
 *    both grip windows through a figure-eight film beat. The prop moves
 *    onscreen, and a separately staged response starts a tenth of a second
 *    after the stroke without a physical hit.
 * 2. A separate linked prop starts at a film cue, opens to the chosen angle
 *    and settles at a second angle. Late, early and repeated seeks give the
 *    correct travel and a terminal mark that follows the visible hinge.
 * 3. The articulated end of a held prop reaches a reachable screen mark at the stroke cue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the held shaft, visual cue, response offset, linked travel and seek cases.
 * @evidence contracts/development/testing.md#behavioral-verification Uses actual composed stage motion, public grip windows and displayed world prop transforms. Uses the live performance state to articulate the linked archetype and read its terminal mark.
 * @evidence contracts/development/testing.md#independent-expectations The scene chooses separate shaft sites, the partner offset and the link keys. Halfway between two keys the symmetric interpolation must reach their mean. The endpoint at the selected angle follows elementary rotation about the fixture's visible pivot. A held prop's displayed endpoint must be within 10 mm of the authored point.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises distinct grip ownership, a cue without physical hits, and reads before, during and after a cue-driven articulation in an order different from playback.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on the scenario runner using a prepared polygon body and the normal prop, composition and performance readers.
 */
export function test_motion_stage_fight_stage_props(): void {
  verifyScreenBeat();
  verifyLink();
  verifyLinkedMark();
}

/** Measure a two-hand figure-eight and an independently scheduled reaction. */
function verifyScreenBeat(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const model: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp(
    { kind: "longBlade", height: 0.72 },
  );
  const lower: number = model.affordance("grip-lower").frame.translation.y;
  const upper: number = model.affordance("grip-upper").frame.translation.y;
  const shaft: IAutoMovieMotionHumanProp = HumanObject.prop("shaft", model, {
    at: { x: -(lower + upper) / 2, y: 1.11, z: 0.29 },
    yaw: 0,
  });
  const enrolled: IAutoMovieMotionHumanChain = HumanChain.subject("carrier")
    .stand()
    .pickUp({ prop: "shaft", handle: "grip-lower", hand: "right", lift: 0 })
    .pickUp({ prop: "shaft", handle: "grip-upper", hand: "left", lift: 0 });
  const composition: IAutoMovieChain =
    AutoMovieMotionHumanStageFight.stageProp(
    enrolled,
    { beat: "figureEight", prop: "shaft", support: "grip-upper" },
    "shaft-display",
    { performer: HumanChain.subject("partner"), delay: 0.1 },
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "exercise-stage-prop",
    performers: [
      {
        subject: "carrier",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "partner",
        body,
        at: { x: 2, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: composition.node,
    laws: [AutoMovieMotionHumanStageFight.HumanStageProp],
    props: [
      {
        ...shaft,
        frame: {
          ...shaft.frame,
          rotation: { x: 0, y: 0, z: -Math.SQRT1_2, w: Math.SQRT1_2 },
        },
      },
    ],
  });
  const segment: IAutoMovieMotionHumanSegment | undefined = performance
    .segments("carrier")
    .find(
      (entry: IAutoMovieMotionHumanSegment): boolean =>
        entry.law.name === "stageProp",
    );
  if (segment === undefined) throw new Error("Stage prop beat is missing");
  const grips: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts.filter(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.kind === "grip" &&
        window.support.kind === "prop" &&
        window.support.subject === "shaft",
    );
  TestValidator.predicate(
    "both hands remain in the shaft grip windows",
    ["rightHand", "leftHand"].every((part: string): boolean =>
      grips.some(
        (window: IAutoMovieMotionHumanContactWindow): boolean =>
          window.part === part && window.from === 0 && window.to === 1,
      ),
    ),
  );

  const lead: IAutoMovieScheduleEntry | undefined =
    performance.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "shaft-display",
    );
  const response: IAutoMovieScheduleEntry | undefined =
    performance.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "shaft-display.response",
    );
  const stroke: IAutoMovieScheduleCue | undefined = lead?.events?.find(
    (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
  );
  if (lead === undefined || stroke === undefined || response === undefined)
    throw new Error("Expected the placed visual cue and partner reaction");
  TestValidator.predicate(
    "the delayed visual reaction goes on the stroke without contact",
    nclose(response.start, stroke.seconds + 0.1) &&
      lead.contact === undefined &&
      performance.hits().length === 0,
  );
  const before: IAutoMovieVector3 = performance.prop(
    "shaft",
    lead.start,
  ).position;
  const moving: IAutoMovieVector3 = performance.prop(
    "shaft",
    (lead.start + stroke.seconds) / 2,
  ).position;
  TestValidator.predicate(
    "the held prop visibly changes placement during the beat",
    Vector3.distance(before, moving) > 0.01,
  );
}

/** Measure the linked model's actual terminal mark through the film track. */
function verifyLink(): void {
  const model: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp(
    { kind: "linked" },
  );
  const rest: IAutoMovieMotionHumanProp = HumanObject.prop("linked", model, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  });
  const linked: IAutoMovieMotionHumanProp =
    AutoMovieMotionHumanStageFight.withHumanStagePropLink(
    rest,
    { of: "edit", event: "swing" },
    [
      { seconds: 0, degrees: 0 },
      { seconds: 1, degrees: 60 },
      { seconds: 2, degrees: 20 },
    ],
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "exercise-stage-link",
    performers: [],
    composition: { kind: "parallel", parts: [] },
    cues: { edit: [{ name: "swing", seconds: 2 }] },
    props: [linked],
  });
  TestValidator.predicate(
    "out-of-order reads preserve the swing, return and final hold",
    nclose(performance.state("linked", 4.5).link!, 20) &&
      performance.state("linked", 1.5).link === undefined &&
      nclose(performance.state("linked", 2.5).link!, 30) &&
      nclose(performance.state("linked", 3.5).link!, 40) &&
      nclose(performance.state("linked", 2.5).link!, 30),
  );

  const pivot: IAutoMovieVector3 = model.affordance("link").frame.translation;
  const terminal: IAutoMovieVector3 = model.affordance("end").frame.translation;
  const expected: IAutoMovieVector3 = Vector3.add(
    pivot,
    Quaternion.rotateVector(
      { x: 0, y: 0, z: Math.sin(Math.PI / 6), w: Math.cos(Math.PI / 6) },
      Vector3.subtract(terminal, pivot),
    ),
  );
  const shown: IAutoMovieVector3 = model
    .articulate(performance.state("linked", 3))
    .affordance("end").frame.translation;
  TestValidator.predicate(
    "the terminal mark revolves about the rendered link pivot",
    Vector3.distance(expected, shown) < 1e-6,
  );
}

/** A held linked prop carries its displaced endpoint onto the authored stage mark. */
function verifyLinkedMark(): void {
  const model: ReturnType<typeof createStageWeaponProp> = createStageWeaponProp(
    { kind: "linked", height: 0.72 },
  );
  const grip: number = model.affordance("grip").frame.translation.y;
  const rest: IAutoMovieMotionHumanProp = HumanObject.prop("tool", model, {
    at: { x: -0.15 - grip, y: 1.11, z: 0.29 },
    yaw: 0,
  });
  const prop: IAutoMovieMotionHumanProp =
    AutoMovieMotionHumanStageFight.withHumanStagePropLink(
    {
      ...rest,
      frame: {
        ...rest.frame,
        rotation: Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
      },
    },
    0,
    [
      { seconds: 0, degrees: 60 },
      { seconds: 0.1, degrees: 60 },
    ],
  );
  const at: IAutoMovieVector3 = { x: 0.072, y: 1.272, z: 0.856 };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "exercise-stage-mark-review",
    performers: [
      {
        subject: "carrier",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("carrier")
      .stand()
      .pickUp({ prop: "tool", handle: "grip", hand: "right", lift: 0 })
      .registered(
        "stageProp",
        { beat: "linked", prop: "tool", mark: "end", at },
        "display",
      ).node,
    laws: [AutoMovieMotionHumanStageFight.HumanStageProp],
    props: [prop],
  });
  const stroke: IAutoMovieScheduleCue | undefined = performance.schedule.entries
    .find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "display",
    )
    ?.events?.find(
      (event: IAutoMovieScheduleCue): boolean => event.name === "stroke",
    );
  if (stroke === undefined)
    throw new Error("The stage beat must publish a stroke cue");
  const frame: IAutoMovieRigidTransform = performance.prop(
    "tool",
    stroke.seconds,
  );
  const end: IAutoMovieVector3 = model
    .articulate(performance.state("tool", stroke.seconds))
    .affordance("end").frame.translation;
  const displayed: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, end),
  );
  TestValidator.predicate(
    "the displayed linked end reaches the authored stage mark",
    Vector3.distance(displayed, at) < 0.01,
  );
}
