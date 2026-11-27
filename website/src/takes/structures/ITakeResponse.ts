import type { IPlaygroundRefusal } from "../../playground/structures/IPlaygroundRefusal";
import type { IPlaygroundVerdicts } from "../../playground/structures/IPlaygroundVerdicts";
import type { ITake } from "./ITake";

/** The take worker's answer to one request, carrying the request's `id`. */
export type ITakeResponse =
  | {
      /** The composition's take. */
      kind: "take";

      /** The request's id. */
      id: number;

      /** The take. */
      take: ITake;
    }
  | {
      /** The packages refused the composition, while planning it or posing a frame. */
      kind: "refusal";

      /** The request's id. */
      id: number;

      /** Why, a `AutoMovieMotionHumanRefusal` field for field, or any other failure as `kind: "error"`. */
      refusal: IPlaygroundRefusal;
    }
  | {
      /** The verdict report. */
      kind: "verdicts";

      /** The request's id. */
      id: number;

      /** The report. */
      verdicts: IPlaygroundVerdicts;
    }
  | {
      /** The request failed outside the packages' refusals. */
      kind: "error";

      /** The request's id. */
      id: number;

      /** The error's message. */
      message: string;
    };
