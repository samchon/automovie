---
name: development
description: Defines automovie implementation rules, testing standards (pure unit tests under 500 ms, every branch a change writes covered), validation, consequence analysis, and change integrity. Use before writing or modifying source, tests, workflows, package wiring, or fixtures.
---

# Development

## Forbidden

Choosing any of these three means the approach is already wrong.

- **No shortcut in place of the implementation.** Hardcoding, monkey patching and test-only logic are defined in the contracts skill's [Prohibited Implementation Shortcuts](../contracts/common.md#prohibited-implementation-shortcuts) chapter. Fix the general logic against the real requirement.
- **No forcing a broken design.** When one failure returns under patch after patch, the design is wrong. Stop, find the root cause and fix the design.
- **No whack-a-mole.** Do not patch the one case that surfaced. Seal the whole class it belongs to under [Consequence Analysis](#consequence-analysis).

## Work Rules

- **Match existing conventions.** Before adding a file, type or test, open a nearby peer and mirror its naming, location and style, so no second structure appears.
- **Respect package boundaries.** `three.js` is imported only inside `viewer` among the library packages (`playground` imports it to mount the viewer). Computation flows through `engine`. `production` orchestrates `interface`, `engine`, `evidence` and `render`. The authoring surface is the generated project's tracked instructions and scripts plus the `cli` scaffolder. `@automovie/mcp` only reads authored Markdown references and holds no authoring, execution, evidence-judgment or production-action tool. No test enforces these boundaries, so review reads them.
- **Rough types in `interface`.** The package is pure types with no runtime dependency, because it is the AST the LLM emits against. Primitives are plain `string` and `number`: no wrapper aliases such as `AutoMovieUuid` and no `typia` tag constraints (`Minimum`, `MinItems`, `Format`). Units and ranges are documented in field JSDoc and enforced at runtime by `engine` validators, which is where the range-of-motion differentiator lives. The only structural constraints are closed `AutoMovie*` unions (bone names, ARKit channels, presets, easing), which are allowed-value sets and not wrappers.
- **Keep changes surgical.** Touch only what the request and the verified consequence surface require. Edit the lines that change instead of rewriting a file, unless the file is short or mostly moving: a rewrite yields the same result at more output and buries the real change in the diff.
- **Batch independent work.** Issue independent reads, searches and checks together. Walking a package file by file returns the same information at a multiple of the wall clock.
- **Preserve committed traceability.** When you change a public export, update its direct requirement and specification citations with the implementation and validate the affected triangle under the [evidence graph skill](../evidence-graph/SKILL.md).
- **A producer lands with the consumer that calls it.** A validated, fully covered solver that no product path reaches is public surface with maintenance cost and no effect on any frame. Wire it to its consumer in the same change, register it on a reviewed package README or the shipped authoring skill, or mark a deliberately early API `@publicUnconsumed <planned consumer>: <reason>`, naming a concrete future component and why the API must land first (`none`, `unknown` and `TBD` are invalid). Test-only reach never counts as wiring. Self-Review traces each new public callable to its consumer, document or valid declaration.
- **Break one guard at a time and keep the tree safe.** Disabling a guard to prove a scenario fails is required, because it is the only way to know a green suite measures anything.
  1. Hold one break at a time, and never leave one across a step you might not return from: a session limit can end the work mid-flip and leave code that compiles, passes most tests and reads as ordinary work.
  2. Flip one condition, run the one scenario it pins, and restore it by edit. `git checkout` is no restore, because it discards other uncommitted work in the tree.
  3. Judge the flip by which assertion failed, not by the run failing: the runner type-checks first, so a flip that changes a type exits non-zero having executed nothing.
  4. Remove the asserted refusal's cause instead of moving it. Widening a guard while a scenario still trips another one leaves the guard looking armed with nothing tested.
  5. When no flip compiles, the invariant is type-enforced. Record that and arm the assertion from the input side, and do not reshape the type into runtime branches to make a flip possible.
  6. Before any commit, read `git status` and `git diff` instead of trusting memory of what you changed.
- **A configured check is not running until it has been made to fail.** A guard configured by a selector may never have been armed and reports the same green either way: an evidence claim whose selector matched no host once passed with every required citation deleted. When you add or inherit a lint rule, evidence claim, coverage threshold or CI job, delete what it should catch and watch it go red, and count what a population check selected. Read a gate by its exit code and its own output, never by a number derived from it.
- **Update the matching `.wiki/` doc in the same change** when behavior, architecture or a decision changes, under the [documentation skill](../documentation/SKILL.md).

## Source file structure

Every authored source file is at most 500 physical lines, comments and blank lines included. This covers library code, application code, scripts, tests and files holding only declarations or authored data. Do not compress statements, remove necessary explanation, change formatting or move logic into nominal data files to evade the limit.

Split by cohesive responsibility and explicit inputs and outputs. Keep one owner for each formula, boundary and mutable state transition, with a small orchestrator naming their order. A forwarding chain that only redistributes lines establishes no responsibility. Preserve public behavior and the real consumer path during a split, and apply the per-change test obligation to the extracted code.

Each file also owes the documentation skill's [Source-file context](../documentation/SKILL.md#source-file-context), and the size limit never excuses missing context. An existing oversized file is an unresolved violation, not a precedent: name it in the task's consequence surface and do not report that surface compliant until it is resolved.

## Implementation strategy

When you choose among uncertain implementation methods or revisit repeated failed corrections, apply the shared [implementation strategy procedure](../../../packages/template/scaffold/.agents/skills/source-authoring/implementation-strategy.md). For repository development, committed requirements and specifications own the intended behavior, `.wiki/` records research and decisions, this skill owns implementation and testing, and the review and pull-request skills own review and delivery.

## Consequence Analysis

Treat a reported example as one witness of a cause. Before changing code, trace the same cause through:

- every caller and downstream consumer, including generated-project scripts and the viewer's projection of engine output;
- normal, error and recovery state transitions;
- sampling, caching and determinism (the same inputs always yield the same frames);
- Windows and POSIX behavior;
- compatibility constraints and boundary inputs.

Fix the verified class of failure, and cover positive, negative and boundary cases without expanding the user's product goal.

## Testing

Tests are `@nestia/e2e` `DynamicExecutor` cases under `test/src/features/<domain>/`. Write one scenario per file, with the exported `test_<snake_case>` matching the file name. Builders and boolean predicates live under `features/internal/` (`createSkeleton`, `joint`, `makeMotion`, `hasViolation`, `vclose`, `qclose`); do not reach into another concern's internals.

Only unit and logic tests belong in this repository. Exercise a function or module through its typed inputs and observable result, including positive, negative and boundary behavior. Do not install a generated project, launch a CLI or child process, reproduce operating-system or filesystem semantics, or keep an end-to-end scenario whose cost does not prove product logic. The repository has no fixture project and no helper that writes one to a temporary directory. A branch reachable only by compiling a whole project belongs to a function not yet separated out, and the fix is that separation.

Every test function finishes in under 500 ms, without exception. The runner prints each scenario's elapsed time, and an over-budget scenario is deleted or rewritten against a smaller unit, however much it proves. Every test is a scenario under `test/src/features/`, and package-local test directories do not exist.

A test never encodes the current repository shape or implementation text. It must not read source, `package.json`, workflow YAML, configuration bytes, line counts, export spellings or a generated file to compare them with literals copied from the same implementation. Expected values come from the product contract, a specification or an independent calculation. A test whose only update path is copying the implementation's new output does not qualify.

Assert with `TestValidator.equals(title, actual, expected)` for exact values and `TestValidator.predicate(title, <boolean>)` for floats, building the boolean with `nclose`, `vclose` or `qclose` and never with deep equality on floats. Code JSDoc is English in the interia voice: a contract paragraph (what the test pins and why) followed by a numbered `Scenarios:` list naming each experiment's inputs, expected result and the branch it guards.

Run with `pnpm --filter @automovie/test start`, and type-check with `pnpm --filter @automovie/test build`. The suite itself runs straight through `ttsx` with no emitted compile step.

A case that arranges its own subject must fail when the arrangement fails. Build the subject through typed in-memory inputs and confirm the intended state before asserting its outcome, because a negative twin that never changes the relevant input tests the happy path again. Use no source-rewriting probes or source-digest snapshots for this.

Wire a measurement to a check. A defect count nothing gates drifts back up after being paid down. When you build the measure, connect it to a check in the same change and fix the total, not a per-file exemption list, because an exemption list never shrinks.

## Coverage is 100% on what you write

Every executable position on a line a change writes is exercised by a unit test on statements, branches, functions and lines. The obligation is per change and does not bend to difficulty. A new file is every line of it, and inherited gaps in files a change did not touch are their own work.

A change's size, reversibility or mechanical nature never reduces the obligation, whatever general advice says about scaling test volume to risk. Keep each case focused on one behavior and sized like its neighbours, and keep scratch checks out of the committed suite. A negative twin, an opposite branch arm and a boundary are three tests.

The repository has no coverage instrument or gate. The change's tests meet the obligation and the reviewer verifies it by reading the diff beside them. When a unit is too large to see that every branch is reached, split it into functions whose inputs a test can construct in memory.

Reaching every line is not correctness, and 100% is earned by testing, not by hiding code:

- **A negative twin for every positive.** Wherever a validator fires (range of motion, range, temporal, type), pin an adjacent case one property away where it must not fire, because an over-match stays invisible until the counter-example exists.
- **Both sides of every branch.** Exercise each side of a `?? null`, an `if` and a discriminated-union arm with a real input (asymmetric keyframes, opposite-hemisphere slerp, a non-box primitive, a skeletonless model).
- **Boundaries.** The empty case, the single element, the exact limit, the immobile axis, the degenerate or zero input.
- **Oracle-derived expectations.** Take expected numbers from the specification or hand math. A snapshot of the code's own output locks its bugs in.

Remove a genuinely unreachable defensive branch by refactoring (drop a dead lookup, document a precondition) instead of excusing it.

## Validation

Run the narrowest command that proves the change first, then a broader one when shared behavior or packaging changed. Report any command that could not be run.

- **Bug fix**: name the failing case and expected behavior, and add a repro test that fails before the fix and passes after.
- **Feature**: name the observable behavior and exercise it through its real consumer path; verify a render or viewer change visually under the [viewer-verification skill](../viewer-verification/SKILL.md).
- **Refactor**: name what stays unchanged, and rely on the suite or a behavior-locking probe.

## Change Integrity

Tests, fixtures, CI workflows, package wiring, dependencies, the `interface` core types and the range-of-motion and constraint tables are part of the specification. Changing them needs an explicit user request or a clear product reason, and the final report calls it out. For a broad rewrite such as generalizing the rig model, preserve existing public behavior in reviewable slices and inspect the diff before trusting a green run.
