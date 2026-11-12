import { Vector3, rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRide,
} from "../core";
import { HorseGait } from "./HorseGait";
import { createHorse } from "./createHorse";

/**
 * A horse going along a course at a gait: its root on the path, its trunk rising and falling with the stride, and its four limbs stepping in the gait's order.
 *
 * The stride's timing is `HorseGait`'s at the course's speed for the horse's height at the withers, shifted by the horse's `tempo`; scaled from the measured horses by dynamic similarity, it is provisional, as `HorseGait.scale` states. Each hoof lands at its phase of the stride, stays planted for the duty factor's share of it while the body passes over, then swings forward, lifted clear of the ground, with its carpus or hock folded. A planted hoof stays where it landed on a straight leg at any speed, steady or changing; on a turn it is carried along the model's own fore-and-aft line, so it slides sideways by the turn's sagitta over one stance. The ride adds an instant for every landing, `leftForeOn`, `rightHindOn` and so on, which a rider's rising trot or a walker's step beside the horse locks to. The saddle, the stirrups and the reins ride the trunk, so `frame("seat", seconds)` is the moving support a rider sits on.
 *
 * While the horse gathers speed from rest or slows to a halt, below the gait's slowest measured speed, the stride keeps that slowest speed's timing and the steps shorten with the speed.
 *
 * @param horse The horse.
 * @param course The course its root follows; its cruising speed must lie in the gait's range for the horse's height.
 * @param gait The gait; the canter and the gallop are on the left lead.
 * @returns The ride.
 * @throws {ArchetypeRefusal} When the cruising speed lies outside the gait's range for the horse's height, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, where the timing comes from, the instants added, what the support frame is and what happens below the gait's slowest speed.
 * @evidence contracts/development/implementation.md#principled-implementation Phase advances with time by one stride per stride time. A planted hoof is set back through the model by the distance the body has travelled since it landed, read from the course's plan, so it stays where it landed whatever the speed does; it lands half of its stance's travel ahead of its rest place, so the stance is centred under the joint that carries it. Each limb is solved in its own fore-and-aft plane as two links, the upper bone and the three lower bones held as one piece whose carpus or hock is folded by a set angle, the planar two-bone solution with the elbow kept behind and the stifle in front. The fold's peak is the joint's measured range (Back, Schamhardt and Barneveld 1996, Vet Q 18:79, Tables 1 and 2: carpus 68.7 degrees at walk and 90.8 at trot, tarsus 35.6 and 55.4), the trunk's rise and fall the measured withers range (Rhodin et al. 2022, Animals 12:3053, warmbloods: 33 mm at walk, 92 mm at trot), and the top joint follows the hoof by the share the scapula's and pelvis's measured swing gives it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan the course, tabulate phase against time, list the landings, then one pose function: bob, four limbs, new part transforms.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The canter's and gallop's fold and bob reuse the trot's, for want of a measured source, and the head does not nod; both are stated on the constants. A hoof beyond the limb's reach draws the limb's top joint along the trunk until it is within reach, so a planted hoof stays planted and no bone stretches; the swing's lift is an estimate, stated on its constant.
 * @evidence contracts/development/implementation.md#efficient-algorithms The phase table has `STEPS` rows over the running time, built once; a sample is one table read, a few binary searches of it per limb for the stances' ends, and four closed-form limb solutions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan, the phase table and the rest rig are shared by every sample; the ride samples the plan made here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the horse, the plan and the table for as long as the caller keeps the ride.
 */
