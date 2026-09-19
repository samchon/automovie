/**
 * The prefix every node lowered under one scene placement carries.
 *
 * One law, one owner. The prefix appears in four unrelated places at once: the
 * ids this bridge writes, the `nodePrefix` a profile binds with
 * ({@link bindProfile}), the `nodePrefix` an actor's clip is baked with
 * ({@link motionToClip}), and the channel a shot's `objectMotions` addresses a
 * prop's moving part by. Spelled out at each of them, the four agree until one
 * is edited, and a channel that silently addresses nothing is exactly the drop
 * this package refuses everywhere else.
 *
 * @evidence requirements/map/scope-and-coordinates.md#map-host-scene-placement Establishes the explicit namespace joining one host placement to all of its lowered nodes.
 * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-host-placement-failure Implements the stable placement relation used by downstream transform consumers.
 */
export const placementNodePrefix = (placement: string): string =>
  `${placement}/`;
