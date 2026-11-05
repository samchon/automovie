/**
 * Plan two alternating foot transfers in an actor's initial forward frame.
 *
 * @evidence contracts/common.md#implementation-and-ownership Supplies authored local-metre foot goals and root progression only; public Human controls still solve and inspect actual support. The left foot transfers first, then the right, each to the same final travel offset. Cubic easing gives zero horizontal velocity at touchdown and a 55 mm swing arc. It is not a solved pose or balance guarantee.
 * @evidence contracts/common.md#authoring-interface time is seconds since entry; duration must be positive and distance nonnegative, with finite arguments. Before entry both feet remain at zero offset; at/after the end both remain at distance. Caller transforms offsets through its adopted initial actor frame and adds measured neutral foot witnesses.
 */
export function evaluateTwoSteps(time: number, duration: number, distance: number): {
  root: number;
  left: { forward: number; lift: number };
  right: { forward: number; lift: number };
} {
  if (![time, duration, distance].every(Number.isFinite) || duration <= 0 || distance < 0)
    throw new Error("Two-step motion requires finite time, positive duration and nonnegative metres");
  const progress: number = Math.max(0, Math.min(1, time / duration));

  /** A foot transfers once and remains fixed after touchdown. */
  function foot(phase: number): { forward: number; lift: number } {
    const value: number = Math.max(0, Math.min(1, phase));
    return { forward: distance * value * value * (3 - 2 * value), lift: 0.055 * Math.sin(Math.PI * value) ** 2 };
  }
  return { root: distance * progress * progress * (3 - 2 * progress), left: foot(progress * 2), right: foot(progress * 2 - 1) };
}
