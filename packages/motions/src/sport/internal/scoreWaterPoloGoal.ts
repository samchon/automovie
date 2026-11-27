import { Quaternion, Vector3, AutoMovieAir } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanWaterPolo,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Score the direct, airborne portion of a water polo shot. The same resolved
 * flight that displays the ball supplies its radius, centre, and the first
 * contact or takeover that can end a scoring opportunity. The fixed mouth's +Z
 * faces the field and its +Y begins at the waterline.
 * Parameter params: The `film` displaying both the ball and the fixed goal, the
 * `ball`'s subject id through catch, carry and shot, and the fixed placed
 * `goal` with the physical "mouth" aperture.
 * Returns: Each credited goal, in film order.
 */
export function scoreWaterPoloGoal(
  params: scoreWaterPoloGoal.IGoal,
): readonly IAutoMovieMotionHumanWaterPolo.ICue[] {
  const { film, ball, goal } = params;
  const mouth: IAutoMovieAffordance | undefined = goal.affordances?.find(
    (contact) => contact.id === "mouth" && contact.kind === "aperture",
  );
  if (
    goal.fixed !== true ||
    goal.motion !== undefined ||
    mouth?.width === undefined ||
    mouth.height === undefined ||
    !(mouth.width > 0 && mouth.height > 0)
  )
    throw invalidGoal(goal);
  const frame: IAutoMovieRigidTransform = film.prop(goal.subject, 0);
  const position: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, mouth.frame.translation),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    mouth.frame.rotation,
  );

  // The scoring plane must stand vertical with the waterline as its sill,
  // so a level mouth frame is required within rounding of a unit vector.
  const up: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  if (Math.abs(up.x) > LEVEL || Math.abs(up.z) > LEVEL || up.y < 1 - LEVEL)
    throw invalidGoal(goal);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(inverse, Vector3.subtract(point, position));
  const cues: IAutoMovieMotionHumanWaterPolo.ICue[] = [];
  for (const flight of film.flights(ball)) {
    // A spherical launch's projectile is the ball's physical centre, so the
    // whole ball has crossed once that centre is one radius behind the plane.
    const sphere: IAutoMovieMotionPropLaunch["sphere"] =
      flight.published.sphere;
    if (sphere === undefined || flight.projectile.drag !== undefined) continue;
    const origin: IAutoMovieVector3 = local(flight.projectile.origin);
    const velocity: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      flight.projectile.velocity,
    );
    if (origin.z < sphere.radius || velocity.z >= 0) continue;
    const travel: number = (-sphere.radius - origin.z) / velocity.z;
    const seconds: number = flight.launch + travel;
    if (
      seconds > film.duration ||
      seconds >= flight.end ||
      seconds >= (flight.supersededAt ?? Infinity) ||
      seconds >= (flight.capturedAt ?? Infinity)
    )
      continue;
    const center: IAutoMovieVector3 = AutoMovieAir.projectileAt(
      flight.projectile,
      travel,
    ).position;
    const at: IAutoMovieVector3 = local(center);
    if (
      Math.abs(at.x) + sphere.radius <= mouth.width / 2 &&
      at.y >= sphere.radius &&
      at.y + sphere.radius <= mouth.height
    )
      cues.push({
        kind: "goal",
        ball,
        goal: goal.subject,
        scorer: flight.source.subject,
        seconds,
        center,
      });
  }
  return cues;
}

/*
 * What a goal credit reads of the film and its flights.
 */
export namespace scoreWaterPoloGoal {
  /*
   * A displayed flight of the ball: its timing, projectile, sphere and thrower.
   */
  export interface IFlight extends Pick<
    IAutoMovieMotionHumanPropFlight.IFlight,
    "launch" | "end" | "supersededAt" | "capturedAt" | "projectile"
  > {
    /*
     * The launch as published: its sphere.
     */
    published: Pick<IAutoMovieMotionPropLaunch, "sphere">;

    /*
     * The segment that threw it: its performer.
     */
    source: Pick<IAutoMovieMotionHumanPropFlight.IFlight["source"], "subject">;
  }

  /*
   * The film a credit reads: its length, its props' frames and the flights.
   */
  export interface IFilm extends Pick<
    IAutoMovieMotionHumanWaterPolo.IFilm,
    "duration" | "prop"
  > {
    /*
     * A prop's flights in film order.
     * Parameter subject: The prop.
     * Returns: Its flights.
     */
    flights(subject: string): readonly IFlight[];
  }

  /*
   * The goal to credit: the film, the ball and the fixed placed goal.
   */
  export interface IGoal extends Omit<
    IAutoMovieMotionHumanWaterPolo.IGoal,
    "film"
  > {
    /*
     * The film displaying the ball and the goal.
     */
    film: IFilm;
  }
}

/*
 * Tolerance on the mouth's unit up axis for a level scoring plane, unitless
 * rounding.
 */
const LEVEL: number = 1e-8;

/*
 * A fixed aperture and a level frame give the rule its scoring plane.
 */
function invalidGoal(goal: IAutoMovieMotionHumanProp): AutoMovieMotionHumanRefusal {
  return new AutoMovieMotionHumanRefusal({
    kind: "affordance",
    axis: "goal",
    value: goal.subject,
    reason:
      "a water polo goal needs a fixed, upright mouth aperture at the waterline",
    fix: "bind the goal as a fixed prop with its mouth facing into the field",
  });
}
