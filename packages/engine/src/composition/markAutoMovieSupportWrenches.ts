import type {
  IAutoMovieMark,
  IAutoMovieMarkSupportWrenches,
  IAutoMoviePhysicalSupportWrench,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Turn the support wrenches governing one second into inspection marks: the
 * force the controller allocated to actual floor witnesses, and any shortfall
 * from what it requested.
 *
 * A body's wrench governs `seconds` when it is that body's latest record at or
 * before `seconds` and `seconds` lies before its instant plus `interval`, the
 * cache step the controller allocated it for. Its allocated force is an arrow
 * from the recorded centre of mass, `metresPerNewton` times the force; a zero
 * allocation draws no such arrow. When the residual force exceeds the
 * optimisation error the allocator itself admits, 1e-6 of its scale, taken here
 * as the larger of 1 N and the requested force because the record keeps no
 * lever to restore the moment term, a second arrow starts at the allocated
 * arrow's tip, so the two arrows add up to the requested force. A body with no
 * witnesses therefore draws only its whole request as shortfall. Moments are
 * not drawn. Both quantities are motor demand before native caps and
 * integration, not measured load; `markAutoMovieContacts` draws the force
 * contacts actually transferred.
 *
 * The allocated mark has kind `support/allocated`, label `allocated support
 * force`, colour slate blue `7b68ee` and path `<body>/support/allocated`. The
 * shortfall mark has kind `support/shortfall`, label `support force shortfall`,
 * colour dark orange `ff8c00`, path `<body>/support/shortfall` and is flagged,
 * because a request the floor witnesses could not carry is an anomaly. Both are
 * in world metres and unanchored, in the order each body's first record
 * appears.
 *
 * It throws for an interval or a scale that is not positive and finite.
 *
 * @param props.wrenches Support wrench records of a physics cache or playback.
 * @param props.seconds The drawn film second.
 * @param props.interval The cache step each record governs.
 * @param props.metresPerNewton Arrow length per newton.
 * @returns Up to two marks per governed body.
 */
export function markAutoMovieSupportWrenches(
  props: IAutoMovieMarkSupportWrenches.IProps,
): IAutoMovieMark[] {
  if (!(props.interval > 0))
    throw new Error(
      `markAutoMovieSupportWrenches: interval ${props.interval} is not positive and finite`,
    );
  if (!(props.metresPerNewton > 0))
    throw new Error(
      `markAutoMovieSupportWrenches: metres per newton ${props.metresPerNewton} is not positive and finite`,
    );

  // Records are ordered by time, so the last one at or before the second is each body's latest.
  const latest: Map<string, IAutoMoviePhysicalSupportWrench> = new Map();
  for (const wrench of props.wrenches)
    if (wrench.seconds <= props.seconds + 1e-9) latest.set(wrench.body, wrench);

  const marks: IAutoMovieMark[] = [];
  for (const wrench of latest.values()) {
    if (props.seconds - wrench.seconds >= props.interval) continue;
    const allocated: IAutoMovieVector3 = wrench.allocated.force;
    const tip: IAutoMovieVector3 = {
      x: wrench.origin.x + allocated.x * props.metresPerNewton,
      y: wrench.origin.y + allocated.y * props.metresPerNewton,
      z: wrench.origin.z + allocated.z * props.metresPerNewton,
    };
    if (norm(allocated) > 0)
      marks.push(
        arrow(wrench.body, "allocated", wrench.origin, allocated, props),
      );

    // Shortfall beyond the allocator's admitted optimisation error.
    const admitted: number = 1e-6 * Math.max(1, norm(wrench.requested.force));
    if (norm(wrench.residual.force) > admitted)
      marks.push(
        arrow(wrench.body, "shortfall", tip, wrench.residual.force, props),
      );
  }
  return marks;
}

/**
 * One unanchored world arrow of a support force from `origin`, scaled to
 * metres.
 */
function arrow(
  body: string,
  part: "allocated" | "shortfall",
  origin: IAutoMovieVector3,
  force: IAutoMovieVector3,
  props: IAutoMovieMarkSupportWrenches.IProps,
): IAutoMovieMark {
  return {
    path: `${body}/support/${part}`,
    kind: `support/${part}`,
    label:
      part === "allocated"
        ? "allocated support force"
        : "support force shortfall",
    color: part === "allocated" ? 0x7b68ee : 0xff8c00,
    shape: {
      type: "arrows",
      origins: [origin.x, origin.y, origin.z],
      vectors: [
        force.x * props.metresPerNewton,
        force.y * props.metresPerNewton,
        force.z * props.metresPerNewton,
      ],
    },
    flagged: part === "shortfall",
    anchor: null,
  };
}

/** Euclidean length of a world vector. */
function norm(vector: IAutoMovieVector3): number {
  return Math.hypot(vector.x, vector.y, vector.z);
}
