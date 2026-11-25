# Staging

Stage screenplay beats in scene compositions. Recheck staging after changes to blocking, cameras or continuity.

## Reading the scene

Read each beat's action, dialogue and [record](../story/layers/notation.md#records). Include props, supports, entrances, exits and authored silence or off-screen action. [Trace](../development/modules.md#documenting-source) the composition values to those elements.

## Blocking

<!-- @source [DGA](https://www.dga.org/the-guild/councils/west/western-adupm-council/committees-of-the-adupm-west/standing-ad-upm-committees/first-ad-committee/setting-background) on cueing background performers. [Disney Animation](https://cdn.disneyanimation.com/uploads/publications/SIGGRAPH_2025_The_Art_of_Crowds_Animation.pdf) on directing attention within a crowd. -->

Stage movement between named zones and landmarks. Let the set entity resolve coordinates.

Use [composition](compose/composition.md#choosing-movement) for each person's actions and reactions. Preserve authored pauses and anticipation.

Follow [living scene](../contracts/development/composition.md#living-scene) for everyone present. Stage purposeful activity away from the camera and preserve authored stillness. Return missing behavior under [upstream defects](../story/correction/repair.md#upstream-defects).

Give each entity one transform owner. Fix reach and scale at their owners while preserving the authored outcome.

## The view

Cameras and lights are entities whose behavior follows the action.

Realize [shots and cuts](../story/layers/shots.md) with the installed camera types. Derive field of view from a decided lens. Report views the grammar cannot supply.

Light from the set and story day's sources. Keep direction and color continuous across cuts.

Place the sun of an exterior, or of window light, at the story's site, date and hour. Solve its position with `solveAutoMovieSunPosition` from `@automovie/engine`, and turn it into a world direction with `autoMovieSunDirection` from the set's north and up. Stage the sun as a directional light from that direction as its JSDoc sets, and use the same direction for any daylight instant the scene declares for that hour. A sun below the horizon lights nothing directly.

A motion hint stages no `medium`, because a medium is refused without the film's `optics`, which a hint lacks. A direct 3D film gives a hazy, smoky or dusty set the stage's `medium` beside its `optics`, rather than `fog`, so each lamp and window casts a visible beam. A generated film carries the haze in its [video prompts](../video/diffusion/prompts.md#shared-description).

Inspect every shot at the delivered aspect and scale through the whole action, in the camera's frames rather than in subject bounds:

- the subject the beat names reads at the decided size;
- the pose and movement that carry the beat read against the surrounding figures and background;
- no head or limb is cut at a joint or crowded against the frame edge unless the shot intends it;
- a cue leads attention through competing actions, including reactions to off-screen causes;
- screen direction, eyelines and light hold across each cut, apart from a discontinuity the screenplay decided.

Use a diagnostic view to check a hidden physical relationship. Judge what the audience learns in the film camera. Fix framing within the beat's placement or revise the screenplay camera or space entry. Send lighting to the light entity and gaze, contact or penetration to the performing module.

## Segments and handoff

Carry each segment's ending into the next and [review](segment-review.md) both sides of the join. Hand accepted scenes to [assembly](../production/assembly.md).
