/**
 * Where a joint's axial rotation (`twist`) sits relative to its flexion and
 * abduction, which fixes the order the three clinical angles compose in.
 *
 * - `"proximal"`: the axial rotation happens before the swing in the chain,
 *   as the head turns at the atlantoaxial joint below the nodding joint. The
 *   flexion and abduction axes turn with the twist, so a turned head nods
 *   about its own turned axis: `q = qTwist · qAbduction · qFlexion`.
 * - `"distal"`: the axial rotation happens in the moved segment beyond the
 *   swing, as the forearm pronates and supinates beyond the elbow's hinge.
 *   The swing axes stay with the parent and the twist turns the moved
 *   segment about its own long axis, so twisting a bent forearm never changes
 *   where it points: `q = qAbduction · qFlexion · qTwist`. The swing is the
 *   proximal order's, so a pose with no twist is the same rotation in both.
 *
 * The placement is an anatomical fact of each joint, declared with its axes;
 * omission keeps `"proximal"`. `HUMANOID_JOINT_AXES` declares `"distal"` for
 * the two lower arms only, and `jointToQuaternion` and
 * `decomposeJointRotation` compose and invert in the declared order.
 *
 * @evidence contracts/common.md#principled-implementation The two values are the two orders in which a swing and a rotation about the moved segment's long axis can compose, and each is inverted in closed form by `decomposeJointRotation`, a ZYX extraction for proximal and a YXZ extraction for distal after changing to the joint's own basis.
 * @evidence contracts/common.md#clear-and-simple-design A closed two-value union on `IAutoMovieJointAxes`, so the order is declared beside the axes it orders and both composition and inversion read it from the same record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No bone name is special-cased in the composer: the forearm's distal order comes only from its declared axes, and `validateJointAxesBasis` refuses any other string.
 * @evidence contracts/common.md#meaningful-documentation States each value's anatomical meaning with an example, its quaternion order, the equality without twist, the default, which bones declare distal, and which functions read it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A string union with no runtime body.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A declaration value; nothing is computed from it here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A string literal held by the axes record that declares it.
 * @author Samchon
 */
export type AutoMovieJointTwistPlacement = "proximal" | "distal";
