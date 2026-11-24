import {
  createChoppingBlock,
  createForestAxe,
  createRake,
  createShovel,
  createSledgehammer,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanLabour,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { HumanLabour } = AutoMovieMotionHumanLabour;

/** A long-tool row and its tool. */
type Row = "chop" | "sideChop" | "sledge" | "dig" | "rake";

/** One stroke's staging: the tool, the work point and its own expectation. */
interface IStage {
  /** The row performed. */
  row: Row;

  /** The tool, standing on its head beside the performer. */
  tool: IAutoMovieMotionHumanObject.IModel;

  /** The work point, world metres. */
  at: IAutoMovieVector3;
}

/** Where the performer stands the tools before taking one up. */
const REST: IAutoMovieVector3 = { x: -0.3, y: 0, z: 0.3 };

/**
 * Two-handed long-tool work, for two canonical bodies.
 *
 * Scenarios:
 * 1. An axe chops onto a chopping block, a level chop meets a trunk point
 *    and a sledgehammer strikes the ground: at each contact the displayed
 *    face is on the work point, having come down (or across) to it, and the
 *    lead hand stays on the tool's line through every stroke.
 * 2. A shovel's blade is below the ground when it is driven and above it
 *    when the load is thrown.
 * 3. A rake's tines stay on the ground through the pull and are off it on
 *    the return.
 * 4. A work point beyond the arm's reach is refused with the distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the strokes, the bodies, the readings and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered labour rows over real tool archetypes and reads displayed tool faces and hands.
 * @evidence contracts/development/testing.md#independent-expectations The work point and the ground bound the face; the tool's own line bounds the lead hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Five strokes, a reachable and an unreachable work point, two bodies.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of generated bodies and archetypes.
 */
export function test_motion_operate_tool_long_work(): void {
  for (const profile of ["m-average", "f-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(profile);
    const stages: readonly IStage[] = [
      {
        row: "chop",
        tool: createForestAxe({}, 1),
        at: { x: 0, y: 0.5, z: 0.6 },
      },
      {
        row: "sideChop",
        tool: createForestAxe({}, 1),
        at: { x: 0, y: 1, z: 0.6 },
      },
      {
        row: "sledge",
        tool: createSledgehammer({}, 1),
        at: { x: 0, y: 0, z: 0.7 },
      },
      { row: "dig", tool: createShovel({}, 1), at: { x: 0, y: 0, z: 0.55 } },
      { row: "rake", tool: createRake({}, 1), at: { x: 0, y: 0, z: 0.9 } },
    ];
    for (const stage of stages) strokes(body, profile, stage);

    let refusal: unknown;
    try {
      take(body, { ...stages[0]!, at: { x: 0, y: 0.5, z: 3 } });
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      `${profile}: a work point beyond the arm's reach is refused with the distance`,
      refusal instanceof HumanRefusal &&
        refusal.axis === "at" &&
        refusal.reason.includes(" m from the trailing shoulder"),
    );
  }
}

/** One stroke's take and its readings. */
function strokes(
  body: IAutoMovieMotionHumanBody,
  profile: string,
  stage: IStage,
): void {
  const film: HumanPerformance = take(body, stage);
  assertTakeClean(`${profile} ${stage.row}`, film);
  const segment: IAutoMovieMotionHumanSegment = film
    .segments("worker")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === stage.row)!;
  const when: (name: string) => number = (name: string): number =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((e): boolean => e.name === name)!.share;
  const face: (seconds: number) => IAutoMovieVector3 = (
    seconds: number,
  ): IAutoMovieVector3 => point(film.prop("tool", seconds), stage.tool, "face");

  // The lead hand on the tool's line from the trailing grip to the face.
  let off: number = 0;
  for (let i: number = 0; i <= 30; ++i) {
    const seconds: number =
      when("ready") + ((when("recover") - when("ready")) * i) / 30;
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "worker",
      seconds,
    );
    const trail: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "right",
      "grip",
    ).point;
    const lead: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "left",
      "grip",
    ).point;
    const line: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(face(seconds), trail),
    );
    const along: IAutoMovieVector3 = Vector3.subtract(lead, trail);
    off = Math.max(
      off,
      Vector3.length(
        Vector3.subtract(along, Vector3.scale(line, Vector3.dot(along, line))),
      ),
    );
  }
  TestValidator.predicate(
    `${profile} ${stage.row}: the lead hand stays on the tool's line (${off.toFixed(4)} m)`,
    off < 0.05,
  );

  if (stage.row === "dig") {
    TestValidator.predicate(
      `${profile} dig: the blade is below the ground when driven and above it when thrown`,
      face(when("drive1")).y < -0.02 && face(when("throw1")).y > 0.1,
    );
    return;
  }
  if (stage.row === "rake") {
    let ground: number = 0;
    for (let i: number = 1; i < 10; ++i) {
      const seconds: number =
        when("contact1") + ((when("pull1") - when("contact1")) * i) / 10;
      ground = Math.max(ground, Math.abs(face(seconds).y));
    }
    const back: number =
      when("pull1") + (when("contact2") - when("pull1")) * 0.6;
    TestValidator.predicate(
      `${profile} rake: the tines keep to the ground through the pull (${ground.toFixed(4)} m) and lift on the return`,
      ground < 0.03 && face(back).y > 0.05,
    );
    return;
  }
  // A swung stroke's face meets the work point from its stroke's direction.
  for (const k of [1, 2]) {
    const contact: number = when(`contact${k}`);
    const before: IAutoMovieVector3 = face(contact - 0.08);
    const at: IAutoMovieVector3 = face(contact);
    const arrives: boolean =
      stage.row === "sideChop"
        ? Vector3.distance(before, stage.at) > Vector3.distance(at, stage.at)
        : before.y > at.y;
    TestValidator.predicate(
      `${profile} ${stage.row}: stroke ${k}'s face meets the work point (${Vector3.distance(at, stage.at).toFixed(4)} m) from its stroke`,
      Vector3.distance(at, stage.at) < 0.05 && arrives,
    );
  }
}

/** A worker who takes up the standing tool in the right hand and works with it. */
function take(
  body: IAutoMovieMotionHumanBody,
  stage: IStage,
): HumanPerformance {
  const props: IAutoMovieMotionHumanProp[] = [
    HumanObject.prop("tool", stage.tool, {
      position: REST,
      rotation: Quaternion.identity(),
    }),
  ];
  if (stage.row === "chop")
    props.push(
      HumanObject.prop(
        "block",
        createChoppingBlock({ height: stage.at.y }, 1),
        { at: { x: stage.at.x, y: 0, z: stage.at.z }, yaw: 0, fixed: true },
      ),
    );
  return new HumanPerformance({
    seed: `long-tool-${stage.row}`,
    laws: [HumanLabour[stage.row]],
    performers: [
      {
        subject: "worker",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    composition: HumanChain.subject("worker")
      .stand({ hold: 0.3 })
      .pickUp({ prop: "tool", handle: "shaft", hand: "right" })
      .registered(stage.row, {
        prop: "tool",
        at: stage.at,
        hand: "right",
        count: 2,
      }).node,
  });
}

/** An affordance's world point on a prop's frame. */
function point(
  frame: IAutoMovieRigidTransform,
  model: IAutoMovieMotionHumanObject.IModel,
  id: string,
): IAutoMovieVector3 {
  const local: IAutoMovieVector3 = model.affordances!.find(
    (a): boolean => a.id === id,
  )!.frame.translation;
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}
