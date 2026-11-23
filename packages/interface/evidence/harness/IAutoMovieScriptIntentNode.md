# src/harness/IAutoMovieScriptIntentNode.ts#IAutoMovieScriptIntentNode

## @evidence contracts/development/design.md#principled-representation

The single root of a parent-pointer tree, enforced by counting `parent: null` nodes and refusing an intent that names a parent, so every chain `scriptAncestors` walks ends here.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared node fields plus the `intent` discriminator and its own two-field payload; nothing else distinguishes the root.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A forest or a second root is refused rather than merged under an invented intent.

## @evidence contracts/development/common.md#meaningful-documentation

States the root and uniqueness rules, and which output reads its payload in place of the flat script fields; members give the discriminator and payload roles.
