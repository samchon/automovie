/**
 * What a placement relation points at.
 *
 * Every arm cites an existing stable id rather than restating geometry: the
 * building graph owns spaces, elements, boundaries, openings, and support
 * patches, and a prop spec owns its affordances.
 *
 * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-target-refusal Exposes `IAutoMoviePropRelationTarget` as the portable data boundary for the camera target refusal requirement.
 * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-diagnostics-refusal Types `IAutoMoviePropRelationTarget` for the clv focus diagnostics refusal system contract.
 * @author Samchon
 */
export type IAutoMoviePropRelationTarget =
  | IAutoMoviePropRelationTarget.ISpace
  | IAutoMoviePropRelationTarget.IElement
  | IAutoMoviePropRelationTarget.IBoundary
  | IAutoMoviePropRelationTarget.IOpening
  | IAutoMoviePropRelationTarget.ISurface
  | IAutoMoviePropRelationTarget.IPropAffordance;
export namespace IAutoMoviePropRelationTarget {
  /**
   * A logical space of a built environment.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `ISpace` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `ISpace` for the clv focus intent appearance boundary system contract.
   */
  export interface ISpace {
    /**
     * Discriminator.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `kind` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
     */
    kind: "space";
    /**
     * Built environment id.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `environment` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `environment` for the clv focus intent appearance boundary system contract.
     */
    environment: string;
    /**
     * Logical space id inside that environment.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `space` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `space` for the clv focus intent appearance boundary system contract.
     */
    space: string;
  }

  /**
   * A visible or grouping element of a built environment.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `IElement` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IElement` for the clv focus intent appearance boundary system contract.
   */
  export interface IElement {
    /**
     * Discriminator.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `kind` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
     */
    kind: "element";
    /**
     * Built environment id.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `environment` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `environment` for the clv focus intent appearance boundary system contract.
     */
    environment: string;
    /**
     * Element id inside that environment.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `element` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `element` for the clv focus intent appearance boundary system contract.
     */
    element: string;
  }

  /**
   * A separation between spaces, such as a wall, floor, or ceiling.
   *
   * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `IBoundary` as the portable data boundary for the story dialogue voice text separation requirement.
   * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `IBoundary` for the narrative intent dialogue voice text boundary system contract.
   */
  export interface IBoundary {
    /**
     * Discriminator.
     *
     * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `kind` as the portable data boundary for the story dialogue voice text separation requirement.
     * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `kind` for the narrative intent dialogue voice text boundary system contract.
     */
    kind: "boundary";
    /**
     * Built environment id.
     *
     * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `environment` as the portable data boundary for the story dialogue voice text separation requirement.
     * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `environment` for the narrative intent dialogue voice text boundary system contract.
     */
    environment: string;
    /**
     * Boundary id inside that environment.
     *
     * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-voice-text-separation Exposes `boundary` as the portable data boundary for the story dialogue voice text separation requirement.
     * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-dialogue-voice-text-boundary Types `boundary` for the narrative intent dialogue voice text boundary system contract.
     */
    boundary: string;
  }

  /**
   * A passage cut through a boundary.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `IOpening` as the portable data boundary for the camera depth of field boundary requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `IOpening` for the clv focus intent appearance boundary system contract.
   */
  export interface IOpening {
    /**
     * Discriminator.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `kind` as the portable data boundary for the camera depth of field boundary requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
     */
    kind: "opening";
    /**
     * Built environment id.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `environment` as the portable data boundary for the camera depth of field boundary requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `environment` for the clv focus intent appearance boundary system contract.
     */
    environment: string;
    /**
     * Opening id inside that environment.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-depth-of-field-boundary Exposes `opening` as the portable data boundary for the camera depth of field boundary requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `opening` for the clv focus intent appearance boundary system contract.
     */
    opening: string;
  }

  /**
   * A support patch assigned to a logical space.
   *
   * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `ISurface` as the portable data boundary for the camera focus distance requirement.
   * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `ISurface` for the clv focus intent appearance boundary system contract.
   */
  export interface ISurface {
    /**
     * Discriminator.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `kind` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `kind` for the clv focus intent appearance boundary system contract.
     */
    kind: "surface";
    /**
     * Built environment id.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `environment` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `environment` for the clv focus intent appearance boundary system contract.
     */
    environment: string;
    /**
     * Support surface id inside that environment.
     *
     * @evidence requirements/camera/targets-focus-and-depth-boundary.md#camera-focus-distance Exposes `surface` as the portable data boundary for the camera focus distance requirement.
     * @evidence specifications/camera-light-and-visibility/target-focus-exposure-and-sampling.md#clv-focus-intent-appearance-boundary Types `surface` for the clv focus intent appearance boundary system contract.
     */
    surface: string;
  }

  /**
   * A contact point declared by another prop's model.
   *
   * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-contact-contract Exposes `IPropAffordance` as the portable data boundary for the staging interaction contact contract requirement.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `IPropAffordance` for the performance interaction attachment object handoff system contract.
   */
  export interface IPropAffordance {
    /**
     * Discriminator.
     *
     * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-contact-contract Exposes `kind` as the portable data boundary for the staging interaction contact contract requirement.
     * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `kind` for the performance interaction attachment object handoff system contract.
     */
    kind: "prop-affordance";
    /**
     * Scene node id of the supporting or hosting prop.
     *
     * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-contact-contract Exposes `prop` as the portable data boundary for the staging interaction contact contract requirement.
     * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `prop` for the performance interaction attachment object handoff system contract.
     */
    prop: string;
    /**
     * Affordance id declared by that prop's model.
     *
     * @evidence requirements/staging/interactions-and-choreography.md#staging-interaction-contact-contract Exposes `affordance` as the portable data boundary for the staging interaction contact contract requirement.
     * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-interaction-attachment-object-handoff Types `affordance` for the performance interaction attachment object handoff system contract.
     */
    affordance: string;
  }
}
