import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionHumanWallRun,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { coverWall } from "../cover/coverWall";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** The first wall step's toe height, hip heights (provisional: a running step planted about knee high). */
const FIRST: number = 0.55;

/** The second wall step's toe height, hip heights (provisional). */
const SECOND: number = 1.05;

/** The toe joint's distance off the face, metres (provisional: the sole's thickness ahead of the joint). */
const SOLE: number = 0.03;

/** Static friction of a shoe sole on a wall, dimensionless (provisional: rubber on concrete). */
const FRICTION: number = 0.8;

/** Seconds per support change (provisional: a running wall step). */
const BEAT: number = 0.35;

/**
 * Use a wall's face as a brief foot support: a wall step plants one foot on
 * the face beside the other on the floor; a wall run plants it, reaches the
 * wall's top edge with both hands and draws the other foot onto the face, a
 * cat hang. The shared support law fits the stances on points of the named
 * face and top. Every foot window on the face is then checked against its
 * friction cone: the line from the planted toe to the hips must lean off the
 * face's normal by no more than `atan(FRICTION)` (a static stand-in for the
 * contact force's direction). A top beyond the hands' reach from the first
 * step is refused with the shortfall.
 *
 * @param context The action's context, standing before the wall and facing it.
 * @returns The wall step or run.
 * @throws {HumanRefusal} For a missing top, an unreachable top or a wall contact outside its friction cone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both moves, the fit, the cone check with its stand-in and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Contacts are points of the named face and top; the support law fits and orders them; the cone test is the Coulomb bound on the stand-in force line.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Stage the points, build the stances, plan, then check the face windows.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact outside the cone or a top out of reach refuses; the constants are provisional and stated as such.
 * @evidence contracts/development/implementation.md#efficient-algorithms A handful of stances fitted once; one posture resolve per face window for the cone check.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The staged points are computed once and looked up by name.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the staged points for the plan's lifetime.
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
      Vector3.add(Vector3.scale(face.normal, SOLE), { x: 0, y: height, z: 0 }),
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
  // A foot on the floor where it stands, or on the face at a height.
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
            at: toe(side),
            normal: { x: 0, y: 1, z: 0 },
          }
        : target(`${side}Face${height!.toFixed(3)}`, onFace(side, height!)),
  });
  const stances: IAutoMovieMotionHumanSupport.IStance[] = [
    { contacts: [foot(lead), foot(trail)], seconds: BEAT, event: "approach" },
    {
      contacts: [foot(lead, FIRST * measure.hipHeight), foot(trail)],
      seconds: BEAT,
      event: "wallStep",
    },
  ];
  if (p.kind === "run") {
    const top: IAutoMovieVector3 = topEdge(context, p.wall, p.top);
    const reach: number =
      FIRST * measure.hipHeight +
      measure.shoulderHeight +
      measure.upperArm +
      measure.forearm;
    if (top.y > reach)
      throw new HumanRefusal({
        kind: "reach",
        axis: "top",
        value: p.top,
        feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
        reason: `the wall's top is ${(top.y - reach).toFixed(3)} m beyond the hands' reach from the wall step`,
        fix: "run at a lower wall",
      });
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
            (side === "left" ? 1 : -1) * measure.shoulderHalfWidth,
          ),
        ),
      ),
    });
    const hang: number = Math.max(
      SECOND * measure.hipHeight,
      top.y - 0.95 * measure.stature,
    );
    stances.push(
      {
        contacts: [
          foot(lead, FIRST * measure.hipHeight),
          hand("left"),
          hand("right"),
        ],
        seconds: BEAT,
        event: "catch",
      },
      {
        contacts: [
          foot(lead, hang),
          foot(trail, hang),
          hand("left"),
          hand("right"),
        ],
        seconds: BEAT,
        event: "catHang",
      },
    );
  }
  const plan: IAutoMovieMotionHumanActionPlan = support.plan({
    ...context,
    params: { stances },
    aim: (reference: IAutoMovieMotionTarget, seconds: number) => {
      const point: IAutoMovieVector3 | undefined =
        reference.kind === "prop" && reference.subject === p.wall
          ? staged.get(reference.point)
          : undefined;
      if (point === undefined) return context.aim(reference, seconds);
      return {
        point,
        normal: reference.point.endsWith("Top")
          ? { x: 0, y: 1, z: 0 }
          : face.normal,
      };
    },
  });

  // Each foot on the face stays within its friction cone at mid-window.
  for (const window of plan.contacts) {
    if (
      !window.part.endsWith("Foot") ||
      window.support.kind !== "prop" ||
      window.support.subject !== p.wall
    )
      continue;
    const middle: number = ((window.from + window.to) / 2) * plan.duration;
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
    if (!(normal > 0) || tangent / normal > FRICTION)
      throw coverWall.refusal(
        "face",
        p.face,
        `the ${window.part} on the wall leans ${((Math.atan2(tangent, normal) * 180) / Math.PI).toFixed(1)} degrees off the face's normal, outside its friction cone`,
      );
  }
  return { ...plan, base: { kind: "standing" } };
}

/** The middle of a wall's top front edge, world metres. */
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
