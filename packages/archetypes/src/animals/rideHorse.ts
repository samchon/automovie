import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRefusal,
  ArchetypeRide,
} from "../core";
import { HorseChange } from "./HorseChange";
import { HorseGait } from "./HorseGait";
import { HorseLimb } from "./HorseLimb";
import { HorseMotion } from "./HorseMotion";
import { createHorse } from "./createHorse";

/**
 * A horse going along a course: its root on the path, its trunk rising and falling and its head nodding with the stride, its four limbs stepping in the gait's order, and its gait and lead changing with the speed or as the course's legs name them.
 *
 * The stride's timing is `HorseGait`'s at the course's speed for the horse's height at the withers, shifted by the horse's `tempo`; scaled from the measured horses by dynamic similarity, it is provisional, as `HorseGait.scale` states. Each hoof lands at its phase of the stride, stays planted for the duty factor's share of it while the body passes over, then swings forward, lifted clear of the ground, with its carpus or hock folded. A planted hoof stays where it landed on a straight leg at any speed, steady or changing, and across a change of gait; on a turn it is carried along the model's own fore-and-aft line, so it slides sideways by the turn's sagitta over one stance. The ride adds an instant for every landing, `leftForeOn`, `rightHindOn` and so on, which a rider's rising trot or a walker's step beside the horse locks to. The saddle, the stirrups and the reins ride the trunk, so `frame("seat", seconds)` is the moving support a rider sits on.
 *
 * The gait of each stride is the one a course leg names, else the one `gait` names, else the one the speed calls for at the change points `HorseChange` derives (walk to trot at the measured Froude number, trot to canter at the measured trot-gallop speed for the horse's mass, canter to gallop at the middle of the two gaits' measured ranges, provisional), going up above a change point by `HorseChange.HYSTERESIS` and coming down below it by as much, so a speed hovering at the boundary does not flip the gait every stride. A change is decided at the left fore's landing, the stride's start, and takes the next stride: each hoof's landing moves from the old gait's phase to the new one's, so a planted hoof stays planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead` for the canter and the gallop, whose right lead mirrors the left; a change of lead at a canter is a flying change, taken the same way and named `lead:<from>-<to>`.
 *
 * While the horse gathers speed from rest or slows to a halt, below the gait's slowest measured speed, the stride keeps that slowest speed's timing and the steps shorten with the speed.
 *
 * @param horse The horse.
 * @param course The course its root follows; a leg may name the `gait` and the `lead` it is ridden at.
 * @param gait The gait of every stride whose leg names none; absent, the speed chooses it.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the cruising speed lies outside a given gait's range for the horse's height, a leg's speed exceeds the range of the gait it names, giving the range, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, where the timing comes from, how the gait is chosen and changed, the instants added, what the support frame is and what happens below the gait's slowest speed.
 * @evidence contracts/development/implementation.md#principled-implementation Phase advances with time by one stride per stride time of the stride's own gait. Each hoof's landings are listed stride by stride at that stride's gait's phase, so across a change the gap to the next landing grows or shrinks and the swing between them stretches to meet it. A planted hoof is set back through the model by the distance the body has travelled since it landed, read from the course's plan; it lands half of its stance's travel ahead of its rest place, so the stance is centred under the joint that carries it. Each limb is solved in its own fore-and-aft plane as two links, the upper bone and the three lower bones held as one piece whose carpus or hock is folded by a set angle, the planar two-bone solution with the elbow kept behind and the stifle in front. The fold's peak is the joint's measured range (Back, Schamhardt and Barneveld 1996, Vet Q 18:79, Tables 1 and 2: carpus 68.7 degrees at walk and 90.8 at trot, tarsus 35.6 and 55.4), the trunk's rise and fall the measured withers range (Rhodin et al. 2022, Animals 12:3053, warmbloods: 33 mm at walk, 92 mm at trot), the head's pitch the measured head range timed to the footfalls (`HorseMotion.nod`, Dunbar et al. 2008, J Exp Biol 211:3889), each swinging hoof brought to its next landing by the minimum-jerk lift-and-place path (`HorseMotion.swing`), and the top joint follows the hoof by the share the scapula's and pelvis's measured swing gives it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the course, tabulate phase against time deciding each stride's gait at its start, list the landings, then one pose function: bob, nod, four limbs, new part transforms.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The canter's and gallop's fold and bob reuse the trot's and the gallop's nod the canter's, for want of a measured source; the canter-to-gallop change point, the walk-to-trot change's leg landmark and the hysteresis are named provisional values (`HorseChange`); the reins and the lead rope keep their rest lines while the head nods. A hoof beyond the limb's reach draws the limb's top joint along the trunk until it is within reach, so a planted hoof stays planted and no bone stretches; the walk's swing lift is an estimate and the faster gaits reuse the trot's measured one, both stated on its constant.
 * @evidence contracts/development/implementation.md#efficient-algorithms The phase table has `STEPS` rows over the running time, built once; a sample is one table read, a few binary searches of it per limb for the stances' ends, and four closed-form limb solutions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan, the phase table, the strides' gaits and the rest rig are shared by every sample; the ride samples the plan made here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the horse, the plan and the tables for as long as the caller keeps the ride.
 */
