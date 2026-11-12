import {
  AutoMovieChain,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
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
 * partner standing ahead.
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
 *    row does not use strays no more than 80 mm.
 * 8. A one-hand row performed by the left hand on the mirrored region is
 *    the mirror image of the right hand's film within 5 mm, read 4 times a
 *    second.
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
  const effector: AutoMovieMotionHumanTouchEffector.IEffector =
    touch.EFFECTORS[params.with ?? "palm"];
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

  out.push(...motionHumanLaw.audit(film, `${label} a`, "a", body));
  if (partner !== undefined)
    out.push(...motionHumanLaw.audit(film, `${label} b`, "b", body));
  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow = motionHumanLaw.travel(film, "a", bone);
    out.push(
      ...motionHumanLaw.expect(
        `${label}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0)`,
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
  if (params.other === undefined) {
    const strayed: number = Math.max(
      ...times.map((t: number): number =>
        length(minus(wrist("left", t), wrist("left", 0))),
      ),
    );
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the idle hand strays ${mm(strayed)} mm (limit 80.0)`,
        strayed <= 0.08,
      ),
    );
    const flip = (target: AutoMovieMotionTarget): AutoMovieMotionTarget =>
      ({
        ...target,
        region: (target as { region: string }).region.replace(
          /Left|Right/,
          (found: string): string => (found === "Left" ? "Right" : "Left"),
        ),
      }) as AutoMovieMotionTarget;
    const mirrored = AutoMovieMotionHumanAuditDifference.measure(
      film,
      perform({ ...params, target: flip(params.target), side: "left" }),
      "a",
      { mirror: 0, rate: 4 },
    );
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the left-hand touch is ${mm(mirrored.distance.value)} mm off the right-hand touch's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0)`,
        mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
      ),
    );
  }
  return out;
}
