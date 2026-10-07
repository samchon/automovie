import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import type { IHumanSourceCrownDimension } from "./IHumanSourceCrownDimension.ts";
import type { IHumanSourceCrownAffineFrame } from "./IHumanSourceCrownAffineFrame.ts";
import type { IHumanSourceCrownTopology } from "./IHumanSourceCrownTopology.ts";

/**
 * Immutable native crown frames for one coupled source occlusion search.
 *
 * @author Samchon
 */
export interface IHumanSourcePosteriorOcclusionProblem {
  /** Original source registrations and closed collider topology. */
  face: IAutoMovieHumanFaceBasis;

  /** Component, closure and edge incidence frozen before this search. */
  crownTopology: IHumanSourceCrownTopology[];

  /** Original head-frame dental positions, metres. */
  originalPositions: number[];

  /** Positions after the one rigid mandibular translation, metres. */
  basePositions: number[];

  /** U1..U8 and L1..L8, each width/depth/height; paired sides share source scales. */
  parameters: string[];

  /** Actual source crown dimensions used to define every rooted axis. */
  dimensions: IHumanSourceCrownDimension[];
  /** Complete immutable native geometric axis and port registration. */
  frames: IHumanSourceCrownAffineFrame[];

  /** Frozen upper arch's maxillary-to-mandibular unit direction. */
  direction: number[];

  /** Frozen upper arch's anterior unit direction. */
  forward: number[];

  /** One rigid displacement applied to every jaw-owned dental vertex, metres. */
  mandibularTranslationMetres: number[];

  /** Actual jaw-owned source vertex ordinals. */
  mandibularVertices: number[];

  /** Authored target incisor overlap and overjet, metres. */
  overbiteTargetMetres: number;

  /** See `overbiteTargetMetres`. */
  overjetTargetMetres: number;
}
