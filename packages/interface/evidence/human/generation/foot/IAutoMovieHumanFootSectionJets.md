# src/human/generation/foot/IAutoMovieHumanFootSectionJets.ts#IAutoMovieHumanFootSectionJets

## @evidence contracts/development/common.md#meaningful-documentation

Describes five section guide points and their shared contact jets in the across/up millimetre chart; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Five section guide points and their shared contact jets in the across/up millimetre chart. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanFootSectionJets; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing FootSectionJets contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

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
