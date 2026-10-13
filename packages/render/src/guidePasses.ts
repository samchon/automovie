import type { AutoMovieGuidePass } from "@automovie/interface";

import { frameName } from "./frameName";
import { framePattern } from "./framePattern";

/**
 * Every member of the closed `AutoMovieGuidePass` union, in declaration order,
 * as the runtime list a requested pass name is checked against.
 *
 * The `interface` package holds only types, so the value list lives here.
 *
 * @author Samchon
 */
export const AUTOMOVIE_GUIDE_PASSES: readonly AutoMovieGuidePass[] = [
  "beauty",
  "depth",
  "mask",
  "normal",
  "outline",
  "pose",
];

/**
 * Whether a string names a guide pass, narrowing it to `AutoMovieGuidePass`.
 *
 * The comparison is exact and case-sensitive against
 * `AUTOMOVIE_GUIDE_PASSES`.
 *
 * @evidence contracts/common.md#principled-implementation Membership in the runtime list that mirrors the closed union is the definition of a valid pass name, and a TypeScript type predicate carries that proof to the caller's type.
 * @evidence contracts/common.md#clear-and-simple-design One predicate over the one runtime list serves every pass check in render, including `normalizeGuidePasses` and the production planner's `assertSingleGuidePass`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No name is special-cased or case-folded; the widening cast to `readonly string[]` only lets `includes` accept an unnarrowed string.
 * @evidence contracts/common.md#meaningful-documentation The doc states the narrowing, the list compared against, and that matching is exact and case-sensitive.
 * @evidence contracts/performance.md#efficient-algorithms A linear scan of the six-entry list, constant time with no allocation; a set would not be faster at this size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure membership test on one string coordinates no phases, so there is no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The six-name list is a module constant shared by all calls, and the membership test allocates nothing per call, so retention is fixed at that list.
 * @author Samchon
 */
export const isGuidePass = (value: string): value is AutoMovieGuidePass =>
  (AUTOMOVIE_GUIDE_PASSES as readonly string[]).includes(value);

/**
 * File name of one frame of one pass: `beauty` keeps the plain `frameName`
 * spelling (`frame_00042.png`), and every other pass inserts its name before
 * the extension (`frame_00042.depth.png`).
 *
 * `index` is the zero-based frame number, zero-padded to `pad` digits, and
 * `ext` the extension without a dot. The untagged beauty name keeps a
 * single-pass render's paths unchanged, and the name depends only on the
 * arguments, so every machine writes the same paths and a chunk's frame
 * directory holds each pass's frames side by side.
 *
 * @evidence contracts/common.md#principled-implementation The pass becomes a second extension segment on the shared frame-name rule, so names of different passes never collide and ffmpeg's numbered-sequence pattern still matches each pass separately.
 * @evidence contracts/common.md#clear-and-simple-design The function delegates numbering and padding to `frameName` and adds only the pass tag through the private `passExtension`, so frame naming has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The untagged `beauty` name is the documented compatibility rule for single-pass output, not a consumer special case.
 * @evidence contracts/common.md#meaningful-documentation The doc gives both name shapes with examples, each argument's meaning and default, and why beauty stays untagged.
 * @evidence contracts/performance.md#efficient-algorithms The call builds one short string in time linear in its length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call formats one short name, so caching would cost more than formatting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each frame name is a new string the capture writer uses as a path once; nothing about the pass or index is cached, and no file is opened here.
 * @author Samchon
 */
