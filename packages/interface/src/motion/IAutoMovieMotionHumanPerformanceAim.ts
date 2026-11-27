import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "./IAutoMovieMotionHumanBody";

/**
 * A target's world point and outward normal at a film second: a person's
 * region, the performer's own, a prop's point, a point of the world or of the
 * performer's frame, or the virtual opponent of no target.
 */
export namespace IAutoMovieMotionHumanPerformanceAim {
  /** The aiming person's own frame, body and bones (`aim`). */
  export interface IFrame {
    /** Their root, world metres. */
    root: IAutoMovieVector3;

    /** Their heading, degrees about +Y. */
    yaw: number;

    /** The heights of a `none` target's lines, world metres. */
    heights: Record<"low" | "middle" | "high", number>;

    /**
     * A `none` target's distance when it names none, metres: the performer's
     * own arm length, upper arm plus forearm plus hand.
     */
    range: number;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;

    /** Their bones. */
    bones: (
      requested?: ReadonlySet<AutoMovieHumanoidBone>,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

    /** Their subject id. */
    subject?: string;
  }
}
