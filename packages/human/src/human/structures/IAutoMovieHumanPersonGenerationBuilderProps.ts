import type { IHumanBodyConstructionProgress } from "../../body/structures/IHumanBodyConstructionProgress";
import type { AutoMovieHumanFaceMeasurementReading } from "../../face/structures/AutoMovieHumanFaceMeasurementReading";
import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";
import type { AutoMovieHumanPersonConstructionStage } from "./AutoMovieHumanPersonConstructionStage";
import type { IAutoMovieHumanPersonGeneration } from "./IAutoMovieHumanPersonGeneration";
import type { IHumanPersonHairContactProps } from "./IHumanPersonHairContactProps";

/**
 * What the one-skin person evaluator is compiled from: one source generation
 * with the face producer's optional occlusion bake, final-face measurement
 * observer and pre-cull hair-contact observer.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationBuilderProps {
  /** The source generation, read as one skin with a head/body partition. */
  generation: IAutoMovieHumanPersonGeneration;

  /** The face producer's occlusion bake, or none. */
  occlusion?: IAutoMovieHumanFaceOcclusionOptions;

  /**
   * Receive face measurements from the final validated person model in the
   * canonical head frame, at static-export precision. Omission performs no
   * extra measurement. Failed builds and internal closure-reference builds
   * publish nothing; source qualifications and unknowns remain in the result.
   */
  observeFaceMeasurements?: (
    readings: readonly AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Observe an independently owned frozen snapshot of the actual placed hair
   * and performed body just before hair contact. Omission allocates no
   * snapshot. Contact admission and final validation still run normally, so
   * an observation is not a successful build or a contact-quality verdict.
   */
  observeHairContact?: (snapshot: IHumanPersonHairContactProps) => void;

  /**
   * True also evaluates the face producer's report-only assembly census in
   * `construct`: every unjudged spatial relation and the census of each part.
   * It adds evaluation time and changes no judged relation, failure or
   * acceptance. Omission and false report the judged relations only.
   */
  census?: boolean;

  /**
   * Receive each stage of a construction as it finishes. A construction is
   * one synchronous call, so this is the only progress a caller running it
   * off the main thread can relay. Omission reports nothing; the returned
   * construction and every admission decision are the same either way, and a
   * construction that throws stops reporting.
   */
  observeStage?: (stage: AutoMovieHumanPersonConstructionStage) => void;

  /**
   * Forward the face owner's actual geometry and admission completions with
   * their original document, basis and condition identities. This also
   * identifies constructor bootstrap and normal-reference evaluations by
   * their actual face document. Omission adds no reporting; exceptions from
   * the observer propagate without changing any geometry or admission rule.
   */
  observeFaceConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void;

  /** Forward completed body/source-owner boundaries unchanged, including constructor stages and actual quantity reads; observer failures propagate. */
  observeBodyConstructionProgress?: (
    progress: IHumanBodyConstructionProgress,
  ) => void;
}
