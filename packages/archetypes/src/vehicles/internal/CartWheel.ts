import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeFriction,
} from "../../core";
import type { AutoMovieArchetypeCart } from "../AutoMovieArchetypeCart";

/*
 * A drawn carrier's road wheels: a pair on one axle, each spinning on a `knob`,
 * as every drawn kind of `createCart` has them.
 */
export namespace CartWheel {
  /*
   * Where a pair of wheels stands and what it is called.
   */
  export interface IPair {
    /*
     * Between the wheels, centre to centre, metres.
     */
    track: number;

    /*
     * The wheels' radius, metres.
     */
    radius: number;

    /*
     * How many spokes each wheel shows.
     */
    spokes: number;

    /*
     * The axle's station along `+Z`, metres.
     */
    z: number;

    /*
     * The prefix of the pair's part ids, empty for a two-wheeler's one pair.
     */
    prefix: string;

    /*
     * The left and right wheels' spin knobs.
     */
    spins: readonly [AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Affordance];

    /*
     * The articulation the pair rides, such as a turning front axle.
     */
    rides?: AutoMovieArchetypeCart.Affordance;

    /*
     * What the wheels' tyres are made of, where a source says.
     */
    surface?: AutoMovieArchetypeFriction.Material;
  }

  /*
   * Add a pair of road wheels on an axle: each a disc with spokes, spinning on
   * a `knob` about the axle, a positive travel rolling it forward.
   * Parameter builder: The carrier under construction.
   * Parameter pair: Where the pair stands and what it is called.
   * Returns: The ids of the parts that turn with the axle and no knob binds:
   * the axle itself; the wheels follow on their knobs, which ride `rides`.
   */
  export function pair(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCart.Affordance,
      AutoMovieArchetypeCart.Dimension
    >,
    pair: IPair,
  ): string[] {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
          AutoMovieEngineVector3.subtract(hub, along),
          AutoMovieEngineVector3.add(hub, along),
          { color: PAINT },
        );
        parts.push(spoke);
      }
      builder.affordance({
        id: pair.spins[k],
        kind: "knob",
        frame: AutoMovieArchetypeFrame.facing(centre, v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts,
        ...(pair.rides === undefined ? {} : { rides: pair.rides }),
      });
    }
    return [axle];
  }
}

/*
 * Iron.
 */
const METAL: string = "#55595f";

/*
 * Bare wood.
 */
const WOOD: string = "#8b6a43";

/*
 * The body's paint.
 */
const PAINT: string = "#2f4f3f";
