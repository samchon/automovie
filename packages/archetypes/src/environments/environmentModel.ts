import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModel,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core/AutoMovieArchetypeFrame";
import { placeEnvironmentSpace } from "./placeEnvironmentSpace";
import { requireEnvironmentFrame } from "./requireEnvironmentFrame";

/**
 * Offer a supplied model as a reusable environment module.
 *
 * @param input Model and optional locally authored anchors, support and prop facts.
 * @returns A definition that places those records in the scope and frame assigned by the composer.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Each occurrence supplies one model sharing its original geometry but carrying the scoped id. Staging and any live prop cite that same model. Rigid world anchors and optional support derive from the same input frame.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This bridge owns model identity and stage or prop publication. The support placer owns geometry and height conversion, and AutoMovieArchetypeFrame owns rigid frame composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Absent supports and anchors remain absent. Authored mesh bytes and imported provenance remain with their owner. Admission is explicit for custom support and each rigid anchor.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every instance places each supplied anchor once and copies the model header without traversing its geometry. Support placement carries its own validation and ring and height conversion costs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The definition reuses the supplied local model and authored records. Scoped results are built from the current local records for every occurrence, with no cache across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The definition retains the input recipe for its lifetime. Its returned records retain supplied geometry by reference and no host handle, file or task is created.
 * @evidence contracts/development/common.md#meaningful-documentation States per-occurrence identity, the frame, optional claims and reference ownership.
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
