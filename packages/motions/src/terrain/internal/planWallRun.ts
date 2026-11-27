import { Quaternion, Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPropReader, IAutoMovieMotionHumanSupport, IAutoMovieMotionHumanWallRun, IAutoMovieMotionTarget, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { coverWall } from "../../cover/internal/coverWall";
import { getUp } from "../../floor/internal/getUp";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { planWallRunFlight } from "./planWallRunFlight";
import * as PlanWallRunData from "./PlanWallRunData";

/*
 * Use a wall's face as a brief foot support: a wall step plants one foot on the
 * face beside the other on the floor; a wall run plants it, pushes off it to
 * catch the wall's top edge with both hands, hangs, and walks both feet onto
 * the face, a cat hang. The shared support law fits the stances on points of
 * the named face and top; standing, the body keeps the upright stood pose.
 * Every foot window on the face is then checked against its friction cone while
 * the foot carries the body alone, before the hands take the top: the line from
 * the planted toe to the hips must lean off the face's normal by no more than
 * `atan(FRICTION)` (a static stand-in for the contact force's direction). A top
 * beyond the hands' reach from the first step is refused with the shortfall.
 * Parameter context: The action's context, standing before the wall and facing it.
 * Returns: The wall step or run.
 * For a missing top, an unreachable top or a wall
 * contact outside its friction cone.
 */
export function planWallRun(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWallRun.IParams>,
): IAutoMovieMotionHumanActionPlan {
  const p: IAutoMovieMotionHumanWallRun.IParams = context.params;
  const body: IAutoMovieMotionHumanBody = context.body;
  const measure: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const face: coverWall.IFace = coverWall.read(context, p.wall, p.face);
  const lead: AutoMovieHumanSide = p.foot ?? "right";
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const entry: ReturnType<typeof poseBones> = poseBones(
    body,
    context.entry.pose,
  );
  const toe = (side: AutoMovieHumanSide): IAutoMovieVector3 =>
    entry.get(`${side}Toes`)!.worldPosition;

  // Points of the face in front of each foot, at a height, a sole off it.
  const onFace = (
    side: AutoMovieHumanSide,
    height: number,
  ): IAutoMovieVector3 => {
    const along: number = Vector3.dot(
      Vector3.subtract(toe(side), face.center),
      face.axis,
    );
    return Vector3.add(
      Vector3.add(face.center, Vector3.scale(face.axis, along)),
      Vector3.add(Vector3.scale(face.normal, PlanWallRunData.SOLE), { x: 0, y: height, z: 0 }),
    );
  };
  const staged: Map<string, IAutoMovieVector3> = new Map();
  const target = (
    key: string,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionTarget => {
    staged.set(key, point);
    return { kind: "prop", subject: p.wall, point: key };
  };
  // The floor the performer stands on: a foot's target on it is a floor
  // contact, the toes over the point and the sole borne flat on the floor
  // rather than turning about its toes' joint as the body leans in.
  const floor: number = context.entry.posture.root.y;
  // A foot where it stands, or on the face at a height.
  const foot = (
    side: AutoMovieHumanSide,
    height?: number,
  ): IAutoMovieMotionHumanSupport.IContact => ({
    part: `${side}Foot`,
    kind: "bear",
    target:
      height === undefined
        ? {
            kind: "point",
            frame: "world",
            at: { ...toe(side), y: floor },
            normal: { x: 0, y: 1, z: 0 },
          }
        : target(`${side}Face${height!.toFixed(3)}`, onFace(side, height!)),
  });
  const takeOff: IAutoMovieMotionHumanSupport.IContact = {
    part: `${trail}Foot`,
    kind: "bear",
    target: {
      kind: "point",
      frame: "world",
      at: {
        ...Vector3.add(
          onFace(trail, 0),
          Vector3.scale(face.normal, PlanWallRunData.STEP_IN * measure.hipHeight),
        ),
        y: floor,
      },
      normal: { x: 0, y: 1, z: 0 },
    },
  };
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [
    // Both feet where they stand, so the step in is a swing, not a slide.
    {
      contacts: [foot(lead), foot(trail)],
      seconds: PlanWallRunData.SET,
      event: "set",
      prefer: getUp.POSES.stood,
    },
    // The take-off foot steps in to the wall, where the wall step reaches.
    {
      contacts: [foot(lead), takeOff],
      seconds: PlanWallRunData.BEAT,
      event: "approach",
      prefer: PlanWallRunData.STEPPING,
    },
    {
      contacts: [foot(lead, PlanWallRunData.FIRST * measure.hipHeight), takeOff],
      seconds: PlanWallRunData.BEAT,
      event: "wallStep",
      prefer: PlanWallRunData.STEPPING,
    },
  ];
  if (p.kind === "run") {
    const top: IAutoMovieVector3 = topEdge(context, p.wall, p.top);
    planWallRun.admitTop(top.y, floor, measure, p.top);
    // Each hand takes the top on its own side, the climber's left read off
    // the feet as they enter, whichever way the face's axis runs: a hand
    // sent to the other side crosses the forearms.
    const leftward: number =
      Vector3.dot(Vector3.subtract(toe("left"), toe("right")), face.axis) >= 0
        ? 1
        : -1;
    const hand = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: target(
        `${side}Top`,
        Vector3.add(
          top,
          Vector3.scale(
            face.axis,
            (side === "left" ? 1 : -1) * leftward * measure.shoulderHalfWidth,
          ),
        ),
      ),
    });
    // The push off the wall step carries the body up until its hands catch
    // the top and it hangs from them; the feet then walk onto the face as far
    // below the top as the body hangs from its hands.
    const hang: number = Math.max(
      PlanWallRunData.SECOND * measure.hipHeight,
      top.y - PlanWallRunData.HANG * measure.stature,
    );
    stances.push(
      // The push off lets both feet go before the hands catch the top: the
      // catch is taken in flight, not with a foot still on the floor or the
      // wall step (`IStance.free`).
      {
        contacts: [hand("left"), hand("right")],
        seconds: PlanWallRunData.BEAT,
        event: "catch",
        prefer: PlanWallRunData.HANGING,
        free: ["leftFoot", "rightFoot"],
      },
      {
        contacts: [
          foot(lead, hang),
          foot(trail, hang),
          hand("left"),
          hand("right"),
        ],
        seconds: PlanWallRunData.BEAT,
        event: "catHang",
        prefer: PlanWallRunData.CAT,
      },
    );
  }
  const plan: IAutoMovieMotionHumanActionPlan = support.plan({
    ...context,
    params: { stances },
    aim: (reference: IAutoMovieMotionTarget, seconds: number) => {
      const key: string | undefined =
        reference.kind === "prop" && reference.subject === p.wall
          ? reference.point
          : undefined;
      const point: IAutoMovieVector3 | undefined =
        key === undefined ? undefined : staged.get(key);
      if (key === undefined || point === undefined)
        return context.aim(reference, seconds);
      return {
        point,
        normal: key.endsWith("Top") ? { x: 0, y: 1, z: 0 } : face.normal,
      };
    },
  });

  // The catch is a jump: the wall step's foot pushes off and the body flies
  // to the hang, its root on the projectile from the wall step's key to the
  // hang's under standard gravity, its arms reaching for the top over the
  // first half of the flight and the rest of it shaping into the hang.
  const shown: IAutoMovieMotionHumanActionPlan =
    p.kind === "run" ? planWallRunFlight(body, plan) : plan;

  // Each foot on the face stays within its friction cone while it carries
  // the body alone, at the middle of its window before the hands take the
  // top: once they hang from it, the toe-to-hips line is no longer the
  // foot's force.
  const gripped: number = Math.min(
    1,
    ...plan.contacts
      .filter((window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part.endsWith("Hand"),
      )
      .map((window: IAutoMovieMotionHumanContactWindow): number => window.from),
  );
  for (const window of plan.contacts) {
    if (
      !window.part.endsWith("Foot") ||
      window.support.kind !== "prop" ||
      window.support.subject !== p.wall ||
      window.from >= gripped
    )
      continue;
    const middle: number =
      ((window.from + Math.min(window.to, gripped)) / 2) * plan.duration;
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, plan.posture(middle)).pose,
    );
    const side: AutoMovieHumanSide = window.part.startsWith("left")
      ? "left"
      : "right";
    const line: IAutoMovieVector3 = Vector3.subtract(
      bones.get("hips")!.worldPosition,
      bones.get(`${side}Toes`)!.worldPosition,
    );
    const normal: number = Vector3.dot(line, face.normal);
    const tangent: number = Vector3.length(
      Vector3.subtract(line, Vector3.scale(face.normal, normal)),
    );
    if (!(normal > 0) || tangent / normal > PlanWallRunData.FRICTION)
      throw coverWall.refusal(
        "face",
        p.face,
        `the ${window.part} on the wall leans ${((Math.atan2(tangent, normal) * 180) / Math.PI).toFixed(1)} degrees off the face's normal, outside its friction cone`,
      );
  }
  return { ...shown, base: { kind: "standing" } };
}

