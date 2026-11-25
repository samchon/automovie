/**
 * The starts a hold instant's inverse kinematics is attempted from, in turn:
 * the caller's configuration, then the law's goal arms where every arm has one,
 * then the rest. MoveIt's KDL inverse kinematics makes its first attempt from
 * the caller's seed (`ik_seed_state`) and, when that attempt fails, attempts
 * again from another seed (`KDLKinematicsPlugin::searchPositionIK`,
 * moveit/moveit moveit_kinematics/kdl_kinematics_plugin/src/
 * kdl_kinematics_plugin.cpp, BSD-3-Clause); here the other seeds are the
 * caller's own, so the search stays deterministic.
 *
 * @param given The caller's configuration, each arm's coordinates; none when
 *   absent.
 * @param guesses The goal arms' coordinates, each arm's; none when an arm has
 *   none.
 * @param rest Each arm's rest coordinates.
 * @returns The starts in the order they are tried, fresh copies.
 */
export function HumanArmSeedStarts(
  given: readonly (readonly number[])[] | undefined,
  guesses: readonly (readonly number[])[] | undefined,
  rest: readonly (readonly number[])[],
): number[][][] {
  const copy: (q: readonly (readonly number[])[]) => number[][] = (
    q: readonly (readonly number[])[],
  ): number[][] => q.map((v: readonly number[]): number[] => [...v]);
  return [
    ...(given === undefined ? [] : [copy(given)]),
    ...(guesses === undefined ? [] : [copy(guesses)]),
    copy(rest),
  ];
}
