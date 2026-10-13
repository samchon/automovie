import path from "node:path";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";
import type { IValidateAutoMoviePopulationTransitionProps } from "./IValidateAutoMoviePopulationTransitionProps";
import type { AutoMoviePopulationTransitionReceipt } from "./AutoMoviePopulationTransitionReceipt";
import type { IAutoMovieRetainedPilotHost } from "./IAutoMovieRetainedPilotHost";
import { normalizeRelativePath } from "./AutoMoviePopulationTransitionInternal/normalizeRelativePath";
import { createAutoMovieRetainedPilotHost } from "./createAutoMovieRetainedPilotHost";
import type { IAutoMovieFilmPopulationTransitionReceipt } from "./IAutoMovieFilmPopulationTransitionReceipt";
import type { IAutoMovieLibraryPopulationTransitionReceipt } from "./IAutoMovieLibraryPopulationTransitionReceipt";


const SHA256: RegExp = /^[0-9a-f]{64}$/u;

const FILM_BRANCHES: readonly string[] = ["treatments", "scripts", "screenplays"];

const REVIEWED_FILM_BRANCHES: readonly string[] = [
  ...FILM_BRANCHES,
  "screenplayNaturalness",
];

const LIBRARY_PAIRS: Map<string, string> = new Map<string, string>([
  ["instances", "instanceSources"],
  ["maps", "mapSources"],
  ["materials", "materialSources"],
  ["models", "modelSources"],
  ["motions", "motionSources"],
  ["spaces", "spaceSources"],
  ["systems", "systemSources"],
]);


/**
 * Admit a reset only against its exact recorded passed pilot and current host source snapshots.
 *
 * Protocol, kind, resolved absolute production root and accepting owner must match. Film ladders and library design/source pairs must reset together under their respective rules. Repeated, missing or changed retained hosts and new unrecorded hosts carrying evidence declarations throw a cause-specific Error. Callers supply current stages and source; this validator performs no filesystem read.
 *
 * The historical receipt is caller-supplied evidence of a passed pilot; this operation validates its shape, owner and current projected source equality, without authenticating who recorded it or independently rerunning that historical review.
 *
 * @evidence contracts/common.md#principled-implementation The validator checks protocol, kind, resolved absolute root spelling, accepting owner and branch reset state, then compares per-path authored and annotation digests with the passed-pilot receipt. Duplicate, missing, altered and newly annotated unrecorded hosts refuse.
 * @evidence contracts/common.md#clear-and-simple-design Film ladder and library pair checks are private branches, while retained-host identity and normalized path admission have named shared producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A reset cannot manufacture completion from current stages alone or silently drop an absent retained host; every recorded predecessor identity is checked against current source.
 * @evidence contracts/common.md#meaningful-documentation The comment explains exact predecessor comparison, all refusal categories and that callers supply current stages and source snapshots rather than delegating filesystem reads.
 * @evidence contracts/performance.md#efficient-algorithms With H current hosts and R receipt hosts, map construction and lookup require O(H + R) operations plus path text work. Every supplied source is inspected, but its identity producer includes repeated carrier parsing and projection costs answered on createAutoMovieRetainedPilotHost, and each unrecorded host is parsed again for live tags; hashing alone is linear in projected text, not the complete validation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current host identity is computed once and indexed for all retained-host comparisons; the historical map is independent of mutable current source and no verdict survives a call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two call-local maps retain at most H and R identity records and release them on completion or refusal; source ownership stays with the caller and no archive or descriptor is acquired.
 */
