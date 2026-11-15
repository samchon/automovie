---
name: direct-film
description: Finishes a programmed film as a direct 3D film, rendered without video diffusion, namely the detail each subject shows, its materials, light and grade, faces and speech, the renderer's effects, and what to check in its picture. Use when a direct 3D film is commissioned, before switching on its detail options, and when judging its rendered picture.
---

# Direct 3D film

A direct 3D film is the programmed film itself, rendered at the detail its commission sets. No video model repaints it, so everything the audience sees comes from the entities, their light and the renderer. Motion, staging and camera are authored and accepted on the coarse forms first, as [entity work](../development/entities.md#detail) sets, and this skill switches the detail on last.

## Detail

Give each subject the [detail option](../development/entities.md#detail) its closest shot needs, built under [3D modeling](../3d-modeling/SKILL.md#requested-detail) from its record and canon references, and record the selection in [project context](../production/project-context.md). Ask the user which subjects need detail and from which source, because 3D modeling leaves a detailed form's source to the user.

A person keeps the skeleton and proportions the motion was accepted on. The detailed body comes from the installed human package where it offers one, otherwise from a generated or found body bound to that skeleton under [rigging](../3d-modeling/rigging.md). Wardrobe and hair are detail options of the same cast entity, rigged to the same skeleton. Secondary motion the installed packages do not simulate, such as cloth or hair following the body, follows [a defect or a gap](../development/reuse.md#a-defect-or-a-gap).

## Look

The look comes from the settings or brief cinematography and set records and is recorded in project context.

Give each surface a material from its record and canon references, in the form the installed interface package's types describe, and take textures and environment maps from [sources](../3d-modeling/sources.md). Judge form in clay and materials in the beauty render, as [inspecting a form](../3d-modeling/inspection.md#light-and-material) sets.

[Staging](../motion/staging.md#the-view) places each light at its motivated source. On a detailed film, light also models faces and separates each figure from its ground: a key from the motivated source, a fill that sets the contrast the look asks for, and an edge or back light where a figure would merge with what is behind it. Set one exposure and working color space for the film, and keep the grade in the film module, as [source layout](../development/source-layout.md#source) places it.

## Faces and speech

A face the representation adopts, from a detail option or one the renderer draws on the polygon man, carries the expressions and speech the screenplay decides. Read in the installed packages' READMEs and types which faces, expressions and mouth shapes they perform, and follow a defect or a gap for one the film needs and they lack.

Speech comes as accepted takes under [audio acquisition](../audio/acquisition.md). Time each mouth to its take's measured lines, and ask the user to watch and listen to the sync, because stills cannot show it.

## Renderer

The installed renderer draws the film through the README's render command. Read in its README which effects it draws, such as depth of field, motion blur and antialiasing, and at what cost. An effect the commission needs and the renderer lacks follows a defect or a gap, and [delivery review](../review/delivery-review.md) discloses it.

A renderer outside the installed packages, such as an offline path tracer or a 3D suite, is reached only through an export the installed packages provide; where none exists, tell the user rather than write one in the production. A model that renders photoreal frames from the film's channels makes a generated film under [video](../video/SKILL.md).

## What to look for

[Visual debugging](../visual-debugging/SKILL.md) owns capture and comparison. Check the beauty render at delivery size for these:

- each subject matches its record and canon references, and the coarse and detailed segments match as [entity work](../development/entities.md#detail) compares them;
- light direction, color and exposure hold across each scene's cuts;
- contact shadows ground every figure and object;
- consecutive frames show no aliasing, shimmering, flicker or popping;
- no surfaces pass through each other, wardrobe through body included, and none flicker where they meet;
- faces and mouths show what the screenplay decided, with sync left to the user.
