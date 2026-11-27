# Staging

Stage screenplay beats in scene compositions. Recheck changes to blocking, cameras or continuity.

## Reading the scene

Read each beat's action, dialogue and [record](../story/layers/notation.md#records). Include props, supports, entrances, exits, silence and off-screen action. [Trace values](../development/modules.md#documenting-source) to those elements.

## Blocking

<!-- @reference [DGA](https://www.dga.org/the-guild/councils/west/western-adupm-council/committees-of-the-adupm-west/standing-ad-upm-committees/first-ad-committee/setting-background) on cueing background performers. [Disney Animation](https://cdn.disneyanimation.com/uploads/publications/SIGGRAPH_2025_The_Art_of_Crowds_Animation.pdf) on directing attention within a crowd. -->

Stage movement between named zones and landmarks. Resolve coordinates in the set entity.

Use [composition](compose/composition.md#choosing-movement) for each person's actions and reactions. Preserve authored pauses and anticipation.

Give each person purposeful behavior, including off camera. Preserve authored stillness and return missing actions to their [story owner](../story/correction/repair.md#upstream-defects).

Give each entity one transform owner. Fix reach and scale at their owners while preserving the authored outcome.

## The view

Cameras and lights are entities whose behavior follows the action.

Realize [shots and cuts](../story/layers/shots.md) with the installed camera types. Derive field of view from a decided lens. Report views the grammar cannot supply.

Light from the set and story day's sources. Keep direction and color continuous across cuts.

Place the sun of an exterior, or of window light, at the story's site, date and hour. Solve its position with `solveAutoMovieSunPosition` from `@automovie/engine`, and turn it into a world direction with `autoMovieSunDirection` from the set's north and up. Stage the sun as a directional light from that direction as its JSDoc sets, and use the same direction for any daylight instant the scene declares for that hour. A sun below the horizon lights nothing directly.

A motion hint stages no `medium`, because a medium is refused without the film's `optics`, which a hint lacks. A direct 3D film gives a hazy, smoky or dusty set the stage's `medium` beside its `optics`, rather than `fog`, so each lamp and window casts a visible beam. Carry haze in a generated film's shared prompt description.

Inspect each shot's full action at delivery aspect and scale.

- Show where the action happens, its cause, reaction and outcome.
- Keep decisive poses and props readable and in focus.
- Check unintended occlusion, clipping and crowding.
- Check screen direction, eyelines and light against the intended join.

Use diagnostic views for hidden physical relationships. Judge audience understanding in the film camera. Fix framing within the beat's placement or revise the screenplay's camera or space entry. Send lighting defects to the light entity and gaze, contact or penetration to the performing module.

## Segments and handoff

Carry each segment's ending into the next. Review both sides of every join before handing accepted scenes to assembly.
