/**
 * Native external motion use without skeletal retargeting.
 *
 * @evidence contracts/development/design.md#principled-representation The discriminator records intended use without skeletal retargeting. Its production compatibility/conversion reader is retired; this record does not prove equal rig basis, preserve source curves or invoke clinical lowering. Ingest and Engine conversion callers supply their own explicit inputs independently.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A single discriminator suffices because source take, rig and mapping already belong to adoption, and native playback has no conversion scale to configure.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration specifies no guessed scale or automatic switch to retargeting. Compatibility remains a host obligation; sharing a humanoid bone vocabulary alone does not establish it.
 * @evidence contracts/development/common.md#meaningful-documentation States unretargeted external playback, with native compatibility obligations distinct from the separate humanoid-retarget mode.
 */
export interface IAutoMovieExternalMotionNativeMode {
  /** Native adoption discriminator. */
  kind: "native";
}
