import { ISpringParams } from "./ISpringParams";
import { ISpringStep } from "./ISpringStep";

const assertFinite: (label: string, value: number) => void = (
  label: string,
  value: number,
): void => {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`);
};

/**
 * Advance a one-dimensional damped spring one fixed timestep (semi-implicit
 * Euler): a generic numeric integrator for **secondary motion**, a value that
 * lags, overshoots, and settles toward a moving target instead of snapping to
 * it. Driving a tail or ear joint's angle through this off the animated target
 * gives the follow-through a physics joint produces, while staying a pure,
 * deterministic function (same inputs → same output, replayable
 * frame-for-frame).
 *
 * `force = stiffness·(target − current) − damping·velocity`, integrated as
 * `velocity += force·dt; value += velocity·dt`. Unlike the world-space
 * {@link stepSpring} (VRM SpringBone, for the Node/Channel core), this works in
 * the humanoid pose path's angle space.
 * Finite inputs, nonnegative coefficients and positive dt are required. The caller chooses a timestep appropriate to the coefficients; the explicit step does not guarantee stability for arbitrary dt or prevent arithmetic overflow at extreme magnitudes.
 *
 * @evidence contracts/common.md#principled-implementation Semi-implicit Euler updates velocity from the unit-mass damped restoring acceleration then advances value using that new velocity; the caller's timestep controls numerical stability and finite inputs alone do not preclude overflow.
 * @evidence contracts/common.md#clear-and-simple-design A pure scalar step consumes caller-carried momentum and coefficients and returns the next state, keeping scheduling and per-axis application outside the integrator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid finite-domain or coefficient/timestep inputs throw; no timestep subdivision, joint clamp or hidden state masks an unstable caller-selected step.
 * @evidence contracts/common.md#meaningful-documentation Gives the two update equations, scalar/angle use, input domain, carry-forward velocity and numerical stability/overflow limitation.
 * @evidence contracts/performance.md#efficient-algorithms Each step performs fixed scalar arithmetic and admission checks with constant auxiliary storage, independent of the number of prior frames.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No trajectory cache exists: the caller explicitly feeds the prior value and velocity along with the current target and timestep.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned value/velocity object survives a step; the integrator owns no retained history, timer or physics handle.
 *
 * @author Samchon
 */
export const dampedSpring: (
  current: number,
  velocity: number,
  target: number,
  params: ISpringParams,
  dt: number,
) => ISpringStep = (
  current: number,
  velocity: number,
  target: number,
  params: ISpringParams,
  dt: number,
): ISpringStep => {
  assertFinite("spring current", current);
  assertFinite("spring velocity", velocity);
  assertFinite("spring target", target);
  assertFinite("spring stiffness", params.stiffness);
  assertFinite("spring damping", params.damping);
  assertFinite("spring dt", dt);
  if (params.stiffness < 0)
    throw new Error("spring stiffness must be non-negative");
  if (params.damping < 0)
    throw new Error("spring damping must be non-negative");
  if (dt <= 0) throw new Error("spring dt must be positive");

  const force: number =
    params.stiffness * (target - current) - params.damping * velocity;
  const nextVelocity: number = velocity + force * dt;
  return { value: current + nextVelocity * dt, velocity: nextVelocity };
};
