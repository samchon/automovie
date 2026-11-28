import { AutoMovieHumanTipDome as Dome } from "@automovie/human";

import { nclose } from "../../internal/predicates";

/**
 * The tip dome's start is the station where the stretch left before the pole is a stated share of the section's reach there.
 *
 * For a reach that is linear in the station, `reach(s) = r0 + m (s - s0)`, the equation `pole - from = share reach(from)` has the closed
 * form `from = (pole - share (r0 - m s0)) / (1 + share m)`.
 *
 * Scenarios:
 * 1. A tube of constant reach 6 mm with its pole at 90 and share 1 starts its dome at 84, a hemisphere; share 1.5 starts it at 81.
 * 2. A reach tapering from 7 mm at 60 by 0.05 a millimetre, pole at 90, shares 0.8, 1 and 1.5: the closed form within 1e-9, and at each
 *    result the stretch left over the reach there is the share within 1e-9.
 * 3. A thicker part (twice the reach) starts its dome twice as far before the pole on the tube: the proportion is the share's, not a
 *    length's.
 * 4. A part too short for its dome (earliest start 86 on the 6 mm tube at share 1) is held at 86 and says so; one long enough says not.
 * 5. A nonpositive share, a pole at the earliest start and a reach that is not positive are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production solve on made reach functions and checks the solved station in the defining equation.
 * @evidence contracts/development/testing.md#independent-expectations The linear case's closed form is derived in the comment above and written out in the test; the defining equation is checked on the result itself.
 * @evidence contracts/development/common.md#meaningful-documentation Constant and tapered reaches give closed-form start stations. A short domain clamps the dome start, and invalid share, pole or reach checks refuse.
 */
export function test_human_tip_dome(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const refused = (what: string, bad: () => unknown): void => {
    let thrown: boolean = false;
    try {
      bad();
    } catch {
      thrown = true;
    }
    if (!thrown) failures.push(what + " was accepted");
  };

  // 1. A tube.
  const tube = (): number => 6;
  close("the hemisphere's start", Dome.start(tube, 90, 1, 40).from, 84, 1e-9);
  close("a dome one and a half reaches long", Dome.start(tube, 90, 1.5, 40).from, 81, 1e-9);

  // 2. A taper, against the closed form and the defining equation.
  const [r0, m, s0, pole]: [number, number, number, number] = [7, -0.05, 60, 90];
  const taper = (s: number): number => r0 + m * (s - s0);
  for (const share of [0.8, 1, 1.5]) {
    const found: Dome.IStart = Dome.start(taper, pole, share, 40);
    close("the tapering part's start at share " + share, found.from, (pole - share * (r0 - m * s0)) / (1 + share * m), 1e-9);
    close("the stretch left over the reach at share " + share, (pole - found.from) / taper(found.from), share, 1e-9);
    if (found.held) failures.push("a part long enough was reported held at share " + share);
  }

  // 3. Twice as thick, twice as long a dome.
  close("the thicker tube's start", pole - Dome.start((): number => 12, pole, 1, 40).from, 2 * (pole - Dome.start(tube, pole, 1, 40).from), 1e-9);

  // 4. Too short for its dome.
  const short: Dome.IStart = Dome.start(tube, 90, 1, 86);
  if (short.from !== 86 || !short.held) failures.push("a part too short for its dome was not held at its earliest start: " + JSON.stringify(short));

  // 5. Refusals.
  refused("a nonpositive share", (): unknown => Dome.start(tube, 90, 0, 40));
  refused("a pole at the earliest start", (): unknown => Dome.start(tube, 90, 1, 90));
  refused("a reach that is not positive", (): unknown => Dome.start((): number => -1, 90, 1, 40));
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
