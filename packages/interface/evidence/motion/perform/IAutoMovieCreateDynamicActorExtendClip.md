# src/motion/perform/IAutoMovieCreateDynamicActorExtendClip.ts#IAutoMovieCreateDynamicActorExtendClip.IProps

## @evidence contracts/development/common.md#meaningful-documentation

A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieCreateDynamicActorExtendClip.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. The extension reaches its peak halfway through and then holds. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieCreateDynamicActorExtendClip.IProps contract belongs to interface; packages/engine/src/perform/createDynamicActorExtendClip.ts uses this boundary. Runtime computation remains with those consumers.
