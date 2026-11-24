import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeTrack,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Prepared mechanism clocks retain their finite interval and authored inputs.
 *
 * Scenarios:
 * 1. Swing and ease refuse invalid or collapsed intervals and nonfinite samples,
 *    while distant finite samples hold the exact negative-start endpoints.
 * 2. Mutation of the caller's duration, endpoint and pendulum records after
 *    construction cannot rewrite either prepared track.
 */
export function test_unit_archetypes_core_track_clock_numeric(): void {
  const findings: string[] = [];
  const hinge: AutoMovieArchetype<"joint", never> =
    new AutoMovieArchetypeBuilder<"joint", never>({
      name: "clock mechanism",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "clock mechanism",
        {},
        undefined,
      ),
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: -0.5, z: 0 })
      .affordance({
        id: "joint",
        kind: "hinge",
        extent: null,
        parts: ["body"],
        travel: 179,
        reverse: 179,
        frame: AutoMovieArchetypeFrame.facing(
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 0, z: 1 },
        ),
      })
      .build(1);
  const physics: AutoMovieArchetypeTrack.IPendulum = {
    mass: 1,
    moment: 5 / 12,
    arm: 0.5,
    rest: 0,
  };
  for (const kind of ["ease", "swing"] as const) {
    for (const start of [Number.MAX_VALUE,
      -Number.MAX_VALUE,
    ])
      if (
        !refuses(
          (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
            prepare(kind, start, 1),
          "start",
        )
      )
        findings.push(
          `${kind}: malformed/collapsed start${start} was accepted`,
        );
    for (const seconds of [0, -1])
      if (
        !refuses(
          (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
            prepare(kind, 0, seconds),
          "seconds",
        )
      )
        findings.push(`${kind}: malformed duration${seconds} was accepted`);
    for (const [start, seconds] of [
      [Number.MAX_VALUE / 2, Number.MAX_VALUE],
      [1, Number.MIN_VALUE],
    ] as const)
      if (
        !refuses(
          (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
            prepare(kind, start, seconds),
          "start",
        )
      )
        findings.push(`${kind}: an unrepresentable end was accepted`);
    const track: AutoMovieArchetypeTrack.ITrack<"joint"> = prepare(kind, -2, 1);
    if (
      !nclose(track.start, -2, 0) ||
      !nclose(track.end, -1, 0) ||
      !nclose(track.travel(-Number.MAX_VALUE), 5, 0) ||
      !nclose(track.travel(Number.MAX_VALUE), track.travel(track.end), 0)
    )
      findings.push(`${kind}: the finite clock or held endpoint changed`);
  }
  const easeProps: {
    start: number;
    seconds: number;
    from: number;
    to: number;
  } = {
    start: 0,
    seconds: 1,
    from: 5,
    to: 0,
  };
  const eased: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.ease(hinge, "joint", easeProps);
  easeProps.start = 100;
  easeProps.seconds = 4;
  easeProps.from = 2;
  easeProps.to = 1;
  if (
    !nclose(eased.start, 0, 0) ||
    !nclose(eased.end, 1, 0) ||
    !nclose(eased.travel(0.5), 2.5, 0)
  )
    findings.push("mutating ease props rewrote its prepared profile");
  const body: AutoMovieArchetypeTrack.IPendulum = { ...physics };
  const swingProps: {
    start: number;
    seconds: number;
    release: number;
    pendulum: AutoMovieArchetypeTrack.IPendulum;
  } = {
    start: 0,
    seconds: 1,
    release: 5,
    pendulum: body,
  };
  const swung: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", swingProps);
  const before: number = swung.travel(0.5);
  swingProps.start = 100;
  swingProps.seconds = 4;
  swingProps.release = 1;
  body.rest = 20;
  body.mass = 5;
  body.arm = 2;
  body.moment = 1;
  if (
    !nclose(swung.start, 0, 0) ||
    !nclose(swung.end, 1, 0) ||
    !nclose(swung.travel(0.5), before, 0)
  )
    findings.push("mutating swing/physical props rewrote a prepared plan");
  TestValidator.equals(
    "prepared tracks retain their admitted clock and input snapshots",
    findings,
    [],
  );
  /** Share the same declared small-angle mechanism across clock admission cases. */
  function prepare(
    kind: "ease" | "swing",
    start: number,
    seconds: number,
  ): AutoMovieArchetypeTrack.ITrack<"joint"> {
    return kind === "ease"
      ? AutoMovieArchetypeTrack.ease(hinge, "joint", {
          start,
          seconds,
          from: 5,
          to: 0,
        })
      : AutoMovieArchetypeTrack.swing(hinge, "joint", {
          start,
          seconds,
          release: 5,
          pendulum: physics,
        });
  }

  /** Observe the declared repair axis and reject unrelated failures. */
  function refuses(read: () => unknown, axis: string): boolean {
    try {
      read();
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }
}
