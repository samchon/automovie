import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * A jump's ballistic flight of the centre of mass, the one point gravity
 * alone moves while airborne: from the apex height above take-off (0.06 hip
 * heights plus a tenth of the jump's length when absent, provisional, plus
 * the climb to a raised landing), the vertical take-off speed is
 * `sqrt(2 g apex)`, the flight time solves the centre's landing height, and
 * the horizontal speed covers its distance in that time, the closed form of
 * a drag-free projectile (`v = d / T - g T / 2`, as the engine's ballistic
 * solvers).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the flight's rule, its default apex and its source form.
 * @evidence contracts/development/design.md#principled-representation The flight as its apex, time and two velocities, apart from the postures flown.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Gravity, one record and its solver, read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight follows from the centre's two places and the apex; nothing is typed in seconds.
 */
export namespace jumpFlight {
  /** Gravity, m/s². */
  export const G: number = 9.81;

  /**
   * The flight solved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The apex, the flight time and the centre's velocities at both ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the jump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing velocity is the take-off's under gravity, not set apart.
   */
  export interface IFlight {
    /** The apex above take-off, metres. */
    apex: number;

    /** The vertical take-off speed, metres per second. */
    vy: number;

    /** The flight's seconds. */
    T: number;

    /** The centre's velocity at take-off, metres per second. */
    launch: IAutoMovieVector3;

    /** The centre's velocity at touchdown, metres per second. */
    land: IAutoMovieVector3;
  }

  /**
   * Solve the flight between the centre's take-off and touchdown places.
   *
   * @param comT The centre at take-off, world metres.
   * @param comL The centre at touchdown, world metres.
   * @param asked The apex asked, metres; the default when absent.
   * @param l The hip height, metres.
   * @param rise The landing surface's height, metres, for the refusal's words.
   * @returns The flight.
   * @throws {HumanRefusal} When the apex is not positive, or does not rise past the landing's climb.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The closed form of a drag-free projectile between two heights.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The apex, the refusal, then three closed forms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A flight that cannot clear a raised landing is refused, never flown through it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanBound` for the sign check.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solve(
    comT: IAutoMovieVector3,
    comL: IAutoMovieVector3,
    asked: number | undefined,
    l: number,
    rise: number,
  ): IFlight {
    const length: number = Math.hypot(comL.x - comT.x, comL.z - comT.z);
    // A flight that lands higher must rise past the landing height first: the default apex clears it by the floor jump's own, and a given apex that does not reach it is refused.
    const climb: number = Math.max(0, comL.y - comT.y);
    const apex: number = asked ?? 0.06 * l + 0.1 * length + climb;
    HumanBound.above("apex", apex, 0, "m");
    if (apex <= climb)
      throw new HumanRefusal({
        kind: "reach",
        axis: "apex",
        value: apex,
        feasible: {
          kind: "range",
          minimum: climb,
          maximum: null,
          unit: "m",
          open: "minimum",
        },
        reason: `the landing lies ${rise.toFixed(3)} m up and the body's centre must rise ${climb.toFixed(3)} m to reach it, above the ${apex.toFixed(3)} m apex asked`,
        fix: "jump higher, or onto a lower surface",
      });
    const vy: number = Math.sqrt(2 * G * apex);
    const T: number =
      (vy + Math.sqrt(Math.max(0, vy * vy - 2 * G * (comL.y - comT.y)))) / G;
    const launch: IAutoMovieVector3 = {
      x: (comL.x - comT.x) / T,
      y: vy,
      z: (comL.z - comT.z) / T,
    };
    return {
      apex,
      vy,
      T,
      launch,
      land: { x: launch.x, y: vy - G * T, z: launch.z },
    };
  }
}
