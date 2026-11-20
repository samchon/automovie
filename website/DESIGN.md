# Design

How the site's pages are laid out and styled, and why. The [website skill](../.agents/skills/website/SKILL.md) sets what the site says and how a change is verified; this note owns how each page looks and is arranged, and the visual rules a change keeps. `src/app/site.css` imports every stylesheet in the order the cascade depends on, and the root layout imports it alone, so an import sorter cannot reorder them. The tokens are in `src/app/tokens.css`; `global.css` holds the faces, the footer and the application frame, `playground.css` the playground and an archetype's page, `shared.css` the buttons and pieces every page shares, `landing.css` and `landing-band.css` the landing page, `catalogue.css` and `motions.css` the catalogues and a motion's page, and `scenes.css` the scene pages and the player.

Two readers come. A visitor comes to learn what AutoMovie does, so the landing page follows one scene from the decision it rests on to the frames it computes. A developer or a coding agent comes to look up what the vocabulary holds, so the catalogues and the docs are dense, plain and exact, with ids, values and messages in monospace.

## What was studied

| Source | What was taken from it |
| --- | --- |
| [scroll-craft](https://github.com/nateherkai/scroll-craft) | A landing page as a short journey with one engineered peak and quieter sections around it; pinned acts only where the stage changes; no dead scroll; rise-in of about 14 px over about 600 ms with one ease-out curve. |
| [Anthropic frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | A palette and faces chosen for the subject rather than a default; the hero opening on the subject's most characteristic element; no card kit of identical rounded boxes; one orchestrated motion moment. |
| [Vercel web interface guidelines](https://github.com/vercel-labs/web-interface-guidelines) | CSS before script for motion, explicit media sizes, lazy media below the first screen, a still in place of motion under reduced motion, visible focus. |
| [impeccable](https://github.com/pbakaus/impeccable) | A persuading surface (the landing page) designed boldly and a reading surface (the docs) kept familiar, on one set of tokens. |
| Bun, Remotion, Motion Canvas, Astro and Linear | One line for what the tool is, the install command on the first screen, real code beside what it produces, and the command again at the end. |
| typia.io and ttsc.dev | Nextra 4 with a landing page of its own, docs with separators in the sidebar, and the same navigation bar on every page. |
| [Poly Haven](https://polyhaven.com/models) and the three.js editor | A catalogue as a grid of stills grouped by family, and a 3D view on a flat neutral ground. |

Rejected:

- A scroll-driven animation library and scroll-scrubbed video. Sticky panels and one `IntersectionObserver` give the same reading in every browser, and degrade to a plain stack.
- Computing a take while a visitor waits on a card. One scene's plan takes up to 32 s in Node and the 80 playing scenes 384 s together, so a page of cards stalled; the build bakes the takes instead (see Baked takes).
- A modal for a motion. A page per motion is linkable, indexed by the search and needs no focus trap.
- Tailwind utilities. The pages have a few hundred rules, and stylesheets over tokens keep every value in one place.

## The frame

Nextra draws the navigation bar: the logo, Docs, Reference, API, Scenes and a Library menu holding Motions, Archetypes and Playground, then the search, the repository link and the theme switch. The screenplay and the docs come first because they are the product; the catalogues are the kit a production composes with. The documentation is two trees with a sidebar each: the guide at `/docs/` for the person who makes a film, and the reference at `/reference/` for whoever writes against the packages, so neither reader wades through the other's pages; the search covers both. Every page but the docs is listed in `src/content/_meta.ts` with `layout: "full"` and the documentation chrome switched off, and the article Nextra wraps it in loses its padding, so the page runs edge to edge.

The footer holds the brand line and three columns of links: Learn, Library and Project.

## Landing

The page follows one scene, the kickboxing round, from its brief to its frames. Sections in order:

1. Hero. The headline "Write the film. Program the motion." in the display serif on the left; on the right one sentence, Read the docs and See the scenes, and the copyable `npx automovie create my-film`. Under them, across the width, the screenplay scene file in the typewriter face beside the scene's baked take drawn flat; the beat whose actions are playing is lit, and a timeline of the beats runs under the take.
2. Why. Two columns: what a prompt cannot fix about motion, and what a motion hint gives a model.
3. The chain. Five steps, Decide, Write, Program, Check and Render, each a text beside the document it produces: a brief file, a beat record, the scene module citing its beats, the evidence report failing on an unrealized beat, and the take's still with the channels a hint delivers. On a wide screen the text and the panel stick while the step scrolls past.
4. The evidence graph, the page's one dark band and its peak. The brief's anchors, the beats, the modules and the film joined by their citations; pointing at a node lights what it rests on and what rests on it, and a switch deletes one citation and turns the report beside it to the failure. Three facts about review follow.
5. Simple bodies, precise motion. The scene in the 3D player with its takes as buttons; the first plays from its baked take, another is computed when chosen.
6. The library. The vocabulary's counts read from the installed packages, a rail of motion stills, and links to the four catalogues.
7. Start. The commands, the kind of sentence to say to the agent, and links to Setup and Your first film.

Below 960 px every pair of columns stacks and nothing sticks.

## Baked takes

`pnpm run bake` computes, before the export, the first take of every listed scene that plays and of every motion that can be tried alone, in parallel child processes, and keeps each under a hash of its composition and the packages' sources in `.bake-cache/`. It writes each take to `public/baked/<scenes|motions>/<id>.take` in `BakedTake`'s format, gzipped: the take's header, then its track with each frame stored as its difference from the one before, which gzip shrinks several times. A page fetches it and inflates it with `DecompressionStream`.

Each take also gets a still, `<id>.svg`, drawn by `FigurePoster` in the manner of a chronophotograph: the frame where the limbs reach farthest from the trunk solid, a few frames around it faint, the hands' paths as thin amber lines, and every prop's meshes outlined by their projected hulls in their own colours, all seen orthographically from the scene's view. The still has its own ground, the viewport's, so it reads the same in both themes.

## Scenes

The gallery groups the scenes that play by setting, combat first, with chips that filter by setting and a field that searches titles, roles and actions, both kept in the query. A card shows its still; pointing at it or focusing it plays the baked take in 3D in place of the still, and leaving lets the view go. A scene its record marks refused, or that waits on a release, is listed under a folded In the works.

A scene's page has a breadcrumb, the title in the display serif and the summary; the player beside an aside of the cast, the objects, the composition's features, the actions as tags that open their motions, and Open in the playground. Under them three tabs: Code, the chain an agent writes; Timeline, read from the drawn take; and Takes, which computes the other takes in the page when opened.

States of a scene:

| State | Shown |
| --- | --- |
| Plays | The player, the code, the timeline and the takes. |
| Refused | A note under the heading with the issue that fixes it, and the packages' refusal in place of the picture. Not in the gallery's grid. |
| Waits on a release | The issues it waits on and the code it composes. |
| Planned | Its cast and pieces in words, and the issues it waits on. |

## Motions

The catalogue arranges the vocabulary by `MOTION_CATEGORIES`: the core actions, then the lexicon's families under Movement and position, Combat, Sport and exercise, Gesture and expression, Daily habits, and Hands and work; a family a release adds and the table lacks is listed under More. An index of the categories and families with their counts sticks beside the sections, with the search above it. A card shows the motion's still, or a scene's still faded when the motion is tried only in a scene, or "no scene yet"; pointing at a motion tried alone plays it flat in place. An address naming a motion in its fragment goes on to that motion's page.

A motion's page has a breadcrumb to its category and family, the name in monospace, and what kind of motion it is; the 3D player with the motion alone or in the first scene that performs it; an aside with how a chain writes it, the scenes that use it, Open in the playground and the previous and next motions of its family; and the parameters as a table of name, type, whether it is required, and meaning.

## Archetypes

The same layout as the motions: an index of the families beside a section per family, each with one sentence of what it holds and a grid of cards drawing the producer's first kind on the page's shared renderer, turning while pointed at. An archetype's page keeps its view at 4:3 with the named views and zoom under it, and beside it Specs (the dimensions the seed drew on their bands, the affordances by id and kind) and Customise (the seed and one slider per articulation). Changing the seed or an articulation keeps the camera where it is.

## Playground

On a screen 1280 px wide or wider, the composition is a panel 22 rem wide on the left, scrolling by itself, with the one primary button, Perform, at its foot; the result fills the rest: the performance in the inspector, the timeline over a table of the same in seconds, and the verdicts read on request. Below 1280 px the two become tabs, and Perform switches to the result. A refusal shows twice on purpose: the package's message where the performance would be, and the refused action outlined in the composition with its fix and a button per accepted value.

## The player

A view draws on the page's one WebGL renderer (`src/stage/SharedStage.ts`), which draws each view in turn into the corner of its canvas and copies it into the view's 2D canvas, because a browser keeps only a few contexts. A view shows its still until its take is drawn. The camera stands where the scene's view looks from, close enough that the action's bounding sphere fills four fifths of the frame. The transport is Play or Pause, the scrubber, the time, the speed and Loop; Space and K play or pause, J and L seek a second, comma and full stop step a frame. A drag or the arrow keys turn the camera, the wheel zooms only while the view has focus or a modifier key is held, and a double-click or 0 frames it again.

## Visual system

Type. Four faces from `next/font`: Instrument Serif for headings, Courier Prime for screenplay text, Geist Mono for code, ids and values, and Geist for the rest. Display sizes scale with the window between fixed bounds; body text is 15 to 18 px on the landing page and 14 to 16 px in the catalogues.

Colour. Every colour is a token with a light and a dark value:

| Role | Tokens |
| --- | --- |
| Surfaces | `--am-bg`, `--am-bg-panel`, `--am-bg-inset`, `--am-bg-hover` |
| Lines | `--am-border` for panels, `--am-border-control` for anything operated |
| Text | `--am-fg`, `--am-fg-muted` |
| Accent | `--am-accent`, `--am-accent-bg`, `--am-accent-fg`, `--am-accent-soft`, `--am-accent-line` |
| Danger and success | `--am-danger`, `--am-danger-soft`, `--am-danger-border`, `--am-success`, `--am-success-soft` |
| Focus | `--am-focus` |
| 3D views and stills | `--am-viewport`, `--am-viewport-fg`, `--am-viewport-grid`, `--am-viewport-muted` |
| Marks on a view | `--am-viewport-control`, `--am-viewport-ink`, `--am-viewport-track` |
| Highlights on a view | `--am-viewport-lit`, `--am-viewport-button` |
| Tags on a view | `--am-viewport-tag-bg`, `--am-viewport-tag-fg` |
| Dark band surfaces | `--am-room`, `--am-room-panel`, `--am-room-deep`, `--am-room-line`, `--am-room-edge` |
| Dark band text | `--am-room-fg`, `--am-room-muted`, `--am-room-code` |
| Dark band states | `--am-room-lit`, `--am-room-danger`, `--am-room-danger-fg`, `--am-room-success` |
| Dark band switch | `--am-room-switch-*`, and `--am-room-alarm-*` while pressed |
| The inspector and shadows | `--am-instrument-bg`, `--am-instrument-fg`, `--am-shadow` |

The ground is a warm off-white and the ink near black; the one accent is tungsten amber, the favicon's, used for what is selected, the one primary action and a motion's paths. The viewport ground is the same warm grey in both themes, because the packages' coarse colours are chosen for a light ground. `pnpm check` computes the contrast of 43 token pairs in both themes and stops the build when one is below its bound.

Shape and space. Steps on a 4 px grid; a radius of 6 px for controls and 12 px for panels and views; pill-shaped buttons and chips.

Motion. One ease-out curve and 180 ms for interface responses; a block rises 14 px into place the first time it comes into the window; the canvases draw only while playing and seen. Under `prefers-reduced-motion` nothing eases, rises or animates, the landing take holds a frame with a Play button, and the players wait to be played.

## Rules a change keeps

- Every colour is a token in `tokens.css` with its light and dark value, or one value for the viewport and the dark band, which keep theirs in both themes; a colour text sits on has its pair in `build/contrast.ts`.
- The display serif sets headings, the typewriter face screenplay text, the mono face code, ids and values, and the sans face the rest.
- The amber accent marks what is selected, the one primary action and a motion's paths, and nothing else.
- A page has at most one dark band, and the landing page one engineered moment, the evidence graph.
- Things move only through `transform` and `opacity`; a colour may fade.
- Every image and canvas has its size before it loads, and an image below the first screen loads lazily.
- A card shows a baked still and plays only while pointed at or focused.

## Accessibility

- Every region is a labelled landmark or a section with a heading; the catalogues' indexes are navigation landmarks.
- Every control has a visible label, and focus is a 2 px ring in `--am-focus`.
- A card's still and view are decoration inside a link named by its title.
- The evidence graph is an image described in words, its citations listed in its description; pointing at a node lights its chain, the switch is its one control, a toggle button, and its report is a polite live region.
- A refusal and a load failure use `role="alert"`; progress and a copied command use `role="status"`.
- The scene page's tabs follow the WAI-ARIA tabs pattern: one stop in the tab order, the arrow keys, Home and End between them.
- What a canvas shows is also text: a scene's code and timeline, a motion's parameters, an archetype's dimensions.
