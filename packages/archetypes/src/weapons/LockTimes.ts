import { ArchetypeBand, type IArchetypeBand } from "../core";

/**
 * The firearms' measured lock times, the time from the sear's release to the firing pin's or hammer's fall, and the band a firearm borrows when its own was not found.
 *
 * Two lock times are read at their makers' or designers' own documents: the M1903's service firing pin, and an AR-15's standard hammer. No measured lock time of a pistol, a revolver, a pump shotgun or a lever action was found in published ballistics or firearms-engineering literature. The search covered journals, DTIC and Picatinny reports, Beretta's PX4 paper (whose 8.50 ms is a simulation step, not a measurement), Hatcher's Notebook and the SAAMI glossary, and is recorded in records-firearms-locktime.md. Those guns borrow the span of the two read figures, labelled provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a lock time is, which two are read and why the others borrow.
 * @evidence contracts/development/design.md#principled-representation Two read figures in seconds and one band spanning them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one owner of the lock times the long guns and the handguns share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No forum, Usenet or encyclopedia figure stands as a source; a borrowed band names its lenders and the failed search.
 */
export namespace LockTimes {
  /** The M1903's service firing pin's time of fall, seconds: "the time of fall of the usual firing pin in the U. S. rifle is .0057 seconds", J. C. Garand, US Patent 1,780,521 (1930) (https://patents.google.com/patent/US1780521A/en), measured at Springfield Armory on a smoked disc (Hatcher's Notebook, pp. 397-398). */
  export const M1903: number = 0.0057;

  /** An AR-15's standard hammer's lock time, seconds: "Over 50% lock time reduction over standard hammer (4.4 ms vs. 10ms)", Geissele's Hi-Speed National Match trigger instruction sheet, p. 2 (https://308ar.com/wp-content/uploads/2017/07/GEISSELE-AR-308-HI-SPEED-NATIONAL-MATCH-TRIGGER-SET-INSTRUCTIONS.pdf), the maker's figure, its method not stated. */
  export const AR15: number = 0.01;

  /** The band a firearm whose own lock time was not found borrows: from the M1903's to the AR-15's. */
  export const BORROWED: IArchetypeBand = ArchetypeBand.of(
    "s",
    M1903,
    AR15,
    "borrowed from the M1903's read 5.7 ms (Garand, US Patent 1,780,521) to an AR-15's standard hammer's 10 ms (Geissele's instruction sheet), because no measured lock time of this firearm was found (searched: journals, DTIC and Picatinny reports, Beretta's PX4 paper, Hatcher's Notebook, the SAAMI glossary; records-firearms-locktime.md)",
    true,
  );
}
