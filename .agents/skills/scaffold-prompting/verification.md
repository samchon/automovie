# Verification

Prompting's [verification](../prompting/SKILL.md#verification) holds for a scaffold change. The scaffold adds three checks: what actually ships, how a production agent behaves with it, and what a task reads.

## Distribution

Follow each changed rule from its entry point to the task, contract, repair owner and handoff that use it. When the change alters what ships, inspect the file map `createAutoMovieScaffold` returns, with its substitutions and the shared resources the changed links reach. A Markdown-only change needs these checks and a review of its consumers, not a new test or a generated production.

Untracked files under the scaffold folder still ship, so remove stale copies from the checkout first. Changed program behavior takes development's checks. For changed installation behavior, observe a generated project's installed entry point and its `lint`, `evidence` and `test` commands.

Scaffold edits reach only new installations. An authorized update of an existing production is a deliberate change to that project: compare the scaffold with its actual files, keep its choices and custom contracts, and follow its own repair rules for the answers and reviews the change touches. Do not infer renewed approval from new wording or overwrite a repaired body with an old edition.

## Behavior

Give a separate agent session real tasks the change governs, with the shipped instructions and raw inputs only, withholding the change's intent and any earlier verdict. Choose contrasting cases, such as a screenplay scene on the short route, a whole motion hint, a commissioned generated film, a direct 3D film or a generation request. Record which pages it opened, what it produced, and where it had to guess, and repair the text behind each guess and each page it read without need. A review round's reviewer is the exception to withholding verdicts, because [review](../review/SKILL.md) gives it the decisions earlier rounds settled.

For a changed expression criterion, also test an informative but ineffective passage and a deliberate restrained form against [creation and judgment](task-design.md#creation-and-judgment), and confirm that the question of the item holding the criterion catches what the production's independent classification alone misses.

## Reading cost

Measure the [reading cost](layout.md#reading-cost) of the same tasks before and after the change, and judge it as that section sets.

## Report

Report distribution, behavior, reading cost and actual media results as separate categories. A static comparison does not prove better storytelling, a clean classification does not approve the experience, and an instruction-only change does not verify an unrendered film.
