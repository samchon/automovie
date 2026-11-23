# src/production/IAutoMovieCaptionReadabilityProfile.ts#IAutoMovieCaptionReadabilityProfile

## @evidence contracts/development/design.md#principled-representation

A language profile carries exact grapheme segmentation and five declared boundaries; render matches language ASCII case-insensitively and applies boundary inclusivity, relying on callers for finite nonnegative values because this type performs no numeric admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One profile owns all readability choices for one language, separating user-selected thresholds from actual measurement runtime and from byte-stable compiled caption timing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Render infers no threshold preset or registry preferred language value and returns no verdict without a matching profile; this DTO does not enforce unique profile languages, so callers must prevent duplicate identities that render's map would overwrite.

## @evidence contracts/development/common.md#meaningful-documentation

Gives production ownership, profile version, retained language spelling and identity limits, segmentation revision and the units and directions of all five explicit thresholds.
