# src/motion/IAutoMovieHumanoidRetargetCharacterization.ts#IAutoMovieHumanoidRetargetCharacterization

## @evidence contracts/development/design.md#principled-representation

Records both characterized rigs, the positive root multiplier and the actual facing, ROM and contact decisions taken by retargetHumanoidMotion; requiredBones is the union of hips, articulated slots and explicitly required slots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A decision record accompanies the clip instead of hiding clinical axis and rest-frame mappings in a renderer-specific adapter.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Source and target identities remain explicit and contact correction is recorded separately from unchanged facing, so a successful clip does not imply an unperformed conversion.

## @evidence contracts/development/common.md#meaningful-documentation

States shared scale semantics, per-rig slot filtering, playback table pairing and the meaning of each decision field.
