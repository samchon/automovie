import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * A jump's ballistic flight of the centre of mass, the one point gravity alone
 * moves while airborne: from the apex height above take-off (0.06 hip heights
 * plus a tenth of the jump's length when absent, provisional, plus the climb to
 * a raised landing), the vertical take-off speed is `sqrt(2 g apex)`, the
 * flight time solves the centre's landing height, and the horizontal speed
 * covers its distance in that time, the closed form of a drag-free projectile
 * (`v = d / T - g T / 2`, as the engine's ballistic solvers).
 */
export namespace jumpFlight {
  /*
   * The flight solved.
   */
  export interface IFlight {
    /*
     * The apex above take-off, metres.
     */
    apex: number;

    /*
     * The vertical take-off speed, metres per second.
     */
    vy: number;

    /*
     * The flight's seconds.
     */
    T: number;

    /*
     * The centre's velocity at take-off, metres per second.
     */
    launch: IAutoMovieVector3;

    /*
     * The centre's velocity at touchdown, metres per second.
     */
    land: IAutoMovieVector3;
  }

  /*
   * Solve the flight between the centre's take-off and touchdown places.
   * Parameter comT: The centre at take-off, world metres.
   * Parameter comL: The centre at touchdown, world metres.
   * Parameter asked: The apex asked, metres; the default when absent.
   * Parameter l: The hip height, metres.
   * Parameter rise: The landing surface's height, metres, for the refusal's words.
   * Returns: The flight.
   * When the apex is not positive, or does not rise past
   * the landing's climb.
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
    const apex: number =
      asked ?? APEX_BASE * l + APEX_PER_LENGTH * length + climb;
    HumanBound.above("apex", apex, 0, "m");
    if (apex <= climb)
      throw new AutoMovieMotionHumanRefusal({
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
    const vy: number = Math.sqrt(2 * AutoMovieGravity.STANDARD * apex);
    const T: number =
      (vy +
        Math.sqrt(
          Math.max(
            0,
            vy * vy - 2 * AutoMovieGravity.STANDARD * (comL.y - comT.y),
          ),
        )) /
      AutoMovieGravity.STANDARD;
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
      land: { x: launch.x, y: vy - AutoMovieGravity.STANDARD * T, z: launch.z },
    };
  }
}

/*
 * The default apex's part independent of the jump's length, hip heights
 * (provisional).
 */
const APEX_BASE: number = 0.06;

/*
 * The default apex's rise per metre of the jump's horizontal length, metres per
 * metre (provisional).
 */
const APEX_PER_LENGTH: number = 0.1;
