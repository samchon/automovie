# src/cinematics/IAutoMovieGrammarDiagnostic.ts#IAutoMovieGrammarDiagnostic

## @evidence contracts/development/design.md#principled-representation

Each finding is a deterministic geometric measurement of camera and subject observations, and severity follows what the measurement can establish: a crossed action axis and a reversed screen direction are objective reversals of screen geography and are errors, the shot-size, jump-cut, eyeline and re-establishing checks are threshold heuristics and warn, and pacing is a statistic and advises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Fact, impact and recovery are separate strings so a consumer can file them in its own channel, as the builder and the review-note adapter both do, while `code` and `severity` stay machine-readable.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No finding is filtered by shot id or fixture; a deliberate break is excepted only through a declared style intent, which `readFilmGrammar` records as exercised.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and consumers, the severity of each family, which shot a finding is filed on, when `previousShot` is null, and what each text field contains.
