import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalPlayback,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Refuse inconsistent causal metadata even when an archive has a valid
 * integrity trailer: budgets, references, clocks, orderings, unit normals and
 * allocation residuals.
 */
export function admitPhysicalPlaybackMetadata(
  header: IAutoMoviePhysicalPlayback.IHeader,
): void {
  const segments: Set<string> = new Set(
    header.segments.map(
      ([body, bone]: (typeof header.segments)[number]): string =>
        JSON.stringify([body, bone]),
    ),
  );
  const bodies: Set<string> = new Set(
    header.segments.map(
      ([body]: (typeof header.segments)[number]): string => body,
    ),
  );
  const ids: Set<string> = new Set();
  const time: (value: number) => boolean = (value: number): boolean =>
    value >= 0 && value <= header.duration;
  const normal: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => Math.abs(Math.hypot(value.x, value.y, value.z) - 1) <= 1e-5;
  const identity: (side: IAutoMovieContactReceipt["a"]) => boolean = (
    side: IAutoMovieContactReceipt["a"],
  ): boolean =>
    !!side.shape.trim() &&
    !!side.material.trim() &&
    ((side.body === "floor" && side.bone === "floor") ||
      segments.has(JSON.stringify([side.body, side.bone])));
  if (
    header.ownership.length >
    (3 * header.duration * header.rate + 1) * header.segments.length
  )
    throw new Error("Malformed physical playback ownership budget");
  const owners: Map<string, IAutoMoviePhysicalOwnershipEvent> = new Map();
  for (const entry of header.ownership) {
    const key: string = JSON.stringify([entry.body, entry.bone]);
    const previous: IAutoMoviePhysicalOwnershipEvent | undefined =
      owners.get(key);
    if (
      !segments.has(key) ||
      !time(entry.seconds) ||
      (entry.stabilization !== undefined &&
        (entry.kind !== "return" || entry.stabilization < 0)) ||
      (!previous && (entry.seconds !== 0 || entry.kind === "return")) ||
      (previous &&
        (entry.seconds < previous.seconds ||
          entry.kind === previous.kind ||
          (entry.kind === "return" && previous.kind !== "dynamic") ||
          (entry.kind === "authored" && previous.kind !== "return")))
    )
      throw new Error("Malformed physical playback ownership transition");
    owners.set(key, entry);
  }
  if (owners.size !== segments.size)
    throw new Error("Missing physical playback initial ownership");
  if (
    header.supportWrenches.length >
    header.duration * header.rate * bodies.size
  )
    throw new Error("Malformed physical playback support-wrench budget");
  const wrenchTimes: Map<string, number> = new Map();
  for (const entry of header.supportWrenches) {
    if (
      !bodies.has(entry.body) ||
      !time(entry.seconds) ||
      entry.seconds <= (wrenchTimes.get(entry.body) ?? -1) ||
      Math.abs(
        entry.seconds * header.rate - Math.round(entry.seconds * header.rate),
      ) > 1e-7 ||
      entry.pointCount < 0 ||
      entry.pointCount > 1024
    )
      throw new Error("Malformed physical playback support-wrench prediction");
    for (const kind of ["force", "torque"] as const)
      for (const axis of ["x", "y", "z"] as const)
        if (
          Math.abs(
            entry.requested[kind][axis] -
              entry.allocated[kind][axis] -
              entry.residual[kind][axis],
          ) >
          64 *
            Number.EPSILON *
            Math.max(
              1,
              Math.abs(entry.requested[kind][axis]),
              Math.abs(entry.allocated[kind][axis]),
            )
        )
          throw new Error("Inconsistent physical playback allocation residual");
    wrenchTimes.set(entry.body, entry.seconds);
  }
  for (const receipt of header.contacts) {
    if (
      !receipt.id.trim() ||
      ids.has(receipt.id) ||
      !identity(receipt.a) ||
      !identity(receipt.b) ||
      !time(receipt.seconds) ||
      !time(receipt.endSeconds) ||
      receipt.endSeconds < receipt.seconds ||
      !normal(receipt.normal) ||
      receipt.separation > 0 ||
      receipt.compression < 0 ||
      (receipt.source === "geometric"
        ? receipt.impulse !== null
        : receipt.impulse === null || receipt.impulse < 0)
    )
      throw new Error("Malformed physical playback contact episode");
    ids.add(receipt.id);
    if (receipt.source === "geometric" && (receipt.samples?.length ?? 0) > 0)
      throw new Error("Geometric contact cannot assert solved samples");
    let previous: number = receipt.seconds;
    for (const sample of receipt.samples ?? []) {
      if (
        !time(sample.seconds) ||
        sample.seconds < previous ||
        sample.seconds > receipt.endSeconds ||
        sample.duration <= 0 ||
        sample.impulse < 0 ||
        (sample.appliedImpulse !== undefined &&
          (sample.appliedImpulse.a < 0 || sample.appliedImpulse.b < 0)) ||
        !normal(sample.normal) ||
        sample.separation > 0 ||
        sample.compression < 0
      )
        throw new Error("Malformed physical playback contact sample");
      previous = sample.seconds;
    }
  }
  for (const [body, state] of Object.entries(header.recovery)) {
    const bone: (name: string) => boolean = (name: string): boolean =>
      segments.has(JSON.stringify([body, name]));
    if (
      !bodies.has(body) ||
      Object.keys(state.offsets).some((name: string): boolean => !bone(name)) ||
      [state.lostSince, state.outsideSince].some(
        (value: number | undefined): boolean =>
          value !== undefined && !time(value),
      ) ||
      (state.revision !== undefined && state.revision < 0) ||
      // A four-support body's swings are its gait's, one per bone, never
      // beside a two-support body's swing.
      (state.swings !== undefined &&
        (state.swing !== undefined ||
          Object.entries(state.swings).some(
            ([name, step]: [string, IAutoMovieStepPlanner.IStep]): boolean =>
              step.bone !== name,
          ))) ||
      (state.seating !== undefined &&
        Object.values(state.seating).some(
          (seat: NonNullable<typeof state.seating>[string]): boolean =>
            [seat.bearing, seat.flat, seat.entry].some(
              (share: number | undefined): boolean =>
                share !== undefined && (share < 0 || share > 1),
            ),
        ))
    )
      throw new Error("Malformed physical playback recovery state");
    for (let index: number = 1; index < state.steps.length; index++)
      if (state.steps[index]!.start < state.steps[index - 1]!.start)
        throw new Error("Nonchronological physical playback recovery steps");
    for (const step of [
      ...state.steps,
      ...(state.swing ? [state.swing] : []),
      ...Object.values(state.swings ?? {}),
    ]) {
      if (!bone(step.bone) || !time(step.start) || step.end <= step.start)
        throw new Error("Malformed physical playback recovery swing");
      // A final-frame recovery may still be airborne; its planned end can
      // legitimately lie beyond the completed film, unlike measured events.
      for (const placement of [step.from, step.to])
        if (placement.clearance < 0)
          throw new Error("Malformed physical playback support placement");
    }
    let previous: number = -1;
    for (const landing of state.landings ?? []) {
      if (
        !bone(landing.bone) ||
        !time(landing.seconds) ||
        landing.seconds < previous
      )
        throw new Error("Malformed physical playback measured landing");
      previous = landing.seconds;
    }
    for (const step of state.steps)
      if (
        step.resolved !== undefined &&
        (!time(step.resolved.seconds) ||
          step.resolved.seconds < step.start ||
          (step.resolved.status !== "cancelled" &&
            step.resolved.seconds < step.end))
      )
        throw new Error("Malformed physical playback recovery resolution");
    if (
      state.handoffs?.some(
        (handoff: NonNullable<typeof state.handoffs>[number]): boolean =>
          !bone(handoff.bone) || !time(handoff.seconds),
      )
    )
      throw new Error("Malformed physical playback recovery handoff");
    for (let index: number = 1; index < (state.handoffs?.length ?? 0); index++)
      if (state.handoffs![index]!.seconds < state.handoffs![index - 1]!.seconds)
        throw new Error("Nonchronological physical playback recovery handoffs");
  }
}
