import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanColliders,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanContactWindow,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The self-penetration audit on a real body: it reads nothing in the body's
 * sound postures, reads a limb set inside the trunk at the depth it was set,
 * and leaves a declared self-contact unread only where and while declared.
 *
 * The body is the average man in his quiet stance. A ray from 1 m ahead of
 * his chest, 50 mm to one side of the midline at the height of the chest's
 * joint, finds the trunk's front surface and its outward normal; a
 * limb is "set `d` inside" by carrying it rigidly so that the middle of its
 * bone lies `d` below that surface point along the normal.
 *
 * Scenarios:
 * 1. The rest T-pose and the quiet stance read no pair at all, and neither
 *    does the stance carried 1 m sideways and 2 m forward or turned 90
 *    degrees: the reading depends on the body's shape, not on its place.
 * 2. The right forearm set 30 mm inside the chest reads a pair of the
 *    forearm and the bone the ray hit. Its depth is at least the 30 mm of
 *    the bone's middle (25 mm is asked, since a neighbouring facet of the
 *    hull may lie nearer) and at most 30 mm plus the forearm's half
 *    thickness, which no adult forearm takes past 60 mm.
 * 3. The same forearm held 150 mm outside the surface reads no pair that
 *    involves it.
 * 4. The left forearm set 30 mm inside at the mirrored ray reads the same
 *    depth within 1 mm: the body is symmetric.
 * 5. Over a film of 1 s in which the forearm goes from 30 mm outside to 30
 *    mm inside (`d = 0.06 t - 0.03`), the deepest pair is read at the last
 *    instant, 1 s, deeper than at 0.75 s, and the pairs come deepest first.
 * 6. The right hand set 20 mm inside the chest is read. With a contact of
 *    the right hand on the person's own body at a region of that bone,
 *    declared over shares 0.25 to 0.75 of a 1 s action, the hand and its
 *    fingers in that bone are read only outside 0.25 to 0.75 s; declared
 *    over the whole action they are not read at all.
 * 7. The same declaration does not cover the forearm (it is no part of the
 *    hand), a contact on another person, or the left hand.
 * 8. A bone and its parent are one joint: the left thigh carried 50 mm up
 *    into the pelvis reads no pair of the thigh and the hips.
 * 9. `unordered` gives one key for either order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public pose and motion measures on a real body's colliders; a missed limb in the trunk, a reading that moves with the body's place, or an exemption that leaks to another part, person or second fails.
 * @evidence contracts/development/testing.md#independent-expectations The depth is the distance the test itself set below a surface point found by the collider owner's ray, bounded by a forearm's anatomical half thickness; the symmetry and the invariance are properties of the body.
 * @evidence contracts/development/testing.md#distinguishing-cases Sound postures, inside and outside, left and right, a ramp in time, a declared contact inside and outside its window and for other parts, and a related pair.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; slow because preparing a body takes seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the construction of "set inside" and lists the 9 scenarios with their numbers.
 */
