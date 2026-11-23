import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Counter-gravity demands computed from actual mass centres and attachment
 * poses.
 */
export namespace IAutoMoviePhysicalGravityTorques {
  /**
   * Counter actual downstream gravitational moments through the same bounded
   * joint motors. Joints arrive in postorder, so one mass/first-moment
   * accumulation includes every attachment in linear work. This is feed-forward
   * actuator demand, not an additional unbounded force or a change to any
   * physical mass or gravity.
   */
  export type IResult = {
    /**
     * New joint-id map of counter-gravity demands in N m, expressed in each
     * parent's joint frame. Downstream mass is included; motor caps apply
     * later.
     */
    joints: Map<string, IAutoMovieVector3>;
    /**
     * Counter-gravity demand about the root body's actual COM, in world-axis N
     * m.
     */
    root: IAutoMovieVector3;
  };
}
