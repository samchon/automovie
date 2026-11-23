# src/production/IAutoMovieShotBuildContext.ts#IAutoMovieShotBuildContext

## @evidence contracts/development/design.md#principled-representation

AutoMovieSubject and AutoMovieSubjectGroup receive this explicit context for their render contributions. The production assembler is retired, so the caller must provide consistent contract, model groups, world, derived payloads, compact runtimes and geometry helpers; this type does not verify their currentness or byte identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps authored design, model groups, compiled population runtimes and query helpers distinct so source can stage a thin program without reconstructing population placement or reading undeclared generated files.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readonly tables do not deeply freeze nested records, isolate arbitrary subject code or certify deterministic effects. No surviving production evaluator supplies an implicit current-input fence for this context; hosts own deterministic input preparation.

## @evidence contracts/development/common.md#meaningful-documentation

Defines design versus generated-runtime ownership, host-verification premises for artifact paths, optional story lighting and the compile-time-only readonly limitation.
