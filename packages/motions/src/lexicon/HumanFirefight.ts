import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanFirefight,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The extinguisher's safety pin's pull, metres: `createFireExtinguisher`'s. */
const PIN: number = 0.04;

/**
 * Firefighting drills composed from the held-prop laws.
 *
 * `pass` is OSHA's PASS whole: the extinguisher taken by its carrying
 * handle, the pin pulled by the free hand by its ring (`workHeld`'s
 * `push`), then aim, squeeze and sweep (`extinguish`). `hoseTeam` walks a
 * two-member team forward the advance, the operator carrying the line by
 * its nozzle, then each member works the line in their role (`hoseLine`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each drill and the laws it composes.
 * @evidence contracts/development/design.md#principled-representation Compositions over registered laws on the members' chains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two drills the firefighting scenes read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every step is a registered law; nothing is posed directly.
 */
export namespace HumanFirefight {
  /**
   * Pull, aim, squeeze and sweep an extinguisher.
   *
   * @param chain The chain the drill continues.
   * @param params The extinguisher, the fire and the sweep.
   * @param hand The hand that carries it; `right` when absent.
   * @returns The chain after the drill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the steps.
   * @evidence contracts/development/implementation.md#principled-implementation The pin's pull frees the lever the sweep squeezes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Take, pull, then aim and sweep.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three chained steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses pickUp, workHeld and extinguish.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pass(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanFirefight.IExtinguish,
    hand: AutoMovieHumanSide = "right",
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: params.prop, handle: "handle", hand, lift: 0.1 })
      .registered("workHeld", {
        prop: params.prop,
        side: hand,
        drive: [{ articulation: "pin", to: PIN }],
        push: "ring",
        seconds: 0.5,
      })
      .registered("extinguish", params);
  }

  /**
   * Advance a two-member hose team and work the line.
   *
   * @param nozzle The operator's chain.
   * @param backup The backup member's chain.
   * @param params The line, the advance, the target and the sweeps.
   * @returns Both chains after the drill.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the walk and the roles.
   * @evidence contracts/development/implementation.md#principled-implementation The operator carries the line by its nozzle grip; the backup grips without carrying it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Take the line, walk, then work it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A few chained steps per member.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses pickUp, walk and hoseLine.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hoseTeam(
    nozzle: ITeamMember,
    backup: ITeamMember,
    params: IHoseTeam,
  ): Team {
    const advance: number = params.advance ?? 0;
    const walk: (
      member: ITeamMember,
      chain: IAutoMovieMotionHumanChain,
    ) => IAutoMovieMotionHumanChain = (
      member: ITeamMember,
      chain: IAutoMovieMotionHumanChain,
    ): IAutoMovieMotionHumanChain =>
      advance > 0
        ? chain.walk({ to: { x: member.at.x, y: 0, z: member.at.z + advance } })
        : chain;
    return [
      walk(
        nozzle,
        nozzle.chain.pickUp({
          prop: params.prop,
          handle: "nozzle",
          hand: "right",
          lift: 0,
        }),
      ).registered("hoseLine", { ...params, role: "nozzle", grip: "nozzle" }),
      walk(backup, backup.chain).registered("hoseLine", {
        ...params,
        role: "backup",
        grip: "backup",
      }),
    ];
  }

  /**
   * The team's shared parameters: the line, the advance, the target and the sweeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what it holds.
   * @evidence contracts/development/design.md#principled-representation A named alias over the interface's own types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What hoseTeam reads or returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is added.
   */
  export type IHoseTeam = Omit<
    IAutoMovieMotionHumanFirefight.IHoseLine,
    "role" | "grip"
  >;

  /**
   * The operator's and the backup's chains, in that order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names what it holds.
   * @evidence contracts/development/design.md#principled-representation A named alias over the interface's own types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What hoseTeam reads or returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No member is added.
   */
  export type Team = readonly [
    IAutoMovieMotionHumanChain,
    IAutoMovieMotionHumanChain,
  ];

  /**
   * A team member's chain and standing place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the chain and the place.
   * @evidence contracts/development/design.md#principled-representation A chain and world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `hoseTeam` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required.
   */
  export interface ITeamMember {
    /** The member's chain so far. */
    chain: IAutoMovieMotionHumanChain;

    /** Where the member stands, world metres; the advance walks from it along `+Z`. */
    at: IAutoMovieVector3;
  }
}
