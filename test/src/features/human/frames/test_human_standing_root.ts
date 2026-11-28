import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanSegmentFrame as F,
  AutoMovieHumanStandingRoot,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * The standing root law keeps the supporting segment's origin at its reference height by moving the chain's root alone.
 *
 * The made chain is a pelvis at [10, 900, 0], a femur 90 mm to its side turned 0.1 rad about Z, a tibia 400 mm down the femur turned
 * 0.05 rad about X, and a foot 420 mm down the tibia. A segment's offset lies along its parent's `-Y`, so the foot hangs below the knee
 * along the direction `R_z(0.1) R_x(0.05) (0, -1, 0)`, whose height component is `-cos 0.1 cos 0.05`, and the knee below the hip along
 * `R_z(0.1) (0, -1, 0)`, whose height component is `-cos 0.1`.
 *
 * Scenarios:
 * 1. A shank 1.1 times as long: left alone, the foot's origin stands `42 cos 0.1 cos 0.05` mm lower than the reference's (the defect:
 *    the figure sinks); placed, it stands at the reference's height, the root has risen by that amount along the floor's normal and kept
 *    its other coordinates, and every record but the root's is the person's own object.
 * 2. A thigh 0.9 times as long lowers the root by `40 cos 0.1`.
 * 3. Both changes together add.
 * 4. A person whose support stands at the reference's height (the reference itself; a chain whose only change is a child of the foot)
 *    gets its own chain back.
 * 5. A floor normal along `X` moves the root along `X` by the support's change along `X`.
 * 6. A normal that is not unit, an absent support and a chain with two roots or none are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production law on made chains and reads the placed chain's own frames through the chain composer.
 * @evidence contracts/development/testing.md#independent-expectations Every expected rise is the closed-form height component of a rotated offset, written as cosines of the made angles, not read from the law; the chain composer that reads the result back is not the module under test.
 * @evidence contracts/development/common.md#meaningful-documentation The support height determines the signed root correction on the floor normal. Both length changes, an unaffected support and invalid frame or chain cases are exercised.
 */
export function test_human_standing_root(): void {
  const failures: string[] = [];
  const close = (what: string, got: number, expected: number, tolerance: number): void => {
    if (!nclose(got, expected, tolerance)) failures.push(`${what}: ${got} against ${expected}`);
  };
  const [a, b]: [number, number] = [0.1, 0.05];
  const up: AutoMovieVector3Tuple = [0, 1, 0];
  const made = (thigh: number, shank: number, toe: number = 60): IAutoMovieHumanSegmentJoint[] => [
    { name: "pelvis", parent: null, offset: [10, 900, 0], rotation: F.IDENTITY },
    { name: "femur", parent: "pelvis", offset: [0, 0, 90], rotation: F.about(2, a) },
    { name: "tibia", parent: "femur", offset: [0, -thigh, 0], rotation: F.about(0, b) },
    { name: "foot", parent: "tibia", offset: [0, -shank, 0], rotation: F.IDENTITY },
    { name: "toe", parent: "foot", offset: [toe, 0, 0], rotation: F.IDENTITY },
  ];
  const reference: IAutoMovieHumanSegmentJoint[] = made(400, 420);
  const origin = (chain: readonly IAutoMovieHumanSegmentJoint[], name: string): AutoMovieVector3Tuple => F.world(chain, (): undefined => undefined).get(name)!.origin;
  const floor: number = origin(reference, "foot")[1];
  const cases: [string, IAutoMovieHumanSegmentJoint[], number][] = [
    ["shank 1.1", made(400, 462), 42 * Math.cos(a) * Math.cos(b)],
    ["thigh 0.9", made(360, 420), -40 * Math.cos(a)],
    ["both", made(360, 462), 42 * Math.cos(a) * Math.cos(b) - 40 * Math.cos(a)],
  ];

  // 1 to 3. A changed leg: the defect left alone, the support's height restored, the root alone moved.
  for (const [what, person, rise] of cases) {
    close(what + ": the unplaced foot's fall", floor - origin(person, "foot")[1], rise, 1e-9);
    const placed: readonly IAutoMovieHumanSegmentJoint[] = AutoMovieHumanStandingRoot.place(reference, person, "foot", up);
    close(what + ": the placed foot's height", origin(placed, "foot")[1], floor, 1e-9);
    close(what + ": the root's rise", placed[0]!.offset[1] - 900, rise, 1e-9);
    if (placed[0]!.offset[0] !== 10 || placed[0]!.offset[2] !== 0) failures.push(what + ": the root moved off the floor's normal");
    if (placed.length !== person.length || placed.some((joint: IAutoMovieHumanSegmentJoint, k: number): boolean => k > 0 && joint !== person[k])) failures.push(what + ": a record other than the root's was replaced");
    if (person[0]!.offset[1] !== 900) failures.push(what + ": the person's own chain was edited");
  }

  // 4. Nothing to restore: the chain itself.
  if (AutoMovieHumanStandingRoot.place(reference, reference, "foot", up) !== reference) failures.push("the reference was not returned as given");
  const longerToe: IAutoMovieHumanSegmentJoint[] = made(400, 420, 70);
  if (AutoMovieHumanStandingRoot.place(reference, longerToe, "foot", up) !== longerToe) failures.push("a chain whose support stands at its height was not returned as given");

  // 5. Another normal: the support's change along X. The foot hangs along R_z(a) R_x(b) (0, -1, 0), whose X component is sin a cos b.
  const sideways: readonly IAutoMovieHumanSegmentJoint[] = AutoMovieHumanStandingRoot.place(reference, made(400, 462), "foot", [1, 0, 0]);
  close("the root's shift along X", sideways[0]!.offset[0] - 10, -42 * Math.sin(a) * Math.cos(b), 1e-9);
  close("the support's place along X", origin(sideways, "foot")[0], origin(reference, "foot")[0], 1e-9);

  // 6. Refusals.
  for (const [what, bad] of [
    ["a normal that is not unit", (): unknown => AutoMovieHumanStandingRoot.place(reference, made(400, 462), "foot", [0, 2, 0])],
    ["an absent support", (): unknown => AutoMovieHumanStandingRoot.place(reference, made(400, 462), "hoof", up)],
    ["two roots", (): unknown => AutoMovieHumanStandingRoot.place(reference, [...made(400, 462), { name: "stray", parent: null, offset: [0, 0, 0], rotation: F.IDENTITY }], "foot", up)],
    ["no root", (): unknown => AutoMovieHumanStandingRoot.place(reference, [], "foot", up)],
  ] as const) {
    let refused: boolean = false;
    try {
      bad();
    } catch {
      refused = true;
    }
    if (!refused) failures.push(what + " was accepted");
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
