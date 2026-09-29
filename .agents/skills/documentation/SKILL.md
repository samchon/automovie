---
name: documentation
description: Defines the .wiki/ working knowledge base, package README, code JSDoc, and agent-instruction conventions for automovie. Use before writing or modifying docs, AGENTS.md, or a SKILL.md, and revise the wiki as the work proceeds, not at the end.
---

# Documentation

## The `.wiki/` knowledge base

`.wiki/` is gitignored, written in Korean and local to a checkout. It starts empty. Read what it holds at session start, create what it lacks, and revise it as the work proceeds instead of at the end.

Layout, created on demand: `00-governance` (operating manual, reading ledger), `01-progress` (current state, next priorities), `02-overview` (product), `03-philosophy` (the two harness articles and principles), `04-domain-research` (external study), `05-references` (agentica, autobe, interia), `06-architecture` (monorepo and per-package design), `07-decisions` (append-only decision log), `08-campaigns` (issue-campaign knowledge bases), `99-worklog` (dated logs).

- Record a design choice in `07-decisions/` the moment it is made. The log is append-only, and a later entry supersedes an earlier one.
- Record each user instruction in `99-worklog/` as a dated entry with its status (implemented, in progress, open). Keep a superseded instruction beside the one that replaces it.
- Update `01-progress/README.md` whenever a package or capability lands.
- Keep `06-architecture/` matching the code. A design doc precedes or accompanies a change to the rig or engine model.
- Separate confirmed fact (with file paths) from inference, and cite external sources by URL. References and domain study are evidence, not authority, so do not transplant them verbatim.

## Package READMEs

Each package's `README.md` is English and practical: what the package is, why it exists, its domain folders or public surface, and the conventions a contributor needs. It stands alone from the ignored `.wiki`, so it links durable architecture to committed requirements, specifications, JSDoc or another tracked owner and never to a private working path.

When a README falls inside a committed requirement or specification population, the [evidence graph skill](../evidence-graph/SKILL.md) owns its participation. Do not remove it from that population by filename while editing prose, and do not decide an evidence exclusion from documentation structure alone.

## Code JSDoc

Source JSDoc is English, in the interia voice: state what the type or function is and the non-obvious why (the design intent, the constraint it carries), not a paraphrase of the signature. Close interface types with `@author Samchon`. Examples in JSDoc are direction, not contract.

A public export in the committed contract graph keeps its citations under the [evidence graph skill](../evidence-graph/SKILL.md), which owns the cited layers and reachability. A declaration enrolled in a contracts claim answers its chapters under the [contracts skill](../contracts/SKILL.md), which owns the questions. This skill owns the prose and comment form of both.

### Source-file context

Every authored source file explains within itself enough for a reader to understand its purpose without the conversation or a private worklog. State:

- the module's responsibility, its entry points and consumers, inputs and outputs, ownership and mutation rules, and processing order with the reason for that order;
- for a declaration or data owner, its role, provenance, interpretation and consumers;
- units, coordinate frames, sign conventions, formula assumptions and degeneracies where they apply, and for other domains the corresponding state, protocol or execution assumptions;
- the non-obvious calculation with its derivation or source, beside the code that owns it;
- the invariants this module establishes, the preconditions its callers supply, and the limitations it does not solve;
- the downstream consequences of changing a shared result, including which derived data becomes stale.

