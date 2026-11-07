# Kickboxing

Deliver a complete 180-second direct 3D film for [issue 3040](https://github.com/samchon/automovie/issues/3040), with runnable source, a working browser Viewer, actual playback review and a fully decoded final video. The film covers one scheduled three-minute round from the opening bell, its knockout and the aftermath through exactly 180 seconds. The [commission](docs/instructions/commission.md) holds the owner's binding rulings.

## Scope and form {#scope}

The production follows the revised scaffold: [settings](docs/body/settings) as prose facts by domain, [research](docs/research/index.md) by discipline with laws, outcome tables and measurable targets, and the [screenplay](docs/body/screenplay/kickboxing.md) as twelve continuous scenes of exchange beats with beat records. Source realizes them by path: entities from settings facts, laws from research, interactions relating subjects by role, consequences from computed outcomes, and one composition per screenplay scene, ordered by the film in `src/composition/films/kickboxing.ts`.

## The bout {#bout}

Both fighters are highly trained adult men, 180 cm and 80 kg, A in red and B in cyan and navy, fighting at championship level under GLORY principles: combinations that finish with kicks, feints that move the guard, checks answered from the replanted leg, and parries, slips, rolls and blocks; a clinch only for one immediate knee; no elbows, throws or sweeps. A's patterned right body kicks teach B to drop his left arm whenever A's right knee rises; A exploits the tell with a feint and then, at 150.000, with the right Brazilian kick from the body-kick chamber, his instep and lower shin descending over the lowered arm onto the jaw–neck junction behind B's left ear. B falls on his right side; the count starts at 157 with One at 158 through Ten at 167; the knockout is signalled at 167.6; A celebrates from 168.1; the bell rings at 170.1. During every round kick the kicking-side glove reaches forward at the head line and the other guards the cheek.

The fighters use the whole ring (angles, pivots, circling, cutting off, the ropes); the referee is always active, positioning side-on across their line, closing in on the ropes and in clinches, signalling and running the knockdown; one camera inside the ring frames them side-on from the side away from the referee and reframes with the action. Each of these follows a research law and is checked by logic units against the research's measurable targets on the resolved schedule.

## Performance {#performance}

The performance is kinematic. The whole composition resolves once into a frozen schedule through the engine's composition API; every second is a pure function of it. Shapes are body-frame priors fitted by Human's limb fitting; every touching strike is bent onto the receiver's actual region by the engine's relational fit from the held support foot, including the whole-body fit of pelvis and support pivot for the Brazilian kick; contacts are measured on the displayed colliders and every outcome is audited against them; marks, spray and sound follow only measured contacts. Seeded variation draws only takes and spray from the engine's counter-based generator and never changes an outcome class.

The film uses only the original Human polygon figure; photorealistic Human rendering is excluded from this campaign. Universal capability (composition, fitting, geometry, playback, mixing, export and decoding) belongs to the packages.

## Video-generation prompts {#video-generation-prompts}

The user has additionally commissioned prompt preparation for video diffusion: English requests that let a selected generator restyle the deterministic 3D render into a live-action film, covering 0–180 seconds without a gap. The render is the motion, camera, contact and timing reference; the requests change only appearance and finish. The planned receiver is BytePlus ModelArk Seedance 2.5 in reference mode under the [handoff contract](docs/research/video-generation/seedance-2-5-handoff-contract.md). The requests live in [video prompts](docs/prompts/videos/source-bindings.md). This commission authorizes no upload, generation job, paid call or download.
