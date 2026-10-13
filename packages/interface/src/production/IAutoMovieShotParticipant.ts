/**
 * An explicitly required performing actor or compact formation in a shot.
 *
 * @evidence contracts/common.md#principled-implementation Kind discrimination selects actor or formation obligations; realization requires an actor to be a performed scene node and a formation to preserve its designed slot population and builder-owned heroes.
 * @evidence contracts/common.md#clear-and-simple-design Two minimal id arms keep performance membership distinct from compact crowd membership without embedding either runtime representation in the contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A named scene node alone cannot discharge a performing-actor obligation, and a formation label cannot stand in for its contiguous chunks and exact materialized member count.
 * @evidence contracts/common.md#meaningful-documentation Defines participant kind and the exact actor or formation identity required by the owning shot.
 * @author Samchon
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
