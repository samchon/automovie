# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal

## @evidence contracts/development/common.md#meaningful-documentation

States who reads a refusal, that its facts are fields, and that it never depends on the seed.

## @evidence contracts/development/design.md#principled-representation

One error class whose fields are the refusal contract of #3375 applied to objects: a closed kind, the axis, the given value and a feasible set that is a range or a list.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The archetypes own it because `motions`, which owns `HumanRefusal`, is not a dependency of this package; every producer, accessor and articulation raises it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The feasible set is a discriminated union, so a range never carries alternatives.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.describe

## @evidence contracts/development/common.md#meaningful-documentation

States both forms and the empty list's text.

## @evidence contracts/development/implementation.md#principled-implementation

String composition over the two members of the union.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Numbers are printed as given, never rounded into a different bound.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per listed value.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

What a refusal is about, as a closed union of literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; set at every throw site of the package and read by an author's handler.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.Feasible

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

What an axis accepts instead: a numeric range or a list of alternatives, discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; a member of every refusal's facts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A discriminated union, so a range cannot carry values nor a list bounds.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IRange

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

A numeric range in a stated unit; an end without a limit is null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; written by parameter and articulation refusals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Open ends are null, not sentinel numbers.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IAlternatives

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The values that would have been accepted, as the author writes them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; written by refusals of an id or of a closed choice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/core/AutoMovieArchetypeRefusal.ts#AutoMovieArchetypeRefusal.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The facts of one refusal: its kind, the archetype's name, the axis at fault, the value given, what is feasible, why, and one sentence of repair.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the constructor's only argument, each member published on the error.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None beyond what each member's own comment states.
