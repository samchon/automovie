# src/core/IAutoMovieArchetypeBand.ts#IAutoMovieArchetypeBand

## @evidence contracts/development/common.md#meaningful-documentation

States how a producer uses the band and what each member holds.

## @evidence contracts/development/design.md#principled-representation

A closed interval in one stated unit beside its citation, so the value and its provenance cannot be separated; `minimum <= maximum` is the producers' premise, checked where a band is written, by `AutoMovieArchetypeBand.of`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members: the interval, its unit for refusals, the citation and the provisional mark the sourcing rule (#3365 decision 4) requires.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No default value member: the nominal value is the middle of the band, so it cannot disagree with it.
