# src/formationSlot.ts#formationSlot

## @evidence contracts/development/implementation.md#principled-implementation

A pure function of the design and slot index: the hero override is looked up by slot, the position comes from the one placement law, and the identity, model, heading and seeded motion phase come from the shared record law.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the two shared laws and owns only the design's spelling of a hero, an override list, which is the one thing the compiled record spells differently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No slot, hero or layout is special-cased, and no compiled-record value is substituted for an ungrounded design; an absent terrain snapshot is an authored fact giving zero relief.

## @evidence contracts/development/common.md#meaningful-documentation

States who calls it, which laws it shares with the compiled path, what an absent `ground` means, that it reads no external state, and its range error.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of the hero overrides, bounded by the design's hero count, plus the constant-time placement and its terrain lookup; regenerating a member costs no storage, which is why a formation of up to 100,000 slots is never materialized for one query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one slot per call and shares nothing across calls beyond the anchor datum `formationGroundRelief` keeps per record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the returned record is fresh and caller-owned.
