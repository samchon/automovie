import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPoleVault,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropLaunch,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkPoleFrame } from "../actions/walkPoleFrame";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { WorkoutSupport } from "../exercise/WorkoutSupport";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { HumanPostureRaw } from "../posture/HumanPostureRaw";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsMat } from "./GymnasticsMat";
import { GymnasticsTakeoff } from "./GymnasticsTakeoff";
import { poleVaultBend } from "./poleVaultBend";
import { poleVaultSwing } from "./poleVaultSwing";
import { prepareGymnasticsPlacement } from "./prepareGymnasticsPlacement";
import { preparePoleVaultPlant } from "./preparePoleVaultPlant";

/**
 * A pole vault: out of a run, the hand that holds the pole plants its end on
 * the floor ahead at the take-off, the body swings over the planted end with
 * the pole, lets go as the pole stands upright, and flies on to come down lying
 * on the landing surface.
 *
 * The pole is a held prop (`AutoMovieMotionHumanHeld`): taken up before, in one
 * hand or two (a vaulter's top hand and lower hand), and rigid in them. Its
 * planted end is the prop's `tip` affordance, or the one named.
 *
 * 1. Take-off: the jump's push-off (`GymnasticsTakeoff`) at the run's speed, kept,
 *    rising at the angle Linthorne and Weetman 2012 read from the run's speed
 *    (`takeoffAngle`). Over it the hands carry the pole on from the run's drop
 *    (`plants`, `walkPoleCarriage`) to the plant: the top arm straight, raised
 *    until its forearm meets the pole at the grip's own neutral angle
 *    (`walkPoleFrame.plant`), no higher than lets the pole lean `LEAN` from
 *    upright, and the pole's end slides along the planting line, from where the
 *    run left it to the planted point on the floor ahead along the run, at the
 *    pole's length from that grip, each hand placed by its hold
 *    (`walkPoleFrame`): the end comes down onto the plant from above and never
 *    passes through the floor, as a vaulter's tip falls onto the box as the top
 *    hand rises overhead (Coaches Insider, "Pole carry and drop").
 * 2. Swing, in the vault's plane, on a bending pole: Linthorne's flexible-pole
 *    model (`poleVaultSwing`; Linthorne 2000), the vaulter a point mass at the
 *    top hand's grip on a massless pole planted at its tip, integrated once at
 *    the paper's 0.01 s from the take-off's velocity, the plant's loss taken
 *    and the pole pushing along its chord until it recoils to its length, where
 *    the hand lets go. The pole's stiffness is its rating (`IParams.rating`),
 *    the vaulter's own weight when not given, the least a vaulter may use (NFHS
 *    Track and Field Rule 7-5-3: the vaulter's weight at or below the pole's
 *    rating). The pole shows the elastica of the swing's chord on its hinged
 *    chain (`poleVaultBend`, driven per hinge), so its tip stays planted; the
 *    body turns with the chord about the planted tip, as the point mass's pole
 *    does, its grip on the chain's own chord, and the hands hold the pole where
 *    the chain puts the held link, the arms taking its turn from the chord: the
 *    vaulter's arms are deflected backward relative to the shoulders as the
 *    pole bends (Linthorne 2000, "Take-off and pole plant phases"), as the
 *    multi-segment vaulters of Hubbard 1980 and Ekevad and Lundberg 1997 hang
 *    from the pole by the hands. A run too slow to swing the pole upright is
 *    refused.
 * 3. Flight: the centre on the parabola of its velocity at the release, the grip's
 *    velocity and the chord's turn, the body keeping the chord's rate, until
 *    its lowest shape meets the landing surface; then it lies there
 *    (`GymnasticsMat`), on its back or its front as its turn brought it.
 *
 * First pass: the vaulter is passive on the pole, as Linthorne's is, so there
 * is no inversion, no pull and turn and no push off the pole (a multi-axis
 * flight is not planned); the pole's own mass is left out; a hand that does not
 * hold the pole keeps the jump's arm swing; the released pole flies from the
 * velocity of its origin in the swing (`launches`) rather than pivoting on in
 * the box.
 *
 * Events: `takeoff` (the plant), `release`, `touchdown`, `settled`, `relax`.
 */
export namespace poleVault {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "poleVault";

  /** Cancel table: once lying, into rising. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      rise: ["fromRelax", "smooth"],
    });

  /** What may be cut into a vault: a run, at any instant. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  };

  /**
   * The least lean of the pole from upright at the plant, degrees
   * (provisional).
   */
  export const LEAN: number = 20;

