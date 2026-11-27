import type {
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropSpec,
  IAutoMovieTransform,
} from "@automovie/interface";

import { environmentModel } from "../../internal/environmentModel";

/*
 * Make a placeable environment prop from a model and its declared affordances.
 *
 * The occurrence receives one id for its staged node, model and prop spec. Its
 * anchors expose every model-local affordance under the affordance's own id.
 * Place the occurrence at an ordinary environment point or at another item's
 * named frame, such as a room floor or a table's `stack` affordance. Use
 * `placement` to declare any support or containment relation that needs
 * validation. An imported appearance keeps the model's own proxy geometry and
 * contacts.
 * Parameter props: The model and any existing prop claims, articulation or asset
 * reference.
 * Returns: The environment module that emits the staged prop.
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
