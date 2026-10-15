/** Metric, right-handed Y-up design inputs from spaces/002. The datum owns the
 * envelope and storey heights; room cells consume its clear edges. Facades,
 * slabs, topology and circulation import these values directly. */
export const datum = {
  minX: -5.5,
  maxX: 5.5,
  minZ: -6,
  maxZ: 6,
  innerX: 5.26,
  innerZ: 5.76,
  wall: 0.18,
  floors: [0, 3.2],
  ceilings: [2.9, 6.1],
  roof: 6.4,
} as const;
