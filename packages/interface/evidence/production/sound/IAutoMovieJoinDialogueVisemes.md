# src/production/sound/IAutoMovieJoinDialogueVisemes.ts#IAutoMovieJoinDialogueVisemes

## @evidence contracts/development/common.md#meaningful-documentation

Join supplied receipt visemes to one explicit actor binding on emission time. Member documentation states the supplied records, units and absence meanings used by joinAutoMovieDialogueVisemes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The join requires explicit actor binding and receipt intervals; it does not fabricate mouth timing from dialogue text or acoustic arrival delay.

## @evidence contracts/development/design.md#principled-representation

line owns the film-frame range, bindings supplies ordered speaker-to-actor identities and visemes carries final-byte receipt timing on emission time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieJoinDialogueVisemes, used by joinAutoMovieDialogueVisemes. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.

# src/production/sound/IAutoMovieJoinDialogueVisemes.ts#IAutoMovieJoinDialogueVisemes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Join supplied receipt visemes to one explicit actor binding on emission time. Member documentation states the supplied records, units and absence meanings used by joinAutoMovieDialogueVisemes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The join requires explicit actor binding and receipt intervals; it does not fabricate mouth timing from dialogue text or acoustic arrival delay.

## @evidence contracts/development/design.md#principled-representation

line owns the film-frame range, bindings supplies ordered speaker-to-actor identities and visemes carries final-byte receipt timing on emission time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieJoinDialogueVisemes.IProps, used by joinAutoMovieDialogueVisemes. Its line, bindings, visemes members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
