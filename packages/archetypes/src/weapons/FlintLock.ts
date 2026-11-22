import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/**
 * A flintlock, laid on the right of a gun's breech, the gun lying along `+Z` with its barrel's line at `y = 0`: the `pan` holding the priming by the touch hole, the `frizzen`, the steel standing over the pan on its pivot ahead, opened forward to prime and thrown open by the cock's fall, and the `cock` behind on its pivot, resting down on the frizzen and drawn back to half and full cock by the thumb on its `spur`, the thumb piece at the top of its jaw, which rides it. A musket's and a pistol's lock are the same lock (`createLongGun`, `createHandgun`).
 *
 * The lock's places and angles are not read at any source: the searches (museum records, the 1764 Manual Exercise, replica lock makers, high-speed ignition studies) are recorded in the sources record, records-firearms-flintlock.md; each is a named estimate in `ESTIMATES`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is laid, where, each hinge's sense and where the unread values are.
 * @evidence contracts/development/design.md#principled-representation The three parts a hand works and their two hinges about the gun's cross axis, and the pan as a socket.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `lay`, the estimates and the lock's time, shared by every flintlock.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every unread place and angle is a named estimate, never a bare number in a builder.
 */
export namespace FlintLock {
  /**
   * The lock's places and angles, none read, each an estimate:
   *
   * - `side`: the lock off the barrel's line toward `-X`, metres.
   * - `pan`, `frizzen`, `cock`: the pan's and the frizzen's pivots ahead of the touch hole and the cock's pivot behind it, metres.
   * - `rise`: the pan above the barrel's line, metres.
   * - `height`: the frizzen's height, metres; `plate`: the lock plate's thickness, `depth`: the pan's depth, `steel`: the frizzen's thickness and `jaw`: the cock's radius, metres.
   * - `half`, `full`: the cock's travel back from its fired rest to half cock and to full cock, degrees. A replica cast from a 1746 Land Pattern lock gives its cock a 1.8 in throw, a straight distance, not an angle (Track of the Wolf, secondary).
   * - `open`: the frizzen's opening, degrees.
   */
  export const ESTIMATES: Readonly<{
    side: number;
    pan: number;
    frizzen: number;
    cock: number;
    rise: number;
    height: number;
    plate: number;
    depth: number;
    steel: number;
    jaw: number;
    half: number;
    full: number;
    open: number;
  }> = {
    side: 0.03,
    pan: 0.015,
    frizzen: 0.03,
    cock: 0.04,
    rise: 0.012,
    height: 0.04,
    plate: 0.006,
    depth: 0.006,
    steel: 0.004,
    jaw: 0.004,
    half: 25,
    full: 50,
    open: 60,
  };

  /** A flintlock's lock time, from the lock's firing to the pan's flash: Pletcher, Flintlock Timing, Muzzle Blasts (January 1990), 80 trials of two locks fired electrically and timed to a photocell at the pan, 0.0312 to 0.0536 s (the article's chart, reprinted at https://www.blackpowdermag.com/flintlock-timing-muzzleblast-january-1990/): an experimenter's report, not peer-reviewed, and the main charge's ignition after the flash is a separate interval. */
  export const TIME: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "s",
    0.0312,
    0.0536,
    "Pletcher, Flintlock Timing, Muzzle Blasts (January 1990): 0.0312 to 0.0536 s over 80 electrically fired trials from the lock's firing to the pan's flash (https://www.blackpowdermag.com/flintlock-timing-muzzleblast-january-1990/); an experimenter's report in a hobby journal, not peer-reviewed, and the main charge's ignition after the flash is not included (searched: Fuller, SPIE 4948, closed; records-firearms-locktime.md)",
    true,
  );

  /**
   * Lay a flintlock on a gun under construction.
   *
   * @param builder The gun under construction.
   * @param hole The touch hole on the barrel's line, at the breech.
   * @param ids The gun's ids for the cock, its spur, the frizzen and the pan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it adds.
   * @evidence contracts/development/implementation.md#principled-implementation The pan by the touch hole, the frizzen's pivot ahead of it and the cock's behind, each hinge turning about the cross axis: the frizzen forward to open, the cock back to cock; the spur at the cock's jaw end, the farthest point from its pivot, where a thumb has the most leverage, riding the cock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Plate, pan, frizzen and cock, then the three contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flint, the springs and the tumbler are not modelled; half cock is a travel of the one hinge, `ESTIMATES.half`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Five parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one lock.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay<Affordance extends string, Dimension extends string>(
    builder: AutoMovieArchetypeBuilder<Affordance, Dimension>,
    hole: IAutoMovieVector3,
    ids: Readonly<{
      cock: Affordance;
      spur: Affordance;
      frizzen: Affordance;
      pan: Affordance;
    }>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const e: typeof ESTIMATES = ESTIMATES;
    const steel: { color: string } = { color: "#2c2f33" };
    const x: number = hole.x - e.side;
    const pan: IAutoMovieVector3 = v(x, hole.y + e.rise, hole.z + e.pan);
    const frizzen: IAutoMovieVector3 = v(
      x,
      hole.y + e.rise,
      hole.z + e.frizzen,
    );
    const cock: IAutoMovieVector3 = v(x, hole.y, hole.z - e.cock);
    builder.box(
      "lock-plate",
      v(e.plate, e.height, e.cock + e.frizzen),
      v(x - e.plate, hole.y, hole.z + (e.frizzen - e.cock) / 2),
      steel,
    );
    builder.box("pan", v(e.pan, e.depth, e.pan), pan, steel);
    builder.box(
      "frizzen",
      v(e.pan, e.height, e.steel),
      Vector3.add(frizzen, v(0, e.height / 2, 0)),
      steel,
    );
    // The cock at rest lies forward and up from its pivot, its jaw down on the frizzen's face; the thumb piece tops the jaw.
    const jaw: IAutoMovieVector3 = Vector3.add(frizzen, v(0, e.height, 0));
    builder.rod("cock", e.jaw, cock, jaw, steel);
    builder.ball("spur", e.jaw, jaw, steel);
    builder.affordance({
      id: ids.pan,
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(pan, v(0, 1, 0), v(0, 0, 1)),
      extent: null,
    });
    builder.affordance({
      id: ids.frizzen,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(frizzen, v(1, 0, 0), v(0, 0, 1)),
      extent: null,
      travel: e.open,
      parts: ["frizzen"],
    });
    builder.affordance({
      id: ids.cock,
      kind: "hinge",
      frame: AutoMovieArchetypeFrame.facing(cock, v(-1, 0, 0), v(0, 0, 1)),
      extent: null,
      travel: e.full,
      parts: ["cock", "spur"],
    });
    // The thumb takes the spur from behind the cock's end, drawing it back about the pivot.
    builder.affordance({
      id: ids.spur,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        jaw,
        Vector3.normalize(Vector3.subtract(jaw, cock)),
        v(1, 0, 0),
      ),
      extent: null,
      grip: "precision",
      aperture: 2 * e.jaw,
      length: 2 * e.jaw,
      rides: ids.cock,
    });
  }
}
