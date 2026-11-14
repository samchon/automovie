import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";

/**
 * A ball as a law that meets it reads it: its centre and its radius, from
 * the ball's own `grip` contact, which `createBall` declares at the ball's
 * centre with the ball's diameter as its aperture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, from which contact, and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A centre and a radius, the whole of a ball a foot or a hand meets.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record and one reader, used by `kickBall` and `catchObject`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The size is the ball's own aperture; no ball is typed.
 */
export namespace HumanBall {
  /** A ball where it is. */
  export interface IBall {
    /** Its centre, world metres. */
    centre: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /**
   * The ball a prop is, at a second.
   *
   * @param context The action's context.
   * @param subject The ball's prop subject.
   * @param seconds The film second it is read at.
   * @param axis The parameter the ball was named by, for a refusal.
   * @returns Its centre and radius.
   * @throws {HumanRefusal} When the prop declares no `grip` or that grip no aperture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The grip's translation carried into the world by the prop's frame; half its aperture the radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A prop without a sized grip is refused with its contacts, never met at a guessed size.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's few contacts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "prop">,
    subject: string,
    seconds: number,
    axis: string,
  ): IBall {
    const read: IHumanActionContext.IProp = context.prop(subject);
    const affordances: readonly IAutoMovieAffordance[] =
      read.prop.affordances ?? [];
    const grip: IAutoMovieAffordance | undefined = affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "grip",
    );
    if (grip === undefined || !((grip.aperture ?? 0) > 0))
      throw new HumanRefusal({
        kind: "affordance",
        axis,
        value: subject,
        feasible: {
          kind: "alternatives",
          values: affordances.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${subject} declares no ${grip === undefined ? "grip" : "aperture on its grip"} to read a ball's centre and size from`,
        fix: "name a ball whose grip is its centre with its diameter as the aperture, as createBall declares",
      });
    const frame: IHumanProp.IFrame = read.frame(seconds);
    return {
      centre: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, grip.frame.translation),
      ),
      radius: grip.aperture! / 2,
    };
  }
}
