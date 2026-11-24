import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalOwnershipEvent,
  IAutoMoviePhysicalPlayback,
  IAutoMoviePhysicalSupportWrench,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";

/**
 * Refuse malformed causal metadata even when an archive has a valid integrity
 * trailer.
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
  const point: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(Number.isFinite);
  const time: (value: number) => boolean = (value: number): boolean =>
    Number.isFinite(value) && value >= 0 && value <= header.duration;
  const normal: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean =>
    point(value) && Math.abs(Math.hypot(value.x, value.y, value.z) - 1) <= 1e-5;
  const identity: (side: IAutoMovieContactReceipt["a"]) => boolean = (side: {
    body: string;
    bone: string;
    shape: string;
    material: string;
  }): boolean =>
    !!side &&
    typeof side.shape === "string" &&
    !!side.shape.trim() &&
    typeof side.material === "string" &&
    !!side.material.trim() &&
    ((side.body === "floor" && side.bone === "floor") ||
      segments.has(JSON.stringify([side.body, side.bone])));
  if (
    !Array.isArray(header.ownership) ||
    header.ownership.length >
      (3 * header.duration * header.rate + 1) * header.segments.length
  )
    throw new Error("Malformed physical playback ownership budget");
  const owners: Map<string, IAutoMoviePhysicalOwnershipEvent> = new Map();
  for (const entry of header.ownership) {
    const key: string = JSON.stringify([entry?.body, entry?.bone]);
    const previous: IAutoMoviePhysicalOwnershipEvent | undefined =
      owners.get(key);
    if (
      !entry ||
      !segments.has(key) ||
      !time(entry.seconds) ||
      !["dynamic", "return", "authored"].includes(entry.kind) ||
      (entry.stabilization !== undefined &&
        (entry.kind !== "return" ||
          !Number.isFinite(entry.stabilization) ||
          entry.stabilization < 0)) ||
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
    !Array.isArray(header.supportWrenches) ||
    header.supportWrenches.length > header.duration * header.rate * bodies.size
  )
    throw new Error("Malformed physical playback support-wrench budget");
  const wrenchTimes: Map<string, number> = new Map();
  for (const entry of header.supportWrenches) {
    if (
      !entry ||
      !bodies.has(entry.body) ||
      !time(entry.seconds) ||
      !point(entry.origin) ||
      entry.seconds <= (wrenchTimes.get(entry.body) ?? -1) ||
      Math.abs(
        entry.seconds * header.rate - Math.round(entry.seconds * header.rate),
      ) > 1e-7 ||
      !Number.isSafeInteger(entry.pointCount) ||
      entry.pointCount < 0 ||
      entry.pointCount > 1024 ||
      ![entry.requested, entry.allocated, entry.residual].every(
        (wrench: IAutoMoviePhysicalSupportWrench["requested"]): boolean =>
          !!wrench && point(wrench.force) && point(wrench.torque),
      )
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
      !receipt ||
      typeof receipt.id !== "string" ||
      !receipt.id.trim() ||
      ids.has(receipt.id) ||
      !["solver", "geometric"].includes(receipt.source) ||
      !identity(receipt.a) ||
      !identity(receipt.b) ||
      !time(receipt.seconds) ||
      !time(receipt.endSeconds) ||
      receipt.endSeconds < receipt.seconds ||
      !point(receipt.point) ||
      !normal(receipt.normal) ||
      !Number.isFinite(receipt.separation) ||
      receipt.separation > 0 ||
      !Number.isFinite(receipt.compression) ||
      receipt.compression < 0 ||
      (receipt.source === "geometric"
        ? receipt.impulse !== null
        : !Number.isFinite(receipt.impulse) || receipt.impulse! < 0)
    )
      throw new Error("Malformed physical playback contact episode");
    ids.add(receipt.id);
    if (receipt.source === "geometric" && (receipt.samples?.length ?? 0) > 0)
      throw new Error("Geometric contact cannot assert solved samples");
    if (receipt.samples !== undefined) {
      if (!Array.isArray(receipt.samples))
        throw new Error("Malformed physical playback contact samples");
      let previous: number = receipt.seconds;
      for (const sample of receipt.samples) {
        if (
          !sample ||
          !time(sample.seconds) ||
          sample.seconds < previous ||
          sample.seconds > receipt.endSeconds ||
          !(sample.duration > 0) ||
          !Number.isFinite(sample.duration) ||
          !Number.isFinite(sample.impulse) ||
          sample.impulse < 0 ||
          (sample.appliedImpulse !== undefined &&
            (!isAutoMovieRecord(sample.appliedImpulse) ||
              ![sample.appliedImpulse.a, sample.appliedImpulse.b].every(
                (impulse: number): boolean =>
                  Number.isFinite(impulse) && impulse >= 0,
              ))) ||
          !point(sample.point) ||
          !normal(sample.normal) ||
          !Number.isFinite(sample.separation) ||
          sample.separation > 0 ||
          !Number.isFinite(sample.compression) ||
          sample.compression < 0
        )
          throw new Error("Malformed physical playback contact sample");
        previous = sample.seconds;
      }
    }
  }
  if (Array.isArray(header.recovery))
    throw new Error("Malformed physical playback recovery map");
  for (const [body, state] of Object.entries(header.recovery)) {
    const bone: (name: string) => boolean = (name: string): boolean =>
      segments.has(JSON.stringify([body, name]));
    if (
      !bodies.has(body) ||
      !state ||
      !["supported", "recovery", "unrecoverable"].includes(state.last) ||
      !Array.isArray(state.steps) ||
      !state.offsets ||
      typeof state.offsets !== "object" ||
      Array.isArray(state.offsets) ||
      Object.entries(state.offsets).some(
        ([name, offset]: [string, IAutoMovieVector3]): boolean =>
          !bone(name) || !point(offset),
      ) ||
      (state.rootOffset !== undefined && !point(state.rootOffset)) ||
      [state.lostSince, state.outsideSince].some(
        (value: number | undefined): boolean =>
          value !== undefined && !time(value),
      ) ||
      (state.revision !== undefined &&
        (!Number.isSafeInteger(state.revision) || state.revision < 0)) ||
      (state.failedLanding !== undefined &&
        typeof state.failedLanding !== "boolean") ||
      // A four-support body's swings are its gait's, one per bone, never
      // beside a two-support body's swing.
      (state.swings !== undefined &&
        (typeof state.swings !== "object" ||
          Array.isArray(state.swings) ||
          state.swing !== undefined ||
          Object.entries(state.swings).some(
            ([name, step]: [string, IAutoMovieStepPlanner.IStep]): boolean =>
              step?.bone !== name,
          ))) ||
      (state.seating !== undefined &&
        (typeof state.seating !== "object" ||
          Array.isArray(state.seating) ||
          Object.values(state.seating).some(
            (seat: {
              seated: boolean;
              since: number;
              bearing?: number;
              flat?: number;
              load?: number;
              entry?: number;
              relief?: number;
              anchor?: {
                point: { x: number; y: number; z: number };
                rotation: { x: number; y: number; z: number; w: number };
              };
            }): boolean =>
              typeof seat?.seated !== "boolean" ||
              !Number.isFinite(seat.since) ||
              (seat.load !== undefined && !Number.isFinite(seat.load)) ||
              (seat.relief !== undefined && !Number.isFinite(seat.relief)) ||
              (seat.anchor !== undefined &&
                ![
                  seat.anchor.point?.x,
                  seat.anchor.point?.y,
                  seat.anchor.point?.z,
                  seat.anchor.rotation?.x,
                  seat.anchor.rotation?.y,
                  seat.anchor.rotation?.z,
                  seat.anchor.rotation?.w,
                ].every(Number.isFinite)) ||
              [seat.bearing, seat.flat, seat.entry].some(
                (share: number | undefined): boolean =>
                  share !== undefined && !(share >= 0 && share <= 1),
              ),
          ))) ||
      (state.pressure !== undefined &&
        ![
          state.pressure.bias?.x,
          state.pressure.bias?.z,
          state.pressure.acceleration?.x,
          state.pressure.acceleration?.z,
          state.pressure.velocity?.x ?? 0,
          state.pressure.velocity?.z ?? 0,
          state.pressure.command?.x ?? 0,
          state.pressure.command?.z ?? 0,
        ].every(Number.isFinite))
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
      if (
        !step ||
        !bone(step.bone) ||
        !["swing", "reserved"].includes(step.kind) ||
        !time(step.start) ||
        !Number.isFinite(step.end) ||
        step.end <= step.start
      )
        throw new Error("Malformed physical playback recovery swing");
      // A final-frame recovery may still be airborne; its planned end can
      // legitimately lie beyond the completed film, unlike measured events.
      for (const placement of [step.from, step.to])
        if (
          !placement ||
          !Array.isArray(placement.point) ||
          placement.point.length !== 2 ||
          ![
            ...placement.point,
            placement.yaw,
            placement.pitch,
            placement.clearance,
          ].every(Number.isFinite) ||
          placement.clearance < 0
        )
          throw new Error("Malformed physical playback support placement");
    }
    if (state.landings !== undefined) {
      if (!Array.isArray(state.landings))
        throw new Error("Malformed physical playback recovery landings");
      let previous: number = -1;
      for (const landing of state.landings) {
        if (
          !landing ||
          !bone(landing.bone) ||
          !time(landing.seconds) ||
          landing.seconds < previous ||
          !point(landing.position) ||
          (landing.offset !== undefined && !point(landing.offset)) ||
          (landing.rootOffset !== undefined && !point(landing.rootOffset))
        )
          throw new Error("Malformed physical playback measured landing");
        previous = landing.seconds;
      }
    }
    for (const step of state.steps)
      if (
        step.resolved !== undefined &&
        (!time(step.resolved.seconds) ||
          step.resolved.seconds < step.start ||
          (step.resolved.status !== "cancelled" &&
            step.resolved.seconds < step.end) ||
          !["landed", "cancelled", "failed"].includes(step.resolved.status))
      )
        throw new Error("Malformed physical playback recovery resolution");
    if (
      state.handoffs !== undefined &&
      (!Array.isArray(state.handoffs) ||
        state.handoffs.some(
          (handoff: NonNullable<typeof state.handoffs>[number]): boolean =>
            !bone(handoff.bone) || !time(handoff.seconds),
        ))
    )
      throw new Error("Malformed physical playback recovery handoff");
    for (let index: number = 1; index < (state.handoffs?.length ?? 0); index++)
      if (state.handoffs![index]!.seconds < state.handoffs![index - 1]!.seconds)
        throw new Error("Nonchronological physical playback recovery handoffs");
  }
}
