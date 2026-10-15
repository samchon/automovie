/**
 * Room record shape and the solids every room owner emits: its floor
 * finish and the partitions
 * assigns to it.
 *
 * Heights follow the layer splits: a ground-storey finish fills the top
 * 0.025 m above the support base , an upper-storey finish
 * the top 0.025 m of the interstorey reservation .
 * A ceiling finish fills the 0.015 m above the finished ceiling (08 for the
 * ground storey,  for the
 * upper). A partition runs from its storey's finished floor to its finished
 * ceiling ; under a
 * door void each room's floor finish reaches the partition mid-plane
 * (`#interior-boundary-junctions`) through `doorFloor`.
 *
 * Consumers: the fifteen `rooms/*.ts` owners. Reservation validation lives in
 * `checkReservations`; this helper owns no surface.
 */
import type { IHousePart } from "../../types/IHousePart";
import { IRoomSpace } from "./IRoomSpace";
import { IStorageSpace } from "./IStorageSpace";

/**
 * What one room owner emits: its space record and the solids it owns.
 */
export interface IRoomBuild {
  /** The room's declared space. */
  space: IRoomSpace;
  /** Parts the room owns. */
  parts: IHousePart[];
  /** Closed storage volumes the room owns. */
  storages?: IStorageSpace[];
}

