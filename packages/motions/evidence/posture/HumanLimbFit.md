# src/posture/HumanLimbFit.ts#HumanLimbFit.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Names the three identities and distinguishes their engine-owned structure from the Human naming policy.

## @evidence contracts/development/design.md#principled-representation

The existing engine descriptor has exactly the same three required mutable AutoMovieHumanoidBone fields as this Human chain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Aliases IAutoMoviePlantChain instead of maintaining a parallel structure; the fit and reference keep their existing IChain name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias changes no field, optionality or bone union; chain still selects names from the limb's side and kind.

# src/posture/HumanLimbFit.ts#HumanLimbFit.chain

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The side and the kind name the bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every limb of the posture's union has its chain.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/posture/HumanLimbFit.ts#HumanLimbFit.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the fit, the re-aim with its sources and bounds, the attachment and the clearance.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's two-bone fit, a fixed-point re-aim with Anderson mixing, and the clearance as the fit's obstruction. A continued arm whose admitted arc vanished is refused, since keeping the hand's turn would jump the elbow to another arc and leaving it would misstate the goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One world goal, one obstruction, one fit, then the re-aim loop and the toes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The re-aim keeps the fit whose contact lay nearest, not its last pass, and stops at `REAIM_PASSES`.

## @evidence contracts/development/implementation.md#efficient-algorithms

One lazy canonical source read requests only the actual effector, attachment and selected trunk/thigh/placed-arm obstacle frames plus their ancestors, preserving all authored admission. At most REAIM_PASSES targets share rig work, a re-aim pass after the first continuing the first pass's seed instead of searching again, and every obstruction candidate shares fixed shape-frame preparation; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One authored reader, limb workspace and prepared obstruction serve the fixed body/source pose, placed colliders, goal bend/rotation/reference and cold/near mode; only fit targets and candidate points vary. No callback value, distance or fitted answer is shared across distinct candidates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns one source-FK map, fit workspace and at most one opaque distance reader per queried fixed shape through synchronous return or failure. Its lazy reader is local or borrowed; only pose/seed/value escape, and no returned plan or body-memory entry captures readers or callbacks.

# src/posture/HumanLimbFit.ts#HumanLimbFit.continued

## @evidence contracts/development/common.md#meaningful-documentation

Names explicit continuous-curve point fitting and unchanged source, goal, near and result units.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the engine's prepared current-target hinged correction before generic cold work; the owned curve separately checks actual current constraints and deterministic branch continuity. Public fit keeps original ordering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares one attachment/clearance/contact kernel and changes only its point-fitting entry; no duplicate limb solver or contact algorithm is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No public prepared bit, changed goal, skipped source admission or altered tolerance; unsupported correction falls back through the engine's same-source cold owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Avoids generic pole/source ranking before a valid current hinged correction, while retaining actual FK/ROM/orientation and curve checks. Runtime gains are unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Borrows the same goal-specific workspace and actual source reader; every current/re-aimed point is fitted, with no prior pose answer reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Point-policy closures and workspaces remain synchronous, and independent output/cache ownership stays with the existing fitting owner.

# src/posture/HumanLimbFit.ts#HumanLimbFit.direct

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved, what the pose must hold, the two policies and when `admit` runs.

## @evidence contracts/development/implementation.md#principled-implementation

The world goal, the arm's obstruction, the engine's prepared two-bone fit placed from the body's chain constants, and the contact re-aim, as `fit` documents them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One kernel serves both policies; the mirror image, the root-position frame and the reduction belong to `solveHumanLimbFit`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal, tolerance or admission is changed; `admit` runs at the first read's own place, after an attachment's refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fit's own search over the records given; every scan is linear in those records.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One authored reader, limb workspace and prepared obstruction serve every target of the contact re-aim; the body lends the limb's rig-only readers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns its source reading and workspace until return or throw; only the pose, seed and value escape.

# src/posture/HumanLimbFit.ts#HumanLimbFit.at

## @evidence contracts/development/common.md#meaningful-documentation

Names the owner of the closed-form placement.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to HumanLimbAt.at, the engine's fitHingedChainAt on the fit's own request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forwarding call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The given swivel is kept; nothing is searched.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanLimbFit.ts#HumanLimbFit.seed

## @evidence contracts/development/common.md#meaningful-documentation

Names the owner of the seed reading.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to HumanLimbAt.seed, the engine's readHingedChainSeed on the fit's own request.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forwarding call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No search.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanLimbFit.ts#HumanLimbFit.reflected

## @evidence contracts/development/common.md#meaningful-documentation

Identifies HumanLimbMirror.goal as the owner of median-plane goal reflection, including attachments and external colliders.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the shared median-plane reflection of points, rotations, attached bone and colliders; clinical reference angles keep their side convention.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation keeps every reflected goal field in HumanLimbMirror.goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No goal part or side is special-cased by this wrapper; the shared owner reflects limits, clear and rests as well as the main target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work is linear in limits, placed segments/shapes and uncached hull vertices; already mirrored source hull arrays reuse their points. The wrapper adds no scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses common goal/shape reflection and HumanArmMirror's mirrored hull points while source point arrays remain unchanged, without a new goal cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned goal and mirrored records; unchanged fields are borrowed and shared hull points follow their source-array weak cache. This wrapper owns no retained state, handles or tasks.

# src/posture/HumanLimbFit.ts#HumanLimbFit.continues

## @evidence contracts/development/common.md#meaningful-documentation

States what the query answers, when it is null and which refusals pass through.

## @evidence contracts/development/implementation.md#principled-implementation

The fit's own arc continuation decides: null exactly where its admitted arc vanished, the refusal `fit` raises for it told apart by identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call of `fit` and one test of what it threw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every other refusal is rethrown; nothing is retried or relaxed.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued fit, the same as `fit`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Delegates to `fit`, which owns its preparation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; a vanished arc is told by its refusal's class (`HumanLimbVanishedRefusal`).
