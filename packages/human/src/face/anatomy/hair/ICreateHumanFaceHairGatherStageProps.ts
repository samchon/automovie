import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

/**
 * Current lock geometry and compiled gather direction passed to its tie stage.
 * An ungathered layer omits anchor and gatherDirection; a gathered layer needs
 * both actual resolved values, which the stage admits together before walking.
 *
 * @evidence contracts/common.md#principled-implementation Neutral field reference and current root geometry remain distinct; paired optional gather results retain ungathered-layer compatibility while the stage checks gathered completeness.
 * @evidence contracts/common.md#clear-and-simple-design The hair grower supplies one per-lock stage input containing the layer and its already compiled gather direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing gathered inputs retain their existing refusal rather than receiving replacement points or directions.
 * @evidence contracts/common.md#meaningful-documentation Describes the neutral/current distinction and optional-state ownership before the tie transition.
 * @evidence contracts/modeling.md#spatial-conventions Reference is neutral chart geometry; root and anchor are current head-frame metres, and the gather direction reads current head-frame points.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry for an existing scalp and hair population without assigning a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Internal compiler state preserves the hairstyle document's controls and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The resolver, graph or closure producer owns derived geometry; this record carries its inputs or result.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source admission and hair-contact construction own topology; this record changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns the displayed assembly; this numerical carrier supplies no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns source qualification; this carrier introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hairstyle admission retains numerical controls and bounds; this record adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source and derived geometry are not personal authoring fields.
 * @author Samchon
 */
export interface ICreateHumanFaceHairGatherStageProps {
  /** Existing numerical hairstyle layer. */
  layer: IAutoMovieHumanFaceHair.Layer;

  /** Neutral chart position of the root, the frame the fields are read in. */
  reference: IAutoMovieVector3;

  /** Posed root the lock grows from, in head-frame metres. */
  root: IAutoMovieVector3;

  /** Deterministic source-root sequence identity. */
  sequence: number;

  /** Resolved current scalp tie in head-frame metres, when gathered. */
  anchor?: IAutoMovieVector3;

  /**
   * Compiled current scalp direction field, when gathered.
   * Its owning graph resolver returns the tangent toward the tie and retains
   * its undefined-direction refusal; this callback adds no authoring point.
   *
   * @evidence contracts/common.md#principled-implementation The gather stage reads the already compiled current scalp field at its actual integrated station; createHumanFaceHairGatherField owns its graph-distance and tangent calculation.
   * @evidence contracts/common.md#clear-and-simple-design One supplied direction reader separates the compiled scalp graph from the per-lock tie state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A gathered stage needs its actual field and anchor; missing inputs retain the existing refusal rather than a substitute direction.
   * @evidence contracts/common.md#meaningful-documentation States the current-station input and the graph owner's output and refusal responsibility.
   * @evidence contracts/modeling.md#spatial-conventions Input is current head-frame metres and output is a dimensionless tangent direction in that same frame.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads a field for an existing lock and creates no part identity.
   * @evidenceExclude contracts/modeling.md#parameter-channels The station is derived by the integrator; this reader adds no hairstyle input.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Returns a direction without emitting a station or mesh.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The source graph and contact owners retain geometry and incidence; this callback only reads their field.
   * @evidenceExclude contracts/modeling.md#rendered-observation The assembled hair builder owns displayed output; a direction callback supplies no observed frame.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The supplied field is numerical styling and carries no acquired anatomical value.
   * @evidenceExclude contracts/anatomy.md#permitted-range The hairstyle and source owners admit the field; this reader introduces no physiological bound.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Current stations are internal derived geometry, not personal authored points or curves.
   */
  gatherDirection?: (point: IAutoMovieVector3) => IAutoMovieVector3;
}
