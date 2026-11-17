# Writing

How the text of any document is put together, from its sentences up to its sections.

Text is concise when every sentence carries something its reader needs, and clear when that reader understands it on the first reading. Completeness means covering what the reader needs, never longer phrasing.

A set of documents says each thing in one place, and no two places disagree, because a reader who meets a point twice cannot tell which one holds.

- [Wording](#wording)
- [Structure](#structure)
- [Revising](#revising)

## Wording

### Content and sentences

These rules govern what a document says and how each sentence says it:

- Write only what the reader needs and would not otherwise know.
- Say simply what can be said simply.
- Cut padding, preamble, filler and closing summaries.
- Cut a qualification that changes nothing, an example that restates the rule, and a sentence that repeats another.
- Make one point per sentence.
- Give the reason when it is not obvious.
- Say what to do rather than what to avoid, and name the concrete pattern when a prohibition is needed.
- Use plain language, without emphasis capitals, bold, em-dashes, emoji in prose, promotional adjectives or hedging.

### Terms

Use one term per concept and one concept per term across a set of documents, because a second word reads as a second thing and a reused word hides a difference.

Name the concept with the field's established term, or with plain words where the field has none, never with a coined word. Explain a field term in plain words where a newcomer first meets it, or link the document that explains it.

A metaphor may explain a concept once in prose, but it never becomes the concept's name in a heading, a label, a description or later text. A reader who knows the field cannot find the concept under a private name, and one who does not takes the picture literally.

### Careless text

Write as a person writing for this document's reader. These habits mark text as produced without thought, and a reader who spots one stops trusting the rest:

- stock AI phrasing, such as "delve into" or "it's worth noting";
- a sentence frame or opener repeated across sibling documents;
- one template stamped on every document, whatever it holds;
- three parallel items where the content has two or four.

## Structure

The reader may be looking at the raw source in an editor, so every limit below is measured on the source line, links included.

### Headings

A heading names its topic in a few words, in sentence case. A question, claim or instruction belongs in the text under it, because a sentence in a heading is read twice and hides the topic it names.

The second-level sections are a document's few main parts. Sections on similar topics become subsections under one section named for what they share, because a long flat row of sections hides which belong together.

Every title in a document is plainly distinct from the others, so a reader never takes one section for another. No two share a title, because their links would collide.

Link to a heading by its title's slug. Give it an explicit anchor such as `{#name}` only where its address must survive a retitle, because a renderer that does not read the syntax shows the anchor as text.

A document over about 100 lines opens with a list of its main sections as links.

### Links

Links flow one way. A document that routes to others links down to them, and a document links sideways to the one section that owns a point it needs.

A document never links up to the one that routes to it, and the owner of a point never links back to the documents that use it. A reader who arrived from above gains nothing from the way back, and two documents that link each other read as a loop with no owner.

Where the text must mention what lies above or what uses it, it names it in plain words without a link.

### Paragraphs

A paragraph is one topic, written on one source line. Open it with its point and follow with the detail, because a reader who skims reads only the first sentence.

A paragraph of more than about five sentences usually holds a second topic. Gluing several topics into one long paragraph to keep the count low is a failure, not concision, because the reader cannot find the second topic.

Giving every sentence its own paragraph is the opposite failure, because the reader cannot see which sentences belong together.

### Lists

A list is for parallel items short enough to take in at a glance, and for steps whose order changes the result. Each item is one source line of at most about 120 characters.

Introduce a list with a sentence that says what its items are, write every item in the same grammatical form, and give it at least two items. Fragment items end in semicolons and the last in a period; full-sentence items end in periods.

An item never carries a paragraph under it. Mark a sublist differently from its parent, such as `-` items under a numbered list.

A checklist of assertions under a heading that names what they check is the exception. It needs no introducing sentence, and each item may run as long as one checkable assertion with its exceptions needs.

### Tables

A table is for a repeated mapping whose every row fits one source line of at most about 120 characters. Two columns are the norm.

The first column holds what the row is about, such as the page it links to or the name it defines, and a short phrase follows. A table that routes to pages therefore starts each row with the link.

Order the rows as the reader needs them: in sequence where they have one, otherwise alphabetically by the first column.

A condition, reason or example that does not fit its cell goes in a sentence after the table.

### Form by content

Content that does not fit a list item or a table row is not a list or a table. Breaking an explanation into bullets or cells does not make it concise, because they hide how its points connect. Give it the form of what it is:

| Content | Form |
| --- | --- |
| Several topics | A subsection each, written as prose |
| Steps that need explanation | A numbered subsection each, such as `### 1. Plan` |
| An argument whose parts depend on each other | Prose, with no list |
| A repeated mapping of short values | A table |
| An exact command | A code block |

## Revising

Revise a section as a whole. Read the document top to bottom as its reader, then rewrite the section so each paragraph makes one point in the order the reader needs.

Inserting a sentence for each finding is the failure this replaces: sentences added one at a time repeat each other, break the flow and leave the next reviewer more to find.

Remove what no reader uses, and move a point another document owns back to that owner. Then read the complete result again as its reader, and fix whatever makes that reader slow down.
