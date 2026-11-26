import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanLexiconParams,
  IAutoMovieMotionHumanMutual,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";
import { approach } from "../everyday/approach";
import { clinch } from "../grappling/clinch";
import { kuzushi } from "../grappling/kuzushi";
import { relayPass } from "../handling/relayPass";
import { AutoMovieMotionHumanActionRow } from "../law/AutoMovieMotionHumanActionRow";
import { HUMAN_GRAPPLE_JUDO_GRIP } from "../next/presets/HUMAN_GRAPPLE_JUDO_GRIP";
import { HUMAN_TOUCH_PARTNER_DANCE_HOLD } from "../next/presets/HUMAN_TOUCH_PARTNER_DANCE_HOLD";
import { touch } from "../touch/touch";

/** The alternatives of `CastEntryItem`'s site. */
type CastEntryItem = "tori" | "uke";

/** The alternatives of `JudoThrowRole`'s site. */
type JudoThrowRole = "tori" | "uke";

/** The alternatives of `JudoThrow`'s site. */
type JudoThrow = "tori" | "uke";

/**
 * Things two people do as partners in sport and dance, each a row of a law
 * whose roles share a stated instant or a meeting. Register the rows a film
 * uses.
 */
export namespace HumanPartner {
  /**
   * The incoming runner of a relay pass, performed over its run: the baton worn
   * in the hand pushed into the outgoing hand at the stated `at`. The
   * composition gives the partner, `at` and the baton. It has no timing of its
   * own: the pass happens at `at` over the runner's run (a jog, run or sprint
   * of `IAutoMovieMotionHumanRun`, 2.3 to 6.8 m/s at the reference hip); a
   * relay race.
   */
  export const relayIncoming: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["relayIncoming"]
  > = AutoMovieMotionHumanActionRow.of("relayIncoming", relayPass, {
    role: "incoming",
  });

  /**
   * The outgoing runner of a relay pass, performed over its run: the hand back
   * and open at the stated `at`, the baton worn on it from then. The
   * composition gives the partner, `at` and the baton. It has no timing of its
   * own: the hand is back and open at `at` over the runner's run
   * (`IAutoMovieMotionHumanRun`); a relay race.
   */
  export const relayOutgoing: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["relayOutgoing"]
  > = AutoMovieMotionHumanActionRow.of("relayOutgoing", relayPass, {
    role: "outgoing",
  });

  /**
   * The leader of a walking partner dance: the slow walk, about 0.82 m/s at the
   * reference hip ({@link IAutoMovieMotionHumanWalkParams.pace}), the follower
   * keeps pace with; a waltz-like promenade, a stately procession. The
   * composition gives where to.
   */
  export const danceLead: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["danceLead"]
  > = AutoMovieMotionHumanActionRow.of("danceLead", walk, {
    pace: "slow",
  });

  /**
   * The follower of a walking partner dance: at the leader's right, 0.4 m off
   * (provisional, a promenade's side-by-side hold), walking at the leader's
   * speed (the slow walk, {@link IAutoMovieMotionHumanWalkParams.pace}) by the
   * speed-matching law of a follower (`approach`'s `track: "pace"`). The
   * composition gives the leader as the target.
   */
  export const danceFollow: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["danceFollow"]
  > = AutoMovieMotionHumanActionRow.of("danceFollow", approach, {
    from: "right",
    at: 0.4,
    pace: "slow",
    track: "pace",
  });

  /**
   * The follower's hold of a walking partner dance once both stand: her left
   * palm laid on the leader and held 1.5 s. The composition gives the leader's
   * region (his near shoulder at her left in a promenade). A hold kept while
   * walking is coupled travel, not staged here: a speed-matching follower lags
   * while the leader walks.
   */
  export const danceHold: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["danceHold"]
  > = AutoMovieMotionHumanActionRow.of(
    "danceHold",
    touch,
    HUMAN_TOUCH_PARTNER_DANCE_HOLD,
  );

  /**
   * Judo's grip (kumikata) for a throw: the right hand on the partner's left
   * collar and the left on the right sleeve, held two seconds (provisional).
   * The composition gives the partner.
   */
  export const judoGrip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["judoGrip"]
  > = AutoMovieMotionHumanActionRow.of(
    "judoGrip",
    clinch,
    HUMAN_GRAPPLE_JUDO_GRIP,
  );

  /**
   * The receiver of a judo throw drawn off balance forward (`kuzushi`), the
   * body tipped about the ankles over the toes and held a second.
   */
  export const judoBroken: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconParams["social"]["judoBroken"]
  > = AutoMovieMotionHumanActionRow.of("judoBroken", kuzushi, {
    depth: kuzushi.DEPTH,
  });

  /**
   * A judo throw's first half: the thrower (`tori`) takes the grip and the
   * receiver (`uke`) is drawn off balance forward at once. As far as kinematics
   * goes: the thrower's turning entry, the body carried over the hip and its
   * fall are set by the forces of the throw, the force-determined follow-up's.
   * Register `judoGrip` and `judoBroken` with it.
   *
   * The grip is held 2 s and the receiver held off balance 1 s (`judoGrip`,
   * `judoBroken`, provisional); the throw's own timing is the force input's; a
   * judo match or a demonstration.
   */
  export const judoThrow: IAutoMovieMotionHumanMutual<object, JudoThrow> = {
    name: "judoThrow",
    roles: ["tori", "uke"],
    act: (
      role: JudoThrowRole,
      _params: object,
      cast: Readonly<Record<CastEntryItem, string>>,
    ): IAutoMovieMotionHumanMutual.IAct =>
      role === "tori"
        ? { name: "judoGrip", params: { partner: cast.uke } }
        : { name: "judoBroken", params: { partner: cast.tori } },
  };
}
