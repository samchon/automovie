---
name: contracts-development
description: Maps the development checklists onto the declarations that answer them.
---

# Development contracts

Every respondent here is an exported declaration that answers in its own doc comment, citing an item as `contracts/development/<file>.md#<anchor>`.

| Contract | Respondent |
| --- | --- |
| [Common](common.md) | Every declaration outside `src/composition/`, tests included |
| [Design](design.md) | Each type, interface, type alias and class |
| [Implementation](implementation.md) | Each function and class method |
| [Testing](testing.md) | Each test function |
| [Entities](entities.md) | Each declaration under `src/entities/` |
| [Behaviors](behaviors.md) | Each function and method under `src/laws/`, `src/interactions/` and `src/consequences/` |
| [Catalog](catalog.md) | Each function and method under `src/composition/scenes/catalog/` and in `src/composition/films/catalog.ts` |
| [Composition](composition.md) | Each function and method of a screenplay scene in `src/composition/scenes/` |
| [Films](films.md) | Each function and method of a screenplay film in `src/composition/films/` |

Use `@evidence` for selected contract items, subject records, screenplay sections or instructions. Cite other documents by path and anchor in the answer text.
