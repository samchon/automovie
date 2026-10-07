import type { IHumanSourcePeriocularSeatStation } from "./IHumanSourcePeriocularSeatStation.ts";

/**
 * The cage's seat on the globe in one source state: neutral or one channel end.
 *
 * @author Samchon
 */
export interface IHumanSourcePeriocularSeatState {
  /** Channel ID, or null for the source neutral. */
  channel: string | null;

  /** Endpoint applied, or null for the source neutral. */
  endpoint: string | null;

  /** Weight applied to the endpoint rows: the absolute envelope bound, zero at neutral. */
  weight: number;

  /** Cage vertices of this side the endpoint moves. */
  movedCageVertices: number;

  /** Globe vertices of this side's eye the endpoint moves. */
  movedGlobeVertices: number;

  /** Every registered cage row, inner to outer. */
  stations: IHumanSourcePeriocularSeatStation[];
}
