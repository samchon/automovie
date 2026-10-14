import { IAutoMovieBeatEndActorState, IAutoMovieBeatEndState } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "./ViolationCollector";
import { IAutoMovieContinuityTolerances } from "./IAutoMovieContinuityTolerances";

/**
 * Index opening actors by node and compare every prior actor or report its absence.
 *
 * @evidence contracts/common.md#principled-implementation Index opening actors by node and compare every prior actor or report its absence.
 * @evidence contracts/common.md#clear-and-simple-design One boundary owner is shared by pairwise and whole-film coordinators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts New opening actors are allowed; duplicate opening ids use last map entry and snapshot admission owns identity uniqueness.
 * @evidence contracts/common.md#meaningful-documentation All findings remain warnings, with node-qualified drift/mount paths.
 * @evidence contracts/performance.md#efficient-algorithms P prior and O opening actors cost O(P+O) expected map work plus text/vector arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work One local opening index serves every prior actor lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The map releases after the boundary; the collector owns rows and snapshots remain borrowed.
 */
export const compareContinuityBoundary: (previous: IAutoMovieBeatEndState, opening: IAutoMovieBeatEndState, root: string, tolerances: IAutoMovieContinuityTolerances, collector: ViolationCollector) => void = (
  previous: IAutoMovieBeatEndState,
  opening: IAutoMovieBeatEndState,
  root: string,
  tolerances: IAutoMovieContinuityTolerances,
  collector: ViolationCollector,
): void => {
  const openingByNode: Map<string, IAutoMovieBeatEndActorState> = new Map(
    opening.actors.map((actor: IAutoMovieBeatEndActorState): [string, IAutoMovieBeatEndActorState] => [actor.node, actor]),
  );
  previous.actors.forEach((prev: IAutoMovieBeatEndActorState): void => {
    const open: IAutoMovieBeatEndActorState | undefined = openingByNode.get(prev.node);
    if (open === undefined) {
      collector.warn(
        "physics",
        `${root}.opening.actors`,
        `actor "${prev.node}" ended the previous beat but is absent from the incoming beat's opening: continuity cannot be verified`,
        prev.node,
      );
      return;
    }
    compareActor(
      prev,
      open,
      `${root}.opening.actors[node=${prev.node}]`,
      tolerances,
      collector,
    );
  });
};

/**
 * Compare one actor's translation, normalized facing angle and prior persistent mount to its opening state.
 *
 * The boundary owner supplies admitted tolerances and matching node identity.
 *
 * A prior null mount imposes no incoming mount requirement; differences remain advisory.
 *
 * Metre/degree overshoots and actor-qualified paths identify each warning.
 *
 * Fixed vector arithmetic and mount string comparisons cost bounded work apart from text.
 *
 * angleBetweenDeg and sameMount share these decisions for pairwise/film callers.
 *
 * Only collector warnings remain; snapshots are borrowed without host state.
 */
const compareActor: (prev: IAutoMovieBeatEndActorState, open: IAutoMovieBeatEndActorState, path: string, tolerances: IAutoMovieContinuityTolerances, collector: ViolationCollector) => void = (
  prev: IAutoMovieBeatEndActorState,
  open: IAutoMovieBeatEndActorState,
  path: string,
  tolerances: IAutoMovieContinuityTolerances,
  collector: ViolationCollector,
): void => {
  const drift: number = Vector3.length(
    Vector3.subtract(open.transform.translation, prev.transform.translation),
  );
  if (drift > tolerances.position)
    collector.warn(
      "physics",
      `${path}.transform.translation`,
      `resume within ${tolerances.position} m of where the previous beat ended`,
      open.transform.translation,
      drift - tolerances.position,
    );

  const facingDeg: number = angleBetweenDeg(prev.facing, open.facing);
  if (facingDeg > tolerances.facingDeg)
    collector.warn(
      "physics",
      `${path}.facing`,
      `resume within ${tolerances.facingDeg} deg of the previous beat's facing`,
      open.facing,
      facingDeg - tolerances.facingDeg,
    );

  if (prev.mount !== null && !sameMount(prev.mount, open.mount))
    collector.warn(
      "physics",
      `${path}.mount`,
      `keep riding "${prev.mount.parent}"'s "${prev.mount.bone}" the rider ended the previous beat mounted on`,
      open.mount,
    );
};

/**
 * Normalize both facing vectors, clamp their dot and return acos in degrees.
 *
 * Shared Vector3 arithmetic gives the usual angle for finite nonzero facing vectors.
 *
 * Degenerate zero vectors normalize to zero and therefore yield90deg; malformed snapshots are not separately admitted here.
 *
 * The finite nonzero-facing premise and degree output are stated.
 *
 * Two normalizations, one dot and acos take constant arithmetic.
 *
 * Actor comparisons share the same angle metric without a facing cache.
 *
 * Only a scalar escapes and no vector/snapshot reference is retained.
 */
const angleBetweenDeg: (a: IAutoMovieBeatEndActorState["facing"], b: IAutoMovieBeatEndActorState["facing"]) => number = (
  a: IAutoMovieBeatEndActorState["facing"],
  b: IAutoMovieBeatEndActorState["facing"],
): number => {
  const dot: number = Vector3.dot(Vector3.normalize(a), Vector3.normalize(b));
  const clamped: number = Math.min(1, Math.max(-1, dot));
  return (Math.acos(clamped) * 180) / Math.PI;
};

/**
 * Require the same parent and bone on a non-null incoming mount.
 *
 * Mount persistence is identity equality rather than world-position proximity.
 *
 * Only a previously mounted actor invokes this predicate; a new mount is not forbidden.
 *
 * Null incoming mount means the previous coupling was dropped.
 *
 * Two string comparisons cost their text lengths with constant working storage.
 *
 * All continuity boundaries share the same coupling identity law.
 *
 * Mount records are borrowed and only a boolean escapes.
 */
const sameMount: (prev: NonNullable<IAutoMovieBeatEndActorState["mount"]>, open: IAutoMovieBeatEndActorState["mount"]) => boolean = (
  prev: NonNullable<IAutoMovieBeatEndActorState["mount"]>,
  open: IAutoMovieBeatEndActorState["mount"],
): boolean =>
  open !== null && open.parent === prev.parent && open.bone === prev.bone;
