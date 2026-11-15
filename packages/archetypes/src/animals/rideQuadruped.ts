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
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedGait } from "./QuadrupedGait";
import { QuadrupedLimb } from "./QuadrupedLimb";
import { QuadrupedMotion } from "./QuadrupedMotion";
import { createQuadruped } from "./createQuadruped";

/**
 * A quadruped going along a course: its root on the path, its trunk rising and falling and its head nodding with the stride, its four limbs stepping in the gait's order, and its gait and lead changing with the speed or as the course's legs name them. Every kind is ridden by this one function, from its species' data (`createQuadruped.species`).
 *
 * The stride's timing is the species' table's (`QuadrupedGait.timing`) at the course's speed for the animal's height at the withers, shifted by its `tempo`; scaled from the measured animals by dynamic similarity, it is provisional, as `QuadrupedGait.scale` states. Each foot lands at its phase of the stride, stays planted for the duty factor's share of it while the body passes over, then swings forward, lifted clear of the ground, with its carpus or hock folded. A planted foot stays where it landed on a straight leg at any speed, steady or changing, and across a change of gait; on a turn it is carried along the model's own fore-and-aft line, so it slides sideways by the turn's sagitta over one stance. The ride adds an instant for every landing, `leftForeOn`, `rightHindOn` and so on, which a rider's rising trot or a walker's step beside the animal locks to. The tack rides the trunk, so `frame("seat", seconds)` is the moving support a rider sits on and `frame("hitch", seconds)` the one a cart is drawn from; the species' nodding parts turn with the head.
 *
 * The gait of each stride is the one a course leg names, else the one `gait` names, else the one the speed calls for at the species' change points (`QuadrupedChange`), going up above a change point by the species' hysteresis and coming down below it by as much, so a speed hovering at the boundary does not flip the gait every stride. A change is decided at the left fore's landing, the stride's start, and takes the next stride: each foot's landing moves from the old gait's phase to the new one's, so a planted foot stays planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead` for a leaded gait, whose right lead mirrors the left; a change of lead is a flying change, taken the same way and named `lead:<from>-<to>`.
 *
 * While the animal gathers speed from rest or slows to a halt, below the gait's slowest measured speed, the stride keeps that slowest speed's timing and the steps shorten with the speed.
 *
 * @param animal The animal, as `createQuadruped` or its kind's producer builds it.
 * @param course The course its root follows; a leg may name the `gait` and the `lead` it is taken at.
 * @param gait The gait of every stride whose leg names none; absent, the speed chooses it.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the animal is no quadruped's, a gait is not its species', the cruising speed lies outside a given gait's range for the animal's height, a leg's speed exceeds the range of the gait it names, giving the range, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, where the timing comes from, how the gait is chosen and changed, the instants added, what the support frame is and what happens below the gait's slowest speed.
 * @evidence contracts/development/implementation.md#principled-implementation Phase advances with time by one stride per stride time of the stride's own gait. Each foot's landings are listed stride by stride at that stride's gait's phase, so across a change the gap to the next landing grows or shrinks and the swing between them stretches to meet it. A planted foot is set back through the model by the distance the body has travelled since it landed, read from the course's plan; it lands half of its stance's travel ahead of its rest place, so the stance is centred under the joint that carries it. Each limb is solved in its own fore-and-aft plane as two links (`QuadrupedLimb.solve`), its carpus or hock folded by the gait's fold, the trunk's rise and fall the gait's bob, the head's pitch the gait's nod timed to the footfalls (`QuadrupedMotion.nod`), and each swinging foot brought to its next landing by the minimum-jerk lift-and-place path (`QuadrupedMotion.swing`) at the gait's lift.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the species, read the rest joints off the animal (`QuadrupedBody.joints`), plan the course, tabulate phase against time deciding each stride's gait at its start, list the landings, then one pose function: bob, nod, four limbs, new part transforms.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species branch: every number is the species' table's or body's. The tack keeps its rest lines while the head nods, except the parts the species names as nodding. A foot beyond the limb's reach draws the limb's top joint along the trunk until it is within reach, so a planted foot stays planted and no bone stretches.
 * @evidence contracts/development/implementation.md#efficient-algorithms The phase table has `STEPS` rows over the running time, built once; a sample is one table read, a few binary searches of it per limb for the stances' ends, and four closed-form limb solutions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan, the phase table, the strides' gaits and the rest joints are shared by every sample; the ride samples the plan made here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the animal, the plan and the tables for as long as the caller keeps the ride.
 */
