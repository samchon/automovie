---
name: contracts-development
description: Maps the development checklists, common, design, implementation, assets, motion, shots and testing, onto the source declarations and tests that answer them in their doc comments. Use before writing or citing a development contract item.
---

# Development contracts

Every respondent here answers in its own doc comment, citing an item as `contracts/development/<file>.md#<anchor>`.

| Contract | Respondent |
| --- | --- |
| [Common](common.md) | Every exported declaration, tests included |
| [Design](design.md) | Each exported type, interface, type alias and class |
| [Implementation](implementation.md) | Each exported function and class method |
| [Assets](assets.md) | Each exported function under `src/assets/`, at the path of the settings record it realizes |
| [Motion](motion.md) | Each exported function under `src/motion/`, which also cites the performance study it follows |
| [Shots](shots.md) | Each exported function under `src/shots/<film>/<scene>/`, which also cites the screenplay H2s it executes |
| [Films](films.md) | Each exported function under `src/films/`, which also cites the screenplay file it delivers |
| [Testing](testing.md) | Each exported test function |

Common, design, implementation and testing are the repository's own checklists, shared through `$` placeholders. Assets, motion, shots and films belong to productions: each source folder answers the contract of the [story](../story/SKILL.md) document it realizes, under [source layout](../../development/layout.md). Every study is followed by some motion function, every screenplay H2 is executed by some shot function and every screenplay file is delivered by some film.
