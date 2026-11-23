# src/drawing/AutoMovieQuantitySubject.ts#AutoMovieQuantitySubject

## @evidence contracts/development/design.md#principled-representation `measureAutoMovieQuantities` tallies each subject into a per-owner map from authored records only, with surface footprints, shell or cell volumes, void profiles, route segments and element and opening counts, and emits a finding for every entry of `AUTOMOVIE_QUANTITY_SUBJECTS`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One literal per measured question with its unit and owner granularity fixed by the subject, so a finding needs no per-row unit or grouping field to be read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent quantity is a stated zero rather than a missing row, and what the design cannot support is reported as a gap instead of being estimated.

## @evidence contracts/development/common.md#meaningful-documentation

States for each subject its unit, what is measured and what owns a contribution, and that every subject is always reported.
