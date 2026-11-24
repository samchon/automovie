import {
  type AutoMovieArchetype,
  createBag,
  createPhone,
  createTable,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSearch,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

const { touchEffectors } = AutoMovieMotionHumanTouch;

/**
 * How far ahead of the searcher the bag stands, metres (provisional: within a
 * forearm's reach).
 */
const AHEAD: number = 0.4;

/**
 * Searching an open tote for a phone (#4016).
 *
 * Scenarios, on the average man and the small woman:
 *
 * 1. While rummaging, the fingertips are inside the tote: within its walls and
 *    below its opening.
 * 2. The phone is taken out: at the end it is in the hand above the opening, and
 *    the take is clean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed fingertips at the rummage's strokes and the phone's frame at the end against the tote's own opening; fingertips outside the hollow or a phone left in the bag fails.
 * @evidence contracts/development/testing.md#independent-expectations The tote's walls and opening are its modeled geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases The rummage and the take, on two bodies.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance through the public chain.
 */
export function test_motion_search_bag_search(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
      const tote: AutoMovieArchetype<
        createBag.Affordance,
        createBag.Dimension
      > = createBag({ kind: "tote" });
      const width: number = tote.dimensions.width!;
      const depth: number = tote.dimensions.depth!;
      const height: number = tote.dimensions.height!;
      // The tote stands on a workbench's top, at the bench's own drawn height.
      const table: AutoMovieArchetype<
        createTable.Affordance,
        createTable.Dimension
      > = createTable({ kind: "workbench" });
      const at: IAutoMovieVector3 = {
        x: 0,
        y: table.dimensions.height!,
        z: AHEAD,
      };
      const film: HumanPerformance = new HumanPerformance({
        seed: "bag search",
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
          HumanObject.prop("table", table, {
            at: { x: 0, y: 0, z: AHEAD },
            yaw: 0,
            fixed: true,
          }),
          HumanObject.prop("tote", tote, { at, yaw: 0, fixed: true }),
          HumanObject.prop("phone", createPhone(), {
            at: { ...at, y: at.y + createBag.WALL },
            yaw: 90,
          }),
        ],
        composition: AutoMovieMotionHumanSearch.searchBag(
          HumanChain.subject("a"),
          {
            bag: "tote",
            item: "phone",
            handle: "grip",
            depth: height,
          },
        ).node,
      });
      verdict(checks, `${fit} searches the tote`, film);

      const rummage: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      const strokes: number[] = rummage.plan.events
        .filter((event: IAutoMovieMotionEvent): boolean =>
          event.name.startsWith("stroke"),
        )
        .map(
          (event: IAutoMovieMotionEvent): number =>
            rummage.start + event.share * rummage.plan.duration,
        );
      checks.check(
        `${fit}: the fingertips rummage inside the tote`,
        strokes.length > 0 &&
          strokes.every((t: number): boolean => {
            const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
              film.bones("a", t);
            const tip: IAutoMovieVector3 =
              AutoMovieMotionHumanTouchEffector.point(
                body,
                bones,
                "right",
                touchEffectors.TABLE.fingertips,
              );
            return (
              Math.abs(tip.x - at.x) <= width / 2 &&
              Math.abs(tip.z - at.z) <= depth / 2 &&
              tip.y < at.y + height
            );
          }),
      );

      const end: number = film.duration;
      const phone: IAutoMovieRigidTransform = film.prop("phone", end);
      const hand: IAutoMovieResolvedBone = film
        .bones("a", end)
        .get("rightHand")!;
      const offset: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(phone.position, hand.worldPosition),
      );
      checks.check(
        `${fit}: the phone comes out in the hand above the opening (${(offset.x * 1000).toFixed(0)}, ${(offset.y * 1000).toFixed(0)}, ${(offset.z * 1000).toFixed(0)} mm from the wrist)`,
        phone.position.y > at.y + height &&
          Vector3.length(offset) <= body.measure.hand,
      );
    } catch (error: unknown) {
      checks.check(`${String(fit)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("search bag search");
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
