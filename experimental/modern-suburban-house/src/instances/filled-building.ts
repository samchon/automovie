/** Attach authored opening models to the built environment they actually fill. */
import {
  validateBuiltEnvironment,
  type IAutoMovieMeshTransform,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
} from "@automovie/interface";

type Prototype = { model: IAutoMovieModel };
type Placement = { id: string; modelId: string; transform: IAutoMovieMeshTransform };

/** Turn placed models into fill elements and retain open passages as open cuts. */
export class FilledBuilding {
  public build(
    environment: IAutoMovieBuiltEnvironment,
    prototypes: readonly Prototype[],
    placements: readonly Placement[],
  ): IAutoMovieBuiltEnvironment {
    const models = new Map(
      prototypes.map((entry) => [entry.model.id, entry.model]),
    );
    if (models.size !== prototypes.length)
      throw new Error("duplicate building prototype id");
    const fills = new Map<string, Placement>();
    for (const placement of placements) {
      if (!models.has(placement.modelId))
        throw new Error(`unknown placed model ${placement.modelId}`);
      if (fills.has(placement.id))
        throw new Error(`duplicate building placement ${placement.id}`);
      fills.set(placement.id, placement);
    }
    const openings = environment.openings.map((opening) => {
      const placed = fills.get(`fill:${opening.id}`);
      const storageOpening = environment.boundaries.find(boundary=>boundary.id===opening.boundary)?.spaces.some(
        id=>environment.spaces.some(space=>space.id===id&&space.kind==="storage"),
      )??false;
      if (opening.kind === "door" || opening.kind === "window" || storageOpening) {
        if (placed === undefined)
          throw new Error(`unfilled building opening ${opening.id}`);
        return { ...opening, fill: placed.id };
      }
      if (placed !== undefined || opening.fill !== null)
        throw new Error(`open cut has a filling ${opening.id}`);
      return opening;
    });
    const input: IAutoMovieBuiltEnvironment = {
      ...environment,
      models: [...environment.models, ...prototypes.map((entry) => entry.model)],
      elements: [
        ...environment.elements,
        ...placements.map((placement) => ({
          id: placement.id,
          kind: "building-fill",
          parent: "house-root",
          model: placement.modelId,
          space: "house",
          transform: {
            translation: placement.transform.translation ?? { x: 0, y: 0, z: 0 },
            rotation: placement.transform.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
            scale: placement.transform.scale ?? { x: 1, y: 1, z: 1 },
          },
        })),
      ],
      openings,
    };
    const validation = validateBuiltEnvironment({ environment: input });
    if (!validation.success)
      throw new Error(
        `filled building is invalid: ${validation.violations.slice(0, 12).map((v) => `${v.path}: ${v.expected}`).join("; ")}`,
      );
    return input;
  }
}
