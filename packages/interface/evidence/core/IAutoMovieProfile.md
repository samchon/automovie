# src/core/IAutoMovieProfile.ts#IAutoMovieProfile

## @evidence contracts/development/design.md#principled-representation

bindProfile maps cited node references and refuses gaps; bindProfileGaits synthesizes each uniquely named gait for the target skeleton. validateProfileCapabilities requires nonblank profile ids and names, unique ids among a model's profiles and at most one trait of each kind; display names need not be unique.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record groups everything a capability contributes so a single binding applies it, with each member typed by the pass that owns it; the `gaits` field is the one `core` to `motion` reference, kept because moving gaits into `core` would pull skeleton and easing types after it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Profiles are matched by id and capabilities by typed trait, never by model or profile name; only executable drivers, admitted limits, capability traits and synthesized gaits are carried, without an unread control-default channel.

## @evidence contracts/development/common.md#meaningful-documentation

States profile ownership, semantic mapping and binding failures, insertion versus dependency execution order, limit precedence, capability metadata admission and gait-name uniqueness.
