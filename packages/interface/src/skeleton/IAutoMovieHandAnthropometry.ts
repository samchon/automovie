/** Data and callback contracts shared by the HandAnthropometry operations. */
export namespace IAutoMovieHandAnthropometry {
  /**
   * One joint's caliper breadth and tape girth, mm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's measure and unit.
   * @evidence contracts/development/design.md#principled-representation The paper's two measures of one joint, in its millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two figures a digit's or an object's reader takes, owned by the table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No optional member, so every joint states both.
   */
  export interface IJoint {
    /** Breadth across the joint, mm. */
    breadth: number;

    /** Circumference round the joint, mm. */
    girth: number;
  }
}
