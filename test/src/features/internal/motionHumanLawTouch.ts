import {
  AutoMovieChain,
  type IAutoMovieResolvedBone,
  Quaternion,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditDifference,
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  HumanChain,
  HumanColliders,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  touch,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * Everything one touch owes on screen, read off the displayed bones, as
 * complaints: the row of a touch on the performer's own body, or on a
 * partner standing ahead. It is read in parts so each spec runs within the
 * time a test may take.
 *
 * The performer `a` stands at the origin heading +Z; a partner `b` stands
 * `gap` metres ahead, facing `a` or turned away. The right hand takes the
 * row's target and the left its `other`. A hand's distance to its region is
 * the signed distance from the region's point, placed on the displayed bone
 * that carries it, to that hand's own colliders, so 0 is skin on skin.
 *
 * 1. The generic audit of `a` is clean, and of `b` when there is one.
 * 2. No elbow of `a` travels more than 80 mm in one 1/24 s frame.
 * 3. Each hand is on its region, within 10 mm, at `ready` and at `relax`.
 * 4. A kind that lifts (a tap, a pat) comes down the row's count of times
 *    from `strokeStart` on (apart by more than 10 mm, then within it), and
 *    between leaves the region by at least half the kind's lift and no more
 *    than the lift plus 10 mm.
 * 5. A kind that travels (a stroke, a rub, a scratch) stays on the region
 *    from `ready` to `relax`, within 10 mm plus the kind's travel, and its
 *    effector moves from where it arrived by at least half the travel and no
 *    more than the travel plus 10 mm.
 * 6. A kind that does neither (a press, a squeeze, a hold) stays within 10
 *    mm of the region from `ready` to `relax` and its effector within 10 mm
 *    of where it arrived on it.
 * 7. Each hand ends within 10 mm of its place at the entry, and a hand the
 *    row does not use strays no more than 80 mm from where it hangs in the
 *    trunk's frame (the chest's joint and turn): the idle arm's claim is to
 *    stay at rest on the body, so a lean or a rise that carries the trunk
 *    carries it too, as it carries the shoulder it hangs from. An arm whose
 *    own region the row touches is presented, not idle (`touchPresented`):
 *    from `ready` to `relax` it holds within 10 mm of where it is at
 *    `ready` in that frame, the bound a held effector keeps (6).
 * 8. A one-hand row performed by the left hand on the mirrored region is
 *    the mirror image of the right hand's film within 5 mm, read 4 times a
 *    second. On a partner the claim is about the performer's act, not the
 *    scene: the partner's seeded postural sway is the same in both films, so
 *    it is never mirrored, and a hand that rides its region follows it. So
 *    on a partner row, while the hand lies on the region (from `ready` to
 *    `relax`), the acting hand and its digits are read from the touched
 *    region's point in each film (the partner's region the hand touches
 *    there); outside that span, and for every other bone of `a`, in the
 *    world as before. This corrects the comparison's frame; the bound is the
 *    same 5 mm.
 *
 * The counts default as the law documents: 3 for a tap, a pat, a rub or a
 * scratch and 1 otherwise. The lift and the travel are the kind's shares of
 * the hand's length (`AutoMovieMotionHumanTouchForm.FORMS`).
 *
 * @param label The row's name, the complaints' prefix.
 * @param params The row.
 * @param part Which expectations are read: an audit part (1, of both people, `motionHumanLaw.auditPart`), `film` (2 to 7) or `mirror` (8, on a one-hand row).
 * @param partner The partner's place, when the target is a person.
 * @param name The body both people have.
 * @returns One complaint per expectation that does not hold, with its measured numbers; empty when the row is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound and how the distance is read.
 * @evidence contracts/development/implementation.md#principled-implementation Contact is the hand's own collider on the region's point of the displayed body, not the law's goal; the kind's shape is its definition as a lift or a travel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One film, the two distance readers, then one block per expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; none stops the others.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every expectation reads the film's remembered frames on the 24 Hz grid.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `motionHumanLaw` for the film, the events, the travel and the audit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawTouch(
  label: string,
  params: touch.IParams,
  part: motionHumanLaw.AuditPart | "film" | "mirror",
  partner?: { facing: boolean; gap: number },
  name: motionHumanBody.Name = "m-average",
): string[] {
  const body: IHumanBody = motionHumanBody(name);
  const perform = (row: touch.IParams): motionHumanLaw.IFilm => {
    const a: HumanChain = HumanChain.subject("a").act("touch", row);
    return partner === undefined
      ? motionHumanLaw.perform(label, [{ subject: "a", body }], a)
      : motionHumanLaw.perform(
          label,
          [
            { subject: "a", body },
            {
              subject: "b",
              body,
              at: { x: 0, y: 0, z: partner.gap },
              yaw: partner.facing ? 180 : 0,
            },
          ],
          new AutoMovieChain({
            kind: "parallel",
            parts: [HumanChain.subject("b").stand({ seconds: 8 }).node, a.node],
          }).node,
        );
  };
  const film: motionHumanLaw.IFilm = perform(params);
  const kind: AutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
  const form: AutoMovieMotionHumanTouchForm.IForm =
    AutoMovieMotionHumanTouchForm.FORMS[kind];
  // The effector as the law reads it: curled as the kind curls the fingers.
  const effector: AutoMovieMotionHumanTouchEffector.IEffector =
    AutoMovieMotionHumanTouchForm.curled(
      touch.EFFECTORS[params.with ?? "palm"],
      kind,
    );
  const hand: number = body.measure.hand;
  const count: number =
    params.count ?? (["tap", "pat", "rub", "scratch"].includes(kind) ? 3 : 1);
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const length = (v: IAutoMovieVector3): number => Math.hypot(v.x, v.y, v.z);
  const minus = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const wrist = (side: "left" | "right", t: number): IAutoMovieVector3 =>
    film.bones("a", t).get(`${side}Hand`)!.worldPosition;
  const owner = (target: AutoMovieMotionTarget): string =>
    target.kind === "person" ? target.subject : "a";
  const region = (
    target: AutoMovieMotionTarget,
    t: number,
  ): IAutoMovieVector3 => {
    const frame =
      body.surfaces.regions[
        (target as { region: AutoMovieHumanoidRegion }).region
      ];
    return resolveAutoMovieHumanoidSurfaces.place(
      frame,
      film.bones(owner(target), t).get(frame.bone)!,
    ).point;
  };
  const fingers = (side: "left" | "right", t: number): motionHumanLaw.Bones =>
    new Map(
      [...film.bones("a", t)].filter(
        ([bone]: [AutoMovieHumanoidBone, unknown]) =>
          new RegExp(`^${side}(Hand|Thumb|Index|Middle|Ring|Little)`).test(
            bone,
          ),
      ),
    );
  const gap = (
    side: "left" | "right",
    target: AutoMovieMotionTarget,
    t: number,
  ): number =>
    Math.abs(
      HumanColliders.distance(body, fingers(side, t), region(target, t))
        .distance,
    );
  const offset = (
    side: "left" | "right",
    target: AutoMovieMotionTarget,
    t: number,
  ): IAutoMovieVector3 =>
    minus(
      AutoMovieMotionHumanTouchEffector.point(
        body,
        film.bones("a", t),
        side,
        effector,
      ),
      region(target, t),
    );
  const ready: number = motionHumanLaw.event(film, "ready");
  const strokeStart: number = motionHumanLaw.event(film, "strokeStart");
  const relax: number = motionHumanLaw.event(film, "relax");
  const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
    0,
    film.duration,
    24,
  );
  const held: number[] = [
    ready,
    ...times.filter((t: number): boolean => t > ready && t < relax),
    relax,
  ];
  const out: string[] = [];

  if (part !== "film" && part !== "mirror")
    return [
      ...motionHumanLaw.auditPart(film, `${label} a`, "a", body, part),
      ...(partner === undefined
        ? []
        : motionHumanLaw.auditPart(film, `${label} b`, "b", body, part)),
    ];
  if (part === "mirror") {
    if (params.other !== undefined) return out;
    const flip = (target: AutoMovieMotionTarget): AutoMovieMotionTarget =>
      ({
        ...target,
        region: (target as { region: string }).region.replace(
          /Left|Right/,
          (found: string): string => (found === "Left" ? "Right" : "Left"),
        ),
      }) as AutoMovieMotionTarget;
    const left: motionHumanLaw.IFilm = perform({
      ...params,
      target: flip(params.target),
      side: "left",
    });

    // On a partner, the acting hand read from the region it touches in its
    // own film, so the partner's unmirrored sway is not counted as the act's.
    const acted = (
      shown: motionHumanLaw.IFilm,
      side: "left" | "right",
      target: AutoMovieMotionTarget,
    ): IAutoMovieMotionHumanAuditMotion => {
      if (target.kind !== "person") return shown;
      const frame = body.surfaces.regions[target.region];
      const shownReady: number = motionHumanLaw.event(shown, "ready");
      const shownRelax: number = motionHumanLaw.event(shown, "relax");
      const hand: RegExp = new RegExp(
        `^${side}(Hand|Thumb|Index|Middle|Ring|Little)`,
      );
      return {
        duration: shown.duration,
        segments: (
          subject: string,
        ): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] =>
          shown.segments(subject),
        bones: (
          subject: string,
          t: number,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            shown.bones(subject, t);
          if (subject !== "a" || t < shownReady || t > shownRelax) return bones;
          const at: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
            frame,
            shown.bones(target.subject, t).get(frame.bone)!,
          ).point;
          return new Map(
            [...bones].map(
              ([bone, resolved]: [
                AutoMovieHumanoidBone,
                IAutoMovieResolvedBone,
              ]): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
                bone,
                hand.test(bone)
                  ? {
                      ...resolved,
                      worldPosition: minus(resolved.worldPosition, at),
                    }
                  : resolved,
              ],
            ),
          );
        },
      };
    };
    const mirrored = AutoMovieMotionHumanAuditDifference.measure(
      acted(film, params.side ?? "right", params.target),
      acted(left, "left", flip(params.target)),
      "a",
      { mirror: 0, rate: 4 },
    );
    // Each film's acting arm and trunk at the second, as clinical triples
    // that a mirror keeps equal, so a miss says which joint differs.
    const acting = (shown: motionHumanLaw.IFilm, side: string): string =>
      shown.performance
        .pose("a", mirrored.distance.seconds)
        .joints.filter((joint: IAutoMovieJointPose): boolean =>
          [
            "hips",
            "spine",
            "chest",
            `${side}UpperArm`,
            `${side}LowerArm`,
            `${side}Hand`,
          ].includes(joint.bone),
        )
        .map(
          (joint: IAutoMovieJointPose): string =>
            `${joint.bone.replace(side, "")} ${(joint.flexion ?? 0).toFixed(1)}/${(joint.abduction ?? 0).toFixed(1)}/${(joint.twist ?? 0).toFixed(1)}`,
        )
        .join(", ");
    return motionHumanLaw.expect(
      `${label}: the left-hand touch is ${mm(mirrored.distance.value)} mm off the right-hand touch's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0; right ${acting(film, "right")}; left ${acting(left, "left")})`,
      mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
    );
  }
  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow = motionHumanLaw.travel(film, "a", bone);
    // The arm's joints at the frame's two ends, so a complaint says which
    // joint moved: the clearing turns only the upper arm's abduction and the
    // elbow's flexion, a fit every joint.
    const side: "left" | "right" = bone === "rightLowerArm" ? "right" : "left";
    const arm = (t: number): string =>
      film.performance
        .pose("a", t)
        .joints.filter((joint: IAutoMovieJointPose): boolean =>
          [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`].includes(
            joint.bone,
          ),
        )
        .map(
          (joint: IAutoMovieJointPose): string =>
            `[${(joint.flexion ?? 0).toFixed(0)}, ${(joint.abduction ?? 0).toFixed(0)}, ${(joint.twist ?? 0).toFixed(0)}]`,
        )
        .join(" ");
    out.push(
      ...motionHumanLaw.expect(
        `${label}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0; the arm ${arm(elbow.seconds)} then ${arm(elbow.seconds + 1 / 24)}; at ready ${ready.toFixed(2)} s ${arm(ready)}, at relax ${relax.toFixed(2)} s ${arm(relax)}, at the end ${arm(film.duration)})`,
        elbow.value <= 0.08,
      ),
    );
  }

  const hands: ["left" | "right", AutoMovieMotionTarget][] = [
    ["right", params.target],
    ...(params.other === undefined
      ? []
      : [["left", params.other] as ["left", AutoMovieMotionTarget]]),
  ];
  for (const [side, target] of hands) {
    for (const [event, t] of [
      ["ready", ready],
      ["relax", relax],
    ] as const) {
      const far: number = gap(side, target, t);
      out.push(
        ...motionHumanLaw.expect(
          `${label}: the ${side} hand is ${mm(far)} mm off its region at ${event} (limit 10.0)`,
          far <= 0.01,
        ),
      );
    }
    const gaps: number[] = held.map((t: number): number =>
      gap(side, target, t),
    );
    const arrived: IAutoMovieVector3 = offset(side, target, ready);
    const moved: number = Math.max(
      ...held.map((t: number): number =>
        length(minus(offset(side, target, t), arrived)),
      ),
    );
    if (form.lift > 0) {
      let downs: number = 0;
      let apart: boolean = false;
      for (let i: number = 0; i < held.length; i++) {
        if (held[i]! < strokeStart) continue;
        if (gaps[i]! > 0.01) apart = true;
        else if (apart) {
          downs++;
          apart = false;
        }
      }
      const peak: number = Math.max(...gaps);
      out.push(
        ...motionHumanLaw.expect(
          `${label}: the ${side} hand comes down ${downs} times (expected ${count})`,
          downs === count,
        ),
        ...motionHumanLaw.expect(
          `${label}: the ${side} hand lifts ${mm(peak)} mm (band ${mm(0.5 * form.lift * hand)} to ${mm(form.lift * hand + 0.01)})`,
          peak >= 0.5 * form.lift * hand && peak <= form.lift * hand + 0.01,
        ),
      );
    } else {
      const reach: number = form.travel * hand;
      const worst: number = Math.max(...gaps);
      out.push(
        ...motionHumanLaw.expect(
          `${label}: the ${side} hand is ${mm(worst)} mm off its region during the contact (limit ${mm(0.01 + reach)})`,
          worst <= 0.01 + reach,
        ),
        ...motionHumanLaw.expect(
          `${label}: the ${side} effector moves ${mm(moved)} mm on its region (band ${mm(0.5 * reach)} to ${mm(reach + 0.01)})`,
          moved >= 0.5 * reach && moved <= reach + 0.01,
        ),
      );
    }
  }

  for (const side of ["right", "left"] as const) {
    const back: number = length(
      minus(wrist(side, film.duration), wrist(side, 0)),
    );
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the ${side} hand ends ${mm(back)} mm from its entry (limit 10.0)`,
        back <= 0.01,
      ),
    );
  }
  // The other hand's wrist in the trunk's frame.
  const hung = (t: number): IAutoMovieVector3 => {
    const chest: IAutoMovieResolvedBone = film.bones("a", t).get("chest")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(chest.worldRotation),
      minus(wrist("left", t), chest.worldPosition),
    );
  };
  // A region on the other arm presents that arm to the touching hand: it is
  // not idle, but it holds still while it is touched, within the bound a
  // held effector keeps (scenario 6).
  const presented: boolean =
    params.other === undefined &&
    params.target.kind === "self" &&
    /^left(UpperArm|LowerArm|Hand)$/.test(
      body.surfaces.regions[params.target.region].bone,
    );
  if (presented) {
    const moved: number = Math.max(
      ...held.map((t: number): number => length(minus(hung(t), hung(ready)))),
    );
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the presented hand moves ${mm(moved)} mm in the trunk's frame while it is touched (limit 10.0)`,
        moved <= 0.01,
      ),
    );
  }
  if (params.other === undefined && !presented) {
    // The idle wrist strays from where it hangs from the chest.
    const strays: number[] = times.map((t: number): number =>
      length(minus(hung(t), hung(0))),
    );
    const strayed: number = Math.max(...strays);
    // Where the idle arm is when it strays farthest, so a complaint says
    // whether the arm itself or the trunk under it moved.
    const when: number = times[strays.indexOf(strayed)] ?? 0;
    const joints = (t: number): string =>
      film.performance
        .pose("a", t)
        .joints.filter((joint: IAutoMovieJointPose): boolean =>
          ["hips", "spine", "chest", "leftUpperArm", "leftLowerArm"].includes(
            joint.bone,
          ),
        )
        .map(
          (joint: IAutoMovieJointPose): string =>
            `${joint.bone} ${(joint.flexion ?? 0).toFixed(0)}/${(joint.abduction ?? 0).toFixed(0)}/${(joint.twist ?? 0).toFixed(0)}`,
        )
        .join(", ") +
      `, hips at ${((p: IAutoMovieVector3): string => `${(p.x * 1000).toFixed(0)}/${(p.y * 1000).toFixed(0)}/${(p.z * 1000).toFixed(0)} mm`)(film.bones("a", t).get("hips")!.worldPosition)}`;
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the idle hand strays ${mm(strayed)} mm in the trunk's frame (limit 80.0) at ${when.toFixed(3)} s (${joints(when)}; at 0 s ${joints(0)})`,
        strayed <= 0.08,
      ),
    );
  }
  return out;
}
