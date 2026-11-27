import { AutoMovieEngineVector3 } from "@automovie/engine";
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

import { walk } from "../../gait/internal/walk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { coverWall } from "./coverWall";

/*
 * Travel along a staged wall in cover: a sidle steps sideways along the face
 * with the back or chest a set gap from it, and a window passage walks along a
 * window's wall crouched so the head stays below its sill. Both are the
 * ordinary walk on a lane parallel to the face; the window passage lowers the
 * pelvis and pitches the trunk while the head is within the window's width, and
 * refuses a sill the crouch cannot get under.
 */
export namespace coverTravel {
  /*
   * Sidle along a wall's face.
   * Parameter context: The action's context.
   * Parameter p: The sidle.
   * Returns: The walk along the lane.
   * If the stop lies beyond the face's ends.
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
      AutoMovieEngineVector3.add(
        face.center,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(face.axis, along),
          AutoMovieEngineVector3.scale(face.normal, gap),
        ),
      );
    // The walk sidles straight from where the body stands to the stop on
    // the lane: a leg onto the lane first would be a step of a few
    // centimetres, too short to step.
    const away: number = yawOf(face.normal);
    return walk.plan({
      ...context,
      params: {
        to: lane(p.along),
        facing: { yaw: (p.against ?? "back") === "back" ? away : away + 180 },
        pace: "slow",
      },
    });
  }

  /*
   * Pass a window crouched below its sill.
   * Parameter context: The action's context.
   * Parameter p: The window passage.
   * Returns: The crouched walk.
   * If the window has no sill or aperture, or the head
   * cannot get under the sill.
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
      throw new AutoMovieMotionHumanRefusal({
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
      AutoMovieEngineVector3.add(
        face.center,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(face.axis, along),
          AutoMovieEngineVector3.scale(face.normal, gap),
        ),
      );
    const here: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.subtract(context.entry.posture.root, face.center),
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

  /*
   * The heading, degrees, of a horizontal direction; 0 faces +Z.
   */
  function yawOf(direction: IAutoMovieVector3): number {
    return (Math.atan2(direction.x, direction.z) * 180) / Math.PI;
  }
}

/*
 * The trunk's default gap from the face while sidling, metres (provisional).
 */
const OFFSET: number = 0.05;

/*
 * How far below the sill the head passes, metres (provisional: the crown hidden
 * from a level view).
 */
const BELOW: number = 0.05;

/*
 * The deepest crouch the walk carries, hip heights (provisional: a half squat).
 */
const CROUCH: number = 0.45;

/*
 * The trunk's forward pitch at the deepest crouch, degrees (provisional).
 */
const PITCH: number = 30;

/*
 * The crouched creep's Froude number (provisional: the stalk's slow creep,
 * HumanHorrorGait.STALK).
 */
const CREEP: number = 0.08;
