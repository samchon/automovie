import type { HumanActionKey } from "../HumanActionKey";

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
 * @evidence contracts/development/common.md#meaningful-documentation States what a mutual action is, what the record says and who joins the chains.
 * @evidence contracts/development/design.md#principled-representation The roles as a closed list of names and each role's action as a function of the shared parameters and the cast, so one statement yields every role's intent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A name, the roles and one function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The role names type the cast, so a missing or a misspelt role is refused by the type checker.
 */
export interface IHumanMutual<Params = object, Role extends string = string> {
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
   * @returns The action's name and its own parameters.
   */
  act(
    role: Role,
    params: Params,
    cast: Readonly<Record<Role, string>>,
  ): IHumanMutual.IAct;
}
/**
 * Companion types of {@link IHumanMutual}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents the member.
 * @evidence contracts/development/design.md#principled-representation One role's action as the name and parameters a chain appends.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `act` returns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The name is the vocabulary's key type.
 */
export namespace IHumanMutual {
  /** One role's action. */
  export interface IAct {
    /** The action: a vocabulary name or a registered one. */
    name: HumanActionKey;

    /** Its parameters. */
    params: object;
  }
}
