# Writing

The rules every document follows, from a skill to a README to a doc comment.

## Sentences

- Write only what the reader needs and would not otherwise know.
- Say simply what can be said simply.
- Cut padding, preamble, filler and closing summaries.
- Cut a qualification that changes nothing, an example that restates the rule, and a sentence that repeats another.
- Make one point in one sentence in one place.
- Give the reason when it is not obvious.
- Say what to do rather than what to avoid, and name the concrete pattern when a prohibition is needed.
- Use plain language, without emphasis capitals, em-dashes, emoji in prose, promotional adjectives or hedging.

Completeness means covering what the reader needs, never longer phrasing.

## Terms

Use one term per concept across a set of documents, because a second word reads as a second thing. Explain a term where a newcomer to that document first meets it, or link the document that explains it.

## A person wrote it {#a-person-wrote-it}

Text reads as written by a person for this reader. These habits mark text as produced without thought, and a reader who spots one stops trusting the rest:

- stock AI phrasing;
- a sentence frame or opener repeated across sibling documents;
- one template stamped on every document, whatever it holds;
- three parallel items where the content has two or four.

## Paragraphs {#paragraphs}

A paragraph is one topic. Start a new one when the topic changes, keep sentences on the same topic together, and write each paragraph on one source line.

Gluing several topics into one long paragraph to keep the paragraph count low is a failure, not concision, because the reader cannot find the second topic. Giving every sentence its own paragraph is the opposite failure, because the reader cannot see which sentences belong together.

## Lists, tables and code {#lists}

A list is for parallel items short enough to take in at a glance, one line each, and for steps whose order changes the result. Mark a sublist differently from its parent, such as `-` items under a numbered list.

A long item, or one that carries reasoning, is not a list item. Give it the form of what it is:

| Content | Form |
| --- | --- |
| Topics | A subsection each, written as prose |
| Steps that need explanation | A short step line with a paragraph or a sublist of short items under it |
| An argument whose conditions, reasons and exceptions depend on each other | Prose, with no list |
| A repeated mapping | A table |
| An exact command | A code block |
