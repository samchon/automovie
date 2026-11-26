---
name: development
description: Repairs, implements, tests and validates automovie source.
---

# Development

Apply these rules to source, tests, workflows and package wiring.

| Read | For |
| --- | --- |
| [Repair](repair.md) | Changing existing behavior |
| [Testing](testing.md) | Adding or changing tests |
| [Validation](validation.md) | Running checks or finishing a change |

## Contracts

Every maintained declaration answers the checklists its package selects, as [contracts](../contracts/SKILL.md) sets. `human` selects none until its rebuild declares completion, then its production checklists at once.

## Source style

### Public API

Expose supported runtime APIs at the package boundary only through cohesive namespaces or classes. Use a class when instances own state, identity or a lifetime. Give related operations one owner and place functions and constants under it. Export a namespace as a non-callable value.

Name each public runtime owner in PascalCase as `AutoMovie<Package><Concept>` when the package owns the concept. Use `AutoMovieEngine<Concept>` in `engine`, `AutoMovieArchetype<Asset>.create` for archetype factories, and `AutoMovieMotionHuman<Family>` for Human motion families. Use camelCase operation names. Preserve the original owner and name when re-exporting another package's API.

Put the public owner at the top of its topic folder and its implementation in a topic-local internal or focused child folder. Declare supported entry points explicitly in the package manifest and select their exports in their barrels. Keep workspace-only entry points out of the published API. Have implementation modules import concrete dependencies directly, with calls from the public owner toward the implementation.

### Types and files

Annotate variables, parameters and return types wherever TypeScript allows it.

Use `function` or `export function` for named functions. Write parameter and return annotations once on the declaration. Use arrow functions for anonymous callbacks and function values that need lexical capture.

A package source file exports one symbol named after it, barrels excepted. Split files by responsibility. Keep helpers used by one file private. Give shared internal functions descriptive camelCase names and explicit parameters or context.

Name canonical object contracts and unions `IAutoMovie*` and scalar, literal, tuple and utility aliases `AutoMovie*`. Give object shapes named declarations and keep type-only namespace members short. Use named variants with a literal `type` discriminant for distinct states. Switch exhaustively on that discriminant. Validate raw data at entry and normalize supported legacy forms once before passing typed variants inward.

Use `const enum` for interface enums and verify their behavior in emit and at consumers.

### Comments and layout

After imports, put all exported declarations and export statements above private declarations. Include type exports, re-exports and workspace-only exports. Apply the same order to namespace members. Preserve relative order within each group and keep overloads together.

Preserve module initialization order when moving declarations. Move a private dependency that must initialize before an export into a topic-local internal module and import it. Verify evaluation order and import cycles after the move.

Give every declaration a JSDoc comment, including each reachable public member and declarations in packages that select no checklist. State the inputs, guarantees and relevant failure or lifetime conditions at the owning declaration. Follow [Meaningful documentation](../contracts/development/common.md#meaningful-documentation).

Separate logical steps with blank lines. Explain each non-obvious step's intent or premise.

Within a block, precede each comment with a blank line unless it opens the block.

## Packages

Check all new imports and dependencies against the [package boundaries](../project/SKILL.md#packages). Ship a public producer with its consumer.

Put independently meaningful shared data, request, result and callback contracts in `interface`. Import an existing type from its owner and use it directly. When reversing a package dependency would create a cycle, give the consuming operation an explicit callback for the input and output it needs. Supply the implementation at the composition boundary. Keep a callback type with its consumer when only that operation needs it. Define boundary contracts by meaning instead of mirroring an implementation or extracting its signature with `Pick`, `Parameters` or `ReturnType`.

In `interface`, use plain `string` and `number` and explicitly export types. Document units, frames, ranges and the runtime admission owner. Leave validator metadata and implementation dependencies with that owner.

Compare purpose, units, frames, clocks, defaults, precision, state and refusals before consolidating equivalent work. Reuse the canonical computation and keep caller-specific policy with its caller. Consuming packages delegate shared computation owned by `engine` to that package.

## Specification

Tests, CI, wiring, dependencies, `interface` core types, and the range-of-motion and constraint tables are specification. Change them only on request or for a product reason, and say so.

## Scripts and shared checkouts

### Tracked code

Use tracked TypeScript for helper scripts. Use `ttsx` for authorized checks. A syntax-only helper or build config that cannot depend on a compiler uses `.mts` and runs on Node.

Keep experiments in tracked tests or debug tools, or use a type check. Use ignored paths only for captured evidence and data.

### Processes

Stop one-off processes after reading their results. Preserve shared servers and checkers.

Share one viewer per package. Request one frame at a time. Restart only with an empty queue.

### Several agents in one checkout

Give each worker a separate scratch directory. Delete only within your own. Stage and commit only your paths with `git add` and `git commit --only <paths>`.
