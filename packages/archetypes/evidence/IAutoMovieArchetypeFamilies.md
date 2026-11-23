# src/IAutoMovieArchetypeFamilies.ts#IAutoMovieArchetypeFamilies

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is: the module behind one package subpath.

## @evidence contracts/development/design.md#principled-representation

One member per model-producing subpath, typed as that subpath's module, so a family cannot hold a producer its subpath does not export.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type of `ARCHETYPE_FAMILIES`, read by the object gallery and the family spec; `environments` builds places, not models, and is not a member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No string-keyed record: a missing or misspelt family fails the type check. It is an object type rather than an interface so the gallery can read it as a record of modules by name.
