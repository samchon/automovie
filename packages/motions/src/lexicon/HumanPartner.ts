import { walk } from "../actions/walk";
import { approach } from "../everyday/approach";
import { clinch } from "../grappling/clinch";
import { kuzushi } from "../grappling/kuzushi";
import { relayPass } from "../handling/relayPass";
import { HumanActionRow } from "../law/HumanActionRow";
import type { IHumanMutual } from "../law/IHumanMutual";
import { touch } from "../touch/touch";

/**
 * Things two people do as partners in sport and dance, each a row of a law
 * whose roles share a stated instant or a meeting. Register the rows a film
 * uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the law it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a law (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the law.
 */
export namespace HumanPartner {
  /** The incoming runner of a relay pass, performed over its run: the baton worn in the hand pushed into the outgoing hand at the stated `at`. The composition gives the partner, `at` and the baton. */
  export const relayIncoming = HumanActionRow.of("relayIncoming", relayPass, {
    role: "incoming",
  });

  /** The outgoing runner of a relay pass, performed over its run: the hand back and open at the stated `at`, the baton worn on it from then. The composition gives the partner, `at` and the baton. */
  export const relayOutgoing = HumanActionRow.of("relayOutgoing", relayPass, {
    role: "outgoing",
  });

  /** The leader of a walking partner dance: a slow walk the follower keeps pace with. The composition gives where to. */
  export const danceLead = HumanActionRow.of("danceLead", walk, {
    pace: "slow",
  });

  /** The follower of a walking partner dance: at the leader's right, 0.4 m off (provisional, a promenade's side-by-side hold), walking at the leader's speed by the speed-matching law of a follower (`approach`'s `track: "pace"`). The composition gives the leader as the target. */
  export const danceFollow = HumanActionRow.of("danceFollow", approach, {
    side: "right",
    at: 0.4,
    pace: "slow",
    track: "pace",
  });

  /** The follower's hold of a walking partner dance once both stand: her left palm laid on the leader and held. The composition gives the leader's region (his near shoulder at her left in a promenade). A hold kept while walking is coupled travel (#3341), not staged here: a speed-matching follower lags while the leader walks. */
  export const danceHold = HumanActionRow.of("danceHold", touch, {
    with: "palm",
    kind: "hold",
    hold: 1.5,
    side: "left",
  });

  /** Judo's grip (kumikata) for a throw: the right hand on the partner's left collar and the left on the right sleeve, held two seconds (provisional). The composition gives the partner. */
  export const judoGrip = HumanActionRow.of("judoGrip", clinch, {
    grip: "collarSleeve",
    hold: 2,
  });

  /** The receiver of a judo throw drawn off balance forward (`kuzushi`), the body tipped about the ankles over the toes and held a second. */
  export const judoBroken = HumanActionRow.of("judoBroken", kuzushi, {
    depth: kuzushi.DEPTH,
  });

  /**
   * A judo throw's first half: the thrower (`tori`) takes the grip and the
   * receiver (`uke`) is drawn off balance forward at once. As far as
   * kinematics goes: the thrower's turning entry, the body carried over the
   * hip and its fall are set by the forces of the throw, the force-determined
   * follow-up's (#3439). Register `judoGrip` and `judoBroken` with it.
   */
  export const judoThrow: IHumanMutual<object, "tori" | "uke"> = {
    name: "judoThrow",
    roles: ["tori", "uke"],
    act: (role, _params, cast) =>
      role === "tori"
        ? { name: "judoGrip", params: { partner: cast.uke } }
        : { name: "judoBroken", params: { partner: cast.tori } },
  };
}
