import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Counter-gravity demands computed from actual mass centres and attachment poses.
 *
 * @evidence contracts/development/design.md#principled-representation Postorder downstream mass moments produce joint-frame torque demands and a separate world-frame root demand about the root COM.
 * @evidence contracts/development/design.md#minimal-and-owned-surface physicalGravityTorques creates feed-forward requests consumed by the existing capped motors; native bodies do not enter this result contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These are feed-forward demands subject to later motor caps, not additional unbounded forces or proof of static balance.
 * @evidence contracts/development/common.md#meaningful-documentation Names torque units, joint/root frames and the moment origin for each demand.
 */
export namespace IAutoMoviePhysicalGravityTorques {
  /**
   * Counter actual downstream gravitational moments through the same bounded joint motors.
   * Joints arrive in postorder, so one mass/first-moment accumulation includes
   * every attachment in linear work. This is feed-forward actuator demand, not
   * an additional unbounded force or a change to any physical mass or gravity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names torque units, joint/root frames and the moment origin for each demand.
   * @evidence contracts/development/design.md#principled-representation Joint-map values are N m in parent joint frames; root is a world-axis moment about the actual root COM.
   * @evidence contracts/development/design.md#minimal-and-owned-surface physicalGravityTorques creates feed-forward requests consumed by the existing capped motors; native bodies do not enter this result contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Downstream mass contributes to demand without changing physical mass, and this feed-forward result is not proof of achieved torque.
   */
  export type IResult = {
    /**
     * New joint-id map of counter-gravity demands in N m, expressed in each
     * parent's joint frame. Downstream mass is included; motor caps apply later.
     */
    joints: Map<string, IAutoMovieVector3>;
    /** Counter-gravity demand about the root body's actual COM, in world-axis N m. */
    root: IAutoMovieVector3;
  };
}
