/**
 * The cliffhanger rescue: one person hangs from a named ledge's lip and loses
 * the grip; the other, braced prone at the lip, catches the falling wrist in a
 * mutual grip and hauls them up and over onto the top, both ending kneeling
 * above the edge. A missed catch lets the faller fall on to the ground. Both
 * roles perform the `edgeRescue` law with the same scene;
 * `HumanEdgeRescue.edgeRescue` casts them.
 *
 * The ledge's frame has `+X` along the edge, `+Y` up and `+Z` out over the
 * drop. A partner heavier than the rescuer's braced supports can hold over the
 * lip, or a reach over the lip that leaves the rescuer's centre of mass too
 * close behind it, is refused with the load or the margin named.
 */
export namespace IAutoMovieMotionHumanEdgeRescue {
  /** A role in the rescue. */
  export type Role = "rescuer" | "faller";

  /** The scene both roles share. */
  export interface IScene {
    /** Subject of the roof, cliff or wall whose edge it is. */
    ledge: string;

    /** Id of its `ledge` affordance. */
    edge: string;

    /** Metres along the edge from the affordance's frame; 0 when absent. */
    along?: number;

    /** Seconds the faller hangs before the grip goes; 1.2 when absent. */
    hold?: number;

    /**
     * How far the rescuer's shoulder reaches out past the lip, metres; 0.1 when
     * absent.
     */
    reach?: number;

    /** Whether the catch holds; `caught` when absent. */
    outcome?: "caught" | "missed";
  }

  /** Parameters: the scene, this performer's role and the partner. */
  export interface IParams extends IScene {
    /** This performer's role. */
    role: Role;

    /** The other performer's subject. */
    partner: string;
  }
}
