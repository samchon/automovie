# Package READMEs and code documentation

## Package READMEs

Each package's `README.md` is English and practical: what the package is, why it exists, its domain folders or public surface, and the conventions a contributor needs. It stands alone from the ignored `.wiki`, so it links durable architecture to committed requirements, specifications, JSDoc or another tracked owner and never to a private working path.

When a README falls inside a committed requirement or specification population, the [evidence graph skill](../evidence-graph/SKILL.md) owns its participation. Do not remove it from that population by filename while editing prose, and do not decide an evidence exclusion from documentation structure alone.

## Code JSDoc

Source JSDoc is English, in the interia voice: state what the type or function is and the non-obvious why (the design intent, the constraint it carries), not a paraphrase of the signature. Close interface types with `@author Samchon`. Examples in JSDoc are direction, not contract.

A public export in the committed contract graph keeps its citations under the [evidence graph skill](../evidence-graph/SKILL.md), which owns the cited layers and reachability. A declaration enrolled in a contracts claim answers its chapters under the [contracts skill](../contracts/SKILL.md), which owns the questions. This skill owns the prose and comment form of both.

## Source-file context

Every authored source file explains its responsibility without relying on the conversation or a private worklog. Put the explanation at the owning declaration or calculation, using only the facts its responsibility needs:

- public input meaning, ownership, mutations, failure effects and nonobvious processing order;
- units, frames, signs, state or protocol assumptions, and numerical degeneracies where applicable;
- the derivation or source of a nonobvious value or calculation, its supported conditions and limitations;
- shared-result ownership and the downstream derivatives or observations a change invalidates.

A test or an external link adds evidence and never replaces this explanation. Keep shared contracts at their canonical owner: a caller states its role in that contract and links to the owner instead of copying it. The file explains its own responsibility and not every dependency's internals. The development skill's [Source file structure](../development/SKILL.md#source-file-structure) owns file size and decomposition, and when both obligations cannot fit, reduce responsibility and keep the explanation.
