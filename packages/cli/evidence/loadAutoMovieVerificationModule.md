# src/loadAutoMovieVerificationModule.ts#loadAutoMovieVerificationModule

## @evidence contracts/development/common.md#meaningful-documentation

Defines the verification entry, native source observation and separately selectable defining modules.

## @evidence contracts/development/implementation.md#principled-implementation

The ESM bridge preserves native import from the CommonJS CLI build so source observation follows the module's evaluation path. The synchronous Node resolver and loader report local import edges and loaded bytes. CommonJS children fill cached edges omitted by native hooks. Current bytes of the active definition graph are checked before target selection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Node owns ordinary resolution and evaluation. The verification hook adds a project-local TypeScript fallback and reports source provenance to the shared evaluator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing source observation or previously cached module cannot establish the active definitions. Native import reports no load for a cached ES module. Verification refuses local ES modules loaded through CommonJS require because it can report fresh bytes before returning an earlier evaluation. A narrowed measurement scope names an observed module reached by the native load.

## @evidence contracts/development/implementation.md#efficient-algorithms

Observes loaded local files and their edges without compiling a project or enumerating unimported sources. Native canonical names and a bounded TypeScript fallback preserve project-local resolution without traversing installed packages.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each reachable source appears once in the selected graph. The same observations can serve multiple checks during the command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The synchronous hooks are released when module loading ends. The command retains relative source identities, their digests and their import edges.
