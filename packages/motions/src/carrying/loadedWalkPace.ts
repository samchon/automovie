/**
 * The share of the unloaded walking speed a person walks at while carrying
 * a load of a share of the body's mass: self-selected overground walking
 * speed is unchanged at a fifth of the body's mass (4.75 km/h with none and
 * with 20 %) and falls to 4.6 km/h at two fifths (Middleton, Vickery-Howe,
 * Dascombe, Clarke, Wheat, McClelland and Drain 2022, Int J Environ Res
 * Public Health 19:3927, Table 2, fifteen men and fifteen women carrying a
 * load on the trunk). Between the measured loads the share is linear, and
 * beyond two fifths it is held at the last measured share rather than
 * extrapolated. The study's loads were worn on the trunk; a load held in
 * the hands is taken to slow the walk alike, which no study read measures.
 *
 * @param load The load's share of the body's mass, at least 0.
 * @returns The speed's share, 0.97 to 1.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the measured speeds, the interpolation, the bound and the transfer to a held load.
 * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation between the study's measured means, 4.6 / 4.75 at 40 % of the body's mass.
 * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One piecewise-linear expression.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is extrapolated past the heaviest measured load; the transfer from a worn to a held load is stated as unmeasured.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function loadedWalkPace(load: number): number {
  const share: number = Math.min(0.4, Math.max(0.2, load));
  return 1 + ((share - 0.2) / 0.2) * (4.6 / 4.75 - 1);
}
