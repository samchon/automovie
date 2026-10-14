import * as THREE from "three";

type Inputs = {
  source: THREE.Texture["source"];
  capacity: unknown[];
  fixed: unknown[];
  sampling: unknown[];
  state: unknown[];
  copied: unknown[];
  version: number;
};
type Claim = {
  owner: object;
  texture: THREE.Texture;
  initialSource: THREE.Texture["source"];
  baseline?: Inputs;
  issued: Set<Wrapper>;
  known: boolean;
  active: boolean;
  detached: boolean;
};
type Wrapper = {
  texture: THREE.Texture;
  claim: Claim;
  inputs: Inputs;
  known: boolean;
  detached: boolean;
  closed: boolean;
};
type BindingReceipt = { wrapper: Wrapper; before: Inputs; clean: boolean };
type EnvironmentReceipt = {
  wrapper: Wrapper;
  before: Inputs;
  permitted: boolean;
};
type IssueReceipt = { claim: Claim; before: Inputs; clean: boolean };
type BindingWrites = {
  colorSpace: THREE.ColorSpace;
  sampler?: {
    wrapS: THREE.Wrapping;
    wrapT: THREE.Wrapping;
    minFilter: THREE.MinificationTextureFilter;
    magFilter: THREE.MagnificationTextureFilter;
  };
};

/**
 * Own the factual creation inputs of cache originals and issued wrappers.
 * Source sharing is preserved, but a mutable original cannot stand in for
 * earlier clones. Binding completion acknowledges only the ordinary resolver's
 * sampler/decoding writes and one own upload-version increment. Uncontrolled
 * history remains uncertified after properties are restored. Shared Source
 * version increments from normal cloning are deliberately not an input.
 *
 * A successful exclusive environment retirement may refresh that wrapper's
 * same-capacity tuple; it cannot repair an original or another issued wrapper.
 * Detached Source history cannot certify native retirement: r186 disposal
 * looks up the current Source and can leave the previous allocation alive.
 * Listeners never throw or assert physical release; owners mark uncertainty
 * before disposal and report indeterminate history after independent attempts.
 * These are owned object inputs, not native keys, handles or byte estimates.
 * A binding-issued wrapper cannot become a decoder original, including within
 * its own cache; this prevents an alias from laundering its earlier history.
 *
 * History is observed at these transition/read boundaries, not by intercepting every texture write. A mutation fully restored between observations is not detected; only observed drift becomes sticky uncertainty.
 *
 * @evidence contracts/common.md#principled-implementation Weak identity registries bind decoded originals to one cache and issued wrappers to one original claim; fixed, sampling and version tuples preserve sticky mutation/detachment history without treating shared Source.version as private wrapper state.
 * @evidence contracts/common.md#clear-and-simple-design Begin/finish receipts isolate issuance, ordinary binding and exclusive environment transitions, while retirement records close ownership; native keys, handles and byte pricing remain outside this factual input owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A wrapper cannot become a decoder original, observed uncontrolled drift stays uncertain after fields are restored, and observed Source detachment remains uncertified after public disposal because prior native storage may survive. Unobserved mutation/restoration between boundaries is not detected by this tuple observer.
 * @evidence contracts/common.md#meaningful-documentation Explains decoded-source sharing, input-history authority, limited binding/environment acknowledgement and detached-Source retirement uncertainty; each public transition documents its ordering role.
 * @evidence contracts/performance.md#efficient-algorithms Registry lookups are constant expected time; tuple capture is fixed-size except copied manual mip references, and original current observation visits every issued wrapper because any one can invalidate its aggregate authority.
 * @evidence contracts/performance.md#reuse-equivalent-work Receipts share the recorded pre-transition tuple with completion checks and stable wrappers reuse their accepted baseline; equivalence includes actual object references, per-wrapper version and all allocation/sampling inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak registry keys alone do not retain textures, but each live original claim strongly owns its issued-wrapper Set until finishRetirement clears it; clone population has no numeric bound within the owning cache lifetime.
 */
export class AutoMovieTextureCacheAllocationAuthority {
  private static readonly originals: WeakMap<THREE.Texture, Claim> =
    new WeakMap<THREE.Texture, Claim>();
  private static readonly wrappers: WeakMap<THREE.Texture, Wrapper> =
    new WeakMap<THREE.Texture, Wrapper>();

