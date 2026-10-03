# Motion Handbook

Motion communicates intention through timing, weight, trajectory, pose, contact, gaze, and expression. Author a playable verb and its state change, not a bag of keyframes.

## Define the action

Declare subject, target, initial and final states, decisive semantic-event time, duration, interpolation, contacts and continuity. Sample the production frame grid and verify limits, reach, bounds and contacts against those authored conditions.

External motion remains an explicit adoption decision. The user or delegated authoring agent chooses the registered source asset, exact take, direct or humanoid-retarget mode, target actor, bone mapping, root policy, contact policy, trim, and layering. AutoMovie validates and applies that record without choosing a motion library, provider, take, target, or fallback mapping. If the chosen source cannot satisfy its declared channels, rig, contacts, or rights, keep the refusal and ask the decision owner to revise the record; do not substitute a similar clip or silently reinterpret the source.

## Face and gaze

Use only expression and gaze channels the adopted asset supports.

Dialogue mouth motion follows final decoded audio and its adopted alignment when available. The user or delegated authoring agent chooses any recorded or synthesized voice source and, when applicable, its provider, model, version, and voice; nothing here supplies a provider default. Mouth motion stays on the speaker's emission interval even when propagation makes the listener hear the line later. Even spacing characters across a caption interval is not speech synchronization, and missing alignment remains `unsupported` or `not-run` rather than guessed visemes.

## Contact and reaction

At grip, footfall, collision, or impact, inspect both bodies and their relative velocity. Preserve hand-to-object, foot-to-ground, and weapon-to-shoulder contacts across interpolation. Engine collision and timing results are facts. Default reactions derived from them are hints; you may author a stronger or subtler reaction when story, training, surprise, or style warrants it, but declare the variation and keep physical causality legible.

## Measure the contact you claimed

Foot slide, penetration, float, and a body that could not hold the pose it holds are measurable, and the engine measures them. Nothing measures them for you. Each check needs the contact semantics only the action knows, so a clip nobody annotated is a clip nobody checked, and a check that never ran looks exactly like a check that passed.

Declare what the action asserts, then ask the engine whether the clip keeps it.

- `validateGroundContact` sweeps feet, and whole-body capsule proxies when you give them, against a flat ground plane or a height source that answers a `y` for each `(x, z)`, so a hip through a ramp is found and not only a foot through a floor.
- `validateFootSkate` reads the time spans you declare a foot planted and reports the horizontal speed of a foot that was supposed to be still.
- `validateBalanceSupport` projects the segment-mass weighted centre of mass onto the support polygon your declared contact bones span, which is the check for a lean, a reach, or a one-foot balance. It derives that centre from the resolved pose itself, and `bodyCenterOfMass` is the same question asked of a model rather than a performer: the body's declared centre when it states one, the volume-weighted centroid of its primitives when it does not.
- `validateSelfIntersection` tests the capsule pairs you name as parts that may not meet, and pairing is explicit because adjacent limbs share joints and overlap legally.
- `detectBodyCollision` measures two actors against each other from their rigs, clips, capsules, and bodies, and returns the contact events and a suggested response at the deepest penetration alongside the warnings.

Every one of them is a warning tier, not a gate. A film may be deliberately unphysical, so a phasing ghost, a moonwalk, or a wire-fu freeze sets `physicsIntent` on the check and the matching warnings are suppressed, while malformed input (an unknown bone, a detached bone, a non-positive radius, an inverted window) stays an error.

Read the result accordingly. A physical implausibility rides `warnings` on a validation whose `success` is `true`, so code that branches on `success` alone reports a clean run over a clip whose planted foot travels half a metre.

Feed them from the record rather than from a constant. `spaceGround` adapts a space into the ground source the contact checks read, so a clip over a ramp or a platform is judged against the surfaces the production authored instead of a flat plane at zero, and `groundFunction` is the one place a scalar and a height callback become the same thing. `bodyCenterOfMass` answers a model's centre for the object-side of the same question `validateBalanceSupport` asks of a performer.

Two of the answers come with a correction, and neither applies itself. `plantStanceFeet` is the pass that removes skate: it detects stance, solves the leg back onto the pinned contact, and clamps the result into the rig's own range of motion, so a residual it cannot hold stays a warning rather than a silent edit. `detectBodyCollision` returns the response `suggestCollisionResponse` computes at the deepest contact, bounded by joint range of motion into a flinch. Both are hints; the authored reaction stays yours, and this document's contact section already says why a stronger or subtler one can be right.

Call these queries in a production-owned source module over the exact motion, skeleton, ground, and authored contact intervals returned or selected by the producer. Preserve warnings on successful validation results and failures on invalid input. No query invents the contact semantics the author omitted.

Sampling decides what can be seen. Each check samples on its own clock rather than on your keyframes, so a contact shorter than one sample interval falls between samples, and a rate far above the delivery frame rate buys precision the frame never shows.

## Continuity

The end state is part of the clip contract. Record pose, position, facing, held objects, gait phase, expression, and unresolved momentum needed by the next shot. Match-on-action requires compatible direction and phase across both source intervals, not identical clip names.

## Review

Watch at speed, half speed, and frame step. Look for foot slide, penetration, float, instant acceleration, broken arcs, joint flips, contact drift, eye pops, frozen holds, and mismatched settle. Then judge the dramatic verb: correct mechanics that communicate the wrong intention are still a failed motion.

## Look at the motion

Follow [Capture](../review-verification/capture.md) and [Production review](../review-verification/review.md). Inspect contacts and extremes with adjacent frames, and use the `pose` pass for skeletal questions. The declared shot review times are the minimum; add states needed to expose this motion's contact, interpolation and settling failures.
