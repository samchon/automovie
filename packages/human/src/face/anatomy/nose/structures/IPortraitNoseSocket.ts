/**
 * Subject-owned nasal attachment. The two cut populations are triangle ordinals
 * on the measured host, fixed before a component deforms its openings.
 *
 * Every length is millimetres of one host frame (+X anatomical left, +Y up, +Z
 * anterior). The nose component admits a socket through
 * `resolvePortraitNoseSocket`, which requires finite centres, a nonnegative
 * alar offset and positive influence radii, because the nasal relief divides by
 * the radii.
 *
 * @evidence contracts/common.md#principled-implementation The type is the host-measured nasal attachment as three centres and offsets, three influence radii, the skin vertices the nose may sculpt and the cut triangles of each opening, all in one host frame; the numeric domains it cannot express (positive radii, a nonnegative offset) are enforced by resolvePortraitNoseSocket.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of what the nose component reads from its host, with no behaviour and no option beyond the one optional support plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration carries no behaviour, special case or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment and members state the frame, the unit, the domain of each radius and offset, and what the two ordinal populations identify.
 * @evidence contracts/modeling.md#spatial-conventions Every length is millimetres in the one host frame stated on the type; the type converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type is a declaration and defines no part or group; the nose component that reads it is the part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The socket is subject-owned attachment geometry measured on the host, not a channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type constructs no surface; the component that reads it owns the boundary with the host skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type is a declaration and displays nothing; the nose it configures is observed by its component.
 *
 * @author Samchon
 */
export interface IPortraitNoseSocket {
  /** Nasal midline in the host frame, in mm. */
  midline: number;

  /** Tip influence centre Y, in mm. */
  tipY: number;

  /** Tip influence radii in X/Y, in mm; positive. */
  tipRadius: [number, number];

  /** Alar centres' distance from the midline, in mm; nonnegative. */
  alarOffset: number;

  /** Alar centre Y, in mm. */
  alarY: number;

  /** Alar influence radius, in mm; positive. */
  alarRadius: number;

  /** Host skin vertices that the component directly sculpts. */
  surface: number[];

  /** Original triangle ordinals for each nasal opening. */
  nostrils: number[][];

  /** Three retained skin datums spanning the nasal root and paired facial base. */
  supportPlane?: readonly number[];
}
