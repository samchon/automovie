import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
} from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { AutoMovieArchetypeQuadrupedMotion } from "../AutoMovieArchetypeQuadrupedMotion";
import type { EquineFlightClock } from "../equine/EquineFlightClock";

/*
 * A swing's lift over the authored poles its hoof crosses: the arc's apex that
 * keeps the terminal bar clear of each pole where the hoof's path passes over
 * it.
 *
 * The swing's lift is an arc, its apex times the swing's rise at each share
 * (`AutoMovieArchetypeQuadrupedMotion.swing`). The footing bounds the terminal
 * bar by the capsule of its radius about its axis (`QuadrupedObstacleShape`)
 * and a pole by its own capsule, so the two clear where every point of the
 * bar's axis lies at least the sum of both radii from the pole's axis. In the
 * pole's cross-section, a point at a horizontal distance short of that sum must
 * stand above the pole's axis by the circle's height there; the lift raises the
 * whole bar, so the apex a share asks is the largest such shortfall over the
 * rise there. The bar is read from the endpoint to the fetlock as the body
 * carries its rest attitude. A swing that crosses no pole needs none, and keeps
 * its gait's apex.
 */
export namespace QuadrupedPoleSwing {
  /*
   * One swing's pole apex, metres above the ground, read once per swing.
   */
  export type Crossings = (
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    index: number,
    chain: readonly IAutoMovieVector3[],
    aim: Aim,
    off: number,
    on: number,
  ) => number;

  /*
   * The hoof track's goal at a course state and a swing share.
   */
  export type Aim = (
    moment: AutoMovieArchetypeCourse.IState,
    amount: number,
  ) => EquineFlightClock.IAim;

  /*
   * The terminal bar at a share of a swing, before its lift.
   */
  export interface IBar {
    /*
     * The endpoint on the ground beneath it, world metres.
     */
    ground: IAutoMovieVector3;
    /*
     * The bar's axis from the endpoint to the fetlock, world metres.
     */
    axis: IAutoMovieVector3;
  }

  /*
   * Prepare a ride's swing apexes over its footing's poles.
   * Parameter ground: The admitted footing.
   * Parameter parts: The animal's parts, for each terminal's radius.
   * Parameter shown: The course state at a second with the body's displayed
   * placement.
   * Returns: The reader, cached per swing; none when the footing has no poles,
   * so no other ride pays for it.
   */
  export function crossings(
    ground: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined,
    parts: readonly IAutoMovieModelPart[],
    shown: (seconds: number) => AutoMovieArchetypeCourse.IState,
  ): Crossings | undefined {
    if (ground === undefined || ground.poles.length === 0) return undefined;
    const poles: readonly AutoMovieArchetypeQuadrupedFooting.IPole[] =
      ground.poles;
    const cache: Map<string, number> = new Map();
    return (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      index: number,
      chain: readonly IAutoMovieVector3[],
      aim: Aim,
      off: number,
      on: number,
    ): number => {
      const key: string = `${limb}:${index}`;
      const cached: number | undefined = cache.get(key);
      if (cached !== undefined) return cached;
      const up: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(chain[3]!, chain[4]!);
      const needed: number = apex(
        poles,
        round(limb, parts),
        (share: number): IBar => {
          const moment: AutoMovieArchetypeCourse.IState = shown(
            off + share * (on - off),
          );
          const goal: EquineFlightClock.IAim = aim(
            moment,
            AutoMovieArchetypeQuadrupedMotion.swing(share).along,
          );
          const x: number = goal.x ?? chain[0]!.x;
          return {
            ground: AutoMovieArchetypeFrame.point(moment.placement, {
              x,
              y: floor(goal, x),
              z: goal.z,
            }),
            axis: AutoMovieEngineQuaternion.rotateVector(moment.placement.rotation, up),
          };
        },
        (share: number): number =>
          AutoMovieArchetypeQuadrupedMotion.swing(share).rise,
      );
      cache.set(key, needed);
      return needed;
    };
  }

  /*
   * The apex a swing needs to clear the poles it crosses.
   * Parameter poles: The footing's poles.
   * Parameter radius: The terminal bar's radius, metres.
   * Parameter path: The terminal bar at a share of the swing, 0 to 1, before its
   * lift.
   * Parameter rise: The swing's rise at a share, 0 to 1.
   * Returns: The apex, metres above the ground; zero when the swing crosses no
   * pole.
   */
  export function apex(
    poles: readonly AutoMovieArchetypeQuadrupedFooting.IPole[],
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
        const at: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
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

  /*
   * A point's horizontal distance to a pole's axis, and the axis's height at
   * its point nearest it.
   */
  interface ICrossing {
    /*
     * Horizontal distance, metres.
     */
    distance: number;

    /*
     * The pole axis's world height there, metres.
     */
    height: number;
  }

  /*
   * A point's horizontal distance to a pole's axis and the axis's height at its
   * nearest point.
   */
  function across(
    pole: AutoMovieArchetypeQuadrupedFooting.IPole,
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

  /*
   * A limb's terminal radius: its round bar's, as the ride pose admits it.
   */
  function round(
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    parts: readonly IAutoMovieModelPart[],
  ): number {
    const terminal: IAutoMovieModelPart | undefined = parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    );
    if (
      terminal?.geometry.type !== "primitive" ||
      (terminal.geometry.shape.type !== "cylinder" &&
        terminal.geometry.shape.type !== "capsule")
    )
      throw new RangeError(`The ${limb} terminal solid is not a rigid bar`);
    return terminal.geometry.shape.radius;
  }

  /*
   * The ground's model height beneath a goal's footprint: its support plane's
   * there, the nominal floor when absent.
   */
  function floor(goal: EquineFlightClock.IAim, x: number): number {
    if (goal.surface === undefined) return 0;
    const { normal, point }: AutoMovieArchetypeQuadrupedFooting.ISurface =
      goal.surface;
    return (
      point.y -
      (normal.x * (x - point.x) + normal.z * (goal.z - point.z)) / normal.y
    );
  }
}

/*
 * Shares of a swing read for its pole crossings: about two per centimetre of a
 * metre-long swing's arc.
 */
const SHARES: number = 48;

/*
 * Points read along the terminal bar's axis at each share, its ends included.
 */
const BAR: number = 4;
