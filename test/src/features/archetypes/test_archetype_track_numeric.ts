import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeTrack,
} from "@automovie/archetypes";
import { AutoMovieGravity, validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Physical admission and pendulum phase conditioning keep supported motions
 * finite without fixed-time-step stiffness or erased angles.
 *
 * Scenarios:
 *
 * 1. Every custom physical field is admitted by its own axis, and a slider cannot
 *    be made a hinge by supplying pendulum figures.
 * 2. Intermediate product scale retains omega=sqrt(m_g_A/I), checked at the
 *    small-angle quarter event using independently factored square roots.
 * 3. MIN degree amplitude remains MIN at a short sample. Nonlinear point pendulums
 *    with finite omega/phase solve in tau=omega*t even when the seconds-clock
 *    RK4 was stiff or omega squared was unrepresentable.
 * 4. Scaling mass/arm/moment as (2^-600,2^600,2^600) scales time by 2^300 while
 *    preserving the same dimensionless nonlinear trajectory exactly. A
 *    MIN-mass, 2^974-moment swing crosses after MAX/2 seconds without an
 *    overflowing physical-time bracket; impossible phase grid count or final
 *    launch rate is still unsupported.
 * 5. A valid wide hinge still refuses separatrix/outside-well releases, while both
 *    near-boundary signs and an explicitly shifted stable rest remain valid. A
 *    final phase maps to the exact clock end; an interior phase whose offset
 *    rounds to duration is refused instead of becoming that endpoint.
 * 6. AGM admits positive finite inputs, lies between geometric/arithmetic bounds
 *    at extreme scale and rounds distinct subnormal means in both orders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States physical domains and phase/time similarity; profile-specific conditioning belongs to the dedicated profile numeric unit.
 * @evidence contracts/development/testing.md#behavioral-verification Uses real public Builder, swing and agm, reads actual launch fields, and observes high-frequency ROM and exact phase similarity without replacing implementation.
 * @evidence contracts/development/testing.md#independent-expectations The fixture cube has hinge moment1/6+1/4=5/12. Small-angle quarter time is pi/(2omega) and its degree rate is -5omega, with omega=(sqrt(m)/sqrt(I))*sqrt(g)*sqrt(A). Point-pendulum I=mA squared makes the high-frequency examples physically consistent. For mass=MIN, moment=2^974 and arm1 the independent frequency is sqrt(g)*2^-1024, so both the crossing phase and rate/omega must match the ordinary body even beyond MAX/2 seconds. Normalizing tau removes the physical frequency from theta''=-sin(theta), so power-of-two time scaling must preserve travel. The gravity potential has stable wells bounded by the inverted rest+-180 degrees, so a release200 around rest0 cannot use a symmetric reach200, while rest360/release400 is inside its own well. With omega3 and T.8, the last phase rounds upward and must map directly to duration. For omega25 and T=RN((pi/2)/25), the pi/2 significand gives RN(25T)=pi/2+1ULP although RN((pi/2)/25)=T: the interior root has no interior represented offset. Both physical bodies satisfy I>=m*arm squared. MIN amplitude times a cosine near1 rounds to MIN; AGM is strictly between the geometric and arithmetic means of unequal inputs. In MIN units, (1,2),(1,3),(1,4),(2,4) therefore lie respectively inside rounding cells of 1,2,2,3; both input orders must give those final values.
 * @evidence contracts/development/testing.md#distinguishing-cases Every custom physical axis, finite/nonfinite request, tiny degree amplitude, stiff and extreme nonlinear point bodies, phase similarity, very slow nonlinear crossing, stable-well and exact endpoint/interior resolution boundaries, grid/rate refusal and AGM scale. Existing swing unit owns normal SI period/energy comparisons.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit owns its authored mechanism and custom physical figures; no process, compiler, renderer, foreign host or runtime patch is used.
 */
export function test_archetype_track_numeric(): void {
  const findings: string[] = [];
  const hinge: AutoMovieArchetype<"joint", never> = mechanism("hinge");
  const physics: AutoMovieArchetypeTrack.IPendulum = {
    mass: 1,
    moment: 5 / 12,
    arm: 0.5,
    rest: 0,
  };
  for (const axis of ["mass", "moment", "arm"] as const) {
    for (const value of [0, -1, NaN, Infinity, -Infinity]) {
      if (
        !refuses(
          (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
            AutoMovieArchetypeTrack.swing(hinge, "joint", {
              start: 0,
              seconds: 1,
              release: 5,
              pendulum: { ...physics, [axis]: value },
            }),
          `pendulum.${axis}`,
        )
      )
        findings.push(`malformed pendulum${axis} was accepted`);
    }
  }
  for (const rest of [NaN, Infinity, -Infinity])
    if (
      !refuses(
        (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
          AutoMovieArchetypeTrack.swing(hinge, "joint", {
            start: 0,
            seconds: 1,
            release: 5,
            pendulum: { ...physics, rest },
          }),
        "pendulum.rest",
      )
    )
      findings.push("nonfinite neutral travel was accepted");
  if (
    !refuses(
      (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
        AutoMovieArchetypeTrack.swing(mechanism("slider"), "joint", {
          start: 0,
          seconds: 1,
          release: 0.1,
          pendulum: physics,
        }),
      "hinge",
    )
  )
    findings.push("custom figures made a slider a pendulum hinge");

  // Hinge travel is valid beyond 180; this solver separately admits one stable well.
  const wide: AutoMovieArchetype<"joint", never> = mechanism("hinge", 600);
  if (!validateModel({ model: wide }).success)
    findings.push("the wide hinge domain control is not an admitted model");
  for (const release of [-360, -200, -180, 180, 200, 360])
    if (
      !refuses(
        (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
          AutoMovieArchetypeTrack.swing(wide, "joint", {
            start: 0,
            seconds: 1,
            release,
            pendulum: physics,
          }),
        "release",
      )
    )
      findings.push("a release crossed the declared rest well's separatrix");
  for (const [rest, release] of [
    [0, -179],
    [0, 179],
    [360, 400],
  ] as const) {
    const control: AutoMovieArchetypeTrack.ITrack<"joint"> =
      AutoMovieArchetypeTrack.swing(wide, "joint", {
        start: 0,
        seconds: 1,
        release,
        pendulum: { ...physics, rest },
      });
    const reach: number = Math.abs(release - rest);
    for (const sample of [0, 0.5, 1]) {
      const travel: number = control.travel(sample);
      if (!(Math.abs(travel - rest) <= reach + 1e-6))
        findings.push("a supported stable rest well lost its actual reach");
    }
  }
  for (const figures of [
    { mass: Number.MAX_VALUE, moment: Number.MAX_VALUE, arm: 0.5, rest: 0 },
    { mass: Number.MIN_VALUE, moment: Number.MIN_VALUE, arm: 1, rest: 0 },
    {
      mass: Number.MIN_VALUE,
      moment: Number.MIN_VALUE,
      arm: Number.MIN_VALUE,
      rest: 0,
    },
  ]) {
    const omega: number =
      (Math.sqrt(figures.mass) / Math.sqrt(figures.moment)) *
      Math.sqrt(AutoMovieGravity.STANDARD) *
      Math.sqrt(figures.arm);
    const quarter: number = Math.PI / (2 * omega);
    const track: AutoMovieArchetypeTrack.ITrack<"joint"> =
      AutoMovieArchetypeTrack.swing(hinge, "joint", {
        start: 0,
        seconds: 2 * quarter,
        release: 5,
        launch: 0,
        pendulum: figures,
      });
    if (
      track.launch === null ||
      !nclose(track.launch.seconds / quarter, 1, 1e-12) ||
      !nclose(track.launch.rate / (-5 * omega), 1, 1e-12)
    )
      findings.push("frequency was lost to an intermediate product");
  }

  // omega=3 and T=.8 round phaseEnd upward; phaseEnd/omega would exceed T.
  const endpointFigures: AutoMovieArchetypeTrack.IPendulum = {
    mass: 9,
    arm: 1,
    moment: AutoMovieGravity.STANDARD,
    rest: 0,
  };
  const endpointReference: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: 0.8,
      release: 90,
      pendulum: endpointFigures,
    });
  const endpointTravel: number = endpointReference.travel(
    endpointReference.end,
  );
  const endpoint: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: 0.8,
      release: 90,
      launch: endpointTravel,
      pendulum: endpointFigures,
    });
  if (
    !(
      endpoint.launch !== null &&
      nclose(endpoint.launch.seconds, endpoint.end, 0) &&
      nclose(endpoint.travel(endpoint.launch.seconds), endpointTravel, 0)
    )
  )
    findings.push(
      "the final phase crossing lost its exact represented clock endpoint",
    );

  // pi/2 has significand N=7074237752028440. 16N/25 rounds up, so 25T>pi/2.
  const collapsedSeconds: number = Math.PI / 2 / 25;
  if (
    !refuses(
      (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
        AutoMovieArchetypeTrack.swing(hinge, "joint", {
          start: 0,
          seconds: collapsedSeconds,
          release: 5,
          launch: 0,
          pendulum: {
            mass: 625,
            arm: 2 ** -10,
            moment: AutoMovieGravity.STANDARD * 2 ** -10,
            rest: 0,
          },
        }),
      "launch",
    )
  )
    findings.push(
      "an interior phase became a held clock endpoint after division",
    );
  for (const launch of [NaN, Infinity, -Infinity])
    for (const release of [5, 90])
      if (
        !refuses(
          (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
            AutoMovieArchetypeTrack.swing(hinge, "joint", {
              start: 0,
              seconds: 1,
              release,
              launch,
              pendulum: physics,
            }),
          "launch",
        )
      )
        findings.push("a nonfinite request reached the solver");
  const tiny: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: 1,
      release: Number.MIN_VALUE,
      pendulum: physics,
    });
  if (!nclose(tiny.travel(0.01), Number.MIN_VALUE, 0))
    findings.push("radian conversion erased a representable degree amplitude");
  for (const [figures, seconds] of [
    [{ mass: 1, arm: 2 ** -20, moment: 2 ** -40, rest: 0 }, 1 / 60],
    [
      { mass: 2 ** 1020, arm: 2 ** -1047, moment: Number.MIN_VALUE, rest: 0 },
      2 ** -524,
    ],
  ] as const) {
    const track: AutoMovieArchetypeTrack.ITrack<"joint"> =
      AutoMovieArchetypeTrack.swing(hinge, "joint", {
        start: 0,
        seconds,
        release: 90,
        pendulum: figures,
      });
    for (const share of [0, 0.25, 0.5, 0.75, 1]) {
      const travel: number = track.travel(share * seconds);
      if (!(Math.abs(travel) <= 90 + 1e-6))
        findings.push(
          "a phase-conditioned point pendulum exceeded its physical reach",
        );
    }
  }
  const ordinary: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: 1,
      release: 90,
      launch: 0,
      pendulum: { mass: 1, moment: 1, arm: 1, rest: 0 },
    });
  const slow: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: 2 ** 300,
      release: 90,
      pendulum: { mass: 2 ** -600, moment: 2 ** 600, arm: 2 ** 600, rest: 0 },
    });
  if (!nclose(slow.travel(2 ** 299), ordinary.travel(0.5), 0))
    findings.push(
      "physical time scaling changed the dimensionless pendulum trajectory",
    );

  // The same phase crossing lies beyond MAX/2; adding its physical bracket would overflow.
  const extreme: AutoMovieArchetypeTrack.ITrack<"joint"> =
    AutoMovieArchetypeTrack.swing(hinge, "joint", {
      start: 0,
      seconds: Number.MAX_VALUE,
      release: 90,
      launch: 0,
      pendulum: { mass: Number.MIN_VALUE, moment: 2 ** 974, arm: 1, rest: 0 },
    });
  const extremeOmega: number =
    Math.sqrt(AutoMovieGravity.STANDARD) * 2 ** -1024;
  const ordinaryOmega: number = Math.sqrt(AutoMovieGravity.STANDARD);
  if (
    !(
      extreme.launch !== null &&
      ordinary.launch !== null &&
      extreme.launch.seconds > Number.MAX_VALUE / 2 &&
      extreme.launch.seconds < Number.MAX_VALUE &&
      nclose(
        (extreme.launch.seconds * extremeOmega) /
          (ordinary.launch.seconds * ordinaryOmega),
        1,
        1e-12,
      ) &&
      nclose(
        extreme.launch.rate /
          extremeOmega /
          (ordinary.launch.rate / ordinaryOmega),
        1,
        1e-12,
      ) &&
      nclose(extreme.travel(extreme.launch.seconds) / 90, 0, 1e-12)
    )
  )
    findings.push(
      "a representable slow nonlinear crossing was lost in physical-time bisection",
    );
  if (
    !refuses(
      (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
        AutoMovieArchetypeTrack.swing(hinge, "joint", {
          start: 0,
          seconds: Number.MAX_VALUE,
          release: 90,
          pendulum: {
            mass: Number.MIN_VALUE,
            moment: Number.MIN_VALUE,
            arm: Number.MIN_VALUE,
            rest: 0,
          },
        }),
      "seconds",
    )
  )
    findings.push("a nonrepresentable phase grid was accepted");
  if (
    !refuses(
      (): AutoMovieArchetypeTrack.ITrack<"joint"> =>
        AutoMovieArchetypeTrack.swing(hinge, "joint", {
          start: 0,
          seconds: 2 ** -1021,
          release: 5,
          launch: 0,
          pendulum: { mass: 2 ** 1021, moment: 1, arm: 2 ** 1021, rest: 0 },
        }),
      "launch",
    )
  )
    findings.push("an unrepresentable launch rate escaped");
  for (const value of [0, -1, NaN, Infinity, -Infinity])
    if (!refuses((): number => AutoMovieArchetypeTrack.agm(value, 1), "agm"))
      findings.push("an invalid AGM input was accepted");
  for (const [a, b] of [
    [Number.MIN_VALUE, Number.MAX_VALUE],
    [Number.MAX_VALUE / 4, Number.MAX_VALUE / 2],
  ] as const) {
    const result: number = AutoMovieArchetypeTrack.agm(a, b);
    if (!(result >= Math.sqrt(a) * Math.sqrt(b) && result <= a + (b - a) / 2))
      findings.push("AGM escaped its finite geometric/arithmetic bounds");
  }
  for (const [a, b, expected] of [
    [1, 2, 1],
    [1, 3, 2],
    [1, 4, 2],
    [2, 4, 3],
  ] as const)
    for (const [left, right] of [
      [a, b],
      [b, a],
    ] as const)
      if (
        !nclose(
          AutoMovieArchetypeTrack.agm(
            left * Number.MIN_VALUE,
            right * Number.MIN_VALUE,
          ),
          expected * Number.MIN_VALUE,
          0,
        )
      )
        findings.push(
          "a subnormal AGM was trapped between quantized arithmetic/geometric means",
        );
  TestValidator.equals(
    "mechanism tracks own physical numeric admission",
    findings,
    [],
  );

  /** One real authored joint and uniform box, with no replaced producer method. */
  function mechanism(
    kind: "hinge" | "slider",
    range: number = 179,
  ): AutoMovieArchetype<"joint", never> {
    return new AutoMovieArchetypeBuilder<"joint", never>({
      name: "numeric mechanism",
      material: "steel",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "mechanism",
        {},
        undefined,
      ),
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: -0.5, z: 0 })
      .affordance({
        id: "joint",
        kind,
        extent: null,
        parts: ["body"],
        travel: kind === "hinge" ? range : 1,
        reverse: kind === "hinge" ? range : 1,
        frame: AutoMovieArchetypeFrame.facing(
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 0, z: 1 },
        ),
      })
      .build(1);
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
