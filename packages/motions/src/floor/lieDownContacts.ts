import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";

/**
 * The lie's base window from the settled instant: the seat bearing for a seated
 * position, else the back lying for every lying position (the contact parts
 * have no chest or side); the plan adds the feet's pivots after it.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `contacts`.
 */
export function lieDownContacts(
  prepared: lieDownContacts.IPrepared,
): IAutoMovieMotionHumanContactWindow[] {
  const { sitting, settled }: lieDownContacts.IPrepared = prepared;
  return [
    sitting
      ? {
          // Seated on the floor, the seat bears, and the base the next action is entered on is a seated one.
          part: "seat",
          kind: "seat",
          from: settled,
          to: 1,
          support: { kind: "ground" },
        }
      : {
          // The contact parts have no chest or side; the trunk's window is
          // named by the back for every lying position.
          part: "back",
          kind: "lie",
          from: settled,
          to: 1,
          support: { kind: "ground" },
        },
  ];
}

/** The `contacts` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownContacts {
  /** What `lieDown.plan` prepared for its `contacts`. */
  export interface IPrepared {
    /** The `sitting` `lieDown.plan` prepared. */
    sitting: boolean;

    /** The `settled` `lieDown.plan` prepared. */
    settled: number;
  }
}
