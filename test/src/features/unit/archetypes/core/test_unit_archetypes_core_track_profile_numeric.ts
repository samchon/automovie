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
 * The native minimum-jerk law survives conditioned phase, affine and inverse
 * evaluation without invented bounds, endpoint clamps or erased tiny motion.
 *
 * Scenarios:
 * 1. Q(1/4)=53/512 and Q(3/4)=459/512; actual endpoint events have their exact
 *    time and zero rate. Delta=2*MIN over T=2^-1000 has midpoint rate3.75*2^-74.
 * 2. Near the end, 0->MAX at u=1-2^-52 and a nonzero large origin at
 *    u=1-2^-25 still round to MAX, never infinity from polynomial/affine scale.
 * 3. At u=2^-400, MAX*Q(u) is approximately10*2^-176, not zero from the cube.
 *    start=-1/end0/sample=-2^-54 analogously gives approximately10*2^862.
 * 4. The same late value remains finite for an opposite-sign clock whose
 *    general TwoSum end-start intermediate overflows. The exact FastTwoSum
 *    residual is -2^970, so a sample one ULP below end leaves2^970 seconds.
 * 5. The crossing of MIN on 0->1 and 0->MAX is near the independently worked
 *    cube-root(distance/span/10); tiny higher terms are below binary64 precision.
 *    Public travel at the returned instant reaches MIN and its rate follows
 *    3*MIN/root. The reverse motion ends at time0, preserving its tiny late event.
 * 6. A negative request outside0->MAX, truly overflowing span/rate, or an event
 *    with no representable interior film second is refused explicitly.
 */
export function test_unit_archetypes_core_track_profile_numeric(): void {
  const findings: string[] = [];
  const model: AutoMovieArchetype<"joint", never> =
    new AutoMovieArchetypeBuilder<"joint", never>({
      name: "profile fixture",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>("profile", {}, undefined),
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
      .affordance({
        id: "joint",
        kind: "crank",
        extent: null,
        radius: 1,
        parts: ["body"],
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      })
      .build(1);
  const max: number = Number.MAX_VALUE;
  const quarters: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(0, 512);
  if (
    !nclose(quarters.travel(0.25), 53, 0) ||
    !nclose(quarters.travel(0.75), 459, 0)
  )
    findings.push("the native quintic's exact quarter values changed");
  for (const requested of [0, 5]) {
    const track: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(
      0,
      5,
      -2,
      3,
      requested,
    );
    if (
      track.launch === null ||
      !nclose(track.launch.seconds, requested === 0 ? -2 : 1, 0) ||
      !nclose(track.launch.rate, 0, 0)
    )
      findings.push("an endpoint crossing lost its exact instant or zero rate");
  }
  const tinyRate: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(
    0,
    2 * Number.MIN_VALUE,
    0,
    2 ** -1000,
    Number.MIN_VALUE,
  );
  if (
    !(
      tinyRate.launch !== null &&
      nclose(tinyRate.launch.seconds, 2 ** -1001, 0) &&
      nclose(tinyRate.launch.rate / (3.75 * 2 ** -74), 1, 1e-12)
    )
  )
    findings.push("the derivative lost subnormal travel before time scaling");
  if (
    !nclose(ease(0, max).travel(1 - 2 ** -52), max, 0) ||
    !nclose(ease(2 ** 1021 + 3 * 2 ** 970, max).travel(1 - 2 ** -25), max, 0)
  )
    findings.push("native near-end interpolation overflowed");
  const early: number = ease(0, max).travel(2 ** -400);
  if (!(early > 0 && nclose(early / (10 * 2 ** -176), 1, 1e-12)))
    findings.push(
      "a representable early displacement disappeared when its cube underflowed",
    );
  const late: number = ease(max, 0, -1, 1).travel(-(2 ** -54));
  if (!(late > 0 && nclose(late / (10 * 2 ** 862), 1, 1e-12)))
    findings.push(
      "a representable late displacement disappeared in elapsed subtraction",
    );
  const opposite: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(
    max,
    0,
    -(2 ** 1021 + 3 * 2 ** 970),
    max,
  );
  const compensated: number = opposite.travel(opposite.end - 2 ** 971);
  if (!(compensated > 0 && nclose(compensated / (10 * 2 ** 862), 1, 1e-12)))
    findings.push("the opposite-sign clock lost its exact end residual");
  for (const span of [1, max]) {
    const expected: number =
      Math.cbrt(Number.MIN_VALUE) / Math.cbrt(span) / Math.cbrt(10);
    const track: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(
      0,
      span,
      0,
      1,
      Number.MIN_VALUE,
    );
    if (
      !(
        track.launch !== null &&
        nclose(track.launch.seconds / expected, 1, 1e-12) &&
        nclose(
          track.launch.rate / ((3 * Number.MIN_VALUE) / expected),
          1,
          1e-12,
        ) &&
        nclose(track.travel(track.launch.seconds), Number.MIN_VALUE, 0)
      )
    )
      findings.push(
        `the tiny crossing of MIN on span${span} lost its scale or derivative`,
      );
  }
  const reverse: AutoMovieArchetypeTrack.ITrack<"joint"> = ease(
    max,
    0,
    -1,
    1,
    Number.MIN_VALUE,
  );
  const expectedReverse: number =
    Math.cbrt(Number.MIN_VALUE) / Math.cbrt(max) / Math.cbrt(10);
  if (
    !(
      reverse.launch !== null &&
      reverse.launch.seconds < 0 &&
      nclose(reverse.launch.seconds / -expectedReverse, 1, 1e-12) &&
      nclose(reverse.travel(reverse.launch.seconds), Number.MIN_VALUE, 0)
    )
  )
    findings.push(
      "the tiny late crossing became the end or lost its displayed value",
    );
  for (const read of [
    (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
      ease(0, max, 0, 1, -Number.MIN_VALUE),
    (): AutoMovieArchetypeTrack.ITrack<"joint"> => ease(0, max, 0, 1, max / 2),
    (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
      ease(0, 1, 0, Number.MIN_VALUE, 0.5),
    (): AutoMovieArchetypeTrack.ITrack<"joint"> => ease(0, 1, 1e16, 2, 0.5),
  ])
    if (!refuses(read, "launch"))
      findings.push("an unsupported launch escaped its actual admission axis");
  if (
    !refuses(
      (): AutoMovieArchetypeTrack.ITrack<"joint"> => ease(-max, max),
      "travel",
    )
  )
    findings.push("a truly unrepresentable endpoint difference was accepted");
  TestValidator.equals(
    "minimum-jerk numeric conditioning preserves the motion",
    findings,
    [],
  );

  /** Use the actual public track without substituting a profile helper. */
  function ease(
    from: number,
    to: number,
    start: number = 0,
    seconds: number = 1,
    launch?: number,
  ): AutoMovieArchetypeTrack.ITrack<"joint"> {
    return AutoMovieArchetypeTrack.ease(model, "joint", {
      start,
      seconds,
      from,
      to,
      ...(launch === undefined ? {} : { launch }),
    });
  }

  /** The target axis must refuse rather than an unrelated runtime exception. */
  function refuses(read: () => unknown, axis: string): boolean {
    try {
      read();
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }
}
