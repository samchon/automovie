import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeTrack,
} from "../core";
import { SiegeClearance } from "./SiegeClearance";
import { SiegeStructure } from "./SiegeStructure";
import type { AutoMovieArchetypeSiegeEngine } from "./AutoMovieArchetypeSiegeEngine";

/** A siege engine under construction. */
type Builder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeSiegeEngine.Affordance,
  AutoMovieArchetypeSiegeEngine.Dimension
>;

/** A siege engine's dimensions. */
type Drawn = Readonly<Partial<Record<AutoMovieArchetypeSiegeEngine.Dimension, number>>>;

/**
 * A throwing engine's frame and arm, and the swing of its arm: the arm turns on
 * its axle across `X` at the frame's top, its long end toward `+Z` at rest,
 * level; a positive travel raises the long end. The engine is cocked by turning
 * the long end down and released to swing up.
 *
 * The arm as a pendulum: the counterweight (a trebuchet's) hangs plumb from the
 * short end and acts on the arm at its pin; the beam is a uniform bar; the
 * stone sits in the pouch at the long end. Gravity alone turns it, no friction
 * or drag being read.
 */
export namespace SiegeArm {
  /**
   * The arm's travel at rest, its long end straight up, its centre of mass on
   * the short side lowest: a quarter turn.
   */
  export const REST: number = 90;

  /**
   * Unsourced authored sizes, metres: post and base sections (beam also caps
   * the designed moving diameter), counterweight box, release control and
   * windlass height. Moving arm/cradle radius is designed from their whole
   * angular floor domain, separately from base/control stock.
   */
  export const ESTIMATES: Readonly<{
    post: number;
    beam: number;
    box: number;
    pin: Readonly<{ aperture: number; length: number; pull: number }>;
    winch: number;
  }> = {
    post: 0.25,
    beam: 0.3,
    box: 1,
    pin: { aperture: 0.1, length: 0.3, pull: 0.3 },
    winch: 0.6,
  };

  /**
   * The arm's pendulum about its axle at rest (level): its moment, its mass,
   * its centre of mass's lever and the travel at which it hangs at rest.
   *
   * @param d The engine's dimensions.
   * @returns The pendulum.
   */
  export function pendulum(d: Drawn): AutoMovieArchetypeTrack.IPendulum {
    const long: number = d.armLength!;
    const short: number = d.shortArm!;
    const beam: number = d.armMass!;
    const counter: number = d.counterweight ?? 0;
    const stone: number = d.projectile!;
    const mass: number = beam + counter + stone;
    const middle: number = (long - short) / 2;
    const moment: number =
      (beam * (long ** 3 + short ** 3)) / (3 * (long + short)) +
      counter * short * short +
      stone * long * long;
    const centre: number =
      (beam * middle - counter * short + stone * long) / mass;
    return {
      moment,
      mass,
      arm: Math.abs(centre),
      rest: centre < 0 ? REST : -REST,
    };
  }

  /**
   * Lay the frame and the arm, its counterweight and the contacts.
   *
   * @param builder The engine under construction.
   * @param d The engine's dimensions.
   * @param counterweight Whether the arm carries a hanging counterweight (a
   *   trebuchet) or a cup at the long end (a mangonel).
   */
  export function lay(
    builder: Builder,
    d: Drawn,
    counterweight: boolean,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const wood: { color: string } = { color: "#6b5a3e" };
    const axle: number = d.axleHeight!;
    const width: number = d.frameWidth!;
    const long: number = d.armLength!;
    const short: number = d.shortArm!;
    const radius: number = SiegeStructure.radius(d, e);
    floor(
      "base",
      SiegeClearance.box(v(0, e.beam / 2, 0), v(width, e.beam, long), 0, 0, 0),
    );
    builder.box("base", v(width, e.beam, long), v(0, e.beam / 2, 0), wood);
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      floor(
        `post-${side}`,
        SiegeClearance.box(
          v((sign * width) / 2, axle / 2, 0),
          v(e.post, axle, e.post),
          0,
          0,
          0,
        ),
      );
      builder.box(
        `post-${side}`,
        v(e.post, axle, e.post),
        v((sign * width) / 2, axle / 2, 0),
        wood,
      );
    }
    floor(
      "arm",
      SiegeClearance.cylinder(
        v(0, axle, -short),
        v(0, axle, long),
        radius,
        axle,
        -d.cocked!,
        d.reach!,
      ),
    );
    builder.rod("arm", radius, v(0, axle, -short), v(0, axle, long), wood);
    const pin: IAutoMovieVector3 = v(0, axle, -short);
    if (counterweight) {
      floor(
        "counterweight",
        SiegeClearance.minimum(axle - e.box, 0, -short, -d.cocked!, d.reach!),
      );
      builder.box(
        "counterweight",
        v(e.box, e.box, e.box),
        v(0, axle - e.box / 2, -short),
        { color: "#5a5a5a" },
      );
    }
    builder.affordance({
      id: "arm",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, axle, 0),
        v(-1, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: d.reach!,
      // A traction engine's arm starts level, so it has no travel below level.
      ...(d.cocked! > 0 ? { reverse: d.cocked! } : {}),
      parts: [
        ...SiegeStructure.ARM_PARTS,
        ...(counterweight ? ["counterweight-axle"] : []),
      ],
    });
    if (counterweight)
      builder.affordance({
        id: "counterweight",
        kind: "hinge",
        frame: AutoMovieArchetypeFrame.facing(pin, v(-1, 0, 0), v(0, 0, 1)),
        extent: null,
        travel: d.cocked!,
        reverse: d.reach!,
        parts: ["counterweight"],
        rides: "arm",
        follows: { id: "arm", ratio: -1 },
      });
    builder.affordance({
      id: "pouch",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright(v(0, axle + radius, long)),
      extent: null,
      rides: "arm",
    });
    builder.affordance({
      id: "pin",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, e.beam, long),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: e.pin.aperture,
      length: e.pin.length,
      travel: e.pin.pull,
      parts: [...SiegeStructure.PIN_PARTS],
    });
    builder.affordance({
      id: "winch",
      kind: "crank",
      frame: AutoMovieArchetypeFrame.facing(
        v(width / 2 + e.post, e.winch, 0),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      radius: d.winchRadius!,
      // A windlass's drum turns without a stop, so the crank states no travel: it follows the arm both ways.
      follows: { id: "arm", ratio: -d.winchRatio! },
      parts: [...SiegeStructure.WINCH_PARTS],
    });
    builder.affordance({
      id: "frame",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, e.beam, 0)),
      extent: null,
      width,
      depth: long,
    });
    SiegeStructure.lay(builder, d, e, counterweight, radius);

    /** Admit the whole solid; the ground remains model Y zero. */
    function floor(id: string, minimum: number): void {
      if (!(minimum >= 0))
        throw new RangeError(`Siege ${id} cannot clear the declared floor`);
    }
  }
}
