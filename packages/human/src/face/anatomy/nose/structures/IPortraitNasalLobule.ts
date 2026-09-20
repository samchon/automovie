/**
 * A local anterior nasal section in the common millimetre, +Z-forward frame.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Defines local tip or alar section curvature and tangent independently of its host datum.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Carries a retained anchor, metric apex offset, ellipsoidal radii, inner core and optional head-XY slope.
 * @author Samchon
 */
export interface IPortraitNasalLobule {
  /** Resident skin datum; the group supplies its already scaled XYZ position. */
  anchor: number;

  /** Anterior section pole offset from the datum in head XYZ millimetres. */
  offset: readonly number[];

  /** Positive X/Y half-extents and depth radius relative to the tangent, in mm. */
  radii: readonly number[];

  /** Inner elliptical radius in [0,1). Inside it, the section owns full depth. */
  core: number;

  /** Optional local tangent dz/dx and dz/dy, in mm/mm; omission is [0,0]. */
  slope?: readonly number[];
}