/*
 * Admission of the top from the entering floor of the wall-run stage.
 */
export namespace planWallRun {
  /*
   * Measurements setting the furthest vertical hand contact.
   */
  export type IReachMeasure = Pick<
    IAutoMovieMotionHumanBody["measure"],
    "hipHeight" | "shoulderHeight" | "upperArm" | "forearm"
  >;

  /*
   * Require the top to be in reach from the first wall step.
   */
  export function admitTop(
    worldHeight: number,
    floor: number,
    measure: IReachMeasure,
    id: string,
  ): void {
    const reach: number =
      PlanWallRunData.FIRST * measure.hipHeight +
      measure.shoulderHeight +
      measure.upperArm +
      measure.forearm;
    if (worldHeight > floor + reach)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "top",
        value: id,
        feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
        reason: `the wall's top is ${(worldHeight - floor - reach).toFixed(3)} m beyond the hands' reach from the wall step`,
        fix: "run at a lower wall",
      });
  }
}

/*
 * The middle of a wall's top front edge, world metres.
 */
function topEdge(
  context: IAutoMovieMotionHumanActionContext,
  subject: string,
  id: string,
): IAutoMovieVector3 {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const ledge: IAutoMovieAffordance | undefined = reader.prop.affordances?.find(
    (item: IAutoMovieAffordance): boolean => item.id === id,
  );
  if (ledge === undefined)
    throw coverWall.refusal("top", id, `${subject} has no top ${id}`);
  const world: IAutoMovieRigidTransform = reader.frame(context.start);
  return Vector3.add(
    world.position,
    Quaternion.rotateVector(world.rotation, ledge.frame.translation),
  );
}
