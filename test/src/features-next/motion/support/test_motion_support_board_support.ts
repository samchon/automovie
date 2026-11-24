import {
  createIceSkate,
  createSkateboard,
  createSki,
  createSnowboard,
  createSurfboard,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSurface,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../features/internal/archetypeExtent";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/** The existing motion specification admits displayed prop support within 10 mm. */
const CONTACT: number = 0.01;

/** The established archetype placed-contact tolerance, in metres. */
const GEOMETRY: number = 0.001;

/**
 * A placed two-foot stance stays on an independently translated and turned
 * board. The equipment produces physical reference points for that work.
 *
 * Scenarios:
 * 1. The standard support action places both feet on a surfboard deck, then
 *    a ride carries both foot and toe frames with the moving prop.
 * 2. Public skateboard, surfboard, ski, skate and snowboard affordances
 *    agree with their physical parts or primary dimensions.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the moving support and measured equipment cases.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public chain's support windows and displayed ankle and toe frames through deck motion. Queries the geometric bounds and public equipment positions so a missing or floating contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The externally prescribed prop frame supplies a covariance check for the entered stance. Geometry checks use independent collider bounds and CCM and Burton published sizes. The equipment bounds say nothing about interaction loads.
 * @evidence contracts/development/testing.md#distinguishing-cases A settled start and a translated, yawed end distinguish deck from world locking. Wheels and tail underside differ from stance anchors, and published skate and board dimensions are checked separately.
 * @evidence contracts/development/testing.md#execution-ownership This named in-memory case reads a public performance and archetype fixtures with no native host or playback visual requirement.
 */
export function test_motion_support_board_support(): void {
  const failures: string[] = [];
  for (const key of BODIES)
    try {
      take(key, failures);
    } catch (error) {
      failures.push(
        `${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("board support", failures, []);
}

/** The two canonical bodies. */
const BODIES: readonly BodyKey[] = ["m-average", "f-small"];

/** A canonical body's key. */
type BodyKey = "m-average" | "f-small";

/**
 * The take on one body, its verdicts recorded.
 *
 * @param key The body.
 * @param failures Where a verdict fault is recorded.
 */
function take(key: BodyKey, failures: string[]): void {
  const surfboard: ReturnType<typeof createSurfboard> = createSurfboard({
    model: "6'0",
  });
  const deck: number = surfboard.affordance("deck").frame.translation.y;
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
  const stance: motionHumanLaw.Bones = motionHumanStance(body);
  const left: IAutoMovieVector3 = stance.get("leftToes")!.worldPosition;
  const right: IAutoMovieVector3 = stance.get("rightToes")!.worldPosition;
  /** Independent prop frame with a pause for placement, then travel and yaw. */
  const rideFrame = (seconds: number): IAutoMovieRigidTransform => {
    const t: number = Math.max(0, seconds - 1);
    return {
      position: { x: 0.9 * t, y: -deck, z: 0.4 * t },
      rotation: Quaternion.fromAxisAngle(up, 18 * t),
    };
  };
  const board: IAutoMovieMotionHumanProp = {
    subject: "board",
    frame: rideFrame(0),
    motion: rideFrame,
    points: {
      left: { point: { x: left.x, y: deck, z: left.z }, normal: up },
      right: { point: { x: right.x, y: deck, z: right.z }, normal: up },
    },
  };
  const film: motionHumanLaw.IFilm = motionHumanLaw.film(
    new HumanPerformance({
      seed: "exercise-board",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [board],
      laws: [AutoMovieMotionHumanRide.HumanSurface.boardRide],
      composition: HumanChain.subject("a")
        .support({
          stances: [
            {
              seconds: 0.5,
              contacts: [
                {
                  part: "leftFoot",
                  kind: "bear",
                  target: { kind: "prop", subject: "board", point: "left" },
                },
                {
                  part: "rightFoot",
                  kind: "bear",
                  target: { kind: "prop", subject: "board", point: "right" },
                },
              ],
            },
          ],
        })
        .registered(AutoMovieMotionHumanRide.HumanSurface.boardRide.name, {
          on: "board",
          duration: 2.2,
        } satisfies IAutoMovieMotionHumanSurface.IBoardRideParams).node,
    }),
  );
  collectTakeClean(`${key} board ride`, film.performance, failures);
  const riding: IAutoMovieMotionHumanSegment = film.performance
    .segments("a")
    .find(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.name === AutoMovieMotionHumanRide.HumanSurface.boardRide.name,
    )!;
  TestValidator.predicate(
    "both feet stay planted in the board's own frame",
    (["leftFoot", "rightFoot"] as const).every((part): boolean =>
      riding.plan.contacts.some(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === part &&
          contact.kind === "plant" &&
          contact.support.kind === "prop" &&
          contact.support.subject === "board" &&
          contact.from === 0 &&
          contact.to === 1,
      ),
    ),
  );
  const start: number = riding.start + 0.1;
  const end: number = riding.start + 1.8;
  const before: motionHumanLaw.Bones = film.bones("a", start);
  const after: motionHumanLaw.Bones = film.bones("a", end);
  /** Resolve a displayed world point in the prescribed board's local frame. */
  const local = (
    point: IAutoMovieVector3,
    seconds: number,
  ): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = rideFrame(seconds);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.position),
    );
  };
  for (const bone of [
    "leftToes",
    "rightToes",
    "leftFoot",
    "rightFoot",
  ] as const) {
    const initial: IAutoMovieVector3 = before.get(bone)!.worldPosition;
    const final: IAutoMovieVector3 = after.get(bone)!.worldPosition;
    TestValidator.predicate(
      `${bone} moves in world space and stays within 10 mm in the moving board frame`,
      Vector3.distance(initial, final) > 0.5 &&
        vclose(local(initial, start), local(final, end), CONTACT),
    );
  }

  const skateboard: ReturnType<typeof createSkateboard> = createSkateboard();
  const ski: ReturnType<typeof createSki> = createSki();
  const skate: ReturnType<typeof createIceSkate> = createIceSkate();
  const snowboard: ReturnType<typeof createSnowboard> = createSnowboard();
  const length: number = archetypeExtent(skate, "z", ["runner"]).size;
  TestValidator.predicate(
    "the skate's 263 mm runner and both edges touch the same lower line",
    nclose(length, 0.263, GEOMETRY) &&
      nclose(skate.affordance("leftEdge").frame.translation.y, 0, GEOMETRY) &&
      nclose(skate.affordance("rightEdge").frame.translation.y, 0, GEOMETRY) &&
      skate.affordance("leftEdge").frame.translation.x >
        skate.affordance("rightEdge").frame.translation.x,
  );
  TestValidator.predicate(
    "the snowboard has the published 154 cm length and 53 cm binding spacing",
    nclose(archetypeExtent(snowboard, "z").size, 1.54, GEOMETRY) &&
      nclose(
        Vector3.distance(
          snowboard.affordance("frontBinding").frame.translation,
          snowboard.affordance("rearBinding").frame.translation,
        ),
        0.53,
        GEOMETRY,
      ),
  );
  TestValidator.predicate(
    "the other terrain props expose their lower contacts at the placed geometry",
    nclose(
      ski.affordance("base").frame.translation.y,
      archetypeExtent(ski, "y").low,
      GEOMETRY,
    ) &&
      nclose(
        surfboard.affordance("leftRail").frame.translation.x,
        archetypeExtent(surfboard, "x").high,
        GEOMETRY,
      ) &&
      nclose(
        skateboard.affordance("wheel-front-left").frame.translation.y,
        archetypeExtent(skateboard, "y", ["wheel-front-left"]).low,
        GEOMETRY,
      ) &&
      nclose(
        skateboard.affordance("tailStrike").frame.translation.y,
        archetypeExtent(skateboard, "y", ["deck"]).low,
        GEOMETRY,
      ),
  );
}
