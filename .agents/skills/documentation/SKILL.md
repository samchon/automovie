---
name: documentation
description: Owns how any document is written, with its sentences, terms, paragraphs and lists, and what a README and a doc comment hold. Use before writing or changing a technical document, README or doc comment; instructions for an agent add the prompting skill's rules.
---

# Documentation

This skill owns how a document is written, whoever reads it. Good writing is the same for every reader: deliver the core point concisely and clearly. Only the reader, and so what the reader needs, differs by document.

Every document follows [Writing](writing.md).

## READMEs {#readmes}

Write a README only from the view of the person who uses its project or package, and keep it to the essentials:

- what it is and when to use it;
- how to install and start it;
- the few entry points;
- where the detail lives.

A README lists no API that the source and its types already own, because that list goes stale at the next change. It carries nothing only a maintainer needs. Every name, command and sample in it exists in the code, and every sample runs.

## Doc Comments

JSDoc follows [Writing](writing.md); the project's development skill names what a public declaration's comment must say.
