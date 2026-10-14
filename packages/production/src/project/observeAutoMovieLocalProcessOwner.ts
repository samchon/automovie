import type { IAutoMovieLocalProcessOwner } from "./IAutoMovieLocalProcessOwner";
import type { AutoMovieLocalProcessQuery } from "./AutoMovieLocalProcessQuery";
import type { AutoMovieLocalProcessOwnerObservation } from "./AutoMovieLocalProcessOwnerObservation";
import { isAutoMovieLocalProcessOwner } from "./isAutoMovieLocalProcessOwner";



/**
 * Observe persisted process ownership without treating PID occupancy as identity.
 *
 * @evidence contracts/common.md#principled-implementation Both descriptors are validated first; foreign hosts remain elsewhere, exact host/PID/generation is same-owner, and otherwise signal zero distinguishes ESRCH absence from success/EPERM occupancy and unavailable evidence.
 * @evidence contracts/common.md#clear-and-simple-design One observer separates descriptor admission from native-query capability so commit-lock recovery can consume explicit proof states.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Age and PID equality alone never authorize recovery; malformed descriptors and all unrecognized or unreadable platform failures remain unknown.
 * @evidence contracts/common.md#meaningful-documentation States validation order, non-terminating query, platform error meanings and conservative unknown behavior.
 * @evidence contracts/performance.md#efficient-algorithms Two bounded descriptor scans and at most one native process-table query dominate; no process enumeration or retry loop occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work No occupancy result is cached because the recorded PID can exit or be reused between observations; the passed current identity is shared with this one query.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The observation returns descriptor references and retains no query task or handle; thrown adapter errors become sanitized unknown states without retaining raw errors.
 */
export function observeAutoMovieLocalProcessOwner(props: {
  /** Persisted owner-shaped value to validate and observe. */
  owner: unknown;

  /** Stable identity of the process performing the observation. */
  current: IAutoMovieLocalProcessOwner;

  /** Signal-zero process-table adapter. */
  query: AutoMovieLocalProcessQuery;
}): AutoMovieLocalProcessOwnerObservation {
  if (
    isAutoMovieLocalProcessOwner(props.owner) === false ||
    isAutoMovieLocalProcessOwner(props.current) === false
  )
    return { state: "unknown", owner: null, reason: "invalid-owner" };
  const owner: IAutoMovieLocalProcessOwner = props.owner;
  if (owner.host !== props.current.host) return { state: "elsewhere", owner };
  if (
    owner.pid === props.current.pid &&
    owner.generation === props.current.generation
  )
    return { state: "same-owner", owner };
  try {
    props.query(owner.pid, 0);
    return { state: "occupied-or-reused", owner };
  } catch (error) {
    let code: unknown;
    try {
      code = (error as NodeJS.ErrnoException).code;
    } catch {
      return {
        state: "unknown",
        owner,
        reason: "process-query-unavailable",
      };
    }
    if (code === "ESRCH") return { state: "absent", owner };
    if (code === "EPERM") return { state: "occupied-or-reused", owner };
    return {
      state: "unknown",
      owner,
      reason: "process-query-unavailable",
    };
  }
}
