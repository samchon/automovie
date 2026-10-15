import type { IPlanPoint } from "../../types/IPlanPoint";
import type { StoreyId } from "../StoreyId";
import type { IRoomReservation } from "./IRoomReservation";

/**
 * One interior space as its plan owner declares it.
 */

export interface IRoomSpace {
  /** Space identity. */
  id: string;
  /** Owner key of the room's parts. */
  owner: string;
  /** Storey the room stands on. */
  storey: StoreyId;
  /** Plan outline of the finished room. */
  outline: readonly IPlanPoint[];
  /** Finished floor height. */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   */
  levels?: readonly [number, number];
  /** Plan zones the room reserves. */
  reservations?: readonly IRoomReservation[];
}
