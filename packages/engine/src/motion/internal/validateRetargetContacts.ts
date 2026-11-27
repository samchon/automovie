import type {
  IAutoMovieRetargetContactProps,
  IAutoMovieRetargetHandContact,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/*
 * Append field-located errors for an enabled retarget contact policy before
 * source FK or IK. Disabled contact preservation ignores its unused numeric
 * policy; ground callback results are validated only when sampled.
 */
export function validateRetargetContacts(
  contacts: IAutoMovieRetargetContactProps | undefined,
  duration: number,
  collector: IAutoMovieViolationCollector,
): void {
  if (contacts === undefined || contacts.enabled === false) return;
  if (contacts.tolerance !== undefined)
    collector.range(
      "$input.contacts.tolerance",
      contacts.tolerance,
      0,
      Number.MAX_VALUE,
      "contact tolerance",
    );
  if (typeof contacts.groundY === "number")
    collector.range(
      "$input.contacts.groundY",
      contacts.groundY,
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      "source ground height",
    );
  (contacts.hands ?? []).forEach(
    (hand: IAutoMovieRetargetHandContact, index: number): void => {
      const base: string = `$input.contacts.hands[${index}]`;
      collector.range(
        `${base}.start`,
        hand.start,
        0,
        duration,
        "hand contact start",
      );
      collector.range(`${base}.end`, hand.end, 0, duration, "hand contact end");
      if (hand.end < hand.start)
        collector.push(
          "temporal",
          `${base}.end`,
          "hand contact end must be at or after start",
          hand.end,
        );
    },
  );
}
