import {
  physicalStanceBalance,
  physicalStanceSeat,
  physicalStanceSupport,
  physicalStanceSwing,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Which feet carry the centre of pressure is geometry, a foot joins or leaves
 * that support continuously, and the room the support leaves the centre of
 * pressure is exact on its edges:
 *
 * Scenarios:
 *
 * 1. Four grounded feet, two of them measuring no load, all keep their full
 *    bearing share, so the support is the four-foot polygon: a load the command
 *    itself took away does not shrink where it can return.
 * 2. A foot lifted off the floor bears nothing at once, whatever load it measured;
 *    one grounded again ramps in over `FADE`, half of it at half the window.
 * 3. A foot leaving the stance has its outline drawn from the remaining foot's
 *    outline by its share: the support's far edge on its side moves linearly
 *    with the share, from both feet's polygon to the remaining foot's alone
 *    (Feng et al. 2015, Section II-B4; Herzog et al. 2016, Section 5.3).
 * 4. A point on a support's front edge has no room forward and the support's whole
 *    depth backward; a point inside has its distance to each edge.
 * 5. Entry: a touching foot keeps its entry share however little it carries, and a
 *    loaded one keeps it through a lost contact; one out of contact and
 *    unloaded has left the holds, its share zero; touching again it is
 *    re-latched once and its share ramps back over `FADE`, half of it at half
 *    the window (design-4017-qp3, Section 3, rules 2 and 3).
 */
export function test_unit_engine_physics_physical_stance_seat(): void {
  const findings: string[] = [];
  const dt: number = 1 / 960;
  const weight: number = 700;
  const ramp: number = Math.round(physicalStanceBalance.FADE / dt);
  const margin: number = physicalStanceBalance.MARGIN;
  const seat = (bearing: number): physicalStanceSeat.ISeat => ({
    seated: true,
    since: 0,
    bearing,
    flat: 1,
    load: 0,
    relief: 0,
  });
  const advance = (
    foot: physicalStanceSeat.ISeat,
    load: number,
    grounded: boolean,
    steps: number,
    touching: boolean = grounded,
  ): boolean => {
    let entered: boolean = false;
    for (let i: number = 0; i < steps; i++)
      entered =
        physicalStanceSeat({
          seat: foot,
          spread: 0,
          load,
          grounded,
          touching,
          weight,
          seconds: (i + 1) * dt,
          dt,
        }) || entered;
    return entered;
  };

  // 1. Unloaded but grounded feet keep bearing.
  const loads: number[] = [weight / 2, weight / 2, 0, 0];
  const four: physicalStanceSeat.ISeat[] = loads.map(() => seat(1));
  four.forEach((foot, i: number): void => {
    advance(foot, loads[i]!, true, 48);
  });
  if (four.some((foot): boolean => foot.bearing !== 1))
    findings.push(
      `grounded feet bear ${four.map((foot) => foot.bearing).join(", ")}`,
    );
  const corners: IAutoMovieVector3[] = [
    { x: 0.3, y: 0, z: 0.4 },
    { x: -0.3, y: 0, z: 0.4 },
    { x: 0.3, y: 0, z: -0.4 },
    { x: -0.3, y: 0, z: -0.4 },
  ];
  const polygon: IAutoMovieVector3[] = physicalStanceSupport.support(
    corners.map((corner: IAutoMovieVector3, i: number) => ({
      limb: i,
      outline: square(corner.x, corner.z, 0.05),
      bearing: four[i]!.bearing!,
      flat: four[i]!.flat!,
      ankle: corner,
    })),
  ).polygon;
  const span = (axis: "x" | "z"): number =>
    Math.max(...polygon.map((p) => p[axis])) -
    Math.min(...polygon.map((p) => p[axis]));
  if (
    !(Math.abs(span("x") - (0.7 - 2 * margin)) < 1e-9) ||
    !(Math.abs(span("z") - (0.9 - 2 * margin)) < 1e-9)
  )
    findings.push(`the four-foot support spans ${span("x")} by ${span("z")}`);

  // 2. A lifted foot bears nothing at once; a grounded one ramps in.
  const lifted: physicalStanceSeat.ISeat = seat(1);
  advance(lifted, weight, false, 1);
  if (lifted.bearing !== 0)
    findings.push(`a lifted foot bears ${lifted.bearing}`);
  advance(lifted, 0, true, ramp / 2);
  if (!(Math.abs(lifted.bearing! - 0.5) < 1e-9))
    findings.push(`half a ramp in, a foot bears ${lifted.bearing}`);
  advance(lifted, 0, true, ramp / 2);
  if (!(Math.abs(lifted.bearing! - 1) < 1e-9))
    findings.push(`a full ramp in, a foot bears ${lifted.bearing}`);

  // 3. A leaving foot's outline is drawn in by its share.
  for (const share of [1, 0.5, 0.25, 0]) {
    const support: IAutoMovieVector3[] = physicalStanceSupport.support([
      {
        limb: "staying",
        outline: square(0.1, 0, 0.05),
        bearing: 1,
        flat: 1,
        ankle: { x: 0.1, y: 0, z: 0 },
      },
      ...(share > 0
        ? [
            {
              limb: "leaving",
              outline: square(-0.1, 0, 0.05),
              bearing: share,
              flat: 1,
              ankle: { x: -0.1, y: 0, z: 0 },
            },
          ]
        : []),
    ]).polygon;
    const edge: number = Math.min(...support.map((p) => p.x));
    const expected: number = 0.05 - 0.2 * share + margin;
    if (!(Math.abs(edge - expected) < 1e-9))
      findings.push(
        `at share ${share} the far edge is ${edge}, not ${expected}`,
      );
  }

  // 4. The room from an edge point and from inside.
  const box: IAutoMovieVector3[] = square(0, 0, 0.1);
  const room = (from: IAutoMovieVector3, z: number): number =>
    physicalStanceSwing.reach(box, from, { x: 0, y: 0, z });
  for (const x of [-0.05, 0, 0.0731]) {
    const edge: IAutoMovieVector3 = { x, y: 0, z: 0.1 };
    if (room(edge, 1) !== 0 || !(Math.abs(room(edge, -1) - 0.2) < 1e-12))
      findings.push(
        `from the front edge at x ${x} the room is ${room(edge, 1)} forward and ${room(edge, -1)} back`,
      );
  }
  const inside: IAutoMovieVector3 = { x: 0.02, y: 0, z: 0.03 };
  if (
    !(Math.abs(room(inside, 1) - 0.07) < 1e-12) ||
    !(Math.abs(room(inside, -1) - 0.13) < 1e-12) ||
    room({ x: 0, y: 0, z: 0.2 }, -1) !== 0
  )
    findings.push(
      `from inside the room is ${room(inside, 1)} and ${room(inside, -1)}`,
    );

  // 5. Entry: a foot that left the holds ramps its share back in.
  const rear: physicalStanceSeat.ISeat = seat(1);
  if (advance(rear, 0, true, 48, true) || rear.entry !== 1)
    findings.push(`a touching unloaded foot has entry ${rear.entry}`);
  advance(rear, weight, true, 1, false);
  if (rear.entry !== 1)
    findings.push(
      `a loaded foot's lost contact reset its entry to ${rear.entry}`,
    );
  advance(rear, 0, true, 24, false);
  if (rear.entry !== 0)
    findings.push(`a foot out of contact and unloaded has entry ${rear.entry}`);
  const touched: boolean = advance(rear, 0, true, 1, true);
  if (!touched) findings.push("a foot touching again is not re-latched");
  if (advance(rear, 0, true, ramp / 2 - 1, true))
    findings.push("a foot already back is re-latched again");
  if (!(Math.abs(rear.entry! - 0.5) < 1e-9))
    findings.push(`half a ramp after touching again, entry is ${rear.entry}`);

  TestValidator.equals("stance seating and support", findings, []);
}

/** An axis-aligned square foot outline on the floor about a centre. */
function square(x: number, z: number, half: number): IAutoMovieVector3[] {
  return [
    { x: x - half, y: 0, z: z - half },
    { x: x + half, y: 0, z: z - half },
    { x: x + half, y: 0, z: z + half },
    { x: x - half, y: 0, z: z + half },
  ];
}
