import * as THREE from "three";

type Inputs = { source: THREE.Texture["source"]; capacity: unknown[]; fixed: unknown[]; sampling: unknown[]; state: unknown[]; copied: unknown[]; version: number };
type Claim = { owner: object; texture: THREE.Texture; initialSource: THREE.Texture["source"]; baseline?: Inputs; issued: Set<Wrapper>; known: boolean; active: boolean; detached: boolean };
type Wrapper = { texture: THREE.Texture; claim: Claim; inputs: Inputs; known: boolean; detached: boolean; closed: boolean };
type BindingReceipt = { wrapper: Wrapper; before: Inputs; clean: boolean };
type EnvironmentReceipt = { wrapper: Wrapper; before: Inputs; permitted: boolean };
type IssueReceipt = { claim: Claim; before: Inputs; clean: boolean };
type BindingWrites = { colorSpace: THREE.ColorSpace; sampler?: {
  wrapS: THREE.Wrapping; wrapT: THREE.Wrapping;
  minFilter: THREE.MinificationTextureFilter; magFilter: THREE.MagnificationTextureFilter;
} };

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
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Keeps source and issued-wrapper allocation authority factual across binding, alias and lifetime transitions.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves uncertain histories as null storage/cardinality and prevents disposal completion from hiding detached allocations.
 */
export class AutoMovieTextureCacheAllocationAuthority {
  private static readonly originals = new WeakMap<THREE.Texture, Claim>();
  private static readonly wrappers = new WeakMap<THREE.Texture, Wrapper>();

  /** Transfer a returned original once, before a decode becomes cache-owned. */
  public static claim(owner: object, texture: THREE.Texture): void {
    const issued = this.wrappers.get(texture);
    if (issued !== undefined)
      throw new Error("An issued binding wrapper cannot become a decoded cache original; return an owned decoder original or fresh wrapper.");
    const previous = this.originals.get(texture);
    if (previous !== undefined) {
      if (previous.owner !== owner)
        throw new Error("Decoded texture wrapper already belongs to another or closed cache; return a fresh owned wrapper.");
      return;
    }
    const claim: Claim = { owner, texture, initialSource: texture.source, issued: new Set(), known: true, active: true, detached: false };
    this.originals.set(texture, claim);
    texture.addEventListener("dispose", () => {
      claim.known = false;
      if (texture.source !== (claim.baseline?.source ?? claim.initialSource)) claim.detached = true;
    });
  }

  /** Fix the original before native copy can evaluate host userData accessors. */
  public static beginIssue(original: THREE.Texture): IssueReceipt {
    const claim = this.originals.get(original)!;
    const before = inputs(original);
    if (claim.baseline === undefined) claim.baseline = before;
    return { claim, before, clean: this.originalCurrent(claim) };
  }

  /** Observe completion or failure and validate the actual copied fields. */
  public static finishIssue(receipt: IssueReceipt, texture?: THREE.Texture): void {
    const { claim, before } = receipt;
    const originalKnown = this.originalCurrent(claim);
    if (texture === undefined) return;
    const copied = inputs(texture);
    const copiedKnown = same(before.copied, copied.copied);
    const wrapper: Wrapper = { texture, claim, inputs: copied,
      known: receipt.clean && originalKnown && copiedKnown, detached: false, closed: false };
    claim.issued.add(wrapper);
    this.wrappers.set(texture, wrapper);
    texture.addEventListener("dispose", () => {
      wrapper.known = false;
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
    });
  }

  /** Unmanaged objects retain the reader's documented before-upload contract. */
  public static current(texture: THREE.Texture): boolean {
    const original = this.originals.get(texture);
    if (original !== undefined) {
      const known = this.originalCurrent(original);
      let issuedKnown = true;
      for (const wrapper of original.issued)
        if (!this.wrapperCurrent(wrapper)) issuedKnown = false;
      return known && issuedKnown;
    }
    const wrapper = this.wrappers.get(texture);
    return wrapper === undefined || this.wrapperCurrent(wrapper);
  }

  /** Stable environment reuse concerns its own tuple, not another user's drift. */
  public static environmentStable(texture: THREE.Texture): boolean {
    const wrapper = this.wrappers.get(texture);
    return wrapper === undefined || this.wrapperOwnCurrent(wrapper);
  }

  /** Only a clean pre-write tuple can acknowledge ordinary binding changes. */
  public static beginBinding(texture: THREE.Texture): BindingReceipt | undefined {
    const wrapper = this.wrappers.get(texture);
    return wrapper === undefined ? undefined : { wrapper, before: inputs(texture), clean: this.wrapperCurrent(wrapper) };
  }

  /** Fixed inputs cannot be blessed by changing sampler, decoding or UVs. */
  public static finishBinding(receipt: BindingReceipt | undefined, writes: BindingWrites): void {
    if (receipt === undefined) return;
    const { wrapper, before } = receipt;
    const after = inputs(wrapper.texture);
    const expectedSampling = [writes.colorSpace, ...(writes.sampler === undefined ? before.sampling.slice(1) :
      [writes.sampler.wrapS, writes.sampler.wrapT, writes.sampler.minFilter, writes.sampler.magFilter])];
    if (!receipt.clean || !wrapper.known || !this.originalCurrent(wrapper.claim) ||
        !same(before.fixed, after.fixed) || !same(expectedSampling, after.sampling) || after.version !== before.version + 1) {
      wrapper.known = false;
      if (after.source !== wrapper.inputs.source) wrapper.detached = true;
      return;
    }
    wrapper.inputs = after;
  }

