/**
 * Native external motion use without skeletal retargeting.
 *
 * @evidence contracts/common.md#principled-implementation Native skips skeletal retargeting but still uses importedNodeClipToAutoMovieMotion clinical lowering; source quaternion interpolation is not generally preserved between union key times. Production requires equal rig ids and exact canonical mapped bone records after target helper projection, including rest/constraints, under the projected TRS and prior rig-admission premises.
 * @evidence contracts/common.md#clear-and-simple-design A single discriminator suffices because source take, rig and mapping already belong to adoption, and native playback has no conversion scale to configure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A native incompatibility is reported rather than silently corrected through retargeting or guessed scale, and sharing a humanoid bone vocabulary alone does not establish compatibility.
 * @evidence contracts/common.md#meaningful-documentation States unretargeted external playback, with native compatibility obligations distinct from the separate humanoid-retarget mode.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionNativeMode {
  /** Native adoption discriminator. */
  kind: "native";
}
