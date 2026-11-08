import { AutoMovieChain } from "@automovie/engine";

import { OfficiatingAction } from "../../../laws/officiating/OfficiatingAction";
import type { RefereeShape } from "../../../laws/officiating/RefereeShape";
import { RefereeBody } from "./RefereeBody";
import { RefereeFigure } from "./RefereeFigure";

/**
 * The referee: his body and his signals as intents. Where he stands is not a
 * capability; the officiating interaction applies his positioning law to the
 * fighters at every second.
 *
 * ```ts
 * const referee = new Referee();
 * referee.signal("fight", 1, "Fight!");
 * ```
 *
 * @evidence docs/body/settings/cast/referee.md#signals "Fight!", "Down!", "Neutral corner!", the count, the knockout sweep and the winner.
 * @evidence docs/body/settings/cast/referee.md#voice Clear, firm English commands and an even count.
 * @evidence docs/body/settings/cast/referee.md#after-result The crouch beside B.
 */
export class Referee {
  /** Stable subject id. */
  public readonly id: string = "referee";

  /** His body. */
  public readonly body: Pick<RefereeBody, "measure" | "profile" | "place">;

  /**
   * Build the referee.
   *
   * @param body A body realizing his settings without the Human figure, for logic units.
   */
  public constructor(
    body?: Pick<RefereeBody, "measure" | "profile" | "place">,
  ) {
    this.body = body ?? new RefereeBody();
    Object.freeze(this);
  }

  /**
   * A signal with its words.
   *
   * @param signal The signal.
   * @param seconds Seconds the gesture lasts.
   * @param words Spoken words, if any.
   * @param anchor Optional anchor id.
   * @returns The chain.
   */
  public signal(
    signal: RefereeShape.Signal,
    seconds: number,
    words?: string,
    anchor?: string,
  ): AutoMovieChain {
    return AutoMovieChain.of(
      OfficiatingAction.intent(
        this.id,
        {
          kind: "signal",
          signal,
          seconds,
          ...(words === undefined ? {} : { words }),
        },
        anchor,
      ),
    );
  }

  /**
   * His displayed figure.
   *
   * @returns A new figure owned by the caller.
   */
  public figure(): RefereeFigure {
    if (!(this.body instanceof RefereeBody))
      throw new Error("The referee's body has no Human figure");
    return new RefereeFigure(this.body);
  }
}
