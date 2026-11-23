# src/motion/AirborneTakeoffTrial.ts#AirborneTakeoffTrial

## @evidence contracts/development/implementation.md#principled-implementation

Each residual comes from its actual torque-free flight under the integration tolerance; the judged one also under the momentum budget. A Jacobian is the integrated sensitivity of that same flight, never a guessed one or a derivative of another mesh. Angle unwrapping retains the original default-step branch convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One evaluator selects an exact existing point or integrates the requested physical/tangent system, then retargets the unchanged endpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Neither residual acceptance nor physical error is reused at a nearby momentum, and a judged evaluation never reuses a search point. Generic histories retain their original independent meshes and callback errors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Search points skip the dense momentum probes (four right-hand sides and the probe roots a step); only the judged solution pays them, once. Owned-history integrations share exact error-checked time partitions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only Object.is-equal momentum components reuse endpoint/flight data from the caller's current and last rejected points; a required Jacobian must actually be present. Factory history provenance permits a call-local time mesh, not shared states or verdicts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns at most its current and last rejected evaluations and releases the operation mesh in finally. No point map or cross-call cache exists; completed flight playback retains only numeric trajectory data.

## @evidence contracts/development/common.md#meaningful-documentation

States search points under the embedded estimate, the judged evaluation under the momentum control, exact-point reuse, frames and lifetime.
