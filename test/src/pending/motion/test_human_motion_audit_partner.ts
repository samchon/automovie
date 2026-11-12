import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  HumanColliders,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../../features/internal/motionAuditMoved";
import { motionHumanBody } from "../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../features/internal/motionHumanStance";

/**
 * The partner-penetration audit complains about one person's limb inside the
 * other person's body, at the depth it was set, at the instant it is deepest,
 * and whether or not a contact was declared there.
 *
 * Person `a` is the average man in his quiet stance at the origin; person `b`
 * is the small woman in hers, 2 m in front of him and turned to face him. A
 * ray from 1 m ahead of his chest, 50 mm to one side of the midline at the
 * height of the chest's joint, finds his trunk's front surface and its
 * outward normal; a limb of hers is "set `d` inside" by carrying it rigidly
 * so that the middle of its bone lies `d` below that surface point along the
 * normal.
 *
 * Scenarios:
 * 1. The two standing 2 m apart read no pair, and the worst reading is 0 and
 *    named `none`.
 * 2. Her right forearm set 30 mm inside his chest reads a pair of her forearm
 *    in the bone the ray hit. Its depth is at least the 30 mm of the bone's
 *    middle (25 mm is asked, since a neighbouring facet of the hull may lie
 *    nearer) and at most 30 mm plus a forearm's half thickness, which no
 *    adult forearm takes past 60 mm. The worst reading names both people.
 * 3. The same forearm held 150 mm outside his surface reads no pair at all.
 * 4. Naming the two people in the other order reads the same worst depth,
 *    instant and name.
 * 5. Over a film of 1 s in which the forearm goes from 30 mm outside to 30
 *    mm inside (`d = 0.06 t - 0.03`), the deepest instant is 1 s. Over one in
 *    which it goes in and comes out again (`d = 0.03 - 0.12 |t - 0.5|`), the
 *    deepest instant is 0.5 s, at the depth of scenario 2, and the pairs come
 *    deepest first.
 * 6. Her right hand set 20 mm inside his chest is read at 15 mm or more, and
 *    declaring a contact of that hand on him over the whole action changes
 *    nothing: a contact is the skins meeting, not one body in the other.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on two real bodies' colliders; a limb in a partner that goes unread, is read at the wrong instant or is excused by a declared contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The depth is the distance the test itself set below a surface point found by the collider owner's ray, bounded by a forearm's anatomical half thickness; the instants are those of the written films.
 * @evidence contracts/development/testing.md#distinguishing-cases Apart, inside and outside, either naming order, a ramp against a pass, and a declared against an undeclared contact.
 * @evidence contracts/development/testing.md#execution-ownership In memory on two prepared bodies; named `test_human_` because preparing a body takes seconds, so the CI test job leaves it to local runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the two people, the construction of "set inside" and the 6 scenarios with their numbers.
 */