export function rideHorse(
  horse: Archetype<createHorse.Affordance, createHorse.Dimension>,
  course: rideHorse.ICourse,
  gait?: HorseGait.Gait,
): ArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension> {
  const tempo: number = horse.dimensions.tempo ?? 0;
  const withers: number = horse.dimensions.withersHeight!;
  if (gait !== undefined) HorseGait.timing(gait, course.cruise, tempo, withers);
  const paced = (
    which: HorseGait.Gait,
    speed: number,
  ): HorseGait.ITiming => {
    const limits: { minimum: number; maximum: number } = HorseGait.range(
      which,
      withers,
    );
    return HorseGait.timing(
      which,
      Math.max(limits.minimum, Math.min(limits.maximum, speed)),
      tempo,
      withers,
    );
  };
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("horse", course);

  // The leg holding each distance, and the gait and lead it names, by the legs the plan measured.
  const legAt = (distance: number): rideHorse.ILeg => {
    let k: number = 0;
    while (
      k < plan.legSpans.length - 1 &&
      distance >= plan.legSpans[k]!.from + plan.legSpans[k]!.span
    )
      k++;
    return course.legs[k]!;
  };
  course.legs.forEach((leg: rideHorse.ILeg, k: number): void => {
    if (leg.gait === undefined) return;
    const fastest: number = plan.legSpans[k]!.fastest;
    const limits: { minimum: number; maximum: number } = HorseGait.range(
      leg.gait,
      withers,
    );
    if (fastest > limits.maximum)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "horse",
        axis: `course.legs[${k}].gait`,
        value: leg.gait,
        feasible: {
          kind: "range",
          minimum: limits.minimum,
          maximum: limits.maximum,
          unit: "m/s",
        },
        reason: `the leg reaches ${fastest} m/s, beyond a ${withers} m horse's measured ${leg.gait}`,
        fix: "name a faster gait for the leg, or slow the course there",
      });
  });

  // The stride's gait as the speed calls for it, from the one it is in.
  const called = (speed: number, from: HorseGait.Gait): HorseGait.Gait =>
    HorseChange.called(speed, from, horse.dimensions);
  const decide = (
    state: ArchetypeCourse.IState,
    from: rideHorse.IStride,
  ): rideHorse.IStride => {
    const leg: rideHorse.ILeg = legAt(state.distance);
    return {
      gait: leg.gait ?? gait ?? called(state.speed, from.gait),
      lead: leg.lead ?? "left",
    };
  };

  // Phase against time, each stride at its own gait; a stride's gait is decided at the start of the one before it.
  const step: number = plan.duration / rideHorse.STEPS;
  const first: rideHorse.IStride = decide(plan.at(0), {
    gait: gait ?? "walk",
    lead: "left",
  });
  const strides: rideHorse.IStride[] = [first, decide(plan.at(0), first)];
  const phases: number[] = [0];
  for (let i: number = 0; i < rideHorse.STEPS; i++) {
    const current: rideHorse.IStride = strides[Math.floor(phases[i]!)]!;
    const next: number =
      phases[i]! +
      step / paced(current.gait, plan.at((i + 0.5) * step).speed).stride;
    for (let n: number = Math.floor(phases[i]!) + 1; n <= next; n++)
      strides[n + 1] = decide(plan.at((i + (n - phases[i]!) / (next - phases[i]!)) * step), strides[n]!);
    phases.push(next);
  }
  const strideOf = (m: number): rideHorse.IStride =>
    strides[Math.max(0, Math.min(strides.length - 1, m))]!;
  const phaseAt = (seconds: number): number => {
    const at: number = Math.max(0, Math.min(rideHorse.STEPS, seconds / step));
    const i: number = Math.min(rideHorse.STEPS - 1, Math.floor(at));
    return phases[i]! + (phases[i + 1]! - phases[i]!) * (at - i);
  };
  const secondsAt = (phase: number): number => {
    let low: number = 0;
    let high: number = rideHorse.STEPS;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (phases[middle]! <= phase) low = middle;
      else high = middle;
    }
    return (
      (low + (phase - phases[low]!) / (phases[high]! - phases[low]!)) * step
    );
  };

  // Each hoof's landing in a stride: the stride's gait's phase on its lead.
  const landing = (limb: createHorse.Limb, m: number): number =>
    m + rideHorse.phase(strideOf(m), limb);

  // Every landing of every hoof, and every change of gait or lead.
  const instants: { seconds: number; label: string }[] = [];
  const total: number = phases[rideHorse.STEPS]!;
  for (const limb of createHorse.LIMBS)
    for (let m: number = 0; landing(limb, m) <= total; m++)
      instants.push({
        seconds: secondsAt(landing(limb, m)),
        label: `${limb}On`,
      });
  for (let n: number = 1; n < strides.length - 1 && n <= total; n++) {
    const was: rideHorse.IStride = strides[n]!;
    const will: rideHorse.IStride = strides[n + 1]!;
    if (was.gait !== will.gait)
      instants.push({
        seconds: secondsAt(n),
        label: `gait:${was.gait}-${will.gait}`,
      });
    else if (was.lead !== will.lead && rideHorse.LEADED.includes(will.gait))
      instants.push({
        seconds: secondsAt(n),
        label: `lead:${was.lead}-${will.lead}`,
      });
  }

  // One stance: the duty factor at the speed the hoof lands at in its stride's gait, where the body is at the landing and how far it goes before the hoof lifts.
  const stance = (
    at: number,
    which: HorseGait.Gait,
  ): { duty: number; from: number; travel: number } => {
    const landed: ArchetypeCourse.IState = plan.at(secondsAt(at));
    const duty: number = paced(which, landed.speed).duty;
    return {
      duty,
      from: landed.distance,
      travel: plan.at(secondsAt(at + duty)).distance - landed.distance,
    };
  };

  const rig: createHorse.IRig = createHorse.rig(horse.dimensions);
  const neck: IAutoMovieVector3 = Vector3.create(
    0,
    rig.back - 0.06 * withers,
    rig.trunk / 2,
  );
  return ArchetypeRide.along(
    horse,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<createHorse.Affordance, createHorse.Dimension> => {
      const phase: number = phaseAt(plan.when(state.distance));
      const now: HorseGait.Gait = strideOf(Math.floor(phase)).gait;
      const going: number = Math.min(
        1,
        state.speed / HorseGait.range(now, withers).minimum,
      );
      const beats: number = now === "walk" || now === "trot" ? 2 : 1;

      // The trunk sinks twice a stride in the walk and the trot and once in the canter and the gallop.
      const sink: number =
        ((going * rideHorse.BOB[now]) / 2) *
        (1 - Math.cos(2 * Math.PI * beats * phase));
      const moved: Map<string, IAutoMovieModelPart["transform"]> = new Map();
      for (const limb of createHorse.LIMBS) {
        const fore: boolean = limb.endsWith("Fore");
        const rest: readonly IAutoMovieVector3[] = rig.limbs[limb];

        // The stance this hoof is in or has just left, and the next one it swings to.
        let m: number = Math.floor(phase);
        if (landing(limb, m) > phase) m--;
        const landed: number = landing(limb, m);
        const coming: number = landing(limb, m + 1);
        const which: HorseGait.Gait = strideOf(m).gait;
        const local: number = phase - landed;
        const current: { duty: number; from: number; travel: number } = stance(
          landed,
          which,
        );
        const planted: boolean = local < current.duty;
        const swing: number = planted
          ? 0
          : (local - current.duty) / (coming - landed - current.duty);
        const path: { along: number; rise: number } = HorseMotion.swing(swing);

        // Planted, the hoof goes back through the model by what the body has travelled since it landed, half the stance's travel ahead of its rest place at the landing; swinging, it is brought from where it lifted to where it lands next by the minimum-jerk path, clearing the ground by the swing's lift at the middle.
        const ahead: number = planted
          ? current.travel / 2 - (state.distance - current.from)
          : -current.travel / 2 +
            ((current.travel + stance(coming, strideOf(m + 1).gait).travel) /
              2) *
              path.along;
        const joints: IAutoMovieVector3[] = HorseLimb.solve(
          rest,
          fore,
          rest[4]!.z + ahead,
          sink +
            going *
              (fore ? rideHorse.LIFT.fore : rideHorse.LIFT.hind)[
                which === "walk" ? 0 : 1
              ] *
              withers *
              path.rise,
          going *
            (fore ? rideHorse.FOLD.fore : rideHorse.FOLD.hind)[
              which === "walk" ? 0 : 1
            ] *
            path.rise,
        );
        createHorse.BONES[limb].forEach(
          (bone: createHorse.Bone, k: number): void => {
            const span: IAutoMovieVector3 = Vector3.subtract(
              joints[k + 1]!,
              joints[k]!,
            );
            moved.set(bone, {
              translation: Vector3.scale(
                Vector3.add(joints[k]!, joints[k + 1]!),
                0.5,
              ),
              rotation: rotationBetween({ x: 0, y: 1, z: 0 }, span),
              scale: { ...ArchetypeFrame.UNIT },
            });
          },
        );
      }

      // The neck and head pitch about the neck's root, timed to the footfalls as measured.
      const nod: number =
        going *
        HorseMotion.nod(
          strideOf(Math.floor(phase)),
          phase,
          paced(now, state.speed).duty,
        );
      const turn: IAutoMovieQuaternion =
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, nod);
      for (const part of horse.parts)
        if (part.id === "neck" || part.id === "head")
          moved.set(part.id, {
            translation: Vector3.add(
              neck,
              Quaternion.rotateVector(
                turn,
                Vector3.subtract(part.transform!.translation, neck),
              ),
            ),
            rotation: Quaternion.multiply(turn, part.transform!.rotation),
            scale: { ...ArchetypeFrame.UNIT },
          });
      return {
        archetype: horse.reposed(
          horse.parts.map(
            (part: IAutoMovieModelPart): IAutoMovieModelPart =>
              moved.has(part.id)
                ? { ...part, transform: moved.get(part.id)! }
                : part,
          ),
        ),
        placement: {
          ...state.placement,
          translation: {
            ...state.placement.translation,
            y: state.placement.translation.y - sink,
          },
        },
      };
    },
    instants,
  );
}
/**
 * Companion constants of {@link rideHorse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit and its source, or that it has none.
 * @evidence contracts/development/design.md#principled-representation Measured ranges by gait, in the units their sources report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The few numbers the pose reads beyond `HorseGait`'s timing.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A value borrowed from another gait says so.
 */
