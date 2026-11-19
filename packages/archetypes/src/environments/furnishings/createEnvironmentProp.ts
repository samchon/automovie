import type {
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropSpec,
  IAutoMovieTransform,
} from "@automovie/interface";

import { environmentModel } from "../environmentModel";

/**
 * Make a placeable environment prop from a model and its declared affordances.
 *
 * The occurrence receives one id for its staged node, model and prop spec. Its
 * anchors expose every model-local affordance under the affordance's own id.
 * Place the occurrence at an ordinary environment point or at another item's
 * named frame, such as a room floor or a table's `stack` affordance. Use
 * `placement` to declare any support or containment relation that needs
 * validation. An imported appearance keeps the model's own proxy geometry and
 * contacts.
 *
 * @param props The model and any existing prop claims, articulation or asset reference.
 * @returns The environment module that emits the staged prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared occurrence identity, named anchors, ordinary placement and optional relation, articulation and appearance semantics.
 * @evidence contracts/development/implementation.md#principled-implementation The affordance frames authored on the rigid model are the only source of contact orientation. The shared model adapter places them with the same instance transform as the staged node and carries the existing prop specification.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Collects only the semantic anchors and delegates generic staging to environmentModel and relation admission to the environment's normal prop validator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bounding-box contact is inferred for a model without affordances, and an unclaimed support is an attachment position without a bearing assertion. An omitted articulation gives a rigid prop spec, preserving any authored rest affordance frames.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reads the model's declared affordances once and uses one entry per affordance. Preparing and emitting the model otherwise follows the common environmentModel path.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The definition captures the model and the derived anchor entries once for all its occurrences. Instance ids, placement and contact transforms are computed per occurrence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned definition retains only its model, prop claims and an anchor map bounded by the model's affordance count. It owns no external resources.
 */
export function createEnvironmentProp(
  props: Readonly<
    Pick<IAutoMoviePropSpec, "model" | "placement" | "modelRef"> &
      Partial<Pick<IAutoMoviePropSpec, "articulation">>
  >,
): IAutoMovieEnvironmentModule {
  const model: IAutoMovieModel = props.model;
  const anchors: Record<string, IAutoMovieTransform> = Object.fromEntries(
    (model.affordances ?? []).map(({ id, frame }) => [id, frame]),
  );
  return environmentModel({
    model,
    anchors,
    prop: {
      articulation: props.articulation ?? null,
      ...(props.placement === undefined ? {} : { placement: props.placement }),
      ...(props.modelRef === undefined ? {} : { modelRef: props.modelRef }),
    },
  });
}
