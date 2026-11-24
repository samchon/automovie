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

Give each detailed entity its surfaces under [materials](../3d-modeling/materials.md).

### Faces and speech

Use the representation's supported face, expressions and mouth shapes for scripted expression and speech. Check package APIs and report missing controls.

Take accepted speech from [audio acquisition](../audio/acquisition.md). Record the speech model's IPA phoneme chunks in the line's [receipt](../audio/acquisition.md#take-adoption), or, for finer timing, a forced aligner's one-phoneme chunks with the aligner named.

Place each speaking actor's figure under the scene node its speaker binding names, and drive a VRM or imported model with `AutoMoviePlayer` and the polygon man with `createAutoMovieHumanPolygonFigure` from `@automovie/render`, or bind any other figure, such as the Human, with `bindAutoMovieDialogueMouth`. After each placement, the capture and the render layer the actor's mouth over the authored expression in the form its representation takes:

| Representation | What moves its mouth |
| --- | --- |
| The polygon man or the Human | `jaw`, from the line's own loudness, even when the line has phoneme chunks |
| A VRM or imported model | `visemes`, from the line's phoneme chunks, or an `aa` viseme from its loudness without them |

The inspector reads no sound and shows the authored mouth.

On stills, check that each shape the installed face performs lands on the frames of its sound, with the mouth closed where the line closes the lips.

`render-report.json` measures the lip-sync lag of each viseme-driven line: a line with phoneme chunks whose actor's figure showed `visemes`. A line whose sound leads its mouth by more than 45 ms or trails it by more than 125 ms blocks the render, so correct its phoneme chunks or start frame. The report lists every other line as unmeasured, and none of these blocks:

- `envelope-jaw`, a line without phoneme chunks, or a line of an actor moved by `jaw`, whose mouth follows its loudness;
- `speaker-not-bound`, a line whose speaker binds to no single actor, so no mouth moves;
- `mouth-not-drawn`, a bound line whose actor no bound figure showed during the line.

Ask the user to watch and listen to the sync as a whole, because neither stills nor the lag show whether a line is bound to the right actor.

## Light

### Light sources

[Staging](../motion/staging.md#the-view) places each light at its motivated source, the sun included. A detailed film keys from that source, then adds a fill that sets the look's contrast and an edge or back light where a figure would merge with its background.

State light in physical units: lux for the sun and other directional lights, candela for lamps and cd/m² for panels. A practical shows its flame or lit screen as [entity work](../development/entities.md#flames-screens-and-lettering) authors it. An emissive surface lights nothing, so give a screen that should light its surroundings a staged area light. Get environment maps for image lighting from [sources](../3d-modeling/sources.md).

### Indirect light

When the scene has image lighting, return `occlusion` from the film's `shading` beside its `optics`, so creases, corners and the ground under each figure darken as the look's contact shadows require. Set its `radius` to the gaps that should darken, about 0.5 m for a room's corners and a figure's footing and less for close-ups of small props.

Where the set's own light should bounce, as in an interior lit by practical lamps or by sun through a window, add `probes` to the same `shading`. Put the static set and its lights on the probes' `layer`, and keep moving actors off it so they receive the bounce without casting it. Space the probes about 0.5 to 1 m apart over the lit space, at most 2048 in all and out of walls and furniture where possible. Change `revision` whenever a light or set piece of that layer changes.

## Renderer

Prepare the light above and the camera response below with the supported renderer settings. Inspect them with the README's capture command before assembly renders the final picture. Report missing required effects during delivery review.

Use an external renderer only through a documented scene export. Report unsupported exports. Route neural picture generation to [generated film](generated-film.md).

### Camera response

Return the camera response from the film's `optics`, in the film module as [source layout](../development/source-layout.md#source) places it. The response holds the exposure in EV100, the white balance as the key light's kelvin, the tone curve, any glare around practical lamps and bright windows, and the adopted grade as ASC CDL values.

Without `optics`, physical light renders white, and the film's `shading` and any staged `medium` are refused.

Meter each scene's key subject with `meterAutoMovieIlluminance` from `@automovie/engine`, and set `ev100` from `autoMovieIncidentEv100` of its lux. Run `checkAutoMovieExposureContinuity` over the film's cuts, grouped by screenplay scene, and mark each exposure change the screenplay decided with `change: true`. The film's [camera response](../contracts/development/films.md#camera-response) item checks the camera response against the look and each marked change against the screenplay.

Give the optics a `shutter`, 180 degrees unless the look decides otherwise, and `samples`, so motion blurs as on film. Where a shot decides focus, author `fNumber` on its frame action and fill the optics' `lens` from `resolveAutoMovieLensAt` at each second, so the focus and any focus pull reach the frame.

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
