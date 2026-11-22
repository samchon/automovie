import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type ArchetypeCourse, ArchetypeFrame } from "../core";
import type { EquineFlightClock } from "./EquineFlightClock";
import { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedMotion } from "./QuadrupedMotion";

/** Shares of a swing read for its pole crossings: about two per centimetre of a metre-long swing's arc. */
const SHARES: number = 48;

/** Points read along the terminal bar's axis at each share, its ends included. */
const BAR: number = 4;

/**
 * A swing's lift over the authored poles its hoof crosses: the arc's apex that keeps the terminal bar clear of each pole where the hoof's path actually passes over it.
 *
 * The swing's lift is an arc, its apex times the swing's rise at each share (`QuadrupedMotion.swing`). The footing bounds the terminal bar by the capsule of its radius about its axis (`QuadrupedObstacleShape`) and a pole by its own capsule, so the two clear where every point of the bar's axis lies at least the sum of both radii from the pole's axis. In the pole's cross-section, a point at a horizontal distance short of that sum must stand above the pole's axis by the circle's height there; the lift raises the whole bar, so the apex a share asks is the largest such shortfall over the rise there. The bar is read from the endpoint to the fetlock as the body carries its rest attitude. A swing that crosses no pole needs none, and keeps its gait's apex.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the arc, the two bounds, the clearance condition, the bar's attitude and the apex it asks.
 * @evidence contracts/development/design.md#principled-representation The poles, the terminal bar's axis and radius, its path and the swing's rise.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read once per swing by the ride on routes whose footing has poles.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The crossing is read on the hoof's own path against the footing's own bounds, not assumed from a swing timing.
 */
