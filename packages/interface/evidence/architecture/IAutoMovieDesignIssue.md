# src/architecture/IAutoMovieDesignIssue.ts#IAutoMovieDesignIssue

## @evidence contracts/development/design.md#principled-representation `validateDesignReference` requires a known kind, a non-blank detail, and at least one distinct subject resolving to a primitive or candidate of the same document; `promoteDesignObservations` collects the ids of open issues and withholds a candidate whose own `issues` names one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The blocking relation lives once, on the candidate's `issues` list, so `subjects` only scopes the question for a reader and no second link has to be kept in sync with the first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Blocking is not inferred from subjects or reconciled reciprocally. The caller's open flag and the candidate's issue list alone decide this gate; the engine does not authenticate who closed an issue or whether its uncertainty was resolved. Removing a candidate link or clearing open removes that specific block without settling other promotion gates.

## @evidence contracts/development/common.md#meaningful-documentation

States that only an open issue a candidate lists blocks it, that naming a subject blocks nothing, what each subject must resolve to, and that the detail is the decision a human still owes.
