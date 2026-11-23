# src/IAutoMovieDeliveryProfileFinding.ts#IAutoMovieDeliveryProfileFinding

## @evidence contracts/development/common.md#meaningful-documentation

Names each member and every value `field` takes.

## @evidence contracts/development/design.md#principled-representation

A profile refusal as data: the track, the profile field and both values as the asserter spells them, so a report reader sees what differed without parsing a message.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The render report's `profile` list is its only consumer; it carries what the issue requires a blocked report to show.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two special fields, `track` and `probe`, are named in the documentation rather than hidden in free text.
