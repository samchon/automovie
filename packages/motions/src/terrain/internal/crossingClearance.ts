import {

  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieMotionHumanSignature } from "../../audit/AutoMovieMotionHumanSignature";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSegmentPlant } from "../../perform/internal/HumanSegmentPlant";
import { HumanColliderPlacement } from "../../posture/internal/HumanColliderPlacement";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import * as CrossingClearanceData from "./CrossingClearanceData";

/*
 * Require the fully posed actor to clear named stationary shapes throughout a
 * crossing. The plan is sampled at the motion signature's times and at its end,
 * each sample resolved and planted as the performance displays it, and every
 * body collider tested against every fixture shape. A segment may enter a shape
 * by `ROOM`, a hand or foot inside a window that bears on that fixture by
 * `CONTACT`.
 * Parameter context: The body and the prop readers, read at the action's start.
 * Parameter plan: The complete crossing, with its airborne rotation already set for
 * a flight.
 * Parameter subjects: The fixtures: the barrier, or the departure and landing
 * decks.
 * Parameter options: A tighter check on selected body segments and time knots.
 * For a fixture without stationary shapes, or with the
 * deepest entry beyond its allowance, naming the bone, fixture, depth and
 * time.
 */
export function crossingClearance(
  context: Pick<IAutoMovieMotionHumanActionContext, "body" | "prop" | "start">,
  plan: IAutoMovieMotionHumanActionPlan,
  subjects: readonly string[],
  options: crossingClearance.IOptions = {},
): void {
  const fixtures: IFixture[] = [...new Set(subjects)].map(
    (subject: string): IFixture => {
      const fixture: IAutoMovieMotionHumanPropReader = context.prop(subject);
      if (
        fixture.prop.fixed !== true ||
        fixture.prop.motion !== undefined ||
        fixture.prop.hasArticulations === true ||
        !fixture.prop.shapes?.length
      )
        throw new AutoMovieMotionHumanRefusal({
          kind: "affordance",
          axis: "obstacle",
          value: subject,
          reason: subject + " needs stationary collision shapes for a crossing",
          fix: "stage a fixed archetype with shaped geometry",
        });
      const pose: IAutoMovieRigidTransform = fixture.frame(context.start);
      return {
        subject,
        pose,
        shapes: fixture.prop.shapes.map(
          (shape: IAutoMoviePhysicalShape): IFixtureShape => ({
            shape,
            bounds: AutoMovieEnginePhysics.physicalShapeBounds(pose, shape),
          }),
        ),
      };
    },
  );
  const body: IAutoMovieMotionHumanBody = context.body;
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const names: ReadonlySet<AutoMovieHumanoidBone> =
    options.bones ?? body.colliders.bones;
  const readBones: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    names,
  );
  const placed: ReturnType<typeof HumanColliderPlacement.preparePlaced> =
    HumanColliderPlacement.preparePlaced(body, names);
  let collision: ICollision | undefined;
  const times: Set<number> = new Set([
    ...AutoMovieMotionHumanSignature.times(0, plan.duration, options.rate),
    ...(options.marks ?? []),
    plan.duration,
  ]);
  for (const seconds of times) {
    const share: number = seconds / plan.duration;
    const posture: IAutoMovieMotionHumanPosture = plan.posture(seconds);
    const result: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      undefined,
      undefined,
      project,
    ).pose;
    const posed: IAutoMoviePose = HumanSegmentPlant.fit(
      body,
      prepareHumanPostureProjection.project(body, result, project),
      posture.limbs,
    ).pose;
    for (const segment of placed(readBones(posed))) {
      for (const shape of segment.shapes) {
        const bounds: IAutoMoviePhysicalShapeBounds.IResult =
          AutoMovieEnginePhysics.physicalShapeBounds(segment.pose, shape);
        for (const fixture of fixtures) {
          const allowance: number = bearing(
            plan.contacts,
            fixture.subject,
            segment.bone,
            share,
          )
            ? CrossingClearanceData.CONTACT
            : (options.allowance ?? CrossingClearanceData.ROOM);
          for (const barrier of fixture.shapes) {
            if (!overlap(bounds, barrier.bounds)) continue;
            const gap: number = AutoMovieEnginePhysics.physicalShapePairDistance(
              segment.pose,
              shape,
              fixture.pose,
              barrier.shape,
            );
            const excess: number = -gap - allowance;
            if (excess > (collision?.excess ?? 0))
              collision = {
                bone: segment.bone,
                subject: fixture.subject,
                seconds,
                gap,
                excess,
              };
          }
        }
      }
    }
  }
  if (collision !== undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "obstacle",
      value: collision.subject,
      reason:
        collision.bone +
        " intersects " +
        collision.subject +
        " by " +
        (-collision.gap).toFixed(3) +
        " m at " +
        collision.seconds.toFixed(3) +
        " s",
      fix: "change the approach, crossing clearance or staging of the supports",
    });
}

