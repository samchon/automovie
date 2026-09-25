/** Assemble the current structural environment with room-owned object members. */
import { validateBuiltEnvironment } from "@automovie/engine";
import { bindTempleMaterials } from "../materials/bindings";
import { TempleFixtureModels } from "../models/fixtures";
import { TemplePortableModels } from "../models/portable";
import { TempleRitualModels } from "../models/ritual";
import { TempleWareModels } from "../models/wares";
import { createTempleEnvironment } from "../spaces/environment";
import { TempleObjectInstances } from "./objects";

export const createTempleObjectScene = () => {
  const base = createTempleEnvironment();
  const objectModels = [
    ...TempleFixtureModels.build(), ...TempleWareModels.build(),
    ...TemplePortableModels.build(), ...TempleRitualModels.build(),
  ];
  const objectElements = TempleObjectInstances.elements(objectModels);
  const ids = new Set(objectModels.map((model) => model.id));
  for (const element of objectElements) if (!ids.has(element.model!))
    throw new Error(`${element.id}: prototype ${element.model} 없음`);
  const environment = bindTempleMaterials({
    ...base.environment,
    models: [...base.environment.models, ...objectModels],
    elements: [...base.environment.elements, ...objectElements],
  });
  const validation = validateBuiltEnvironment({ environment });
  if (!validation.success) throw new Error(`temple/objects: ${validation.violations.map((v) => `${v.path}: ${v.expected}`).join("\n")}`);
  return { ...base, environment, objectModels, objectElements };
};
