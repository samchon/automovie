# src/perform/HumanPropOutcome.ts#HumanPropOutcome.drag

## @evidence contracts/development/common.md#meaningful-documentation

Names the body's quadratic coefficient, cross-sectional area and mass and distinguishes absent drag from a zero coefficient.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the admitted body's coefficient, SI area and mass directly into the engine drag record, leaving model-range admission to its existing owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One optional-body gate and one three-field projection own the conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not guess drag from visual geometry or invent a coefficient when the body declares none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant reads and at most one small record allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing body declaration without re-estimating area, mass or aerodynamic behaviour.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh scalar record and retains no prop, callback or host resource.

# src/perform/HumanPropOutcome.ts#HumanPropOutcome.decide

## @evidence contracts/development/common.md#meaningful-documentation

States ordered embed, person-pass, rebound, ground-roll and rest decisions; unknown restitution refuses a potential rebound while explicit zero, embed, pass and ground roll remain distinct.

## @evidence contracts/development/implementation.md#principled-implementation

Prioritizes explicit embedding and person passage, then uses the body's normal restitution and kinetic-or-static friction with the smallest supported collider radius; no measured specimen is flattened into a live coefficient.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Outcome selection stays in one ordered decision tree and delegates collider-size projection to radius; the physics equations remain in projectileContinue.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing rebound coefficients and invalid ratios produce a prop-specific refusal; an absent friction or supported radius still withholds bouncing, and an explicit ground-roll declaration needs no inferred rebound.

## @evidence contracts/development/implementation.md#efficient-algorithms

A scan of S prop colliders costs O(S) time and constant auxiliary storage, followed by at most one outcome allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads current body data and shared collider definitions without retaining mutable outcome caches; bounce and roll use the engine's existing continuation representation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns an owned small outcome or refusal and retains no prop, collider or external resource.

# src/perform/HumanPropOutcome.ts#HumanPropOutcome.legs

## @evidence contracts/development/common.md#meaningful-documentation

Defines the finite nonnegative launch-relative horizon/first contact, strictly advancing later contacts, empty continuation at the horizon, callbacks, settlement and structured time/coefficient refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Admits the initial clock and each later finite absolute contact time before settlement, without changing time. A later contact must fall beyond CONTACT_SECOND, the microsecond a hit's second resolves to, so a converging exchange of contacts refuses instead of looping. Each engine continuation reads the declared outcome, shifts its clock once and sweeps again. A bounce acts on the velocity relative to the struck surface the meeting carries, and a spherical launch bounces as a ball of its body's declared gyration (a uniform solid's 2/5 when undeclared), its spin threaded from bounce to bounce and taken from the turn of a roll a contact interrupts. Only inward gravity supports a returning normal arc; the relative v_n squared over twice that acceleration is its drag-free height and a conservative upper bound with dissipative drag. Outward or tangent gravity cannot trigger radius-based settlement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop owns contact continuation while engine integration, sweeping and settlement remain separate owners supplied through typed inputs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not duplicate projectile equations, clamp callback times, advance by a guessed epsilon or impose an arbitrary bounce count. Nonprogressing, negative, overflowing and nonfinite contact clocks refuse explicitly instead of looping or fabricating a continuation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For K admitted contacts, S colliders, engine continuation costs P_i and sweep costs C_i, work is O(K*S + sum(P_i + C_i)) and returned storage O(K), plus engine-owned drag-flight storage. Contacts at least CONTACT_SECOND apart bound K by the horizon over a microsecond; there is no smaller uniform contact-count bound or callback execution-time guarantee.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each continuation segment is constructed once and retained for later sampling; the engine owns optional drag-flight integration reuse, and this loop installs no callback or cross-flight cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned legs retain only their segments and contacts; local projectile and meeting references are released on return or refusal, and no host task is started.

# src/perform/HumanPropOutcome.ts#HumanPropOutcome.at

## @evidence contracts/development/common.md#meaningful-documentation

States launch-relative seconds, the caller's segment-window precondition and the centre-state result.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates directly to the engine continuation sampler, preserving its segment-specific equations and admission semantics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation keeps frame reading with the engine owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not interpolate stored screenshots, clamp time or invent an alternate trajectory.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant call overhead to the engine segment sampler.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Samples the retained segment without rebuilding contact sweeps or its outcome.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Acquires no task or resource and retains neither leg nor returned state.

# src/perform/HumanPropOutcome.ts#HumanPropOutcome.rest

## @evidence contracts/development/common.md#meaningful-documentation

States velocity-aligned embedding depth in metres, zero-speed handling and that an unshifted result borrows the input state's position.

## @evidence contracts/development/implementation.md#principled-implementation

Moves a sticking point along the normalized nonzero velocity by the declared depth; all other admitted outcomes use the actual contact position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reuses decide for the body's contact policy and shared vector arithmetic for the one embedding offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not invent penetration depth or direction for zero speed; missing physical rebound data keeps decide's refusal rather than becoming an artificial rest.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) collider inspection through decide and constant vector work, with at most two small vectors allocated by the embedding branch.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares outcome policy with continuation planning instead of independently reinterpreting body coefficients.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no prop or state and returns either a fresh embedded point or the borrowed contact position.
