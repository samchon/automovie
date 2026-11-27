import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrawl,
} from "@automovie/interface";

/*
 * Build the crawl's contact windows from what its plan prepared.
 * Parameter prepared: What the plan prepared.
 * Returns: The windows, hands and feet first, then the knees.
 */
export function crawlContacts(
  prepared: crawlContacts.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const {
    cycles,
    handsDown,
    lift,
    swing,
    duration,
    kneesDown,
    bear,
    support,
  }: crawlContacts.IPrepared = prepared;
  // The hands bear from landing. Each foot keeps its standing contact
  // through the descent, then bears while its knee is in stance, in both
  // the kneeling and the bear crawl: rolling onto the toes does not unload
  // it, and the roll turns about the toes' tip (`crawlFeet.prepareRoll`).
  const contacts: IAutoMovieMotionHumanContactWindow[] = [];
  const bearing: (readonly [
    IAutoMovieMotionHumanContactWindow["part"],
    IAutoMovieMotionHumanCrawl.Limb,
  ])[] = [
    ["leftHand", "leftHand"],
    ["rightHand", "rightHand"],
    ["leftFoot", "leftKnee"],
    ["rightFoot", "rightKnee"],
  ];
  for (const [part, limb] of bearing)
    for (let k: number = 0; k <= cycles; k++) {
      const from: number =
        k === 0
          ? part.endsWith("Foot")
            ? 0
            : handsDown
          : lift(limb, k) + swing;
      const to: number = k === cycles ? duration : lift(limb, k + 1);
      contacts.push({
        part,
        kind: "plant",
        from: from / duration,
        to: to / duration,
        support: support[part.startsWith("left") ? "left" : "right"],
      });
    }

  // On the hands and knees each knee bears on the floor from the instant
  // it lands, as its foot does, while it is in stance; a bear crawl holds
  // its knees over the floor, so they bear nothing. Entered kneeling, the
  // knees already bear; entered crouched, they land with the blend's end.
  if (!bear)
    for (const side of ["left", "right"] as const)
      for (let k: number = 0; k <= cycles; k++) {
        const limb: IAutoMovieMotionHumanCrawl.Limb = `${side}Knee`;
        const from: number = k === 0 ? kneesDown : lift(limb, k) + swing;
        const to: number = k === cycles ? duration : lift(limb, k + 1);
        if (to > from)
          contacts.push({
            part: `${side}LowerLeg`,
            kind: "bear",
            region: side === "left" ? "kneeLeft" : "kneeRight",
            from: from / duration,
            to: to / duration,
            support: support[side],
          });
      }
  return contacts;
}

/*
 * The crawl's contact windows: each hand from its landing and each foot from
 * the start bear while its limb is in stance, the foot rolling about its toes'
 * tip without unloading (`crawlFeet.prepareRoll`); on the hands and knees each
 * knee bears from the instant it lands while it is in stance, and a bear crawl
 * holds its knees over the floor, bearing nothing.
 */
export namespace crawlContacts {
  /*
   * What `crawl.plan` prepared for its contact windows.
   */
  export interface IPrepared {
    /*
     * The crawl's cycles.
     */
    cycles: number;

    /*
     * Seconds at which the hands are down.
     */
    handsDown: number;

    /*
     * Seconds a limb lifts off in its `k`-th cycle.
     */
    lift: (limb: IAutoMovieMotionHumanCrawl.Limb, k: number) => number;

    /*
     * Seconds a limb's swing takes.
     */
    swing: number;

    /*
     * The crawl's seconds.
     */
    duration: number;

    /*
     * Seconds at which the knees are down.
     */
    kneesDown: number;

    /*
     * Whether it is a bear crawl, its knees held over the floor.
     */
    bear: boolean;
    /*
     * Material inherited from each side's entering plant.
     */
    support: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanContactWindow.Support
    >;
  }
}
