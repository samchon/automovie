# src/architecture/validateBuiltPanelFit.ts#validateBuiltPanelFit

## @evidence contracts/development/implementation.md#principled-implementation

Places each leaf's four corners with the element's rest world matrix from the shared staging, maps them into the face frame by the inverse face rotation, drops the out-of-plane coordinate, and tests the resulting rectangle with the same polygon containment a void meets against its face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One staged check separated from `validateBuiltEnvironment`; rest staging comes from `builtEnvironmentWorldMatrices` with every member at rest instead of a private copy of the staging code.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No door type is special-cased; smaller leaves and out-of-plane leaves are allowed by the stated design reasons, and openings with defects reported elsewhere are skipped rather than reported twice.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states where the leaf is measured, what is and is not compared and why, the leaf rectangle, the containment rule, the skips, and the path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays full rest staging through `builtEnvironmentWorldMatrices`, including its operation/member indexing, then opening scans, four transforms per panel and `polygonInside` against that panel's void. With four inner corners the latter is O(H²) for H void vertices; no small fixed hull size is assumed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per validation over one staging shared by every panel.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The world matrices are released on return, bounded by the element count; one violation per refused panel is appended to the caller's collector.
