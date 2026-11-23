# src/core/IAutoMovieChannel.ts#IAutoMovieChannel

## @evidence contracts/development/design.md#principled-representation

Follows glTF's split between core node targets and KHR_animation_pointer targets; `channelKey` gives every channel one string identity, `node:<id>:<path>` or `ptr:<pointer>`, that sampling, drivers and limits all key by, and it throws on an unknown kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A two-member union discriminated on `kind`, so the common node case needs no pointer parsing and every other property goes through one pointer form instead of a member per property family.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A node path spelled as a pointer is kept distinct rather than aliased to the node, and the documentation states which consumers actually apply pointer values instead of implying all of them do.

## @evidence contracts/development/common.md#meaningful-documentation

States the two forms and when to use each, which consumers apply pointer values today, and that the namespaces are disjoint.
