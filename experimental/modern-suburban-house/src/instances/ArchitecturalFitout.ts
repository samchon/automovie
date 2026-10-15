/** Place fixed architectural fittings using the room reservations and model frames.
 * Opening fills remain in their dedicated producers; this owner adds the stair
 * finish, closets and room-bound cabinets and sanitary compartments. No mobile
 * furniture is emitted here. Coordinates are Y-up metres, yaw is radians.
 */
import type { IAutoMovieMeshTransform } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import { Closet } from "../models/Closet";
import { Bathrooms } from "../models/furnishings/Bathrooms";
import { Bedrooms } from "../models/furnishings/Bedrooms";
import { KitchenDining } from "../models/furnishings/KitchenDining";
import { Living } from "../models/furnishings/Living";
import { SanitaryFittings } from "../models/furnishings/SanitaryFittings";
import { ServiceRooms } from "../models/furnishings/ServiceRooms";
import { StairBaluster } from "../models/StairBaluster";
import { StairSkirt } from "../models/StairSkirt";
import type { IHouse } from "../spaces/IHouse";
import type { IRoomReservation } from "../spaces/rooms/IRoomReservation";
import { roomLevels } from "../spaces/rooms/roomLevels";
import type { IRoomSpace } from "../spaces/rooms/IRoomSpace";
import type { FittingBuilt } from "../models/furnishings/FittingBuilt";

type Built = {
  model: IAutoMovieModel;
  faceByPart: Readonly<Record<string, string>>;
};
type Placement = {
  id: string;
  modelId: string;
  transform: IAutoMovieMeshTransform;
};

