# Staging

Staging turns screenplay beats into scene compositions, and returns whenever blocking, cameras or continuity change. The screenplay owns every edit decision.

## Reading the scene

List each beat's elements: its action and dialogue blocks and each entry of its [record](../story/layers/notation.md#records), with the props, supports, entrances and exits they involve. Include authored silence, stillness and off-screen action. Realize each element as values in the composition and comment each value under [realization comments](../contracts/development/composition.md#realization-comments). Map beats to setups as needed.

## Blocking

<!-- @source [DGA](https://www.dga.org/the-guild/councils/west/western-adupm-council/committees-of-the-adupm-west/standing-ad-upm-committees/first-ad-committee/setting-background) on cueing background performers. [Disney Animation](https://cdn.disneyanimation.com/uploads/publications/SIGGRAPH_2025_The_Art_of_Crowds_Animation.pdf) on directing attention within a crowd. -->

Stage in the set's zones and landmarks, never in coordinates: each beat's spatial change moves its participants between them through entity capabilities, and the set entity resolves where that is.

Compose each person's actions, reactions, pauses and outcomes with the installed operators. Use the action's preparation and follow-through. Add anticipation only where the screenplay decides it.

Follow [living scene](../contracts/development/composition.md#living-scene) for every presence. Stage participants whose choices affect the exchange even while the camera follows someone else. Give background activity a purpose and let it settle when the scene calls for stillness. Return a missing action or response to the writer under [upstream defects](../story/correction/repair.md#upstream-defects).

Each entity has one transform owner, so a clip, an attachment and a procedural driver never fight for the same state. A reach or scale mismatch is fixed at its owner, never by changing the outcome.

## The view

Cameras and lights are entities whose behavior follows the action.

Realize [shots and cuts](../story/layers/shots.md) with the installed camera types. Derive field of view from a decided lens. Report views the grammar cannot supply.

Light from the set and story day's sources. Keep direction and color continuous across cuts.

Place the sun of an exterior, or of window light, at the story's site, date and hour. Solve its position with `solveAutoMovieSunPosition` from `@automovie/engine`, and turn it into a world direction with `autoMovieSunDirection` from the set's north and up. Stage the sun as a directional light from that direction as its JSDoc sets, and use the same direction for any daylight instant the scene declares for that hour. A sun below the horizon lights nothing directly.

For a direct 3D film, give a hazy, smoky or dusty set the stage's `medium` rather than `fog`, so each lamp and window casts a visible beam. A medium draws only through the film's `optics`, which a motion hint lacks, so a hint leaves the haze to the look in the [video prompts](../video/diffusion/prompts.md#shared-description).

Inspect every shot at the delivered aspect and scale through the whole action, in the camera's frames rather than in subject bounds:

- the subject the beat names reads at the decided size;
- the pose and movement that carry the beat read against the surrounding figures and background;
- no head or limb is cut at a joint or crowded against the frame edge unless the shot intends it;
- the intended cue leads attention through competing actions, including a reaction or sound when the cause stays out of view;
- screen direction, eyelines and light hold across each cut, apart from a discontinuity the screenplay decided.

Use a diagnostic view to check a hidden physical relationship. Judge what the audience learns in the film camera. Fix framing within the beat's placement or revise the screenplay camera or space entry. Send lighting to the light entity and gaze, contact or penetration to the performing module.

## Segments and handoff

Build contiguous segments, pass each through [segment review](segment-review.md) with the accepted ending carried into the next and both sides of the join checked, and hand accepted scenes to [assembly](../production/assembly.md).
