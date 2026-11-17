---
name: contracts-development
description: Maps the development checklists, common, design, implementation, testing, entities, behaviors and composition, onto the source declarations and tests that answer them in their doc comments. Use before writing or citing a development contract item.
---

# Development contracts

Every respondent here is an exported declaration that answers in its own doc comment, citing an item as `contracts/development/<file>.md#<anchor>`.

| Contract | Respondent |
| --- | --- |
| [Common](common.md) | Every declaration, tests included |
| [Design](design.md) | Each type, interface, type alias and class |
| [Implementation](implementation.md) | Each function and class method |
| [Testing](testing.md) | Each test function |
| [Entities](entities.md) | Each declaration under `src/entities/` |
| [Behaviors](behaviors.md) | Each function and method under `src/laws/`, `src/interactions/` and `src/consequences/` |
| [Composition](composition.md) | Each function and method under `src/composition/` |

Common, design, implementation and testing are shared engineering checklists, and each item ends by saying what its answer states. Entities, behaviors and composition are the production's own: they follow the chain from settings or brief through the screenplay to code, keep their detail in the statements file each links, and say what their respondents cite.

An `@evidence` tag resolves only to a contract item or to the screenplay or instruction section its contract cites, because Evidence rejects a tag whose target its claim does not select. Name any other document a declaration follows by its path and anchor in the answer's prose.
