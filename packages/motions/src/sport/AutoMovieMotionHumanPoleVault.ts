import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import { poleVaultLean } from "./poleVault/poleVaultLean";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGymnasticsTakeoff,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPoleVault,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkPoleFrame } from "../actions/internal/walkPoleFrame";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/internal/poseBones";
import { GymnasticsFlight } from "./GymnasticsFlight";
import { GymnasticsTakeoff } from "./GymnasticsTakeoff";
import { poleVaultFinish } from "./poleVault/poleVaultFinish";
import { poleVaultGrip } from "./poleVault/poleVaultGrip";
import { poleVaultOnLine } from "./poleVault/poleVaultOnLine";
import { poleVaultSwinging } from "./poleVault/poleVaultSwinging";
import { poleVaultTakeoffAngle } from "./poleVault/poleVaultTakeoffAngle";
import { poleVaultTakeoffFrame } from "./poleVault/poleVaultTakeoffFrame";
import { preparePoleVaultPlant } from "./poleVault/preparePoleVaultPlant";

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
 *    (`poleVaultTakeoffAngle`). Over it the hands carry the pole on from the
 *    run's drop (`plants`, `walkPoleCarriage`) to the plant: the top arm
 *    straight, raised until its forearm meets the pole at the grip's own
 *    neutral angle (`walkPoleFrame.plant`), no higher than lets the pole lean
 *    `LEAN` from upright, and the pole's end slides along the planting line,
 *    from where the run left it to the planted point on the floor ahead along
 *    the run, at the pole's length from that grip, each hand placed by its hold
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
export namespace AutoMovieMotionHumanPoleVault {
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
  export const LEAN: number = poleVaultLean;

  /** The least run-up speed a vault is planned from, m/s (provisional). */
  export const RUN: number = 1;

  /**
   * The most times the plant's wrist goal is corrected by the solved end's
   * height.
   */
  const PLANT: number = 4;

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
    const rise: number = (poleVaultTakeoffAngle(speed) * Math.PI) / 180;
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

    // The plant's shoulders, on the take-off's trunk (`poleVaultTakeoffFrame`).
    const { shoulders, root: rootT }: poleVaultTakeoffFrame.IFrame =
      poleVaultTakeoffFrame(body, takeoff, pole);
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
        poleVaultOnLine(tipFrom, slide, grip, length) ?? planted;
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

    // Linthorne's flexible pole (`poleVaultSwinging`), then the release, the
    // flight and the landing (`poleVaultFinish`).
    const {
      swing,
      bend,
      bow,
      swinging,
      swingGripOffset,
    }: poleVaultSwinging.ISwinging = poleVaultSwinging({
      body,
      p,
      held,
      pole,
      prop: context.prop(p.pole).prop,
      side,
      from,
      tipAt,
      gripAt,
      ahead,
      speed,
      takeoff,
      readGrip,
    });
    return poleVaultFinish({
      context,
      body,
      p,
      model,
      held,
      pole,
      side,
      tipAt,
      ahead,
      off,
      takeoff,
      readGrip,
      swing,
      bend,
      bow,
      swinging,
      swingGripOffset,
      pushing,
    });
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
   * swing it upright from a run (`poleVaultGrip`).
   */
  export const grip: typeof poleVaultGrip = poleVaultGrip;
}
