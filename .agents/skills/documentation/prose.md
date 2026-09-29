# Prose form

## Line breaks

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
