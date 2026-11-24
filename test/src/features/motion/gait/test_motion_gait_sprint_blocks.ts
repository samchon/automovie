import { createStartingBlock } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAthletics,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanSport } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Seat a sprint start's feet on a placed starting block's plates.
 *
 * Scenarios:
 *
 * 1. On a block set to the athlete's own body-scaled set (its front plate's lower
 *    edge at that set's right ball), each ball rests within 10 mm of its
 *    plate's lower edge and each displayed ankle stands off its plate's face by
 *    the same body's standing ankle height within 10 mm and within half the
 *    plate's width across it, for two body proportions.
 * 2. Each ankle holds its place from the set to the gun within 2 mm, and both foot
 *    windows bear on the block prop.
 * 3. The front plate lies on the runner's right, so with a drive the left foot
 *    leaves its plate at `rearBlockOff` and the right foot at `blockExit`.
 * 4. Authoring the left foot in front of that block is refused on `front` with
 *    `right` as the alternative, and a block turned to face away is refused on
 *    `on`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seating, hold, side and refusal cases and their metre bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Plans through the public lexicon with a placed archetype and measures resolved skeletons against the prop's own plate frames.
 * @evidence contracts/development/testing.md#independent-expectations The plate faces come from the archetype, the ankle's height above its sole from the same body standing flat, and the front side from the block's documented plate layout.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies on one block, a contradicting front foot and a reversed block next to the admitted placement.
 * @evidence contracts/development/testing.md#execution-ownership Uses the shared Human fixture and in-memory performances without a render or external process.
 */
