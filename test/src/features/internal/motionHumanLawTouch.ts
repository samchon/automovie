import {
  AutoMovieChain,
  Quaternion,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanTouch,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchForm,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditMotion,
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  HumanChain,
  HumanColliders,
  touch,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanJointText } from "./motionHumanJointText";
import { motionHumanLaw } from "./motionHumanLaw";
import { motionHumanLawTouchMirror } from "./motionHumanLawTouchMirror";

/**
 * Everything one touch owes on screen, read off the displayed bones, as
 * complaints: the row of a touch on the performer's own body, or on a
 * partner standing ahead. The row's film is performed once and every
 * expectation that reads it reads that one film: the audit's seven parts
 * (`motionHumanLaw.auditParts`) read 1 and the film's own checks 2 to 7.
 * The mirror 8 performs the right-hand row again only when a partner's sway
 * must be stilled for it; a self-directed row's film is its own right-hand
 * side.
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
 *    the mirror image of the right hand's film within 5 mm on every bone of
 *    `a`, in the world, read 4 times a second. A mirror relation holds only
 *    when the whole input is mirrored, and a partner's seeded postural sway
 *    is a draw no seed mirrors, so both films of a partner row are performed
 *    with the partner standing exactly still (`stand`'s `sway` 0), a scene
 *    that is its own mirror.
 *
 * The counts default as the law documents: 3 for a tap, a pat, a rub or a
 * scratch and 1 otherwise. The lift and the travel are the kind's shares of
 * the hand's length (`AutoMovieMotionHumanTouchForm.FORMS`).
 *
 * @param label The row's name, the complaints' prefix.
 * @param params The row.
 * @param partner The partner's place, when the target is a person.
 * @param name The body both people have.
 * @returns One complaint per expectation that does not hold, with its measured numbers; empty when the row is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound, how the distance is read and which films are performed.
 * @evidence contracts/development/implementation.md#principled-implementation Contact is the hand's own collider on the region's point of the displayed body, not the law's goal; the kind's shape is its definition as a lift or a travel.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One film, the audit's parts and the film's checks on it, then the mirror (`motionHumanLawTouchMirror`); a failing complaint's joint text comes from `motionHumanJointText`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; none stops the others, and no bound differs from the part-by-part reading it replaces.
 * @evidence contracts/development/implementation.md#efficient-algorithms One film per row instead of one per expectation group, its remembered 24 Hz frames shared by the audit's parts and the film's checks; a complaint's joint dumps are resolved only when it fails.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A self-directed row's right-hand mirror film has the same input as its film (a partner's stilling applies only to a partner), so the film stands for it; `motionHumanLaw` owns the film, the events, the travel and the audit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawTouch(
  label: string,
  params: IAutoMovieMotionHumanTouch.IParams,
  partner?: { facing: boolean; gap: number },
  name: motionHumanBody.Name = "m-average",
): string[] {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  // The partner stands still for a mirror (8), with its own sway otherwise.
  const perform = (
    row: IAutoMovieMotionHumanTouch.IParams,
    still: boolean,
  ): motionHumanLaw.IFilm => {
    const a: IAutoMovieMotionHumanChain = HumanChain.subject("a").act("touch", row);
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
            parts: [
              HumanChain.subject("b").stand(
                still ? { seconds: 8, sway: 0 } : { seconds: 8 },
              ).node,
              a.node,
            ],
          }).node,
        );
  };
  const film: motionHumanLaw.IFilm = perform(params, false);
  return [
    ...motionHumanLaw.auditParts(film, `${label} a`, "a", body),
    ...(partner === undefined
      ? []
      : motionHumanLaw.auditParts(film, `${label} b`, "b", body)),
    ...expectations(label, params, body, film),
    ...motionHumanLawTouchMirror(
      label,
      params,
      partner === undefined ? film : undefined,
      perform,
    ),
  ];
}

/** Millimetres of a length in metres, to one decimal. */
function mm(metres: number): string {
  return (metres * 1000).toFixed(1);
}

/** The length of a vector, metres. */
function length(v: IAutoMovieVector3): number {
  return Math.hypot(v.x, v.y, v.z);
}

