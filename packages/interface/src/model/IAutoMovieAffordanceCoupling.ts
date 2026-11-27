/**
 * How a follower's travel is set from its leader's: by a ratio, or by a table
 * of the leader's travel against the follower's.
 *
 * `id` names another articulation of the same model. Each follows chain and
 * each rides chain is acyclic, checked separately: travels are resolved before
 * spatial transforms, so a screw's rotation can drive the slider its handle
 * rides. A `ratio` is any finite number, negative for a follower that turns
 * against its leader; every travel it gives over the leader's range lies in the
 * follower's own range. A `table` lists points with `leader` strictly
 * increasing from the least of its range to the greatest, and `follower`
 * staying within its own range. Each field uses its articulation kind's travel
 * unit; between points the follower's travel is interpolated linearly. A table
 * need not be monotone: a pistol's hammer falls as its slide returns. With
 * `reversible: true`, a state may instead name this
 * follower: the ratio must be nonzero, or the table's outputs strictly
 * monotone, so its leader travel is unique. A state names only one input per
 * coupled degree of freedom; redundant or conflicting inputs are refused.
 * Engine admission enforces the coupling rules.
 */
export type IAutoMovieAffordanceCoupling =
  | {
      /** The leader's affordance id. */
      id: string;

      /** The follower's travel over the leader's, in the units of the two kinds. */
      ratio: number;

      /** A ratio is not a table. */
      table?: never;

      /**
       * Permits the state to name this follower and derive its leader by
       * division; requires a nonzero ratio. Absent or false, only the leader
       * can be driven.
       */
      reversible?: boolean;
    }
  | {
      /** The leader's affordance id. */
      id: string;

      /**
       * Travel points with `leader` strictly increasing over its whole range;
       * each value uses its articulation kind's travel unit.
       */
      table: IAutoMovieAffordanceCoupling.IPoint[];

      /** A table is not a ratio. */
      ratio?: never;

      /**
       * Permits the state to name this follower and invert the table; requires
       * strictly increasing or strictly decreasing outputs. Absent or false,
       * only the leader can be driven.
       */
      reversible?: boolean;
    };

export namespace IAutoMovieAffordanceCoupling {
  /** One leader and follower travel point in their respective kind units. */
  export interface IPoint {
    /** Travel of the leader articulation, in its kind's unit. */
    leader: number;

    /** Travel of the follower articulation, in its kind's unit. */
    follower: number;
  }
}
