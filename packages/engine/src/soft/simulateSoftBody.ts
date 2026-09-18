import type { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState } from "@automovie/interface";

/**
 * Integrate a soft-body domain to one **absolute** step of its fixed clock.
 *
 * ## The equations
 *
 * The panel is a lattice of particles carrying mass `m` and velocity `v`, tied
 * by distance constraints `C(a, b) = |p_b − p_a| − L(a, b)` whose rest length
 * `L` is the distance the same two particles hold in the authored rest mesh.
 * One step is the position-based scheme of Müller et al. (2007):
 *
 * ```text
 *   v ← (v + a(t)·dt) / (1 + dt·k)          predict, with implicit linear drag
 *   p̃ ← p + v·dt
 *   repeat `iterations` times:               Jacobi projection of every C
 *     Δp_i ← (1/n_i) · Σ_j s · (w_i/(w_i + w_j)) · ((d − L)/d) · (p̃_j − p̃_i)
 *     p̃_i ← p̃_i + Δp_i
 *   p̃ ← project(p̃, colliders)
 *   v ← (p̃ − p)/dt ,  p ← p̃
 * ```
 *
 * With `a(t)` the sum of gravity and the declared draught, `k` the linear drag,
 * `w = 1/m` the inverse mass (exactly `0` for an anchored particle), `s` the
 * family stiffness, `n_i` the number of constraints incident on particle `i`,
 * and `d = |p̃_j − p̃_i|`. Constraint families are the lattice's rows and
 * columns (structural), its diagonals (shear) and its second neighbours
 * (bend).
 *
 * The projection is deliberately **Jacobi**, not Gauss-Seidel: every correction
 * reads the same predicted positions, so the answer does not depend on the
 * order particles happen to be visited, which is the property a deterministic
 * engine needs and a sequential relaxation cannot offer.
 *
 * ## Why it stays well behaved
 *
 * - **Cloth at rest is exact.** A rest length is measured from the rest mesh with
 *   the same expression the solve measures `d` with, so an undisturbed panel
 *   produces `d − L = 0` exactly. With no gravity, no draught and unmoved
 *   anchors, every correction is exactly zero and the panel never drifts,
 *   however many steps are integrated.
 * - **A projection cannot explode.** Each correction moves a particle a fraction
 *   `s ≤ 1` of the way toward satisfying its constraint and is then divided by
 *   the particle's own valence, so a sweep is a contraction. Unlike an explicit
 *   spring force there is no stiffness that can overshoot.
 * - **An anchor is a hard boundary condition.** Its inverse mass is exactly zero,
 *   so it takes no share of any correction, and it is written back to its
 *   target with zero velocity after every step: no constraint and no collider
 *   can drag a curtain off its track.
 * - **A collider is escaped along its own geometry.** A half-space pushes along
 *   its normal, a ball along the radius, a box out of its least-penetrated
 *   face. Contacts are counted, so a panel that never touched anything says
 *   so.
 *
 * Two limits of that last point are stated rather than implied. Colliders are
 * resolved **once each, in the authored order**, so a particle wedged where two
 * colliders overlap can end the step satisfying only the later one; adding a
 * relaxation loop would trade a bounded step for an unbounded one, and the
 * bounded step is what this tier promised. And a particle exactly on a box's
 * mid-plane has no preferred face: the tie is broken toward the maximum side,
 * which is deterministic but is the one place a mirrored panel need not stay
 * mirrored. The constraint fold carries that property; a box collider whose
 * exact centre plane a particle lands on does not.
 *
 * ## Stability
 *
 * A position-based sweep is unconditionally stable, so the limit is not a
 * stiffness Courant number but a **travel** condition: within one step a
 * particle must not move further than the shortest constraint in the panel, or
 * it can cross a collider it should have hit and pull a constraint from the
 * wrong side.
 *
 * ```text
 *   dt · referenceSpeed / shortestRestLength ≤ 1
 * ```
 *
 * That is what {@link softBodyTravelNumber} returns and what
 * {@link validateSoftBodyDomain} refuses to exceed. `referenceSpeed` is the
 * author's declared design budget, exactly as a fluid domain declares the
 * deepest water it is meant for; {@link IAutoMovieSoftBodyState.maxSpeed}
 * reports what the solve actually reached, so the declaration can be checked
 * rather than believed.
 *
 * ## Determinism
 *
 * The state is a pure function of `(domain, step, state)`. Nothing is cached
 * between calls, so seeking backwards, forwards, or in scattered order returns
 * exactly the same numbers as playing straight through — there is no runtime
 * object for an accumulation to hide in. Only `+ − × ÷`, `Math.abs`,
 * `Math.floor` and `Math.sqrt` are used, all of which IEEE-754 specifies
 * exactly, so a domain whose authored numbers are binary-exact reproduces bit
 * for bit on Windows and POSIX alike.
 *
 * The domain is assumed to have passed {@link validateSoftBodyDomain}: that pass
 * is where an array of the wrong length, a zero-length rest edge, a particle
 * already buried in a collider or an unstable step are refused with a path, so
 * the integrator never has to guess what an inconsistent record meant.
 *
 * Throws when `step` is not an integer in `[0, solver.maxSteps]`, when `state`
 * names a state the domain does not declare, and when the state leaves the
 * reals — a genuinely runaway solve is named at the step it first appeared
 * rather than quietly turning into NaN frames a renderer would draw as
 * nothing.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Reconstructs the complete soft-body state at a declared absolute step.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Implements the bounded fixed-step transition of the soft solver.
 * @author Samchon
 */
export const simulateSoftBody = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  if (domain.colliders.some((collider) => collider.kind === "body-capsule"))
    throw new Error(
      `soft body "${domain.id}" needs resolved moving boundaries for body capsules`,
    );
  return simulateSoftBodyCore(domain, step, state, null);
};
