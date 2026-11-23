# src/physics/IAutoMoviePhysicalBinding.ts#IAutoMoviePhysicalBinding

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Solver handles are transient and rebuilt in creation order after snapshot restore) and documents 26 documented members as stated in this comment.

## @evidence contracts/development/design.md#principled-representation

Represents Solver handles are transient and rebuilt in creation order after snapshot restore: interface of 26 members (`profiles`, `floor`, `bodies`, `joints`, `colliders`, `surfaces`, ...). Optional members `floor`, `geometry` express documented absence, and the ranges its member docs state are left to runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `IAutoMoviePhysicalBinding` in packages/engine/src/physics/IAutoMoviePhysicalBinding.ts; its surface is the 26 members listed and the text shows 17 other files naming it, mostly packages/engine (17), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; 2 optional members (`floor`, `geometry`) are independent fields rather than alternatives of one another as far as their docs state; it duplicates no type that another owner declares as far as a name search shows.
