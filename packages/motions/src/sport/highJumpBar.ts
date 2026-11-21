import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { AthleticsRunUp } from "./AthleticsRunUp";

/**
 * The high jump's crossbar as the scene places it, and the approach rule it
 * sets: the side of the bar the take-off foot must be on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and the rule the bar decides.
 * @evidence contracts/development/design.md#principled-representation A world-metre centre, a unit world axis and an optional span in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bar record and its two readers, both consumed by `highJump.plan`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bar is the prop's own `bar` affordance, never a stated height.
 */
export namespace highJumpBar {
  /**
   * The crossbar in the world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and frame.
   * @evidence contracts/development/design.md#principled-representation World metres for the centre and the span; the axis has unit length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The centre, the axis and the span the flight's crossing test and the approach rule read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The span is absent when the affordance declares none, rather than guessed.
   */
  export interface IBar {
    /** The bar's centre, world metres. */
    point: IAutoMovieVector3;

    /** The bar's axis, a unit world vector along the affordance's +X. */
    axis: IAutoMovieVector3;

    /** The bar's length along the axis, metres, when the affordance gives it. */
    length: number | undefined;
  }

  /**
   * Read the named crossbar's centre, axis and span where the prop stands at the action's start.
   *
   * @param context The prop reader and the action's film second.
   * @param subject The high jump's prop subject.
   * @returns The bar.
   * @throws {HumanRefusal} When the prop declares no `bar`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, where and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The affordance's translation and +X carried into the world by the prop's frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bar is refused with the prop's contacts, never replaced by a number.
   * @evidence contracts/development/implementation.md#efficient-algorithms A first-match affordance scan and one world frame read.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads one placed prop once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
    subject: string,
  ): IBar {
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
        fix: "give the high jump's crossbar the id bar, as createHighJump does",
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
   * Admit a run-up's take-off foot against the bar.
   *
   * @param bar The crossbar.
   * @param approach The run-up the jump is cut from.
   * @throws {HumanRefusal} When the planted take-off foot is the one nearer the bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule, its source and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A flop takes off from the foot farther from the bar (Dapena 1980, "Mechanics of translation in the Fosbury-flop", Med Sci Sports Exerc 12:37-44): the bar's vertical plane lying on the runner's right asks the left foot and on the left the right one. The runner's left is up crossed with the run's heading; the plane's side is its horizontal normal, turned toward the plane from the planted ankle, projected on that left.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The foot is refused, never swapped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads two records once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
