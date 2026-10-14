import {
  validateDesignEvidence,
  validateDesignReference,
} from "@automovie/engine";
import {
  AutoMovieDiagnosticCode,
  IAutoMovieDesignEvidence,
  IAutoMovieDesignReference,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { digestAutoMovieBytes } from "./contentIdentity";
import { AutoMovieDesignReferenceContainerError } from "./designReference/AutoMovieDesignReferenceContainerError";
import type { IAutoMovieInspectedDesignReference } from "./IAutoMovieInspectedDesignReference";
import { inspectDesignReferenceAsset } from "./inspectDesignReferenceAsset";
import { AutoMovieUtf8Error } from "./strictUtf8";

/** Containers that carry exactly one page, so no frame may cite a second. */
const SINGLE_PAGE_MEDIA: Set<string> = new Set(["image/png", "image/jpeg", "image/svg+xml"]);

/**
 * Validate declared observation references against supplied asset bytes, typed uses and authored citations.
 *
 * @evidence contracts/common.md#principled-implementation In source order records duplicate ids, validates each observation, checks asset-use membership and current SHA-256, inspects the actual container family/extent, then validates reverse uses and evidence links.
 * @evidence contracts/common.md#clear-and-simple-design Build review calls this one reference gate; engine observation/evidence validators and each format inspector retain semantic/container ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry, scale or wall is inferred from pixels. Unmeasured containers withhold frame measurement, and supplied byte/use maps must describe the same captured attempt; duplicate diagnostics prevent successful publication despite later map projection.
 * @evidence contracts/common.md#meaningful-documentation Defines reference/source ordering, missing/stale/mismatched bytes, single-page scope and measured-width/height-only frame comparison without claiming an atomic physical snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Includes domain validation, hashing and container inspection per reference, all frame checks, reverse-use joins and evidence validation; shared assets may be rehashed/reinspected for distinct references and diagnostics scale with reported findings.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses one seen-id set and declared-id map for this attempt and shares canonical hash/domain owners; no persistent inspector cache substitutes for fresh supplied bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input buffers/maps remain borrowed and diagnostics transfer to the build result; local sets/maps and inspector state expire, with no filesystem descriptor or capture task acquired here.
 */
export const designReferenceDiagnostics: (props: {
  /** Project-relative ledger path reported as each diagnostic's file. */
  path: string;

  /** Design-reference documents this production declares, in source order. */
  references: readonly IAutoMovieDesignReference[];

  /** Citations the building source makes against those documents. */
  evidence: readonly IAutoMovieDesignEvidence[];

  /** Current project bytes by canonical asset path; `null` when absent. */
  assets: ReadonlyMap<string, Uint8Array | null>;

  /**
   * Design-reference document ids authorized on each asset path by an active
   * `design-reference` use in the production's asset manifest.
   */
  uses: ReadonlyMap<string, ReadonlySet<string>>;
}) => IAutoMovieDiagnostic[] = (props: {
  /** Project-relative ledger path reported as each diagnostic's file. */
  path: string;

  /** Design-reference documents this production declares, in source order. */
  references: readonly IAutoMovieDesignReference[];

  /** Citations the building source makes against those documents. */
  evidence: readonly IAutoMovieDesignEvidence[];

  /** Current project bytes by canonical asset path; `null` when absent. */
  assets: ReadonlyMap<string, Uint8Array | null>;

  /**
   * Design-reference document ids authorized on each asset path by an active
   * `design-reference` use in the production's asset manifest.
   */
  uses: ReadonlyMap<string, ReadonlySet<string>>;
}): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const diagnostic: (code: AutoMovieDiagnosticCode, target: string, message: string) => void = (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ): void => {
    diagnostics.push({
      code,
      category: "error",
      phase: "design",
      target,
      path: props.path,
      message,
    });
  };

  const seen: Set<string> = new Set<string>();
  for (const reference of props.references) {
    if (seen.has(reference.id))
      diagnostic(
        "design-reference-duplicate",
        reference.id,
        `Design reference "${reference.id}" is declared more than once. Keep one observation document per stable identity so a citation resolves to exactly one reading.`,
      );
    seen.add(reference.id);

    const validated: ReturnType<typeof validateDesignReference> = validateDesignReference({ reference });
    if (validated.success === false) {
      diagnostic(
        "design-reference-invalid",
        reference.id,
        `Design reference "${reference.id}" is not a consistent observation: ${validated.violations
          .map((item: (typeof validated.violations)[number]): string => `${item.path}: ${item.expected}`)
          .join(
            "; ",
          )}. Correct the observation; do not resolve it by promoting a reading into the building source.`,
      );
      continue;
    }

    const authorized: ReadonlySet<string> | undefined = props.uses.get(reference.asset);
    if (authorized === undefined || !authorized.has(reference.id))
      diagnostic(
        "design-reference-use-unbound",
        reference.id,
        `Design reference "${reference.id}" reads "${reference.asset}", but that asset declares no active design-reference use naming this document. Register the typed use before citing the bytes as design evidence.`,
      );

    const bytes: Uint8Array | null = props.assets.get(reference.asset) ?? null;
    if (bytes === null) {
      diagnostic(
        "design-reference-asset-missing",
        reference.id,
        `Design reference "${reference.id}" declares "${reference.asset}", but those bytes are absent from the project content. Restore the observed file before compiling the design that cites it.`,
      );
      continue;
    }

    const current: string = digestAutoMovieBytes(bytes);
    if (current !== reference.digest) {
      diagnostic(
        "design-reference-stale",
        reference.id,
        `Design reference "${reference.id}" was observed at ${reference.digest}, but "${reference.asset}" now hashes to ${current}. Re-observe the new bytes; a design cannot keep citing readings taken from a file that no longer exists.`,
      );
      continue;
    }

    let inspected: IAutoMovieInspectedDesignReference;
    try {
      inspected = inspectDesignReferenceAsset({ path: reference.asset, bytes });
    } catch (error) {
      diagnostic(
        error instanceof AutoMovieUtf8Error
          ? "design-reference-encoding-invalid"
          : error instanceof AutoMovieDesignReferenceContainerError
            ? "design-reference-container-invalid"
            : "design-reference-media-unsupported",
        reference.id,
        // The asset inspector throws nothing but Error refusals.
        `${(error as Error).message} Convert the reference to a registrable container before citing it.`,
      );
      continue;
    }
    if (inspected.media !== reference.media) {
      diagnostic(
        "design-reference-media-mismatch",
        reference.id,
        `Design reference "${reference.id}" declares "${reference.media}", but "${reference.asset}" carries "${inspected.media}" bytes. Declare the container the file actually is.`,
      );
      continue;
    }

    const single: boolean = SINGLE_PAGE_MEDIA.has(inspected.media);
    for (const frame of reference.frames) {
      if (single && frame.page !== 1)
        diagnostic(
          "design-reference-frame-page-missing",
          `${reference.id}/${frame.id}`,
          `Frame "${frame.id}" reads page ${frame.page} of "${reference.asset}", but a "${inspected.media}" reference carries exactly one page. Split multi-sheet evidence into one document per file.`,
        );
      if (inspected.bounds.status !== "measured") continue;
      if (
        frame.bounds.width > inspected.bounds.width ||
        frame.bounds.height > inspected.bounds.height
      )
        diagnostic(
          "design-reference-frame-bounds-mismatch",
          `${reference.id}/${frame.id}`,
          `Frame "${frame.id}" declares a source extent of ${frame.bounds.width}x${frame.bounds.height}, but "${reference.asset}" measures ${inspected.bounds.width}x${inspected.bounds.height}. A frame reads part of its sheet, never more than the sheet holds.`,
        );
    }
  }

  const declared: Map<string, string> = new Map(
    props.references.map((reference: IAutoMovieDesignReference): [string, string] => [reference.id, reference.asset]),
  );
  for (const [asset, documents] of props.uses)
    for (const document of documents) {
      const owner: string | undefined = declared.get(document);
      if (owner === undefined)
        diagnostic(
          "design-reference-use-dangling",
          document,
          `Asset "${asset}" declares a design-reference use naming "${document}", but this production declares no such observation document. Remove the stale use or restore the observation.`,
        );
      else if (owner !== asset)
        diagnostic(
          "design-reference-use-dangling",
          document,
          `Asset "${asset}" declares a design-reference use naming "${document}", but that document observes "${owner}". A document reads exactly the bytes that authorize it.`,
        );
    }

  const evidence: ReturnType<typeof validateDesignEvidence> = validateDesignEvidence({
    references: props.references,
    evidence: props.evidence,
  });
  if (evidence.success === false)
    for (const item of evidence.violations)
      diagnostic(
        "design-reference-evidence-dangling",
        item.path,
        `Design evidence is not grounded at ${item.path}: ${item.expected}. Cite an observation that exists, or record the decision as an issue instead of a citation.`,
      );

  return diagnostics;
};