/*
 * Options for the shared finite-solid crossing check.
 */
export namespace crossingClearance {
  /*
   * Geometry and time bounds for a law that owns specialized clearance.
   */
  export interface IOptions {
    /*
     * The body segments that can enter the obstacle.
     */
    bones?: ReadonlySet<AutoMovieHumanoidBone>;
    /*
     * Exact shape-change and crossing knots in local seconds.
     */
    marks?: readonly number[];
    /*
     * Sampling rate per second for interior clearance.
     */
    rate?: number;
    /*
     * Permitted non-bearing penetration in metres.
     */
    allowance?: number;
  }

  /*
   * Posed exterior of both feet, toes and shanks.
   */
  export const LOWER_LEGS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftLowerLeg",
    "leftFoot",
    "leftToes",
    "rightLowerLeg",
    "rightFoot",
    "rightToes",
  ]);
}

/*
 * Whether two axis-aligned bounds overlap.
 */
function overlap(
  a: IAutoMoviePhysicalShapeBounds.IResult,
  b: IAutoMoviePhysicalShapeBounds.IResult,
): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

/*
 * Whether a hand or foot bone bears on the fixture at this share of the action.
 */
function bearing(
  windows: readonly IAutoMovieMotionHumanContactWindow[],
  subject: string,
  bone: AutoMovieHumanoidBone,
  share: number,
): boolean {
  const foot: boolean = bone.endsWith("Foot") || bone.endsWith("Toes");
  const hand: boolean = /Hand$|Thumb|Index|Middle|Ring|Little/.test(bone);
  if (!foot && !hand) return false;
  const part: IAutoMovieMotionHumanContactWindow["part"] = bone.startsWith(
    "left",
  )
    ? foot
      ? "leftFoot"
      : "leftHand"
    : foot
      ? "rightFoot"
      : "rightHand";
  return windows.some(
    (contact) =>
      contact.part === part &&
      contact.support.kind === "prop" &&
      contact.support.subject === subject &&
      share >= contact.from &&
      share <= contact.to,
  );
}

/*
 * A fixture shape placed in the world with its bounds.
 */
interface IFixtureShape {
  /*
   * The shape in the fixture's frame.
   */
  shape: IAutoMoviePhysicalShape;

  /*
   * Its world bounds.
   */
  bounds: IAutoMoviePhysicalShapeBounds.IResult;
}

/*
 * A named fixture placed at the action's start.
 */
interface IFixture {
  /*
   * Its subject.
   */
  subject: string;

  /*
   * Its world frame.
   */
  pose: IAutoMovieRigidTransform;

  /*
   * Its shapes.
   */
  shapes: IFixtureShape[];
}

/*
 * The deepest entry of a body segment into a fixture beyond its allowance.
 */
interface ICollision {
  /*
   * The entering bone.
   */
  bone: AutoMovieHumanoidBone;

  /*
   * The fixture entered.
   */
  subject: string;

  /*
   * When, seconds since the action's start.
   */
  seconds: number;

  /*
   * The signed distance, metres; negative inside.
   */
  gap: number;

  /*
   * The depth beyond the allowance, metres.
   */
  excess: number;
}
