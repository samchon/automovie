import type { IAutoMoviePose } from "../pose/IAutoMoviePose";

/**
 * Background members handed to the instanced population layer: their places as
 * one formation design, and their motion as a cycle of a performed template
 * member's own displayed poses, so a background soldier marches the march the
 * foreground marches.
 *
 * A population is a detail the author declares
 * (`IAutoMovieMotionHumanEnsemble.detail`), never a camera's choice. A
 * population uses steady motion because a population member cannot be synced,
 * cut or reached, so `cycle` refuses a template whose window is not inside one
 * stepping action. `standing` holds a settled stand at every phase. The design
 * lays the formation's blocks for the engine's own `formationSlotPosition`,
 * whose placement with the facing turned about is the formation's
 * (`HumanFormation`), so a population member stands on the slot it would have
 * had as a performer; the performed members are its hero overrides.
 */
export namespace IAutoMovieMotionHumanPopulation {
  /** A template's cycle, the record the render's pose take reads. */
  export interface ICycle {
    /** The take's name. */
    gait: string;

    /**
     * Seconds of one cycle: from a heel strike to the same foot's next, or the
     * placed stand duration for a held standing take.
     */
    periodSeconds: number;

    /** Metres the template's root travels in one cycle, zero for a held stand. */
    strideMeters: number;

    /**
     * The template's canonical poses at phases `i / poses.length`, placed at
     * the origin facing +Z with the travel taken out. A held stand borrows one
     * pose at every phase.
     */
    poses: IAutoMoviePose[];
  }

  /**
   * An ensemble's formation as one formation design: its blocks as the design's
   * blocks (`IAutoMovieFormationBlock`), its frame at a film second as the
   * design's anchor and facing turned about (the engine lays a layout's depth
   * ahead, the formation behind), and every member that is performed as a hero
   * override, so the population layer draws the others. Input props of
   * HumanPopulation.design. The design's id and model group, and the film
   * second its frame is read at.
   */
  export type IDesignProps = {
    /** Identifier assigned to the resulting instanced formation design. */
    id: string;
    /** Model-group identifier used by the population renderer. */
    model: string;
    /** Performance second at which to read the formation frame; defaults to 0. */
    seconds?: number;
  };
}
