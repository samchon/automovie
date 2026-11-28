# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.applyIterativeIK

## @evidence contracts/development/common.md#meaningful-documentation

Names the supported solvers, chain and budget premises, stopping rule, mutation and anatomical scope.

## @evidence contracts/development/implementation.md#principled-implementation

The solver reads current world link lengths and goal, then performs the chosen geometric iteration with fixed lengths. It blends the completed chain by influence and propagates the changed tip through the existing child index.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain snapshot prepares positions and link lengths. Each iteration is bounded by chain length, can stop early, and final recomposition visits only the tip subtree.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.composeScene

## @evidence contracts/development/common.md#meaningful-documentation

Names overrides, input order, graph admission, output ownership and matrix composition semantics.

## @evidence contracts/development/implementation.md#principled-implementation

Index the nodes by ID and resolve parents on demand. Each world matrix is the parent product with its local matrix. Memoized results and an active-resolution set distinguish completed ancestors from cycles.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexing and memoized resolution visit each node and parent link once, retaining one matrix per node and recursion up to the parent depth.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.createSpringState

## @evidence contracts/development/common.md#meaningful-documentation

Names the independent state and the categories it retains.

## @evidence contracts/development/implementation.md#principled-implementation

Three newly allocated maps keep spring history separate between callers. Their empty starting state lets the first step supply positions from its current input.

## @evidence contracts/development/implementation.md#efficient-algorithms

The constructor allocates only three empty maps. The caller retains and disposes of the state.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.lowerSkeletonNodes

## @evidence contracts/development/common.md#meaningful-documentation

Names synthetic-root placement, qualified names, output ownership and borrowed fields.

## @evidence contracts/development/implementation.md#principled-implementation

The group anchors bones with no skeletal parent. Each bone's rest transform becomes its local node transform and references the appropriately prefixed parent or synthetic root.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward pass visits the declared bones and creates one node per bone plus the root.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.resolveDrivers

## @evidence contracts/development/common.md#meaningful-documentation

Names channel-space scope, mutation, deferred order, cyclic refusal and the linear branch.

## @evidence contracts/development/implementation.md#principled-implementation

Separate value-producing descriptors from the others, then apply each producer after its indexed channel dependencies. A driver can read an earlier producer's just-written sample. Copy and driven curves use their separate arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Partition once, index producers and dependencies, then evaluate each reachable value driver once. The deferred array retains only descriptors for subsequent passes.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.resolveFrame

## @evidence contracts/development/common.md#meaningful-documentation

Names pipeline order, profile precedence, world/state ownership and deferred springs.

## @evidence contracts/development/implementation.md#principled-implementation

The channel pass produces sampled values and local overrides before any world composition. The world pass uses full matrices, then the explicit spring state advances or descriptors remain deferred. Producer order determines applicable limits and drivers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sample only the requested clock. Shared maps index nodes, channels and child relationships for the frame. Spring history belongs to the caller and advances only when passed in.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.resolveShotLighting

## @evidence contracts/development/common.md#meaningful-documentation

Names light address and kind checks, output order, ownership and the shot-admission premise.

## @evidence contracts/development/implementation.md#principled-implementation

The sampler yields channels at the requested time. Decode each light pointer and use the property table to accumulate compatible overrides. Reconstruction applies only to staged lights with overrides.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index staged lights once, visit each sampled channel once, and create replacements only for touched lights.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.resolveWorldDrivers

## @evidence contracts/development/common.md#meaningful-documentation

Names supported stages, producer order, caller-owned matrices, deferral and geometric premises.

## @evidence contracts/development/implementation.md#principled-implementation

The driver kind dispatches to the world solver. Each solved transform takes effect immediately and its descendants are recomposed. Two-bone processing requires a three-node chain, while CCD and FABRIK use their agreed iterative route.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit descriptors once. Each applied driver evaluates its chain or addressed node and recomposes the affected descendants rather than restaging the whole forest.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.sceneToNodes

## @evidence contracts/development/common.md#meaningful-documentation

Names lowered scene elements, registry conflict and partial modes, output ownership and graph scope.

## @evidence contracts/development/implementation.md#principled-implementation

Walk staged placements and select the registered lowering route. Every placement produces a root, and the chosen model or prop contributes a namespaced subtree. Camera and light nodes retain their staged descriptors.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass reads placements and registry entries, adding nodes in proportion to the emitted subtrees and scene cameras/lights.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.stepSpring

