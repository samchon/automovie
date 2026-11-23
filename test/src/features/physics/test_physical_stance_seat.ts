import { physicalStanceBalance, physicalStanceSeat } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A stance foot joins and leaves the support continuously, and the room the
 * support leaves the centre of pressure is exact on its edges:
 *
 * Scenarios:
 *
 * 1. A foot that lands with no share ramps in over `FADE` once its measured load
 *    passes `TOUCH` of the weight, half of it at half the window; one whose
 *    load falls under `RELEASE` bears nothing at once.
 * 2. A foot leaving the stance has its outline drawn from the remaining foot's
 *    outline by its share: the support's far edge on its side moves linearly
 *    with the share, from both feet's polygon to the remaining foot's alone
 *    (Feng et al. 2015, Section II-B4; Herzog et al. 2016, Section 5.3).
 * 3. A point on a support's front edge has no room forward and the support's whole
 *    depth backward; a point inside has its distance to each edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the ramp, the drawn outline and the room with their closed forms.
 * @evidence contracts/development/testing.md#behavioral-verification Advances `physicalStanceSeat` substep by substep and reads the shares, reads `physicalStanceBalance.support`'s polygon and `physicalStanceBalance.reach`.
 * @evidence contracts/development/testing.md#independent-expectations Shares from the ramp's slope dt / FADE; edges and room from the squares' coordinates, the margin and the share by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A share that jumps fails scenario 1's half share; a foot dropped from the support at once fails scenario 2's partial shares; a ray crossing decided by round-off fails scenario 3's edge point either way.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_stance_seat(): void {
  const findings: string[] = [];
  const dt: number = 1 / 960;
  const weight: number = 700;
  const ramp: number = Math.round(physicalStanceBalance.FADE / dt);
  const advance = (
    foot: physicalStanceSeat.ISeat,
    load: number,
    steps: number,
  ): void => {
    for (let i: number = 0; i < steps; i++)
      physicalStanceSeat({
        seat: foot,
        spread: 0,
        load,
        weight,
        grounded: true,
        seconds: (i + 1) * dt,
        dt,
      });
  };

  // 1. A landed foot ramps in; an unloaded one gives its share up at once.
  const landed: physicalStanceSeat.ISeat = {
    seated: true,
    since: 0,
    bearing: 0,
    flat: 1,
    load: weight / 2,
    touching: true,
    relief: 0,
  };
  advance(landed, weight / 2, ramp / 2);
  if (!(Math.abs(landed.bearing! - 0.5) < 1e-9))
    findings.push(`half a ramp in, a foot bears ${landed.bearing}`);
  advance(landed, weight / 2, ramp / 2);
  if (!(Math.abs(landed.bearing! - 1) < 1e-9))
    findings.push(`a full ramp in, a foot bears ${landed.bearing}`);
  // Its load low-passed over a frame falls under RELEASE within the window:
  // 350 N times (7/8)^n against 17.5 N, n = 23.
  advance(landed, 0, 22);
  if (landed.bearing !== 1)
    findings.push(`a foot still loaded bears ${landed.bearing}`);
  advance(landed, 0, 1);
  if (landed.bearing !== 0 || landed.touching !== false)
    findings.push(`an unloaded foot bears ${landed.bearing}`);

  // 2. A leaving foot's outline is drawn in by its share.
  const margin: number = physicalStanceBalance.MARGIN;
  for (const share of [1, 0.5, 0.25, 0]) {
    const support: IAutoMovieVector3[] = physicalStanceBalance.support([
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

  // 3. The room from an edge point and from inside.
  const box: IAutoMovieVector3[] = square(0, 0, 0.1);
  const room = (from: IAutoMovieVector3, z: number): number =>
    physicalStanceBalance.reach(box, from, { x: 0, y: 0, z });
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
