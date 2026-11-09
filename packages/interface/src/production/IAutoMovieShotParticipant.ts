/**
 * An explicitly required performing actor or compact formation in a shot.
 *
 * @evidence contracts/development/design.md#principled-representation Kind discrimination selects actor or formation obligations. realizeShotContract requires an actor to be a performed scene node and a formation to match designed count and contiguous chunk coverage; promoted hero placement is additionally checked only when the caller supplies nonnull production.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two minimal id arms keep performance membership distinct from compact crowd membership without embedding either runtime representation in the contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A named scene node alone cannot discharge a performing-actor obligation, and a formation label cannot stand in for its contiguous chunks and exact materialized member count.
 * @evidence contracts/development/common.md#meaningful-documentation Defines participant kind and the exact actor or formation identity required by the owning shot.
 */
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
