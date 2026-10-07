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
- Create no nested skill directories or unreferenced examples. Use `agents/openai.yaml` only for an invocation policy required by the skill, such as disabling implicit invocation; keep operational rules in the skill body.

## Writing

- **Write a rule for a real need, with its reason.** Add an instruction because a run went wrong or a boundary needs a guard, and keep the reason when it prevents a plausible mistake. Leave out general coding, writing or craft teaching the agent already has, because it dilutes the rules that matter, and leave incident narratives, dated anecdotes and one campaign's counts to the issue or pull request that recorded them, because they go stale.
- **Keep what the reader cannot infer.** Units, frames, refusals, compatibility, authority, prerequisites and stop conditions stay even when the document gets longer; a shorter text that leaves them to inference is not concise.
- **Give each paragraph one job, and use structure.** Separate purpose, rule, reason, procedure and consequence. Use numbered lists for ordered procedures, bullets for choices, tables for repeated mappings and code blocks for exact commands.
- **State the rule before its reason.** Use negative phrasing only for a named failure the affirmative rule does not already exclude, because "X, not Y" leaves the reader to derive the instruction.
- **Separate requirements from defaults.** Mark what is mandatory and what is a starting point, and name the mode a rule applies to when modes differ.
- **Use one term per concept.** A second word for the same thing reads as a second thing.
- **Point instead of paraphrasing.** Link to the `.wiki/`, a README, source JSDoc or command help instead of restating it. A skill carries cross-cutting rules and conventions, not a second copy of project docs.
- **State the task, its acceptance condition and its finish line.** Leave the amount of reasoning to the agent and never ask it to write its reasoning into the response. Give a long task a checkable completion condition and a task list the agent updates; a turn that ends without a tool call is a report, so an instruction that lets the agent stop after reporting leaves work open. Name the specific early stops to avoid and the stops that are wanted, and the concrete patterns to avoid or produce, then check which ones the first result used, because the agent responds to named patterns and a general instruction mostly swaps one default for another.
- **Send the agent to the sources.** For a loosely specified task, name the places to look before acting, including ones the request does not mention, because the agent otherwise starts quickly and misses them.

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
