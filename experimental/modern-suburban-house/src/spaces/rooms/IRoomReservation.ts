/**
 * A plan zone a room reserves for one use, world metres: furniture or a
 * fixture body, a storage body, the floor a person uses in front of them, a
 * clear route, or the sweep of a door, drawer or appliance door. The zone is
 * a spaces decision later instances and observations consume; the object in it
 * is not authored here. A `covering` (a rug or mat a few millimetres thick) is
 * walked on, so a route may cross it.
 */

export interface IRoomReservation {
  /** Reservation identity. */
  id: string;
  /** Use the zone is reserved for. */
  kind: "furniture" | "fixture" | "storage" | "covering" | "use" | "route" | "swing";
  /** World x range. */
  x: readonly [number, number];
  /** World z range. */
  z: readonly [number, number];
  /** Height range, when the zone does not run floor to ceiling. */
  y?: readonly [number, number];
  /**
   * The space the zone lies in when it is not the owning room: a zone this
   * room's design decides beside its own door, on the neighbour's floor
   * (laundry's garage-side waiting, the coat closet's front use).
   */
  space?: string;
}