export namespace rideHorse {
  /** Rows of the phase table over a course's running time. */
  export const STEPS: number = 2000;

  /** How far the trunk rises and falls in a stride, metres: the withers' vertical range of warmbloods, 33.4 mm at walk and 92.2 mm at trot (Rhodin et al. 2022, Animals 12:3053, Tables 2 and 3, https://www.ebi.ac.uk/europepmc/webservices/rest/PMC9657284/fullTextXML). The canter and the gallop reuse the trot's; no measured value was found. */
  export const BOB: Readonly<Record<HorseGait.Gait, number>> = {
    walk: 0.0334,
    trot: 0.0922,
    canter: 0.0922,
    gallop: 0.0922,
  };

  /** The peak fold of the carpus and of the hock in the swing, degrees, at the walk and at the trot: the joints' ranges in Back, Schamhardt and Barneveld 1996, Vet Q 18:79, Tables 1 and 2 (https://www.tandfonline.com/doi/pdf/10.1080/01652176.1996.9694699). The canter and the gallop reuse the trot's. */
  export const FOLD: Readonly<{
    fore: readonly [number, number];
    hind: readonly [number, number];
  }> = { fore: [68.7, 90.8], hind: [35.6, 55.4] };

  /** How high a swinging hoof rises at the middle of its swing, fore and hind, as a fraction of the height at the withers, at the walk and at the faster gaits. At the trot, the peak hoof heights of eight horses trotting on level ground, 13.8 cm fore and 10.8 cm hind (Brown, Stubbs, Kaiser, Lavagnino and Clayton 2015, Equine Vet J 2015, abstract read at Europe PMC, PMID 24593249), over their 142.3 cm at the withers (Clayton, Stubbs and Lavagnino 2015, Equine Vet J 47:113, Materials and methods, the same horses), so the model's horse of another height lifts in proportion: a derivation. The canter and the gallop reuse the trot's, no measured value having been found. The walk's 0.03 is a named estimate: no level-ground walk hoof height was read (searched: the SLU forward-walk study, its figures not reachable; the 2001 hindlimb walk kinematics, joint angles only; the Kentucky walk-lameness hoof study, no heights in its abstract; Animals 2025 15:2376 and Stutz et al. 2018, both refused). */
  export const LIFT: Readonly<{
    fore: readonly [number, number];
    hind: readonly [number, number];
  }> = { fore: [0.03, 0.138 / 1.423], hind: [0.03, 0.108 / 1.423] };

