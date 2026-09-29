# Agent instructions

`AGENTS.md` and `SKILL.md` files are operational documents for humans and agents. A revision reads as if it had always been there.

## How the harnesses load them

- Codex reads `AGENTS.md` up to 32 KiB and lists the `name` and `description` of every `SKILL.md`, so the frontmatter is the trigger.
- Claude Code loads `AGENTS.md` through `CLAUDE.md` and reaches a skill only through a link there. Keep `AGENTS.md` under 200 lines so the portal stays read in full.
- Both harnesses load a sibling document only when a skill links it with a read condition.

## Skill layout

- Put a skill at `.agents/skills/<kebab-name>/SKILL.md` with plain descriptive headings and no numeric prefix.
- Match the frontmatter `name` to the directory, and write a third-person `description` that states what the skill covers, when to use it and its exclusions.
- Make the `AGENTS.md` pointer mirror that scope more briefly, and correct the description first when the scope changes.
- Put always-applicable procedure in `SKILL.md`. Put a topic needed only under a condition in one directly linked sibling document, one level deep, with its read condition.
- Add a skill when a concern would otherwise inflate `AGENTS.md`, and merge skills that share most of their structure.
- Create no nested skill directories, no `agents/openai.yaml` and no unreferenced examples or metadata.

## Writing

- **Add a rule for a real need.** Write an instruction because a run went wrong or a boundary needs a guard. A rule with no observed need is length that dilutes the ones that matter.
- **Optimize for comprehension.** A shorter document that makes the reader infer prerequisites, reasons, exceptions or stop conditions is not concise. Include the context needed to execute correctly.
- **Remove repetition and keep substance.** Keep the rationale when it prevents a plausible mistake.
- **Give each paragraph one job.** Split purpose, rule, rationale, procedure and consequence instead of making the reader separate a dense block.
- **Use structure as compression.** Numbered lists for ordered procedures, bullets for choices or checklists, tables for repeated mappings, code blocks for exact commands. Do not hide a workflow inside one long sentence.
- **State the rule before its reason.** Write what to do, then name the exclusion. Use negative phrasing only for a named failure mode the affirmative rule does not already exclude, because "X, not Y" and a heading built the same way state a contrast and leave the reader to derive the instruction.
- **Separate requirements from defaults.** Mark what is mandatory and what is a starting point, and name the mode a rule applies to when it differs between modes.
- **Use one term per concept.** A second word for the same thing reads as a second thing.
- **Point instead of paraphrasing.** Do not restate what the `.wiki/`, a README or a source comment already says; link to it. A skill carries cross-cutting rules and conventions, not a second copy of project docs.
- **State the finish line.** Give a long task a completion condition the agent can check, and have the agent keep its parts in a list it updates. A turn that ends without a tool call is a report and proves nothing about the task, so an instruction that lets the agent stop after reporting leaves work open.
- **Name the specific stop or pattern.** The agent responds to instructions that name the early stops to avoid and the stops that are wanted. A general instruction such as "avoid a generic look" mostly swaps one default for another, so list the concrete patterns to avoid or produce and check which ones the first result used.
- **Give the task and its acceptance condition.** Leave the amount of reasoning to the agent. Do not tell it to think carefully or to write its reasoning into the response.
- **Send the agent to the sources.** For a loosely specified task, name the places to look before acting, including ones the request does not mention, because the agent otherwise starts quickly and misses information the request never pointed to.
- **Keep history out.** Write the rule and the reason that prevents a plausible mistake. An incident narrative, a dated anecdote or a count from one campaign goes stale, so leave it to the issue or pull request that recorded it.

## Authority

Give every instruction one canonical semantic owner. Edit that owner first, then make every caller a link, a trigger or an exact handoff sentence that adds only the caller's context. Do not copy a completion condition into several owners.

Before creating, moving, splitting, renaming or editing an instruction, classify it as global behavior, a skill trigger, a shared procedure, a conditional phase, a product contract or working knowledge. Preserve the context, authority, stop conditions and failure guards it needs while removing ceremony and repeated conclusions.

A capability router belongs in `SKILL.md`, and a rule shared by every phase stays there.

| Instruction surface | Canonical ownership |
| --- | --- |
| Root `AGENTS.md` | The product identity, repository-wide attitude and the skill index. Its H2 surface is `Attitude`, `Skills` and `Maintenance`, and it restates no skill procedure. |
| Repository `.agents/skills/<name>/SKILL.md` | One concern's trigger, exclusions, shared invariants and direct routes. The directory and frontmatter `name` agree. |
| Documentation skill | Instruction classification, layout and writing form, link integrity, package README and JSDoc form, the `.wiki/` record, and instruction-diff review. |
| Development skill | Source and test rules, consequence analysis, the changed-position coverage obligation, validation and change integrity. |
| Contracts skill | The implementation checklist chapters, and the rule that each question has exactly one chapter owner. |
| Review skill | Whole-surface, fresh-round review semantics and Self-Review. |
| Issue-campaign skill | Discovery, publication, dependency-ordered implementation, integration and completion in one checkout and one branch. |
| Pull-request skill | Branch, commit, push, check, merge and cleanup behavior. Other skills say when a remote action is due and link to it. |
| Scaffold skill and the scaffold's shipped skills | The generated project's contract and authoring doctrine. Repository instructions point to it and do not copy its production procedure. |
| Product contracts, package READMEs and public JSDoc | Product promises, system contracts, package use and public API meaning. Instructions route work to them and do not become a second contract corpus. |

## Review gate

Review every changed instruction literally against its linked callers and the implementation it describes. Check frontmatter, directory and `name` agreement, trigger scope, links, unique ownership, prose-line form, and contradictory or duplicate completion points.

After the corrections stop, run two consecutive complete instruction-diff rounds with no finding and no edit before the final repository gates. This tightens the review skill's single clean round on purpose, because one instruction change alters every later run.

When the change alters how an agent behaves, start a fresh session on a task the rule governs and check that the agent follows it. Reading the text proves the wording and never the behavior.
