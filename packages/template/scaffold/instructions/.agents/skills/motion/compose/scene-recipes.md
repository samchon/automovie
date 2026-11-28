# Scene recipes

Compile and play a recipe with the project's installed package versions. Check their public JSDoc for argument names, available roles and defaults. Keep the choices that serve the beat and qualify changes in the delivery view.

## Pass a bottle

Start with two standing performers on the same floor. Give each a reachable facing position and a free right hand. Use `AutoMovieArchetypeDrinkware.create({ kind: "waterBottle" })` and keep the same prop subject from pickup through the outcome. The stock model supplies its `body` and `neck` grips.

Start each with `AutoMovieMotionHumanChain.subject`. Let the giver pick up the `body` and the receiver stand within reach. Apply `AutoMovieMotionHumanChain.mutual` with `AutoMovieMotionHumanMutual.handOver`, the two chains and the receiving `neck` grip. Resolve the composition with `AutoMovieMotionHumanPerformance`.

Use the [installed passage example](https://github.com/samchon/automovie/blob/master/experimental/e2e-template/installedPassageFilm.ts) with the SDK revision it exercises. It also shows how to draw the posed performers and the bottle from the same performance.

Find and capture the played transfer. Check the giver's custody before it and the receiver's custody after it. Carry the receiver's state into the next interval of the same film. For a withdrawn offer, set `outcome: "withdraw"` and expect the prop to stay with the giver. Keep the transfer pending when the receiver or receiving grip is unavailable. Confirm reach, hand ownership and visibility again when a body, support, prop or camera changes.

Choose the entrance and exit under [passage judgment](../judgment.md#before-widening). Use the [law route](../laws/authoring.md) when the beat requires mechanics that the installed actions cannot express.


## Recover in surface water

<!-- @reference https://github.com/samchon/automovie/issues/4301 -->

Use a shared `water` height in world metres for the surface actions. A `dogPaddle` with an authored cycle count and turn can lead into `falter` and then `float`. Read the mouth against that same waterline at `dip` and `breath`, and check the pose across the join into the float.

For a ledge exit, stage `AutoMovieArchetypePoolEdge.create({ kind: "deckEdge" })` as a fixed prop with its actual `deckFace`. Place the swimmer within reach, play `falter` and `treadWater`, then use `AutoMovieMotionHumanSwim.aquatic` with `kind: "edgeExit"` and the named pool edge. Check `hands` on the played clock and the two palm and two sole contacts on the deck. Refit the approach for the chosen body and deck height before using the exit in a shot.

## Carry a carton together

<!-- @reference https://github.com/samchon/automovie/issues/4308 -->

Use `AutoMovieArchetypeBox.create({ sideHandles: true })` with its two opposed handles. Give `AutoMovieMotionHumanSharedCarry.stage` the carton, two named performers and their hand and handle choices, the named start and end support sites, and the authored course between them. Place the carton within reach on the starting support. The installed rehearsal moved it between two marks on the same stock workbench top.

Play the two returned chains together in `AutoMovieMotionHumanPerformance` with `laws: [stage.law]` and `sharedCarry: [stage.episode]`. Read each role's `gripClosed`, `settled` and `release` on the played clock. Check both material grips while the carton is moving and the remaining hand after the first release. Once both hands release, a subsequent ordinary pickup can take the same carton subject from its settled frame.

The installed rehearsal exercised the action and contact timings through the public SDK. Check the selected body's reach and support on the played clock, then review the action through the production's own camera.
