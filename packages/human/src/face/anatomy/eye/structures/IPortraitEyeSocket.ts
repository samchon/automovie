/**
 * One subject-owned eye socket. Ordered lid curves run from negative to positive
 * local X; the component receives their identities instead of embedding them.
 *
 * @evidence contracts/common.md#principled-implementation An eye socket is the four ordered identity lists that bound its aperture and brow on the host, plus the gaze marker; sharing both canthal identities between the rims is what makes the lid loop closed.
 * @evidence contracts/common.md#clear-and-simple-design A flat record of side, four ordered identity lists and one marker, with no geometry embedded.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its ordering and the identities it shares, and the record says the component receives identities and does not embed curves.
 * @evidence contracts/modeling.md#shared-boundaries The socket is the definition both sides share: the aperture and brow rims are host vertex identities, so the eye component, the skin reservation and the brow builder all address the same boundary and cannot drift apart. It states that both rims include the same two canthal identities; whether that join stays closed under every configuration is judged by the eye component, not here.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names the boundary of one eye on a host and defines no part or group; the component that takes it is the part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record varies no trait; it names host identities.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds host vertex identities and no unit or frame.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns no part and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The record holds identities and carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits or bounds no anatomical value.
 *
 * @author Samchon
 */
export interface IPortraitEyeSocket {
  /** Anatomical side; positive host X is left. */
  name: "left" | "right";

  /** Upper aperture rim from negative X to positive X, including both corners. */
  top: number[];

  /** Lower rim in the same direction, including the same corner identities. */
  bottom: number[];

  /** Non-skin measured gaze marker. */
  iris: number;

  /** Upper brow boundary, in the same X order. */
  browTop: number[];

  /** Lower brow boundary, in the same X order. */
  browBottom: number[];
}
