/**
 * Bind a nasal opening to a caller-owned control mesh. The footprint predicate
 * classifies strict XY interior points in matching units; the boundary walker
 * converts selected oriented triangle indices into one cyclic attachment.
 * Neither operation mutates input or fits depth. The nose component and its
 * lining share this cycle so their vertex ordering cannot diverge. The caller
 * supplies valid triangle indices; this owner refuses empty, branched, open or
 * disconnected boundary populations, not geometric triangle intersections.
 */
/**
 * Select an ellipse footprint while binding a measured host socket.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Selects the initial nostril footprint used when binding a measured host.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Tests strict interior membership of the caller-owned elliptical XY footprint without changing connectivity.
 */
export const portraitNostrilContains = (
  x: number,
  y: number,
  footprint: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
): boolean =>
  ((x - footprint.x) / footprint.width) ** 2 +
    ((y - footprint.y) / footprint.height) ** 2 <
  1;
