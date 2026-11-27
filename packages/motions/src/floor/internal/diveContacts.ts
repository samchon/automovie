import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDive,
} from "@automovie/interface";

/*
 * The dive's contact windows: both feet planted through the take-off (on the
 * held ball for a dive), the seat lying from the landing (or from three tenths
 * into a slide's travel), a slide's feet bearing as they slide, and a dive's
 * landing hand planted from the landing.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `contacts`.
 */
export function diveContacts(
  prepared: diveContacts.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const { share, crouch, kind, travel, toLeft }: diveContacts.IPrepared =
    prepared;
  return [
    ...(["leftFoot", "rightFoot"] as const).map(
      (part: PlanContactsPart): IAutoMovieMotionHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: share(crouch),
        support: { kind: "ground" },
        // A dive's foot rolls about its held ball at the toe-off.
        ...(kind === "dive" ? { socket: "ball" as const } : {}),
      }),
    ),
    {
      part: "seat",
      kind: "lie",
      from: share(kind === "dive" ? crouch + travel : crouch + 0.3 * travel),
      to: 1,
      support: { kind: "ground" },
    },
    // A slide's feet stay on the floor and slide with it, bearing.
    ...(kind === "slide"
      ? (["leftFoot", "rightFoot"] as const).map(
          (part: PlanContactsPart2): IAutoMovieMotionHumanContactWindow => ({
            part,
            kind: "bear",
            from: share(crouch),
            to: 1,
            support: { kind: "ground" },
          }),
        )
      : []),
    ...(kind === "dive"
      ? [
          {
            part: toLeft > 0 ? ("leftHand" as const) : ("rightHand" as const),
            kind: "plant" as const,
            from: share(crouch + travel),
            to: 1,
            support: { kind: "ground" as const },
          },
        ]
      : []),
  ];
}

/*
 * The `contacts` of `dive.plan`, built from what that plan prepared.
 */
export namespace diveContacts {
  /*
   * What `dive.plan` prepared for its `contacts`.
   */
  export interface IPrepared {
    /*
     * The `share` `dive.plan` prepared.
     */
    share: (seconds: number) => number;

    /*
     * The `crouch` `dive.plan` prepared.
     */
    crouch: number;

    /*
     * The `kind` `dive.plan` prepared.
     */
    kind: IAutoMovieMotionHumanDive.Kind;

    /*
     * The `travel` `dive.plan` prepared.
     */
    travel: number;

    /*
     * The `toLeft` `dive.plan` prepared.
     */
    toLeft: number;
  }
}

/*
 * The alternatives of `PlanContactsPart`'s site.
 */
type PlanContactsPart = "leftFoot" | "rightFoot";

/*
 * The alternatives of `PlanContactsPart2`'s site.
 */
type PlanContactsPart2 = "leftFoot" | "rightFoot";