## @evidence contracts/development/common.md#meaningful-documentation

Names step/state ownership, fixed root, order of projections and the retained fields.

## @evidence contracts/development/implementation.md#principled-implementation

The solver transports history by the moving centre displacement, projects predicted translations by link constraints, then projects against spheres. Matrix translation slots are updated without changing the rotation/scale slots.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass visits non-root joints. Each checks the supplied colliders and updates its own history. Chain-centre history is retained only in the supplied state.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.applyChannelLimit

## @evidence contracts/development/common.md#meaningful-documentation

Names scalar constraints, unbounded sides, refusal of missing or nonfinite bounds, and returned diagnostics.

## @evidence contracts/development/implementation.md#principled-implementation

Check each supplied slot by index for a finite bound or explicit null. The width and min/max checks run before copying the sample. Each crossed bound records the original coordinate before replacement, and null or omitted trailing bounds stay unbounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Bound checks and clamping each walk their relevant arrays once. Allocate one values copy and one record per crossed bound.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.applyLightOverride

## @evidence contracts/development/common.md#meaningful-documentation

Names kind preservation, partial override semantics, borrowed fields and output identity.

## @evidence contracts/development/implementation.md#principled-implementation

The base fields merge present overrides with staged values. Kind-specific branches carry applicable fields, including area extents. Absent optional shadow fields stay absent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed light fields are reconstructed once. A nested transform is constructed only as needed to represent transform overrides.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.bindProfile

## @evidence contracts/development/common.md#meaningful-documentation

Names declared mapping, own-entry admission, prefix, global pointers and borrow rules.

## @evidence contracts/development/implementation.md#principled-implementation

The binder checks profile ID first, then maps node references in supported limits and drivers. It leaves pointer channels unchanged and stops on the first missing mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read each supported limit, driver and nested chain entry once. Allocate output arrays and the changed wrappers, carrying unchanged payloads by reference.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.blendVec

## @evidence contracts/development/common.md#meaningful-documentation

Names the coordinate operation, fresh output and the overflow recovery restricted to bounded progress with finite endpoints.

## @evidence contracts/development/implementation.md#principled-implementation

Subtract, scale and add in that order to preserve ordinary rounding. A difference that overflows between finite endpoints can be avoided inside the closed unit interval. Its nonnegative weights are at most one, so the weighted opposite-signed endpoints can be added without overflowing. Other coordinates keep their ordinary arithmetic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three fixed-size vector operations handle ordinary reads. Only a nonfinite difference under bounded progress can reach the coordinate fallback. The function retains no state.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.channelIsRotation

## @evidence contracts/development/common.md#meaningful-documentation

Names both rotation routes, accepted input and malformed-channel behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Shared channel validation runs before inspecting the kind. The node path or pointer value type selects the quaternion interpolation route.

## @evidence contracts/development/implementation.md#efficient-algorithms

One channel admission and one typed field comparison decide the result.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.channelKey

## @evidence contracts/development/common.md#meaningful-documentation

Names both address components, kind separation and shared admission.

## @evidence contracts/development/implementation.md#principled-implementation

Admit the channel before forming the key. A fixed node path suffix distinguishes its transform field, while the pointer kind preserves its exact address under its own prefix.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validate once and allocate one resulting key string.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.childrenIndex

## @evidence contracts/development/common.md#meaningful-documentation

Names parent/child direction, ordered siblings and graph admission premise.

## @evidence contracts/development/implementation.md#principled-implementation

Each non-root record appends its ID to its parent's list. The map reflects the supplied edges directly.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass creates one list per parent and one stored child ID per input edge.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.evaluateDrivenCurve

## @evidence contracts/development/common.md#meaningful-documentation

Names the curve premises, absent-source default, endpoint holds and linear evaluation.

## @evidence contracts/development/implementation.md#principled-implementation

The solver checks for a nonempty curve and compares successive source values. It then scans until the enclosing segment and interpolates by its relative source position. Callers supply finite source positions and values for those comparisons.

## @evidence contracts/development/implementation.md#efficient-algorithms

One full pass validates ordering, then one forward scan stops at the first segment that contains the source.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.formatLightPointer

## @evidence contracts/development/common.md#meaningful-documentation

Names the light address, escaping, property premise and round-trip limit.

