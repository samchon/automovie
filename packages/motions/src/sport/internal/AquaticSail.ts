import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../../audit/internal/AutoMovieMotionHumanAuditSkin";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { poseBones } from "../../posture/internal/poseBones";
import { AquaticCrew } from "./AquaticCrew";
import { AquaticPosture } from "./AquaticPosture";
import { AquaticSailBounds } from "./AquaticSailBounds";
import { AquaticSailPosture } from "./AquaticSailPosture";

/*
 * Dinghy tack and near-side recovery when a tack is aborted. The visible foot
 * transfers follow World Sailing Racing Rules 13 and 42 and Schutt (2017). The
 * sailors cross the boat crouched, facing the way they entered. On a craft that
 * declares its handles, each sailor's hand reaches its control by the helm-in
 * instant and holds it on the posed rig while the helm's own drives swing the
 * rudder and boom; on a craft with a standing area for the role the forefoot
 * bears on it and the sailor stays crouched below the boom. The crew's foot
 * transfers lead the helm's.
 */
export namespace AquaticSail {
  /*
   * Two discrete foot transfers, or a near-side recovery when the helm aborts.
   */
  export function plan(
    context: AquaticPosture.Context,
    aborted: boolean,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params }: AquaticPosture.Context = context;
    const hull: AquaticCrew.IHull = AquaticCrew.bind(context, true);
    const carrier: IAutoMovieMotionHumanPropReader = context.prop(hull.id);
    const affordances: readonly IAutoMovieAffordance[] =
      carrier.prop.affordances ?? [];