export function validateAutoMoviePopulationTransition(
  props: IValidateAutoMoviePopulationTransitionProps,
): void {
  const receipt: | AutoMoviePopulationTransitionReceipt
    | undefined = props.receipt as
    | AutoMoviePopulationTransitionReceipt
    | undefined;
  if (receipt === undefined || receipt === null || typeof receipt !== "object")
    throw new Error(
      "A complete-production reset requires a transition receipt.",
    );
  if (receipt.version !== 1)
    throw new Error(
      "A complete-production reset requires transition receipt version 1.",
    );
  if (receipt.kind !== props.kind)
    throw new Error(
      `Reset kind ${props.kind} does not match pilot receipt kind ${receipt.kind}.`,
    );
  if (
    typeof receipt.productionLocation !== "string" ||
    !path.isAbsolute(receipt.productionLocation) ||
    !path.isAbsolute(props.productionLocation) ||
    path.resolve(receipt.productionLocation) !==
      path.resolve(props.productionLocation)
  )
    throw new Error(
      "Reset production location does not match its pilot receipt.",
    );
  if (typeof receipt.owner !== "string" || receipt.owner.trim() === "")
    throw new Error("A reset transition receipt requires a non-empty owner.");
  if (typeof props.owner !== "string" || props.owner.trim() === "")
    throw new Error(
      "A complete-production reset requires a non-empty current owner.",
    );
  if (receipt.owner !== props.owner)
    throw new Error("Reset owner does not match its pilot transition receipt.");
  if (
    receipt.pilotScope === null ||
    typeof receipt.pilotScope !== "object" ||
    receipt.pilotScope.mode !== "first-pilot"
  )
    throw new Error("A reset transition receipt must describe a first pilot.");

  if (receipt.kind === "film") validateFilmReceipt(receipt, props.stages);
  else validateLibraryReceipt(receipt, props.stages);

  if (
    !Array.isArray(receipt.retainedHosts) ||
    receipt.retainedHosts.length === 0
  )
    throw new Error(
      "A reset transition receipt requires a retained pilot host.",
    );
  const expected: Map<string, IAutoMovieRetainedPilotHost> = new Map<string, IAutoMovieRetainedPilotHost>();
  for (const host of receipt.retainedHosts) {
    if (
      host === null ||
      typeof host !== "object" ||
      typeof host.path !== "string"
    )
      throw new Error(
        "A reset transition receipt contains an invalid retained host.",
      );
    const hostPath: string = normalizeRelativePath(host.path);
    if (!SHA256.test(host.bodySha256) || !SHA256.test(host.evidenceTagSha256))
      throw new Error(
        `${hostPath}: retained pilot host has an invalid SHA-256 identity.`,
      );
    if (expected.has(hostPath))
      throw new Error(
        `${hostPath}: retained pilot host is repeated in the receipt.`,
      );
    expected.set(hostPath, { ...host, path: hostPath });
  }

  const current: Map<string, IAutoMovieRetainedPilotHost> = new Map<string, IAutoMovieRetainedPilotHost>();
  for (const host of props.hosts) {
    const identity: IAutoMovieRetainedPilotHost = createAutoMovieRetainedPilotHost(host);
    if (current.has(identity.path))
      throw new Error(
        `${identity.path}: reset host is repeated in the current population.`,
      );
    current.set(identity.path, identity);
    if (
      !expected.has(identity.path) &&
      parseAutoMovieEvidenceSyntax({ path: identity.path, source: host.source })
        .length !== 0
    )
      throw new Error(
        `${identity.path}: a new reset host cannot carry a retained pilot evidence tag.`,
      );
  }

  for (const [hostPath, ancestor] of expected) {
    const candidate: IAutoMovieRetainedPilotHost | undefined = current.get(hostPath);
    if (candidate === undefined)
      throw new Error(
        `${hostPath}: retained pilot host is absent from the reset population.`,
      );
    if (candidate.bodySha256 !== ancestor.bodySha256)
      throw new Error(
        `${hostPath}: retained pilot authored body changed before reset.`,
      );
    if (candidate.evidenceTagSha256 !== ancestor.evidenceTagSha256)
      throw new Error(
        `${hostPath}: retained pilot evidence tags changed before reset.`,
      );
  }
}


/** Reset construction together after the complete final pilot passed. */
function validateFilmReceipt(
  receipt: IAutoMovieFilmPopulationTransitionReceipt,
  stages: Readonly<Record<string, string>>,
): void {
  if (
    typeof receipt.pilotScope.partitionGroup !== "string" ||
    !/^001-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(receipt.pilotScope.partitionGroup)
  )
    throw new Error(
      "A film reset receipt requires one exact 001-* pilot partition.",
    );
  if (
    !Array.isArray(receipt.reviewedBranches) ||
    receipt.reviewedBranches.length !== REVIEWED_FILM_BRANCHES.length ||
    REVIEWED_FILM_BRANCHES.some(
      (branch: string, index: number) : boolean => receipt.reviewedBranches[index] !== branch,
    )
  )
    throw new Error(
      "A film reset receipt requires the complete narrative ladder in reviewedBranches.",
    );
  if (stages.screenplayNaturalness !== "disabled")
    throw new Error(
      "A film reset requires screenplay naturalness to be disabled.",
    );
  for (const branch of FILM_BRANCHES)
    if (stages[branch] !== "draft")
      throw new Error(
        `A film reset requires ${branch} to move to draft together.`,
      );
}


/** Require every recorded library design/source pair to reset together. */
function validateLibraryReceipt(
  receipt: IAutoMovieLibraryPopulationTransitionReceipt,
  stages: Readonly<Record<string, string>>,
): void {
  if (
    !Array.isArray(receipt.reviewedPairs) ||
    receipt.reviewedPairs.length !== 1
  )
    throw new Error(
      "A library reset receipt requires one exact completed design/source pair in reviewedPairs.",
    );
  const pair: IAutoMovieLibraryPopulationTransitionReceipt["reviewedPairs"][number] = receipt.reviewedPairs[0]!;
  if (
    pair === null ||
    typeof pair !== "object" ||
    typeof pair.design !== "string" ||
    typeof pair.source !== "string" ||
    LIBRARY_PAIRS.get(pair.design) !== pair.source
  )
    throw new Error(
      "A library reset receipt requires a recognized design/source branch pair.",
    );
  const recorded: string = `${pair.design}\0${pair.source}`;
  if (stages[pair.design] !== "draft" || stages[pair.source] !== "draft")
    throw new Error(
      `A library reset requires ${pair.design} and ${pair.source} to move to draft together.`,
    );
  for (const [design, source] of LIBRARY_PAIRS)
    if (
      stages[design] === "draft" &&
      stages[source] === "draft" &&
      recorded !== `${design}\0${source}`
    )
      throw new Error(
        `A library reset cannot lower unrecorded pair ${design}/${source} to draft.`,
      );
}
