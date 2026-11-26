# Design

How the site's pages are laid out and styled, and why. The [website skill](../.agents/skills/website/SKILL.md) sets what the site says and how a change is verified; this note owns how each page looks and is arranged, and the visual rules a change keeps. `src/app/site.css` imports every stylesheet in the order the cascade depends on, and the root layout imports it alone, so an import sorter cannot reorder them. The tokens are in `src/app/tokens.css`; `global.css` holds the faces, the footer and the application frame, `archetypes.css` the archetype viewport and controls, `shared.css` the buttons and pieces every page shares, `landing.css` and `landing-band.css` the landing page, `catalogue.css` and `motions.css` the catalogues and a motion's page, and `scenes.css` the scene pages and the player.

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

Nextra draws the navigation bar: the logo, Docs, Reference and Gallery, then the search, the repository link and the theme switch. The guide at `/docs/` serves the person who makes a film and the reference at `/reference/` whoever writes against the packages, each with its own sidebar; the search covers both. The reference's sidebar lists the catalogues a film is composed from (Motions, Archetypes, Scene studies) after its pages, and an Appendix with the TypeDoc API and the example productions; the guide's sidebar ends with an Appendix linking the Reference and the API. The scenes on this site are studies of what the motion grammar composes, not films, so a showcase of finished films gets a place of its own when there are films to show.

The footer holds the brand line and three columns of links: Learn, Catalogues and Project.

## Landing

The page follows one scene, the kickboxing round, from its brief to its frames. Sections in order:

1. Hero. The headline "Write the film. Program the motion." in the display serif on the left; on the right one sentence, Read the docs and Scene studies, and the copyable `npx automovie create my-film`. Under them, across the width, the screenplay scene file in the typewriter face beside the scene's baked take drawn flat; the beat whose actions are playing is lit, and a timeline of the beats runs under the take.
2. Why. Two columns: what a prompt cannot fix about motion, and what a motion hint gives a model.
3. The chain. Five steps, Decide, Write, Program, Answer and Render, each a text beside the document it produces: a brief file, a beat record, the scene module stating how it plays its beats, a beat's answer file stating how it keeps each principle and decision, and the take's still with the channels a hint delivers.
4. The evidence graph, the page's one dark band and its peak. The brief's decisions, the beats, the modules and the film; pointing at a node lights what it answers to and what answers to it and shows the written statement, and a switch deletes one statement so the report beside the graph fails.
5. The library. How any action is composed from the engine's primitives, a rail of motion stills, and links to the scene studies, the motion and archetype catalogues, and their gallery. No page states how many motions, rows or archetypes there are: the number changes with every release, and the claim is the composition, not the size.
6. Simple bodies, precise motion. The second module of the hero's scene, from Kai's answer to the knockdown, its key lines marked. The hero already plays the motion, so the page shows the code behind it rather than the same take again in 3D; the landing page creates no WebGL context.
7. Start. The commands, the kind of sentence to say to the agent, and links to Setup and Your first film.

Below 960 px every pair of columns stacks and nothing sticks.

## Baked takes

`pnpm run bake` computes, before the export, the first take of every listed scene that plays and of every motion that can be tried alone, in parallel child processes, and keeps each under a hash of its composition and the packages' sources in `.bake-cache/`. It writes each take to `public/baked/<scenes|motions>/<id>.take` in `BakedTake`'s format, gzipped: the take's header, then its track with each frame stored as its difference from the one before, which gzip shrinks several times. A page fetches it and inflates it with `DecompressionStream`.

Each take also gets a still, `<id>.svg`, drawn by `FigurePoster` in the manner of a chronophotograph: the frame where the limbs reach farthest from the trunk solid, a few frames around it faint, the hands' paths as thin amber lines, and every prop's meshes outlined by their projected hulls in their own colours, all seen orthographically from the scene's view. The still has its own ground, the viewport's, so it reads the same in both themes.

## Scenes

The gallery groups the scenes that play by setting, combat first, with chips that filter by setting and a field that searches titles, roles and actions, both kept in the query. A card shows its still; pointing at it or focusing it plays the baked take in 3D in place of the still, and leaving lets the view go. A scene its record marks refused, or that waits on a release, is listed under a folded In the works.

A scene's page has a breadcrumb, the title in the display serif and the summary. Its player sits beside the cast, objects, composition features, action links to the motion catalogue and a button that copies the scene address. Three tabs show the authored chain, the timeline of the drawn take, and the other takes, which compute when opened.

States of a scene:

| State | Shown |
| --- | --- |
| Plays | The player, the code, the timeline and the takes. |
| Refused | A note under the heading with the issue that fixes it, and the packages' refusal in place of the picture. Not in the gallery's grid. |
| Waits on a release | The issues it waits on and the code it composes. |
| Planned | Its cast and pieces in words, and the issues it waits on. |

## Motions

The catalogue arranges the vocabulary by `MOTION_CATEGORIES`: the core actions, then the lexicon's families under Movement and position, Combat, Sport and exercise, Gesture and expression, Daily habits, and Hands and work; a family a release adds and the table lacks is listed under More. An index of the categories and families with their counts sticks beside the sections, with the search above it. A card shows the motion's still, or a scene's still faded when the motion is tried only in a scene, or "no scene yet"; pointing at a motion tried alone plays it flat in place. An address naming a motion in its fragment goes on to that motion's page.

A motion's page has a breadcrumb to its category and family, the name in monospace, and what kind of motion it is; the 3D player with the motion alone or in the first scene that performs it; an aside with how a chain writes it, the scenes that use it, and the previous and next motions of its family; and the parameters as a table of name, type, whether it is required, and meaning.

## Archetypes

The same layout as the motions: an index of the families beside a section per family, each with one sentence of what it holds and a grid of cards drawing the producer's first kind on the page's shared renderer, turning while pointed at. An archetype's page keeps its view at 4:3 with the named views and zoom under it, and beside it Specs (the dimensions the seed drew on their bands, the affordances by id and kind) and Customise (the seed and one slider per articulation). Changing the seed or an articulation keeps the camera where it is.

## Gallery

The gallery introduces the motions and archetype catalogues and a grid of short composed takes. Both catalogues keep their established addresses and show the same section navigation. A saved composition address opens the gallery with an explicit control to load its take.

For a focused review, bake the desired takes with `pnpm run bake -- --only '^(scene collect-and-shoot|motion cartwheelLeft)$'`. Export and serve the site, then run `pnpm run gallery:stills -- http://127.0.0.1:4173/automovie/ collect-and-shoot` to capture named views and source frames around the scene's events.

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
| Shadows | `--am-shadow` |

The ground is a warm off-white and the ink near black; the one accent is tungsten amber, the favicon's, used for what is selected, the one primary action and a motion's paths. The viewport ground is the same warm grey in both themes, because the packages' coarse colours are chosen for a light ground. `pnpm check` computes the contrast of every token pair in `build/contrast.ts` in both themes and stops the build when one is below its bound.

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
