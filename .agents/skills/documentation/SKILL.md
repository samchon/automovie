---
name: documentation
description: Owns automovie's writing rules for READMEs, JSDoc, and every Markdown file. Use before writing or changing any document, and with prompting before changing AGENTS.md or a skill.
---

# Documentation

## Writing

- Write only what the reader needs and would not otherwise know. Cut padding, repetition, preamble, filler, and closing summaries.
- One point, one sentence, one place. Give the reason when it is not obvious, and link to a fact's owner instead of restating it.
- Say what to do rather than what to avoid; when a prohibition is needed, name the concrete pattern.
- Plain English with one term per concept, and no emphasis capitals, em-dashes, emoji in prose, promotional adjectives, stock AI phrasing, or hedging.

## Paragraphs And Lists

A paragraph is one topic, written on one source line. Start a new one when the topic changes; merging topics and splitting every sentence are both failures.

Use a list for parallel items and ordered steps, prose for an argument whose conditions and exceptions depend on each other, a table for repeated mappings, and a code block for exact commands.

## Code Documentation

- JSDoc follows [Meaningful documentation](../contracts/common.md#meaningful-documentation), and interface types close with `@author Samchon`.
- A README serves the package's user: what it is, when to use it, and its public surface, with examples taken from code that runs.
