import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModel,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { placeEnvironmentSpace } from "./placeEnvironmentSpace";
import { requireEnvironmentFrame } from "./requireEnvironmentFrame";

/**
 * Offer a supplied model as a reusable environment module.
 *
 * @param input Model and optional locally authored anchors, support and prop
 *   facts.
 * @returns A definition that places those records in the scope and frame
 *   assigned by the composer.
 */
export function environmentModel(
  input: IAutoMovieEnvironmentModel,
): IAutoMovieEnvironmentModule {
  return ({
    id,
    frame,
  }: IAutoMovieEnvironmentModule.IContext): IAutoMovieEnvironmentContribution => {
    const model: IAutoMovieModel = { ...input.model, id };
    const anchors: Array<readonly [string, IAutoMovieTransform]> = [];
    for (const [name, local] of Object.entries(input.anchors ?? {})) {
      requireEnvironmentFrame(local, `${id}.anchors[${JSON.stringify(name)}]`);
      anchors.push([name, AutoMovieArchetypeFrame.compose(frame, local)]);
    }
    return {
      models: [model],
      set: [
        {
          node: id,
          model: id,
          position: frame.translation,
          rotation: frame.rotation,
        },
      ],
      ...(anchors.length !== 0 ? { anchors: Object.fromEntries(anchors) } : {}),
      ...(input.space !== undefined
        ? { spaces: [placeEnvironmentSpace(id, input.space, frame)] }
        : {}),
      ...(input.prop !== undefined
        ? { props: [{ ...input.prop, node: id, model }] }
        : {}),
    };
  };
}
