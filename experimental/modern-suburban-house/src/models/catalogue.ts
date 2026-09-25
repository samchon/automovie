/** Complete docs/models/10–19 prototype census. Dimensions live only in
 * their reviewed domain owner files; this file only composes the population. */
import { buildPrototype, type PrototypeSpec } from "./templates";
import { kitchenDiningSpecs } from "./furnishings/kitchen-dining";
import { livingSpecs } from "./furnishings/living";
import { serviceRoomSpecs } from "./furnishings/service-rooms";
import { bedroomSpecs } from "./furnishings/bedrooms";
import { bathroomSpecs } from "./furnishings/bathrooms";
import { outdoorFurnitureSpecs } from "./furnishings/outdoor";
import { sidingSpecs } from "./exterior/siding";
import { exteriorTrimSpecs } from "./exterior/trim";
import { shingleSpecs } from "./exterior/shingle";
import { drainageSpecs } from "./exterior/drainage";
import { plantingSpecs } from "./planting";
import { lightingFixtureSpecs } from "./lighting-fixtures";
import { housePropSpecs } from "./furnishings/props";

export const housePrototypeSpecs: readonly PrototypeSpec[] = [
  ...kitchenDiningSpecs,
  ...livingSpecs,
  ...serviceRoomSpecs,
  ...bedroomSpecs,
  ...bathroomSpecs,
  ...outdoorFurnitureSpecs,
  ...sidingSpecs,
  ...exteriorTrimSpecs,
  ...shingleSpecs,
  ...drainageSpecs,
  ...plantingSpecs,
  ...lightingFixtureSpecs,
  ...housePropSpecs,
];

export const buildHousePrototypes = () => housePrototypeSpecs.map(buildPrototype);
