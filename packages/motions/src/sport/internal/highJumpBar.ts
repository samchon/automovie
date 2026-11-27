import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import type { AthleticsRunUp } from "./AthleticsRunUp";

/**
 * Read the named crossbar's centre, axis and span where the prop stands at the
 * action's start.
 *
 * @param context The prop reader and the action's film second.
 * @param subject The high jump's prop subject.
 * @returns The bar.
 * @throws {HumanRefusal} When the prop declares no `bar`.
 */
export function highJumpBar(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  subject: string,
): highJumpBar.IBar {
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const found: IAutoMovieAffordance | undefined = (
    read.prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === "bar");
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "bar",
      value: subject,
      feasible: {
        kind: "alternatives",
        values: (read.prop.affordances ?? []).map(
          (a: IAutoMovieAffordance): string => a.id,
        ),
      },
      reason: `${subject} declares no crossbar named bar`,
      fix:
        "give the high jump's crossbar the id bar, as AutoMovieArchetypeHighJump.create does",
    });
  const frame: IAutoMovieRigidTransform = read.frame(context.start);
  return {
    point: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, found.frame.translation),
    ),
    // A bar affordance's length runs along its local +X.
    axis: Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, found.frame.rotation),
      { x: 1, y: 0, z: 0 },
    ),
    length: found.length ?? undefined,
  };
}

/**
 * The high jump's crossbar as the scene places it, and the approach rule it
 * sets: the side of the bar the take-off foot must be on.
 */
export namespace highJumpBar {
  /** The crossbar in the world. */
  export interface IBar {
    /** The bar's centre, world metres. */
    point: IAutoMovieVector3;

    /** The bar's axis, a unit world vector along the affordance's +X. */
    axis: IAutoMovieVector3;

    /** The bar's length along the axis, metres, when the affordance gives it. */
    length: number | undefined;
  }

  /**
   * Admit a run-up's take-off foot against the bar.
   *
   * @param bar The crossbar.
   * @param approach The run-up the jump is cut from.
   * @throws {HumanRefusal} When the planted take-off foot is the one nearer the
   *   bar.
   */
  export function admit(bar: IBar, approach: AthleticsRunUp.IApproach): void {
    // The bar's vertical plane, its horizontal normal turned toward the
    // runner's side of it, and on which side of the runner that plane lies.
    const left: IAutoMovieVector3 = {
      x: approach.heading.z,
      y: 0,
      z: -approach.heading.x,
    };
    const normal: IAutoMovieVector3 = { x: -bar.axis.z, y: 0, z: bar.axis.x };
    const toward: number = Vector3.dot(
      Vector3.subtract(bar.point, approach.ankle),
      normal,
    );
    const side: number = Vector3.dot(normal, left) * Math.sign(toward);
    const away: AutoMovieHumanSide = side > 0 ? "right" : "left";
    if (approach.foot !== away)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "takeoffFoot",
        value: approach.foot,
        feasible: { kind: "alternatives", values: [away] },
        reason: `the crossbar's plane lies on the runner's ${side > 0 ? "left" : "right"}, so the ${approach.foot} foot is the one nearer it`,
        fix: `take off from the ${away} foot, or curve the approach in from the bar's other side`,
      });
  }
}

/** The alternatives of `OfContext`'s site. */
type OfContext = "prop" | "start";
