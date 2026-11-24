# src/perform/HumanSegmentPose.ts#HumanSegmentPose.displayed

## @evidence contracts/development/common.md#meaningful-documentation

States displayed pose, film seconds and the person's placement-dependent cache.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the last placed segment whose entry is at or before the second with the existing 1e-12 allowance, then uses its displayed evaluator or the initial standing pose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One cache lookup, one reverse last-match selection on a miss, one evaluation and bounded insertion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

While the schedule is being resolved a pose is shared only within one action's planning (`HumanSegment.planning`), never across a placement. Observational requests may borrow an existing complete pose but never store partial results; public whole-pose queries remain complete at exact seconds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hits cost one map lookup; misses inspect R entries from the end, at most S segments, and pay the selected evaluator's fitting cost, retaining at most 4096 pose references per person.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exact film-second queries share completed poses only after placement is settled; HumanSegment.forget clears them when plans, stops or placement dependencies change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The person owns the FIFO-bounded 4096-entry map and releases it on forget; returned cached pose references retain their existing borrowed ownership, with no copy or new process-wide cache.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose

## @evidence contracts/development/common.md#meaningful-documentation

States that an explicitly selected action can be evaluated even while inactive.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the seeded displayed evaluator with no nearby fit context and returns its pose, preserving the cold evaluation's contacts and clamp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation keeps the full evaluation at seeded.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No active-segment or displayed-cache result replaces the explicitly requested segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Adds constant wrapper work to seeded's layer, overlay, transition and limb-fitting costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the evaluator's implementation rather than caching poses across different segment or fit contexts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The wrapper retains no state and returns the evaluator's original pose reference.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.seeded

## @evidence contracts/development/common.md#meaningful-documentation

Names the leaf, carry, stop and planted fits and explains how only the matching nearby seed continues each one.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates layers, overlay/carry fits, stopped weapons, transition offset, range clamps and final planted refits in their original order; rate samples continue the cut's own seeds rather than unrelated evaluation history. The performer's rig stays unchanged during this synchronous evaluation, so its repeated clamps may share prepared metadata.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A shown-posture reader, one named-fit adapter and ordered stop/transition/contact stages retain their separate physical responsibilities; HumanSegmentStop owns the stopped-frame reader and HumanSegmentPlant the final planted refit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Different under-postures, overlay sets and nearby seeds still receive separate fits; no clamp, contact solve, transition sample or tolerance is removed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hold selection is one O(H) ordered pass with at most two lazy plan-side drive scans and four scalar side states; no carried holds means no second active-overlay scan. Finger application copies the J existing joint entries once plus the F held entries, O(J+F). Cold final plants retain attachment-order checks but omit unused nearby keys and tuple arrays. The clamps prepare B skeleton bones and D distinct joint names once; all projection and fit work remains.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One explicit same-body preparation shares ROM metadata and lazy exact FK prerequisites across raw action calls, synchronous layer contexts, overlays/carries/stops, final plants and transition samples. Actual projections, goals and near fits remain separate; observational omission belongs only to conservative dependency proofs. Offset capture also shares its unchanged-rig codec without sharing numerical conversions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The outer evaluation owns its preparation, local pose/seed maps and per-side metadata until return or throw. Only last successful FK dependency tuples and rig metadata are retained during that operation. No returned pose, fit seed or transition offset captures the preparation. Existing held carry numbers and concrete transition codecs retain their original forget lifetime.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.continued

## @evidence contracts/development/common.md#meaningful-documentation

States the cold instant, fit-seeded one-sided samples, decay-derived tolerance and optional same-rig codec source demanded after sampling, all at film seconds.

## @evidence contracts/development/implementation.md#principled-implementation

Uses samplePoseVelocity's one-sided second-order difference with STEP and its decay-dependent swivel tolerance; all three rate samples continue the same cold instant's named fits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The engine calls the cold callback first, assigning its seeds before the continued callback records the three rate samples; no unused initial seed map is created.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the cold pose distinct from the continued instant sample and never merges them solely because their seconds match.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one cold and three continued evaluations plus samplePoseVelocity's linear joint differencing; retained samples and fit seeds scale with those evaluations' joint and fit counts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the cold instant's seeds only through the explicitly supplied near context; an optional same-rig codec shares metadata at the engine's existing post-sample stage, without memoizing conversions. No global last-pose or time-only sample cache changes branch selection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local seed references last through the synchronous sampling call. A supplied codec/getter stays with its explicit parent and enters neither state nor samples. The state and sample-array wrappers are new; their poses and seed-derived members keep the supplied reader's ownership, with no persistent sample map.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.IFits

## @evidence contracts/development/common.md#meaningful-documentation

Identifies each named seed and its null state.

## @evidence contracts/development/design.md#principled-representation

Reuses the exact fit-name map without changing seed representation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the evaluator's existing public type at one alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No parallel map or widened key representation is introduced.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.INear

## @evidence contracts/development/common.md#meaningful-documentation

Names the borrowed seed map and its degree tolerance.

## @evidence contracts/development/design.md#principled-representation

Reuses HumanSegmentPoseSeeds.INear with the same exact fit identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the evaluator's existing nearby argument type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This alias changes no branch, tolerance or seed ownership.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.ISeeded

## @evidence contracts/development/common.md#meaningful-documentation

Identifies canonical pose and fit-seed result members.

## @evidence contracts/development/design.md#principled-representation

Reuses HumanSegmentPoseSeeds.ISeeded without a second result shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves the evaluator's existing result type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias adds no state, optional alternatives or casts.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.IContinued

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the state and existing ordered sample tuple.

## @evidence contracts/development/design.md#principled-representation

Reuses HumanSegmentPoseSeeds.IContinued and the engine velocity state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preserves the transition and entry readers' existing result type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sample or continued instant is merged with the cold state.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.entryPosture

## @evidence contracts/development/common.md#meaningful-documentation

Describes the carried posture and the native breath evaluated separately by the displayed-pose path.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the same person, posture and film seconds through the shared layer owner's entry evaluation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forwarding call selects entry evaluation for the layer owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No field, contact goal, random key or returned posture reference is transformed by the wrapper.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant wrapper work plus HumanSegmentLayer.apply's window scan and active layer/mix costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Displayed and entry-state evaluations use the same layer implementation while retaining separate input postures.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The wrapper retains nothing and returns the delegated posture reference unchanged.

# src/perform/HumanSegmentPose.ts#HumanSegmentPose.initial

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the person's initial posture as the input and its resolved canonical pose as the result.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the actual initial posture through the performer's own body and ordinary posture constraints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to the posture resolver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cached first action, generic rig or authored fixture substitutes for the person's initial state.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant wrapper work plus the posture resolver's joint and limb-fitting costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared resolver without adding a cache across mutable bodies or initial postures.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains no state and returns the resolver's result unchanged.
