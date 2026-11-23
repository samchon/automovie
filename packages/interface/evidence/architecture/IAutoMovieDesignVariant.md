# src/architecture/IAutoMovieDesignVariant.ts#IAutoMovieDesignVariant

## @evidence contracts/development/design.md#principled-representation `validateDesignLineage` requires unique nonblank variant identity/label, a resolving revision base, globally unique change ids, resolving subjects and one change per subject/aspect, using JSON array keys. Comparison uses the shared length-prefixed key encoder and exact value strings; neither owner parses a patch or loads the base design's actual values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Label, base revision and change list form one alternative. Comparison diffs opaque subject/aspect values; impact tracing separately walks declared derived-artifact input edges from caller-supplied changed ids, without cloning or evaluating a building.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Two edits of one aspect inside a variant are refused rather than resolved by taking the later one, and the base design is expressed by a null stamp variant instead of a synthetic empty variant.

## @evidence contracts/development/common.md#meaningful-documentation

States recorded-delta semantics, caller ownership of applying geometry, base/no-variant spelling, resolving base revision, globally unique change ids and one edit per subject/aspect.
