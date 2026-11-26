import { type IAutoMovieEnvironmentModule, type IAutoMoviePropSpec } from "@automovie/interface";
import { createEnvironmentProp as createEnvironmentPropImplementation } from "./furnishings/internal/createEnvironmentProp";

/** Public operations for Auto Movie Environment Furnishing. */
export namespace AutoMovieEnvironmentFurnishing {
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
   * @param props The model and any existing prop claims, articulation or asset
   *   reference.
   * @returns The environment module that emits the staged prop.
   */
  export function prop(props: Readonly<
    Pick<IAutoMoviePropSpec, "model" | "placement" | "modelRef"> &
      Partial<Pick<IAutoMoviePropSpec, "articulation">>
  >): IAutoMovieEnvironmentModule {
    return createEnvironmentPropImplementation(props);
  }
}
