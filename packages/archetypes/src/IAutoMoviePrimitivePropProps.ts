import {
  AutoMoviePrimitiveShape,
  IAutoMovieMaterial,
} from "@automovie/interface";

/**
 * Typed input of `createAutoMoviePrimitiveProp`: identity, one primitive shape and the material it wears.
 *
 * The shape union carries exactly the dimensions each primitive reads, so a dimension the shape ignores cannot be written at all; the retired parameter plan had to refuse such keys at runtime.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the interface `AutoMoviePrimitiveShape` discriminated union, so the compiler admits each shape's own dimensions and engine model admission owns their numeric domains.
 * @evidence contracts/common.md#clear-and-simple-design Carries only the id, shape and material the producer writes into its single part; placement and LOD stay with the scene and population that own them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field exists for a particular production or fixture, and no shape is special-cased.
 * @evidence contracts/common.md#meaningful-documentation Members give the id's role, metre units through the shape union, and the material's adoption by reference.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record selects no algorithm; the constant build it feeds is costed on `createAutoMoviePrimitiveProp`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A plain argument record coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the record; the producer keeps only the shape copy and material reference inside the returned model.
 * @author Samchon
 */
export interface IAutoMoviePrimitivePropProps {
  /** Non-blank model id that scene nodes and populations cite. */
  id: string;

  /** Primitive shape with its dimensions in metres; the producer copies it into the single part. */
  shape: AutoMoviePrimitiveShape;

  /** Material the part references; the returned model adopts this record by reference as its only material. */
  material: IAutoMovieMaterial;
}