export namespace QuadrupedPoleSwing {
  /**
   * One swing's pole apex, metres above the ground, read once per swing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The limb, its stance's landing index, its actual chain, its hoof track's aim and the swing's liftoff and landing seconds.
   * @evidence contracts/development/design.md#principled-representation A function of the swing's identity and its path.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `crossings`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Crossings = (
    limb: QuadrupedBody.Limb,
    index: number,
    chain: readonly IAutoMovieVector3[],
    aim: Aim,
    off: number,
    on: number,
  ) => number;

  /**
   * The hoof track's goal at a course state and a swing share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the course state and the swing share it takes and the aim it returns.
   * @evidence contracts/development/design.md#principled-representation A function from a course state and a share to the hoof track's aim.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one reader a pole swing takes for its goal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Aim = (
    moment: ArchetypeCourse.IState,
    amount: number,
  ) => EquineFlightClock.IAim;

  /**
   * The terminal bar at a share of a swing, before its lift.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres.
   * @evidence contracts/development/design.md#principled-representation The endpoint on the ground beneath it and the bar's axis up to the fetlock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `apex`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBar {
    /** The endpoint on the ground beneath it, world metres. */
    ground: IAutoMovieVector3;
    /** The bar's axis from the endpoint to the fetlock, world metres. */
    axis: IAutoMovieVector3;
  }

  /**
   * Prepare a ride's swing apexes over its footing's poles.
   *
   * @param ground The admitted footing.
   * @param parts The animal's actual parts, for each terminal's radius.
   * @param shown The course state at a second with the body's displayed placement.
   * @returns The reader, cached per swing; none when the footing has no poles, so no other ride pays for it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the cache and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The hoof's path is its track's goal at the swing's eased share, on the ground beneath it in the displayed body's frame; the bar is the rest chain's endpoint-to-fetlock axis carried by that body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cache, one path, one rise.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A terminal that is not a round bar refuses as the ride pose does.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SHARES` track reads per swing, once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each swing's apex is cached by its limb and landing index.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains one number per swing for the assembly's life.
   */
  export function crossings(
    ground: QuadrupedFooting.IPlan | undefined,
    parts: readonly IAutoMovieModelPart[],
    shown: (seconds: number) => ArchetypeCourse.IState,
  ): Crossings | undefined {
    if (ground === undefined || ground.poles.length === 0) return undefined;
    const poles: readonly QuadrupedFooting.IPole[] = ground.poles;
    const cache: Map<string, number> = new Map();
    return (
      limb: QuadrupedBody.Limb,
      index: number,
      chain: readonly IAutoMovieVector3[],
      aim: Aim,
      off: number,
      on: number,
    ): number => {
      const key: string = `${limb}:${index}`;
      const cached: number | undefined = cache.get(key);
      if (cached !== undefined) return cached;
      const up: IAutoMovieVector3 = Vector3.subtract(chain[3]!, chain[4]!);
      const needed: number = apex(
        poles,
        round(limb, parts),
        (share: number): IBar => {
          const moment: ArchetypeCourse.IState = shown(
            off + share * (on - off),
          );
          const goal: EquineFlightClock.IAim = aim(
            moment,
            QuadrupedMotion.swing(share).along,
          );
          const x: number = goal.x ?? chain[0]!.x;
          return {
            ground: ArchetypeFrame.point(moment.placement, {
              x,
              y: floor(goal, x),
              z: goal.z,
            }),
            axis: Quaternion.rotateVector(moment.placement.rotation, up),
          };
        },
        (share: number): number => QuadrupedMotion.swing(share).rise,
      );
      cache.set(key, needed);
      return needed;
    };
  }

  /**
   * The apex a swing needs to clear the poles it crosses.
   *
   * @param poles The footing's poles.
   * @param radius The terminal bar's radius, metres.
   * @param path The terminal bar at a share of the swing, 0 to 1, before its lift.
   * @param rise The swing's rise at a share, 0 to 1.
   * @returns The apex, metres above the ground; zero when the swing crosses no pole.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation At each share, each point of the bar's axis at a horizontal distance d from a pole's axis short of the radii's sum R must rise to the pole axis's height plus √(R² − d²); the shortfall over the rise is the apex that share asks.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the shares, the bar's points and the poles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A crossing at a share with no rise cannot be cleared by lift and asks nothing; the footing's own check refuses it.
   * @evidence contracts/development/implementation.md#efficient-algorithms `SHARES` path reads per swing, each with `BAR` + 1 points against the K poles.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The ride caches the result per swing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function apex(
    poles: readonly QuadrupedFooting.IPole[],
    radius: number,
    path: (share: number) => IBar,
    rise: (share: number) => number,
  ): number {
    let needed: number = 0;
    for (let k: number = 1; k < SHARES; k++) {
      const share: number = k / SHARES;
      const lift: number = rise(share);
      if (!(lift > 0)) continue;
      const bar: IBar = path(share);
      for (let j: number = 0; j <= BAR; j++) {
        const at: IAutoMovieVector3 = Vector3.addScaled(
          bar.ground,
          bar.axis,
          j / BAR,
        );
        for (const pole of poles) {
          const reach: number = pole.radius + radius;
          const { distance, height }: ICrossing = across(pole, at);
          if (distance < reach)
            needed = Math.max(
              needed,
              (height + Math.sqrt(reach * reach - distance * distance) - at.y) /
                lift,
            );
        }
      }
    }
    return needed;
  }

  /** A point's horizontal distance to a pole's axis, and the axis's height at its point nearest it. */
  interface ICrossing {
    /** Horizontal distance, metres. */
    distance: number;

    /** The pole axis's world height there, metres. */
    height: number;
  }

  /** A point's horizontal distance to a pole's axis and the axis's height at its nearest point. */
  function across(
    pole: QuadrupedFooting.IPole,
    at: IAutoMovieVector3,
  ): ICrossing {
    const dx: number = pole.to.x - pole.from.x;
    const dz: number = pole.to.z - pole.from.z;
    const length: number = dx * dx + dz * dz;
    const share: number =
      length > 0
        ? Math.max(
            0,
            Math.min(
              1,
              ((at.x - pole.from.x) * dx + (at.z - pole.from.z) * dz) / length,
            ),
          )
        : 0;
    return {
      distance: Math.hypot(
        at.x - (pole.from.x + dx * share),
        at.z - (pole.from.z + dz * share),
      ),
      height: pole.from.y + (pole.to.y - pole.from.y) * share,
    };
  }

  /** A limb's terminal radius: its round bar's, as the ride pose admits it. */
  function round(
    limb: QuadrupedBody.Limb,
    parts: readonly IAutoMovieModelPart[],
  ): number {
    const terminal: IAutoMovieModelPart | undefined = parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === QuadrupedBody.BONES[limb][3],
    );
    if (
      terminal?.geometry.type !== "primitive" ||
      (terminal.geometry.shape.type !== "cylinder" &&
        terminal.geometry.shape.type !== "capsule")
    )
      throw new RangeError(`The ${limb} terminal solid is not a rigid bar`);
    return terminal.geometry.shape.radius;
  }

  /** The ground's model height beneath a goal's footprint: its support plane's there, the nominal floor when absent. */
  function floor(goal: EquineFlightClock.IAim, x: number): number {
    if (goal.surface === undefined) return 0;
    const { normal, point }: QuadrupedFooting.ISurface = goal.surface;
    return (
      point.y -
      (normal.x * (x - point.x) + normal.z * (goal.z - point.z)) / normal.y
    );
  }
}
