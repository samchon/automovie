import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";

/**
 * Background members handed to the instanced population layer: their
 * places as one formation design, and their motion as a cycle of a
 * performed template member's own displayed poses, so a background soldier
 * marches the march the foreground marches.
 *
 * A population is a detail the author declares (`IAutoMovieMotionHumanEnsemble.detail`),
 * never a camera's choice. A population uses steady motion because a
 * population member cannot be synced, cut or reached, so `cycle` refuses a
 * template whose window is not inside one stepping action. `standing` holds
 * a settled stand at every phase. The design lays
 * the formation's blocks for the engine's own `formationSlotPosition`, whose
 * placement with the facing turned about is the formation's
 * (`HumanFormation`), so a population member stands on the slot it would
 * have had as a performer; the performed members are its hero overrides.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the repeating stride and held stand takes, their time and travel units, and the enclosing formation placement.
 * @evidence contracts/development/design.md#principled-representation One sampled pose-take representation carries either a stepping cycle with stride distance or a held stand with zero stride.
 * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPopulation.design owns formation placement. HumanPopulation.cycle and HumanPopulation.standing return ICycle for the same pose-table consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMoviePose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPopulation {
  /**
   * A template's cycle, the record the render's pose take reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the period and travel of a stepping or held standing take and the pose frame and phases.
   * @evidence contracts/development/design.md#principled-representation Consistent evenly spaced phases let the consumer use one stride, period and sequence of canonical poses for either take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface HumanPopulation.cycle and HumanPopulation.standing return the same record for the population's pose-table consumer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMoviePose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICycle {
    /** The take's name. */
    gait: string;

    /** Seconds of one cycle: from a heel strike to the same foot's next, or the placed stand duration for a held standing take. */
    periodSeconds: number;

    /** Metres the template's root travels in one cycle, zero for a held stand. */
    strideMeters: number;

    /** The template's canonical poses at phases `i / poses.length`, placed at the origin facing +Z with the travel taken out. A held stand borrows one pose at every phase. */
    poses: IAutoMoviePose[];
  }

  /**
   * An ensemble's formation as one formation design: its blocks as the design's blocks (`IAutoMovieFormationBlock`), its frame at a film second as the design's anchor and facing turned about (the engine lays a layout's depth ahead, the formation behind), and every member that is performed as a hero override, so the population layer draws the others. Input props of HumanPopulation.design. The design's id and model group, and the film second its frame is read at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation id: Identifier assigned to the resulting instanced formation design. model: Model-group identifier used by the population renderer. seconds: Performance second at which to read the formation frame; defaults to 0.
   * @evidence contracts/development/design.md#principled-representation id: Identifier assigned to the resulting instanced formation design. model: Model-group identifier used by the population renderer. seconds: Performance second at which to read the formation frame; defaults to 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanPopulation.ts (HumanPopulation.design, props).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanPopulation.design.
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