export const guidePassFrameName = (
  index: number,
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => frameName(index, passExtension(pass, ext), pad);

/**
 * The ffmpeg `-i` input pattern matching every `guidePassFrameName` of one
 * pass, such as `frame_%05d.depth.png`.
 *
 * `ext` and `pad` must equal those the frames were named with.
 *
 * @evidence contracts/common.md#principled-implementation The pattern is `framePattern` over the same pass-tagged extension `guidePassFrameName` uses, so ffmpeg's `%0Nd` sequence syntax matches exactly that pass's files.
 * @evidence contracts/common.md#clear-and-simple-design It shares `passExtension` with `guidePassFrameName`, so a name and its pattern cannot disagree on the pass tag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass or extension is special-cased beyond the untagged beauty rule shared with the frame names.
 * @evidence contracts/common.md#meaningful-documentation The doc says which names the pattern matches, gives an example, and states that the arguments must match the naming call.
 * @evidence contracts/performance.md#efficient-algorithms The call builds one short string in constant time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call formats one short pattern, so caching would cost more than formatting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pattern string goes straight into an ffmpeg argument list owned by the caller; this function starts no ffmpeg process and keeps no reference.
 * @author Samchon
 */
export const guidePassFramePattern = (
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => framePattern(passExtension(pass, ext), pad);

/**
 * Where one guide pass writes its frames inside a frame directory, as
 * `planGuidePassOutputs` plans it.
 *
 * Paths join the frame directory and the default `png` five-digit frame name
 * with `/`.
 *
 * @evidence contracts/common.md#principled-implementation The record stores the first and last frame paths and the ffmpeg pattern, which are the three facts a capture writer and an encoder need to address one pass's sequence.
 * @evidence contracts/common.md#clear-and-simple-design Four plain fields per pass, with no frame list, because the pattern already addresses every frame between the first and last.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every field is derived from the shared naming rule; nothing is special-cased per pass beyond the untagged beauty name.
 * @evidence contracts/common.md#meaningful-documentation The doc names the producer and the path spelling, and each member states which frame or input it addresses.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The output record is produced, not computed over; the six-pass bound on how many exist per directory is answered on `planGuidePassOutputs`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each output record is four strings for one pass in one directory, and planning a new directory rebuilds them because their paths differ.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds three strings and no handle or task.
 * @author Samchon
 */
export interface IAutoMovieGuidePassOutput {
  /** The guide pass these paths belong to. */
  pass: AutoMovieGuidePass;

  /** Path of the pass's frame 0. */
  firstFrame: string;

  /** Path of the pass's last frame, numbered `frameCount - 1`. */
  lastFrame: string;

  /** Ffmpeg `-i` pattern matching every frame of the pass. */
  inputPattern: string;
}

/**
 * Validate a requested pass list and fold repeats, keeping each pass at its
 * first position.
 *
 * Throws `unknown guide pass "<name>"` for a name outside
 * `AUTOMOVIE_GUIDE_PASSES`. `planGuidePassOutputs`, the chunked sequence
 * planner and the playground's render script all normalize through it, so a
 * request means the same pass order everywhere. The production planner's
 * `assertSingleGuidePass` is a narrower rule and does not use it.
 *
 * @evidence contracts/common.md#principled-implementation A seen-set with first-occurrence wins is order-preserving deduplication, and membership is `isGuidePass`, so the result is the request's distinct valid passes in request order.
 * @evidence contracts/common.md#clear-and-simple-design One loop does validation and folding together, and the function is the single normalization the sequence planners share so their pass orders cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass is special-cased or silently dropped; an unknown name throws instead of being skipped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the folding rule, the exact refusal message, which callers depend on it, and how it differs from the production planner's rule.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the P requested names with constant-time set and list membership, O(P) time and at most six retained passes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call folds one short request, and the chunked planner's repeat call per chunk costs less than any cache would.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The seen-set is local and released on return; the returned list, owned by the caller, holds at most six passes.
 * @author Samchon
 */
export const normalizeGuidePasses = (
  passes: readonly string[],
): AutoMovieGuidePass[] => {
  const seen: Set<AutoMovieGuidePass> = new Set();
  const normalized: AutoMovieGuidePass[] = [];
  for (const pass of passes) {
    if (isGuidePass(pass) === false) throw new Error(`unknown guide pass "${pass}"`);
    if (seen.has(pass)) continue;
    seen.add(pass);
    normalized.push(pass);
  }
  return normalized;
};

/**
 * Plan where each requested pass writes its frames inside one frame
 * directory: one capture per pass per frame, at pass-tagged paths.
 *
 * Passes are normalized by `normalizeGuidePasses`, so repeats fold and an
 * unknown name throws; an empty request yields an empty plan. Throws when
 * `frameCount` is not a positive integer. Paths use the default `png`
 * extension and five-digit numbering.
 *
 * @evidence contracts/common.md#principled-implementation Each output's first, last and pattern paths come from the same naming functions the capture writer uses, so the plan addresses exactly the files a capture of `frameCount` frames writes.
 * @evidence contracts/common.md#clear-and-simple-design Validation of passes is delegated to `normalizeGuidePasses` and naming to `guidePassFrameName` and `guidePassFramePattern`; this function only checks the frame count and joins paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass, directory or frame count is special-cased, and an invalid count throws instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation The doc states the pass normalization and its refusals, the empty-request result, the frame-count refusal, and the fixed extension and padding.
 * @evidence contracts/performance.md#efficient-algorithms Cost is O(P) for P requested names plus three short strings per distinct pass, at most six.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call plans one frame directory from its own arguments, and the strings are cheaper to rebuild than to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The function retains nothing after returning the plan its caller owns and opens no handle or task.
 * @author Samchon
 */
export const planGuidePassOutputs = (props: {
  /** Directory where the render's frame files are written. */
  frameDir: string;

  /** Number of frames each pass captures; a positive integer. */
  frameCount: number;

  /** Requested passes, in capture order. */
  passes: readonly string[];
}): IAutoMovieGuidePassOutput[] => {
  if (Number.isInteger(props.frameCount) === false || props.frameCount <= 0)
    throw new Error(
      `guide pass frameCount must be a positive integer, but was ${props.frameCount}`,
    );
  return normalizeGuidePasses(props.passes).map(
    (pass: AutoMovieGuidePass): IAutoMovieGuidePassOutput => ({
      pass,
      firstFrame: `${props.frameDir}/${guidePassFrameName(0, pass)}`,
      lastFrame: `${props.frameDir}/${guidePassFrameName(props.frameCount - 1, pass)}`,
      inputPattern: `${props.frameDir}/${guidePassFramePattern(pass)}`,
    }),
  );
};

/** The file extension carrying the pass tag; `beauty` stays untagged. */
const passExtension = (pass: AutoMovieGuidePass, ext: string): string =>
  pass === "beauty" ? ext : `${pass}.${ext}`;
