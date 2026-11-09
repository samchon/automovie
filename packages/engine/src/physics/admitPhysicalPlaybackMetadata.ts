import type {
  IAutoMovieVector3,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import type { AutoMoviePhysicalPlayback as Playback } from "./AutoMoviePhysicalPlayback";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/**
 * Refuse malformed causal metadata even when an archive has a valid integrity trailer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse malformed causal metadata even when an archive has a valid integrity trailer) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse malformed causal metadata even when an archive has a valid integrity trailer) directly over its typed inputs (`header`) as nested iteration of depth 4 (map over header.segments; map over header.segments; every over [value.x, value.y, value.z]), delegating to `JSON.stringify`, `Number.isFinite`, `point`, `Math.abs`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (20 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.00001, 3, 1e-7, 1024, 64, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 267 lines and 17 top-level statements that reuses `JSON.stringify`, `Number.isFinite`, `point`, `Math.abs`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 7 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `header`; the dominant cost is nested iteration of depth 4 (map over header.segments; map over header.segments; every over [value.x, value.y, value.z]), performed once per call with 45 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 45 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitPhysicalPlaybackMetadata(header: Playback.IHeader): void {
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
  const identity: (side: Receipt["a"]) => boolean = (side: {
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
  const owners: Map<string, Cache.IOwnership> = new Map();
  for (const entry of header.ownership) {
    const key: string = JSON.stringify([entry?.body, entry?.bone]);
    const previous: Cache.IOwnership | undefined = owners.get(key);
    if (
      !entry ||
      !segments.has(key) ||
      !time(entry.seconds) ||
      !["dynamic", "return", "authored"].includes(entry.kind) ||
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
        (wrench: Cache.ISupportWrench["requested"]): boolean =>
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
        typeof state.failedLanding !== "boolean")
    )
      throw new Error("Malformed physical playback recovery state");
    for (let index: number = 1; index < state.steps.length; index++)
      if (state.steps[index]!.start < state.steps[index - 1]!.start)
        throw new Error("Nonchronological physical playback recovery steps");
    for (const step of [
      ...state.steps,
      ...(state.swing ? [state.swing] : []),
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