A test or an external link adds evidence and never replaces this explanation. Keep shared contracts at their canonical owner: a caller states its role in that contract and links to the owner instead of copying it. The file explains its own responsibility and not every dependency's internals. The development skill's [Source file structure](../development/SKILL.md#source-file-structure) owns file size and decomposition, and when both obligations cannot fit, reduce responsibility and keep the explanation.

## Agent instructions

`AGENTS.md` and `SKILL.md` files are operational documents for humans and agents. `AGENTS.md ## Maintenance` decides where a rule belongs and this section decides how it is written. A revision reads as if it had always been there.

- **Optimize for comprehension.** A shorter document that makes the reader infer prerequisites, reasons, exceptions or stop conditions is not concise. Include the context needed to execute correctly.
- **Remove repetition and keep substance.** Keep the rationale when it prevents a plausible mistake.
- **Give each paragraph one job.** Split purpose, rule, rationale, procedure and consequence instead of making the reader separate a dense block.
- **Use structure as compression.** Numbered lists for ordered procedures, bullets for choices or checklists, tables for repeated mappings, code blocks for exact commands. Do not hide a workflow inside one long sentence.
- **State the rule before its reason.** Write what to do, then name the exclusion. Use negative phrasing only for a named failure mode the affirmative rule does not already exclude, because "X, not Y" and a heading built the same way state a contrast and leave the reader to derive the instruction.
- **Point instead of paraphrasing.** Do not restate what the `.wiki/`, a README or a source comment already says; link to it. A skill carries cross-cutting rules and conventions, not a second copy of project docs.
- **State the finish line.** Give a long task a completion condition the agent can check, and have the agent keep its parts in a list it updates. A turn that ends without a tool call is a report and proves nothing about the task, so an instruction that lets the agent stop after reporting leaves work open.
- **Name the specific stop or pattern.** The agent responds to instructions that name the early stops to avoid and the stops that are wanted. A general instruction such as "avoid a generic look" mostly swaps one default for another, so list the concrete patterns to avoid or produce and check which ones the first result used.
- **Give the task and its acceptance condition.** Leave the amount of reasoning to the agent. Do not tell it to think carefully or to write its reasoning into the response.
- **Send the agent to the sources.** For a loosely specified task, name the places to look before acting, including ones the request does not mention, because the agent otherwise starts quickly and misses information the request never pointed to.
- **Keep history out.** Write the rule and the reason that prevents a plausible mistake. An incident narrative, a dated anecdote or a count from one campaign goes stale, so leave it to the issue or pull request that recorded it.

## Instruction authority

Give every instruction one canonical semantic owner. Edit that owner first, then make every caller a link, a trigger or an exact handoff sentence that adds only the caller's context. Do not copy a completion condition into several owners.

Before creating, moving, splitting, renaming or editing an instruction, classify it as global behavior, a skill trigger, a shared procedure, a conditional phase, a product contract or working knowledge. Preserve the context, authority, stop conditions and failure guards it needs while removing ceremony and repeated conclusions.

A capability router belongs in `SKILL.md`. A substantial conditional phase belongs in one directly linked sibling document that owns one stage of one workflow, and a rule shared by every phase stays in the router. Create no nested skill directories, no `agents/openai.yaml` and no unreferenced examples or metadata.

| Instruction surface | Canonical ownership |
| --- | --- |
| Root `AGENTS.md` | The product identity, repository-wide attitude and the skill index. Its H2 surface is `Attitude`, `Skills` and `Maintenance`, and it restates no skill procedure. |
| Repository `.agents/skills/<name>/SKILL.md` | One concern's trigger, exclusions, shared invariants and direct routes. The directory and frontmatter `name` agree. |
| Documentation skill | Instruction classification, writing form, link integrity, package README and JSDoc form, the `.wiki/` record, and instruction-diff review. |
| Development skill | Source and test rules, consequence analysis, the changed-position coverage obligation, validation and change integrity. |
| Contracts skill | The implementation checklist chapters, and the rule that each question has exactly one chapter owner. |
| Review skill | Whole-surface, fresh-round review semantics and Self-Review. |
| Issue-campaign skill | Discovery, publication, dependency-ordered implementation, integration and completion in one checkout and one branch. |
| Pull-request skill | Branch, commit, push, check, merge and cleanup behavior. Other skills say when a remote action is due and link to it. |
| Scaffold skill and the scaffold's shipped skills | The generated project's contract and authoring doctrine. Repository instructions point to it and do not copy its production procedure. |
| Product contracts, package READMEs and public JSDoc | Product promises, system contracts, package use and public API meaning. Instructions route work to them and do not become a second contract corpus. |

Review every changed instruction literally against its linked callers and the implementation it describes. Check frontmatter, directory and `name` agreement, trigger scope, links, unique ownership, prose-line form, and contradictory or duplicate completion points. After the corrections stop, run two consecutive complete instruction-diff rounds with no finding and no edit before the final repository gates. This tightens the review skill's single clean round on purpose, because one instruction change alters every later run.

## Prose line breaks

Write each Markdown paragraph on one source line. Never hard-wrap a paragraph at a fixed column: Markdown already soft-wraps it, and manual wrapping makes a small edit reflow unrelated lines.

One source line does not mean one long paragraph. Insert a blank line whenever the idea changes, and keep structural line breaks for paragraphs, list items, headings, tables and fenced code.

Agent instructions have no repository-wide formatter. Inspect Markdown-only and agent-instruction diffs directly and run `git diff --check`. The pull-request skill owns the single source-formatting pass before an authorized merge.

## Voice

Plain and direct. State the fact and stop.

- No em dashes. Use a period, comma, colon or parentheses, whichever the sentence needs.
- No emoji.
- No spaced double hyphen in prose. CLI separators remain code.
- No filler adjectives: "powerful", "seamless", "robust", "effortless".
- No AI-cliche phrasing: "not only X but also Y", "whether you're X or Y", "it's worth noting", "let's dive in", "delve into", "leverage" for "use", and reflexive hedging.
- No wrap-up sentence that only restates the paragraph.
- No mannered prose. Use the literal phrase where one exists, writing "a parameter worth varying" and not "a dial worth turning", because metaphor drags in connotations nobody chose.

Apply the mannered-prose rule to prose you write or revise, and leave a corpus-wide re-voicing as its own topic, since rewriting a settled instruction for style alone risks changing what it requires.

Check these rules directly while reviewing instructions, package READMEs, scaffold Markdown and TypeScript comments. They stop at the shipped contract corpus under `packages/template/scaffold/docs`, where [screenplay naturalness](../../../packages/template/scaffold/.agents/skills/production-lifecycle/naturalness.md#qualified-complete-reading) owns authored language and forbids starting from a phrase list. Code syntax, literal values and quoted historical evidence keep their original meaning and are not prose to rewrite.
