import type { IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanLexiconParams } from "@automovie/interface";

import { AutoMovieMotionHumanActionRow } from "../../law/AutoMovieMotionHumanActionRow";
import { putDown } from "../../handling/internal/putDown";
import { operate } from "../../affordance/internal/operate";

export namespace HumanArcheryData {
  /*
   * The nocking as a plain put-down row, before the arrow's own nock is named.
   */
  export const nockRow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["nockArrow"]
  > = AutoMovieMotionHumanActionRow.of("nockArrow", putDown, {});

  /*
   * The draw as a plain operation row, before the bow is read off the bow arm.
   */
  export const drawRow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["archery"]["drawBow"]
  > = AutoMovieMotionHumanActionRow.of("drawBow", operate, {});
}
