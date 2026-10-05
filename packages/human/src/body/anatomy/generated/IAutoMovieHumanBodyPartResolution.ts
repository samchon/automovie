import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import type { IAutoMovieHumanBodyAnatomicalResolution } from "./IAutoMovieHumanBodyAnatomicalResolution";
import type { IAutoMovieHumanBodyGeneratedMaterialPart } from "./IAutoMovieHumanBodyGeneratedMaterialPart";
import type { IAutoMovieHumanBodyGeneratedPart } from "./IAutoMovieHumanBodyGeneratedPart";

/**
 * A named internal part resolved with validation or explicitly unavailable.
 *
 * Distributing over the generated-part union binds `id`, tissue material and
 * successful value together, so a right femur cannot answer as left deltoid.
 * Availability remains per part; absent imaging never silently creates bone.
 * @evidence contracts/common.md#principled-implementation The resolution value is selected by the part's own id, so a part cannot answer with another part's value.
 * @evidence contracts/common.md#clear-and-simple-design One distributive alias over the part ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent imaging never yields a resolved bone.
 * @evidence contracts/common.md#meaningful-documentation States the binding of id, tissue and value.
 * @evidence contracts/modeling.md#part-identity-and-grouping Availability is per named part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The part type owns geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value of its own.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPartResolution<
  Id extends AutoMovieHumanBodyPartId = AutoMovieHumanBodyPartId,
> = Id extends AutoMovieHumanBodyPartId
  ? IAutoMovieHumanBodyAnatomicalResolution<
      Id,
      Extract<
        IAutoMovieHumanBodyGeneratedPart,
        IAutoMovieHumanBodyGeneratedMaterialPart<Id, string>
      >
    >
  : never;
