/**
 * The house producer: every spaces owner's parts in one deterministic list.
 *
 * Responsibility: call each source owner once, in a fixed order, and refuse a
 * duplicate part id instead of silently keeping one. The list is the single
 * producer the viewer server (and later measurements and delivery) consume, so
 * they all see the same geometry. It has no inputs: every coordinate comes from
 * the owners, which read the reviewed `docs/spaces` values.
 *
 * Scope of this pass: mass, envelope with real opening voids, floors,
 * ceilings, the eight roof faces and the porch roof, room outlines and
 * partitions, the stair, the porch and the site paving and fence. Furniture,
 * fixtures, cabinets, lighting, planting, door and window leaves, frames and
 * textures belong to later model, instance, material and system branches and
 * are not emitted.
 */
import { buildGroundFloor } from "./floors/ground";
import { buildUpperFloor } from "./floors/upper";
import { buildFront } from "./envelope/front";
import { buildLeft } from "./envelope/left";
import { buildRear } from "./envelope/rear";
import { buildRight } from "./envelope/right";
import { buildGarage } from "./garage";
import { buildPorch } from "./porch";
import { buildFrontGableLeftRoof } from "./roof/front-gable-left";
import { buildFrontGableRightRoof } from "./roof/front-gable-right";
import { buildGarageBackRoof } from "./roof/garage-back";
import { buildGarageFrontRoof } from "./roof/garage-front";
import { buildMainBackRoof } from "./roof/main-back";
import { buildMainFrontRoof } from "./roof/main-front";
import { buildRightBackRoof } from "./roof/right-back";
import { buildRightFrontRoof } from "./roof/right-front";
import { buildBedroomThree } from "./rooms/bedroom-three";
import { buildBedroomTwo } from "./rooms/bedroom-two";
import { buildCommon } from "./rooms/common";
import { buildEntry } from "./rooms/entry";
import { buildGarageInterior } from "./rooms/garage-interior";
import { buildLaundry } from "./rooms/laundry";
import { buildLiving } from "./rooms/living";
import { buildPantry } from "./rooms/pantry";
import { buildPowder } from "./rooms/powder";
import { buildPrimary } from "./rooms/primary";
import { buildService } from "./rooms/service";
import { buildShowerBath } from "./rooms/shower-bath";
import { buildTubBath } from "./rooms/tub-bath";
import { buildUpperHall } from "./rooms/upper-hall";
import { buildWardrobe } from "./rooms/wardrobe";
import { buildSite } from "./site";
import type { IHousePart } from "./solids";
import { buildStair } from "./stair";

/** Build the whole house; throws on a duplicate part id. */
export const buildHouse = (): IHousePart[] => {
  const parts = [
    ...buildGroundFloor(),
    ...buildUpperFloor(),
    ...buildGarage(),
    ...buildFront(),
    ...buildRear(),
    ...buildLeft(),
    ...buildRight(),
    ...buildMainFrontRoof(),
    ...buildMainBackRoof(),
    ...buildFrontGableLeftRoof(),
    ...buildFrontGableRightRoof(),
    ...buildRightFrontRoof(),
    ...buildRightBackRoof(),
    ...buildGarageFrontRoof(),
    ...buildGarageBackRoof(),
    ...buildEntry(),
    ...buildLiving(),
    ...buildCommon(),
    ...buildService(),
    ...buildPowder(),
    ...buildLaundry(),
    ...buildPantry(),
    ...buildGarageInterior(),
    ...buildUpperHall(),
    ...buildPrimary(),
    ...buildWardrobe(),
    ...buildBedroomTwo(),
    ...buildBedroomThree(),
    ...buildShowerBath(),
    ...buildTubBath(),
    ...buildStair(),
    ...buildPorch(),
    ...buildSite(),
  ];
  const seen = new Set<string>();
  for (const p of parts) {
    if (seen.has(p.id)) throw new Error(`duplicate house part id "${p.id}" from ${p.owner}`);
    seen.add(p.id);
  }
  return parts;
};
