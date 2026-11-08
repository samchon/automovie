/**
 * What a planting is carried by.
 *
 * Every arm cites an existing stable id of the built environment rather than restating geometry: the building graph owns spaces, elements, boundaries and support patches. The binding validator resolves these references; this record does not itself reposition a planting when support geometry changes.
 *
 * @evidence contracts/development/design.md#principled-representation validatePlantingInstallations resolves the support id in the corresponding environment collection; separate placement/canopy checks use the installation's logical room volume, not the support shape or a derived load-bearing contact.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Each arm carries one stable reference instead of copying an architecture shape into planting authoring.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing support is a binding violation, not a fabricated floor or an automatic relocation.
 * @evidence contracts/development/common.md#meaningful-documentation Arm comments identify the referenced collection and the separation between dependency resolution and geometry placement.
 */
export type IAutoMoviePlantingSupport =
  | IAutoMoviePlantingSupport.ISurface
  | IAutoMoviePlantingSupport.IElement
  | IAutoMoviePlantingSupport.IBoundary;
export namespace IAutoMoviePlantingSupport {
  /**
   * Support patch assigned to a logical space.
   *
   * @evidence contracts/development/design.md#principled-representation validatePlantingInstallations checks this id against the environment's surface ids; room containment is checked separately against the logical space rather than this support patch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A literal kind selects one surface id without duplicating patch coordinates.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Resolution does not substitute an arbitrary patch when the cited surface is absent.
   * @evidence contracts/development/common.md#meaningful-documentation The reference is an environment support-patch identity, not a material or a scene node.
   */
  export interface ISurface {
    /** Discriminator. */
    kind: "surface";

    /** Support-patch id inside the owning environment. */
    surface: string;
  }

  /**
   * Visible environment element carrying the planting.
   *
   * @evidence contracts/development/design.md#principled-representation validatePlantingInstallations checks this id against environment elements; it does not derive member positions or a load-bearing contact from the element bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One element id preserves ownership of the shape in the building graph.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reference does not synthesize planter geometry or prove contact with the support; only identity membership is checked here.
   * @evidence contracts/development/common.md#meaningful-documentation The element field names the environment-local reference; planting geometry remains in its independent recipe.
   */
  export interface IElement {
    /** Discriminator. */
    kind: "element";

    /** Element id inside the owning environment. */
    element: string;
  }

  /**
   * Environment boundary the planting is trained against.
   *
   * @evidence contracts/development/design.md#principled-representation The boundary arm resolves a separation in the owning environment rather than treating its id as a scene transform.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A boundary reference keeps separation geometry in the architecture owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Naming a boundary does not create a wall or imply the plant conforms to its entire surface.
   * @evidence contracts/development/common.md#meaningful-documentation The discriminator and boundary member distinguish this support from surfaces and visible elements.
   */
  export interface IBoundary {
    /** Discriminator. */
    kind: "boundary";

    /** Boundary id inside the owning environment. */
    boundary: string;
  }
}
