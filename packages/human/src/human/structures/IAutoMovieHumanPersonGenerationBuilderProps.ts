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
 * @evidence contracts/common.md#principled-implementation The source generation defines evaluation; optional observers consume the actual states at their declared stages without replacing geometry.
 * @evidence contracts/common.md#clear-and-simple-design One generation, one optional bake, one optional census switch and independent optional observers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document value or tolerance is carried.
 * @evidence contracts/common.md#meaningful-documentation States each option's stage, omission and failure effects.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The props define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The props are not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The props emit no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The generation states its own frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The generation owns the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The props are not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The props carry no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The props admit no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The props do not shape a person.
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
   *
   * @evidence contracts/common.md#principled-implementation The callback receives the registry's readings from the same final model the builder returns.
   * @evidence contracts/common.md#clear-and-simple-design One optional post-validation observer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The observer cannot replace geometry, source registration or a measurement result.
   * @evidence contracts/common.md#meaningful-documentation States precision, omission, publication stage and failure semantics.
   * @evidence contracts/modeling.md#spatial-conventions Each registry quantity retains its explicit unit and canonical head-frame definition.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no anatomical part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback changes no authored value.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator owns emission.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator owns source-shared skin.
   * @evidenceExclude contracts/modeling.md#rendered-observation Consumers observe the returned final model.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Registry owners retain all protocols and qualifications.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no anatomical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback introduces no authoring channel.
   */
  observeFaceMeasurements?: (
    readings: readonly AutoMovieHumanFaceMeasurementReading[],
  ) => void;

  /**
   * Observe an independently owned frozen snapshot of the actual placed hair
   * and performed body just before hair contact. Omission allocates no
   * snapshot. Contact admission and final validation still run normally, so
   * an observation is not a successful build or a contact-quality verdict.
   *
   * @evidence contracts/common.md#principled-implementation The clear stage copies and freezes its actual input rather than letting an observer replace or mutate geometry.
   * @evidence contracts/common.md#clear-and-simple-design One optional pre-contact observer reuses the existing consumer boundary.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Observation preserves signed-query admission, document range and requested clearance.
   * @evidence contracts/common.md#meaningful-documentation States immutability, omitted cost, publication stage and the difference from build success.
   * @evidence contracts/modeling.md#spatial-conventions Snapshot coordinates and clearance are in the shared person metre frame.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The body and hair producers own parts.
   * @evidenceExclude contracts/modeling.md#parameter-channels The observer changes no authoring input.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Producers own emitted populations.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The contact consumer owns clearance.
   * @evidenceExclude contracts/modeling.md#rendered-observation Numerical snapshots establish no appearance judgment.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Producers retain biological meaning and source qualifications.
   * @evidenceExclude contracts/anatomy.md#permitted-range Observation admits no anatomical range.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback introduces no numerical authoring channel.
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
