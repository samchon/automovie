import type { IAutoMovieArcLengthJet } from "../../geometry/IAutoMovieArcLengthJet";
import type { IAutoMovieHumanTrunkAssembly } from "./IAutoMovieHumanTrunkAssembly";

/**
 * The arm's arc of a shoulder ring at one height, published by its owner (the
 * shoulders) for the ring's assembly and for the arm, which copies the arc at
 * the ring's bottom layer: the anterior and posterior axillary guides, on the
 * torso's own folds at the vault and where the arm's ellipse crosses the
 * torso once the arm has merged, the lateral guide at the ellipse's outer
 * extreme and the two sectors between them.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The arm's arc of a shoulder ring at one height, published by its owner (the shoulders) for the ring's assembly and for the arm, which copies the arc at the ring's bottom layer: the anterior and posterior axillary guides, on the torso's own folds at the vault and where the arm's ellipse crosses the torso once the arm has merged, the lateral guide at the ellipse's outer extreme and the two sectors between them.
 * @evidence contracts/development/design.md#principled-representation `anterior`: Lateral share of the torso's half width where the anterior guide stands. `posterior`: Lateral share where the posterior guide stands. `torso`: Weight of the torso's own axillary guides and flank rates in the arc's: 1 at the vault, where the ring is the torso's outside the arc, 0 where the arm has merged with the shoulder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanArmRootArc.create. Read by AutoMovieHumanTrunkRing.speeds, AutoMovieHumanTrunkRing.controls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `anterior`, `posterior`, `torso`, `guides`, `rates`, `front`, `back`; callers supply the complete record.
 */
export interface IAutoMovieHumanArmRootArc {
  /** Lateral share of the torso's half width where the anterior guide stands. */
  anterior: number;

  /** Lateral share where the posterior guide stands. */
  posterior: number;

  /**
   * Weight of the torso's own axillary guides and flank rates in the arc's:
   * 1 at the vault, where the ring is the torso's outside the arc, 0 where the
   * arm has merged with the shoulder.
   */
  torso: number;

  /** The jets of the anterior, lateral and posterior guides in the section plane `[x, z]`. */
  guides: [
    IAutoMovieArcLengthJet,
    IAutoMovieArcLengthJet,
    IAutoMovieArcLengthJet,
  ];

  /** Arclength rates of the front and the back sector, mm per radian of phase. */
  rates: [number, number];

  /**
   * The front sector, from the anterior to the lateral guide, for the speeds
   * the assembly gives its two guides.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The front sector, from the anterior to the lateral guide, for the speeds the assembly gives its two guides.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanArmRootArc owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmRootArc.front declares the invocation boundary only; AutoMovieHumanArmRootArc and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanArmRootArc.front must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanArmRootArc.front owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanArmRootArc and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanArmRootArc producer or caller supplying the callback owns captured state and its lifetime.
   */
  front: (
    speeds: readonly [number, number],
  ) => IAutoMovieHumanTrunkAssembly.Sector;

  /**
   * The back sector, from the lateral to the posterior guide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The back sector, from the lateral to the posterior guide.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanArmRootArc owns the numerical method described above.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanArmRootArc.back declares the invocation boundary only; AutoMovieHumanArmRootArc and its callback provider own the implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanArmRootArc.back must justify them.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanArmRootArc.back owns its time and space costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanArmRootArc and the callback's provider own sharing under the stated input and result contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanArmRootArc producer or caller supplying the callback owns captured state and its lifetime.
   */
  back: (
    speeds: readonly [number, number],
  ) => IAutoMovieHumanTrunkAssembly.Sector;
}
