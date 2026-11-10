---
name: contracts-development
description: Maps the development checklists, common, design, implementation, testing, entities, behaviors and composition, onto the source declarations and tests that answer them in their doc comments. Use before writing or citing a development contract item.
---

# Development contracts

Every respondent here answers in its own doc comment, citing an item as `contracts/development/<file>.md#<anchor>`.

| Contract | Respondent |
| --- | --- |
| [Common](common.md) | Every exported declaration, tests included |
| [Design](design.md) | Each exported type, interface, type alias and class |
| [Implementation](implementation.md) | Each exported function and class method |
| [Testing](testing.md) | Each exported test function |
| [Entities](entities.md) | Each exported declaration under `src/entities/`, which also names the settings facts it realizes and the research its measurements follow |
| [Behaviors](behaviors.md) | Each exported function and method under `src/laws/`, `src/interactions/` and `src/consequences/`, which also cites the research it follows |
| [Composition](composition.md) | Each exported function and method under `src/composition/`, which also cites the screenplay scenes, beats or file it realizes |

Common, design, implementation and testing are AutoMovie's shared engineering checklists. Entities, behaviors and composition belong to productions and follow the chain [source layout](../../development/layout.md) draws from settings and research through the screenplay to code. An `@evidence` tag resolves only to a contract item or to the research or screenplay its contract cites; name any other document a declaration follows by its path and anchor in an answer's prose, because Evidence rejects a tag whose target its claim does not select.
