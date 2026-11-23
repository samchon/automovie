import type { AutoMovieMotionHumanActionKey } from "../AutoMovieMotionHumanActionKey";

/**
 * A mutual action: one thing two or more people do together, such as a
 * handshake, a handover or a lift, stated once for all of them.
 *
 * It names the roles and says which action each role performs for the
 * shared parameters and the cast. The roles' actions are ordinary laws that
 * read one meeting record, so the contact is planned once from where every
 * role stands and no role chases another. `HumanChain.mutual` joins the
 * cast's chains through it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a mutual action is, what the record says and who joins the chains. name: The action: a vocabulary name or a registered one. params: Its parameters.
 * @evidence contracts/development/design.md#principled-representation The roles as a closed list of names and each role's action as a function of the shared parameters and the cast, so one statement yields every role's intent. name: The action: a vocabulary name or a registered one. params: Its parameters.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A name, the roles and one function. Runtime boundary references: HumanChain.ts (HumanChain.mutual, mutual); actions/HumanMutual.ts (HumanMutual.handshake); actions/HumanMutual.ts (HumanMutual.highFive); actions/HumanMutual.ts (HumanMutual.handOver); actions/HumanMutual.ts (HumanMutual.kiss); actions/HumanMutual.ts (HumanMutual.pass).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The role names type the cast, so a missing or a misspelt role is refused by the type checker. Shares the canonical AutoMovieMotionHumanActionKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export interface IAutoMovieMotionHumanMutual<
  Params = object,
  Role extends string = string,
> {
  /** The mutual action's name. */
  name: string;

  /** The roles, in the order their actions are placed. */
  roles: readonly Role[];

  /**
   * The action one role performs.
   *
   * @param role The role.
   * @param params The shared parameters.
   * @param cast Who performs each role, by subject id.
   * @param anchor The joined action's anchor, when the author gave one: each role's action is anchored `${anchor}.${role}`, so a role can name another's instants (a catch reads its throw). Absent when the author gave none.
   * @returns The action's name and its own parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanMutual.act: The action one role performs.
   */
  act(
    role: Role,
    params: Params,
    cast: Readonly<Record<Role, string>>,
    anchor?: string,
  ): IAutoMovieMotionHumanMutual.IAct;
}

/**
 * Contracts used by HumanChain.mutual, HumanMutual.handshake, HumanMutual.highFive, HumanMutual.handOver.
 *
 */
export namespace IAutoMovieMotionHumanMutual {
  /**
   * One role's action.
   *
   * @evidence contracts/development/common.md#meaningful-documentation name: The action: a vocabulary name or a registered one. params: Its parameters.
   * @evidence contracts/development/design.md#principled-representation name: The action: a vocabulary name or a registered one. params: Its parameters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/HumanMutual.ts (HumanMutual.handshake, return); actions/HumanMutual.ts (HumanMutual.highFive, return); actions/HumanMutual.ts (HumanMutual.handOver, return); actions/HumanMutual.ts (HumanMutual.kiss, return); actions/HumanMutual.ts (HumanMutual.pass, return); lexicon/HumanCoupled.ts (HumanCoupled.carry, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieMotionHumanActionKey identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAct {
    /** The action: a vocabulary name or a registered one. */
    name: AutoMovieMotionHumanActionKey;

    /** Its parameters. */
    params: object;
  }
}