  /** The least run-up speed a vault is planned from, m/s (provisional). */
  export const RUN: number = 1;

  /**
   * The most times the plant's wrist goal is corrected by the solved end's
   * height.
   */
  const PLANT: number = 4;

  /**
   * The halvings the grip's bisection takes: a pole's length to well under a
   * millimetre.
   */
  const SPLITS: number = 24;

  /**
   * Plan a pole vault.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no hand holds the pole, the run is slower than
   *   `RUN`, the pole cannot reach the floor, the run cannot bring the pole
   *   upright, or the body is not above the landing surface at the release.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPoleVault.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const p: IAutoMovieMotionHumanPoleVault.IParams = context.params;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      GymnasticsFlight.model(body);

    // The pole in the hands that hold it, the top hand (the farther from
    // the planted end) carrying it.
    const found: walkPoleFrame.IPole | undefined = walkPoleFrame(
      context,
      p.pole,
      p.end ?? "tip",
    );
    const side: AutoMovieHumanSide =
      found === undefined
        ? context.entry.holds.right === p.pole
          ? "right"
          : "left"
        : found.hands[0]!.side;
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      p.pole,
    );
    const end: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
      held,
      p.end ?? "tip",
    ).point;
    // Held, with its end: the reads above refuse otherwise.
    const pole: walkPoleFrame.IPole = found!;
    const length: number = Vector3.length(end);
    if (
      !held.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.kind === "hinge",
      )
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "pole",
        value: p.pole,
        reason:
          "a vaulting pole bends on its hinges as the vaulter swings on it, and this pole has none",
        fix: "vault with a pole that bends, such as createVaultingPole's",
      });
    const readGrip: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      HumanHand.frameBones(body, side, "grip"),
    );
    const entered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readGrip(context.entry.pose);
    const hand0: IAutoMovieResolvedBone = entered.get(`${side}Hand`)!;

    // The run: its speed kept, rising at its take-off angle.
    const run: IAutoMovieVector3 = {
      x: context.entry.velocity.linear.x,
      y: 0,
      z: context.entry.velocity.linear.z,
    };
    const speed: number = Vector3.length(run);
    if (speed < RUN)
      throw new HumanRefusal({
        kind: "base",
        axis: "run",
        value: speed,
        feasible: { kind: "range", minimum: RUN, maximum: null, unit: "m/s" },
        reason: `a pole vault is entered at a run, and the body moves at ${speed.toFixed(2)} m/s`,
        fix: "run into the vault",
      });
    const ahead: IAutoMovieVector3 = Vector3.scale(run, 1 / speed);
    const rise: number = (takeoffAngle(speed) * Math.PI) / 180;
    const climbCosine: number = Math.cos(rise);
    const takeoffVelocity: IAutoMovieVector3 = {
      x: ahead.x * speed * climbCosine,
      y: speed * Math.sin(rise),
      z: ahead.z * speed * climbCosine,
    };
    const takeoff: IAutoMovieMotionHumanGymnasticsTakeoff.ITakeoff =
      GymnasticsTakeoff(
        context,
        (): IAutoMovieVector3 => ({ ...takeoffVelocity }),
      );
    const off: number = takeoff.seconds;

    // The plant's shoulders, on the take-off's trunk.
    const shoulderBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>(
        pole.hands.map(
          (hand: walkPoleFrame.IHand): AutoMovieHumanoidBone =>
            `${hand.side}UpperArm`,
        ),
      );
    const { shoulders, root: rootT }: ITakeoffFrame = ((): ITakeoffFrame => {
      const resolution: ReturnType<typeof preparePoseResolution> =
        preparePoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> =
        prepareHumanPostureProjection(body);
      const raw: IAutoMovieMotionHumanPosture = takeoff.plan.posture(
        off,
        undefined,
        resolution,
        projection,
      );
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          body,
          resolveHumanPosture.seeded(
            body,
            raw,
            undefined,
            undefined,
            resolution,
            shoulderBones,
            projection,
          ).pose,
          resolution,
          shoulderBones,
        );
      const shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> =
        {};
      for (const hand of pole.hands)
        shoulders[hand.side] = bones.get(`${hand.side}UpperArm`)!.worldPosition;
      return { shoulders, root: raw.root };
    })();
    const shoulder: IAutoMovieVector3 = shoulders[side]!;
    const reach: number = body.measure.upperArm + body.measure.forearm;
    // The top arm straight at the plant, raised so its forearm meets the
    // pole at the grip's own neutral angle: a power grip holds the pole
    // across the palm at that angle with the wrist and the forearm twist
    // neutral, where an arm straight overhead asked the wrist past its
    // range (`walkPoleFrame.plant`).
    const stance: walkPoleFrame.IPlant | undefined = walkPoleFrame.plant(
      shoulder.y,
      reach,
      length,
      walkPoleFrame.neutral(pole),
      LEAN,
    );
    if (stance === undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "pole",
        value: length,
        reason: `the pole reaches ${length.toFixed(2)} m from the hand, too short to stand on the floor from a hand the arm can hold`,
        fix: "vault with a longer pole",
      });
    const high: number = stance.high;
    // The top hand's grip at the plant, along the straight arm ahead, and
    // the end on the floor ahead of it along the run.
    const raised: number = (stance.arm * Math.PI) / 180;
    const plantGrip: IAutoMovieVector3 = Vector3.add(
      shoulder,
      Vector3.add(Vector3.scale(ahead, reach * Math.cos(raised)), {
        x: 0,
        y: reach * Math.sin(raised),
        z: 0,
      }),
    );
    const planted: IAutoMovieVector3 = Vector3.add(
      { ...plantGrip, y: 0 },
      Vector3.scale(
        ahead,
        Math.sqrt(Math.max(0, length * length - high * high)),
      ),
    );

    // The push-off, both hands carrying the pole on from the run's drop to
    // the plant: the top hand's grip from the entry's to the plant's, laid
    // on the root, which runs on under it; the end sliding along the
    // planting line, from where the entry holds it to the planted point, at
    // the pole's length from that grip; each hand placed by its hold on the
    // pole's line (`walkPoleFrame`).
    const root0: IAutoMovieVector3 = context.entry.posture.root;
    const gripFrom: IAutoMovieVector3 = HumanHand.frame(
      body,
      entered,
      side,
      "grip",
    ).point;
    const tipFrom: IAutoMovieVector3 = Vector3.add(
      gripFrom,
      Quaternion.rotateVector(hand0.worldRotation, end),
    );
    const slide: IAutoMovieVector3 = Vector3.subtract(planted, tipFrom);
    const pathFrom: IAutoMovieVector3 = Vector3.subtract(gripFrom, root0);
    const pathTo: IAutoMovieVector3 = Vector3.subtract(plantGrip, rootT);
    // The plant's correction of the top wrist's height
    // (`preparePoleVaultPlant`), from the wrist the plant's line places.
    const wristPlant: IAutoMovieVector3 = walkPoleFrame.place(
      pole,
      plantGrip,
      Vector3.normalize(Vector3.subtract(planted, plantGrip)),
      (hand: AutoMovieHumanSide): IAutoMovieVector3 => shoulders[hand]!,
    )[0]!.wrist;
    let raise: number = 0;
    const pushing: (
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ) => IAutoMovieMotionHumanPosture = (
      t: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const base: IAutoMovieMotionHumanPosture = takeoff.plan.posture(
        t,
        undefined,
        resolution,
        projection,
      );
      const u: number = minimumJerk.share(t / off);
      const shift: IAutoMovieVector3 = Vector3.subtract(base.root, rootT);
      const grip: IAutoMovieVector3 = Vector3.add(
        Vector3.add(base.root, Vector3.lerp(pathFrom, pathTo, u)),
        { x: 0, y: raise * u, z: 0 },
      );
      const tip: IAutoMovieVector3 =
        onLine(tipFrom, slide, grip, length) ?? planted;
      return walkPoleFrame.write(
        base,
        walkPoleFrame.place(
          pole,
          grip,
          Vector3.normalize(Vector3.subtract(tip, grip)),
          (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
            Vector3.add(shoulders[hand]!, shift),
        ),
        (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
          AutoMovieMotionHumanBend.hang(body, base, hand),
      );
    };

    // The plant as solved: the arm may not turn the hand quite as asked, so
    // the pole's end lands where the solved hand puts it. The wrist goal is
    // raised or lowered by that end's height and solved again until the end
    // is on the floor, the hand's turn being nearly the same a few
    // centimetres away.
    const plantFit: ReturnType<typeof preparePoleVaultPlant> =
      preparePoleVaultPlant({
        body,
        model,
        side,
        end,
        height: wristPlant.y,
        passes: PLANT,
        posture: (
          height: number,
          resolution: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
          projection: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
        ): IAutoMovieMotionHumanPosture => {
          raise = height - wristPlant.y;
          return pushing(off, resolution, projection);
        },
      });
    const from: IAutoMovieMotionHumanPosture = plantFit.posture;
    const tipAt: IAutoMovieVector3 = plantFit.tip;
    const gripAt: IAutoMovieVector3 = plantFit.grip;

    // Linthorne's flexible pole (`poleVaultSwing`): the vaulter a point mass
    // at the top hand's grip, swung from the take-off's velocity on a pole as
    // stiff as its rating, the vaulter's own weight when none is given (NFHS
    // Rule 7-5-3).
    const reach0: IAutoMovieVector3 = Vector3.subtract(gripAt, tipAt);
    const radius0: poleVaultSwing.IPlane = {
      forward: Vector3.dot(reach0, ahead),
      up: reach0.y,
    };
    const swing: poleVaultSwing.ISwing = poleVaultSwing({
      radius: radius0,
      velocity: {
        forward: Vector3.dot(takeoff.velocity, ahead),
        up: takeoff.velocity.y,
      },
      mass: body.profile.mass,
      buckling: (p.rating ?? body.profile.mass) * poleVaultSwing.RATING,
      gravity: AutoMovieGravity.STANDARD,
      upright: 0,
      run: speed,
    });
    const bend: poleVaultBend.IBend = poleVaultBend(swing, held.affordances);
    const degrees: number = 180 / Math.PI;
    const chord0: number = Math.atan2(radius0.forward, radius0.up);
    // A direction in the vault's plane at an angle from upright toward the run.
    const towards: (angle: number) => IAutoMovieVector3 = (
      angle: number,
    ): IAutoMovieVector3 =>
      Vector3.add(Vector3.scale(ahead, Math.sin(angle)), {
        x: 0,
        y: Math.cos(angle),
        z: 0,
      });
    // A point turned about the planted tip in the vault's plane, toward the run.
    const about: (
      point: IAutoMovieVector3,
      angle: number,
    ) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
      angle: number,
    ): IAutoMovieVector3 => {
      const offset: IAutoMovieVector3 = Vector3.subtract(point, tipAt);
      const forth: number = Vector3.dot(offset, ahead);
      const aside: IAutoMovieVector3 = Vector3.subtract(
        offset,
        Vector3.add(Vector3.scale(ahead, forth), { x: 0, y: offset.y, z: 0 }),
      );
      return Vector3.add(
        Vector3.add(tipAt, aside),
        Vector3.add(
          Vector3.scale(
            ahead,
            forth * Math.cos(angle) + offset.y * Math.sin(angle),
          ),
          {
            x: 0,
            y: offset.y * Math.cos(angle) - forth * Math.sin(angle),
            z: 0,
          },
        ),
      );
    };
    // The pole bends away from the vaulter, toward the run's side of its
    // chord: its hinges turn the way that bows its `+Z` there, or the other
    // way when the hands hold it turned.
    const plantBones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readGrip(resolveHumanPosture(body, from));
    const bow: number =
      Vector3.dot(
        Quaternion.rotateVector(
          Quaternion.multiply(
            plantBones.get(side === "left" ? "leftHand" : "rightHand")!
              .worldRotation,
            held.frame.rotation,
          ),
          { x: 0, y: 0, z: 1 },
        ),
        towards(chord0 + Math.PI / 2),
      ) >= 0
        ? 1
        : -1;
    const turnFrom: ReturnType<typeof GymnasticsFlight.prepareTurned> =
      GymnasticsFlight.prepareTurned(from, tipAt);
    // The body turned with the chord about the planted tip, its grip on the
    // shown chain's chord, and the hands on the pole where the chain puts the
    // held link: the arms take that link's turn from the chord.
    const swinging: (t: number) => IAutoMovieMotionHumanPosture = (
      t: number,
    ): IAutoMovieMotionHumanPosture => {
      const at: poleVaultSwing.ISample = swing.at(t);
      const chord: number = Math.atan2(at.position.forward, at.position.up);
      const shown: poleVaultBend.IChain = bend.chain(t);
      const shift: IAutoMovieVector3 = Vector3.scale(
        towards(chord),
        shown.chord - swing.length,
      );
      const turned: IAutoMovieMotionHumanPosture = turnFrom(
        0,
        (chord - chord0) * degrees,
      );
      const base: IAutoMovieMotionHumanPosture = HumanPostureRaw.translated(
        turned,
        Vector3.add(turned.root, shift),
      );
      return walkPoleFrame.write(
        base,
        walkPoleFrame.place(
          pole,
          Vector3.addScaled(tipAt, towards(chord), shown.chord),
          Vector3.scale(towards(chord + shown.top), -1),
          (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
            Vector3.add(about(shoulders[hand]!, chord - chord0), shift),
        ),
        (hand: AutoMovieHumanSide): IAutoMovieVector3 =>
          AutoMovieMotionHumanBend.hang(body, base, hand),
      );
    };

    // The release: the grip's state where the pole has recoiled, the centre
    // carried with it at the chord's rate.
    const last: poleVaultSwing.ISample =
      swing.samples[swing.samples.length - 1]!;
    const omega: number =
      (last.position.up * last.velocity.forward -
        last.position.forward * last.velocity.up) /
      (last.position.forward ** 2 + last.position.up ** 2);
    const released: IAutoMovieMotionHumanPosture = swinging(swing.duration);
    const cr: IAutoMovieVector3 = GymnasticsFlight.centre(
      body,
      model,
      released,
    );
    const out: IAutoMovieVector3 = Vector3.subtract(
      cr,
      Vector3.add(
        Vector3.add(tipAt, Vector3.scale(ahead, last.position.forward)),
        {
          x: 0,
          y: last.position.up,
          z: 0,
        },
      ),
    );
    const forth: number = Vector3.dot(out, ahead);
    const velocity: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(ahead, last.velocity.forward + omega * out.y),
      { x: 0, y: last.velocity.up - omega * forth, z: 0 },
    );
    const placeFlight: ReturnType<typeof prepareGymnasticsPlacement> =
      prepareGymnasticsPlacement(body, model, released);
    const flying: (t: number) => IAutoMovieMotionHumanPosture = (
      t: number,
    ): IAutoMovieMotionHumanPosture =>
      placeFlight(
        {
          yaw: released.yaw,
          pitch: released.pitch + omega * degrees * t,
          roll: 0,
        },
        GymnasticsFlight.at(cr, velocity, t),
      );

    // The touchdown on the landing surface, and the landing.
    const surface: number =
      p.on === undefined
        ? 0
        : WorkoutSupport.at(context, { prop: p.on, affordance: "surface" }).y;
    const down: number = ((): number => {
      const [floorResolution, floorProjection]: [
        ReturnType<typeof preparePoseResolution>,
        ReturnType<typeof prepareHumanPostureProjection>,
      ] = [preparePoseResolution(), prepareHumanPostureProjection(body)];
      const readLowest: ReturnType<typeof GymnasticsFlight.prepareLowest> =
        GymnasticsFlight.prepareLowest(body);
      const lowest: (t: number) => number = (t: number): number =>
        readLowest(flying(t), floorResolution, floorProjection);
      const releaseLowest: number = lowest(0);
      if (!(releaseLowest > surface))
        throw new HumanRefusal({
          kind: "reach",
          axis: "on",
          value: surface,
          reason: `at the release the body's lowest point is at ${releaseLowest.toFixed(2)} m, no higher than the landing surface at ${surface.toFixed(2)} m`,
          fix: "land on a lower surface, or run faster",
        });
      const fallen: number = GymnasticsFlight.fall(cr.y, velocity.y, surface)!;
      return GymnasticsFlight.touchdown(0, fallen, lowest, surface);
    })();
    const landing: ReturnType<typeof GymnasticsMat.lie> = GymnasticsMat.lie({
      body,
      model,
      from: flying(down),
      velocity: {
        ...velocity,
        y: velocity.y - AutoMovieGravity.STANDARD * down,
      },
      height: surface,
    });

    const release: number = off + swing.duration;
    const touchdown: number = release + down;
    const settled: number = touchdown + GymnasticsMat.SETTLE;
    const duration: number = settled + GymnasticsMat.HOLD;
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...GymnasticsTakeoff.contacts(takeoff, duration),
      // Every holding hand grips the pole to the release, the top hand
      // first so it carries and the lower steadies (`HumanPerformanceHold`).
      ...pole.hands.map(
        (hand: walkPoleFrame.IHand): IAutoMovieMotionHumanContactWindow => ({
          part: hand.side === "left" ? "leftHand" : "rightHand",
          kind: "grip",
          from: 0,
          to: release / duration,
          support: { kind: "prop", subject: p.pole },
        }),
      ),
      {
        part: "back",
        kind: "lie",
        from: touchdown / duration,
        to: 1,
        support:
          p.on === undefined
            ? { kind: "ground" }
            : { kind: "prop", subject: p.on },
      },
    ];
    const events: IAutoMovieMotionEvent[] = [
      { name: "takeoff", share: off / duration },
      { name: "release", share: release / duration },
      { name: "touchdown", share: touchdown / duration },
      { name: "settled", share: settled / duration },
      { name: "relax", share: settled / duration },
    ];

    // The released pole leaves its held frame on the grip with the velocity
    // the rigid swing about the planted end gives its origin.
    const releasedGrip: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readGrip(resolveHumanPosture(body, released));
    const hand: IAutoMovieResolvedBone = releasedGrip.get(
      side === "left" ? "leftHand" : "rightHand",
    )!;
    const origin: IAutoMovieVector3 = Vector3.add(
      HumanHand.frame(body, releasedGrip, side, "grip").point,
      Quaternion.rotateVector(hand.worldRotation, held.frame.position),
    );
    const arm: IAutoMovieVector3 = Vector3.subtract(origin, tipAt);
    const launch: IAutoMovieMotionPropLaunch = {
      prop: p.pole,
      seconds: release,
      point: origin,
      velocity: Vector3.add(Vector3.scale(ahead, omega * arm.y), {
        x: 0,
        y: -omega * Vector3.dot(arm, ahead),
        z: 0,
      }),
      rotation: Quaternion.multiply(hand.worldRotation, held.frame.rotation),
    };

    // The pole's hinges, driven by the bend through the swing and turned the
    // way that bows it away from the vaulter (`bow`); straight again at the
    // release, where the last travel holds.
    const drives: IAutoMovieMotionPropDrive[] = bend.hinges.map(
      (articulation: string, k: number): IAutoMovieMotionPropDrive => ({
        prop: p.pole,
        articulation,
        from: off / duration,
        to: release / duration,
        travel: (seconds: number): number =>
          bow *
          bend.turn(k, Math.min(swing.duration, Math.max(0, seconds - off))),
      }),
    );
    return {
      duration,
      events,
      contacts,
      launches: [launch],
      drives,
      contact: off,
      base: { kind: "lying" },
      posture: (
        t: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        if (s <= off) return pushing(s, resolution, projection);
        if (s < release) return swinging(s - off);
        if (s < touchdown) return flying(s - release);
        return landing(s - touchdown, resolution, projection);
      },
    };
  }

  /**
   * What a vault plants as it is entered: the pole, by its planted end, at no
   * less than `LEAN` from upright, so the run cut into the vault lowers it over
   * its last strides (`walkPoleCarriage`).
   *
   * @param params The vault's parameters.
   * @returns The plant.
   */
  export function plants(
    params: IAutoMovieMotionHumanPoleVault.IParams,
  ): IAutoMovieMotionHumanActionLaw.IPlant {
    return { prop: params.pole, end: params.end ?? "tip", lean: LEAN };
  }

