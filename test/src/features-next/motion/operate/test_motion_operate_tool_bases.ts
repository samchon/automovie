import {
  type AutoMovieArchetype,
  createHammer,
  createSeat,
  createTable,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { composeHumanToolWork } = AutoMovieMotionHumanOperate;

/** The tool contract's working contact bound, metres. */
const CONTACT: number = 0.01;

/** A toolbox lid's height the hammer lies on, metres (provisional: a common hand toolbox about 0.35 to 0.45 m tall). */
const TOOLBOX: number = 0.4;

/** How far ahead of the kneeling knee the nail lies, metres (provisional: within the kneeling arm's reach). */
const KNEEL_WORK: number = 0.42;

/** How far behind the stance the kneeling knee comes down, metres (provisional: a short step back). */
const KNEE_BACK: number = 0.25;

/** How far out and ahead of the kneeling knee the hammer lies, metres (provisional: beside the knee). */
const HAMMER: number = 0.2;

/**
 * One-handed hammering from the base a work point's height asks for.
 *
 * Scenarios, on the average man and the small woman:
 * 1. The base bands: a floor point kneels, a low point crouches and a bench
 *    point stands, with the boundaries at their named shares.
 * 2. Kneeling at a floor point, the hammer's face reaches the point at every
 *    contact event.
 * 3. Seated at a bench, the hammer's face reaches the bench top at every
 *    contact event, and a seated base without a seat is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed hammer face at the work's contact events; a face that misses its point from a base, a wrong band or an admitted seatless sit fails.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the named provisional shares; the 10 mm bound is the tool contract's working bound.
 * @evidence contracts/development/testing.md#distinguishing-cases Both band boundaries, kneeling and seated work on two bodies and the refusal; standing work is useTool's own specification.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain.
 */
export function test_motion_operate_tool_bases(): void {
  const stature: number = 1.75;
  TestValidator.equals(
    "the base bands",
    [
      composeHumanToolWork.baseFor(0, stature),
      composeHumanToolWork.baseFor(
        composeHumanToolWork.FLOOR_REACH * stature,
        stature,
      ),
      composeHumanToolWork.baseFor(
        composeHumanToolWork.CROUCH_REACH * stature,
        stature,
      ),
    ],
    ["kneel", "crouch", "standing"],
  );
  TestValidator.predicate(
    "a seated base without a seat is refused",
    (() => {
      try {
        composeHumanToolWork.at(HumanChain.subject("a"), "seated", {
          tool: "hammer",
          prop: "hammer",
          handle: "grip",
          on: { kind: "point", frame: "world", at: { x: 0, y: 0.75, z: 0.5 } },
        });
        return false;
      } catch {
        return true;
      }
    })(),
  );

  for (const fit of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const hammer: AutoMovieArchetype<
      createHammer.Affordance,
      createHammer.Dimension
    > = createHammer();
    // The right knee comes down a step behind the stance under the right
    // hip, the hammer lies out beside it and the nail ahead of it, clear of
    // the front foot on the other side.
    const knee: IAutoMovieVector3 = {
      x: body.rest.get("rightFoot")!.x,
      y: 0,
      z: -KNEE_BACK,
    };
    const floorPoint: IAutoMovieVector3 = {
      // Out beside the kneeling thigh, so the striking forearm passes clear of it.
      x: knee.x - HAMMER,
      y: 0,
      z: knee.z + KNEEL_WORK,
    };
    const floor: HumanPerformance = stage(
      body,
      [
        // The hammer lies on a toolbox's lid beside the knee, within the
        // upright kneeling arm: a pick up from a kneel does not bend down.
        HumanObject.prop("hammer", hammer, {
          at: { x: knee.x - HAMMER, y: TOOLBOX, z: knee.z + HAMMER },
          yaw: 0,
        }),
      ],
      composeHumanToolWork.at(HumanChain.subject("a"), "kneel", {
        tool: "hammer",
        prop: "hammer",
        handle: "grip",
        on: { kind: "point", frame: "world", at: floorPoint },
        knee: { kind: "point", frame: "world", at: knee },
      }),
    );
    assertTakeClean(`${fit} kneeling hammer`, floor);
    TestValidator.predicate(
      `${fit}: kneeling, the hammer reaches the floor point`,
      reaches(floor, hammer, floorPoint),
    );

    const bench: AutoMovieArchetype<
      createTable.Affordance,
      createTable.Dimension
    > = createTable({ kind: "workbench", height: 0.75 });
    const chair: AutoMovieArchetype<
      createSeat.Affordance,
      createSeat.Dimension
    > = createSeat({ kind: "dining" });
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(chair, {
      at: { x: 0, y: 0, z: -0.2 },
      yaw: 0,
    });
    const benchPoint: IAutoMovieVector3 = { x: 0, y: 0.75, z: 0.45 };
    const seated: HumanPerformance = stage(
      body,
      [
        HumanObject.prop("hammer", hammer, {
          at: { x: 0.15, y: 0.75, z: 0.4 },
          yaw: 0,
        }),
        HumanObject.prop("bench", bench, {
          at: { x: 0, y: 0, z: 0.75 },
          yaw: 180,
          fixed: true,
        }),
        HumanObject.prop("chair", chair, {
          at: { x: 0, y: 0, z: -0.2 },
          yaw: 0,
          fixed: true,
        }),
      ],
      composeHumanToolWork.at(
        HumanChain.subject("a"),
        "seated",
        {
          tool: "hammer",
          prop: "hammer",
          handle: "grip",
          on: { kind: "point", frame: "world", at: benchPoint },
        },
        seat,
      ),
    );
    assertTakeClean(`${fit} seated hammer`, seated);
    TestValidator.predicate(
      `${fit}: seated, the hammer reaches the bench`,
      reaches(seated, hammer, benchPoint),
    );
  }
}

/** One performer `a` at the origin with props. */
function stage(
  body: IAutoMovieMotionHumanBody,
  props: IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  return new HumanPerformance({
    seed: "tool-bases",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props,
    composition: chain.node,
  });
}

/** Whether the displayed hammer face meets the point at every contact event of the work. */
function reaches(
  film: HumanPerformance,
  hammer: AutoMovieArchetype<createHammer.Affordance, createHammer.Dimension>,
  point: IAutoMovieVector3,
): boolean {
  const work: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === "useTool",
    )!;
  const hits: IAutoMovieMotionEvent[] = work.plan.events.filter(
    (event: IAutoMovieMotionEvent): boolean => event.name.startsWith("contact"),
  );
  return (
    hits.length > 0 &&
    hits.every((event: IAutoMovieMotionEvent): boolean => {
      const t: number = work.start + work.plan.duration * event.share;
      const frame = film.prop("hammer", t);
      const face: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          hammer.site("face").translation,
        ),
      );
      return Vector3.distance(face, point) <= CONTACT;
    })
  );
}