  /**
   * Transfer a returned original once, before a decode becomes cache-owned.
   *
   * @evidence contracts/common.md#principled-implementation Establishes exclusive cache ownership by Texture identity before loading publishes it, rejecting issued wrappers and originals owned by another cache. Reclaiming for the same owner returns its existing claim even after retirement; the cache caller owns live-work admission.
   * @evidence contracts/common.md#clear-and-simple-design A single original claim stores owner, initial Source and disposal invalidation; subsequent issuance records its immutable baseline separately.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Returning an alias from a loader cannot launder an issued binding wrapper into a new decoded original.
   * @evidence contracts/common.md#meaningful-documentation Specifies transfer before cache-owned decode publication, one claim per original wrapper and the caller's separate live-work admission responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Two weak registry lookups and one claim/listener allocation are fixed-size ownership bookkeeping.
   * @evidence contracts/performance.md#reuse-equivalent-work Reclaiming the same original for the same owner preserves its existing claim instead of installing another listener or baseline.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The texture owns its invalidation listener; the weak original registry does not extend an otherwise unreachable texture lifetime.
   */
  public static claim(owner: object, texture: THREE.Texture): void {
    const issued: Wrapper | undefined = this.wrappers.get(texture);
    if (issued !== undefined)
      throw new Error(
        "An issued binding wrapper cannot become a decoded cache original; return an owned decoder original or fresh wrapper.",
      );
    const previous: Claim | undefined = this.originals.get(texture);
    if (previous !== undefined) {
      if (previous.owner !== owner)
        throw new Error(
          "Decoded texture wrapper already belongs to another or closed cache; return a fresh owned wrapper.",
        );
      return;
    }
    const claim: Claim = {
      owner,
      texture,
      initialSource: texture.source,
      issued: new Set(),
      known: true,
      active: true,
      detached: false,
    };
    this.originals.set(texture, claim);
    texture.addEventListener("dispose", (): void => {
      claim.known = false;
      if (texture.source !== (claim.baseline?.source ?? claim.initialSource))
        claim.detached = true;
    });
  }

  /**
   * Fix the original before native copy can evaluate host userData accessors.
   *
   * @evidence contracts/common.md#principled-implementation Captures original inputs and fixes the first baseline before Texture.clone can invoke effectful userData serialization, returning the observed clean state with its claim.
   * @evidence contracts/common.md#clear-and-simple-design The receipt carries one pre-copy tuple to finishIssue, keeping the copy operation itself with the cache resolver.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Original history is recorded before foreign copy effects rather than trusting properties only after copying succeeds.
   * @evidence contracts/common.md#meaningful-documentation Explains why this ordering precedes native copy and host userData accessor evaluation.
   * @evidence contracts/performance.md#efficient-algorithms Captures one bounded texture-state tuple plus any manual mip references, without reading or hashing decoded pixels.
   * @evidence contracts/performance.md#reuse-equivalent-work The first issue baseline is reused for every later original-history check; each issuance still captures its actual pre-copy tuple.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The claim retains one baseline while the caller owns a temporary receipt through copy completion; no native resource is acquired by beginning issuance.
   */
  public static beginIssue(original: THREE.Texture): IssueReceipt {
    const claim: Claim = this.originals.get(original)!;
    const before: Inputs = inputs(original);
    if (claim.baseline === undefined) claim.baseline = before;
    return { claim, before, clean: this.originalCurrent(claim) };
  }

