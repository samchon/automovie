import type { IHumanSourceEndpointSurfaceReading } from "./IHumanSourceEndpointSurfaceReading.ts";

/**
 * One side of one face channel and every surface its endpoint moves.
 *
 * @author Samchon
 */
export interface IHumanSourceEndpointCensusRow {
  /** Face basis channel ID. */
  channel: string;

  /** The channel's kind as the basis declares it. */
  kind: "shape" | "expression";

  /** Which end of the channel's envelope this row reads. */
  side: "positive" | "negative";

  /** Endpoint name applied on that side. */
  endpoint: string;

  /** Envelope bound of that side: the channel's `maximum` or `minimum`. */
  bound: number;

  /** Surfaces and landmark rows the endpoint moves; a surface it leaves alone is absent. */
  moved: IHumanSourceEndpointSurfaceReading[];

  /** True when the skin surface moves and no attached surface or landmark follows it. */
  skinOnly: boolean;
}
