import { compareCodeUnits } from "./contentIdentity";

/**
 * Plan portable registration and checkout-local incarnation changes for one open.
 *
 * The project store supplies a validated production id and registry. Mutable opens leave current portable bytes alone, except for a one-time retired inline-lineage rewrite; a newly registered id discards any stray incarnation before portable publication and receives a new generation afterward. Read-only opens refuse unregistered ids and absent local incarnations; AutoMovieProductionProject.open initializes a writable checkout.
 *
 * @evidence contracts/common.md#principled-implementation Exact id membership decides registration, and code-unit sorting makes rewritten portable records deterministic. productionProjectActivateProduction executes discard, publish and issue in that order; this plan does not perform or atomically reserve those effects.
 * @evidence contracts/common.md#clear-and-simple-design The three outputs distinguish portable publication, stale local removal and generation issuance. Project admission owns id validity, reserved names, portable case collisions and namespace fences.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The retired-lineage rewrite is a supported schema migration; read-only admission does not silently initialize or fabricate an incarnation. The planner relies on the caller's validated unique ids rather than adding consumer-specific spelling exceptions.
 * @evidence contracts/common.md#meaningful-documentation Explains portable versus local identity, no-op reopening, historical migration and the ordered effects required by each result, with the actual writable-open recovery API.
 * @evidence contracts/performance.md#efficient-algorithms Membership scans R ids; a publication clones and sorts R or R+1 ids in O(R log R) string comparisons, whose cost follows id length. Read-only and unchanged registration avoid cloning and sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work A null publish result reuses the resident portable record without rewriting bytes; incarnation decisions use this checkout's supplied observations and are not cached across opens.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Published id arrays are newly allocated and transferred to the caller; the planner opens no handle or task and retains no namespace state. Registry size and total id bytes are caller-bounded, not capped here.
 */
export function planAutoMovieProductionRegistration(
  props: {
  /** Resident registry after validation, or `null` when this checkout has none. */
  registry: {
    /** Registered production ids. */
    productions: readonly string[];

    /** Design layout version the resident record declares. */
    layoutVersion: number;

    /** Whether the resident record still carries the retired inline `incarnations` member. */
    retiredLineage: boolean;
  } | null;

  /** Selected production id, already validated by the project store. */
  productionId: string;

  /** Whether this checkout holds an incarnation record for that production. */
  incarnationPresent: boolean;

  /** Whether this open may write project state. */
  mutable: boolean;
}
): {
  /** Portable registry to publish, or `null` to leave the resident bytes untouched. */
  publish: {
    /** Registry record version. */
    version: 1;

    /** Design layout version, carried over from the resident record. */
    layoutVersion: number;

    /** Registered production ids in code-unit order. */
    productions: string[];
  } | null;

  /** Remove the resident incarnation record before anything is published. */
  discard: boolean;

  /** Issue a new incarnation after publishing instead of adopting the resident one. */
  issue: boolean;
} {
  const registry: Parameters<typeof planAutoMovieProductionRegistration>[0]["registry"] = props.registry;
  const registered: boolean =
    registry !== null && registry.productions.includes(props.productionId);
  if (props.mutable === false) {
    if (registered === false)
      throw new Error(
        `Read-only verification cannot register missing production "${props.productionId}". Initialize this checkout with AutoMovieProductionProject.open(rootDirectory, productionId).`,
      );
    if (props.incarnationPresent === false)
      throw new Error(
        `Read-only verification requires this checkout's incarnation of production "${props.productionId}". Initialize this checkout with AutoMovieProductionProject.open(rootDirectory, productionId).`,
      );
    return { publish: null, discard: false, issue: false };
  }
  if (registry !== null && registered)
    return {
      publish: registry.retiredLineage
        ? {
            version: 1,
            layoutVersion: registry.layoutVersion,
            productions: [...registry.productions].sort(compareCodeUnits),
          }
        : null,
      discard: false,
      issue: props.incarnationPresent === false,
    };
  return {
    publish: {
      version: 1,
      layoutVersion: registry?.layoutVersion ?? 0,
      productions: [...(registry?.productions ?? []), props.productionId].sort(
        compareCodeUnits,
      ),
    },
    discard: props.incarnationPresent,
    issue: true,
  };
}
