import {
  physicalShapeBounds,
  physicalShapePairDistance,
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

import { HumanSignature } from "../audit/HumanSignature";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanSegmentPlant } from "../perform/HumanSegmentPlant";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Depth a segment that does not bear on a fixture may enter it, metres
 * (provisional: under the audits' built skin give,
 * `AutoMovieMotionHumanAuditSkin.BUILT`).
 */
const ROOM: number = 0.007;

/**
 * Depth a hand or foot bearing on the fixture may enter it, metres
 * (provisional: a loaded sole or palm pressed into its support).
 */
const CONTACT: number = 0.02;

/**
 * Require the fully posed actor to clear named stationary shapes throughout a
 * crossing. The plan is sampled at the motion signature's times and at its end,
 * each sample resolved and planted as the performance displays it, and every
 * body collider tested against every fixture shape. A segment may enter a shape
 * by `ROOM`, a hand or foot inside a window that bears on that fixture by
 * `CONTACT`.
 *
 * @param context The body and the prop readers, read at the action's start.
 * @param plan The complete crossing, with its airborne rotation already set for
 *   a flight.
 * @param subjects The fixtures: the barrier, or the departure and landing
 *   decks.
 * @throws {HumanRefusal} For a fixture without stationary shapes, or with the
 *   deepest entry beyond its allowance, naming the bone, fixture, depth and
 *   time.
 */
export function crossingClearance(
  context: IAutoMovieMotionHumanActionContext,
  plan: IAutoMovieMotionHumanActionPlan,
  subjects: readonly string[],
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
        throw new HumanRefusal({
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
            bounds: physicalShapeBounds(pose, shape),
          }),
        ),
      };
    },
  );
  const body: IAutoMovieMotionHumanBody = context.body;
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  let collision: ICollision | undefined;
  for (const seconds of [
    ...HumanSignature.times(0, plan.duration),
    plan.duration,
  ]) {
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
    for (const segment of HumanColliders.placed(body, poseBones(body, posed))) {
      for (const shape of segment.shapes) {
        const bounds: IAutoMoviePhysicalShapeBounds.IResult =
          physicalShapeBounds(segment.pose, shape);
        for (const fixture of fixtures) {
          const allowance: number = bearing(
            plan.contacts,
            fixture.subject,
            segment.bone,
            share,
          )
            ? CONTACT
            : ROOM;
          for (const barrier of fixture.shapes) {
            if (!overlap(bounds, barrier.bounds)) continue;
            const gap: number = physicalShapePairDistance(
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
    throw new HumanRefusal({
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

/** A fixture shape placed in the world with its bounds. */
interface IFixtureShape {
  /** The shape in the fixture's frame. */
  shape: IAutoMoviePhysicalShape;

  /** Its world bounds. */
  bounds: IAutoMoviePhysicalShapeBounds.IResult;
}

/** A named fixture placed at the action's start. */
interface IFixture {
  /** Its subject. */
  subject: string;

  /** Its world frame. */
  pose: IAutoMovieRigidTransform;

  /** Its shapes. */
  shapes: IFixtureShape[];
}

/** The deepest entry of a body segment into a fixture beyond its allowance. */
interface ICollision {
  /** The entering bone. */
  bone: AutoMovieHumanoidBone;

  /** The fixture entered. */
  subject: string;

  /** When, seconds since the action's start. */
  seconds: number;

  /** The signed distance, metres; negative inside. */
  gap: number;

  /** The depth beyond the allowance, metres. */
  excess: number;
}

/** Whether two axis-aligned bounds overlap. */
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

/** Whether a hand or foot bone bears on the fixture at this share of the action. */
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
