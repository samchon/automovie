import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Prepare one member as a phase-shifted rigid copy of its template.
 * Parameter props: The template reader, admitted clock and entering frame.
 * Returns: A read of the instance at an action second.
 */
export function prepareInstancePosture<Body extends object>(
  props: prepareInstancePosture.IInput<Body>,
): (seconds: number) => IAutoMovieMotionHumanPosture {
  const { name, template, entered, start, duration, lag, turnLimit, rate } =
    props;
  const read: prepareInstancePosture.Reader | undefined =
    template.posture?.bind(template);
  if (read === undefined || template.body !== props.body)
    throw new AutoMovieMotionHumanRefusal({
      kind: "participant",
      axis: "of",
      value: name,
      reason:
        read === undefined
          ? `${name}'s placed posture cannot be read here`
          : `${name} is on another body, whose limbs the instance would carry`,
      fix: "instance a template of the same body from the same pool",
    });

  const at = (seconds: number): IAutoMovieMotionHumanPosture =>
    read(start + seconds - lag);
  const first: IAutoMovieMotionHumanPosture = at(0);
  for (let k: number = 1; k <= Math.ceil(duration * rate); ++k) {
    const yaw: number = at(Math.min(duration, k / rate)).yaw;
    const turned: number = Math.abs(
      ((((yaw - first.yaw + 180) % 360) + 360) % 360) - 180,
    );
    if (turned > turnLimit)
      throw new AutoMovieMotionHumanRefusal({
        kind: "participant",
        axis: "of",
        value: name,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: turnLimit,
          unit: "degrees",
        },
        reason: `${name} turns ${turned.toFixed(1)} degrees ${(k / rate).toFixed(3)} s into the span, so a rigid copy would no longer stand in its place`,
        fix: "perform the member in full through the turn",
      });
  }

  const turn: number = entered.yaw - first.yaw;
  const offset: IAutoMovieVector3 = rotate(
    {
      x: entered.root.x - first.root.x,
      y: 0,
      z: entered.root.z - first.root.z,
    },
    -first.yaw,
  );
  const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    turn,
  );
  return (seconds: number): IAutoMovieMotionHumanPosture => {
    const source: IAutoMovieMotionHumanPosture = at(
      Math.min(duration, Math.max(0, seconds)),
    );
    const root: IAutoMovieVector3 = Vector3.add(
      source.root,
      rotate(offset, source.yaw),
    );
    const move = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(root, rotate(Vector3.subtract(point, source.root), turn));
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const limb of LIMBS) {
      const goal: IAutoMovieHumanLimbGoal | undefined = source.limbs[limb];
      if (goal === undefined) continue;
      if (goal.clear !== undefined || goal.rests !== undefined)
        throw new AutoMovieMotionHumanRefusal({
          kind: "participant",
          axis: "of",
          value: name,
          reason: `${name}'s ${limb} keeps clear of or rests on colliders of its own place`,
          fix: "perform the member in full while its limbs work against the scene",
        });
      limbs[limb] =
        goal.on !== undefined
          ? goal
          : {
              ...goal,
              point: move(goal.point),
              bend: move(goal.bend),
              ...(goal.rotation === undefined
                ? {}
                : { rotation: Quaternion.multiply(spin, goal.rotation) }),
            };
    }
    return { ...source, root, yaw: source.yaw + turn, limbs };
  };
}

/*
 * Inputs of the rigid copy's preparation.
 */
export namespace prepareInstancePosture {
  /*
   * Read the template's posture at a film second.
   */
  export type Reader = (seconds: number) => IAutoMovieMotionHumanPosture;

  /*
   * The body identity and posture function of the template member.
   */
  export interface ITemplate<Body extends object> {
    /*
     * Body object shared by both members.
     */
    body: Body;

    /*
     * The template's placed posture reader, when available.
     */
    posture?: Reader;
  }

  /*
   * The placed member and the clock on which it reads the template.
   */
  export interface IInput<Body extends object> {
    /*
     * Template subject id, used in a refusal.
     */
    name: string;

    /*
     * Template member to copy.
     */
    template: ITemplate<Body>;

    /*
     * This member's body identity.
     */
    body: Body;

    /*
     * This member's entering world origin and heading.
     */
    entered: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

    /*
     * The instance's zero on the film clock, seconds.
     */
    start: number;

    /*
     * The duration of the instance, seconds.
     */
    duration: number;

    /*
     * How far before the instance's clock to read, seconds.
     */
    lag: number;

    /*
     * Maximum heading drift over the template span, degrees.
     */
    turnLimit: number;

    /*
     * Rate used to check the template's displayed heading, frames per second.
     */
    rate: number;
  }
}

/*
 * Limbs whose world goals follow a rigid instance.
 */
const LIMBS: readonly AutoMovieHumanLimb[] = [
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg",
];

/*
 * A floor-plan vector turned by a heading, degrees.
 */
function rotate(vector: IAutoMovieVector3, degrees: number): IAutoMovieVector3 {
  const radians: number = (degrees * Math.PI) / 180;
  const cosine: number = Math.cos(radians);
  const sine: number = Math.sin(radians);
  return {
    x: vector.x * cosine + vector.z * sine,
    y: vector.y,
    z: -vector.x * sine + vector.z * cosine,
  };
}
