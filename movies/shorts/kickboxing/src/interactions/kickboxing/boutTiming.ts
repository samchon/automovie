import type {
  IAutoMovieIntent,
  resolveAutoMovieSchedule,
} from "@automovie/engine";

import { KickboxingAction } from "../../laws/kickboxing/KickboxingAction";
import { KickboxingTiming } from "../../laws/kickboxing/KickboxingTiming";
import { OfficiatingAction } from "../../laws/officiating/OfficiatingAction";

/**
 * The timing of any intent of the bout, by its subject's vocabulary: fighter
 * actions by the kickboxing timing law, referee signals by their stated
 * length, the bell's ring and the camera's framing decision by theirs.
 *
 * ```ts
 * resolveAutoMovieSchedule(composition, { timing: boutTiming });
 * ```
 *
 * @param intent Any bout intent.
 * @returns Its duration and contact.
 * @evidence docs/research/kickboxing/techniques.md#laws The fighters' measured timing.
 * @evidence docs/research/officiating/referee.md#signals Signals last the time the scene states from the screenplay's anchors.
 */
export function boutTiming(
  intent: IAutoMovieIntent,
): resolveAutoMovieSchedule.ITiming {
  switch (intent.capability) {
    case "signal":
      return { duration: OfficiatingAction.read(intent).seconds, contact: 0 };
    case "ring":
      return { duration: 0, contact: 0 };
    case "frame": {
      const seconds: unknown = (
        intent.parameters?.action as { seconds?: unknown } | undefined
      )?.seconds;
      if (typeof seconds !== "number")
        throw new Error("A framing decision states its seconds");
      return { duration: seconds };
    }
    default:
      return KickboxingTiming.of(KickboxingAction.read(intent));
  }
}