  /**
   * Observe completion or failure and validate the actual copied fields.
   *
   * @evidence contracts/common.md#principled-implementation Rechecks original history even after a failed copy; successful clones compare actual copied allocation/sampling fields against pre-copy inputs before a wrapper claim can be known.
   * @evidence contracts/common.md#clear-and-simple-design One completion path records original drift and optionally registers the actual returned wrapper with its disposal listener.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A copy that mutates source inputs or returns mismatching fields remains unknown instead of being blessed merely because clone returned.
   * @evidence contracts/common.md#meaningful-documentation Describes observation of both copy completion and failure and validation of the fields actually copied.
   * @evidence contracts/performance.md#efficient-algorithms Captures one clone tuple and compares the copied field sequence, with work linear only in manual mip reference count.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares the pre-copy receipt with original/clone completion checks; each issued wrapper receives its own baseline because later sampler writes are independent.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful issuance adds one wrapper to its original claim's Set and a weak registry entry; finishRetirement clears the Set when the original cache closes.
   */
  public static finishIssue(
    receipt: IssueReceipt,
    texture?: THREE.Texture,
  ): void {
    const { claim, before }: IssueReceipt = receipt;
    const originalKnown: boolean = this.originalCurrent(claim);
    if (texture === undefined) return;
    const copied: Inputs = inputs(texture);
    const copiedKnown: boolean = same(before.copied, copied.copied);
    const wrapper: Wrapper = {
      texture,
      claim,
      inputs: copied,
      known: receipt.clean && originalKnown && copiedKnown,
      detached: false,
      closed: false,
    };
    claim.issued.add(wrapper);
    this.wrappers.set(texture, wrapper);
    texture.addEventListener("dispose", (): void => {
      wrapper.known = false;
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
    });
  }

  /**
   * Unmanaged objects retain the reader's documented before-upload contract.
   *
   * @evidence contracts/common.md#principled-implementation Original authority combines its sticky baseline history with every issued wrapper, while a wrapper combines its own state with the original; unregistered textures retain prospective observer authority without claiming historical GPU inspection.
   * @evidence contracts/common.md#clear-and-simple-design One boolean feeds readAutoMovieTextureSource and hides mutable claim records from downstream budget code.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Restoring mutated fields does not clear known=false or detached history, and one valid issued wrapper cannot certify a changed original or sibling.
   * @evidence contracts/common.md#meaningful-documentation States the before-upload interpretation for unmanaged objects rather than implying native allocation history is observed.
   * @evidence contracts/performance.md#efficient-algorithms Wrapper lookup and fixed-tuple checks are constant-size; original observation scans issued wrappers once so aggregate authority includes every live issued object.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Mutable wrapper inputs are reobserved on each authority request; a previously true answer cannot certify later writes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Observation may mark existing history uncertain but creates no additional claim, wrapper or retained native handle.
   */
  public static current(texture: THREE.Texture): boolean {
    const original: Claim | undefined = this.originals.get(texture);
    if (original !== undefined) {
      const known: boolean = this.originalCurrent(original);
      let issuedKnown: boolean = true;
      for (const wrapper of original.issued)
        if (!this.wrapperCurrent(wrapper)) issuedKnown = false;
      return known && issuedKnown;
    }
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    return wrapper === undefined || this.wrapperCurrent(wrapper);
  }

  /**
   * Stable environment reuse concerns its own tuple, not another user's drift.
   *
   * @evidence contracts/common.md#principled-implementation Checks only an issued environment wrapper's own baseline because unrelated sibling drift cannot invalidate the scene's unchanged conversion inputs; unregistered wrappers remain prospective.
   * @evidence contracts/common.md#clear-and-simple-design Separates environment reuse eligibility from aggregate cache-original authority required for certification.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A wrapper's own closed, detached or uncontrolled-input history still refuses reuse; excluding sibling history does not clear its own uncertainty.
   * @evidence contracts/common.md#meaningful-documentation States that environment reuse concerns the actual wrapper rather than another user's drift.
   * @evidence contracts/performance.md#efficient-algorithms Performs one weak lookup and one current-input tuple comparison, without scanning sibling wrappers.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This method observes eligibility; prepare owns the decision to reuse an existing environment conversion.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Checking one wrapper acquires no new texture or lifecycle record.
   */
  public static environmentStable(texture: THREE.Texture): boolean {
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    return wrapper === undefined || this.wrapperOwnCurrent(wrapper);
  }

