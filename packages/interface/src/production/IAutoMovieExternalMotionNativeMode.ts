/**
 * Native external motion use without skeletal retargeting.
 *
 * @evidence contracts/common.md#principled-implementation The discriminator records intended use without skeletal retargeting. Its production compatibility/conversion reader is retired; this record does not prove equal rig basis, preserve source curves or invoke clinical lowering. Ingest and Engine conversion callers supply their own explicit inputs independently.
 * @evidence contracts/common.md#clear-and-simple-design A single discriminator suffices because source take, rig and mapping already belong to adoption, and native playback has no conversion scale to configure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration specifies no guessed scale or automatic switch to retargeting. Compatibility remains a host obligation; sharing a humanoid bone vocabulary alone does not establish it.
 * @evidence contracts/common.md#meaningful-documentation States unretargeted external playback, with native compatibility obligations distinct from the separate humanoid-retarget mode.
 */
export interface IAutoMovieExternalMotionNativeMode {
  /** Native adoption discriminator. */
  kind: "native";
}
