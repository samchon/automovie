# Layout

How the shipped skill tree is shaped, so a task reads only what it needs and reads all of it. An agent may preview a file reached through several links instead of reading it whole, and every page it opens on the way costs attention, so the tree keeps routes short and pages whole.

## Routers

A router is a `SKILL.md`: a top-level skill's, or a sub-skill's one level below it. It holds the skill's scope in a short paragraph and a table of its pages with what each is for, so opening it to find the way costs little. A rule or short procedure that every use of the skill follows may follow the table; a page only some tasks need never does.

A sub-skill exists when a topic holds three or more pages with a trigger of their own, such as the techniques of one generation medium. A smaller topic stays pages of its parent, in a plain folder without a `SKILL.md` when grouping helps, and its parent's router links each page. No sub-skill nests inside another, so any page is at most three links from `AGENTS.md`.

## Pages

A page serves one task and reads on its own. It links onward in two ways only: a handoff to the task that follows, and a lookup of one named section of another page, by its anchor, for a rule that page owns. It links neither up to its router or AGENTS.md nor back to a page that links to it, as [Writing](../documentation/writing.md#links) sets. A page that can only be understood after reading another one whole is split or merged until it stands alone.

A page short enough to say nothing alone joins the page of the same task.

## Model-facing skills

A skill that drives an external model, such as image, video, motion or 3D generation, is organized by technique: how to hint the model, how to prompt it, how to continue or repair its output. Providers appear only as a few current examples on one models page per skill, because providers change faster than techniques and each provider's own documentation owns its values.

## Reading cost

Measure a change's effect on the tasks it touches: the files a representative task opens, their words and the links followed from `AGENTS.md`, before and after. A change passes when the tasks produce the same or better result, and any page or link it adds to a task buys something that task needs.