  /**
   * The farthest from the planted end the top hand can grip the pole and still
   * swing it upright from a run at `speed`: a pole stands only as far as the
   * run's energy carries the vaulter over the planted end (Linthorne 2000: the
   * grip height is "determined primarily by the kinetic energy at take-off"),
   * so a slower run grips lower, as coaches set a beginner's grip from the
   * approach speed.
   *
   * Each grip ℓ is planted as the vault plants (`walkPoleFrame.plant`, the
   * straight top arm at the body's power-grip angle, `walkPoleFrame.power`),
   * and its swing judged by the vault's own model (`poleVaultSwing.integrate`):
   * the grip behind the planted end at its plant height, the run's speed kept
   * and rising at its take-off angle (`takeoffAngle`), on a pole as stiff as
   * `rating`. A swing reaches the release for every grip up to one and for none
   * past it, so the grip is found by bisection on that monotone condition.
   *
   * @param body The vaulter's body.
   * @param side The top hand.
   * @param speed The run's speed, m/s (`run.speed`).
   * @param length The pole's whole length, metres: the farthest grip.
   * @param rating The pole's stiffness rating, kilograms; the vaulter's mass
   *   when absent (NFHS Rule 7-5-3).
   * @returns The grip's distance from the planted end, metres; the whole length
   *   when that already swings upright.
   * @throws {HumanRefusal} When no grip that plants swings upright at that
   *   speed.
   */
  export function grip(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    speed: number,
    length: number,
    rating?: number,
  ): number {
    // The body's own power-grip angle, as a grasp of the bar will hold it.
    const neutral: number = walkPoleFrame.power(body, side);
    const shoulder: number =
      body.rest.get(side === "left" ? "leftUpperArm" : "rightUpperArm")!.y -
      body.rest.get(side === "left" ? "leftFoot" : "rightFoot")!.y +
      body.measure.ankleHeight;
    const reach: number = body.measure.upperArm + body.measure.forearm;
    const rise: number = (takeoffAngle(speed) * Math.PI) / 180;
    const vf: number = speed * Math.cos(rise);
    const vy: number = speed * Math.sin(rise);
    const buckling: number =
      (rating ?? body.profile.mass) * poleVaultSwing.RATING;
    const swings: (l: number) => boolean = (l: number): boolean => {
      const at: walkPoleFrame.IPlant | undefined = walkPoleFrame.plant(
        shoulder,
        reach,
        l,
        neutral,
        LEAN,
      );
      if (at === undefined) return false;
      // The grip behind the planted end along the run, at its plant height.
      return (
        poleVaultSwing.integrate({
          radius: {
            forward: -Math.sqrt(Math.max(0, l * l - at.high * at.high)),
            up: at.high,
          },
          velocity: { forward: vf, up: vy },
          mass: body.profile.mass,
          buckling,
          gravity: AutoMovieGravity.STANDARD,
          upright: 0,
          run: speed,
        }).failure === null
      );
    };
    if (swings(length)) return length;
    // The shortest grip that still plants: its end on the floor from the
    // hand hanging straight down, leaning `LEAN`.
    let low: number = Math.max(
      0,
      (shoulder - reach) / Math.cos((LEAN * Math.PI) / 180),
    );
    let high: number = length;
    if (!swings(low))
      throw new HumanRefusal({
        kind: "base",
        axis: "run",
        value: speed,
        reason: `at ${speed.toFixed(2)} m/s no grip on the pole swings it upright`,
        fix: "run faster into the vault",
      });
    for (let k: number = 0; k < SPLITS; k++) {
      const middle: number = (low + high) / 2;
      if (swings(middle)) low = middle;
      else high = middle;
    }
    return low;
  }
}

