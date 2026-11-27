import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * The ball a prop is, at a second.
 *
 * @param context The action's context.
 * @param subject The ball's prop subject.
 * @param seconds The film second it is read at.
 * @param axis The parameter the ball was named by, for a refusal.
 * @returns Its centre and radius.
 * @throws {HumanRefusal} When the prop declares no `grip` or that grip no
 *   aperture.
 */
export function HumanBall(
  context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
  subject: string,
  seconds: number,
  axis: string,
): HumanBall.IBall {
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  return HumanBall.placed(
    read.prop,
    (): IAutoMovieRigidTransform => read.frame(seconds),
    axis,
  );
}

/**
 * A ball as a law that meets it reads it: its centre and its radius, from the
 * ball's own `grip` contact, which `createBall` declares at the ball's centre
 * with the ball's diameter as its aperture.
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
   * Read a ball using its declared grip and a supplied world frame reader. The
   * reader runs after the sized grip is admitted.
   */
  export function placed(
    prop: IAutoMovieMotionHumanPropReader["prop"],
    readFrame: () => IAutoMovieRigidTransform,
    axis: string,
  ): IBall {
    const subject: string = prop.subject;
    const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
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
    const frame: IAutoMovieRigidTransform = readFrame();
    return {
      centre: Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, grip.frame.translation),
      ),
      radius: grip.aperture! / 2,
    };
  }
}
