# src/human/generation/foot/IAutoMovieHumanFootSectionJets.ts#IAutoMovieHumanFootSectionJets.IPoints

## @evidence contracts/development/common.md#meaningful-documentation

A section's five guide points in its plane, `[across, up]`, mm.

## @evidence contracts/development/design.md#principled-representation `crest`: The instep's crest. `lateral`: The lateral border. `contactLateral`: The lateral edge of the plantar contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanFootSectionJets.p.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootSectionJets.ts#IAutoMovieHumanFootSectionJets.IInput

## @evidence contracts/development/common.md#meaningful-documentation

What the jets read.

## @evidence contracts/development/design.md#principled-representation `points`: The five points. `heights`: The lateral and medial contact edges' heights over the floor, mm. `corner`: The heel's posterior corner's height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootSectionJets.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `points`, `heights`, `corner`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootSectionJets.ts#IAutoMovieHumanFootSectionJets.IJets

## @evidence contracts/development/common.md#meaningful-documentation

The five jets.

## @evidence contracts/development/design.md#principled-representation `crest`: The crest's. `lateral`: The lateral border's. `contactLateral`: The lateral contact edge's.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootSectionJets.of. Also types AutoMovieHumanFootBody.jets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crest`, `lateral`, `contactLateral`, `contactMedial`, `medial`; callers supply the complete record.