  /** The share of a hoof's fore-and-aft travel that its top joint follows, fore and hind: the shoulder joint's travel under a scapula of 0.311 of the withers height (Matsuura et al. 2008) turning through 19.4 degrees, and the hip joint's under the pelvis's 8.2 degrees (Back et al. 1996), each over the 1.1 m a hoof travels in stance; derived, not measured. */
  export const FOLLOW: Readonly<{ fore: number; hind: number }> = {
    fore: 0.16,
    hind: 0.05,
  };

  /** The sides a canter or gallop leads on. */
  export type Lead = "left" | "right";

  /** The gaits that have a lead: the canter and the gallop; the walk and the trot are symmetric. */
  export const LEADED: readonly HorseGait.Gait[] = ["canter", "gallop"];

  /**
   * A course leg that may name its gait and its lead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation A course leg with two optional closed choices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the legs of `ICourse`, read by `rideHorse`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The horse's fields live on the horse's course, not on every support's.
   */
  export type ILeg = ArchetypeCourse.Leg & {
    /** The gait the leg is ridden at; the speed chooses when absent. */
    gait?: HorseGait.Gait;

    /** The lead of a canter or gallop on the leg; the left when absent. */
    lead?: Lead;
  };

  /**
   * A horse's course: a course whose legs may name their gait and lead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   * @evidence contracts/development/design.md#principled-representation `ArchetypeCourse.ICourse` with the horse's legs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; `rideHorse`'s course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ICourse extends Omit<ArchetypeCourse.ICourse, "legs"> {
    /** The legs in order, at least one. */
    legs: readonly ILeg[];
  }

  /**
   * One stride's gait and lead.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   * @evidence contracts/development/design.md#principled-representation The two choices a stride is taken at.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `phase`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStride {
    /** The gait. */
    gait: HorseGait.Gait;

    /** The lead, read at the canter and the gallop. */
    lead: Lead;
  }

  /**
   * When a hoof lands in a stride, as a fraction of it from the left fore's landing: `HorseGait.PHASES` on the left lead, and its mirror on the right.
   *
   * @param stride The stride's gait and lead.
   * @param limb The hoof.
   * @returns The phase, 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the zero and the mirror.
   * @evidence contracts/development/implementation.md#principled-implementation The right lead is the left lead's mirror image (Robilliard et al. 2007 give the left): each hoof takes its opposite's phase, shifted so the left fore still lands at 0.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, or a mirrored lookup and a shift.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function phase(stride: IStride, limb: createHorse.Limb): number {
    const phases: Readonly<Record<createHorse.Limb, number>> =
      HorseGait.PHASES[stride.gait];
    if (stride.lead === "left" || !LEADED.includes(stride.gait))
      return phases[limb];
    const mirror: createHorse.Limb = (
      limb.startsWith("left")
        ? limb.replace("left", "right")
        : limb.replace("right", "left")
    ) as createHorse.Limb;
    const shifted: number = phases[mirror] - phases.rightFore;
    return shifted < 0 ? shifted + 1 : shifted;
  }
}