  /**
   * Only a clean pre-write tuple can acknowledge ordinary binding changes.
   *
   * @evidence contracts/common.md#principled-implementation Captures the issued wrapper's pre-write inputs together with current original/wrapper authority; unregistered bindings need no cache receipt.
   * @evidence contracts/common.md#clear-and-simple-design The temporary receipt separates observation before resolveAutoMovieMaterialTexture writes from finishBinding's post-write validation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing uncertainty remains in the clean flag, preventing ordinary sampler writes from laundering uncontrolled earlier mutation.
   * @evidence contracts/common.md#meaningful-documentation States that only a clean pre-write tuple can authorize acknowledgement of ordinary binding changes.
   * @evidence contracts/performance.md#efficient-algorithms One weak lookup and a bounded tuple capture precede baseline comparison; decoded pixel bytes are neither copied nor hashed.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each binding transition needs its own pre-write receipt because texture version and sampling may differ between operations.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned receipt temporarily borrows an existing wrapper claim and acquires no GPU allocation.
   */
  public static beginBinding(
    texture: THREE.Texture,
  ): BindingReceipt | undefined {
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    return wrapper === undefined
      ? undefined
      : {
          wrapper,
          before: inputs(texture),
          clean: this.wrapperCurrent(wrapper),
        };
  }

  /**
   * Fixed inputs cannot be blessed by changing sampler, decoding or UVs.
   *
   * @evidence contracts/common.md#principled-implementation Accepts only the requested color-space/sampler tuple, unchanged fixed allocation inputs, current original authority and exactly one wrapper upload-version increment; any mismatch marks wrapper history unknown.
   * @evidence contracts/common.md#clear-and-simple-design Requested writes are compared against the receipt's prior sampling rather than reconstructing material semantics inside the authority owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary binding completion cannot certify changed capacity, Source or other fixed inputs; restoring sampler properties does not reset sticky uncertainty.
   * @evidence contracts/common.md#meaningful-documentation Explains that sampler, decoding and UV work cannot bless changes to fixed allocation inputs.
   * @evidence contracts/performance.md#efficient-algorithms Builds and compares a fixed-size expected sampling tuple plus actual texture inputs, with no traversal of other issued bindings or pixel storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Successful completion refreshes this wrapper's accepted baseline for subsequent stable observations; failures preserve the prior history as unknown.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Replaces one wrapper input tuple on success and retains no receipt afterward; the existing cache owner still owns wrapper retirement.
   */
  public static finishBinding(
    receipt: BindingReceipt | undefined,
    writes: BindingWrites,
  ): void {
    if (receipt === undefined) return;
    const { wrapper, before }: BindingReceipt = receipt;
    const after: Inputs = inputs(wrapper.texture);
    const expectedSampling: unknown[] = [
      writes.colorSpace,
      ...(writes.sampler === undefined
        ? before.sampling.slice(1)
        : [
            writes.sampler.wrapS,
            writes.sampler.wrapT,
            writes.sampler.minFilter,
            writes.sampler.magFilter,
          ]),
    ];
    if (
      !receipt.clean ||
      !wrapper.known ||
      !this.originalCurrent(wrapper.claim) ||
      !same(before.fixed, after.fixed) ||
      !same(expectedSampling, after.sampling) ||
      after.version !== before.version + 1
    ) {
      wrapper.known = false;
      if (after.source !== wrapper.inputs.source) wrapper.detached = true;
      return;
    }
    wrapper.inputs = after;
  }

  /**
   * Mark uncertainty before the exclusive scene owner starts retirement.
   *
   * @evidence contracts/common.md#principled-implementation Captures current inputs, records sticky Source detachment and computes same-capacity/open eligibility before setting wrapper authority unknown for the pending retirement.
   * @evidence contracts/common.md#clear-and-simple-design The receipt grants only a later environment completion check; AutoMovieEnvironmentTextureOwnership still performs actual scene-conversion disposal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Known authority is withdrawn before effectful disposal so a throwing listener cannot leave the conversion falsely certified.
   * @evidence contracts/common.md#meaningful-documentation Specifies uncertainty publication before exclusive scene-owner retirement starts.
   * @evidence contracts/performance.md#efficient-algorithms One wrapper lookup and fixed capacity/current-original comparisons require no scene scan or sibling iteration.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each retirement attempt gets a pre-transition receipt because current Source and version determine eligibility.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Beginning environment retirement creates only a caller-held receipt and does not allocate or dispose native storage itself.
   */
  public static beginEnvironment(
    texture: THREE.Texture,
  ): EnvironmentReceipt | undefined {
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    if (wrapper === undefined) return undefined;
    const before: Inputs = inputs(texture);
    if (before.source !== wrapper.inputs.source) wrapper.detached = true;
    const permitted: boolean =
      !wrapper.closed &&
      !wrapper.detached &&
      same(wrapper.inputs.capacity, before.capacity) &&
      this.originalCurrent(wrapper.claim);
    wrapper.known = false;
    return { wrapper, before, permitted };
  }

