import type { IAutoMovieMotionHumanFirefighting } from "@automovie/interface";

/**
 * Advance a two-member hose team and work the line: the operator carries the
 * line by its nozzle grip, the backup grips without carrying it, each walks
 * the advance, then works the line in their role (`hoseLine`).
 *
 * @param nozzle The operator's chain and standing place.
 * @param backup The backup member's chain and standing place.
 * @param params The line, the advance, the target and the sweeps.
 * @returns Both chains after the drill, the operator's first.
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
  nozzle: IAutoMovieMotionHumanFirefighting.ITeamMember,
  backup: IAutoMovieMotionHumanFirefighting.ITeamMember,
  params: IAutoMovieMotionHumanFirefighting.IHoseTeam,
): IAutoMovieMotionHumanFirefighting.Team {
  const advance: number = params.advance ?? 0;
  const walk = (
    member: IAutoMovieMotionHumanFirefighting.ITeamMember,
  ): IAutoMovieMotionHumanFirefighting.ITeamMember["chain"] =>
    advance > 0
      ? member.chain.walk({
          to: { x: member.at.x, y: 0, z: member.at.z + advance },
        })
      : member.chain;
  return [
    walk({
      chain: nozzle.chain.pickUp({
        prop: params.prop,
        handle: "nozzle",
        hand: "right",
        lift: 0,
      }),
      at: nozzle.at,
    }).registered("hoseLine", { ...params, role: "nozzle", grip: "nozzle" }),
    walk(backup).registered("hoseLine", {
      ...params,
      role: "backup",
      grip: "backup",
    }),
  ];
}
