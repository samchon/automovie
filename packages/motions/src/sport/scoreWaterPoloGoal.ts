import { Quaternion, Vector3, projectileAt } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanPerformance } from "../perform/HumanPerformance";

/** Tolerance on the mouth's unit up axis for a level scoring plane, unitless rounding. */
const LEVEL: number = 1e-8;

/**
 * Score the direct, airborne portion of a water polo shot. The same resolved
 * flight that displays the ball supplies its radius, centre, and the first
 * contact or takeover that can end a scoring opportunity. The fixed mouth's
 * +Z faces the field and its +Y begins at the waterline.
 *
 * @param film Performance displaying both the ball and the fixed goal.
 * @param ball Subject id of the ball through catch, carry and shot.
 * @param goal Fixed placed goal with the physical "mouth" aperture.
 * @returns Each credited goal, in film order.
 * @evidence contracts/development/common.md#meaningful-documentation States the shot family, coordinate frames, authoritative end conditions, and output order.
 * @evidence contracts/development/implementation.md#principled-implementation A horizontal goal normal gives constant downrange speed on the drag-free engine flight. Solve for the entire sphere to clear the front plane, then read its centre through the engine.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the fixed mouth once and check each live launch against it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never credit an aim point, reversed crossing, an undersized opening, or a crossing after actual capture or contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms One calculation per resolved launch and one flight sample for a candidate crossing.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the performance's existing flight, custody, collision and placement readers without another sweep.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the output cues leave the query.
 */
export function scoreWaterPoloGoal(
  film: Pick<HumanPerformance, "duration" | "flights" | "prop">,
  ball: string,
  goal: IAutoMovieMotionHumanProp,
): readonly scoreWaterPoloGoal.ICue[] {
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
  const cues: scoreWaterPoloGoal.ICue[] = [];
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
    const center: IAutoMovieVector3 = projectileAt(
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

/** A fixed aperture and a level frame give the rule its scoring plane. */
function invalidGoal(goal: IAutoMovieMotionHumanProp): HumanRefusal {
  return new HumanRefusal({
    kind: "affordance",
    axis: "goal",
    value: goal.subject,
    reason:
      "a water polo goal needs a fixed, upright mouth aperture at the waterline",
    fix: "bind the goal as a fixed prop with its mouth facing into the field",
  });
}

/**
 * Film-clock cues for credited direct goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the original ball, opening, player, instant and measured centre.
 * @evidence contracts/development/design.md#principled-representation A cue records the physical event and its existing subjects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the information needed to render or report the credited shot.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A predictor or independent ball identity never enters a credited cue.
 */
export namespace scoreWaterPoloGoal {
  /** The complete ball has gone through the goal's aperture. */
  export interface ICue {
    /** Cue discriminator. */
    kind: "goal";
    /** The ball's existing performance subject id. */
    ball: string;
    /** The chosen goal's existing performance subject id. */
    goal: string;
    /** The performer responsible for the observed launch. */
    scorer: IAutoMovieMotionHumanPropFlight.IFlight["source"]["subject"];
    /** The scoring instant in film seconds. */
    seconds: number;
    /** The physical ball centre at the scoring instant, world metres. */
    center: IAutoMovieVector3;
  }
}