    // Controls the craft declares as handles are held through its posed rig;
    // the other named grips are placed points the crew law already tracks.
    const controls: readonly AquaticSailBounds.IControl[] = (
      ["left", "right"] as const
    ).flatMap((side: AquaticCrew.Side): AquaticSailBounds.IControl[] => {
      const handle: string | undefined =
        side === "left" ? params.leftGrip : params.rightGrip;
      return handle !== undefined &&
        affordances.some(
          (contact: IAutoMovieAffordance): boolean =>
            contact.id === handle && contact.kind === "handle",
        )
        ? [{ side, handle }]
        : [];
    });
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const legsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["leftUpperLeg", "rightUpperLeg"]);
    const shouldersAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["leftUpperArm", "rightUpperArm"]);
    const duration: number = 3.65;
    const helm: boolean = params.role !== "crew";

    // A craft with a standing area for this role supports the forefoot on it.
    const deck: boolean = affordances.some(
      (site: IAutoMovieAffordance): boolean =>
        site.id === (helm ? "helmDeck" : "crewDeck") && site.kind === "surface",
    );
    const lead: AquaticCrew.Side = params.side ?? "left";
    const trail: AquaticCrew.Side = lead === "left" ? "right" : "left";
    const enteredHips: IAutoMovieVector3 = poseBones(
      body,
      entry.pose,
      undefined,
      new Set(["hips"]),
    ).get("hips")!.worldPosition;
    const hips: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      hull.inverse,
      AutoMovieEngineVector3.subtract(enteredHips, hull.origin.position),
    );
    const initialSide: number =
      params.side === undefined
        ? Math.sign(hips.x) || 1
        : lead === "left"
          ? 1
          : -1;
    // A tack mirrors the entered pelvis across the centreline, at least a
    // provisional 0.15 of stature out to clear the centreboard case.
    const cross: number =
      -initialSide *
      Math.max(Math.abs(hips.x), body.measure.stature * 0.15) *
      (aborted ? 1 : 2);
    const leadStart: number = helm ? 0.29 : 0.21;
    const leadEnd: number = leadStart + 0.21;
    const trailStart: number = aborted ? 0.58 : leadEnd + 0.02;
    const trailEnd: number = trailStart + 0.19;
    const clearance: number = body.measure.stature * 0.075;
    // The sailor's own forward in the hull frame, level, and how far a
    // crossing foot passes in front of the standing shank: two shank radii
    // (the two shanks' surfaces meet) and the skin's give the audits allow.
    const facing: IAutoMovieVector3 = AquaticCrew.direction(context, hull, {
      x: 0,
      y: 0,
      z: 1,
    });
    const ahead: IAutoMovieVector3 = AutoMovieEngineVector3.normalize({ ...facing, y: 0 });
    const passing: number =
      2 * body.measure.shankRadius + AutoMovieMotionHumanAuditSkin.BUILT;

    const plants: IAutoMovieMotionHumanContactWindow[] = [
      AquaticCrew.bear(hull.id, `${lead}Foot`, "plant", 0, leadStart),
      AquaticCrew.bear(
        hull.id,
        `${lead}Foot`,
        "plant",
        leadEnd,
        aborted ? trailStart : 1,
      ),
      AquaticCrew.bear(
        hull.id,
        `${trail}Foot`,
        "plant",
        0,
        aborted ? 1 : trailStart,
      ),
      AquaticCrew.bear(
        hull.id,
        aborted ? `${lead}Foot` : `${trail}Foot`,
        "plant",
        trailEnd,
        1,
      ),
    ];
    // On a deck a foot rolls on its forefoot for `EASE` before it lifts and
    // after it lands, the heel off and the toes flat (below): it bears there
    // as a pivot, not a flat plant.
    const rocker = (
      window: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow[] => {
      // A short plant (an aborted step's) rolls over at most a third of it
      // at each end, so its flat bearing keeps a third.
      const roll: number = Math.min(
        AquaticSailBounds.EASE / duration,
        (window.to - window.from) / 3,
      );
      const from: number = window.from > 0 ? window.from + roll : window.from;
      const to: number = window.to < 1 ? window.to - roll : window.to;
      return [
        ...(from > window.from
          ? [{ ...window, kind: "pivot" as const, to: from }]
          : []),
        { ...window, from, to },
        ...(to < window.to
          ? [{ ...window, kind: "pivot" as const, from: to }]
          : []),
      ];
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      // A deck foot bears on its held ball (`socket`), which the slip and
      // lift audits read, while its heel rises about it.
      ...(deck
        ? plants.flatMap(rocker).map(
            (
              window: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow => ({
              ...window,
              socket: "ball",
            }),
          )
        : plants),
      // A hand takes its handle control at the helm-in instant, after it
      // has reached there from the entered pose; placed grips hold from entry.
      ...AquaticCrew.grips(hull, params).map(
        (
          window: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow =>
          controls.some(
            (control: AquaticSailBounds.IControl): boolean =>
              window.part === `${control.side}Hand`,
          )
            ? { ...window, from: AquaticSailBounds.HELM_IN }
            : window,
      ),
    ];

    const upright: IAutoMovieMotionHumanPosture = entry.posture;
    const drives: IAutoMovieMotionPropDrive[] = [];
    if (helm && params.boom !== undefined) {
      // A boom at its rest on the centreline is first sheeted out to the
      // close-hauled angle on the leeward side, away from the helm. A boom
      // entered off the centreline keeps its own trim. The tack then swings
      // it to the mirrored trim; an abort luffs it part way and bears away.
      const entered: number = hull.travel(params.boom);
      const trim: number =
        entered !== 0 ? entered : initialSide * AquaticSailBounds.CLOSE_HAULED;
      drives.push({
        prop: hull.id,
        articulation: params.boom,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          const sheeted: number =
            entered +
            (trim - entered) *
              AquaticCrew.span(u, 0, AquaticSailBounds.HELM_IN);
          return aborted
            ? sheeted *
                (1 -
                  0.65 *
                    (AquaticCrew.span(u, AquaticSailBounds.HELM_IN, leadEnd) -
                      AquaticCrew.span(u, trailStart, trailEnd)))
            : sheeted * (1 - 2 * AquaticCrew.span(u, leadStart, trailEnd));
        },
      });
    }
    if (helm && params.rudder !== undefined) {
      const start: number = hull.travel(params.rudder);
      drives.push({
        prop: hull.id,
        articulation: params.rudder,
        from: 0,
        to: 1,
        travel: (t: number): number => {
          const u: number = t / duration;
          // Pushing the tiller away from the helm's side turns the bow
          // toward that side, through the wind.
          return (
            start -
            initialSide *
              18 *
              (AquaticCrew.span(u, AquaticSailBounds.HELM_IN, leadStart) -
                AquaticCrew.span(u, leadEnd, trailEnd))
          );
        },
      });
    }
    // A handle carried on a universal joint (a hinged tiller extension, a
    // sheet's tail from its block): the hand carries it. The joint is the
    // handle's `rides` chain, a lift hinge on a swing wheel; their drives aim
    // the handle from the joint at a hand point ahead of the chest on the
    // holding side. A hand point nearer the joint than the handle's own
    // radius raises the line upright over it, so it never points into the
    // sailor.
    for (const control of controls) {
      const find = (id: string | undefined): IAutoMovieAffordance | undefined =>
        affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
      const handle: IAutoMovieAffordance | undefined = find(control.handle);
      const lift: IAutoMovieAffordance | undefined = find(handle?.rides);
      const swing: IAutoMovieAffordance | undefined = find(lift?.rides);
      if (
        lift?.kind !== "hinge" ||
        swing?.kind !== "wheel" ||
        carrier.prop.articulate === undefined
      )
        continue;
      const parent: IAutoMovieMotionPropDrive | undefined = drives.find(
        (drive: IAutoMovieMotionPropDrive): boolean =>
          drive.articulation === swing.rides,
      );
      const size: number = body.measure.stature;
      const offset: IAutoMovieVector3 = AquaticCrew.direction(context, hull, {
        x:
          (control.side === "left" ? 1 : -1) *
          AquaticSailBounds.HAND_SIDE *
          size,
        y: AquaticSailBounds.HAND_UP * size,
        z: AquaticSailBounds.HAND_FORE * size,
      });
      const posed = (
        state: Readonly<Record<string, number>>,
        id: string,
      ): IAutoMovieTransform =>
        carrier.prop.articulate!(state).affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === id,
        )!.frame;
      const heading = (d: IAutoMovieVector3): number =>
        (Math.atan2(d.x, d.z) * 180) / Math.PI;
      const elevation = (d: IAutoMovieVector3): number =>
        (Math.atan2(d.y, Math.hypot(d.x, d.z)) * 180) / Math.PI;
      const from = (
        state: Readonly<Record<string, number>>,
      ): IAutoMovieVector3 =>
        AutoMovieEngineVector3.subtract(
          posed(state, control.handle).translation,
          posed(state, swing.id).translation,
        );

      // The rest line, the handle's radius and the articulations' senses
      // are read from the model's own posing.
      const rest: IAutoMovieVector3 = from({});
      const radius: number = AutoMovieEngineVector3.length(rest);
      const swingSign: number =
        Math.sign(heading(from({ [swing.id]: 10 })) - heading(rest)) || 1;
      const liftSign: number =
        Math.sign(elevation(from({ [lift.id]: 10 })) - elevation(rest)) || 1;
      const restSwing: IAutoMovieTransform = posed({}, swing.id);
      const aim = (t: number): IAutoMovieVector3 => {
        const u: number = t / duration;
        const stride: number = aborted
          ? AquaticCrew.span(u, leadStart, leadEnd) -
            AquaticCrew.span(u, trailStart, trailEnd)
          : (AquaticCrew.span(u, leadStart, leadEnd) +
              AquaticCrew.span(u, trailStart, trailEnd)) /
            2;
        const hand: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          {
            x: hips.x + cross * (aborted ? 0.48 : 1) * stride,
            y:
              hips.y -
              size *
                AquaticSailBounds.CROUCH *
                AquaticCrew.span(u, 0, AquaticSailBounds.HELM_IN),
            z: hips.z,
          },
          offset,
        );
        // Read in the hull's own model frame from the model's posing alone,
        // so the drive never reads the prop it is driving.
        const joint: IAutoMovieTransform =
          parent === undefined
            ? restSwing
            : posed({ [parent.articulation]: parent.travel(t) }, swing.id);
        const d: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.multiply(
            restSwing.rotation,
            AutoMovieEngineQuaternion.inverse(joint.rotation),
          ),
          AutoMovieEngineVector3.subtract(hand, joint.translation),
        );
        const level: number = radius ** 2 - d.x ** 2 - d.z ** 2;
        return level > d.y ** 2 ? { ...d, y: Math.sqrt(level) } : d;
      };
      drives.push(
        {
          prop: hull.id,
          articulation: swing.id,
          from: 0,
          to: 1,
          travel: (t: number): number =>
            swingSign * (((heading(aim(t)) - heading(rest) + 540) % 360) - 180),
        },
        {
          prop: hull.id,
          articulation: lift.id,
          from: 0,
          to: 1,
          travel: (t: number): number =>
            liftSign * (elevation(aim(t)) - elevation(rest)),
        },
      );
    }
    const plan: IAutoMovieMotionHumanActionPlan = AquaticSailPosture({
      duration,
      contacts,
      drives,
      leadStart,
      leadEnd,
      aborted,
      trailStart,
      trailEnd,
      deck,
      upright,
      body,
      initialSide,
      helm,
      hull,
      lead,
      trail,
      swing,
      cross,
      clearance,
      ahead,
      passing,
      hips,
      hipsAt,
      context,
      plants,
      legsAt,
      controls,
      carrier,
      shouldersAt,
    });

    // Lay each controlled arm as one admitted course: it reaches from the
    // entered arm to its handle by the helm-in instant and holds it with
    // branch and swivel continuity through the maneuver.
    // Each arm reaches from the arm the law's own key holds at the start.
    const opening: IAutoMovieMotionHumanPosture = plan.posture(0);
    return controls.reduce(
      (
        laid: IAutoMovieMotionHumanActionPlan,
        control: AquaticSailBounds.IControl,
      ): IAutoMovieMotionHumanActionPlan =>
        courseArmGoal({
          context,
          plan: laid,
          side: control.side,
          rest: AquaticPosture.rest(body, opening, control.side),
          span: {
            start: 0,
            ready: AquaticSailBounds.HELM_IN * duration,
            relax: duration,
            end: duration,
          },
        }),
      plan,
    );
  }

  /*
   * An ankle's clearance pulse between release and replant.
   */
  function swing(at: number, from: number, to: number): number {
    return Math.sin(Math.PI * AquaticCrew.span(at, from, to)) ** 2;
  }
}
