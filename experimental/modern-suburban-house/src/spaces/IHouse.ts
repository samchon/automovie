
import { type IStorageSpace } from "./rooms/IStorageSpace";
import { type IRoomSpace } from "./rooms/IRoomSpace";
import type { IExteriorZone } from "./site/IExteriorZone";
import type { IHousePart } from "../types/IHousePart";

/** The house as the viewer, measurements and delivery consume it. */
export interface IHouse {
  /** Every emitted solid, in fixed owner order. */
  parts: IHousePart[];
  /** The fifteen room space records, in fixed owner order. */
  spaces: IRoomSpace[];
  /** Storage volumes with the room that owns each, in fixed owner order. */
  storages: { room: IRoomSpace; storage: IStorageSpace }[];
  /** Exterior zones of the porch and site, in fixed owner order. */
  zones: IExteriorZone[];
}

