import {
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../../../internal/animalTerminalSole";
import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

type Horse = ReturnType<typeof createHorse>;
type Ride = ReturnType<typeof rideHorse>;
type Technique = NonNullable<rideQuadruped.ILeg["equineFootwork"]>;
type Side = "left" | "right";

/** The lateral figures' collected trot, metres per second: the 2.3 m/s average Clayton 1994 reports (as Clayton and Hobbs 2019 cite it), inside the horse table's trot rows at 1.72 m withers. */
const TROT: number = 2.3;

/** One inadmissible single-leg path. */
interface IRefused {
  /** What the path is. */
  label: string;
  /** Its constant speed, metres per second. */
  speed: number;
  /** Its one leg. */
  leg: rideQuadruped.ILeg;
}

/** One fore landing and its side. */
interface IForeLanding {
  /** Film second. */
  at: number;
  /** The fore's side. */
  side: Side;
}

/** The film seconds and the lateral figure one take holds. */
interface IFigureTake {
  /** The ride. */
  ride: Ride;
  /** Film seconds of the held part of the figure. */
  from: number;
  to: number;
}

/**
 * A collected or lateral dressage passage keeps grounded hoof support while the body heading, hoof tracks and stride timing take the figure.
 *
 * Scenarios:
 * 1. Leg-yielding, half-pass and shoulder-in, each toward the left and toward the right, enter from and recover to straight trot. In the held figure the displayed body heading departs from the displayed travel by the figure's angle with the side's sign; in leg-yielding and half-pass each leg away from the movement lands beyond its partner toward the movement in the body's own frame, while on the straight entry it lands on its own side; in shoulder-in the inside hind's footprints lie on the outside fore's line. Every stance stays planted and the heading is the travel heading again after the recovery.
 * 2. A piaffe half-pirouette about the inside hind keeps that hoof's footprints within the circle the turn leaves it while the fores travel round the outside.
 * 3. One ride goes collected trot, passage, piaffe, passage and extended trot: the distance per stride orders piaffe, passage, collected and extended trot; passage lands each hind before its diagonal fore and has a moment with all four hooves clear of the floor; piaffe lands its diagonals together and always has a hoof down.
 * 4. Consecutive flying changes switch the last-landing fore at every lead change.
 * 5. An over-angled leg-yield, a figure on a turn, and a pirouette wider than the hind track are refused before sampling.
 */
export function test_unit_archetypes_animals_equine_dressage(): void {
  const horse: Horse = createHorse({
    tack: "bare",
    withersHeight: 1.72,
    tempo: 0,
  });
  const rig: ReturnType<typeof AutoMovieArchetypeEquine.rig> =
    AutoMovieArchetypeEquine.rig(horse.dimensions);
  const issues: string[] = [];

  // 1. Lateral figures, mirrored.
  // Each figure with the side and the angle it was built with; shoulder-in
  // states no angle, so its own held offset is the expectation.
  const figures: readonly {
    figure: Technique;
    toward: Side;
    angle: number | null;
  }[] = (["left", "right"] as const).flatMap((toward: Side) => [
    { figure: { kind: "leg-yield", toward, angle: 30, blend: 0.8 }, toward, angle: 30 },
    { figure: { kind: "half-pass", toward, angle: 30, blend: 0.8 }, toward, angle: 30 },
    { figure: { kind: "shoulder-in", toward, blend: 0.8 }, toward, angle: null },
  ]);
  for (const { figure, toward, angle } of figures) {
    const take: IFigureTake = lateral(horse, figure);
    const label: string = `${figure.kind} toward ${toward}`;
    const offsets: number[] = [];
    for (let at: number = take.from; at <= take.to; at += 0.1)
      offsets.push(heading(take.ride, at));
    const expected: number = angle ?? Math.abs(offsets[0]!);
    const sign: number = toward === "left" ? -1 : 1;
    if (
      offsets.some(
        (offset: number): boolean =>
          Math.abs(offset - sign * expected) > 0.5 || sign * offset <= 0,
      )
    )
      issues.push(`${label}: heading offsets ${offsets.slice(0, 3)}`);
    if (Math.abs(heading(take.ride, take.ride.duration - 0.3)) > 0.5)
      issues.push(`${label}: heading does not recover to the travel`);
    if (figure.kind === "shoulder-in") sharedTrack(take, toward, label);
    else crossing(take, toward, label);
    const slid: ReturnType<typeof archetypeHorseRide.slide> =
      archetypeHorseRide.slide(take.ride);
    if (slid.worst > 1e-6)
      issues.push(`${label}: slides ${slid.worst} at ${slid.at}`);
  }

  // 2. Piaffe half-pirouette to the left about the left hind.
  const pivot: IAutoMovieVector3 = rig.limbs.leftHind[4]!;
  const reach: number = Math.hypot(pivot.x, pivot.z);
  const radius: number = reach + 0.05;
  const pirouette: Ride = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 0.5,
      startSpeed: 0.5,
      endSpeed: 0.5,
      legs: [
        { kind: "straight", length: 2, gait: "piaffe" },
        {
          kind: "turn",
          radius,
          angle: 180,
          gait: "piaffe",
          equineFootwork: { kind: "pirouette", blend: 0.6 },
        },
        { kind: "straight", length: 2, gait: "piaffe" },
      ],
    },
    undefined,
  );
  const begin: number = cue(pirouette, "pirouetteStart");
  const end: number = cue(pirouette, "pirouetteEnd");
  const centre: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
    pirouette.plan.at(begin).placement,
    { x: radius, y: 0, z: 0 },
  );
  let inside: number = 0;
  let outside: number = Infinity;
  for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS)
    for (const at of archetypeHorseRide.footfalls(pirouette, limb)) {
      if (at < begin + 0.6 || at > end - 0.6) continue;
      const hoof: IAutoMovieVector3 = archetypeHorseRide.hoof(
        pirouette,
        limb,
        at + 0.01,
      );
      const distance: number = Math.hypot(hoof.x - centre.x, hoof.z - centre.z);
      if (limb === "leftHind") inside = Math.max(inside, distance);
      else outside = Math.min(outside, distance);
    }
  if (!(inside < radius - reach + 0.1 && outside > inside))
    issues.push(`pirouette: inside hind ${inside} m, others ${outside} m`);

  // 3. Collection levels.
  const collection: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    cruise: 4,
    startSpeed: 2.4,
    acceleration: 1.5,
    deceleration: 1.5,
    speeds: [2.4, 1.5, 1.5, 0.4, 0.4, 1.5, 4],
    legs: [
      { kind: "straight", length: 12, gait: "trot" },
      { kind: "straight", length: 2.5, gait: "passage" },
      { kind: "straight", length: 8, gait: "passage" },
      { kind: "straight", length: 0.8, gait: "piaffe" },
      { kind: "straight", length: 1.6, gait: "piaffe" },
      { kind: "straight", length: 6, gait: "passage" },
      { kind: "straight", length: 24, gait: "trot" },
    ],
  });
  /** Film second a leg of the collection course begins. */
  const legStart = (index: number): number =>
    collection.plan.when(collection.plan.legSpans[index]!.from);
  const windows: readonly (readonly [string, number, number])[] = [
    ["collected", 0.5, cue(collection, "gait:trot-passage") - 0.3],
    ["passage", legStart(2) + 0.5, cue(collection, "gait:passage-piaffe")],
    ["piaffe", legStart(4), cue(collection, "gait:piaffe-passage")],
    ["extended", collection.duration - 3, collection.duration],
  ];
  const lengths: number[] = windows.map(
    ([name, from, to]: readonly [string, number, number]): number => {
      const landings: number[] = archetypeHorseRide
        .footfalls(collection, "leftFore")
        .filter((at: number): boolean => at >= from && at <= to);
      if (landings.length < 2) {
        issues.push(`${name}: fewer than two strides`);
        return NaN;
      }
      const span: number =
        collection.plan.at(landings[landings.length - 1]!).distance -
        collection.plan.at(landings[0]!).distance;
      const advanced: number = placement(collection, landings);
      const stride: number =
        (landings[landings.length - 1]! - landings[0]!) / (landings.length - 1);
      if (name === "passage" && !(advanced > 0.015 && advanced < 0.045))
        issues.push(`passage diagonal advanced placement ${advanced}`);
      if (name !== "passage" && Math.abs(advanced) > 0.015)
        issues.push(`${name} diagonal advanced placement ${advanced}`);
      const aerial: boolean = suspended(collection, landings[0]!, stride);
      if (name === "passage" && !aerial)
        issues.push("passage shows no moment with every hoof clear");
      if (name === "piaffe" && aerial)
        issues.push("piaffe leaves the ground with every hoof");
      return span / (landings.length - 1);
    },
  );
  if (
    !(
      lengths[2]! < lengths[1]! &&
      lengths[1]! < lengths[0]! &&
      lengths[0]! < lengths[3]!
    )
  )
    issues.push(`stride lengths out of order: ${lengths}`);

  // 4. Consecutive flying changes.
  const canter: number = 5.5 * Math.sqrt(1.72 / 1.38);
  const changes: Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    cruise: canter,
    startSpeed: canter,
    endSpeed: canter,
    legs: (["left", "right", "left", "right"] as const).map(
      (lead: Side): rideQuadruped.ILeg => ({
        kind: "straight",
        length: canter * 1.6,
        gait: "canter",
        lead,
      }),
    ),
  });
  const leadChanges: readonly number[] = changes.instants
    .filter((event): boolean => event.label.startsWith("lead:"))
    .map((event): number => event.seconds);
  if (leadChanges.length !== 3) issues.push(`lead changes ${leadChanges}`);
  const bounds: readonly number[] = [0, ...leadChanges, changes.duration];
  for (let k: number = 0; k + 1 < bounds.length; k++) {
    const expected: Side = k % 2 === 0 ? "left" : "right";
    const found: Side | undefined = leading(
      changes,
      bounds[k]!,
      bounds[k + 1]!,
    );
    if (found !== expected)
      issues.push(`after change ${k} the leading fore is ${found}`);
  }

  // 5. Inadmissible paths.
  const refused: readonly IRefused[] = [
    {
      label: "an over-angled leg-yield",
      speed: 2.5,
      leg: {
        kind: "straight",
        length: 12,
        gait: "trot",
        equineFootwork: {
          kind: "leg-yield",
          toward: "left",
          angle: 40,
          blend: 0.8,
        },
      },
    },
    {
      label: "a half-pass on a turn",
      speed: 2.5,
      leg: {
        kind: "turn",
        radius: 12,
        angle: 30,
        gait: "trot",
        equineFootwork: {
          kind: "half-pass",
          toward: "left",
          angle: 20,
          blend: 0.8,
        },
      },
    },
    {
      label: "a pirouette wider than the hind track",
      speed: 0.5,
      leg: {
        kind: "turn",
        radius: reach + 1,
        angle: 180,
        gait: "piaffe",
        equineFootwork: { kind: "pirouette", blend: 0.6 },
      },
    },
  ];
  for (const { label, speed, leg } of refused) {
    let refusal: unknown;
    try {
      rideHorse(horse, {
        start: { x: 0, z: 0, heading: 0 },
        cruise: speed,
        startSpeed: speed,
        endSpeed: speed,
        legs: [leg],
      });
    } catch (error) {
      refusal = error;
    }
    if (
      !(
        refusal instanceof AutoMovieArchetypeRefusal &&
        refusal.axis.endsWith("equineFootwork")
      )
    )
      issues.push(`${label} is not refused`);
  }
  TestValidator.equals("dressage passage observations", issues, []);

  /** Ride one figure between straight entry and recovery. */
  function lateral(source: Horse, figure: Technique): IFigureTake {
    const ride: Ride = rideHorse(source, {
      start: { x: 0, z: 0, heading: 0 },
      cruise: TROT,
      startSpeed: TROT,
      endSpeed: TROT,
      legs: [
        { kind: "straight", length: 5, gait: "trot" },
        { kind: "straight", length: 14, gait: "trot", equineFootwork: figure },
        { kind: "straight", length: 5, gait: "trot" },
      ],
    });
    return {
      ride,
      from: cue(ride, `${figure.kind}Start`) + 0.9,
      to: cue(ride, `${figure.kind}End`) - 0.9,
    };
  }

  /** In the held figure each leg away from the movement lands beyond its partner toward the movement in the body frame (DR111.2.b, DR112.2.b); on the straight entry it lands on its own side. */
  function crossing(take: IFigureTake, toward: Side, label: string): void {
    const sign: number = toward === "left" ? 1 : -1;
    for (const end of ["Fore", "Hind"] as const) {
      const mover: AutoMovieArchetypeQuadrupedBody.Limb = `${toward === "left" ? "right" : "left"}${end}`;
      const partner: AutoMovieArchetypeQuadrupedBody.Limb = `${toward}${end}`;
      let count: number = 0;
      for (const at of archetypeHorseRide.footfalls(take.ride, mover)) {
        const straight: boolean = at < take.from - 0.9;
        if (!straight && (at < take.from || at > take.to)) continue;
        const frame: IAutoMovieTransform = take.ride.at(at + 0.005).placement;
        const own: number = body(
          frame,
          archetypeHorseRide.hoof(take.ride, mover, at + 0.005),
        ).x;
        const other: number = body(
          frame,
          archetypeHorseRide.hoof(take.ride, partner, at + 0.005),
        ).x;
        if (!straight) ++count;
        if (straight === sign * (own - other) > 0)
          issues.push(
            `${label}: ${mover} at ${own} against ${partner} at ${other}, straight ${straight}`,
          );
      }
      if (count < 2) issues.push(`${label}: ${count} ${mover} landings`);
    }
  }

  /** In shoulder-in the inside hind steps in the outside fore's track. */
  function sharedTrack(take: IFigureTake, toward: Side, label: string): void {
    const fore: AutoMovieArchetypeQuadrupedBody.Limb =
      toward === "left" ? "leftFore" : "rightFore";
    const hind: AutoMovieArchetypeQuadrupedBody.Limb =
      toward === "left" ? "rightHind" : "leftHind";
    const lateralOf = (limb: AutoMovieArchetypeQuadrupedBody.Limb): number[] =>
      archetypeHorseRide
        .footfalls(take.ride, limb)
        .filter((at: number): boolean => at >= take.from && at <= take.to)
        .map(
          (at: number): number =>
            archetypeHorseRide.hoof(take.ride, limb, at + 0.01).x,
        );
    const fores: number[] = lateralOf(fore);
    const hinds: number[] = lateralOf(hind);
    if (fores.length < 2 || hinds.length < 2)
      issues.push(`${label}: too few footprints for the track`);
    for (const x of [...fores, ...hinds])
      if (Math.abs(x - fores[0]!) > 0.01)
        issues.push(
          `${label}: footprint ${x} off the shared track ${fores[0]}`,
        );
  }

  /** The leading fore over an interval: the fore after whose landing the longest wait to the next fore landing follows. */
  function leading(ride: Ride, from: number, to: number): Side | undefined {
    const fores: IForeLanding[] = (["left", "right"] as const)
      .flatMap((side: Side): IForeLanding[] =>
        archetypeHorseRide
          .footfalls(ride, `${side}Fore`)
          .filter((at: number): boolean => at > from + 0.05 && at < to - 0.05)
          .map((at: number): IForeLanding => ({ at, side })),
      )
      .sort((a: IForeLanding, b: IForeLanding): number => a.at - b.at);
    let longest: number = 0;
    let side: Side | undefined;
    for (let i: number = 0; i + 1 < fores.length; i++)
      if (fores[i + 1]!.at - fores[i]!.at > longest) {
        longest = fores[i + 1]!.at - fores[i]!.at;
        side = fores[i]!.side;
      }
    return side;
  }
}

