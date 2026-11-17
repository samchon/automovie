import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A performance's soft props: each solved once from the displayed poses of
 * the people who hold it or whose bodies it lies on, at its domain's own
 * fixed step, and read by film seconds.
 *
 * The pass runs after every action is placed. For each step k of the
 * domain's `fixedStepSeconds` from film second 0 to the performance's end,
 * it reads the displayed bones at second k dt and builds that step's
 * boundary: the world point of every moving anchor (an `actor-bone` binding
 * on its person's bone, a `node` binding on a rigid prop of that subject)
 * and the world segment of every body capsule. A hand's grip on the prop
 * (any grip window or hold on it, as `HumanPerformanceRead.grips` lists them)
 * binds the particle nearest the hand's grip socket when the grip closes,
 * read from the solve as it stands then, to that socket for the window, and
 * releases it after, so the particle falls with the velocity the hand gave
 * it. Two hands on one particle (a handover's shared window) bind it to the
 * hand that closed last, as a rigid prop rides the last grip. The engine
 * solves the whole span once (`simulateSoftBodyWithBoundaries` with an
 * observer that keeps every step), replaying from step 0 once per grip that
 * picks its particle from the solve, so W grips cost W + 1 solves.
 *
 * A read at a film second interpolates linearly between the two steps
 * around it, so a seek costs no solve and two frame rates read the same
 * state at a shared second. The coupling is one-way: the cloth never moves
 * the body (tension enters the hand as a load through `load`, read from the
 * compliant solver's multipliers).
 *
 * @evidence contracts/development/common.md#meaningful-documentation dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.
 * @evidence contracts/development/design.md#principled-representation dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.held, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, h); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of.solve, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPerformanceSoft {
  /**
   * One soft prop solved over the whole performance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.
   * @evidence contracts/development/design.md#principled-representation dt: The domain's step, seconds. steps: Every step's particle positions, step 0 the rest as boundaried, world metres row-major.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of.solve, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.at); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.load); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.of); perform/HumanPerformanceSoft.ts (SOLVED).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISolved {
    /** The domain's step, seconds. */
    dt: number;

    /** Every step's particle positions, step 0 the rest as boundaried, world metres row-major. */
    steps: Float64Array[];

    /** Every step's force on each hand that grips the prop or that the domain anchors it to, by `subject:side`, the forces of the particles one hand bears added, newtons, world frame; empty at a step with no compliant multipliers. */
    loads: Map<string, IAutoMovieVector3>[];
  }

  /**
   * A particle the domain itself anchors to a person's hand bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation particle: The particle. person: The person whose hand holds it. side: The hand.
   * @evidence contracts/development/design.md#principled-representation particle: The particle. person: The person whose hand holds it. side: The hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.held, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, h); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained.anchored, return); perform/HumanPerformanceSoft.ts (HumanPerformanceSoft.sustained).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanPerformanceSoft.held.
   */
  export interface IHandAnchor {
    /** The particle. */
    particle: number;

    /** The person whose hand holds it. */
    person: string;

    /** The hand. */
    side: "left" | "right";
  }
}