export function test_human_motion_audit_tangle(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const body: IHumanBody = motionHumanBody("m-average");
  const stance: Bones = motionHumanStance(body);
  const pose = AutoMovieMotionHumanAuditTangle.pose;
  const key = AutoMovieMotionHumanAuditTangle.unordered;

  TestValidator.equals(
    "the rest pose reads nothing",
    pose(
      body,
      poseBones(body, { skeleton: body.skeleton.id, root: null, joints: [] }),
    ).length,
    0,
  );
  TestValidator.equals("the stance reads nothing", pose(body, stance), []);
  TestValidator.equals(
    "the stance elsewhere reads nothing",
    pose(body, motionHumanStance(body, { x: 1, y: 0, z: 2 }, 0)),
    [],
  );
  TestValidator.equals(
    "the stance turned reads nothing",
    pose(body, motionHumanStance(body, { x: 0, y: 0, z: 0 }, 90)),
    [],
  );

  // The trunk's front surface on either side of the midline.
  const height: number = stance.get("chest")!.worldPosition.y;
  const front = (side: "left" | "right"): HumanColliders.IHit => {
    const hit: HumanColliders.IHit | undefined = HumanColliders.cast(
      body,
      new Map(
        [...stance].filter(
          ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
            bone === "chest" || bone === "spine",
        ),
      ),
      { x: side === "left" ? 0.05 : -0.05, y: height, z: 1 },
      { x: 0, y: 0, z: -1 },
      2,
    );
    if (hit === undefined) throw new Error("The ray missed the trunk");
    return hit;
  };
  const arm = (side: "left" | "right", bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith(side) &&
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const hand = (side: "left" | "right", bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith(side) &&
    /(Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const middle = (
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = stance.get(a)!.worldPosition;
    const q: IAutoMovieVector3 = stance.get(b)!.worldPosition;
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 };
  };
  /** The translation that sets a point `inside` metres below a surface hit. */
  const into = (
    hit: HumanColliders.IHit,
    point: IAutoMovieVector3,
    inside: number,
  ): IAutoMovieVector3 => ({
    x: hit.point.x - hit.normal.x * inside - point.x,
    y: hit.point.y - hit.normal.y * inside - point.y,
    z: hit.point.z - hit.normal.z * inside - point.z,
  });
  const carried = (
    moves: (bone: AutoMovieHumanoidBone) => boolean,
    by: IAutoMovieVector3,
  ): Bones =>
    motionAuditMoved(
      stance,
      0,
      (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        moves(bone) ? by : { x: 0, y: 0, z: 0 },
    ).bones("a", 0);
  const forearm = (side: "left" | "right", inside: number): Bones =>
    carried(
      (bone: AutoMovieHumanoidBone): boolean => arm(side, bone),
      into(front(side), middle(`${side}LowerArm`, `${side}Hand`), inside),
    );
  const depth = (
    pairs: AutoMovieMotionHumanAuditTangle.IPair[],
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): number =>
    pairs.find(
      (p: AutoMovieMotionHumanAuditTangle.IPair): boolean =>
        key(p.a, p.b) === key(a, b),
    )?.depth ?? 0;

  const right: HumanColliders.IHit = front("right");
  const set: number = depth(
    pose(body, forearm("right", 0.03)),
    "rightLowerArm",
    right.bone,
  );
  TestValidator.predicate(
    `a forearm set 30 mm inside the chest is read at that depth, got ${(set * 1000).toFixed(1)} mm`,
    set >= 0.025 && set <= 0.03 + 0.06,
  );
  TestValidator.equals(
    "a forearm held outside the chest is not read",
    pose(body, forearm("right", -0.15)).filter(
      (p: AutoMovieMotionHumanAuditTangle.IPair): boolean =>
        p.a === "rightLowerArm" || p.b === "rightLowerArm",
    ),
    [],
  );
  const mirrored: number = depth(
    pose(body, forearm("left", 0.03)),
    "leftLowerArm",
    front("left").bone,
  );
  TestValidator.predicate(
    `the left forearm reads the same depth, got ${(mirrored * 1000).toFixed(1)} against ${(set * 1000).toFixed(1)} mm`,
    Math.abs(mirrored - set) <= 0.001,
  );

  // A film in which the right forearm passes from outside to inside.
  const anchor: IAutoMovieVector3 = middle("rightLowerArm", "rightHand");
  const film = (
    moves: (bone: AutoMovieHumanoidBone) => boolean,
    by: (seconds: number) => IAutoMovieVector3,
    spans: IAutoMovieMotionHumanAuditMotion.ISpan[] = [],
  ): IAutoMovieMotionHumanAuditMotion =>
    motionAuditMoved(
      stance,
      1,
      (bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 =>
        moves(bone) ? by(t) : { x: 0, y: 0, z: 0 },
      spans,
    );
  const ramp: AutoMovieMotionHumanAuditTangle.IResult =
    AutoMovieMotionHumanAuditTangle.measure(
      film(
        (bone: AutoMovieHumanoidBone): boolean => arm("right", bone),
        (t: number): IAutoMovieVector3 => into(right, anchor, 0.06 * t - 0.03),
      ),
      "a",
      body,
    );
  const late: number = depth(
    pose(body, forearm("right", 0.06 * 0.75 - 0.03)),
    "rightLowerArm",
    right.bone,
  );
  TestValidator.predicate(
    "a limb going in is deepest at the end",
    Math.abs(ramp.worst.seconds - 1) <= 1e-9 &&
      ramp.worst.value === ramp.pairs[0]!.depth &&
      ramp.worst.value >= set - 1e-9 &&
      set > late,
  );
  TestValidator.predicate(
    "the pairs come deepest first",
    ramp.pairs.every(
      (p: AutoMovieMotionHumanAuditTangle.IPair, i: number): boolean =>
        i === 0 || ramp.pairs[i - 1]!.depth >= p.depth,
    ),
  );

  // A declared contact of the right hand on the person's own chest.
  const regions = body.surfaces.regions;
  const region: keyof typeof regions | undefined = (
    Object.keys(regions) as (keyof typeof regions)[]
  ).find(
    (name: keyof typeof regions): boolean => regions[name].bone === right.bone,
  );
  if (region === undefined)
    throw new Error(`No region of the body lies on ${right.bone}`);
  const touching = (
    part: IHumanContactWindow["part"],
    subject: string,
    from: number,
    to: number,
  ): IAutoMovieMotionHumanAuditMotion.ISpan[] => [
    {
      name: "touch",
      start: 0,
      entryTime: 0,
      end: 1,
      plan: {
        duration: 1,
        contacts: [
          {
            part,
            kind: "grip",
            from,
            to,
            support: { kind: "person", subject, region },
          },
        ],
      },
    },
  ];
  const palm: IAutoMovieVector3 = into(
    right,
    middle("rightHand", "rightMiddleProximal"),
    0.02,
  );
  const handIn = (
    spans: IAutoMovieMotionHumanAuditMotion.ISpan[],
  ): AutoMovieMotionHumanAuditTangle.IPair[] =>
    AutoMovieMotionHumanAuditTangle.measure(
      film(
        (bone: AutoMovieHumanoidBone): boolean => hand("right", bone),
        (): IAutoMovieVector3 => palm,
        spans,
      ),
      "a",
      body,
    ).pairs.filter(
      (p: AutoMovieMotionHumanAuditTangle.IPair): boolean =>
        (hand("right", p.a) && p.b === right.bone) ||
        (hand("right", p.b) && p.a === right.bone),
    );
  const undeclared: AutoMovieMotionHumanAuditTangle.IPair[] = handIn([]);
  TestValidator.predicate(
    "a hand set inside the chest is read",
    undeclared.length > 0 && undeclared[0]!.depth >= 0.015,
  );
  const partly: AutoMovieMotionHumanAuditTangle.IPair[] = handIn(
    touching("rightHand", "a", 0.25, 0.75),
  );
  TestValidator.predicate(
    "a declared contact is unread only inside its window",
    partly.length === undeclared.length &&
      partly.every(
        (p: AutoMovieMotionHumanAuditTangle.IPair): boolean =>
          p.seconds < 0.25 || p.seconds > 0.75,
      ),
  );
  TestValidator.equals(
    "a contact declared throughout is not read",
    handIn(touching("rightHand", "a", 0, 1)),
    [],
  );
  TestValidator.equals(
    "a contact on another person exempts nothing",
    handIn(touching("rightHand", "b", 0, 1)).length,
    undeclared.length,
  );
  TestValidator.equals(
    "the other hand's contact exempts nothing",
    handIn(touching("leftHand", "a", 0, 1)).length,
    undeclared.length,
  );
  TestValidator.predicate(
    "a declared hand contact does not cover the forearm",
    depth(
      AutoMovieMotionHumanAuditTangle.measure(
        film(
          (bone: AutoMovieHumanoidBone): boolean => arm("right", bone),
          (): IAutoMovieVector3 => into(right, anchor, 0.03),
          touching("rightHand", "a", 0, 1),
        ),
        "a",
        body,
      ).pairs,
      "rightLowerArm",
      right.bone,
    ) >= 0.025,
  );

  TestValidator.equals(
    "a bone and its parent are not a pair",
    depth(
      pose(
        body,
        carried(
          (bone: AutoMovieHumanoidBone): boolean =>
            bone === "leftUpperLeg" ||
            bone === "leftLowerLeg" ||
            bone === "leftFoot" ||
            bone === "leftToes",
          { x: 0, y: 0.05, z: 0 },
        ),
      ),
      "leftUpperLeg",
      "hips",
    ),
    0,
  );
  TestValidator.equals(
    "one key for either order",
    key("rightHand", "chest"),
    key("chest", "rightHand"),
  );
}
