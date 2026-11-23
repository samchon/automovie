# src/human/generation/IAutoMovieHumanTrunkLandmarks.ts#IAutoMovieHumanTrunkLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

The trunk's landmarks, left side canonical, calibration millimetres in the body frame: heights of the stations the tapes and courses are taken at, the points the shoulder and the breast stand on, and the column's axis for the skeleton.

## @evidence contracts/development/design.md#principled-representation `crotch`: Crotch height. `cervicale`: Cervicale height (back neck point, ISO 8559-1 3.1.6). `buttock`: Buttock point height: the hip tape's site.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanTrunkLandmarks.axisAt. Also types AutoMovieHumanTrunkChains.l.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `crotch`, `cervicale`, `buttock`, `iliocristale`, `omphalion`, `waist`, `fold`, `bust`, `axilla`, `shoulder`, `glenohumeral`, `bustPoint`, `axis`; callers supply the complete record.
