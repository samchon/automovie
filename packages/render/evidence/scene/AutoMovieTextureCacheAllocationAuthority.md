# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority

## @evidence contracts/development/design.md#principled-representation

Weak identity registries bind decoded originals to one cache and issued wrappers to one original claim; fixed, sampling and version tuples preserve sticky mutation/detachment history without treating shared Source.version as private wrapper state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Begin/finish receipts isolate issuance, ordinary binding and exclusive environment transitions, while retirement records close ownership; native keys, handles and byte pricing remain outside this factual input owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A wrapper cannot become a decoder original, observed uncontrolled drift stays uncertain after fields are restored, and observed Source detachment remains uncertified after public disposal because prior native storage may survive. Unobserved mutation/restoration between boundaries is not detected by this tuple observer.

## @evidence contracts/development/common.md#meaningful-documentation

Explains decoded-source sharing, input-history authority, limited binding/environment acknowledgement and detached-Source retirement uncertainty; each public transition documents its ordering role.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.claim

## @evidence contracts/development/implementation.md#principled-implementation

Establishes exclusive cache ownership by Texture identity before loading publishes it, rejecting issued wrappers and originals owned by another cache. Reclaiming for the same owner returns its existing claim even after retirement; the cache caller owns live-work admission.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single original claim stores owner, initial Source and disposal invalidation; subsequent issuance records its immutable baseline separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returning an alias from a loader cannot launder an issued binding wrapper into a new decoded original.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies transfer before cache-owned decode publication, one claim per original wrapper and the caller's separate live-work admission responsibility.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two weak registry lookups and one claim/listener allocation are fixed-size ownership bookkeeping.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reclaiming the same original for the same owner preserves its existing claim instead of installing another listener or baseline.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The texture owns its invalidation listener; the weak original registry does not extend an otherwise unreachable texture lifetime.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.beginIssue

## @evidence contracts/development/implementation.md#principled-implementation

Captures original inputs and fixes the first baseline before Texture.clone can invoke effectful userData serialization, returning the observed clean state with its claim.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The receipt carries one pre-copy tuple to finishIssue, keeping the copy operation itself with the cache resolver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Original history is recorded before foreign copy effects rather than trusting properties only after copying succeeds.

## @evidence contracts/development/common.md#meaningful-documentation

Explains why this ordering precedes native copy and host userData accessor evaluation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Captures one bounded texture-state tuple plus any manual mip references, without reading or hashing decoded pixels.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The first issue baseline is reused for every later original-history check; each issuance still captures its actual pre-copy tuple.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The claim retains one baseline while the caller owns a temporary receipt through copy completion; no native resource is acquired by beginning issuance.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.finishIssue

## @evidence contracts/development/implementation.md#principled-implementation

Rechecks original history even after a failed copy; successful clones compare actual copied allocation/sampling fields against pre-copy inputs before a wrapper claim can be known.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One completion path records original drift and optionally registers the actual returned wrapper with its disposal listener.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A copy that mutates source inputs or returns mismatching fields remains unknown instead of being blessed merely because clone returned.

## @evidence contracts/development/common.md#meaningful-documentation

Describes observation of both copy completion and failure and validation of the fields actually copied.

## @evidence contracts/development/implementation.md#efficient-algorithms

Captures one clone tuple and compares the copied field sequence, with work linear only in manual mip reference count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the pre-copy receipt with original/clone completion checks; each issued wrapper receives its own baseline because later sampler writes are independent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Successful issuance adds one wrapper to its original claim's Set and a weak registry entry; finishRetirement clears the Set when the original cache closes.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.current

## @evidence contracts/development/implementation.md#principled-implementation

Original authority combines its sticky baseline history with every issued wrapper, while a wrapper combines its own state with the original; unregistered textures retain prospective observer authority without claiming historical GPU inspection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One boolean feeds readAutoMovieTextureSource and hides mutable claim records from downstream budget code.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Restoring mutated fields does not clear known=false or detached history, and one valid issued wrapper cannot certify a changed original or sibling.

## @evidence contracts/development/common.md#meaningful-documentation

States the before-upload interpretation for unmanaged objects rather than implying native allocation history is observed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Wrapper lookup and fixed-tuple checks are constant-size; original observation scans issued wrappers once so aggregate authority includes every live issued object.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Mutable wrapper inputs are reobserved on each authority request; a previously true answer cannot certify later writes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Observation may mark existing history uncertain but creates no additional claim, wrapper or retained native handle.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.environmentStable

## @evidence contracts/development/implementation.md#principled-implementation

Checks only an issued environment wrapper's own baseline because unrelated sibling drift cannot invalidate the scene's unchanged conversion inputs; unregistered wrappers remain prospective.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates environment reuse eligibility from aggregate cache-original authority required for certification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A wrapper's own closed, detached or uncontrolled-input history still refuses reuse; excluding sibling history does not clear its own uncertainty.

## @evidence contracts/development/common.md#meaningful-documentation

States that environment reuse concerns the actual wrapper rather than another user's drift.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one weak lookup and one current-input tuple comparison, without scanning sibling wrappers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This method observes eligibility; prepare owns the decision to reuse an existing environment conversion.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Checking one wrapper acquires no new texture or lifecycle record.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.beginBinding

