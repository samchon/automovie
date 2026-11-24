import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";

/** The record of `IPrepareInner`'s site. */
type IPrepareInner = {
  yaw: number;
  point: ReturnType<typeof HumanFrame.preparePoint>;
};

/** The original knee-over-foot bend hint and its fixed-foot-heading geometry. */
export namespace AutoMovieMotionHumanKneeBend {
  /** Read the original hint from this actual body, root/yaw and foot heading. */
  export function at(
    body: IAutoMovieMotionHumanBody,
    posture: IPosture,
    side: AutoMovieHumanSide,
    heading: number = posture.yaw,
    splay: number = 0,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: posture.root, yaw: posture.yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading + (side === "left" ? splay : -splay),
      },
      { x: 0, y: 0, z: 1 },
    );
  }

  /** Prepare a body's knee hint under a fixed foot heading and splay. */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    heading: number,
    splay: number = 0,
  ): (posture: IPosture) => IAutoMovieVector3 {
    const rest: IAutoMovieVector3 = body.rest.get(`${side}LowerLeg`)!;
    const outer: ReturnType<typeof HumanFrame.preparePoint> =
      HumanFrame.preparePoint(heading + (side === "left" ? splay : -splay), {
        x: 0,
        y: 0,
        z: 1,
      });

    // The yaw is the posture's at each call, so its rest-knee transform is
    // rebuilt only when the yaw changes.
    let inner: IPrepareInner | undefined;
    return (posture: IPosture): IAutoMovieVector3 => {
      if (inner === undefined || !Object.is(inner.yaw, posture.yaw))
        inner = {
          yaw: posture.yaw,
          point: HumanFrame.preparePoint(posture.yaw, rest),
        };
      return outer(inner.point(posture.root));
    };
  }
}
/** The alternatives of `Posture`'s site. */
type Posture = "root" | "yaw";

/**
 * Existing current horizontal body frame; no full pose or solved leg is
 * represented.
 */
type IPosture = Pick<IAutoMovieMotionHumanPosture, Posture>;
