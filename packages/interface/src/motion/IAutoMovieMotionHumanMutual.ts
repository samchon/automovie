import type { AutoMovieMotionHumanActionKey } from "./AutoMovieMotionHumanActionKey";

/**
 * A mutual action: one thing two or more people do together, such as a
 * handshake, a handover or a lift, stated once for all of them.
 *
 * It names the roles and says which action each role performs for the shared
 * parameters and the cast. The roles' actions are ordinary laws that read one
 * meeting record, so the contact is planned once from where every role stands
 * and no role chases another. `HumanChain.mutual` joins the cast's chains
 * through it.
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
   * @param anchor The joined action's anchor, when the author gave one: each
   *   role's action is anchored `${anchor}.${role}`, so a role can name
   *   another's instants (a catch reads its throw). Absent when the author gave
   *   none.
   * @returns The action's name and its own parameters.
   */
  act(
    role: Role,
    params: Params,
    cast: Readonly<Record<Role, string>>,
    anchor?: string,
  ): IAutoMovieMotionHumanMutual.IAct;
}

/**
 * Contracts used by HumanChain.mutual, HumanMutual.handshake,
 * HumanMutual.highFive, HumanMutual.handOver.
 */
export namespace IAutoMovieMotionHumanMutual {
  /** One role's action. */
  export interface IAct {
    /** The action: a vocabulary name or a registered one. */
    name: AutoMovieMotionHumanActionKey;

    /** Its parameters. */
    params: object;
  }
}
