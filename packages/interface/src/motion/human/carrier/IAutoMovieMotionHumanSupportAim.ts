import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An aim kept on a world target from a moving support, every second.
 *
 * A carried plan (`HumanSupportCarry`) keeps its goals on the support, so a
 * line aimed at the start turns and moves with the support while the target
 * stays in the world. The aim re-takes that line at each second: the line from
 * the carried pivot (the eye, the cheek) to the target against the carried
 * line, its turn about the vertical and its rise. The arms' goals turn by the
 * whole turn about the vertical through the root, and the trunk follows them as
 * far as the chest's and the lumbar spine's axial ranges hold
 * (`DEFAULT_HUMANOID_ROM`); the rest is the arms'. The rise goes to the arms'
 * goals alone, turned about the horizontal axis through the pivot square to the
 * line. An aim whose arms would present the line further off the trunk's facing
 * than `arms` at some frame of the act is refused when the act is planned: the
 * performer, or the support, turns first.
 */
export namespace IAutoMovieMotionHumanSupportAim {
  /** A line kept on a world target. */
  export interface IAim {
    /** The target, world metres; it stays in the world. */
    target: IAutoMovieVector3;

    /**
     * Where the line was planned from at the start (the eye, the cheek), world
     * metres; it rides the support.
     */
    pivot: IAutoMovieVector3;

    /**
     * How far the arms present the line off the trunk's facing to either side,
     * degrees: what the trunk's twist cannot take of the line's turn they take
     * up to this.
     */
    arms: number;
  }
}
