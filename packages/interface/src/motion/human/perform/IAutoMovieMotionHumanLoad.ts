/**
 * Contracts used by HumanLoad.lean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation height: The body's centre-of-mass height above its base, metres. ahead: The load's horizontal distance ahead of the centre along the facing, metres; negative behind.
 * @evidence contracts/development/design.md#principled-representation height: The body's centre-of-mass height above its base, metres. ahead: The load's horizontal distance ahead of the centre along the facing, metres; negative behind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanLoad.ts (HumanLoad.lean, props).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanLoad.lean.
 */
export namespace IAutoMovieMotionHumanLoad {
  /**
   * The backward lean that balances a carried load, degrees about the base, positive forward; null when the load's moment exceeds the body's own at a right angle, which no lean balances. Input props of HumanLoad.lean. The body's mass and centre height, and the load's mass and its distance ahead of the centre.
   *
   * @evidence contracts/development/common.md#meaningful-documentation height: The body's centre-of-mass height above its base, metres. ahead: The load's horizontal distance ahead of the centre along the facing, metres; negative behind.
   * @evidence contracts/development/design.md#principled-representation height: The body's centre-of-mass height above its base, metres. ahead: The load's horizontal distance ahead of the centre along the facing, metres; negative behind.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: perform/HumanLoad.ts (HumanLoad.lean, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanLoad.lean.
   */
  export type ILeanProps = {
    /** The body's mass, kilograms. */
    mass: number;

    /** The body's centre-of-mass height above its base, metres. */
    height: number;

    /** The load's mass, kilograms. */
    load: number;

    /** The load's horizontal distance ahead of the centre along the facing, metres; negative behind. */
    ahead: number;
  };
}
