import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A relay baton pass, one role of it, performed over a run (`HumanChain.over`):
 * the outgoing runner's hand goes back, open, palm back, and the incoming
 * runner pushes the baton's end into it at a film second both roles state
 * alike (`at`), from where the baton passes to the outgoing hand.
 *
 * The outgoing hand is placed in the runner's own frame: behind and below
 * the shoulder by shares of the arm (the upsweep's hand, provisional), the
 * palm back and the fingers down. The incoming hand is placed each second so
 * the baton's end, read in the hand's frame where the baton is worn
 * (`IAutoMovieMotionHumanProp.worn`), lies on the outgoing runner's displayed palm. Each arm
 * leaves the run's swing over `REACH` seconds before `at` and goes back to
 * it over `REACH` after `HOLD`. The outgoing role wears the baton on its
 * hand from `at` (`IAutoMovieMotionHumanActionPlan.wears`), so it rides that hand from the
 * exchange on; without a baton the pass is mimed.
 *
 * First pass: the free distance is the composition's (where the two runs put
 * the runners at `at`); the runners do not adjust their speed to meet, and
 * the fingers do not close on the baton.
 *
 * @evidence contracts/development/common.md#meaningful-documentation baton: The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. hand: The passing hand of both runners; `right` when absent. zone: The takeover zone's entry and exit lines, world metres; the pass at `at` must fall between them (TR24.19); unchecked when absent.
 * @evidence contracts/development/design.md#principled-representation baton: The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. hand: The passing hand of both runners; `right` when absent. zone: The takeover zone's entry and exit lines, world metres; the pass at `at` must fall between them (TR24.19); unchecked when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: handling/relayPass.ts (relayPass.plan, context); handling/relayPass.ts (relayPass.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanSide identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRelayPass {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The role, the partner, the baton and the shared instant.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The instant is stated, so both roles agree without reading each other's plan.
   */
  export interface IParams {
    /** Which runner: the one bringing the baton or the one taking it. */
    role: "incoming" | "outgoing";

    /** The other runner. */
    partner: string;

    /** The film second the baton reaches the outgoing hand; both roles give the same one. */
    at: number;

    /** The baton's subject id, worn on the incoming runner's passing hand; mimed when absent. */
    baton?: string;

    /** The baton's point that is pushed into the outgoing hand, one of its points; required with `baton`. */
    end?: string;

    /** The passing hand of both runners; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** The takeover zone the baton must pass in; unchecked when absent. */
    zone?: IAutoMovieMotionHumanRelayPass.IZone;
  }

  /**
   * A relay takeover zone on the track: the lane's middle at the zone's
   * entry line and at its exit line, world metres on the floor. The pass at
   * `at` must fall between them (World Athletics TR24.19: a 30 m zone).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both lines, their frame and the rule they carry.
   * @evidence contracts/development/design.md#principled-representation Two world-metre floor points on the lane's middle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two points `relayPass.plan` projects the runner onto.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No zone length is stated: it is the distance between the lines the author places.
   */
  export interface IZone {
    /** The lane's middle on the zone's entry line, world metres. */
    from: IAutoMovieVector3;

    /** The lane's middle on the zone's exit line, world metres. */
    to: IAutoMovieVector3;
  }
}
