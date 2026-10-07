# Prose form

## Line breaks

Write each Markdown paragraph on one source line. Never hard-wrap a paragraph at a fixed column: Markdown already soft-wraps it, and manual wrapping makes a small edit reflow unrelated lines.

One source line does not mean one long paragraph. Insert a blank line whenever the idea changes, and keep structural line breaks for paragraphs, list items, headings, tables and fenced code.

Agent instructions have no repository-wide formatter. Inspect Markdown-only and agent-instruction diffs directly and run `git diff --check`. The pull-request skill owns the single source-formatting pass before an authorized merge.

## Voice

Plain and direct: state the fact and stop. Use the literal phrase where one exists, because a metaphor drags in connotations nobody chose. Write no em dash, emoji or spaced double hyphen in prose (CLI separators remain code), no promotional adjective, stock filler phrase or reflexive hedge, and no closing sentence that only restates the paragraph.

Apply these rules to prose you write or revise, and leave a corpus-wide re-voicing as its own topic, since rewriting a settled instruction for style alone risks changing what it requires.

Check these rules directly while reviewing instructions, package READMEs, scaffold Markdown and TypeScript comments. They stop at the shipped contract corpus under `packages/template/scaffold/docs`, where [screenplay naturalness](../../../packages/template/scaffold/.agents/skills/production-lifecycle/naturalness.md#qualified-complete-reading) owns authored language and forbids starting from a phrase list. Code syntax, literal values and quoted historical evidence keep their original meaning and are not prose to rewrite.
