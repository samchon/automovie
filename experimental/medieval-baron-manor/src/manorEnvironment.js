import { productionRuntimeModelId } from "@automovie/engine";
import { Quaternion, Vector3 } from "three";

import { manorInstanceDefinitions } from "./instances/manor.js";
import { manorSpatialState } from "./manorSpatialState";
import { createManorScene } from "./models/manor.js";

/** Derives topology from the same geometry and world poses the viewer draws. */
export function buildManorEnvironment() {
  const source = createManorScene({ shadows: false });
  source.scene.updateMatrixWorld(true);
  const inventory = manorInstanceDefinitions(source.entries);
  for (const prototype of inventory.prototypes)
    prototype.model.id = productionRuntimeModelId(prototype.id);
  const transforms = new Map(
    source.entries.map((entry) => {
      const object = source.objects.get(entry.id);
      if (object === undefined)
        throw new Error("Missing manor source object: " + entry.id);
      const translation = new Vector3(),
        rotation = new Quaternion(),
        scale = new Vector3();
      object.matrixWorld.decompose(translation, rotation, scale);
      return [entry.id, { translation, rotation, scale }];
    }),
  );
  return manorSpatialState(
    {
      entries: source.entries,
      rooms: source.manifest.rooms,
      boundaries: source.manifest.boundaries,
    },
    inventory,
    transforms,
  ).environment;
}