## @evidence contracts/development/implementation.md#principled-implementation

Escape a literal tilde to tilde-zero before escaping a slash to tilde-one. Add the fixed lights prefix and property segment. The formatter itself uses the supplied typed property.

## @evidence contracts/development/implementation.md#efficient-algorithms

Escape the one variable-length ID segment and assemble one pointer.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.isLightProperty

## @evidence contracts/development/common.md#meaningful-documentation

Names the role of the checked property and exact membership decision.

## @evidence contracts/development/implementation.md#principled-implementation

An own-property membership check in the shared channel property table excludes prototype entries and unsupported names. The type predicate follows the same table.

## @evidence contracts/development/implementation.md#efficient-algorithms

One own-property lookup performs the decision.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.orderValueDrivers

## @evidence contracts/development/common.md#meaningful-documentation

Names dependencies, deterministic tie order, cycle refusal and descriptor ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Index all producers by canonical channel key. A driver depends on every other indexed producer of an input key. Sort its dependency indices into input order, then mark depth-first visits to distinguish active cycles from completed producers.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index once, visit the built dependencies and sort each unique local list. The graph can be dense when many drivers share outputs. Output borrows descriptor records.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.parseLightPointer

## @evidence contracts/development/common.md#meaningful-documentation

Names accepted pointer shape, escape check, property membership, null result and target lookup premise.

## @evidence contracts/development/implementation.md#principled-implementation

Split the fixed path and check the property table. Decode the ID in inverse escape order, then reformat the decoded fields and require exact equality to the original pointer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read the pointer once into its segments and re-encode one ID for admission. Only a valid pointer creates the output record.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.placementChildNode

## @evidence contracts/development/common.md#meaningful-documentation

Names source identifiers and the concrete node address.

## @evidence contracts/development/implementation.md#principled-implementation

Use the same placement prefix as scene lowering and append the local child ID unchanged. Graph admission owns uniqueness of resulting IDs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construct one qualified string from the caller's two identifiers.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.placementNodePrefix

## @evidence contracts/development/common.md#meaningful-documentation

Names the literal separator and consumers of the prefix.

## @evidence contracts/development/implementation.md#principled-implementation

The prefix is the raw placement ID followed by a slash. Child naming uses the same helper, so independent producers can agree on address spelling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Return one concatenated string without graph lookup.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.profileSemanticKeys

## @evidence contracts/development/common.md#meaningful-documentation

Names the bound references, deduplication and order, pointer scope and error.

## @evidence contracts/development/implementation.md#principled-implementation

Read node limits first, then the known reference fields of each driver, including chain, goal, pole and centre where applicable. A seen set appends each node key once.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit the declared references once and retain one set entry and one output string per distinct node key.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.readLocal

## @evidence contracts/development/common.md#meaningful-documentation

Names map lookup, borrowed result, missing-ID error and default context.

## @evidence contracts/development/implementation.md#principled-implementation

Read the supplied key directly and check for an absent value. The role is used only to describe the required transform in the error.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup returns the existing transform without copying.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.readWorld

## @evidence contracts/development/common.md#meaningful-documentation

Names required lookup, borrowed matrix, failure diagnostic and default owner.

## @evidence contracts/development/implementation.md#principled-implementation

Read the key directly and report absence using the caller's context. The matrix remains the same record held by the world map.

## @evidence contracts/development/implementation.md#efficient-algorithms

One map lookup returns the existing array without copying.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.recompose

## @evidence contracts/development/common.md#meaningful-documentation

Names caller-owned maps, graph premise, mutation boundaries and partial failure.

## @evidence contracts/development/implementation.md#principled-implementation

For each child, compose its local transform, multiply by the parent's world matrix and replace its world entry. Follow descendants in child order. Full matrix products retain composition shear.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit only the rooted subtree, replacing one matrix per descendant. The recursion depth follows the supplied tree depth.

# src/resolve/AutoMovieEngineResolve.ts#AutoMovieEngineResolve.validateInfluence

## @evidence contracts/development/common.md#meaningful-documentation

Names the closed interval, nonfinite refusal and range-error label.

## @evidence contracts/development/implementation.md#principled-implementation

Admission requires both ordered comparisons to succeed. Zero and one pass, and NaN fails alongside both infinities and finite values outside the interval. The driver label remains in the error.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two scalar comparisons suffice, with no allocation on success.
