import type { IAutoMovieQuaternion, IAutoMovieTransform } from "@automovie/interface";
import { type AutoMovieArchetype } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";

/** A terminal footprint and positive surface clearance above its local floor. */
export interface IGoal {
  /**
   * Terminal endpoint's lateral coordinate in model space, metres. Defaults
   * to its attachment's sagittal plane.
   */
  x?: number;
  /** Terminal endpoint's forward coordinate in model space, metres. */
  z: number;
  /**
   * Model-space rotation of the terminal's neutral axis. Defaults to its
   * neutral model-space direction.
   */
  orientation?: IAutoMovieQuaternion;
  /** Optional local landing plane. Defaults to the nominal model floor. */
  surface?: AutoMovieArchetypeQuadrupedFooting.ISurface;
  /**
   * Exact terminal solid clearance normal to its support surface, nonnegative
   * metres.
   */
  lift: number;
  /** Relative carpus/hock fold beyond the neutral angle, degrees. */
  fold: number;
  /**
   * The share of a stance's load the hoof bears, 0 to 1
   * (`AutoMovieArchetypeQuadrupedRootRange.IConstraint.load`); one, planted,
   * when absent.
   */
  load?: number;
}

/** One prepared model, reused by independent time samples. */
export interface IPrepared<Id extends string, Dimension extends string> {
  /** Emit all four exact chains under one physically feasible body root. */
  sample: (
    goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
    nod: number,
    preferredRoot: number,
  ) => AutoMovieArchetype<Id, Dimension>;

  /**
   * One contact's model-space frame at the pose `sample` would reach, read
   * from its carrier's chain alone, without solving the limbs or emitting the
   * model; undefined for a contact a limb or a shoulder blade carries, or a
   * grip a held line turns, which only `sample` places.
   */
  frame: (
    goals: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, IGoal>>,
    nod: number,
    preferredRoot: number,
    id: string,
  ) => IAutoMovieTransform | undefined;
}
