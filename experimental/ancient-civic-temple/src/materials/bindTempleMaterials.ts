import type { IAutoMovieBuiltEnvironment } from "@automovie/interface";
import { templeModelFinish } from "./templeModelFinish";
import { templeSpaceFinish } from "./templeSpaceFinish";
import { material } from "./material";

export const bindTempleMaterials = (
  environment: IAutoMovieBuiltEnvironment
): IAutoMovieBuiltEnvironment => ({
  ...environment,
  models: environment.models.map((model) => {
    const assignments = model.parts.map((part) => ({
      part,
      finish: part.id.startsWith("surface.")
        ? templeSpaceFinish(part.id)
        : templeModelFinish(model.id, part.id),
    }));
    const finishes = [...new Set(assignments.map((entry) => entry.finish))];
    return {
      ...model,
      materials: finishes.map(material),
      parts: assignments.map(({ part, finish }) => ({
        ...part,
        material: `temple.${finish}`,
      })),
    };
  }),
});