  /**
   * A successful same-capacity retirement refreshes this environment only.
   *
   * @evidence contracts/common.md#principled-implementation Requires the prior permitted receipt, no sticky detachment, current original authority, unchanged capacity and one upload-version increment before replacing this wrapper's baseline and setting known=true.
   * @evidence contracts/common.md#clear-and-simple-design Returns explicit acknowledgement to the scene owner while retaining original and sibling histories under their own claims.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful public dispose cannot recover detached Source history or a changed original, and no unrelated wrapper receives certification.
   * @evidence contracts/common.md#meaningful-documentation States same-capacity success and the restriction that only this environment wrapper is refreshed.
   * @evidence contracts/performance.md#efficient-algorithms Captures one post-transition tuple and checks constant-size capacity/version conditions without inspecting GPU handles.
   * @evidence contracts/performance.md#reuse-equivalent-work An accepted environment baseline enables later stable conversion reuse; rejected receipts leave authority unknown rather than caching success.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Replaces one retained wrapper tuple and ends the receipt's role; physical conversion lifetime remains with the scene owner that performed disposal.
   */
  public static finishEnvironment(
    receipt: EnvironmentReceipt | undefined,
  ): boolean {
    if (receipt === undefined) return true;
    const { wrapper, before }: EnvironmentReceipt = receipt;
    const after: Inputs = inputs(wrapper.texture);
    if (after.source !== wrapper.inputs.source) wrapper.detached = true;
    if (
      !receipt.permitted ||
      wrapper.detached ||
      !this.originalCurrent(wrapper.claim) ||
      !same(before.capacity, after.capacity) ||
      after.version !== before.version + 1
    )
      return false;
    wrapper.inputs = after;
    wrapper.known = true;
    return true;
  }

  /**
   * Call before a cache's public disposal, including originals with listeners.
   *
   * @evidence contracts/common.md#principled-implementation Observes Source identity and marks both possible original and issued-wrapper claims unknown before any public dispose listener can run or throw.
   * @evidence contracts/common.md#clear-and-simple-design Pre-retirement history recording is separate from finishRetirement's closure and uncertainty report.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Disposal order cannot hide detached Source history by allowing a listener to restore properties before authority is withdrawn.
   * @evidence contracts/common.md#meaningful-documentation States that this call precedes public disposal even for originals carrying external listeners.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Two weak lookups and identity checks perform fixed-size bookkeeping.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This operation records a lifecycle transition and shares no completed retirement effect.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No new resource is retained; existing claims become uncertain before their owner attempts physical release.
   */
  public static beginRetirement(texture: THREE.Texture): void {
    const original: Claim | undefined = this.originals.get(texture);
    if (original !== undefined) {
      if (
        texture.source !== (original.baseline?.source ?? original.initialSource)
      )
        original.detached = true;
      original.known = false;
    }
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    if (wrapper !== undefined) {
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
      wrapper.known = false;
    }
  }

  /**
   * Preserve an old detached footprint even after public dispose returns.
   *
   * @evidence contracts/common.md#principled-implementation Marks originals inactive and wrappers closed, rechecks sticky Source detachment and returns an uncertainty Error when public disposal cannot certify earlier native storage retirement.
   * @evidence contracts/common.md#clear-and-simple-design Closure updates remain with allocation authority while AutoMovieTextureCache combines this uncertainty with independent native-listener failures.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty issued bookkeeping or a returned dispose call never becomes proof that a detached Source's old native footprint was freed.
   * @evidence contracts/common.md#meaningful-documentation States that detached history survives public disposal completion and requires retaining unknown residency until context release.
   * @evidence contracts/performance.md#efficient-algorithms Performs two weak lookups and clears the original's issued Set; release work follows issued wrapper references rather than decoded pixel size.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Completion records one retirement result; the cache's disposal promise owns deduplication of physical attempts.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Clears the original's strong issued-wrapper population and closes claims; returned Errors keep uncertainty visible while weak registry entries remain only as long as actual wrappers remain reachable.
   */
  public static finishRetirement(texture: THREE.Texture): Error | undefined {
    const original: Claim | undefined = this.originals.get(texture);
    if (original !== undefined) {
      if (
        texture.source !== (original.baseline?.source ?? original.initialSource)
      )
        original.detached = true;
      original.active = false;
      original.issued.clear();
      if (original.detached)
        return new Error(
          "Texture cache cannot certify retirement after its original Source was detached; retain the unknown footprint until context release.",
        );
    }
    const wrapper: Wrapper | undefined = this.wrappers.get(texture);
    if (wrapper !== undefined) {
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
      wrapper.closed = true;
      if (wrapper.detached)
        return new Error(
          "Texture cache cannot certify retirement after an issued Source was detached; retain the unknown footprint until context release.",
        );
    }
    return undefined;
  }