export function test_motion_gait_sprint_blocks(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  let last: IPlacedBlock | undefined;
  for (const name of ["m-average", "f-average"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(name);

      // The athlete sets the block to their own set: the front plate where
      // the body-scaled setting puts the right foot's sole, the rear plate as
      // far behind as that setting puts the left one, within the block's band.
      const free: HumanPerformance = perform(body, undefined, 0, {
        hold: 0.4,
        front: "right",
      });
      const freeSet: number = when(free.segments("a")[1]!, "set") + 1e-3;
      const front: IAutoMovieVector3 = socket(
        free,
        body,
        freeSet,
        "right",
        "ball",
      );
      const rear: IAutoMovieVector3 = socket(
        free,
        body,
        freeSet,
        "left",
        "ball",
      );
      const block: ReturnType<typeof createStartingBlock> = createStartingBlock(
        {
          model: "PBS-01",
          spacing: Math.min(0.45, Math.max(0.25, front.z - rear.z)),
          angle: 90 - 50,
        },
      );
      const plate: IAutoMovieVector3 = lowerEdge(block, "front");
      const blockAt: IAutoMovieVector3 = {
        x: front.x - plate.x,
        y: 0,
        z: front.z - plate.z,
      };
      last = { body, block, at: blockAt };
      const width: number = block.affordance("front").width!;
      const start: HumanPerformance = perform(body, last, 0, {
        hold: 0.4,
        drive: 0.3,
      });
      verdict(checks, "sprint blocks", start);
      const action: IAutoMovieMotionHumanSegment = start.segments("a")[1]!;
      const set: number = when(action, "set");
      const gun: number = when(action, "gun");
      const placed: IAutoMovieRigidTransform = {
        position: blockAt,
        rotation: Quaternion.identity(),
      };
      for (const [foot, plate] of [
        ["rightFoot", "front"],
        ["leftFoot", "rear"],
      ] as const) {
        const face: IAutoMovieRigidTransform = worldFace(block, placed, plate);
        const normal: IAutoMovieVector3 = Quaternion.rotateVector(
          face.rotation,
          {
            x: 0,
            y: 1,
            z: 0,
          },
        );
        const across: IAutoMovieVector3 = Quaternion.rotateVector(
          face.rotation,
          {
            x: 1,
            y: 0,
            z: 0,
          },
        );
        const standing: number = ankle(start, 0.1, foot).y;
        const seated: IAutoMovieVector3 = ankle(start, set + 1e-3, foot);
        const offset: IAutoMovieVector3 = Vector3.subtract(
          seated,
          face.position,
        );
        const edge: IAutoMovieVector3 = Vector3.add(
          blockAt,
          lowerEdge(block, plate),
        );
        const ball: IAutoMovieVector3 = socket(
          start,
          body,
          set + 1e-3,
          foot === "leftFoot" ? "left" : "right",
          "ball",
        );
        checks.check(
          `${name} ${foot} rests its ball on the ${plate} plate's lower edge (${(Vector3.distance(ball, edge) * 1000).toFixed(1)} mm)`,
          Vector3.distance(ball, edge) <= 0.01,
        );
        checks.check(
          `${name} ${foot} stands its sole's height off the ${plate} plate`,
          Math.abs(Vector3.dot(offset, normal) - standing) <= 0.01 &&
            Math.abs(Vector3.dot(offset, across)) <= width / 2,
        );
        checks.check(
          `${name} ${foot} holds its plate from the set to the gun`,
          Vector3.distance(seated, ankle(start, gun - 1e-3, foot)) <= 0.002,
        );
        const support: IAutoMovieMotionHumanContactWindow["support"] = contact(
          action,
          foot,
        ).support;
        checks.check(
          `${name} ${foot} bears on the block`,
          support?.kind === "prop" && support.subject === "blocks",
        );
      }
      checks.check(
        `${name} leaves the rear plate with the left foot first`,
        Math.abs(end(action, "leftFoot") - when(action, "rearBlockOff")) <=
          1e-6 &&
          Math.abs(end(action, "rightFoot") - when(action, "blockExit")) <=
            1e-6,
      );
    } catch (error: unknown) {
      checks.check(`${String(name)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const refusal: (
    yaw: number,
    front: AutoMovieHumanSide | undefined,
  ) => HumanRefusal | undefined = (
    yaw: number,
    front: AutoMovieHumanSide | undefined,
  ): HumanRefusal | undefined => {
    try {
      perform(last!.body, last, yaw, {
        hold: 0.4,
        ...(front === undefined ? {} : { front }),
      });
    } catch (error) {
      if (error instanceof HumanRefusal) return error;
      throw error;
    }
    return undefined;
  };
  const contrary: HumanRefusal | undefined = refusal(0, "left");
  checks.check(
    "a left front foot on a right-front block is refused on front",
    contrary?.kind === "parameter" && contrary.axis === "front",
  );
  const reversed: HumanRefusal | undefined = refusal(180, undefined);
  checks.check(
    "a block facing away from the runner is refused on on",
    reversed?.kind === "affordance" && reversed.axis === "on",
  );
  checks.assert("gait sprint blocks");
}

/** A starting block set for one athlete. */
interface IPlacedBlock {
  /** The athlete. */
  body: IAutoMovieMotionHumanBody;

  /** The block model. */
  block: ReturnType<typeof createStartingBlock>;

  /** Where the block stands, world metres. */
  at: IAutoMovieVector3;
}

/**
 * Stand, then crouch into the set: on the placed block when one is given,
 * otherwise on the body-scaled setting.
 */
function perform(
  body: IAutoMovieMotionHumanBody,
  placed: IPlacedBlock | undefined,
  yaw: number,
  params: IAutoMovieMotionHumanAthletics.IParams,
): HumanPerformance {
  return new HumanPerformance({
    seed: "sprint-blocks",
    laws: [HumanSport.sprintStart],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props:
      placed === undefined
        ? []
        : [HumanObject.prop("blocks", placed.block, { at: placed.at, yaw })],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .registered(
        "sprintStart",
        placed === undefined ? params : { ...params, on: "blocks" },
      ).node,
  });
}

/** A plate face's world frame on the block placed at `placed`. */
function worldFace(
  block: ReturnType<typeof createStartingBlock>,
  placed: IAutoMovieRigidTransform,
  plate: createStartingBlock.Affordance,
): IAutoMovieRigidTransform {
  const frame: IAutoMovieTransform = block.affordance(plate).frame;
  return {
    position: Vector3.add(
      placed.position,
      Quaternion.rotateVector(placed.rotation, frame.translation),
    ),
    rotation: Quaternion.multiply(placed.rotation, frame.rotation),
  };
}

/** The absolute film second of a required event. */
function when(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event:
    | IAutoMovieMotionHumanSegment["plan"]["events"][number]
    | undefined = segment.plan.events.find(
    (
      candidate: IAutoMovieMotionHumanSegment["plan"]["events"][number],
    ): boolean => candidate.name === name,
  );
  if (event === undefined)
    throw new Error(segment.name + " has no " + name + " event");
  return segment.start + event.share * segment.plan.duration;
}

/** A required contact window for the indicated part. */
function contact(
  segment: IAutoMovieMotionHumanSegment,
  part: IAutoMovieMotionHumanContactWindow["part"],
): IAutoMovieMotionHumanContactWindow {
  const found: IAutoMovieMotionHumanContactWindow | undefined =
    segment.plan.contacts.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === part,
    );
  if (found === undefined)
    throw new Error(segment.name + " has no contact for " + part);
  return found;
}

/** The film second a part's contact window ends. */
function end(
  segment: IAutoMovieMotionHumanSegment,
  part: IAutoMovieMotionHumanContactWindow["part"],
): number {
  return segment.start + contact(segment, part).to * segment.plan.duration;
}

/**
 * The middle of a plate's lower edge in the block's own frame: half the plate's
 * depth down its face from the face's centre.
 */
function lowerEdge(
  block: ReturnType<typeof createStartingBlock>,
  plate: createStartingBlock.Affordance,
): IAutoMovieVector3 {
  const frame: IAutoMovieTransform = block.affordance(plate).frame;
  const slope: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  return Vector3.add(
    frame.translation,
    Vector3.scale(
      slope.y < 0 ? slope : Vector3.scale(slope, -1),
      block.affordance(plate).depth! / 2,
    ),
  );
}

/** One displayed foot socket at a film second. */
function socket(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
  point: Parameters<typeof HumanFoot.point>[2],
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = film
    .bones("a", time)
    .get(`${side}Foot`)!;
  return HumanFoot.point(body, side, point, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}

/** One displayed ankle at a film second. */
function ankle(
  film: HumanPerformance,
  time: number,
  bone: AutoMovieHumanoidBone,
): IAutoMovieVector3 {
  return film.bones("a", time).get(bone)!.worldPosition;
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
