import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/** A message the page sends the take worker; `id` pairs it with its answer. */
export type ITakeRequest =
  | {
      /** Compute a composition's take. */
      kind: "take";

      /** The pairing id. */
      id: number;

      /** The composition. */
      composition: IPlaygroundComposition;

      /** Frames a second of its track. */
      fps: number;
    }
  | {
      /** Read every physical bound on a composition's performance. */
      kind: "verdicts";

      /** The pairing id. */
      id: number;

      /** The composition, which the worker builds again unless it built it last. */
      composition: IPlaygroundComposition;
    }
  | {
      /** Prepare one of the site's bodies and give its measures. */
      kind: "body";

      /** The pairing id. */
      id: number;

      /** The body's id, a key of `PLAYGROUND_BODIES`. */
      body: string;
    };
