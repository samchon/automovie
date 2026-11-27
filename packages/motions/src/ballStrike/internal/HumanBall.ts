import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * The ball a prop is, at a second.
 * Parameter context: The action's context.
 * Parameter subject: The ball's prop subject.
 * Parameter seconds: The film second it is read at.
 * Parameter axis: The parameter the ball was named by, for a refusal.
 * Returns: Its centre and radius.
 * When the prop declares no `grip` or that grip no
 * aperture.
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

/*
 * A ball as a law that meets it reads it: its centre and its radius, from the
 * ball's own `grip` contact, which `createBall` declares at the ball's centre
 * with the ball's diameter as its aperture.
 */
export namespace HumanBall {
  /*
   * A ball where it is.
   */
  export interface IBall {
    /*
     * Its centre, world metres.
     */
    centre: IAutoMovieVector3;

    /*
     * Its radius, metres.
     */
    radius: number;
  }

  /*
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
      throw new AutoMovieMotionHumanRefusal({
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
      centre: AutoMovieEngineVector3.add(
        frame.position,
        AutoMovieEngineQuaternion.rotateVector(frame.rotation, grip.frame.translation),
      ),
      radius: grip.aperture! / 2,
    };
  }
}
