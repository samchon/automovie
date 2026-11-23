# Direct 3D film

A direct 3D film is the programmed film itself, rendered at its commissioned detail from the entities, their light and the renderer.

Accept motion, staging and camera on the coarse forms first. The appearance below is added to the same entities and preserves that performance.

## Appearance

### Detail

Select each subject's commissioned [detail option](../development/entities.md#detail), building a missing one under [3D modeling](../3d-modeling/SKILL.md#commissioned-detail) from its record and canon references.

Keep accepted skeleton and proportions. Use the Human package's detail or bind a sourced mesh to the same skeleton under [rigging](../3d-modeling/rigging.md). Keep hair and wardrobe in its detail option, with costume variants by story day.

Cloth and hair follow the body only as far as the installed packages simulate them; tell the user where that limits the film.

### Look

Use the look adopted in [project context](../production/project-context.md#overview-and-look), including the cinematography record on long work.

Use record and canon materials in the installed format. Generate wood, stone, plaster, clay, fabric and brushed-metal finishes as `procedural` material surfaces, and give handled objects edge `wear` and crease grime, under [3D modeling](../3d-modeling/SKILL.md#commissioned-detail); get other textures and environment maps from [sources](../3d-modeling/sources.md). Use clay for form and beauty for materials under [form inspection](../3d-modeling/inspection.md#light-and-material).

[Staging](../motion/staging.md#the-view) places each light at its motivated source. A motivated practical shows its source, a flame or a lit screen, as [entity work](../development/entities.md#flames-screens-and-lettering) authors it. An emissive surface lights nothing, so a screen that should light its surroundings needs a staged area light. A detailed film keys from that source, then adds a fill that sets the look's contrast and an edge or back light where a figure would merge with its background.

State light in physical units: lux for the sun and other directional lights, candela for lamps and nits for panels. Return the camera response from the film's `optics`, in the film module as [source layout](../development/source-layout.md#source) places it. It holds the exposure in EV100, the white balance as the kelvin of the key light, the tone curve, any lens glare around practical lamps and bright windows, and the adopted grade as ASC CDL slope, offset, power and saturation. Without `optics`, physical light renders white, and a staged `medium` cannot render at all.

Place the sun from the story's site and hour as [staging](../motion/staging.md#the-view) says, and stage it as a directional light; a daylight instant's beam never reaches the frame. Meter each scene's key subject with `meterAutoMovieIlluminance` from `@automovie/engine` and set `ev100` from `autoMovieIncidentEv100` of its lux. Run `checkAutoMovieExposureContinuity` over the film's cuts, grouped by screenplay scene, and mark each exposure change the screenplay decided with `change: true`.

Give the optics a `shutter`, 180 degrees unless the look decides otherwise, and `samples`, so motion blurs as it would on film. Where a shot decides focus, author `fNumber` on its frame action and return `lens` from `resolveAutoMovieLensAt` at each second, so the focus and any focus pull reach the frame.

When the scene has image lighting, return `occlusion` from the film's `shading` beside its `optics`, so creases, corners and the ground under each figure darken as the contact shadows the look requires. Set `radius` to the size of the gaps that should darken: about 0.5 m for a room's corners and a figure's footing, less for close-ups of small props. A scene lit only by direct lights gains nothing from it.

Where the set's own light should bounce, as in an interior lit by practical lamps or sun through a window, add `probes` to the same `shading`. Put the static set and the lights that light it on one renderer layer and name it as `layer`; moving actors stay off it, so they receive the bounce without casting it. Cover the lit space with the `min` to `max` box at a `spacing` of about 0.5 to 1 m, coarse enough that the box holds at most 2048 probes, keeping probes out of walls and furniture where you can. Change `revision` whenever a light or set piece of that layer changes, and keep it equal across seconds whose static light is the same, so the bake is reused only where it would come out the same.

Tag each color texture as color and each normal or roughness map as data.

### Faces and speech

Use the representation's supported face, expressions and mouth shapes for scripted expression and speech. Check package APIs and report missing controls.

Take accepted speech from [audio acquisition](../audio/acquisition.md). Record the speech model's IPA phoneme chunks in each line's receipt as `phonemeChunks`; the render times each phoneme as an equal share of its chunk and blends the bound speaker's visemes by coarticulation. For finer timing, record a forced aligner's one-phoneme chunks instead and name the aligner in the receipt's `aligner`. A line without chunks opens its speaker's jaw from its own loudness.

Give the film a `speak` member that keeps the mouths it is handed. In `seek`, read each speaking actor's mouth for the placed second and layer it over the authored expression:

- for the polygon man or the Human, `jaw(actor, seconds)` as the jaw opening of its head pose, in millimetres;
- for a VRM or imported model, `visemes(actor, seconds)` as the viseme weights `applyExpression` takes.

The capture and the render hand these mouths, so stills and the delivered video show them. The Viewer reads no sound and shows the authored mouth.

On stills, check that each shape the installed face performs lands on the frames of its sound, with the mouth closed where the line closes the lips. `render-report.json` lists each phoneme-driven line's lip-sync lag and verdict, measured on the mouths the film read; a line whose sound leads the mouth by more than 45 ms or trails it by more than 125 ms blocks the render, so correct its phoneme chunks or start frame. A line listed as `mouth-not-drawn` moved no mouth, because `seek` never read its actor's mouth. Ask the user to watch and listen to the sync as a whole, because neither stills nor the lag measure show whether a line is bound to the right actor.

## Renderer

Prepare the supported renderer settings here. Inspect them with the README's capture command before assembly renders the final picture. Report missing required effects during delivery review.

Use an external renderer only through a documented scene export. Report unsupported exports. Route neural picture generation to [generated film](generated-film.md).

## What to look for

Check the beauty render at delivery size, under the visual debugging skill, for these:

- each subject matches its record and canon references;
- coarse and detailed segments match, as [entity work](../development/entities.md#detail) compares them;
- light direction, color and exposure hold across each scene's cuts;
- contact shadows ground every figure and object;
- consecutive frames show no aliasing, shimmering, flicker or popping;
- no surfaces pass through each other, wardrobe through body included, and none flicker where they meet;
- faces and mouths show what the screenplay decided, with sync left to the user.

Measure camera speed in frame widths per second from the resolved path. [RED's guideline](https://www.reddigitalcinema.com/red-101/camera-panning-speed) is about one frame width per seven seconds at 24 fps with a 180-degree shutter. Ask the user to watch moves above the applicable threshold for judder. Fix observed judder with a slower move, a cut, or the optics' `shutter` and `samples`.
