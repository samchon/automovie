const SHARED_UNIT = { x: 1, y: 1, z: 1 };
import {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The world transform of a child model's root seated on another model's
 * affordance, so the two declared contact frames coincide: crate B's base
 * socket on crate A's stack-top, a lantern's ring on a hook, a hand frame on a
 * mug handle. It is the model-frame sibling of {@link resolveAttachment}, which
 * couples a child to a posed bone.
 *
 * The parent's contact frame in world space is `contactPos = parentPos +
 * parentRot · frame.translation` and `contactRot = parentRot ∘
 * frame.rotation`. The child is placed so its own contact frame, or its root
 * origin when `childAffordance` is absent or `null`, lands on it:
 *
 * - `childRot = contactRot ∘ childFrame.rotation⁻¹`
 * - `childPos = contactPos − childRot · childFrame.translation`
 *
 * `parentWorld` is read as a rigid transform: its `scale` is not applied to
 * the affordance offset, the convention `affordanceSupportContacts` shares, so
 * a scaled parent seats the child at the unscaled offset. Seating never
 * rescales, so the returned `scale` is a fresh unit vector. The result is a new
 * object the caller owns.
 *
 * @evidence contracts/common.md#principled-implementation Rigid-frame alignment: composing the parent root with its affordance frame gives the contact in world space, and solving `child ∘ childFrame = contact` for the child root gives the two formulas; it premises unit-length rotations and a rigid parent, and the stated limitation is that a scaled parent's offset is not scaled, matching `affordanceSupportContacts`.
 * @evidence contracts/common.md#clear-and-simple-design One seating primitive beside `resolveAttachment`, with the same composition convention, taking the two affordances as authored so stacking and grabbing need no hand-tuned offsets; it has no production caller yet and is reached by the affordance tests.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Treats every affordance kind as pure frame alignment, with no kind, model or offset special-cased; the ignored parent scale is the shared stated convention, not a compensation.
 * @evidence contracts/common.md#meaningful-documentation States the contact and child formulas, the meaning of an absent child affordance, that the parent is read as rigid and the consequence for a scaled parent, the unit scale of the result, and that the caller owns it.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: at most two quaternion products, one inverse and two vector rotations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two frames that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; every returned vector and quaternion is newly allocated and owned by the caller.
 * @author Samchon
 */
export const resolveAffordanceSeat = (props: {
  /** Parent model root in world space, read as a rigid transform. */
  parentWorld: IAutoMovieTransform;

  /** The parent's contact point; any kind, since seating is frame alignment. */
  parentAffordance: IAutoMovieAffordance;

  /**
   * The child's own contact point to land on the parent's, or `null` or
   * absent to seat the child root origin directly on the parent's contact.
   */
  childAffordance?: IAutoMovieAffordance | null;
}): IAutoMovieTransform => {
  const parent: IAutoMovieTransform = props.parentWorld;
  const frame: IAutoMovieTransform = props.parentAffordance.frame;
  const contactPosition: IAutoMovieVector3 = Vector3.add(
    parent.translation,
    Quaternion.rotateVector(parent.rotation, frame.translation),
  );
  const contactRotation: IAutoMovieQuaternion = Quaternion.multiply(
    parent.rotation,
    frame.rotation,
  );

  const child: IAutoMovieAffordance | null = props.childAffordance ?? null;
  if (child === null)
    return {
      translation: contactPosition,
      rotation: contactRotation,
      scale: SHARED_UNIT,
    };

  const childRotation: IAutoMovieQuaternion = Quaternion.multiply(
    contactRotation,
    Quaternion.inverse(child.frame.rotation),
  );
  return {
    translation: Vector3.subtract(
      contactPosition,
      Quaternion.rotateVector(childRotation, child.frame.translation),
    ),
    rotation: childRotation,
    scale: SHARED_UNIT,
  };
};
