import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../core";
import { AutoMovieArchetypeFirearm } from "./AutoMovieArchetypeFirearm";
import type { createLongGun } from "./createLongGun";

/** A long gun under construction. */
type Builder = AutoMovieArchetypeBuilder<
  createLongGun.Affordance,
  createLongGun.Dimension
>;

/** A long gun's drawn and read dimensions. */
type Drawn = Readonly<Partial<Record<createLongGun.Dimension, number>>>;

/**
 * The mechanisms of the period and repeating long guns, laid on the gun
 * `createLongGun` builds along `+Z`, its barrel's line at `y = 0` and its lock
 * on the right, `-X`: a musket's flintlock and ramrod, a bolt action's bolt and
 * magazine, and a lever action's lever and the hammer it cocks.
 *
 * Every place and angle the read sources do not give is a named estimate in
 * `ESTIMATES`; the searches are recorded in the sources record
 * (records-firearms-flintlock.md, records-firearms-rifles.md).
 */
export namespace LongGunLock {
  /**
   * How far ahead of the muzzle a socket bayonet starts its slide onto the
   * barrel, metres: longer than the provisional 0.10 m socket of
   * `createStageBayonet`, so the tube clears the muzzle before it moves on. An
   * authored staging distance, not a measurement.
   */
  export const BAYONET_APPROACH: number = 0.12;

  /**
   * The places and angles no source read gives, each an estimate the mechanisms
   * are drawn by:
   *
   * - `rod`: the ramrod's radius, its line below the barrel's, the front pipe's
   *   middle behind the muzzle, a pipe's half length and its radius, metres;
   *   the Short Land's four pipes are read (Museums Victoria ST 21813), their
   *   places and sizes are not (searched: Museums Victoria, the London Museum,
   *   Colonial Williamsburg, the 1764 Manual Exercise).
   * - `bolt`: the handle's reach, the stroke back, the bolt's radius and the
   *   handle's, the bolt's body behind its stroke, the handle's place ahead of
   *   the bolt's tail and the magazine's opening above the barrel's line,
   *   metres; the lift, degrees, borrowed from Ruger's American Gen II spec
   *   sheet's "70 degree throw" (and Tikka's T3x page's 70 degree opening)
   *   because neither service rifle's manual (TM 9-1270, FM 23-10, German
   *   Infantry Weapons 1943) states its lift; searched in
   *   records-firearms-rifles.md.
   * - `lever`: the lever's swing and the hammer's fall, degrees; the loop's
   *   length, its pivot below the barrel's line and ahead of the trigger, its
   *   end's drop, the lever's and the hammer's radius, the hammer's pivot above
   *   the line and behind the breech, and its spur's rise and lean, metres;
   *   Marlin's page states a half-cock hammer but no angle or size (searched in
   *   records-firearms-rifles.md).
   */
  export const ESTIMATES: Readonly<{
    rod: Readonly<{
      radius: number;
      below: number;
      pipe: number;
      ring: number;
      band: number;
    }>;
    bolt: Readonly<{
      reach: number;
      stroke: number;
      lift: number;
      radius: number;
      handle: number;
      body: number;
      knob: number;
      well: number;
    }>;
    lever: Readonly<{
      swing: number;
      hammer: number;
      loop: number;
      drop: number;
      ahead: number;
      depth: number;
      radius: number;
      rise: number;
      back: number;
      spur: number;
      lean: number;
    }>;
  }> = {
    rod: { radius: 0.0055, below: 0.022, pipe: 0.1, ring: 0.01, band: 0.008 },
    bolt: {
      reach: 0.06,
      stroke: 0.09,
      lift: 70,
      radius: 0.009,
      handle: 0.005,
      body: 0.03,
      knob: 0.02,
      well: 0.02,
    },
    lever: {
      swing: 60,
      hammer: 40,
      loop: 0.11,
      drop: 0.04,
      ahead: 0.03,
      depth: 0.08,
      radius: 0.005,
      rise: 0.02,
      back: 0.06,
      spur: 0.05,
      lean: 0.01,
    },
  };

  /**
   * The front pipe's middle along the gun, metres: `ESTIMATES.rod.pipe` behind
   * the muzzle.
   *
   * @param d The gun's dimensions.
   * @returns Its place along `+Z`.
   */
  function pipeFront(d: Drawn): number {
    return d.length! - ESTIMATES.rod.pipe;
  }

  /**
   * Where a musket's supporting hand holds it, the swell of the stock, along
   * the gun from the butt, metres. The 1764 Manual Exercise puts the left hand
   * "at the swell" at the shoulder, the advance and the present, and at Make
   * Ready "about the middle of that part of the firelock between the Lock and
   * the Swell" (The Manual Exercise, as Ordered by His Majesty in 1764,
   * https://battlefields.org/learn/primary-sources/manual-exercise-ordered-his-majesty-1764).
   * The swell is the stock's bulge where the ramrod enters it, behind the
   * rearmost pipe (American Rifleman, The Redcoats' Brown Bess, 2009, and
   * collectors' descriptions, seen only in search results), so it is taken at
   * the tail pipe, whose place is `ESTIMATES.rod`'s: provisional, no measured
   * distance from the lock to the swell being found (searched: the 1764 Manual
   * Exercise, Museums Victoria ST 21813, American Rifleman;
   * records-firearms-flintlock.md).
   *
   * @param d The gun's dimensions.
   * @returns The swell's place along `+Z`.
   */
  export function swell(d: Drawn): number {
    const breech: number = d.length! - d.barrel!;
    const front: number = pipeFront(d);
    return front - ((PIPES - 1) * (front - breech)) / PIPES;
  }

