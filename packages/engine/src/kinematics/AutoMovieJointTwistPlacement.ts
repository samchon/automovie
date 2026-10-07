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
 * omission keeps `"proximal"`, the order every existing pose was authored in.
 *
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Declares how a joint's named controls compose, so each control keeps its anatomical meaning in combination.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Fixes the composition order the semantic controls enter the rig's rotation graph in.
 * @author Samchon
 */
export type AutoMovieJointTwistPlacement = "proximal" | "distal";
