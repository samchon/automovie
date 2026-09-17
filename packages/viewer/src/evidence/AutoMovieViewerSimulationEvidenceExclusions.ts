/**
 * Viewer package boundaries for simulation, effects and sound.
 *
 * The package's lint.config.ts selects this declaration as an exclusion
 * carrier within its complete public-source population. It has no runtime
 * state and is not re-exported by the package barrel. Each declared
 * target/reason pair below owns one intentional negative relationship;
 * requirement and specification boundaries for this domain stay together.
 * Positive implementation citations remain on the actual public exports.
 * An exclusion neither implements a feature nor approves a rendered asset.
 * Add a boundary at its semantic owner and retain native graph validation.
 *
 * @evidenceExclude requirements/effects-and-simulation/budgets-and-bounded-work.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/clock-seek-and-determinism.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/damage-and-destruction-boundary.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/environment-coupling.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fire-smoke-and-atmosphere.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-conservation-account The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-object-interaction The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-refusal The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-seek-state The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/fluids-and-water.md#effects-fluid-volume-boundary The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/particles-and-emission.md#effects-emitter-geometry The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/particles-and-emission.md#effects-particle-contact-consequence The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/particles-and-emission.md#effects-particle-lifetime-state The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/particles-and-emission.md#effects-particle-refusal The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/particles-and-emission.md#effects-spawn-interval-boundary The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/README.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/scope-and-simulation-tiers.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-colliders The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-discretization-identity The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-fidelity-boundary The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/effects-and-simulation/validation-and-evidence.md The viewer displays resolved effects; simulation solving, budgets, validation, and refusal remain upstream.
 * @evidenceExclude requirements/sound/ambience-and-sustained-sources.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/dialogue-voice-and-visemes.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/editing-synchronization-and-continuity.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/event-cues-and-timing.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/foley-and-sound-effects.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/interior-acoustics.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/mix-hierarchy-and-loudness.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/music-and-silence.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/README.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/scope-and-identity.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/sources-and-external-assets.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/spatialization-and-propagation.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude requirements/sound/validation-and-delivery.md The viewer is the visual projection boundary; sound authoring, acoustics, mixing, synchronization policy, and audio delivery remain outside it.
 * @evidenceExclude specifications/simulation-effects-and-sound/ambience-music-spatial-and-acoustics.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/budget-admission.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/clocks-ordering-seek-and-checkpoints.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#coupled-world-snapshot-contract The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-moving-object-interaction The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#fluid-seek-and-checkpoint-state The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/fluids-water-and-world-coupling.md#world-coupling-invalidation-and-refusal The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/mix-stems-loudness-and-av-join.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#atmosphere-composition-light-visibility-output The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#fire-source-fuel-and-lifecycle-state The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-fire-refusal-and-claim-boundary The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#particle-lifecycle-contact-consequence The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/particles-fire-and-atmosphere.md#smoke-wind-and-domain-boundary The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/README.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/rigid-collision-and-damage.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/scope-tiers-and-identities.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-failure-and-fidelity-boundary The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 * @evidenceExclude specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md The viewer displays resolved visual effects; solvers, acoustics, sound, budgets, validation, and refusal remain upstream.
 */
export type AutoMovieViewerSimulationEvidenceExclusions = never;