  private static originalCurrent(claim: Claim): boolean {
    if (!claim.active) return false;
    if (
      claim.texture.source !== (claim.baseline?.source ?? claim.initialSource)
    ) {
      claim.detached = true;
      claim.known = false;
    }
    if (
      claim.baseline !== undefined &&
      !equivalent(claim.baseline, inputs(claim.texture))
    )
      claim.known = false;
    return claim.known;
  }

  private static wrapperCurrent(wrapper: Wrapper): boolean {
    return (
      this.wrapperOwnCurrent(wrapper) && this.originalCurrent(wrapper.claim)
    );
  }

  private static wrapperOwnCurrent(wrapper: Wrapper): boolean {
    const current: Inputs = inputs(wrapper.texture);
    if (current.source !== wrapper.inputs.source) wrapper.detached = true;
    if (!equivalent(wrapper.inputs, current)) wrapper.known = false;
    return !wrapper.closed && !wrapper.detached && wrapper.known;
  }
}

/** Actual owned fields; image references are observed without hashing pixels. */
const inputs: (texture: THREE.Texture) => Inputs = (
  texture: THREE.Texture,
): Inputs => {
  const image: unknown = texture.image;
  const record: object | undefined =
    typeof image === "object" && image !== null ? image : undefined;
  const width: unknown =
    record !== undefined && "width" in record ? record.width : undefined;
  const height: unknown =
    record !== undefined && "height" in record ? record.height : undefined;
  const data: unknown =
    record !== undefined && "data" in record ? record.data : undefined;
  const mipmaps: unknown = texture.mipmaps;
  const capacity: unknown[] = [
    texture.source,
    width,
    height,
    texture.type,
    texture.format,
    texture.internalFormat,
  ];
  const fixed: unknown[] = [
    ...capacity,
    image,
    data,
    texture.generateMipmaps,
    mipmaps,
    Array.isArray(mipmaps) ? mipmaps.length : undefined,
    texture.flipY,
    texture.premultiplyAlpha,
    texture.unpackAlignment,
    texture.anisotropy,
    texture.mapping,
    "wrapR" in texture ? texture.wrapR || 0 : 0,
  ];
  const sampling: unknown[] = [
    texture.colorSpace,
    texture.wrapS,
    texture.wrapT,
    texture.minFilter,
    texture.magFilter,
  ];
  const copied: unknown[] = [
    ...capacity,
    image,
    data,
    texture.generateMipmaps,
    Array.isArray(mipmaps) ? mipmaps.length : undefined,
    ...(Array.isArray(mipmaps) ? mipmaps : []),
    texture.flipY,
    texture.premultiplyAlpha,
    texture.unpackAlignment,
    texture.anisotropy,
    texture.mapping,
    "wrapR" in texture ? texture.wrapR || 0 : 0,
    ...sampling,
  ];
  return {
    source: texture.source,
    capacity,
    fixed,
    sampling,
    copied,
    state: [...fixed, ...sampling],
    version: texture.version,
  };
};

/** Object.is distinguishes numeric flags without inventing a native cache key. */
const same: (left: readonly unknown[], right: readonly unknown[]) => boolean = (
  left: readonly unknown[],
  right: readonly unknown[],
): boolean =>
  left.every((value: unknown, index: number): boolean =>
    Object.is(value, right[index]),
  );

/** Shared Source.version is absent; each original/wrapper has its own version. */
const equivalent: (left: Inputs, right: Inputs) => boolean = (
  left: Inputs,
  right: Inputs,
): boolean => left.version === right.version && same(left.state, right.state);
