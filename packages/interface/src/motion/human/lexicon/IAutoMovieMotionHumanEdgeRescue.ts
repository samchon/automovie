/**
 * The cliffhanger rescue: one person hangs from a named ledge's lip and
 * loses the grip; the other, braced prone at the lip, catches the falling
 * wrist in a mutual grip and hauls them up and over onto the top, both
 * ending kneeling above the edge. A missed catch lets the faller fall on to
 * the ground. Both roles perform the `edgeRescue` law with the same
 * scene; `HumanEdgeRescue.edgeRescue` casts them.
 *
 * The ledge's frame has `+X` along the edge, `+Y` up and `+Z` out over the
 * drop. A partner heavier than the rescuer's braced supports can hold over
 * the lip, or a reach over the lip that leaves the rescuer's centre of mass
 * too close behind it, is refused with the load or the margin named.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the roles, the scene, the frame convention and the refusals.
 * @evidence contracts/development/design.md#principled-representation One scene record both roles read, with the role and the partner named per performer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One registered law and its mutual record; planEdgeRescue in motions is the only consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lip comes from the ledge; the loads from both bodies.
 */
export namespace IAutoMovieMotionHumanEdgeRescue {
  /**
   * A role in the rescue.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both roles.
   * @evidence contracts/development/design.md#principled-representation A closed choice.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the law dispatches on.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Declared here directly.
   */
  export type Role = "rescuer" | "faller";

  /**
   * The scene both roles share.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, unit and default.
   * @evidence contracts/development/design.md#principled-representation The ledge, where along it, how long the faller hangs, how far the rescuer reaches over and whether the catch holds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields the planners read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The lip's place comes from the ledge.
   */
  export interface IScene {
    /** Subject of the roof, cliff or wall whose edge it is. */
    ledge: string;

    /** Id of its `ledge` affordance. */
    edge: string;

    /** Metres along the edge from the affordance's frame; 0 when absent. */
    along?: number;

    /** Seconds the faller hangs before the grip goes; 1.2 when absent. */
    hold?: number;

    /** How far the rescuer's shoulder reaches out past the lip, metres; 0.1 when absent. */
    reach?: number;

    /** Whether the catch holds; `caught` when absent. */
    outcome?: "caught" | "missed";
  }

  /**
   * Parameters: the scene, this performer's role and the partner.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; planEdgeRescue owns the load and margin refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the members and the admission owners.
   * @evidence contracts/development/design.md#principled-representation The shared scene with the role and the partner's subject.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The fields planEdgeRescue reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner's body is read from the performance.
   */
  export interface IParams extends IScene {
    /** This performer's role. */
    role: Role;

    /** The other performer's subject. */
    partner: string;
  }
}