  /**
   * A flintlock musket's lock, ramrod and contacts: the lock at the breech
   * (`AutoMovieArchetypeFirearm.layFlintlock`: the `pan`, the `frizzen` and the
   * `cock`); the `ramrod` under the barrel, its head at the muzzle, drawn
   * forward out of its pipes until its tail leaves the front `pipe`; the
   * `muzzle` as a socket for the cartridge and the rod, and the `bayonet`'s
   * socket over the muzzle.
   *
   * @param builder The gun under construction, its stock and barrel laid.
   * @param d The gun's dimensions.
   */
  export function musket(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const steel: { color: string } = { color: "#2c2f33" };
    const length: number = d.length!;
    const breech: number = length - d.barrel!;
    AutoMovieArchetypeFirearm.layFlintlock(builder, v(0, 0, breech), {
      cock: "cock",
      spur: "spur",
      frizzen: "frizzen",
      pan: "pan",
    });

    // The ramrod under the barrel, the barrel's length, its head at the muzzle; its pipes along the fore-end.
    const rod: number = d.barrel!;
    const below: number = -e.rod.below;
    builder.rod(
      "ramrod",
      e.rod.radius,
      v(0, below, length - rod),
      v(0, below, length),
      steel,
    );
    const front: number = pipeFront(d);
    for (let k: number = 0; k < PIPES; k++)
      builder.rod(
        `pipe-${k + 1}`,
        e.rod.band,
        v(0, below, front - (k * (front - breech)) / PIPES - e.rod.ring),
        v(0, below, front - (k * (front - breech)) / PIPES + e.rod.ring),
        { color: "#b08d57" },
      );
    // The front pipe's mouth, which the rod's tail clears when fully drawn and where it is returned.
    const mouth: number = front + e.rod.ring;

    builder.affordance({
      id: "ramrod",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, below, length),
        v(0, -1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      travel: mouth - (length - rod),
      parts: ["ramrod"],
    });
    builder.affordance({
      id: "pipe",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, below, mouth),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
    builder.affordance({
      id: "bayonet",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, length),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });

    // The bayonet's approach shares the seat's attitude on the bore's line, so
    // a socket fixed through it slides straight back over the muzzle.
    builder.affordance({
      id: "bayonetEntry",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, length + BAYONET_APPROACH),
        v(0, 0, 1),
        v(1, 0, 0),
      ),
      extent: null,
    });
  }

  /**
   * A bolt action's bolt and magazine: the `bolt` hinge lifts the handle about
   * the bore's axis, and the `boltSlide` slider riding it draws the bolt and
   * its handle back by the stroke; the `magazine` is a socket in the receiver's
   * top, loaded from above.
   *
   * @param builder The gun under construction.
   * @param d The gun's dimensions.
   */
  export function bolt(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const steel: { color: string } = { color: "#2c2f33" };
    const breech: number = d.length! - d.barrel!;
    const tail: number = breech - e.bolt.stroke - e.bolt.body;
    const knob: number = tail + e.bolt.knob;
    builder.rod("bolt", e.bolt.radius, v(0, 0, tail), v(0, 0, breech), steel);
    builder.rod(
      "bolt-handle",
      e.bolt.handle,
      v(0, 0, knob),
      v(-e.bolt.reach, 0, knob),
      steel,
    );
    builder.affordance({
      id: "bolt",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, knob),
        v(0, 0, -1),
        v(-1, 0, 0),
      ),
      extent: null,
      travel: e.bolt.lift,
    });
    builder.affordance({
      id: "boltSlide",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(-e.bolt.reach, 0, knob),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: e.bolt.stroke,
      parts: ["bolt", "bolt-handle"],
      rides: "bolt",
    });
    builder.affordance({
      id: "magazine",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, e.bolt.well, breech - e.bolt.stroke / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
    });
  }

  /**
   * A lever action's lever and hammer: the `lever` loop under the grip swings
   * down and forward about the cross axis, and the `hammer` at the breech
   * follows it back to full cock (`follows`).
   *
   * @param builder The gun under construction.
   * @param d The gun's dimensions.
   */
  export function lever(builder: Builder, d: Drawn): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const steel: { color: string } = { color: "#2c2f33" };
    const pull: number = d.lengthOfPull!;
    const breech: number = d.length! - d.barrel!;
    const pivot: IAutoMovieVector3 = v(0, -e.lever.drop, pull + e.lever.ahead);
    builder.rod(
      "lever",
      e.lever.radius,
      pivot,
      v(0, -e.lever.depth, pivot.z - e.lever.loop),
      steel,
    );
    const hammer: IAutoMovieVector3 = v(0, e.lever.rise, breech - e.lever.back);
    builder.rod(
      "hammer",
      e.lever.radius,
      hammer,
      v(0, e.lever.spur, hammer.z + e.lever.lean),
      steel,
    );
    builder.affordance({
      id: "lever",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(pivot, v(-1, 0, 0), v(0, 0, -1)),
      extent: null,
      travel: e.lever.swing,
      parts: ["lever"],
    });
    builder.affordance({
      id: "hammer",
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(hammer, v(-1, 0, 0), v(0, 1, 0)),
      extent: null,
      travel: e.lever.hammer,
      parts: ["hammer"],
      follows: { id: "lever", ratio: e.lever.hammer / e.lever.swing },
    });
  }
}

/**
 * The Short Land musket's ramrod pipes: "four brass ramrod tubes, steel ramrod"
 * (Museums Victoria ST 21813,
 * https://collections.museumsvictoria.com.au/items/373555).
 */
const PIPES: number = 4;