export function test_human_motion_audit_partner(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const man: IHumanBody = motionHumanBody("m-average");
  const woman: IHumanBody = motionHumanBody("f-small");
  const his: Bones = motionHumanStance(man);
  const hers: Bones = motionHumanStance(woman, { x: 0, y: 0, z: 2 }, 180);
  const a: AutoMovieMotionHumanAuditPartner.IPerson = {
    subject: "a",
    body: man,
  };
  const b: AutoMovieMotionHumanAuditPartner.IPerson = {
    subject: "b",
    body: woman,
  };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /** A film of 1 s in which he stands and some of her bones are carried. */
  const film = (
    moves: (bone: AutoMovieHumanoidBone) => boolean,
    by: (seconds: number) => IAutoMovieVector3,
    spans: IAutoMovieMotionHumanAuditMotion.ISpan[] = [],
  ): IAutoMovieMotionHumanAuditMotion => {
    const she: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
      hers,
      1,
      (bone: AutoMovieHumanoidBone, t: number): IAutoMovieVector3 =>
        moves(bone) ? by(t) : zero,
    );
    return {
      duration: 1,
      segments: (
        subject: string,
      ): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] =>
        subject === "b" ? spans : [],
      bones: (subject: string, seconds: number): Bones =>
        subject === "a" ? his : she.bones("b", seconds),
    };
  };
  const measure = (
    motion: IAutoMovieMotionHumanAuditMotion,
  ): AutoMovieMotionHumanAuditPartner.IResult =>
    AutoMovieMotionHumanAuditPartner.measure(motion, a, b);
  const mm = (metres: number): string => (metres * 1000).toFixed(1);

  // 1. Apart.
  const apart: AutoMovieMotionHumanAuditPartner.IResult = measure(
    film(
      (): boolean => false,
      (): IAutoMovieVector3 => zero,
    ),
  );
  TestValidator.equals("two people 2 m apart read no pair", apart.pairs, []);
  TestValidator.equals("and no worst reading", apart.worst, {
    value: 0,
    seconds: 0,
    where: "none",
  });

  // His trunk's front surface, right of the midline.
  const hit: HumanColliders.IHit | undefined = HumanColliders.cast(
    man,
    new Map(
      [...his].filter(
        ([bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): boolean =>
          bone === "chest" || bone === "spine",
      ),
    ),
    { x: -0.05, y: his.get("chest")!.worldPosition.y, z: 1 },
    { x: 0, y: 0, z: -1 },
    2,
  );
  if (hit === undefined) throw new Error("The ray missed the trunk");
  const middle = (
    from: AutoMovieHumanoidBone,
    to: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = hers.get(from)!.worldPosition;
    const q: IAutoMovieVector3 = hers.get(to)!.worldPosition;
    return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 };
  };
  /** The translation that sets a point `inside` metres below the surface hit. */
  const into = (
    point: IAutoMovieVector3,
    inside: number,
  ): IAutoMovieVector3 => ({
    x: hit.point.x - hit.normal.x * inside - point.x,
    y: hit.point.y - hit.normal.y * inside - point.y,
    z: hit.point.z - hit.normal.z * inside - point.z,
  });
  const arm = (bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith("right") &&
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const hand = (bone: AutoMovieHumanoidBone): boolean =>
    bone.startsWith("right") &&
    /(Hand|Thumb|Index|Middle|Ring|Little)/u.test(bone);
  const anchor: IAutoMovieVector3 = middle("rightLowerArm", "rightHand");
  const forearm = (
    inside: (seconds: number) => number,
  ): IAutoMovieMotionHumanAuditMotion =>
    film(arm, (t: number): IAutoMovieVector3 => into(anchor, inside(t)));
  const depth = (
    result: AutoMovieMotionHumanAuditPartner.IResult,
    part: AutoMovieHumanoidBone,
  ): number =>
    result.pairs.find(
      (p: AutoMovieMotionHumanAuditPartner.IPair): boolean =>
        p.subject === "b" &&
        p.part === part &&
        p.other === "a" &&
        p.into === hit.bone,
    )?.depth ?? 0;

  // 2. Inside.
  const inside: AutoMovieMotionHumanAuditPartner.IResult = measure(
    forearm((): number => 0.03),
  );
  const set: number = depth(inside, "rightLowerArm");
  TestValidator.predicate(
    `a forearm set 30 mm inside the partner's chest is read at that depth, got ${mm(set)} mm`,
    set >= 0.025 && set <= 0.03 + 0.06,
  );
  TestValidator.predicate(
    `the worst reading names both people, got "${inside.worst.where}"`,
    /^(a|b) \w+ in (a|b) \w+$/u.test(inside.worst.where) &&
      inside.worst.value === inside.pairs[0]!.depth &&
      inside.worst.value >= set,
  );

  // 3. Outside.
  TestValidator.equals(
    "a forearm held 150 mm outside the partner is not read",
    measure(forearm((): number => -0.15)).pairs,
    [],
  );

  // 4. Either naming order.
  TestValidator.equals(
    "naming the two people in the other order reads the same",
    AutoMovieMotionHumanAuditPartner.measure(
      forearm((): number => 0.03),
      b,
      a,
    ).worst,
    inside.worst,
  );

  // 5. In time.
  const ramp: AutoMovieMotionHumanAuditPartner.IResult = measure(
    forearm((t: number): number => 0.06 * t - 0.03),
  );
  TestValidator.predicate(
    `a limb going in is deepest at the end, got ${ramp.worst.seconds} s`,
    Math.abs(ramp.worst.seconds - 1) <= 1e-9 &&
      Math.abs(ramp.worst.value - inside.worst.value) <= 1e-9,
  );
  const pass: AutoMovieMotionHumanAuditPartner.IResult = measure(
    forearm((t: number): number => 0.03 - 0.12 * Math.abs(t - 0.5)),
  );
  TestValidator.predicate(
    `a limb passing in and out is deepest in the middle, got ${pass.worst.seconds} s at ${mm(pass.worst.value)} mm`,
    Math.abs(pass.worst.seconds - 0.5) <= 1e-9 &&
      Math.abs(pass.worst.value - inside.worst.value) <= 1e-9,
  );
  TestValidator.predicate(
    "the pairs come deepest first",
    pass.pairs.every(
      (p: AutoMovieMotionHumanAuditPartner.IPair, i: number): boolean =>
        i === 0 || pass.pairs[i - 1]!.depth >= p.depth,
    ),
  );

  // 6. A declared contact excuses nothing.
  const regions = man.surfaces.regions;
  const region: keyof typeof regions | undefined = (
    Object.keys(regions) as (keyof typeof regions)[]
  ).find(
    (name: keyof typeof regions): boolean => regions[name].bone === hit.bone,
  );
  if (region === undefined)
    throw new Error(`No region of the body lies on ${hit.bone}`);
  const palm: IAutoMovieVector3 = into(
    middle("rightHand", "rightMiddleProximal"),
    0.02,
  );
  const sunk = (spans: IAutoMovieMotionHumanAuditMotion.ISpan[]): number => {
    const result: AutoMovieMotionHumanAuditPartner.IResult = measure(
      film(hand, (): IAutoMovieVector3 => palm, spans),
    );
    return Math.max(
      0,
      ...result.pairs
        .filter(
          (p: AutoMovieMotionHumanAuditPartner.IPair): boolean =>
            p.subject === "b" && hand(p.part) && p.into === hit.bone,
        )
        .map((p: AutoMovieMotionHumanAuditPartner.IPair): number => p.depth),
    );
  };
  const undeclared: number = sunk([]);
  TestValidator.predicate(
    `a hand set 20 mm inside the partner's chest is read, got ${mm(undeclared)} mm`,
    undeclared >= 0.015,
  );
  TestValidator.equals(
    "a declared contact there excuses nothing",
    sunk([
      {
        name: "touch",
        start: 0,
        entryTime: 0,
        end: 1,
        plan: {
          duration: 1,
          contacts: [
            {
              part: "rightHand",
              kind: "grip",
              from: 0,
              to: 1,
              support: { kind: "person", subject: "a", region },
            },
          ],
        },
      },
    ]),
    undeclared,
  );
}
