export namespace HumanBoardAdmitData {
  /*
   * Bounds of an admitted boarding, in the seat's moving frame (provisional): the
   * most the performer moves relative to the seat at the take-off, metres per
   * second; the farthest level way; the most it rises and drops.
   */
  export const BOUNDS: Readonly<Record<BOUNDSEntryItem, number>> = {
    speed: 1.5,
    reach: 2.5,
    rise: 1.5,
    drop: 3,
  };

  /*
   * The alternatives of `BOUNDSEntryItem`'s site.
   */
  export type BOUNDSEntryItem = "speed" | "reach" | "rise" | "drop";
}