export function rideQuadruped<Affordance extends string, D extends string>(
  animal: Archetype<Affordance, D | QuadrupedBody.Dimension>,
  course: rideQuadruped.ICourse,
  gait?: QuadrupedGait.Gait,
): ArchetypeRide.IRide<Affordance, D | QuadrupedBody.Dimension> {
  const species: createQuadruped.ISpecies = createQuadruped.species(animal);
  const dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>> =
    animal.dimensions;
  const tempo: number = dimensions.tempo ?? 0;
  const withers: number = dimensions.withersHeight!;
  if (gait !== undefined)
    QuadrupedGait.timing(species, gait, course.cruise, tempo, withers);
  const paced = (
    which: QuadrupedGait.Gait,
    speed: number,
  ): QuadrupedGait.ITiming => {
    const limits: { minimum: number; maximum: number } = QuadrupedGait.range(
      species,
      which,
      withers,
    );
    return QuadrupedGait.timing(
      species,
      which,
      Math.max(limits.minimum, Math.min(limits.maximum, speed)),
      tempo,
      withers,
    );
  };
  const rig: ReturnType<typeof QuadrupedBody.joints> = QuadrupedBody.joints(
    animal.parts,
  );
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan(
    species.archetype,
    course,
  );

  // The leg holding each distance, and the gait and lead it names, by the legs the plan measured.
  const legAt = (distance: number): rideQuadruped.ILeg => {
    let k: number = 0;
    while (
      k < plan.legSpans.length - 1 &&
      distance >= plan.legSpans[k]!.from + plan.legSpans[k]!.span
    )
      k++;
    return course.legs[k]!;
  };
  course.legs.forEach((leg: rideQuadruped.ILeg, k: number): void => {
    if (leg.gait === undefined) return;
    const fastest: number = plan.legSpans[k]!.fastest;
    const limits: { minimum: number; maximum: number } = QuadrupedGait.range(
      species,
      leg.gait,
      withers,
    );
    if (fastest > limits.maximum)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: `course.legs[${k}].gait`,
        value: leg.gait,
        feasible: {
          kind: "range",
          minimum: limits.minimum,
          maximum: limits.maximum,
          unit: "m/s",
        },
        reason: `the leg reaches ${fastest} m/s, beyond a ${withers} m ${species.archetype}'s measured ${leg.gait}`,
        fix: "name a faster gait for the leg, or slow the course there",
      });
  });

  // The stride's gait as the speed calls for it, from the one it is in.
  const decide = (
    state: ArchetypeCourse.IState,
    from: QuadrupedGait.IStride,
  ): QuadrupedGait.IStride => {
    const leg: rideQuadruped.ILeg = legAt(state.distance);
    return {
      gait:
        leg.gait ??
        gait ??
        QuadrupedChange.called(
          species,
          state.speed,
          from.gait,
          dimensions,
          rig.limbs.leftHind[0]!.y,
        ),
      lead: leg.lead ?? "left",
    };
  };

  // Phase against time, each stride at its own gait; a stride's gait is decided at the start of the one before it.
  const step: number = plan.duration / rideQuadruped.STEPS;
  const slowest: QuadrupedGait.Gait = species.table.order[0]!;
  const first: QuadrupedGait.IStride = decide(plan.at(0), {
    gait: gait ?? slowest,
    lead: "left",
  });
  const strides: QuadrupedGait.IStride[] = [first, decide(plan.at(0), first)];
  const phases: number[] = [0];
  for (let i: number = 0; i < rideQuadruped.STEPS; i++) {
    const current: QuadrupedGait.IStride = strides[Math.floor(phases[i]!)]!;
    const next: number =
      phases[i]! +
      step / paced(current.gait, plan.at((i + 0.5) * step).speed).stride;
    for (let n: number = Math.floor(phases[i]!) + 1; n <= next; n++)
      strides[n + 1] = decide(
        plan.at((i + (n - phases[i]!) / (next - phases[i]!)) * step),
        strides[n]!,
      );
    phases.push(next);
  }
  const strideOf = (m: number): QuadrupedGait.IStride =>
    strides[Math.max(0, Math.min(strides.length - 1, m))]!;
  const phaseAt = (seconds: number): number => {
    const at: number = Math.max(
      0,
      Math.min(rideQuadruped.STEPS, seconds / step),
    );
    const i: number = Math.min(rideQuadruped.STEPS - 1, Math.floor(at));
    return phases[i]! + (phases[i + 1]! - phases[i]!) * (at - i);
  };
  const secondsAt = (phase: number): number => {
    let low: number = 0;
    let high: number = rideQuadruped.STEPS;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (phases[middle]! <= phase) low = middle;
      else high = middle;
    }
    return (
      (low + (phase - phases[low]!) / (phases[high]! - phases[low]!)) * step
    );
  };

  // Each foot's landing in a stride: the stride's gait's phase on its lead.
  const landing = (limb: QuadrupedBody.Limb, m: number): number =>
    m + QuadrupedGait.phase(species, strideOf(m), limb);

  // Every landing of every foot, and every change of gait or lead.
  const instants: { seconds: number; label: string }[] = [];
  const total: number = phases[rideQuadruped.STEPS]!;
  for (const limb of QuadrupedBody.LIMBS)
    for (let m: number = 0; landing(limb, m) <= total; m++)
      instants.push({
        seconds: secondsAt(landing(limb, m)),
        label: `${limb}On`,
      });
  for (let n: number = 1; n < strides.length - 1 && n <= total; n++) {
    const was: QuadrupedGait.IStride = strides[n]!;
    const will: QuadrupedGait.IStride = strides[n + 1]!;
    if (was.gait !== will.gait)
      instants.push({
        seconds: secondsAt(n),
        label: `gait:${was.gait}-${will.gait}`,
      });
    else if (
      was.lead !== will.lead &&
      QuadrupedGait.LEADED.includes(will.gait)
    )
      instants.push({
        seconds: secondsAt(n),
        label: `lead:${was.lead}-${will.lead}`,
      });
  }

  // One stance: the duty factor at the speed the foot lands at in its stride's gait, where the body is at the landing and how far it goes before the foot lifts.
  const stance = (
    at: number,
    which: QuadrupedGait.Gait,
  ): { duty: number; from: number; travel: number } => {
    const landed: ArchetypeCourse.IState = plan.at(secondsAt(at));
    const duty: number = paced(which, landed.speed).duty;
    return {
      duty,
      from: landed.distance,
      travel: plan.at(secondsAt(at + duty)).distance - landed.distance,
    };
  };

  return ArchetypeRide.along(
    animal,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<Affordance, D | QuadrupedBody.Dimension> => {
      const phase: number = phaseAt(plan.when(state.distance));
      const now: QuadrupedGait.Gait = strideOf(Math.floor(phase)).gait;
      const going: number = Math.min(
        1,
        state.speed / QuadrupedGait.range(species, now, withers).minimum,
      );

      // The trunk sinks as many times a stride as the gait has beats.
      const sink: number =
        ((going * QuadrupedGait.of(species, now).bob * withers) / 2) *
        (1 - Math.cos(2 * Math.PI * QuadrupedGait.BEATS[now] * phase));
      const moved: Map<string, IAutoMovieModelPart["transform"]> = new Map();
      for (const limb of QuadrupedBody.LIMBS) {
        const fore: boolean = limb.endsWith("Fore");
        const end: "fore" | "hind" = fore ? "fore" : "hind";
        const rest: readonly IAutoMovieVector3[] = rig.limbs[limb];

        // The stance this foot is in or has just left, and the next one it swings to.
        let m: number = Math.floor(phase);
        if (landing(limb, m) > phase) m--;
        const landed: number = landing(limb, m);
        const coming: number = landing(limb, m + 1);
        const which: QuadrupedGait.IGait = QuadrupedGait.of(
          species,
          strideOf(m).gait,
        );
        const local: number = phase - landed;
        const current: { duty: number; from: number; travel: number } = stance(
          landed,
          strideOf(m).gait,
        );
        const planted: boolean = local < current.duty;
        const swing: number = planted
          ? 0
          : (local - current.duty) / (coming - landed - current.duty);
        const path: { along: number; rise: number } =
          QuadrupedMotion.swing(swing);

        // Planted, the foot goes back through the model by what the body has travelled since it landed, half the stance's travel ahead of its rest place at the landing; swinging, it is brought from where it lifted to where it lands next by the minimum-jerk path, clearing the ground by the swing's lift at the middle.
        const ahead: number = planted
          ? current.travel / 2 - (state.distance - current.from)
          : -current.travel / 2 +
            ((current.travel + stance(coming, strideOf(m + 1).gait).travel) /
              2) *
              path.along;
        const joints: IAutoMovieVector3[] = QuadrupedLimb.solve(
          species,
          rest,
          fore,
          rest[4]!.z + ahead,
          sink + going * which.lift[end] * withers * path.rise,
          going * which.fold[end] * path.rise,
        );
        QuadrupedBody.BONES[limb].forEach(
          (bone: QuadrupedBody.Bone, k: number): void => {
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

      // The neck and the head, with the tack the species names as riding them, pitch about the neck's root, timed to the footfalls as measured.
      const nod: number =
        going *
        QuadrupedMotion.nod(
          species,
          strideOf(Math.floor(phase)),
          phase,
          paced(now, state.speed).duty,
        );
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 1, y: 0, z: 0 },
        nod,
      );
      for (const part of animal.parts)
        if (species.nodding.includes(part.id))
          moved.set(part.id, {
            translation: Vector3.add(
              rig.neck,
              Quaternion.rotateVector(
                turn,
                Vector3.subtract(part.transform!.translation, rig.neck),
              ),
            ),
            rotation: Quaternion.multiply(turn, part.transform!.rotation),
            scale: { ...ArchetypeFrame.UNIT },
          });
      return {
        archetype: animal.reposed(
          animal.parts.map(
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
 * Companion types and constants of {@link rideQuadruped}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type and constant states what it is.
 * @evidence contracts/development/design.md#principled-representation A course whose legs may name a gait and a lead, and the phase table's resolution.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a caller of the ride states; the gait data is the species'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace rideQuadruped {
  /** Rows of the phase table over a course's running time. */
  export const STEPS: number = 2000;

  /**
   * A course leg that may name its gait and its lead.
   *
   */
  export type ILeg = ArchetypeCourse.Leg & {
    /** The gait the leg is taken at; the speed chooses when absent. */
    gait?: QuadrupedGait.Gait;

    /** The lead of a leaded gait on the leg; the left when absent. */
    lead?: QuadrupedGait.Lead;
  };

  /**
   * A quadruped's course: a course whose legs may name their gait and lead.
   *
   */
  export interface ICourse extends Omit<ArchetypeCourse.ICourse, "legs"> {
    /** The legs in order, at least one. */
    legs: readonly ILeg[];
  }
}
