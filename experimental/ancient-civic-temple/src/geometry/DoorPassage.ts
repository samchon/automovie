
/**
 * One door or passage through an interior or exterior wall, as the reviewed passage table authors
 * it.
 */
export interface DoorPassage {
  /** Opening identity; leaf, frame and threshold ids derive from it. */
  id: string;
  /** Identity of the boundary the opening cuts. */
  boundary: string;
  /** Room the door belongs to and its leaves open into. */
  room: string;
  /** Space on the other side of the wall. */
  adjacent: string;
  /** World axis the host wall runs along. */
  axis: "x" | "z";
  /** Centre of the opening along `axis`, in world metres. */
  center: number;
  /** Lower coordinate of the host wall's thickness across `axis`. */
  wallLow: number;
  /** Upper coordinate of the host wall's thickness across `axis`. */
  wallHigh: number;
  /** Clear opening width. */
  width: number;
  /** Clear opening height above the threshold. */
  height: number;
  /** Frame member width around the clear opening. */
  frame: number;
  /** Thickness of each door leaf. */
  leafThickness: number;
  /** Leaf arrangement: a double door, or a single leaf hinged on the room's north or south side. */
  swing: "room-double" | "room-north" | "room-south";
}