/** The difference of two vectors. */
function minus(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Expectations 2 to 7 of `motionHumanLawTouch`, on the row's film.
 *
 * @param label The row's name.
 * @param params The row.
 * @param body The body both people have.
 * @param film The row's film.
 * @returns One complaint per expectation that does not hold.
 */
function expectations(
  label: string,
  params: IAutoMovieMotionHumanTouch.IParams,
  body: IAutoMovieMotionHumanBody,
  film: motionHumanLaw.IFilm,
): string[] {
  const kind: IAutoMovieMotionHumanTouchForm.Kind = params.kind ?? "pat";
  const form: IAutoMovieMotionHumanTouchForm.IForm =
    AutoMovieMotionHumanTouchForm.FORMS[kind];
  // The effector as the law reads it: curled as the kind curls the fingers.
  const effector: IAutoMovieMotionHumanTouchEffector.IEffector =
    AutoMovieMotionHumanTouchForm.curled(
      touch.EFFECTORS[params.with ?? "palm"],
      kind,
    );
  const hand: number = body.measure.hand;
  const count: number =
    params.count ?? (["tap", "pat", "rub", "scratch"].includes(kind) ? 3 : 1);
  const wrist = (side: "left" | "right", t: number): IAutoMovieVector3 =>
    film.bones("a", t).get(`${side}Hand`)!.worldPosition;
  const owner = (target: IAutoMovieMotionTarget): string =>
    target.kind === "person" ? target.subject : "a";
  const region = (
    target: IAutoMovieMotionTarget,
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
  // A hand's own bones, the colliders its distance is read from.
  const own: Record<"left" | "right", RegExp> = {
    left: /^left(Hand|Thumb|Index|Middle|Ring|Little)/,
    right: /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
  };
  const fingers = (side: "left" | "right", t: number): motionHumanLaw.Bones =>
    new Map(
      [...film.bones("a", t)].filter(
        ([bone]: [AutoMovieHumanoidBone, unknown]): boolean =>
          own[side].test(bone),
      ),
    );
  const gap = (
    side: "left" | "right",
    target: IAutoMovieMotionTarget,
    t: number,
  ): number =>
    Math.abs(
      HumanColliders.distance(body, fingers(side, t), region(target, t))
        .distance,
    );
  const offset = (
    side: "left" | "right",
    target: IAutoMovieMotionTarget,
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
  const times: number[] = AutoMovieMotionHumanAuditMotion.grid(
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

  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow: IAutoMovieMotionHumanAuditMeasure = motionHumanLaw.travel(
      film,
      "a",
      bone,
    );
    // The arm's joints at the frame's two ends, so a complaint says which
    // joint moved: the clearing turns only the upper arm's abduction and the
    // elbow's flexion, a fit every joint.
    const side: "left" | "right" = bone === "rightLowerArm" ? "right" : "left";
    const arm = (t: number): string =>
      motionHumanJointText(
        film,
        t,
        [`${side}UpperArm`, `${side}LowerArm`, `${side}Hand`],
        (joint: IAutoMovieJointPose): string =>
          `[${(joint.flexion ?? 0).toFixed(0)}, ${(joint.abduction ?? 0).toFixed(0)}, ${(joint.twist ?? 0).toFixed(0)}]`,
        " ",
      );
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${label}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0; the arm ${arm(elbow.seconds)} then ${arm(elbow.seconds + 1 / 24)}; at ready ${ready.toFixed(2)} s ${arm(ready)}, at relax ${relax.toFixed(2)} s ${arm(relax)}, at the end ${arm(film.duration)})`,
        elbow.value <= 0.08,
      ),
    );
  }

  const hands: ["left" | "right", IAutoMovieMotionTarget][] = [
    ["right", params.target],
    ...(params.other === undefined
      ? []
      : [["left", params.other] as ["left", IAutoMovieMotionTarget]]),
  ];
  for (const [side, target] of hands) {
    for (const [event, t] of [
      ["ready", ready],
      ["relax", relax],
    ] as const) {
      const far: number = gap(side, target, t);
      out.push(
        ...motionHumanLaw.expect(
          (): string =>
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
          (): string =>
            `${label}: the ${side} hand comes down ${downs} times (expected ${count})`,
          downs === count,
        ),
        ...motionHumanLaw.expect(
          (): string =>
            `${label}: the ${side} hand lifts ${mm(peak)} mm (band ${mm(0.5 * form.lift * hand)} to ${mm(form.lift * hand + 0.01)})`,
          peak >= 0.5 * form.lift * hand && peak <= form.lift * hand + 0.01,
        ),
      );
    } else {
      const reach: number = form.travel * hand;
      const worst: number = Math.max(...gaps);
      out.push(
        ...motionHumanLaw.expect(
          (): string =>
            `${label}: the ${side} hand is ${mm(worst)} mm off its region during the contact (limit ${mm(0.01 + reach)})`,
          worst <= 0.01 + reach,
        ),
        ...motionHumanLaw.expect(
          (): string =>
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
        (): string =>
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
        (): string =>
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
    const trunk = (t: number): string =>
      motionHumanJointText(
        film,
        t,
        ["hips", "spine", "chest", "leftUpperArm", "leftLowerArm"],
        (joint: IAutoMovieJointPose): string =>
          `${joint.bone} ${(joint.flexion ?? 0).toFixed(0)}/${(joint.abduction ?? 0).toFixed(0)}/${(joint.twist ?? 0).toFixed(0)}`,
        ", ",
      ) +
      `, hips at ${((p: IAutoMovieVector3): string => `${(p.x * 1000).toFixed(0)}/${(p.y * 1000).toFixed(0)}/${(p.z * 1000).toFixed(0)} mm`)(film.bones("a", t).get("hips")!.worldPosition)}`;
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${label}: the idle hand strays ${mm(strayed)} mm in the trunk's frame (limit 80.0) at ${when.toFixed(3)} s (${trunk(when)}; at 0 s ${trunk(0)})`,
        strayed <= 0.08,
      ),
    );
  }
  return out;
}
