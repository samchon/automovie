import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropLaunch,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Resolve the one spherical ball a court release moves: a portable prop with
 * one sphere collider, held by a releasing hand; the sphere's centre need not
 * coincide with the prop's origin. A ball with restitution and no friction
 * releases with no tangential loss (a provisional isolated court-ball
 * fixture).
 * Parameter context: The prop reader and the entry's holds.
 * Parameter subject: The ball's subject.
 * Parameter hands: The releasing hands.
 * Returns: The ball's reader and the sphere its launch carries.
 * When no releasing hand holds the ball, or it is not
 * one portable spherical prop.
 */
export function ballCourtSphere(
  context: Pick<IAutoMovieMotionHumanActionContext, "prop"> & {
    entry: Pick<IAutoMovieMotionHumanActionContext["entry"], "holds">;
  },
  subject: string,
  hands: readonly AutoMovieHumanSide[],
): ballCourtSphere.IResult {
  const reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
  if (
    !hands.some(
      (side: AutoMovieHumanSide): boolean =>
        context.entry.holds[side] === subject,
    )
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      reason: "a court release needs the ball already held by a releasing hand",
      fix: "pick up or catch the ball before releasing it, or choose its holding hand",
    });
  const shape: IAutoMoviePhysicalShape | undefined = reader.prop.shapes?.[0];
  if (
    reader.prop.shapes?.length !== 1 ||
    shape?.kind !== "sphere" ||
    reader.prop.fixed === true ||
    reader.prop.worn !== undefined ||
    reader.prop.motion !== undefined
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: subject,
      reason: "a court release needs one portable spherical prop",
      fix: "give the held ball's subject with its spherical collider",
    });
  const body: IAutoMovieMotionHumanPropReader["prop"]["body"] =
    reader.prop.body;
  const friction: number | null | undefined =
    body?.kineticFriction ?? body?.friction;
  return {
    reader,
    sphere: {
      radius: shape.radius,
      centre: shape.transform.position,
      // An underside-height drop determines normal restitution only. Use
      // no tangential loss in that provisional isolated court-ball fixture.
      ...(body?.restitution !== undefined &&
      (friction === null || friction === undefined)
        ? { tangentialFriction: 0 }
        : {}),
    },
  };
}

/*
 * The court ball's reader and sphere.
 */
export namespace ballCourtSphere {
  /*
   * The held ball's reader and the sphere its launch carries.
   */
  export interface IResult {
    /*
     * The ball's prop reader.
     */
    reader: IAutoMovieMotionHumanPropReader;

    /*
     * Its spherical collider as the launch publishes it.
     */
    sphere: NonNullable<IAutoMovieMotionPropLaunch["sphere"]>;
  }
}
