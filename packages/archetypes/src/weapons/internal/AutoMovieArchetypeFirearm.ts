import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../../core";

/*
 * The firearm action model the handguns and the long guns share: the lock time,
 * from the sear's release to the firing pin's or hammer's fall, and the
 * flintlock a musket and a pistol both carry (`createLongGun`,
 * `createHandgun`).
 *
 * Two lock times are read at their makers' or designers' own documents: the
 * M1903's service firing pin, and an AR-15's standard hammer. No measured lock
 * time of a pistol, a revolver, a pump shotgun or a lever action was found in
 * published ballistics or firearms-engineering literature. The search covered
 * journals, DTIC and Picatinny reports, Beretta's PX4 paper (whose 8.50 ms is a
 * simulation step, not a measurement), Hatcher's Notebook and the SAAMI
 * glossary, and is recorded in records-firearms-locktime.md. Those guns borrow
 * the span of the two read figures, labelled provisional.
 *
 * The flintlock lies on the right of a gun's breech, the gun lying along `+Z`
 * with its barrel's line at `y = 0`: the `pan` holding the priming by the touch
 * hole, the `frizzen`, the steel standing over the pan on its pivot ahead,
 * opened forward to prime and thrown open by the cock's fall, and the `cock`
 * behind on its pivot, resting down on the frizzen and drawn back to half and
 * full cock by the thumb on its `spur`, the thumb piece at the top of its jaw,
 * which rides it. The lock's places and angles are not read at any source: the
 * searches (museum records, the 1764 Manual Exercise, replica lock makers,
 * high-speed ignition studies) are recorded in the sources record,
 * records-firearms-flintlock.md; each is a named estimate in `FLINTLOCK`.
 *
 * A gun's calibre, its ball's diameter, stays each producer's own dimension:
 * the handgun's and the long gun's bands come from different read guns.
 */
export namespace AutoMovieArchetypeFirearm {
  /*
   * The M1903's service firing pin's time of fall, seconds: "the time of fall
   * of the usual firing pin in the U. S. rifle is .0057 seconds", J. C. Garand,
   * US Patent 1,780,521 (1930)
   * (https://patents.google.com/patent/US1780521A/en), measured at Springfield
   * Armory on a smoked disc (Hatcher's Notebook, pp. 397-398).
   */
  export const M1903: number = 0.0057;

  /*
   * An AR-15's standard hammer's lock time, seconds: "Over 50% lock time
   * reduction over standard hammer (4.4 ms vs. 10ms)", Geissele's Hi-Speed
   * National Match trigger instruction sheet, p. 2
   * (https://308ar.com/wp-content/uploads/2017/07/GEISSELE-AR-308-HI-SPEED-NATIONAL-MATCH-TRIGGER-SET-INSTRUCTIONS.pdf),
   * the maker's figure, its method not stated.
   */
  export const AR15: number = 0.01;

  /*
   * The band a firearm whose own lock time was not found borrows: from the
   * M1903's to the AR-15's.
   */
  export const BORROWED: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "s",
    M1903,
    AR15,
    "borrowed from the M1903's read 5.7 ms (Garand, US Patent 1,780,521) to an AR-15's standard hammer's 10 ms (Geissele's instruction sheet), because no measured lock time of this firearm was found (searched: journals, DTIC and Picatinny reports, Beretta's PX4 paper, Hatcher's Notebook, the SAAMI glossary; records-firearms-locktime.md)",
    true,
  );

  /*
   * The lock's places and angles, none read, each an estimate:
   *
   * - `side`: the lock off the barrel's line toward `-X`, metres.
   * - `pan`, `frizzen`, `cock`: the pan's and the frizzen's pivots ahead of the
   *   touch hole and the cock's pivot behind it, metres.
   * - `rise`: the pan above the barrel's line, metres.
   * - `height`: the frizzen's height, metres; `plate`: the lock plate's
   *   thickness, `depth`: the pan's depth, `steel`: the frizzen's thickness and
   *   `jaw`: the cock's radius, metres.
   * - `half`, `full`: the cock's travel back from its fired rest to half cock and
   *   to full cock, degrees. A replica cast from a 1746 Land Pattern lock gives
   *   its cock a 1.8 in throw, a straight distance, not an angle (Track of the
   *   Wolf, secondary).
   * - `open`: the frizzen's opening, degrees.
   */
  export const FLINTLOCK: Readonly<{
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

  /*
   * A flintlock's lock time, from the lock's firing to the pan's flash:
   * Pletcher, Flintlock Timing, Muzzle Blasts (January 1990), 80 trials of two
   * locks fired electrically and timed to a photocell at the pan, 0.0312 to
   * 0.0536 s (the article's chart, reprinted at
   * https://www.blackpowdermag.com/flintlock-timing-muzzleblast-january-1990/):
   * an experimenter's report, not peer-reviewed, and the main charge's ignition
   * after the flash is a separate interval.
   */
  export const FLINTLOCK_TIME: IAutoMovieArchetypeBand =
    AutoMovieArchetypeBand.of(
      "s",
      0.0312,
      0.0536,
      "Pletcher, Flintlock Timing, Muzzle Blasts (January 1990): 0.0312 to 0.0536 s over 80 electrically fired trials from the lock's firing to the pan's flash (https://www.blackpowdermag.com/flintlock-timing-muzzleblast-january-1990/); an experimenter's report in a hobby journal, not peer-reviewed, and the main charge's ignition after the flash is not included (searched: Fuller, SPIE 4948, closed; records-firearms-locktime.md)",
      true,
    );

  /*
   * Lay a flintlock on a gun under construction.
   * Parameter builder: The gun under construction.
   * Parameter hole: The touch hole on the barrel's line, at the breech.
   * Parameter ids: The gun's ids for the cock, its spur, the frizzen and the pan.
   */
  export function layFlintlock<
    Affordance extends string,
    Dimension extends string,
  >(
    builder: AutoMovieArchetypeBuilder<Affordance, Dimension>,
    hole: IAutoMovieVector3,
    ids: Readonly<{
      cock: Affordance;
      spur: Affordance;
      frizzen: Affordance;
      pan: Affordance;
    }>,
  ): void {
    const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
    const e: typeof FLINTLOCK = FLINTLOCK;
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
      AutoMovieEngineVector3.add(frizzen, v(0, e.height / 2, 0)),
      steel,
    );
    // The cock at rest lies forward and up from its pivot, its jaw down on the frizzen's face; the thumb piece tops the jaw.
    const jaw: IAutoMovieVector3 = AutoMovieEngineVector3.add(frizzen, v(0, e.height, 0));
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
        AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.subtract(jaw, cock)),
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
