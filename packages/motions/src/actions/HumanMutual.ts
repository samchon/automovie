import type { handOver } from "../handling/handOver";
import type { handshake } from "../handling/handshake";
import type { IHumanMutual } from "../law/IHumanMutual";
import type { highFive } from "../touch/highFive";

/**
 * The vocabulary's mutual actions, for `HumanChain.mutual`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and who reads it.
 * @evidence contracts/development/design.md#principled-representation Each mutual action as its roles and each role's action, over the shipped laws.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mutual actions the vocabulary ships; a production writes its own record the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law is duplicated: a role's action is a shipped law with the partner named from the cast.
 */
export namespace HumanMutual {
  /** Two people shake hands; both perform `handshake`. */
  export const handshake: IHumanMutual<
    Omit<handshake.IParams, "partner">,
    "one" | "other"
  > = {
    name: "handshake",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: Omit<handshake.IParams, "partner">,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IHumanMutual.IAct => ({
      name: "handshake",
      params: { ...params, partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /** Two people slap palms; both perform `highFive`. */
  export const highFive: IHumanMutual<
    Omit<highFive.IParams, "partner">,
    "one" | "other"
  > = {
    name: "highFive",
    roles: ["one", "other"],
    act: (
      role: "one" | "other",
      params: Omit<highFive.IParams, "partner">,
      cast: Readonly<Record<"one" | "other", string>>,
    ): IHumanMutual.IAct => ({
      name: "highFive",
      params: { ...params, partner: cast[role === "one" ? "other" : "one"] },
    }),
  };

  /** One person hands an object to another: the giver performs `handOver`, the receiver `receive`. */
  export const handOver: IHumanMutual<
    Omit<handOver.IParams, "to">,
    "giver" | "receiver"
  > = {
    name: "handOver",
    roles: ["giver", "receiver"],
    act: (
      role: "giver" | "receiver",
      params: Omit<handOver.IParams, "to">,
      cast: Readonly<Record<"giver" | "receiver", string>>,
    ): IHumanMutual.IAct =>
      role === "giver"
        ? { name: "handOver", params: { ...params, to: cast.receiver } }
        : {
            name: "receive",
            params: {
              prop: params.prop,
              handle: params.handle,
              from: cast.giver,
              ...(params.mass === undefined ? {} : { mass: params.mass }),
              ...(params.outcome === undefined
                ? {}
                : { outcome: params.outcome }),
              ...(params.receiverHand === undefined
                ? {}
                : { hand: params.receiverHand }),
              ...(params.hand === undefined ? {} : { giverHand: params.hand }),
            },
          },
  };
}