export function rideHorse(
  horse: Archetype<createHorse.Affordance, createHorse.Dimension>,
  course: ArchetypeCourse.ICourse,
  gait: HorseGait.Gait,
): ArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension> {
  const tempo: number = horse.dimensions.tempo ?? 0;
  const withers: number = horse.dimensions.withersHeight!;
  const limits: { minimum: number; maximum: number } = HorseGait.range(
    gait,
    withers,
  );
  HorseGait.timing(gait, course.cruise, tempo, withers);
  const paced = (speed: number): HorseGait.ITiming =>
    HorseGait.timing(
      gait,
      Math.max(limits.minimum, Math.min(limits.maximum, speed)),
      tempo,
      withers,
    );

  // Phase against time: each stride lasts the stride time of the speed it is taken at, so below the gait's slowest speed the cadence holds and the steps shorten.
  const plan: ArchetypeCourse.IPlan = ArchetypeCourse.plan("horse", course);
  const step: number = plan.duration / rideHorse.STEPS;
  const phases: number[] = [0];
  for (let i: number = 0; i < rideHorse.STEPS; i++)
    phases.push(
      phases[i]! + step / paced(plan.at((i + 0.5) * step).speed).stride,
    );
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

  // Every landing of every hoof.
  const instants: { seconds: number; label: string }[] = [];
  const total: number = phases[rideHorse.STEPS]!;
  for (const limb of createHorse.LIMBS)
    for (let k: number = HorseGait.PHASES[gait][limb]; k <= total; k++)
      instants.push({
        seconds: secondsAt(k),
        label: `${limb}On`,
      });

  // One stance: the duty factor at the speed the hoof lands at, where the body is at the landing and how far it goes before the hoof lifts.
  const stance = (
    landing: number,
  ): { duty: number; from: number; travel: number } => {
    const landed: ArchetypeCourse.IState = plan.at(secondsAt(landing));
    const duty: number = paced(landed.speed).duty;
    return {
      duty,
      from: landed.distance,
      travel: plan.at(secondsAt(landing + duty)).distance - landed.distance,
    };
  };

  const rig: createHorse.IRig = createHorse.rig(horse.dimensions);
  const bob: number = rideHorse.BOB[gait];
  const beats: number = gait === "walk" || gait === "trot" ? 2 : 1;
  return ArchetypeRide.along(
    horse,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<createHorse.Affordance, createHorse.Dimension> => {
      const phase: number = phaseAt(plan.when(state.distance));
      const going: number = Math.min(1, state.speed / limits.minimum);

      // The trunk sinks twice a stride in the walk and the trot and once in the canter and the gallop.
      const sink: number =
        ((going * bob) / 2) * (1 - Math.cos(2 * Math.PI * beats * phase));
      const moved: Map<string, IAutoMovieModelPart["transform"]> = new Map();
      for (const limb of createHorse.LIMBS) {
        const fore: boolean = limb.endsWith("Fore");
        const rest: readonly IAutoMovieVector3[] = rig.limbs[limb];

        // The stance this hoof is in or has just left, and the next one it swings to.
        const offset: number = HorseGait.PHASES[gait][limb];
        const landing: number = Math.floor(phase - offset) + offset;
        const local: number = phase - landing;
        const now: { duty: number; from: number; travel: number } =
          stance(landing);
        const planted: boolean = local < now.duty;
        const swing: number = planted ? 0 : (local - now.duty) / (1 - now.duty);

        // Planted, the hoof goes back through the model by what the body has travelled since it landed, half the stance's travel ahead of its rest place at the landing; swinging, it eases from where it lifted to where it lands next.
        const ahead: number = planted
          ? now.travel / 2 - (state.distance - now.from)
          : -now.travel / 2 +
            ((now.travel + stance(landing + 1).travel) / 2) *
              ((1 - Math.cos(Math.PI * swing)) / 2);
        const joints: IAutoMovieVector3[] = solve(
          rest,
          fore,
          rest[4]!.z + ahead,
          sink +
            going *
              rideHorse.LIFT[gait === "walk" ? 0 : 1] *
              withers *
              Math.sin(Math.PI * swing),
          going *
            (fore ? rideHorse.FOLD.fore : rideHorse.FOLD.hind)[
              gait === "walk" ? 0 : 1
            ] *
            Math.sin(Math.PI * swing),
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

  /** How high a swinging hoof clears the ground at the middle of its swing, as a fraction of the height at the withers, at the walk and at the faster gaits: estimates, no source read gives them. */
  export const LIFT: readonly [number, number] = [0.03, 0.06];

  /** The share of a hoof's fore-and-aft travel that its top joint follows, fore and hind: the shoulder joint's travel under a scapula of 0.311 of the withers height (Matsuura et al. 2008) turning through 19.4 degrees, and the hip joint's under the pelvis's 8.2 degrees (Back et al. 1996), each over the 1.1 m a hoof travels in stance; derived, not measured. */
  export const FOLLOW: Readonly<{ fore: number; hind: number }> = {
    fore: 0.16,
    hind: 0.05,
  };
}

/**
 * One limb's joints with its hoof at a place: the planar two-link solution, the three lower bones held as one piece folded at the carpus or the hock.
 *
 * @param rest The limb's five rest joints, from the top down.
 * @param fore Whether it is a fore limb, whose elbow stays behind; a hind limb's stifle stays in front.
 * @param z Where the hoof is wanted along the model's Z, metres.
 * @param y How high the hoof is wanted above the model's ground, metres.
 * @param fold How far the carpus or the hock folds beyond its standing angle, degrees.
 * @returns The five joints, in the limb's own fore-and-aft plane.
 */
function solve(
  rest: readonly IAutoMovieVector3[],
  fore: boolean,
  z: number,
  y: number,
  fold: number,
): IAutoMovieVector3[] {
  const x: number = rest[0]!.x;
  const length = (k: number): number =>
    Vector3.length(Vector3.subtract(rest[k + 1]!, rest[k]!));
  const [a, b, c, e]: number[] = [length(0), length(1), length(2), length(3)];
  const stance: readonly number[] = fore
    ? createHorse.STANCE.fore
    : createHorse.STANCE.hind;
  const radians = (degrees: number): number => (degrees * Math.PI) / 180;

  // A direction in the plane by its angle from straight down toward the front, as [z, y].
  const along = (angle: number): [number, number] => [
    Math.sin(angle),
    -Math.cos(angle),
  ];
  const top: [number, number] = [
    rest[0]!.z +
      (fore ? rideHorse.FOLLOW.fore : rideHorse.FOLLOW.hind) * (z - rest[4]!.z),
    rest[0]!.y,
  ];

  // The lower piece from the elbow or stifle to the hoof, with the middle bone pointing straight down.
  const bend: number = radians(stance[2]! - stance[1]! + (fore ? -fold : fold));
  const slope: number = radians(stance[3]! - stance[2]!);
  const piece: [number, number] = [
    c! * along(bend)[0] + e! * along(bend + slope)[0],
    -b! + c! * along(bend)[1] + e! * along(bend + slope)[1],
  ];
  const lower: number = Math.hypot(piece[0], piece[1]);
  const offset: number = Math.atan2(piece[0], -piece[1]);

  // The triangle of the upper bone, the piece and the line to the hoof.
  // A hoof beyond the limb's reach draws the top joint along the trunk until it is within reach: the rest of the swing of the shoulder blade or the pelvis that the follow share leaves out.
  const most: number = a! + lower - 1e-6;
  const drop: number = y - top[1];
  let ahead: number = z - top[0];
  if (Math.hypot(ahead, drop) > most && Math.abs(drop) < most) {
    const within: number =
      Math.sign(ahead) * Math.sqrt(most * most - drop * drop);
    top[0] += ahead - within;
    ahead = within;
  }
  const want: [number, number] = [ahead, drop];
  const distance: number = Math.max(
    Math.abs(a! - lower) + 1e-6,
    Math.min(most, Math.hypot(want[0], want[1])),
  );
  const toward: number = Math.atan2(want[0], -want[1]);
  const corner: number = Math.acos(
    (a! * a! + distance * distance - lower * lower) / (2 * a! * distance),
  );
  const upper: number = toward + (fore ? -corner : corner);
  const hoof: [number, number] = [
    top[0] + distance * along(toward)[0],
    top[1] + distance * along(toward)[1],
  ];
  const elbow: [number, number] = [
    top[0] + a! * along(upper)[0],
    top[1] + a! * along(upper)[1],
  ];
  const middle: number =
    Math.atan2(hoof[0] - elbow[0], -(hoof[1] - elbow[1])) - offset;
  const wrist: [number, number] = [
    elbow[0] + b! * along(middle)[0],
    elbow[1] + b! * along(middle)[1],
  ];
  const fetlock: [number, number] = [
    wrist[0] + c! * along(middle + bend)[0],
    wrist[1] + c! * along(middle + bend)[1],
  ];
  return [top, elbow, wrist, fetlock, hoof].map(
    (p: [number, number]): IAutoMovieVector3 => Vector3.create(x, p[1], p[0]),
  );
}