/** The take-off's holding shoulders and root. */
interface ITakeoffFrame {
  /** Each holding arm's shoulder joint as the take-off solves it, world metres. */
  shoulders: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;

  /** The take-off's root, world metres. */
  root: IAutoMovieVector3;
}

/**
 * The point of the segment from `from` along `slide` at `length` from `grip`,
 * the farther along it of the two where the sphere about the grip meets the
 * segment's line, clamped to the segment; undefined when the sphere misses the
 * line.
 */
function onLine(
  from: IAutoMovieVector3,
  slide: IAutoMovieVector3,
  grip: IAutoMovieVector3,
  length: number,
): IAutoMovieVector3 | undefined {
  const a: number = Vector3.dot(slide, slide);
  if (!(a > 1e-12)) return undefined;
  const offset: IAutoMovieVector3 = Vector3.subtract(from, grip);
  const b: number = 2 * Vector3.dot(slide, offset);
  const c: number = Vector3.dot(offset, offset) - length * length;
  const discriminant: number = b * b - 4 * a * c;
  if (discriminant < 0) return undefined;
  const along: number = Math.max(
    0,
    Math.min(1, (-b + Math.sqrt(discriminant)) / (2 * a)),
  );
  return Vector3.add(from, Vector3.scale(slide, along));
}

/**
 * The take-off's rise above the horizontal at a run-up speed, degrees: the
 * regression over an athlete's run-ups from 4.5 to 8.5 m/s, `48.8 - 3.51 v`
 * (Linthorne and Weetman 2012, "Effects of run-up velocity on performance,
 * kinematics, and energy exchanges in the pole vault", J. Sports Sci. Med.
 * 11:245-254), about 19 degrees at a competition run-up of 8.4 m/s.
 */
function takeoffAngle(speed: number): number {
  return 48.8 - 3.51 * speed;
}
