/** An actor or formation required by a shot. */
export type IAutoMovieShotParticipant =
  | {
      /** Named actor participant. */
      kind: "actor";

      /** Actor id. */
      id: string;
    }
  | {
      /** Formation participant. */
      kind: "formation";

      /** Formation id. */
      id: string;
    };
