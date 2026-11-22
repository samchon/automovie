import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCover,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWalkGait,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import { coverWall } from "./coverWall";

/** The trunk's default gap from the face while sidling, metres (provisional). */
const OFFSET: number = 0.05;

/** How far below the sill the head passes, metres (provisional: the crown hidden from a level view). */
const BELOW: number = 0.05;

/** The deepest crouch the walk carries, hip heights (provisional: a half squat). */
const CROUCH: number = 0.45;

/** The trunk's forward pitch at the deepest crouch, degrees (provisional). */
const PITCH: number = 30;

/** The crouched creep's Froude number (provisional: the stalk's slow creep, HumanHorrorGait.STALK). */
const CREEP: number = 0.08;

/**
 * Travel along a staged wall in cover: a sidle steps sideways along the
 * face with the back or chest a set gap from it, and a window passage walks
 * along a window's wall crouched so the head stays below its sill. Both are
 * the ordinary walk on a lane parallel to the face; the window passage
 * lowers the pelvis and pitches the trunk while the head is within the
 * window's width, and refuses a sill the crouch cannot get under.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both moves, the lane, the crouch and the refusal.
 * @evidence contracts/development/design.md#principled-representation Two planners over the face record and the walk.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two moves planCover dispatches to.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lane and the crouch follow from the face, the sill and the body.
 */
export namespace coverTravel {
  /**
   * Sidle along a wall's face.
   *
   * @param context The action's context.
   * @param p The sidle.
   * @returns The walk along the lane.
   * @throws {HumanRefusal} If the stop lies beyond the face's ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the lane, the facing and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The lane lies the trunk's half depth plus the gap off the face; the walk keeps the body facing away from or into the face while it travels along it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lane points, then one walk.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The walk owns its own clearance and timing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and one walk plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the walk's plan.
   */
  export function sidle(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCover.IParams>,
    p: IAutoMovieMotionHumanCover.ISidle,
  ): IAutoMovieMotionHumanActionPlan {
    const face: coverWall.IFace = coverWall.read(context, p.wall, p.face);
    if (Math.abs(p.along) > face.half)
      throw coverWall.refusal(
        "along",
        p.along,
        "the stop is beyond the wall's ends",
      );
    const gap: number =
      (p.offset ?? OFFSET) + context.body.measure.chestDepth / 2;
    const lane = (along: number): IAutoMovieVector3 =>
      Vector3.add(
        face.center,
        Vector3.add(
          Vector3.scale(face.axis, along),
          Vector3.scale(face.normal, gap),
        ),
      );
    const here: number = Vector3.dot(
      Vector3.subtract(context.entry.posture.root, face.center),
      face.axis,
    );
    const away: number = yawOf(face.normal);
    return walk.plan({
      ...context,
      params: {
        to: lane(p.along),
        via: [lane(Math.max(-face.half, Math.min(face.half, here)))],
        facing: { yaw: (p.against ?? "back") === "back" ? away : away + 180 },
        pace: "slow",
      },
    });
  }

  /**
   * Pass a window crouched below its sill.
   *
   * @param context The action's context.
   * @param p The window passage.
   * @returns The crouched walk.
   * @throws {HumanRefusal} If the window has no sill or aperture, or the head cannot get under the sill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the crouch, where it applies and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis drop that puts the head under the sill follows from the standing head height; the walk carries it as its own lowered pelvis, so its feet are planned for the crouch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the window, admit the crouch, then one crouched walk.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The crouch is the sill's own need; a sill too low for it refuses.
   * @evidence contracts/development/implementation.md#efficient-algorithms One walk plan and constant work per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only the walk's plan.
   */
  export function window(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCover.IParams>,
    p: IAutoMovieMotionHumanCover.IWindow,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const face: coverWall.IFace = coverWall.read(context, p.window, "aperture");
    const reader: IAutoMovieMotionHumanPropReader = context.prop(p.window);
    const sill: IAutoMovieAffordance | undefined =
      reader.prop.affordances?.find(
        (item: IAutoMovieAffordance): boolean => item.id === "sill",
      );
    if (sill === undefined)
      throw coverWall.refusal("window", p.window, "the window has no sill");
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const sillHeight: number = world.position.y + sill.frame.translation.y;
    const drop: number = Math.max(
      0,
      body.measure.headHeight - (sillHeight - BELOW),
    );
    if (drop > CROUCH * body.measure.hipHeight)
      throw new HumanRefusal({
        kind: "reach",
        axis: "window",
        value: p.window,
        feasible: {
          kind: "range",
          minimum:
            body.measure.headHeight - CROUCH * body.measure.hipHeight + BELOW,
          maximum: null,
          unit: "m",
        },
        reason: "the sill is lower than the crouched head can pass under",
        fix: "pass a higher window or crawl under it",
      });

    // The lane runs along the room's side of the window wall, a step off it.
    const gap: number = body.measure.chestDepth + body.measure.footLength;
    const lane = (along: number): IAutoMovieVector3 =>
      Vector3.add(
        face.center,
        Vector3.add(
          Vector3.scale(face.axis, along),
          Vector3.scale(face.normal, gap),
        ),
      );
    const here: number = Vector3.dot(
      Vector3.subtract(context.entry.posture.root, face.center),
      face.axis,
    );
    const params: IAutoMovieMotionHumanWalkParams = {
      to: lane(p.along),
      via: [lane(here)],
      pace: "slow",
    };
    // A crouched creep: the walk's own pelvis rides lower by the drop, so the
    // feet are planned for the crouch and the trunk leans over it.
    const walking: IAutoMovieMotionHumanWalkGait = walk.walking(CREEP);
    return walk.locomote(
      { ...context, params },
      {
        ...walking,
        lean: PITCH * (drop / (CROUCH * body.measure.hipHeight)),
        bob: { mean: -drop / body.measure.hipHeight, amplitude: 0 },
      },
    );
  }

  /** The heading, degrees, of a horizontal direction; 0 faces +Z. */
  function yawOf(direction: IAutoMovieVector3): number {
    return (Math.atan2(direction.x, direction.z) * 180) / Math.PI;
  }
}