  /** Mark uncertainty before the exclusive scene owner starts retirement. */
  public static beginEnvironment(texture: THREE.Texture): EnvironmentReceipt | undefined {
    const wrapper = this.wrappers.get(texture);
    if (wrapper === undefined) return undefined;
    const before = inputs(texture);
    if (before.source !== wrapper.inputs.source) wrapper.detached = true;
    const permitted = !wrapper.closed && !wrapper.detached &&
      same(wrapper.inputs.capacity, before.capacity) && this.originalCurrent(wrapper.claim);
    wrapper.known = false;
    return { wrapper, before, permitted };
  }

  /** A successful same-capacity retirement refreshes this environment only. */
  public static finishEnvironment(receipt: EnvironmentReceipt | undefined): boolean {
    if (receipt === undefined) return true;
    const { wrapper, before } = receipt;
    const after = inputs(wrapper.texture);
    if (after.source !== wrapper.inputs.source) wrapper.detached = true;
    if (!receipt.permitted || wrapper.detached || !this.originalCurrent(wrapper.claim) ||
        !same(before.capacity, after.capacity) || after.version !== before.version + 1)
      return false;
    wrapper.inputs = after;
    wrapper.known = true;
    return true;
  }

  /** Call before a cache's public disposal, including originals with listeners. */
  public static beginRetirement(texture: THREE.Texture): void {
    const original = this.originals.get(texture);
    if (original !== undefined) {
      if (texture.source !== (original.baseline?.source ?? original.initialSource)) original.detached = true;
      original.known = false;
    }
    const wrapper = this.wrappers.get(texture);
    if (wrapper !== undefined) {
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
      wrapper.known = false;
    }
  }

  /** Preserve an old detached footprint even after public dispose returns. */
  public static finishRetirement(texture: THREE.Texture): Error | undefined {
    const original = this.originals.get(texture);
    if (original !== undefined) {
      if (texture.source !== (original.baseline?.source ?? original.initialSource)) original.detached = true;
      original.active = false;
      original.issued.clear();
      if (original.detached)
        return new Error("Texture cache cannot certify retirement after its original Source was detached; retain the unknown footprint until context release.");
    }
    const wrapper = this.wrappers.get(texture);
    if (wrapper !== undefined) {
      if (texture.source !== wrapper.inputs.source) wrapper.detached = true;
      wrapper.closed = true;
      if (wrapper.detached)
        return new Error("Texture cache cannot certify retirement after an issued Source was detached; retain the unknown footprint until context release.");
    }
    return undefined;
  }

  private static originalCurrent(claim: Claim): boolean {
    if (!claim.active) return false;
    if (claim.texture.source !== (claim.baseline?.source ?? claim.initialSource)) {
      claim.detached = true;
      claim.known = false;
    }
    if (claim.baseline !== undefined && !equivalent(claim.baseline, inputs(claim.texture))) claim.known = false;
    return claim.known;
  }

  private static wrapperCurrent(wrapper: Wrapper): boolean {
    return this.wrapperOwnCurrent(wrapper) && this.originalCurrent(wrapper.claim);
  }

  private static wrapperOwnCurrent(wrapper: Wrapper): boolean {
    const current = inputs(wrapper.texture);
    if (current.source !== wrapper.inputs.source) wrapper.detached = true;
    if (!equivalent(wrapper.inputs, current)) wrapper.known = false;
    return !wrapper.closed && !wrapper.detached && wrapper.known;
  }
}

/** Actual owned fields; image references are observed without hashing pixels. */
const inputs = (texture: THREE.Texture): Inputs => {
  const image: unknown = texture.image;
  const record = typeof image === "object" && image !== null ? image : undefined;
  const width = record !== undefined && "width" in record ? record.width : undefined;
  const height = record !== undefined && "height" in record ? record.height : undefined;
  const data = record !== undefined && "data" in record ? record.data : undefined;
  const mipmaps: unknown = texture.mipmaps;
  const capacity = [texture.source, width, height, texture.type, texture.format, texture.internalFormat];
  const fixed = [...capacity, image, data, texture.generateMipmaps, mipmaps,
    Array.isArray(mipmaps) ? mipmaps.length : undefined, texture.flipY,
    texture.premultiplyAlpha, texture.unpackAlignment, texture.anisotropy, texture.mapping,
    "wrapR" in texture ? texture.wrapR || 0 : 0];
  const sampling = [texture.colorSpace, texture.wrapS, texture.wrapT, texture.minFilter, texture.magFilter];
  const copied = [...capacity, image, data, texture.generateMipmaps,
    Array.isArray(mipmaps) ? mipmaps.length : undefined,
    ...(Array.isArray(mipmaps) ? mipmaps : []), texture.flipY, texture.premultiplyAlpha,
    texture.unpackAlignment, texture.anisotropy, texture.mapping,
    "wrapR" in texture ? texture.wrapR || 0 : 0, ...sampling];
  return { source: texture.source, capacity, fixed, sampling, copied,
    state: [...fixed, ...sampling],
    version: texture.version };
};

/** Object.is distinguishes numeric flags without inventing a native cache key. */
const same = (left: readonly unknown[], right: readonly unknown[]): boolean =>
  left.every((value, index) => Object.is(value, right[index]));

/** Shared Source.version is absent; each original/wrapper has its own version. */
const equivalent = (left: Inputs, right: Inputs): boolean =>
  left.version === right.version && same(left.state, right.state);