/** A named instant of a ride. */
function cue(ride: Ride, label: string): number {
  const found: number | undefined = ride.instants.find(
    (event): boolean => event.label === label,
  )?.seconds;
  if (found === undefined) throw new Error(`The ride did not publish ${label}`);
  return found;
}

/** Degrees from the displayed travel direction to the displayed body heading, positive to the left. */
function heading(ride: Ride, at: number): number {
  const before: IAutoMovieVector3 = ride.at(at - 0.02).placement.translation;
  const after: IAutoMovieVector3 = ride.at(at + 0.02).placement.translation;
  const facing: IAutoMovieVector3 = Quaternion.rotateVector(
    ride.at(at).placement.rotation,
    { x: 0, y: 0, z: 1 },
  );
  const travel: number = Math.atan2(after.x - before.x, after.z - before.z);
  const body: number = Math.atan2(facing.x, facing.z);
  const degrees: number = ((body - travel) * 180) / Math.PI;
  return ((degrees + 540) % 360) - 180;
}

/** A world point in the body's own axes. */
function body(
  frame: IAutoMovieTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
}

/** Mean share of a stride by which the right hind lands before the left fore it pairs with. */
function placement(ride: Ride, landings: readonly number[]): number {
  const hinds: readonly number[] = archetypeHorseRide.footfalls(
    ride,
    "rightHind",
  );
  let total: number = 0;
  let count: number = 0;
  for (let i: number = 1; i < landings.length; i++) {
    const stride: number = landings[i]! - landings[i - 1]!;
    const nearest: number = hinds.reduce(
      (best: number, at: number): number =>
        Math.abs(at - landings[i]!) < Math.abs(best - landings[i]!) ? at : best,
    );
    total += (landings[i]! - nearest) / stride;
    ++count;
  }
  return total / count;
}

/** Whether any sample in one stride, every 5 ms, has all four soles clear of the floor. */
function suspended(ride: Ride, from: number, stride: number): boolean {
  for (let at: number = from; at < from + stride; at += 0.005) {
    const sample: ReturnType<Ride["at"]> = ride.at(at);
    if (
      AutoMovieArchetypeQuadrupedBody.LIMBS.every(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean => {
          const part: IAutoMovieModelPart = sample.archetype.parts.find(
            (p: IAutoMovieModelPart): boolean =>
              p.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
          )!;
          return animalTerminalSole(part, sample.placement) > 1e-6;
        },
      )
    )
      return true;
  }
  return false;
}
