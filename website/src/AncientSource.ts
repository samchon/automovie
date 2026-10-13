import type { Vector } from "./Vector";

/**
 * Temple camera and observation fields consumed by the tour exporter; null poses and specialized views remain in the native inspector.
 *
 * @author Samchon
 */
export interface AncientSource {
  /** Authored vertical lens degrees and clip distances in meters. */
  lens: { verticalDegrees: number; near: number; far: number };

  /** Source observation identities and world poses; null poses or specialized view records are excluded from the public perspective navigator. */
  observations: {
    id: string;
    group: string;
    space?: string;
    position: Vector | null;
    target: Vector | null;
    view?: unknown;
  }[];
}
