import { Quaternion, Vector3, minimumJerk, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmWrestle,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmJointCourse } from "../compose/AutoMovieMotionHumanArmJointCourse";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanForceTrunk } from "../grappling/HumanForceTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMaterialContact } from "../posture/HumanMaterialContact";
import { HumanTrunkTurn } from "../posture/HumanTrunkTurn";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Arm wrestling, one role of it: the elbow planted on a table's top, the hand
 * clasped with the partner's above it, the struggle and the pin.
 *
 * Both roles read one geometry from the table's point and the two bodies, so
 * neither waits on the other. The clasp stands over the table's point at 0.85
 * of the shorter forearm (provisional), the two wrists `GAP` apart across the
 * table; each elbow lies on the table's top where its own forearm reaches its
 * wrist from, toward its own side. The trunk leans from the hips until the
 * shoulder is an upper arm from the elbow, so the elbow, which is no hand
 * surface, is put where it must be by the arm's own lengths: the hand's goal is
 * the wrist and the elbow's hint is its place on the table. A table too low or
 * too far for the lean to close is refused.
 *
 * The forearms turn about the line through the two elbows: upright from `set`,
 * swaying `SWAY` degrees through the struggle from `go`, then down to the pin's
 * angle (`PIN` degrees when none is asked) toward the winner's left by `pin`,
 * and back up to leave from `relax`. An angle past what the arm holds with its
 * elbow in place (the fitted elbow within `HELD` of its place, as far as
 * upright) is refused with the angle it holds. The winner's trunk holds its
 * lean; the loser's bends toward the pin as the pin comes, by the force
 * exchanged (`HumanForceTrunk`): its shoulder resists at its eccentric
 * internal-rotation peak per body mass (Tasiopoulos et al. 2018, provisional
 * beyond men at 60 degrees a second) and its trunk holds that torque at the
 * side-bending share its stiffness gives (Watt, Callaway and Williams 2022),
 * but no further than keeps its elbow on the pad, which the sport's rules hold
 * down throughout (World Armwrestling Federation rules: lifting the elbow off
 * the pad is a foul): the shoulder stays an upper arm, within `HELD`, from the
 * elbow's place. The author declares the winner (outcome-first rule).
 *
 * First pass: the elbow's bearing on the table is not declared as a contact
 * window, the fingers are left as they were and do not clasp, and the free hand
 * hangs.
 */
export namespace armWrestle {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "armWrestle";

  /** Cancel table: a contest is left once the hands part. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * How far apart the two clasped wrists stand across the table, metres
   * (provisional: about a hand's breadth).
   */
  export const GAP: number = 0.08;

  /**
   * How far the forearms sway through the struggle, degrees either way
   * (provisional).
   */
  export const SWAY: number = 8;

  /**
   * How far from upright the forearms end at the pin when none is asked,
   * degrees (provisional: the back of the loser's hand a hand's breadth off the
   * table).
   */
  export const PIN: number = 70;

  /**
   * How much further from its place on the table's top than with the forearm
   * upright the displayed elbow may lie for a pin's angle to count as held,
   * metres (the campaign's contact bound).
   */
  export const HELD: number = 0.015;

