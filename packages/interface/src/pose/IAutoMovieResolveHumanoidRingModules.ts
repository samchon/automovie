import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One rest joint and the segment leaving it. One section of a module. */
export namespace IAutoMovieResolveHumanoidRingModules {
  /** One rest joint and the segment leaving it. */
  export interface IBone {
    /** Joint identity. */ bone: string;
    /** Parent identity, or null at the root. */ parent: string | null;
    /** Rest joint centre, Human frame metres. */ position: readonly [
      number,
      number,
      number,
    ];
    /** Leaf segment endpoint, metres; null when a child ends the segment. */ tip:
      | readonly [number, number, number]
      | null;
    /** Positive girth radius of the segment, metres. */ radius: number;
  }

  /** One section of a module. */
  export interface IRing {
    /** Centre, Human frame metres. */ centre: IAutoMovieVector3;
    /** Half dimension along the module's first in-plane axis, metres. */ depth: number;
    /** Half dimension along its second in-plane axis, metres. */ breadth: number;
    /**
     * The ring's points, counter clockwise about the module axis, Human frame
     * metres.
     */ points: IAutoMovieVector3[];
  }

  /** One rigid module. */
  export interface IModule {
    /** The joint whose segment this module is. */ bone: string;
    /** The direction the rings are stacked along; not a unit. */ axis: IAutoMovieVector3;
    /**
     * The direction of the rings' breadth, or null for the default frame whose
     * depth axis is forward.
     */ breadth: IAutoMovieVector3 | null;
    /** The stacked sections, first to last along the axis. */ rings: IAutoMovieResolveHumanoidRingModules.IRing[];
    /** The point closing the last ring, or null for a flat end. */ pole: IAutoMovieVector3 | null;
  }
}
