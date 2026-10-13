import type { Vector } from "./Vector";

/**
 * Citizen-house observation stations consumed by the exporter; a missing pose or section view is left to the native inspector.
 *
 * @author Samchon
 */
export interface FutureSource {
  /** Source station ids and spaces with optional world poses; section observations remain in the native inspector. */
  stations: {
    id: string;
    space: string;
    pose: { position: Vector; target: Vector } | null;
    fov: number;
    section?: unknown;
  }[];
}
