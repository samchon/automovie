import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
} from "@automovie/interface";

import { support } from "../../actions/internal/support";
import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { HUMAN_SUPPORT_SCRAMBLE } from "../../next/presets/HUMAN_SUPPORT_SCRAMBLE";
import { HUMAN_SUPPORT_SLIDE_OFF } from "../../next/presets/HUMAN_SUPPORT_SLIDE_OFF";

/*
 * Movements over a surface as rows of the support planner (`support`): each a
 * list of stances, the composition giving the surface (`on`), so a movement
 * across several supports is data over the one planner that fits the body,
 * refuses and is checked. The stances follow the movements as coaching and
 * parkour practice describe them (a vault over a box flies from its hands to
 * its feet, which no support sequence holds, so it is a law of its own):
 *
 * - A scramble onto a ledge, its supports moved in stages: the palms laid flat on
 *   the top half a forearm and hand's length in from the edge, one knee brought
 *   up onto the edge, the other foot set on the top beside it while the hands
 *   still bear, then standing up on the top, the knee's foot stepping up beside
 *   the other;
 * - A slide off a table's edge: seated upright on it with the seat and the hands
 *   beside it half a forearm and hand's length back from the edge (the table
 *   behind the body), the feet down to the floor, standing. No timing study was
 *   read, so each move takes the planner's provisional time, and the insets are
 *   provisional. The standing posture is the floor laws' own key
 *   (`getUp.POSES`), the seated one the seated reference posture.
 */
export namespace HumanSupportRows {
  /*
   * Scramble up onto a ledge: the palms on its top, a knee up onto its edge,
   * the other foot up, standing on it. Each of its 4 stances takes
   * `support.SECONDS`, 1 s, so about 4 s (provisional: no timing study);
   * getting onto a ledge, a wall, a table.
   */
  export const scramble: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["support"]["scramble"]
  > = AutoMovieMotionHumanActionRow.of(
    "scramble",
    support,
    HUMAN_SUPPORT_SCRAMBLE,
  );

  /*
   * Slide off a table's edge: seated upright on it with the hands beside the
   * seat, the feet down to the floor, standing. Each of its 3 stances takes
   * `support.SECONDS`, 1 s, so about 3 s (provisional: no timing study);
   * getting down from a table or a counter.
   */
  export const slideOff: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["support"]["slideOff"]
  > = AutoMovieMotionHumanActionRow.of(
    "slideOff",
    support,
    HUMAN_SUPPORT_SLIDE_OFF,
  );
}
