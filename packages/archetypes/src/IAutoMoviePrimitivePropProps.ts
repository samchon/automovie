import {
  AutoMoviePrimitiveShape,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Typed input of `createAutoMoviePrimitiveProp`: identity, one primitive shape and the material it wears.
 *
 * The shape union carries exactly the dimensions each primitive reads, so a dimension the shape ignores cannot be written at all; the retired parameter plan had to refuse such keys at runtime.
 *
 * @evidence contracts/development/design.md#principled-representation Reuses the interface `AutoMoviePrimitiveShape` discriminated union, so the compiler admits each shape's own dimensions and engine model admission owns their numeric domains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the id, shape and material the producer writes into its single part; placement and LOD stay with the scene and population that own them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No field exists for a particular production or fixture, and no shape is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation Members give the id's role, metre units through the shape union, and the material's adoption by reference.
 */
export interface IAutoMoviePrimitivePropProps {
  /** Non-blank model id that scene nodes and populations cite. */
  id: string;

  /** Primitive shape with its dimensions in metres; the producer copies it into the single part. */
  shape: AutoMoviePrimitiveShape;

  /** Material the part references; the returned model adopts this record by reference as its only material. */
  material: IAutoMovieMaterial;
}
