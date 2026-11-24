# src/human/generation/conic/IAutoMovieHumanNativeScaleProfile.ts#IAutoMovieHumanNativeScaleProfile

## @evidence contracts/development/design.md#principled-representation

The scalar profile and the held centre each carry their own value and two derivatives in the section's coordinate order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Native source scaling and native section inspection use the same profile and centre inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The exact constant state is separate from a station-varying profile. The centre carries its own declared changes.

## @evidence contracts/development/common.md#meaningful-documentation

States directional order, material station units, derivative orders and constant-profile scope.

# src/human/generation/conic/IAutoMovieHumanNativeScaleProfile.ts#IAutoMovieHumanNativeScaleProfile.IJet

## @evidence contracts/development/design.md#principled-representation

Value and both derivatives keep the section coordinate order, depth (u) first and breadth (v) second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly the three orders a product-rule 2-jet consumes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member; a held end reports explicit zero derivatives.

## @evidence contracts/development/common.md#meaningful-documentation

Members state the coordinate order and derivative units for each producer.

# src/human/generation/conic/IAutoMovieHumanNativeScaleProfile.ts#IAutoMovieHumanNativeScaleProfile.IScale

## @evidence contracts/development/design.md#principled-representation

The call signature keeps every existing `scale` consumer; the members add the jet, the law's break stations and its constant value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Breaks let a source hold a knot where the quintic's third derivative jumps; constant lets a uniform scale keep its exact existing path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Constant is null unless every station reads the same value by construction, never by sampling.

## @evidence contracts/development/common.md#meaningful-documentation

Members state their station units and meaning.

# src/human/generation/conic/IAutoMovieHumanNativeScaleProfile.ts#IAutoMovieHumanNativeScaleProfile.ICentre

## @evidence contracts/development/design.md#principled-representation

The same value, first and second derivative record as a scale's jet, here in mm, mm per mm and mm per mm squared along chart u (first) and v (second).

## @evidence contracts/development/design.md#minimal-and-owned-surface

The jet feeds the product rule; the breaks let a source hold a knot where the line's third derivative jumps.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sampled table and no default line: an absent centre is the course, which the consumers express by passing none.

## @evidence contracts/development/common.md#meaningful-documentation

Members state their units and the continuity the breaks promise.
