# Design

How the site's two application pages are laid out and styled, and why. The issues fix what the pages do: [#3381](https://github.com/samchon/automovie/issues/3381) for the composition playground and [#3397](https://github.com/samchon/automovie/issues/3397) for the gallery. This note fixes how they look and are arranged. The tokens are in `src/app/tokens.css`, the layout in `src/app/global.css`.

The readers are developers and their coding agents, who come to check what the motion vocabulary does. They read numbers, ids and messages more than they admire a picture, so the pages are dense, plain and exact.

## What was studied

Pages looked at as screenshots, taken with `pnpm shots`:

| Page | What it shows |
| --- | --- |
| [three.js editor](https://threejs.org/editor/) | A grey viewport fills the left, a light sidebar of tabbed properties sits on the right, and a transport bar with play, pause and the time runs under the viewport. |
| [Babylon.js Playground](https://playground.babylonjs.com/) | Input on the left and the live result on the right, half each, with one toolbar across the top. |
| [typia playground](https://typia.io/playground/) | The same split inside a Nextra navigation bar, with a readout panel under both halves and the primary button at the edge of the panel it acts on. |
| [Poly Haven models](https://polyhaven.com/models) and an [asset page](https://polyhaven.com/a/ArmChair_01) | A catalogue list on the left with a count per group. An asset is a large view on the left with a narrow column of facts on the right. |
| [model-viewer examples](https://modelviewer.dev/examples/augmentedreality/) | A model on a flat light-grey ground, with no decoration around the canvas. |

Pages read as text:

| Page | What was taken from it |
| --- | --- |
| [Storybook, Browse stories](https://storybook.js.org/docs/get-started/browse-stories) | A sidebar tree with search, a canvas, and a panel of controls and results below the canvas. |
| [Theatre.js Studio](https://www.theatrejs.com/docs/latest/manual/Studio) | The parts of a motion tool: an outline, a details panel and a sequence editor. |
| [shadcn/ui component page](https://ui.shadcn.com/docs/components/button) | A long catalogue list on the left and one framed preview per example. |
| [Nextra page configuration](https://nextra.site/docs/docs-theme/page-configuration) and [theme configuration](https://nextra.site/docs/docs-theme/theme-configuration) | `layout: "full"` gives a page the whole width and height, and `sidebar`, `toc`, `breadcrumb`, `pagination`, `timestamp` and `footer` switch off the documentation chrome. The theme puts the class `dark` on the root element. |
| [W3C WAI, user notifications in forms](https://www.w3.org/WAI/tutorials/forms/notifications/) | An error is shown at the control it concerns and tied to it with `aria-describedby`; one that appears without a page load is announced through `role="alert"`; the text says how to repair it. |
| [WCAG 2.2, contrast (minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 4.5:1 for text, 3:1 for large text and for the parts of a control, and the luminance formula `build/contrast.ts` computes. |
| [Primer, colour usage](https://primer.style/product/getting-started/foundations/color-usage/) | Functional tokens named by role (background, foreground, border; default, muted, emphasis; accent, danger, success) that change value by theme, so no component names a raw colour. |

## What was taken and what was rejected

Taken:

- Input on the left and result on the right for the playground, as Babylon and typia do, because the eye moves from what was written to what came out.
- The timeline directly under the view, as the three.js editor's transport and Theatre's sequence editor sit, because both are read against the same clock.
- A catalogue on the left with counts, a large view and a column of facts on the right for the gallery, as Poly Haven lays out an asset.
- A neutral grey ground for every 3D view in both themes, as the three.js editor and model-viewer use, because the packages' coarse colours are chosen for a light ground and a pure white or black one hides light or dark parts.
- Role-named tokens with a light and a dark value.

Rejected:

- A code editor for the composition. #3381 asks for pickers generated from the grammar, and a visitor without the types at hand cannot write a chain blind. Parameters are JSON fields until the package exports parameter descriptors, which is as far as the page can generate today.
- Panels floating over the 3D view, as Theatre's do. They hide the picture on a small screen and need dragging, which has no keyboard path.
- A grid of thumbnails for the gallery, as Poly Haven's listing has. Nothing is pre-rendered, and building dozens of models to draw tiles would cost seconds before the first picture.
- Dockable or resizable panes. Fixed regions with stated breakpoints behave the same for everyone.
- Tailwind utilities. The pages have a few dozen rules, and one stylesheet over tokens keeps every value in one place.
- A second theme for the inspector of `@automovie/viewer`. It brings its own light inline styling, so it sits on a light surface in both themes, with the page's control styles kept out of it, rather than being restyled from outside.

## The frame

Nextra draws the navigation bar with the logo, the two page links, the repository link, the search and the theme switch. The two pages are listed in `src/content/_meta.ts` with `layout: "full"` and every piece of documentation chrome switched off, so each has the window below the bar to itself. The landing page keeps Nextra's reading column and footer.

Each page starts with a one-line heading row: the page's name and one sentence saying what it does.

## Playground

Regions on a screen 1280 px wide or wider:

- **Composition**, a panel 22 rem wide on the left. It holds the preset picker and the seed, one bordered block per performer (id, body, starting place, proficiency), and inside it one block per action in order (action picker, anchor, parameters, cut, and timing and overlays where the installed package has them). The panel scrolls by itself and stays in view while the result scrolls. Its foot stays visible and holds the one primary button, Perform, with Copy address and Report.
- **Result**, the rest of the width. From the top: the performance drawn by the inspector, the timeline with a bar per action and a tick per named instant over a table of the same in seconds, and the verdicts.

Below 1280 px the two regions become two tabs, Composition and Result, because the inspector lays its picture beside a 320 px panel of its own and a narrower result region leaves the picture too small to read. Perform switches to Result. The inspector does not wrap, so on a screen narrower than its 42 rem it scrolls sideways inside its box. The Result tab says "refused" when the composition was refused, so the outcome is known before switching.

States of the result region:

| State | Shown |
| --- | --- |
| Packages loading | "Loading the motion packages." |
| Packages failed to load | A danger panel with the error. |
| Building | A notice that a body is prepared the first time, which takes seconds. |
| Refused | A danger panel in place of the performance: the package's message verbatim, then its fields. |
| Performed | The drawing, the timeline and the verdicts. |

A refusal is shown twice on purpose. The result region carries the full message where the performance would have been. The action the refusal names is outlined in the danger colour in the composition, with the fix sentence under its fields and one button per accepted value when there are eight or fewer, so the repair is next to its cause. Applying a value performs again. The panel scrolls the marked action into view. A link that carries a composition opens a narrow screen on the Result tab.

Verdicts are read on request, because reading them samples the whole film. Their states are idle with an explanation, reading, a failure with its message, clean, and a table of the bounds that do not hold.

## Gallery

Regions on a screen 1280 px wide or wider:

- **Catalogue**, 14 rem on the left: a filter field, then the polygon man and each archetype family as a labelled list. A subject with several kinds shows their count. It scrolls by itself.
- **View**, the middle: the 3D view at 4:3, never taller than the window, with a row of buttons under it for six named views and zoom. The camera stands 2.2 diagonals of the subject away, so the subject and its marks fit with room around them.
- **Details**, 22 rem on the right: the subject's name with its variant picker, its seed with a New seed button and the switch for affordance marks; the dimensions the seed drew, each with a mark on its band and the band's ends; and the affordances by id and kind with the colour of their mark, then one slider per articulation over the travel it declares.

From 768 to 1279 px the details move under the view and the catalogue stays on the left. Below 768 px everything stacks, the catalogue list becomes one grouped select so the view stays on screen while a subject is chosen, and the view becomes square.

States of the view: "Building the model." over the previous picture while a subject is built, and a danger panel with the package's message when it refuses a request.

Changing the seed or moving an articulation keeps the camera where it is, so the change is seen. Choosing another subject or variant frames it again.

## Visual system

**Type.** The text face is Nextra's system stack. Ids, values and messages are monospaced, because they are copied into code. Five sizes: 12, 13, 14, 16 and 20 px. The body of both pages is 14 px, denser than the 16 px of a reading page.

**Colour.** Every colour is a token in `src/app/tokens.css` with a light and a dark value:

| Role | Tokens |
| --- | --- |
| Surfaces | `--am-bg`, `--am-bg-panel`, `--am-bg-inset`, `--am-bg-hover` |
| Lines | `--am-border` for panels, `--am-border-control` for anything operated |
| Text | `--am-fg`, `--am-fg-muted` |
| Accent | `--am-accent`, `--am-accent-bg`, `--am-accent-fg`, `--am-accent-soft`: the selected item and the one primary action |
| Danger | `--am-danger`, `--am-danger-soft`, `--am-danger-border`: a refusal, an error, a broken bound |
| Success | `--am-success`, `--am-success-soft`: a clean report |
| Focus | `--am-focus` |
| 3D view | `--am-viewport`, `--am-viewport-grid`, `--am-viewport-tag-bg`, `--am-viewport-tag-fg` |

The accent is the amber of the favicon, darkened on a light ground and lightened on a dark one until text in it reaches 4.5:1. Danger is never the only signal: a refusal also has a heading and a border.

**Space and shape.** Six steps on a 4 px grid, one corner radius of 6 px, and one control height of 32 px.

**3D views.** A view is a bordered rectangle on the viewport ground with a floor grid for scale: 25 cm cells under furniture and vehicles, 5 cm under what is carried and 1 cm under what is held in the fingers, with the cell size stated under the view. Labels over it are small monospaced tags that follow their contact and move a line apart where they would cover each other.

## Interaction

- Nothing is performed while typing. The composition is built when Perform is pressed, because a build takes seconds. The gallery rebuilds on every change, because an archetype builds in milliseconds.
- A JSON field hands its value on only while its text parses to an object. Otherwise the parse error is shown under the field and the last good value stays.
- The address always reproduces the page: the playground's composition in the fragment, the gallery's request in the query, the inspector's request in the playground's query.
- A control for an operator the installed package lacks is not drawn.

## Accessibility

- Every region is a labelled landmark or a section with a heading.
- Every control has a visible label; the view buttons and move buttons name what they act on.
- Focus is a 2 px ring in `--am-focus` on every control and on the canvas.
- The gallery's canvas is focusable and described. The arrow keys turn it, plus and minus zoom, and the same moves are buttons. A vertical swipe scrolls the page and a horizontal one turns the model. The wheel zooms only while the canvas has focus or a modifier key is held, so scrolling past it is not caught.
- What a canvas shows is also text: the timeline has a table, and the gallery lists dimensions and affordances.
- A refusal and a load failure use `role="alert"`; progress uses `role="status"` and `aria-busy`.
- `pnpm check` computes the contrast of 26 token pairs in both themes and stops the build when one is below its bound.
- Animation is limited to the canvas loop; `prefers-reduced-motion` switches off transitions.
