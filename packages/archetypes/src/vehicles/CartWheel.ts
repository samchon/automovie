import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type ArchetypeBuilder,
  ArchetypeFrame,
  type ArchetypeFriction,
} from "../core";
import type { createCart } from "./createCart";

/**
 * A drawn carrier's road wheels: a pair on one axle, each spinning on a `knob`, as every drawn kind of `createCart` has them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what it builds.
 * @evidence contracts/development/design.md#principled-representation An axle rod and two spoked discs, each disc's roll a knob about the axle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one helper `CartDrawn` and `CartCoach` share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace CartWheel {
  /**
   * Where a pair of wheels stands and what it is called.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation A pair's track, radius and spokes in metres and a count, its axle's station, its parts' prefix and its spin knobs' ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; what `CartWheel` builds a pair from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPair {
    /** Between the wheels, centre to centre, metres. */
    track: number;

    /** The wheels' radius, metres. */
    radius: number;

    /** How many spokes each wheel shows. */
    spokes: number;

    /** The axle's station along `+Z`, metres. */
    z: number;

    /** The prefix of the pair's part ids, empty for a two-wheeler's one pair. */
    prefix: string;

    /** The left and right wheels' spin knobs. */
    spins: readonly [createCart.Affordance, createCart.Affordance];

    /** The articulation the pair rides, such as a turning front axle. */
    rides?: createCart.Affordance;

    /** What the wheels' tyres are made of, where a source says. */
    surface?: ArchetypeFriction.Material;
  }

  /**
   * Add a pair of road wheels on an axle: each a disc with spokes, spinning on a `knob` about the axle, a positive travel rolling it forward.
   *
   * @param builder The carrier under construction.
   * @param pair Where the pair stands and what it is called.
   * @returns The ids of the parts that turn with the axle and no knob binds: the axle itself; the wheels follow on their knobs, which ride 
ides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and the spin's sense.
   * @evidence contracts/development/implementation.md#principled-implementation A knob's `+Y` is the carrier's `+X`, so a positive turn rolls the wheel's top toward `+Z`, as rolling forward does. The spokes' count is read for the chariot's six and the wagon's twelve and fourteen; for the others it is a construction no act reads.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The axle, then one loop over the two sides.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms One rod per wheel and one per spoke pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every drawn kind's wheels are built here.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pair(
    builder: ArchetypeBuilder<createCart.Affordance, createCart.Dimension>,
    pair: IPair,
  ): string[] {
    const v: typeof Vector3.create = Vector3.create;
    const { track, radius, z, prefix } = pair;
    const axle: string = `${prefix}axle`;
    builder.rod(axle, 0.03, v(-track / 2, radius, z), v(track / 2, radius, z), {
      color: METAL,
    });
    for (const [k, side, sign] of [
      [0, "left", 1],
      [1, "right", -1],
    ] as const) {
      const centre: IAutoMovieVector3 = v((sign * track) / 2, radius, z);
      const wheel: string = `${prefix}wheel-${side}`;
      const parts: string[] = [wheel];
      builder.rod(
        wheel,
        radius,
        v(centre.x - 0.03, radius, z),
        v(centre.x + 0.03, radius, z),
        {
          color: WOOD,
          density: 0.2,
          ...(pair.surface === undefined ? {} : { surface: pair.surface }),
        },
      );
      for (let n: number = 0; n < pair.spokes / 2; n++) {
        const angle: number = (2 * Math.PI * n) / pair.spokes;
        const along: IAutoMovieVector3 = v(
          0,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
        );
        const hub: IAutoMovieVector3 = v(centre.x + sign * 0.035, radius, z);
        const spoke: string = `${prefix}spoke-${side}-${n}`;
        builder.rod(
          spoke,
          0.012,
          Vector3.subtract(hub, along),
          Vector3.add(hub, along),
          { color: PAINT },
        );
        parts.push(spoke);
      }
      builder.affordance({
        id: pair.spins[k],
        kind: "knob",
        frame: ArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts,
        ...(pair.rides === undefined ? {} : { rides: pair.rides }),
      });
    }
    return [axle];
  }
}

/** Iron. */
const METAL: string = "#55595f";

/** Bare wood. */
const WOOD: string = "#8b6a43";

/** The body's paint. */
const PAINT: string = "#2f4f3f";
