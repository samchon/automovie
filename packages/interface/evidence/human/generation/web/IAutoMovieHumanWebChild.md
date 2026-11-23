# src/human/generation/web/IAutoMovieHumanWebChild.ts#IAutoMovieHumanWebChild

## @evidence contracts/development/common.md#meaningful-documentation

A web's column down one child: from the crest to the child's section along the web's own separatrix.

## @evidence contracts/development/design.md#principled-representation `phi`: Phase where it meets the child's section. `q`: The point where it meets the child's section, mm. `d`: The child's inward direction there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanWebMesh.own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `phi`, `q`, `d`, `eta`, `xi`, `depth`, `own`, `rows`, `beside`; callers supply the complete record.

# src/human/generation/web/IAutoMovieHumanWebChild.ts#IAutoMovieHumanWebChild.IBeside

## @evidence contracts/development/common.md#meaningful-documentation

The column law beside a web on one side of the child.

## @evidence contracts/development/design.md#principled-representation `side`: Which side of the web, -1 at the first pinch's side. `law`: The plain column at a chart distance from the pinch, margin radii. `reach`: The greatest chart distance the law serves before the next web's columns, margin radii.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanWebColumns.besides, AutoMovieHumanWebColumns.list.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `side`, `law`, `reach`; callers supply the complete record.

# src/human/generation/web/IAutoMovieHumanWebChild.ts#IAutoMovieHumanWebChild.Plain

## @evidence contracts/development/common.md#meaningful-documentation

A column away from the pinches.

## @evidence contracts/development/design.md#principled-representation

A column away from the pinches. Extract< IAutoMovieHumanWebColumn, { kind: "plain"; } > retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanWebChild.Plain is the canonical exchange used by IAutoMovieHumanWebChild.IBeside.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by IAutoMovieHumanWebChild.IBeside for a column away from the pinches.
