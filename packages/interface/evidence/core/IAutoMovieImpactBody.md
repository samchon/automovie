# src/core/IAutoMovieImpactBody.ts#IAutoMovieImpactBody

## @evidence contracts/development/design.md#principled-representation `validateProfileCapabilities` requires a finite positive mass, restitution in `[0, 1]`, and hardness and penetrability in `(0, 1]`, the unit coefficients `resolveImpact` reads against its fixed bounce, embed and pass-through thresholds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The trait stores only the static material facts a proxy owns; velocity belongs to an impact, so the engine's response type adds it rather than this record carrying a placeholder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Out-of-range coefficients are refused at validation rather than clamped when a future verb reads them, and the documentation states that no engine verb consumes the trait yet.

## @evidence contracts/development/common.md#meaningful-documentation

States who carries and reads the record, how it relates to the engine's response type, and each field's unit and accepted range.
