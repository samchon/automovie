import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditReturn } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The return audit tells a body that is back at its entry from one that is
 * not, and a body that kept its form but stands elsewhere from one whose
 * form changed.
 *
 * The body is five joint centres written by hand, rigid about the hips: the
 * hips at 1 m, the spine 0.2 m above them, the hands 0.3 m to either side,
 * 0.2 m up and 0.1 m forward, and a fingertip 0.08 m beyond the left hand.
 * A film places the hips, turns the body about the vertical and may move
 * one centre in the body's own frame.
 *
 * Scenarios:
 * 1. A body that does not move reads zero on both readings at `none`.
 * 2. A left hand left 30 mm higher reads 30 mm on both readings, on
 *    `leftHand`, at the later instant.
 * 3. A body carried 2 m sideways and turned a quarter turn with its form
 *    kept reads a `shape` of zero and the `world` distance of its farthest
 *    centre, which the test computes from the rotation's closed form.
 * 4. The same carried body with its fingertip 12 mm off reads a `shape` of
 *    12 mm on `leftIndexDistal`: a finger is read like any joint.
 * 5. A later instant that lacks a bone, and an instant without hips, are
 *    refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public reading on written films; a form change hidden by a displacement, a displacement taken for a form change, an unread finger or a skipped missing bone fails.
 * @evidence contracts/development/testing.md#independent-expectations Each distance is the offset the test wrote, and the carried body's world distance the closed form of a turn about the vertical applied to the offsets.
 * @evidence contracts/development/testing.md#distinguishing-cases Still, a changed form in place, a kept form displaced and turned, a changed finger under displacement, and two malformed films.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-written joint centres; no body is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the body, the films and the 5 scenarios with their numbers.
 */
export function test_motion_audit_return(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  type Offsets = Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  const REST: Offsets = {
    hips: { x: 0, y: 0, z: 0 },
    spine: { x: 0, y: 0.2, z: 0 },
    leftHand: { x: 0.3, y: 0.2, z: 0.1 },
    rightHand: { x: -0.3, y: 0.2, z: 0.1 },
    leftIndexDistal: { x: 0.38, y: 0.2, z: 0.1 },
  };
  // A turn about the vertical by `degrees`, right-handed.
  const turn = (v: IAutoMovieVector3, degrees: number): IAutoMovieVector3 => {
    const c: number = Math.cos((degrees * Math.PI) / 180);
    const s: number = Math.sin((degrees * Math.PI) / 180);
    return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
  };
  const place = (
    offsets: Offsets,
    at: IAutoMovieVector3,
    degrees: number,
  ): Bones => {
    const rotation: IAutoMovieQuaternion = {
      x: 0,
      y: Math.sin((degrees * Math.PI) / 360),
      z: 0,
      w: Math.cos((degrees * Math.PI) / 360),
    };
    const out: Bones = new Map();
    for (const [bone, offset] of Object.entries(offsets) as [
      AutoMovieHumanoidBone,
      IAutoMovieVector3,
    ][]) {
      const turned: IAutoMovieVector3 = turn(offset, degrees);
      out.set(bone, {
        bone,
        localRotation: { x: 0, y: 0, z: 0, w: 1 },
        worldPosition: {
          x: at.x + turned.x,
          y: at.y + turned.y,
          z: at.z + turned.z,
        },
        worldRotation: rotation,
      });
    }
    return out;
  };
  const read = (
    before: Bones,
    after: Bones,
  ): AutoMovieMotionHumanAuditReturn.IResult =>
    AutoMovieMotionHumanAuditReturn.measure(
      {
        duration: 2,
        bones: (_subject: string, seconds: number): Bones =>
          seconds < 1 ? before : after,
        segments: (): [] => [],
      },
      "a",
      0,
      2,
    );
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const show = (result: AutoMovieMotionHumanAuditReturn.IResult): string =>
    JSON.stringify(result);
  const HOME: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const AWAY: IAutoMovieVector3 = { x: 2, y: 1, z: 0 };
  const entry: Bones = place(REST, HOME, 0);

  // 1. Still.
  const still: AutoMovieMotionHumanAuditReturn.IResult = read(entry, entry);
  TestValidator.equals("a body that does not move is back", still, {
    world: { value: 0, seconds: 2, where: "none" },
    shape: { value: 0, seconds: 2, where: "none" },
  });

  // 2. A hand left up.
  const raised: AutoMovieMotionHumanAuditReturn.IResult = read(
    entry,
    place({ ...REST, leftHand: { x: 0.3, y: 0.23, z: 0.1 } }, HOME, 0),
  );
  TestValidator.predicate(
    `a hand left 30 mm up is 30 mm from its entry, got ${show(raised)}`,
    near(raised.world.value, 0.03) &&
      near(raised.shape.value, 0.03) &&
      raised.world.where === "leftHand" &&
      raised.shape.where === "leftHand" &&
      raised.shape.seconds === 2,
  );

  // 3. The form kept, the body carried and turned.
  const carried: AutoMovieMotionHumanAuditReturn.IResult = read(
    entry,
    place(REST, AWAY, 90),
  );
  let farthest: number = 0;
  let which: string = "none";
  for (const [bone, offset] of Object.entries(REST) as [
    AutoMovieHumanoidBone,
    IAutoMovieVector3,
  ][]) {
    const turned: IAutoMovieVector3 = turn(offset, 90);
    const d: number = Math.hypot(
      2 + turned.x - offset.x,
      turned.y - offset.y,
      turned.z - offset.z,
    );
    if (d > farthest) {
      farthest = d;
      which = bone;
    }
  }
  TestValidator.predicate(
    `a carried and turned body keeps its form and is ${farthest.toFixed(4)} m away on ${which}, got ${show(carried)}`,
    farthest > 2 &&
      carried.shape.value <= 1e-9 &&
      near(carried.world.value, farthest) &&
      carried.world.where === which,
  );

  // 4. A finger off under the same displacement.
  const curled: AutoMovieMotionHumanAuditReturn.IResult = read(
    entry,
    place(
      { ...REST, leftIndexDistal: { x: 0.38, y: 0.188, z: 0.1 } },
      AWAY,
      90,
    ),
  );
  TestValidator.predicate(
    `a fingertip 12 mm off is read under a displacement, got ${show(curled)}`,
    near(curled.shape.value, 0.012) && curled.shape.where === "leftIndexDistal",
  );

  // 5. Malformed films.
  TestValidator.error("a later instant lacking a bone is refused", (): void => {
    const short: Bones = new Map(entry);
    short.delete("rightHand");
    read(entry, short);
  });
  TestValidator.error("an instant without hips is refused", (): void => {
    const headless: Bones = new Map(entry);
    headless.delete("hips");
    read(headless, entry);
  });
}
