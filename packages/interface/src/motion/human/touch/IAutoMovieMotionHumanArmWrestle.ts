import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Arm wrestling, one role of it: the elbow planted on a table's top, the hand
 * clasped with the partner's above it, the struggle and the pin.
 *
 * Both roles read one geometry from the table's point and the two bodies, so
 * neither waits on the other. The clasp stands over the table's point at 0.85
 * of the shorter forearm (provisional), the two wrists `GAP` apart across the
 * table; each elbow lies on the table's top where its own forearm reaches its
 * wrist from, toward its own side. The trunk leans from the hips until the
 * shoulder is an upper arm from the elbow, so the elbow, which is no hand
 * surface, is put where it must be by the arm's own lengths: the hand's goal is
 * the wrist and the elbow's hint is its place on the table. A table too low or
 * too far for the lean to close is refused.
 *
 * The forearms turn about the line through the two elbows: upright from `set`,
 * swaying `SWAY` degrees through the struggle from `go`, then down to the pin's
 * angle (`PIN` degrees when none is asked) toward the winner's left by `pin`,
 * and back up to leave from `relax`. An angle past what the arm holds with its
 * elbow in place (the fitted elbow within `HELD` of its place, as far as
 * upright) is refused with the angle it holds. The winner's trunk holds its
 * lean; the loser's bends toward the pin as the pin comes, by the force
 * exchanged (`HumanForceTrunk`): its shoulder resists at its eccentric
 * internal-rotation peak per body mass (Tasiopoulos et al. 2018, provisional
 * beyond men at 60 degrees a second) and its trunk holds that torque at the
 * side-bending share its stiffness gives (Watt, Callaway and Williams 2022).
 * The author declares the winner (the outcome-first rule).
 *
 * A named pad receives the planted elbow from set to relax. The fingers retain
 * their entry shape, and the free hand hangs.
 */
export namespace IAutoMovieMotionHumanArmWrestle {
  /** Parameters. */
  export interface IParams {
    /** The partner. */
    partner: string;

    /**
     * The point on the table's top the clasp stands over, world metres; both
     * roles give the same one.
     */
    table: IAutoMovieVector3;

    /** The finite surface that receives this role's planted elbow. */
    pad?: {
      /** Scene subject carrying the pad. */
      prop: string;
      /** The pad's finite face. */
      point: string;
    };

    /** Whether this role wins. */
    wins: boolean;

    /** Seconds of struggle from `go` to the start of the pin; 3 when absent. */
    seconds?: number;

    /**
     * How far from upright the forearms end at the pin, degrees; both roles
     * give the same one. `PIN` when absent. An angle this role's arm cannot
     * hold with its elbow on its place on the table is refused with the largest
     * it can.
     */
    pin?: number;
  }
}