  /**
   * Plan one role of an arm wrestle.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the struggle's length is negative, no lean from
   *   the hips puts the shoulder an upper arm from the elbow's place on the
   *   table, or the pin's angle lies outside 0 to 90 degrees or past what this
   *   arm holds with its elbow in place.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanArmWrestle.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanArmWrestle.IParams = context.params;
    const body = context.body;
    const struggle: number = p.seconds ?? 3;
    HumanBound.least("seconds", struggle, 0, "s");
    const side: AutoMovieHumanSide = "right";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      p.partner,
    );
    const partner: IAutoMovieMotionHumanActionContext["body"] = other.body;
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}Hand`]);
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}UpperArm`]);
    const elbowBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([`${side}LowerArm`]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();

    // The arm's two lengths are this body's own, between its rest joints: the
    // elbow falls on its place only on the circle those lengths allow.
    const span = (
      of: typeof body,
      from: PlanSpanFrom,
      to: PlanSpanTo,
    ): number =>
      Vector3.distance(
        of.rest.get(`${side}${to}`)!,
        of.rest.get(`${side}${from}`)!,
      );
    const upperArm: number = span(body, "UpperArm", "LowerArm");
    const forearm: number = span(body, "LowerArm", "Hand");

    // The shared geometry: `own` is the level unit from the table's point
    // toward this performer, `left` the winner's left, where the hands go.
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const own: IAutoMovieVector3 = Vector3.normalize({
      x: entry.root.x - p.table.x,
      y: 0,
      z: entry.root.z - p.table.z,
    });
    const left: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(up, own),
      p.wins ? -1 : 1,
    );
    const height: number =
      0.85 * Math.min(forearm, span(partner, "LowerArm", "Hand"));
    const reach: number = Math.sqrt(forearm ** 2 - height ** 2);
    const nominal: IAutoMovieVector3 = Vector3.add(
      p.table,
      Vector3.scale(own, GAP / 2 + reach),
    );
    const pad: HumanMaterialContact.ISite | undefined =
      p.pad === undefined
        ? undefined
        : HumanMaterialContact.prepare(
            context.prop(p.pad.prop),
            p.pad.point,
            context.start,
          );
    if (p.pad !== undefined && pad === undefined) throw padRefusal(p.pad.point);
    if (
      pad !== undefined &&
      Quaternion.rotateVectorY(
        pad.at(context.start).frame.rotation,
        HumanMaterialContact.NORMAL,
      ) <
        1 - 1e-12
    )
      throw padRefusal(p.pad?.point);
    const elbow: IAutoMovieVector3 =
      pad === undefined
        ? nominal
        : {
            ...nominal,
            y:
              pad.at(context.start).frame.position.y +
              body.measure.forearmRadius,
          };

    // The wrist with the forearm turned by an angle about the elbows' line.
    const wrist = (degrees: number): IAutoMovieVector3 => {
      const angle: number = (degrees * Math.PI) / 180;
      return Vector3.add(
        Vector3.add(nominal, Vector3.scale(own, -reach)),
        Vector3.add(
          Vector3.scale(up, height * Math.cos(angle)),
          Vector3.scale(left, height * Math.sin(angle)),
        ),
      );
    };

    // The lean that puts the shoulder an upper arm from the elbow.
    const leaned = (
      pitch: number,
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanLean.tip(body, posture, pitch, 0);

    // A posture with the arm asked onto the wrist's place at a turn, the
    // elbow hinted onto the table. No hand rotation is asked: the fit gives
    // up the hinted plane before the hand's turn when the forearm's range
    // cannot give both (`resolveHumanPosture`: it searches bend planes when
    // the hinted one misses), and the elbow on the table is the contact the
    // contest is about, so the hand turns as the arm leaves it.
    const armed = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture => ({
      ...posture,
      limbs: {
        ...posture.limbs,
        [`${side}Arm`]: { point: wrist(degrees), bend: elbow },
      },
    });

    // The lean: the shoulder an upper arm from the elbow. The trunk follows
    // the arm only as the force between the two bends it: the
    // loser's trunk takes the torque its shoulder resists with, and bends
    // toward the pin until its stiffness holds it (`HumanForceTrunk`).
    const shoulders: ReturnType<typeof HumanTrunk.prepareResolve> =
      HumanTrunk.prepareResolve(body, shoulderBones);
    const short = (pitch: number): number =>
      Vector3.distance(
        shoulders(leaned(pitch, entry), resolution).get(`${side}UpperArm`)!
          .worldPosition,
        elbow,
      ) - upperArm;
    // The lean is searched from 20 degrees back to 70 forward of upright
    // (provisional: a standing trunk's working range over a table), and
    // bisected 24 times, to 90 / 2^24 of a degree.
    const low: number = -20;
    const high: number = 70;
    const below: number = short(low);
    const above: number = short(high);
    if (!(below * above <= 0))
      throw new HumanRefusal({
        kind: "reach",
        axis: "table",
        value: `${(above * 1000).toFixed(0)} mm`,
        feasible: {
          kind: "alternatives",
          values: [
            "a table nearer the shoulder's height",
            "a seat at the table",
          ],
        },
        reason: `No lean from the hips puts the shoulder an upper arm from the elbow's place on the table: it stays ${(below * 1000).toFixed(0)} mm off leaning 20 degrees back and ${(above * 1000).toFixed(0)} mm off leaning 70 degrees forward`,
        fix: "sit the performer at the table, or give a table point nearer the shoulder",
      });
    const lean: number = AutoMovieEngineMath.bracketedBisection(
      (pitch: number): boolean => below * short(pitch) > 0,
      low,
      high,
      (high - low) / 2 ** 24,
    );

    // The body at a turn: leant, the arm on its goal.
    const set = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
      envelope: number,
    ): IAutoMovieMotionHumanPosture =>
      armed(leaned(lean * envelope, posture), degrees);
    // The pin stops at this arm's own range: past it the arm leaves the
    // elbow's place for its other solution, which only a force would do. The
    // place is read whole, its height and its position on the top: an arm
    // that slides its elbow along the top has left it too.
    const asked: number = p.pin ?? PIN;
    HumanBound.within("pin", asked, 0, 90);
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const elbows: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      elbowBones,
    );
    const off = (degrees: number): number =>
      Vector3.distance(
        elbows(
          resolveHumanPosture.seeded(
            body,
            set(entry, degrees, 1),
            undefined,
            {},
            resolution,
            undefined,
            projection,
          ).pose,
          resolution(),
        ).get(`${side}LowerArm`)!.worldPosition,
        elbow,
      );
    const upright: number = off(0);
    const pinGap: number = off(asked);
    if (!(pinGap <= upright + HELD)) {
      // What the fit made of the arm, for the refusal: the displayed
      // shoulder's distance to the elbow's place and the upper arm's
      // clinical angles, upright and at the asked angle.
      const read = (degrees: number): string => {
        const pose: ReturnType<typeof resolveHumanPosture> =
          resolveHumanPosture.seeded(
            body,
            set(entry, degrees, 1),
            undefined,
            {},
            resolution,
            undefined,
            projection,
          ).pose;
        const shoulder: IAutoMovieVector3 = poseBones(
          body,
          pose,
          resolution(),
          shoulderBones,
        ).get(`${side}UpperArm`)!.worldPosition;
        const joint = pose.joints.find(
          (j): boolean => j.bone === `${side}UpperArm`,
        );
        const at: IAutoMovieVector3 = wrist(degrees);
        const v = (q: IAutoMovieVector3): string =>
          `(${q.x.toFixed(4)}, ${q.y.toFixed(4)}, ${q.z.toFixed(4)})`;
        return `at ${degrees} degrees the wrist is asked at ${v(at)}, turned about the elbows' line through ${v(elbow)} along ${v(own)}, the elbow hinted at ${v(elbow)}, and the shoulder lies ${(Vector3.distance(shoulder, elbow) * 1000).toFixed(0)} mm from the elbow's place (the upper arm is ${(upperArm * 1000).toFixed(0)} mm) and the upper arm stands at flexion ${(joint?.flexion ?? NaN).toFixed(0)}, abduction ${(joint?.abduction ?? NaN).toFixed(0)}, twist ${(joint?.twist ?? NaN).toFixed(0)} degrees`;
      };
      let most: number = 0;
      for (let degrees: number = 5; degrees < asked; degrees += 5)
        if (off(degrees) <= upright + HELD) most = degrees;
        else break;
      throw new HumanRefusal({
        kind: "reach",
        axis: "pin",
        value: asked,
        feasible: { kind: "range", minimum: 0, maximum: most, unit: "degrees" },
        reason: `With the forearm ${asked} degrees from upright the elbow leaves its place on the table's top by ${(pinGap * 1000).toFixed(0)} mm, against ${(upright * 1000).toFixed(0)} mm upright: the arm holds the place up to ${most} degrees (${read(0)}; ${read(asked)})`,
        fix: "ask a pin within that angle for both roles; an arm forced past its range is not this law's",
      });
    }

    // The clock: reach and set, go, the struggle, the pin, its hold, leave.
    const from: IAutoMovieVector3 = poseBones(
      body,
      context.entry.pose,
      resolution(),
      requested,
    ).get(`${side}Hand`)!.worldPosition;
    // Both roles set together: the longer of the two hands' transports, the
    // partner's hand read where it is as this role starts.
    const theirs: IAutoMovieVector3 = Vector3.add(
      Vector3.add(p.table, Vector3.scale(own, -GAP / 2)),
      Vector3.scale(up, height),
    );
    const arrive: number = Math.max(
      AutoMovieMotionHumanTiming.transport(Vector3.distance(wrist(0), from)),
      AutoMovieMotionHumanTiming.transport(
        Vector3.distance(
          theirs,
          other.bones(context.start, requested).get(`${side}Hand`)!
            .worldPosition,
        ),
      ),
    );
    const go: number = arrive + 0.3;
    const turn: number = go + struggle;
    const pin: number = turn + 0.4;
    const relax: number = pin + 0.5;
    const duration: number = relax + arrive;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const begin: IAutoMovieMotionHumanArmAngles.IAngles =
      AutoMovieMotionHumanArm.angles(context.entry.pose, side);

    // The loser's trunk at the pin: its shoulder's resisting torque, at its
    // eccentric peak per body mass, held by the trunk's side-bending
    // stiffness; the pin goes toward the winner's left, the loser's own
    // arm side.
    const resisted: number = p.wins
      ? 0
      : HumanForceTrunk.share(
          HumanForceTrunk.ROTATION * body.massModel.mass,
          HumanForceTrunk.range(body, side),
        );
    // The elbow stays on the pad throughout (World Armwrestling Federation
    // rules: an elbow lifted off the pad is a foul), so the trunk bends no
    // further than keeps the shoulder an upper arm, within `HELD`, from the
    // elbow's place at the pin: the share of the resisted bend the planted
    // elbow allows, bisected on the shoulder's distance alone.
    const lifts = (share: number): boolean =>
      Math.abs(
        Vector3.distance(
          shoulders(
            HumanTrunkTurn.turned(
              body,
              set(entry, asked, 1),
              resisted * share,
              side,
            ),
            resolution,
          ).get(`${side}UpperArm`)!.worldPosition,
          elbow,
        ) - upperArm,
      ) > HELD;
    const bend: number =
      resisted > 0 && lifts(1)
        ? resisted *
          AutoMovieEngineMath.bracketedBisection(
            (share: number): boolean => !lifts(share),
            0,
            1,
            2 ** -24,
          )
        : resisted;
    // The carry, solved at knots from the plan's own posture once the
    // performance is prepared.
    const carrier: AutoMovieMotionHumanArmJointCourse.ICarrier =
      AutoMovieMotionHumanArmJointCourse.carrier(body);
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration,
      events: [
        { name: "set", share: arrive / duration },
        { name: "go", share: go / duration },
        { name: "pin", share: pin / duration },
        { name: "relax", share: relax / duration },
      ],
      contacts: base.contacts,
      hands: [side],
      posture: (
        seconds: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const envelope: number =
          t < arrive
            ? minimumJerk.share(t / arrive)
            : t <= relax
              ? 1
              : 1 - minimumJerk.share((t - relax) / arrive);
        const degrees: number =
          t <= go
            ? 0
            : t <= turn
              ? SWAY * Math.sin((2 * Math.PI * (t - go)) / 1.5)
              : t <= pin
                ? SWAY * Math.sin((2 * Math.PI * struggle) / 1.5) +
                  (asked - SWAY * Math.sin((2 * Math.PI * struggle) / 1.5)) *
                    minimumJerk.share((t - turn) / (pin - turn))
                : asked;
        const pinned: number =
          t <= turn
            ? 0
            : t <= pin
              ? minimumJerk.share((t - turn) / (pin - turn))
              : 1;
        const posed: IAutoMovieMotionHumanPosture = set(
          base.posture(t, undefined, source, projection),
          degrees,
          envelope,
        );
        return carrier.carry(t, {
          posture:
            bend > 0
              ? HumanTrunkTurn.turned(
                  body,
                  posed,
                  bend * pinned * envelope,
                  side,
                )
              : posed,
          sides: ["right"],
          held: { right: begin },
          share: envelope,
        });
      },
    };
    if (pad !== undefined) {
      const measure: ReturnType<typeof HumanMaterialContact.preparePosture> =
        HumanMaterialContact.preparePosture(body, elbowBones);
      const bearing = (
        time: number,
      ): IAutoMovieMotionHumanContactWindow.IMaterial | undefined =>
        measure(plan.posture(time), pad.at(context.start + time));
      const material: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
        bearing(arrive);
      if (material === undefined || Math.abs(material.clearance) > HELD)
        throw padRefusal(p.pad?.point);
      const check: number[] = [go, turn, pin, relax];
      // The struggle's sine reversals and zeroes are its prepared branches.
      for (let time: number = go + 1.5 / 4; time < turn; time += 1.5 / 4)
        check.push(time);
      for (const time of check) {
        const candidate:
          | IAutoMovieMotionHumanContactWindow.IMaterial
          | undefined = bearing(time);
        if (
          candidate === undefined ||
          Math.abs(candidate.clearance) > HELD ||
          Vector3.distance(material.point, candidate.point) > HELD
        )
          throw padRefusal(p.pad?.point);
      }
      plan.contacts = [
        ...plan.contacts,
        {
          part: "rightLowerArm",
          kind: "bear",
          region: "elbowRight",
          from: arrive / duration,
          to: relax / duration,
          support: pad.support,
          material,
        },
      ];
    }
    plan.prepare = (): void => {
      base.prepare?.();
      // The envelope's two ramps, the stretches the arm is carried on.
      carrier.prepare(
        [
          [0, arrive],
          [relax, Math.min(duration, relax + arrive)],
        ],
        plan.posture,
      );
    };
    return plan;
  }
}

/** The alternatives of `PlanSpanTo`'s site. */
type PlanSpanTo = "LowerArm" | "Hand";

/** The alternatives of `PlanSpanFrom`'s site. */
type PlanSpanFrom = "UpperArm" | "LowerArm";

/** A proposed pad cannot bear the displayed elbow through the contest. */
function padRefusal(point: string | undefined): HumanRefusal {
  return new HumanRefusal({
    kind: "reach",
    axis: "pad",
    value: point,
    reason: "the elbow cannot hold contact on the named finite pad",
    fix: "place the pad under the displayed elbow or choose a reachable pin",
  });
}
