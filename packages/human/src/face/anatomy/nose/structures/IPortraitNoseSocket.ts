/**
 * Subject-owned nasal attachment. The two cut populations are triangle ordinals
 * on the measured host, fixed before a component deforms its openings.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Binds replaceable nasal skin and openings to the caller's host rather than embedding a person's coordinates.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines the midline, relief support locations, surface vertices, original cut-face ordinals and optional section/support datums.
 */
export interface IPortraitNoseSocket {
  /** Nasal midline in the host frame, in mm. */
  midline: number;

  /** Tip influence centre Y, in mm. */
  tipY: number;

  /** Tip influence radii in X/Y, in mm. */
  tipRadius: [number, number];

  /** Alar centres' distance from the midline, in mm. */
  alarOffset: number;

  /** Alar centre Y, in mm. */
  alarY: number;

  /** Alar influence radius, in mm. */
  alarRadius: number;

  /** Host skin vertices that the component directly sculpts. */
  surface: number[];

  /** Original triangle ordinals for each nasal opening. */
  nostrils: number[][];

  /** Optional retained vertex supplying the local section loft's XYZ datum. */
  sectionAnchor?: number;

  /** Three retained skin datums spanning the nasal root and paired facial base. */
  supportPlane?: readonly number[];
}
