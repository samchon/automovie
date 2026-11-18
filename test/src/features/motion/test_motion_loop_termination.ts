import {
  Quaternion,
  createAutoMovieRandom,
  deriveAutoMovieSeed,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanConversation,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanConversation,
  HumanFreedomChoice,
  HumanWater,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Motion loops that stopped only on a reached value end on every input:
 * a hand's list of turns, a conversation's glance clock and the float's
 * bisection.
 *
 * Scenarios:
 * 1. Turns every 45 degrees are, for the right hand, 0, 45, -45, 90, -90,
 *    135, -135 and the half turn 180, and the left hand's are their
 *    negation but for 0 and 180. A spacing of 0, -15, not-a-number or
 *    1e-300 degrees is refused: the first three never reached the half
 *    turn, and the last stopped growing once a step fell under half an ulp
 *    of the sum. An infinite spacing lists only 0, as before.
 * 2. A conversation turn starting at minus infinity or at -1 s is refused,
 *    since a film second is finite and not negative: minus infinity plus
 *    any glance stayed minus infinity. A turn from 0 to 30 s still starts
 *    on the partner's face at 0 s.
 * 3. A prone body in fresh water at a surface of 2^34 m, where adjacent
 *    heights lie 2^-18 m (3.8 micrometres) apart, wider than the float's
 *    micrometre: the float ends, at the height it takes at a surface of
 *    0 m raised by 2^34 m, within the micrometre and four spacings (one
 *    for the final bracket, one for each collider height's rounding and two
 *    of margin). Before, the bisection halved a bracket that could not
 *    narrow below one spacing forever.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public turn list, conversation gaze and float with ordinary and degenerate inputs; a loop that does not end never returns, and one that refuses or moves an ordinary input fails.
 * @evidence contracts/development/testing.md#independent-expectations The turns are multiples of the spacing by hand; the film-second domain is the interface's; the float's bound is the micrometre plus binary64's spacing at 2^34, 2^-18, and Archimedes' height does not depend on where the surface stands.
 * @evidence contracts/development/testing.md#distinguishing-cases Zero, negative, not-a-number, sub-resolution and infinite spacings; infinite and negative turn starts beside an ordinary turn; a surface at 0 m beside one whose heights are spaced wider than the tolerance.
 * @evidence contracts/development/testing.md#execution-ownership In-memory laws over one prepared polygon man, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the three loops and their scenarios.
 */
export function test_motion_loop_termination(): void {
  const findings: string[] = [];
  const refused = (label: string, run: () => unknown): void => {
    try {
      findings.push(`${label}: returned ${JSON.stringify(run())}`);
    } catch (error) {
      if (!(error instanceof Error))
        findings.push(`${label}: threw ${String(error)}`);
    }
  };

  // 1. The turns.
  const right: number[] = [0, 45, -45, 90, -90, 135, -135, 180];
  const left: number[] = [0, -45, 45, -90, 90, -135, 135, 180];
  if (
    JSON.stringify(HumanFreedomChoice.turns(45, "right")) !==
    JSON.stringify(right)
  )
    findings.push(
      `right turns: ${JSON.stringify(HumanFreedomChoice.turns(45, "right"))}`,
    );
  if (
    JSON.stringify(HumanFreedomChoice.turns(45, "left")) !==
    JSON.stringify(left)
  )
    findings.push(
      `left turns: ${JSON.stringify(HumanFreedomChoice.turns(45, "left"))}`,
    );
  for (const step of [0, -15, NaN, 1e-300])
    refused(`turns every ${step}`, () =>
      HumanFreedomChoice.turns(step, "right"),
    );
  if (JSON.stringify(HumanFreedomChoice.turns(Infinity, "right")) !== "[0]")
    findings.push("an infinite spacing lists more than the null turn");

  // 2. The glance clock.
  const gaze = (from: number): ReturnType<typeof HumanConversation.gaze> =>
    HumanConversation.gaze(
      "a",
      "b",
      [
        {
          speaker: "a",
          from,
          to: 30,
        } satisfies IAutoMovieMotionHumanConversation.ITurn,
      ],
      createAutoMovieRandom(deriveAutoMovieSeed("talk", "0")),
      1.6,
    );
  refused("turn from -Infinity", () => gaze(-Infinity));
  refused("turn from -1 s", () => gaze(-1));
  const first: ReturnType<typeof gaze>[number] | undefined = gaze(0)[0];
  if (first === undefined || first.from !== 0 || first.target.kind !== "person")
    findings.push(`turn from 0 s opens with ${JSON.stringify(first)}`);

  // 3. The float at a surface whose heights are spaced wider than its tolerance.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    90,
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(
      { skeleton: body.skeleton.id, root: null, joints: [] },
      body.skeleton,
    ).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
        r.bone,
        {
          ...r,
          worldPosition: Quaternion.rotateVector(turn, r.worldPosition),
          worldRotation: Quaternion.multiply(turn, r.worldRotation),
        },
      ],
    ),
  );
  const high: number = 2 ** 34;
  const spacing: number = 2 ** -18;
  const low: number | null = HumanWater.float(body, bones, { surface: 0 });
  const raised: number | null = HumanWater.float(body, bones, {
    surface: high,
  });
  if ((low === null) !== (raised === null))
    findings.push(`float at 0 m: ${low}, at 2^34 m: ${raised}`);
  else if (
    low !== null &&
    raised !== null &&
    !(Math.abs(raised - (high + low)) <= 1e-6 + 4 * spacing)
  )
    findings.push(
      `float at 2^34 m is ${raised - high} m above the surface's rise, at 0 m ${low} m`,
    );

  TestValidator.equals("each loop ends", findings, []);
}