/** Fixed fitting placement over the room reservation map. Models keep their local dimensions; placement adds translation and yaw without scaling. Mobile furniture remains outside this producer. */
export class ArchitecturalFitout {
  /**
   * Build closet, stair, kitchen, storage and sanitary prototypes and their ordered placements.
   *
   * house must contain the named room reservations and upper hall. Missing named reservations throw; duplicate reservation IDs currently select the last map entry. maximum moves one closet leaf and the shower panel to its authored limit; opposite selects the other closet leaf only when maximum is true. Prototype IDs are deduplicated by first occurrence without comparing repeated contents, while every placement is retained.
   *
   * Zone indexing scales with reservations; prototype deduplication repeatedly scans prior prototypes and all model construction costs remain included. The returned arrays and fresh model meshes belong to the caller; builders and maps are call-local and no placement cache or host resource persists. This assembly does not prove every model stays inside its reservation or that the complete furniture population is delivered.
   */
  public build(
    house: IHouse,
    maximum: boolean = false,
    opposite: boolean = false,
  ): { prototypes: Built[]; instances: Placement[] } {
    const prototypes: Built[] = [],
      instances: Placement[] = [];
    const zones: Map<string, { readonly zone: IRoomReservation; readonly floor: number; }> = new Map(
      house.spaces.flatMap((space: IRoomSpace) : (readonly [string, { readonly zone: IRoomReservation; readonly floor: number; }])[] =>
        (space.reservations ?? []).map(
          (zone: IRoomReservation) : readonly [string, { readonly zone: IRoomReservation; readonly floor: number; }] => [zone.id, { zone, floor: roomLevels(space)[0] }] as const,
        ),
      ),
    );
    const add: (id: string, built: Built, translation: { x: number; y: number; z: number; }, yaw?: number) => void = (
      id: string,
      built: Built,
      translation: { x: number; y: number; z: number },
      yaw: number = 0,
    ): void => {
      if (!prototypes.some((entry: Built) : boolean => entry.model.id === built.model.id))
        prototypes.push(built);
      instances.push({
        id,
        modelId: built.model.id,
        transform: {
          translation,
          rotation: { x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) },
        },
      });
    };
    const zone: (id: string) => { zone: IRoomReservation; floor: number; } = (id: string): { zone: IRoomReservation; floor: number } => {
      const value: { readonly zone: IRoomReservation; readonly floor: number; } | undefined = zones.get(id);
      if (!value) throw new Error(`fixed fitting has no reservation: ${id}`);
      return value;
    };
    // Models whose documented XZ is already the house frame need only a floor lift.
    const anchored: (id: string, built: Built, reservationId?: string) => void = (id: string, built: Built, reservationId: string = id): void => {
      const entry: { zone: IRoomReservation; floor: number; } = zone(reservationId);
      add(id, built, { x: 0, y: entry.floor, z: 0 });
    };
    // Model origin is rear edge centre; align it with the reservation's rear edge.
    const local: (id: string, built: Built, yaw: number) => void = (id: string, built: Built, yaw: number): void => {
      const { zone: z, floor }: { zone: IRoomReservation; floor: number; } = zone(id);
      const x: number =
        yaw === Math.PI / 2
          ? z.x[0]
          : yaw === -Math.PI / 2
            ? z.x[1]
            : (z.x[0] + z.x[1]) / 2;
      const depth: number =
        yaw === Math.PI ? z.z[1] : yaw === 0 ? z.z[0] : (z.z[0] + z.z[1]) / 2;
      add(id, built, { x, y: z.y?.[0] ?? floor, z: depth }, yaw);
    };
    const closets: Closet = new Closet();
    // Inspect one sliding joint at a time. Moving both leaves to their opposite
    // ends exchanges their positions and closes the opening again.
    add(
      "fill:entry-coat-opening",
      closets.coat(
        maximum && !opposite ? 0.45 : 0,
        maximum && opposite ? 0.45 : 0,
      ),
      { x: 0, y: 0, z: 0 },
    );
    add(
      "fill:upper-linen-opening",
      closets.linen(
        maximum && !opposite ? 0.475 : 0,
        maximum && opposite ? 0.475 : 0,
      ),
      {
        x: 0,
        y: roomLevels(house.spaces.find((s: IRoomSpace) : boolean => s.id === "upper-hall")!)[0],
        z: 0,
      },
    );
    add("stair-infill", new StairBaluster().build(), { x: 0, y: 0, z: 0 });
    add("stair-skirt", new StairSkirt().build(), { x: 0, y: 0, z: 0 });
    const kitchen: KitchenDining = new KitchenDining();
    for (const [id, yaw, end] of [
      ["common-kitchen-back-base", 0, "left"],
      ["common-kitchen-left-base-rear", Math.PI / 2, "right"],
      ["common-kitchen-left-base-front", Math.PI / 2, "none"],
    ] as const) {
      const z: IRoomReservation = zone(id).zone;
      local(
        id,
        kitchen.baseRun(yaw === 0 ? z.x[1] - z.x[0] : z.z[1] - z.z[0], end),
        yaw,
      );
    }
    local(
      "common-kitchen-left-wall-cabinet",
      kitchen.wallCabinet(1.3),
      Math.PI / 2,
    );
    local("common-kitchen-back-wall-cabinet", kitchen.wallCabinet(0.85), 0);
    local("common-island", kitchen.island(), -Math.PI / 2);
    const service: ServiceRooms = new ServiceRooms();
    anchored("laundry-folding-top", service.laundryTop());
    anchored("laundry-coat-hooks", service.coatHooks());
    anchored("laundry-upper-storage", service.laundryUpper());
    // One canonical L member occupies the back and right shelf reservations.
    anchored("pantry-l-shelf", service.pantryShelves(), "pantry-back-shelf");
    const bedrooms: Bedrooms = new Bedrooms();
    anchored("primary-wardrobe-hanging", bedrooms.wardrobeHanging());
    anchored("primary-wardrobe-shelves", bedrooms.wardrobeShelves());
    for (const id of ["bedroom-two-closet", "bedroom-three-closet"])
      local(
        id,
        bedrooms.slidingCloset(
          maximum && !opposite ? 0.72 : 0,
          maximum && opposite ? 0.72 : 0,
        ),
        -Math.PI / 2,
      );
    const baths: Bathrooms = new Bathrooms();
    local("powder-basin", baths.vanity(0.6, 0.45, true), Math.PI);
    local("shower-bathroom-vanity", baths.vanity(0.7, 0.55), -Math.PI / 2);
    local("tub-bathroom-vanity", baths.vanity(0.85, 0.55), -Math.PI / 2);
    local("shower-bathroom-booth", baths.showerBooth(maximum ? 1 : 0), 0);
    local("tub-bathroom-tub", baths.bathtub(), -Math.PI / 2);
    const sanitary: SanitaryFittings = new SanitaryFittings();
    local("powder-toilet", sanitary.toilet(), -Math.PI / 2);
    local("shower-bathroom-toilet", sanitary.toilet(), 0);
    local("tub-bathroom-toilet", sanitary.toilet(), -Math.PI / 2);
    local("powder-mirror", sanitary.mirror(0.6), Math.PI);
    local("shower-bathroom-mirror", sanitary.mirror(0.7), -Math.PI / 2);
    local("tub-bathroom-mirror", sanitary.mirror(0.85), -Math.PI / 2);
    local("powder-towel", sanitary.towelBar(0.5, 0.3), Math.PI);
    local("shower-bathroom-towel", sanitary.towelBar(0.25, 0.4), Math.PI);
    local("tub-bathroom-towel", sanitary.towelBar(0.75, 0.4), Math.PI / 2);
    const rail: { zone: IRoomReservation; floor: number; } = zone("tub-bathroom-curtain-rail");
    add("tub-bathroom-curtain-rail", sanitary.curtainRail(), {
      x: (rail.zone.x[0] + rail.zone.x[1]) / 2,
      y: rail.floor,
      z: rail.zone.z[0],
    });
    const fireplace: FittingBuilt = new Living().fireplace();
    // The space owns the brick void; the model's front plane meets its inner face.
    add(
      "living-fireplace-insert",
      fireplace,
      { x: -4.95, y: 0, z: -2.2 },
      Math.PI / 2,
    );
    return { prototypes, instances };
  }
}
