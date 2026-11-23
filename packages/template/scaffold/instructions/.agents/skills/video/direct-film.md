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

Use record and canon materials in the installed format. Get textures and environment maps from [sources](../3d-modeling/sources.md). Use clay for form and beauty for materials under [form inspection](../3d-modeling/inspection.md#light-and-material).

[Staging](../motion/staging.md#the-view) places each light at its motivated source. A motivated practical shows its source, a flame or a lit screen, as [entity work](../development/entities.md#flames-screens-and-lettering) authors it. An emissive surface lights nothing, so a screen that should light its surroundings needs a staged area light. A detailed film keys from that source, then adds a fill that sets the look's contrast and an edge or back light where a figure would merge with its background.

State light in physical units: lux for the sun and other directional lights, candela for lamps and nits for panels. Return the camera response from the film's `optics`, in the film module as [source layout](../development/source-layout.md#source) places it. It holds the exposure in EV100, the white balance as the kelvin of the key light, the tone curve, any lens glare around practical lamps and bright windows, and the adopted grade as ASC CDL slope, offset, power and saturation. Without `optics`, physical light renders white.

Place the sun from the story's site and hour as [staging](../motion/staging.md#the-view) says, and stage it as a directional light; a daylight instant's beam never reaches the frame. Meter each scene's key subject with `meterAutoMovieIlluminance` from `@automovie/engine` and set `ev100` from `autoMovieIncidentEv100` of its lux. Run `checkAutoMovieExposureContinuity` over the film's cuts, grouped by screenplay scene, and mark each exposure change the screenplay decided with `change: true`.

Give the optics a `shutter`, 180 degrees unless the look decides otherwise, and `samples`, so motion blurs as it would on film. Where a shot decides focus, author `fNumber` on its frame action and return `lens` from `resolveAutoMovieLensAt` at each second, so the focus and any focus pull reach the frame.

Tag each color texture as color and each normal or roughness map as data.

### Faces and speech

Use the representation's supported face, expressions and mouth shapes for scripted expression and speech. Check package APIs and report missing controls.

Take accepted speech from [audio acquisition](../audio/acquisition.md). Drive visemes from service phoneme times or forced alignment of the line to that audio.

On stills, check that each shape the installed face performs lands on the frames of its sound, with the mouth closed where the line closes the lips. Ask the user to watch and listen to the sync as a whole, because stills cannot show it.

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
