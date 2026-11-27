---
name: documentation
description: Guides clear writing and revision.
---

# Documentation

Keep what the reader needs to understand or act.

## Wording

### Content and sentences

- Keep the action, its conditions and how to verify it.
- Use a shorter or clearer expression whenever it preserves meaning, clarity and the details the reader needs.
- Make one point per sentence.
- Give the reason when it is not obvious.
- Say what to do rather than what to avoid, and name the concrete pattern when a prohibition is needed.
- Use plain language, without emphasis capitals, bold, em-dashes, emoji in prose, promotional adjectives or hedging.

### Terms

Use one term per concept, with the same meaning throughout.

Use established terms or plain language. Define unfamiliar terms on first use or link to their definitions.

Explain a concept directly whenever that is clearer. Use at most one metaphor when it helps, then use the concept's actual name.

### Careless text

Avoid stock phrases, repeated openers and outlines that impose a structure the content does not need.

## Structure

Measure source lines by counting a link's text and omitting its address.

### Headings

Use short, sentence-case topic headings. Put questions, claims and instructions in the body.

Group related topics under one second-level heading.

Use distinct headings so their anchors are unique.

Use heading slugs. Add an explicit anchor only if the address must survive renames and the renderer supports it.

### Paragraphs

Give each paragraph one topic and lead with its point. Start a new paragraph at every change of topic. Saving a line break has no value.

Separate paragraphs with a blank line. Keep each Markdown paragraph on one source line.

### Lists

Use lists for short parallel items or ordered steps. Keep each item on one source line of about 120 characters.

Introduce each list. Use parallel grammar and at least two items. End complete sentences with periods.

Put related details in a sublist. Use prose when the points need a connected explanation.

Under a descriptive checklist heading, omit the introduction.

### Tables

Use two columns by default for short mappings. Keep each row on one source line of about 120 characters.

Put the subject or page link in the first column and its description in the second.

Use task order where it exists, otherwise alphabetize by the first column.

A condition, reason or example that does not fit its cell goes in a sentence after the table.

### Form by content

Choose the form that fits the content:

| Content | Form |
| --- | --- |
| Several topics | A subsection each, written as prose |
| Steps that need explanation | A numbered subsection each, such as `### 1. Plan` |
| An argument whose parts depend on each other | Prose, with no list |
| A repeated mapping of short values | A table |
| An exact command | A code block |

## Revising

Rewrite the affected section in the reader's order.

Remove unused material. Reread the result as its reader.