## @evidence contracts/development/implementation.md#principled-implementation

Captures the issued wrapper's pre-write inputs together with current original/wrapper authority; unregistered bindings need no cache receipt.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The temporary receipt separates observation before resolveAutoMovieMaterialTexture writes from finishBinding's post-write validation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Existing uncertainty remains in the clean flag, preventing ordinary sampler writes from laundering uncontrolled earlier mutation.

## @evidence contracts/development/common.md#meaningful-documentation

States that only a clean pre-write tuple can authorize acknowledgement of ordinary binding changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One weak lookup and a bounded tuple capture precede baseline comparison; decoded pixel bytes are neither copied nor hashed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each binding transition needs its own pre-write receipt because texture version and sampling may differ between operations.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned receipt temporarily borrows an existing wrapper claim and acquires no GPU allocation.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.finishBinding

## @evidence contracts/development/implementation.md#principled-implementation

Accepts only the requested color-space/sampler tuple, unchanged fixed allocation inputs, current original authority and exactly one wrapper upload-version increment; any mismatch marks wrapper history unknown.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Requested writes are compared against the receipt's prior sampling rather than reconstructing material semantics inside the authority owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Ordinary binding completion cannot certify changed capacity, Source or other fixed inputs; restoring sampler properties does not reset sticky uncertainty.

## @evidence contracts/development/common.md#meaningful-documentation

Explains that sampler, decoding and UV work cannot bless changes to fixed allocation inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds and compares a fixed-size expected sampling tuple plus actual texture inputs, with no traversal of other issued bindings or pixel storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Successful completion refreshes this wrapper's accepted baseline for subsequent stable observations; failures preserve the prior history as unknown.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one wrapper input tuple on success and retains no receipt afterward; the existing cache owner still owns wrapper retirement.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.beginEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Captures current inputs, records sticky Source detachment and computes same-capacity/open eligibility before setting wrapper authority unknown for the pending retirement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The receipt grants only a later environment completion check; AutoMovieEnvironmentTextureOwnership still performs actual scene-conversion disposal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Known authority is withdrawn before effectful disposal so a throwing listener cannot leave the conversion falsely certified.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies uncertainty publication before exclusive scene-owner retirement starts.

## @evidence contracts/development/implementation.md#efficient-algorithms

One wrapper lookup and fixed capacity/current-original comparisons require no scene scan or sibling iteration.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each retirement attempt gets a pre-transition receipt because current Source and version determine eligibility.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Beginning environment retirement creates only a caller-held receipt and does not allocate or dispose native storage itself.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.finishEnvironment

## @evidence contracts/development/implementation.md#principled-implementation

Requires the prior permitted receipt, no sticky detachment, current original authority, unchanged capacity and one upload-version increment before replacing this wrapper's baseline and setting known=true.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns explicit acknowledgement to the scene owner while retaining original and sibling histories under their own claims.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A successful public dispose cannot recover detached Source history or a changed original, and no unrelated wrapper receives certification.

## @evidence contracts/development/common.md#meaningful-documentation

States same-capacity success and the restriction that only this environment wrapper is refreshed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Captures one post-transition tuple and checks constant-size capacity/version conditions without inspecting GPU handles.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An accepted environment baseline enables later stable conversion reuse; rejected receipts leave authority unknown rather than caching success.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Replaces one retained wrapper tuple and ends the receipt's role; physical conversion lifetime remains with the scene owner that performed disposal.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.beginRetirement

## @evidence contracts/development/implementation.md#principled-implementation

Observes Source identity and marks both possible original and issued-wrapper claims unknown before any public dispose listener can run or throw.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pre-retirement history recording is separate from finishRetirement's closure and uncertainty report.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Disposal order cannot hide detached Source history by allowing a listener to restore properties before authority is withdrawn.

## @evidence contracts/development/common.md#meaningful-documentation

States that this call precedes public disposal even for originals carrying external listeners.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two weak lookups and identity checks perform fixed-size bookkeeping.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This operation records a lifecycle transition and shares no completed retirement effect.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No new resource is retained; existing claims become uncertain before their owner attempts physical release.

# src/scene/AutoMovieTextureCacheAllocationAuthority.ts#AutoMovieTextureCacheAllocationAuthority.finishRetirement

## @evidence contracts/development/implementation.md#principled-implementation

Marks originals inactive and wrappers closed, rechecks sticky Source detachment and returns an uncertainty Error when public disposal cannot certify earlier native storage retirement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Closure updates remain with allocation authority while AutoMovieTextureCache combines this uncertainty with independent native-listener failures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Empty issued bookkeeping or a returned dispose call never becomes proof that a detached Source's old native footprint was freed.

## @evidence contracts/development/common.md#meaningful-documentation

States that detached history survives public disposal completion and requires retaining unknown residency until context release.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs two weak lookups and clears the original's issued Set; release work follows issued wrapper references rather than decoded pixel size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Completion records one retirement result; the cache's disposal promise owns deduplication of physical attempts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Clears the original's strong issued-wrapper population and closes claims; returned Errors keep uncertainty visible while weak registry entries remain only as long as actual wrappers remain reachable.
