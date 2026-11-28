# src/construction/IAutoMovieViewAxisJet.ts#IAutoMovieViewAxisJet.IJet

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies derivative orders, default coordinate and the unchanged frame value.

## @evidence contracts/development/design.md#principled-representation

ViewAxisJet.parameter keeps the station frame value and transforms first and second derivative components with the inverse coordinate derivatives and chain rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The jet reuses the section frame layout for all three orders; the axis query specifies the actual coordinate.

# src/construction/IAutoMovieViewAxisJet.ts#IAutoMovieViewAxisJet.IJet.value

## @evidence contracts/development/common.md#meaningful-documentation

The comment distinguishes the actual coordinate value and unit directions.

# src/construction/IAutoMovieViewAxisJet.ts#IAutoMovieViewAxisJet.IJet.first

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives derivative component units in the default coordinate.

# src/construction/IAutoMovieViewAxisJet.ts#IAutoMovieViewAxisJet.IJet.second

## @evidence contracts/development/common.md#meaningful-documentation

The comment assigns the different units of origin and axis curvature.
