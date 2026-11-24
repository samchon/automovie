# Entity work

Prepare scene subjects under the production principles. Read [project context](../production/project-context.md) and the relevant installed package's JSDoc before preparing a body, model or attachment.

[Source layout](source-layout.md#source) places each entity. A standalone asset defines its views and controls without a screenplay.

## Coarse first

Keep forms simple enough to read motion, staging, timing and camera. Use solid colors to distinguish or characterize subjects.

### People

Prepare cast bodies from their records and share the same body between drawing and motion. Compose crowd bodies through the group capability.

A person has no modeled surface of its own: clothing, a face and a build beyond the body facts stay out.

Attach worn and held equipment as objects.

### Objects

Instantiate the archetype from the subject's facts and seed. Use its model, dimensions and connection frames for drawing and interaction.

An affordance defines where and how an action meets an object. Pass it to the installed motion vocabulary.

If no archetype exists, build a coarse form with the required affordances, mass and articulations.

### Everything else

Identify other subjects with the simplest [coarse form](../3d-modeling/coarse-forms.md).

### What stays out

Send unsupported appearance facts through [canon references](../image/SKILL.md) and [generation prompts](../video/SKILL.md), or a direct 3D detail option. Use images for reference or conditioning. Author motion in code.

## Flames, screens and lettering

<!-- @source `IAutoMovieFlameCue`, `IAutoMovieSurfaceGraphicTrack`, `IAutoMovieSurfaceGraphic`, `IAutoMovieSurfaceGraphicLayer`, `IAutoMovieAffordance` and `IAutoMovieFontSource` in `@automovie/interface`. -->

Show what a prop declares. At a lit candle's, lantern's, torch's, lighter's or fire ring's flame frame, author a flame cue on the shot and bind it to the practical light that frame motivates, so the light flickers with the flame and the flame's brightness follows the light. An unbound flame states its own luminance and color.

Put pictures and text on a prop's `screen` or `face` surface with a surface-graphics track. Make a graphic emissive where the surface glows, as a lit screen does, and printed where the scene lights it, as ink does. Show another staged camera's view with a feed layer. Declare the `outline` of a face that is not a rectangle, such as a STOP sign's octagon. A surface that rides an articulation, such as a book's face or a folded sheet, is refused. `IAutoMovieSurfaceGraphic` and the surface's `IAutoMovieAffordance` set each field's units and effect.

Letter only from a font source the shot lists: a font the production synthesizes in its own code, or a licensed font file it holds as a project asset, recorded under [media records](../production/media-records.md#fonts-and-stills). For raised letters, such as channel letters over a storefront, decode the font in production code and build the lettering mesh as a set piece.

Mount the flames and surface graphics in the film as [modules](modules.md#shots-and-films) sets.

## Detail

Build commissioned detail as an option on the same entity definition. Keep identity, dimensions, pivots, attachments, contacts and controls independent of surface detail.

Author motion, accept catalog cases and review segments on coarse forms.

Enable detail only for commissioned delivery and record it in [project context](../production/project-context.md). Compare both settings on the same segments for proportion, pivots, contacts, deformation, visibility, timing and silhouette.

The 3D modeling skill makes, rigs and verifies a detailed form, and the video skill's direct film page sets what a direct 3D film's detail adds.

## Inspection and handoff

Inspect the entity in its [catalog cases](../motion/catalog-cases.md) against the facts it realizes under the [entity contract](../contracts/development/entities.md#settings-realization). For a standalone asset, test the views and controls in its commission under [asset review](../review/delivery-review.md#assets). For a scene, inspect its states with the actual cameras, neighboring subjects and motion under [segment review](../motion/segment-review.md).
