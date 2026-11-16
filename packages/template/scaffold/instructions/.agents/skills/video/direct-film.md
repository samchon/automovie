# Direct 3D film

A direct 3D film is the programmed film itself, rendered at the detail its commission sets. Everything the audience sees comes from the entities, their light and the renderer.

Accept motion, staging and camera on the coarse forms first. Then select the same entity's commissioned [detail option](../development/entities.md#detail), preserving the accepted performance.

## Detail

Select each subject's commissioned [detail option](../development/entities.md#detail). Build a missing option under [3D modeling](../3d-modeling/SKILL.md#requested-detail) from its record and canon references.

A person keeps the skeleton and proportions the motion was accepted on. The detailed body comes from the installed human package where it offers one, and otherwise from a generated or found body bound to that skeleton under [rigging](../3d-modeling/rigging.md). Wardrobe and hair belong to the same cast entity's detail option, rigged to the same skeleton, as one clothed mesh or as separate garments that change by story day without a new body.

Cloth and hair follow the body only as far as the installed packages simulate them. Where they do not, tell the user it is a limit of the film.

## Look

The look is the one [project context](../production/project-context.md) records, taken on long work from the settings cinematography record and on a short from the user.

Give each surface a material from its record and canon references, in the form the installed interface package's types describe, and take textures and environment maps from [sources](../3d-modeling/sources.md). Judge form in clay and materials in the beauty render, as [inspecting a form](../3d-modeling/inspection.md#light-and-material) sets.

[Staging](../motion/staging.md#the-view) places each light at its motivated source. On a detailed film, light also models faces and separates each figure from its ground: a key from the motivated source, a fill that sets the contrast the look asks for, and an edge or back light where a figure would merge with what is behind it.

Set one exposure and tone curve for the film among those the renderer offers, tag each color texture as color and each normal or roughness map as data, and keep the grade in the film module, as [source layout](../development/source-layout.md#source) places it.

## Faces and speech

A face the representation adopts, from a detail option or drawn by the renderer on the polygon man, carries the expressions and speech the screenplay decides. Read in the installed packages' READMEs and types which faces, expressions and mouth shapes they perform, and follow a defect or a gap for one the film needs and they lack.

Speech comes as accepted takes under [audio acquisition](../audio/acquisition.md). Drive each mouth by a track of mouth shapes, visemes, timed from the take's phonemes: those a speech service reports, or a forced alignment of the screenplay's line to the accepted audio. On stills, check that each mouth shape lands on the frames of its sound, with the mouth closed where the line closes the lips, within the shapes the installed face performs. Ask the user to watch and listen to the sync as a whole, because stills cannot show it.

## Renderer

The installed renderer draws the film through the README's render command. Read in its README and types which effects it draws, such as depth of field, motion blur and antialiasing, and at what cost; treat an effect they do not name as absent. An effect the commission needs and the renderer lacks follows [a defect or a gap](../development/reuse.md#a-defect-or-a-gap), and [delivery review](../review/delivery-review.md) discloses it.

A renderer outside the installed packages, such as an offline path tracer or a 3D suite, can draw the film only through a scene export the packages document. Where they document none, tell the user it is a limit of the film rather than write an exporter in the production. A model that renders photoreal frames from the film's channels makes a [generated film](generated-film.md).

## What to look for

[Visual debugging](../visual-debugging/SKILL.md) owns capture and comparison. Check the beauty render at delivery size for these:

- each subject matches its record and canon references, and the coarse and detailed segments match as [entity work](../development/entities.md#detail) compares them;
- light direction, color and exposure hold across each scene's cuts;
- contact shadows ground every figure and object;
- consecutive frames show no aliasing, shimmering, flicker or popping;
- no surfaces pass through each other, wardrobe through body included, and none flicker where they meet;
- faces and mouths show what the screenplay decided, with sync left to the user.

A pan or fast move judders when it crosses the frame faster than the frame rate and motion blur carry, and stills cannot show it. Measure each camera move's speed in frame widths per second from the resolved camera path, against a rule of thumb such as [RED's](https://www.reddigitalcinema.com/red-101/camera-panning-speed), about one frame width in seven seconds at 24 fps with a 180-degree shutter. Ask the user to watch the moves above it, and repair a judder at the screenplay's camera entry with a slower move or a cut, or with the renderer's motion blur.
