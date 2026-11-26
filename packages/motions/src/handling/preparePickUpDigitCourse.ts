import {
  Quaternion,
  Vector3,
  clampJointToSkeleton,
  closestPointsBetweenSegments,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalShape,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { HumanGrip } from "./HumanGrip";
import { pickUpDigitProjection } from "./pickUpDigitProjection";

const KNOTS = 56;
const GAP = 0.001;
const TOUCH = 0.002;
const CONTACT_MARGIN = 0.0015;
const FIT = 0.00002;
const END_OPENING = 0.0035;
const PEAK_MIN = 0.6;
const PEAK_MAX = 0.7;
const APERTURE_SAMPLES = 480;

type IShape = IAutoMovieMotionHumanPosture["joints"];
type FingerReader = (share: number) => IShape;
type Wrist = IAutoMovieMotionHumanHand.IWrist;
type Capsule = Extract<IAutoMoviePhysicalShape, { kind: "capsule" }>;
type Curve = (share: number) => number[];
type Layer = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
type ICapsuleCore = [IAutoMovieVector3, IAutoMovieVector3, number];

function smooth(progress: number): number {
  const u = Math.max(0, Math.min(1, progress));
  return u * u * (3 - 2 * u);
}

function interpolate(times: readonly number[], samples: readonly number[][]): Curve {
  const slopes = samples.map((values, i) =>
    values.map((_, j) => {
      if (i === 0 || i === times.length - 1) return 0;
      const a = (values[j]! - samples[i - 1]![j]!) / (times[i]! - times[i - 1]!);
      const b = (samples[i + 1]![j]! - values[j]!) / (times[i + 1]! - times[i]!);
      return a * b > 0 ? (2 * a * b) / (a + b) : 0;
    }),
  );
  return (time: number): number[] => {
    if (time <= 0) return samples[0]!;
    if (time >= 1) return samples.at(-1)!;
    let lo = 0;
    let hi = times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (time >= times[mid]!) lo = mid;
      else hi = mid;
    }
    const span = times[hi]! - times[lo]!;
    const u = (time - times[lo]!) / span;
    const v = u * u;
    const w = v * u;
    return samples[lo]!.map(
      (value, j) =>
        (1 - 3 * v + 2 * w) * value +
        (u - 2 * v + w) * span * slopes[lo]![j]! +
        (3 * v - 2 * w) * samples[hi]![j]! +
        (w - v) * span * slopes[hi]![j]!,
    );
  };
}

function separation(a: readonly ICapsuleCore[], b: readonly ICapsuleCore[]): number {
  let least = Infinity;
  for (const [p, q, first] of a)
    for (const [x, y, second] of b)
      least = Math.min(least, closestPointsBetweenSegments(p, q, x, y).distance - first - second);
  return least;
}

/** Prepare changes to an embedded stationary power pickup. The arm keeps its admitted course. */
export function preparePickUpDigitCourse(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  collider: IAutoMovieCurlChainUntilContact.ICollider,
): preparePickUpDigitCourse.IModel {
  const hand: AutoMovieHumanoidBone = `${side}Hand`;
  const thumb = HumanGrip.bones(side, "Thumb") as [
    AutoMovieHumanoidBone,
    AutoMovieHumanoidBone,
    AutoMovieHumanoidBone,
  ];
  const index = HumanGrip.bones(side, "Index") as typeof thumb;
  const others = (["Middle", "Ring", "Little"] as const).map((d) => HumanGrip.bones(side, d));
  const bones = new Set([hand, ...thumb, ...index, ...others.flat()]);
  const bind = poseBones.prepareTuples(body, bones);
  const shape = (x: readonly number[]): IShape => ({
    [thumb[0]]: [x[0]!, x[1]!, x[2]!],
    [thumb[1]]: [x[3]!, 0, 0],
    [thumb[2]]: [x[4]!, 0, 0],
    [index[0]]: [x[5]!, x[6]!, 0],
    [index[1]]: [x[7]!, 0, 0],
    [index[2]]: [x[8]!, 0, 0],
  });
  const coordinates = (joints: IShape): number[] => [
    ...(joints[thumb[0]] ?? [0, 0, 0]),
    joints[thumb[1]]?.[0] ?? 0,
    joints[thumb[2]]?.[0] ?? 0,
    joints[index[0]]?.[0] ?? 0,
    joints[index[0]]?.[1] ?? 0,
    joints[index[1]]?.[0] ?? 0,
    joints[index[2]]?.[0] ?? 0,
  ];
  const resolve = (joints: IShape): Layer => {
    const admitted: IShape = {};
    for (const bone of bones) {
      const tuple = joints[bone];
      if (tuple === undefined) continue;
      const j = clampJointToSkeleton({
        bone,
        flexion: tuple[0],
        abduction: tuple[1],
        twist: tuple[2],
      }, body.skeleton);
      admitted[bone] = [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0];
    }
    return bind(admitted)({ skeleton: body.skeleton.id, root: null });
  };
  const rest = resolve({}).get(hand)!;
  const shapes = new Map<AutoMovieHumanoidBone, Capsule>();
  for (const bone of [...thumb, ...index, ...others.flat()]) {
    const capsule = body.profile.segments.find((part) => part.bone === bone)?.shapes.find(
      (s): s is Capsule => s.kind === "capsule",
    );
    if (capsule === undefined) throw new Error(`A pickup needs the collider of ${bone}`);
    shapes.set(bone, capsule);
  }
  const capsules = (frames: Layer, digits: readonly AutoMovieHumanoidBone[]): ICapsuleCore[] =>
    digits.map((name) => {
      const bone = frames.get(name)!;
      const cap = shapes.get(name)!;
      const center = Vector3.add(bone.worldPosition, Quaternion.rotateVector(bone.worldRotation, cap.transform.position));
      const length = Quaternion.rotateVector(
        Quaternion.multiply(bone.worldRotation, cap.transform.rotation),
        { x: 0, y: cap.halfLength, z: 0 },
      );
      return [Vector3.subtract(center, length), Vector3.add(center, length), cap.radius];
    });
  const thumbTip = HumanGrip.chain(body, side, "Thumb").tip;
  const indexTip = HumanGrip.chain(body, side, "Index").tip;
  const tip = (f: IAutoMovieResolvedBone, x: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(f.worldPosition, Quaternion.rotateVector(f.worldRotation, x));
  const read = (wrist: Wrist, reference: IShape): ((x: readonly number[]) => number[]) => {
    const rotation = Quaternion.multiply(rest.worldRotation, Quaternion.inverse(wrist.rotation));
    const distance = physicalShapeSegmentDistance.prepare({
      position: Vector3.add(rest.worldPosition, Quaternion.rotateVector(rotation, Vector3.subtract(collider.frame.position, wrist.point))),
      rotation: Quaternion.multiply(rotation, collider.frame.rotation),
    }, collider.shape);
    const frames = resolve(reference);
    const other = others.map((digits) => capsules(frames, digits));
    const near = other.flat();
    const gap = (caps: readonly ICapsuleCore[]): number =>
      Math.min(...caps.map(([a, b, r]) => distance(a, b) - r));
    const otherGaps = other.map(gap);
    return (x): number[] => {
      const f = resolve(shape(x));
      const T = capsules(f, thumb), I = capsules(f, index);
      const t = gap(T), i = gap(I);
      return [
        Vector3.distance(tip(f.get(thumb[2])!, thumbTip), tip(f.get(index[2])!, indexTip)),
        t, i, separation(T, I), separation(T, near), separation(I, near), -t, -i,
        ...otherGaps,
      ];
    };
  };
  const measure = (frames: Layer): number[] => {
    const thumbCapsules = capsules(frames, thumb);
    const indexCapsules = capsules(frames, index);
    const rest = others.map((digits) => capsules(frames, digits));
    const distance = physicalShapeSegmentDistance.prepare(collider.frame, collider.shape);
    const gap = (chain: readonly ICapsuleCore[]): number =>
      Math.min(...chain.map(([a, b, r]) => distance(a, b) - r));
    const t = gap(thumbCapsules);
    const i = gap(indexCapsules);
    return [
      Vector3.distance(tip(frames.get(thumb[2])!, thumbTip), tip(frames.get(index[2])!, indexTip)),
      t, i, separation(thumbCapsules, indexCapsules), separation(thumbCapsules, rest.flat()),
      separation(indexCapsules, rest.flat()), -t, -i, ...rest.map(gap),
    ];
  };
  const closes = (samples: readonly number[]): boolean =>
    [samples[1]!, samples[2]!, ...samples.slice(8)].every((gap) => gap >= -GAP && gap <= TOUCH) &&
    samples.slice(3, 6).every((gap) => gap >= -GAP);

  const close = (wrist: Wrist, closed: IShape, peak: number): IShape | undefined => {
    const evaluate = read(wrist, closed);
    const initial = coordinates(closed);
    const probes = [
      initial,
      [-25, 24, 0, 0, 45, ...initial.slice(5)],
      [-25, 16, -8.5, 0, 75, ...initial.slice(5)],
      [-22, 8, -8.5, 0, 90, ...initial.slice(5)],
    ];
    const wanted = peak - END_OPENING;
    for (const from of probes) {
      const fit = pickUpDigitProjection(evaluate, wanted, [0, 0, 0, 0, 0, -0.0018, -0.0018], from);
      if (fit.error <= FIT && closes(evaluate(fit.angles))) return { ...closed, ...shape(fit.angles) };
    }
    return undefined;
  };

  const assess = (display: (share: number) => Layer): { peak: number; passes: boolean } => {
    let greatest = -Infinity;
    let peak = 0;
    let minimum = Infinity;
    let reopening = 0;
    for (let i=0; i<=APERTURE_SAMPLES; ++i) {
      const u=i / APERTURE_SAMPLES, measured=measure(display(u));
      if ([measured[1]!, measured[2]!, ...measured.slice(3,6), ...measured.slice(8)].some(g=>g < -GAP)) return {peak, passes:false};
      if (i===APERTURE_SAMPLES && !closes(measured)) return {peak, passes:false};
      const opening=measured[0]!;
      if (opening > greatest) { greatest=opening; peak=u; minimum=opening; reopening=0; }
      else { minimum=Math.min(minimum,opening); reopening=Math.max(reopening,opening-minimum); }
    }
    return {peak, passes:reopening <= 0.00005};
  };
  const accepted=(check:ReturnType<typeof assess>):boolean=>check.passes && check.peak>=PEAK_MIN && check.peak<=PEAK_MAX;
  const course = (input: preparePickUpDigitCourse.ICourse): FingerReader | undefined => {
    const entry = coordinates(input.reference(0)), end = coordinates(input.closed);
    const aperture = HumanGrip.prepareAperture(body, side);
    const start = aperture(input.reference(0)), closed = aperture(input.closed);
    if (input.apex <= Math.max(start, closed)) return undefined;
    const guideAt = (position: number, peak: number, reference: readonly number[]): number[] => {
      // Seed the projection on the open side of the object before opposition.
      // These are starts for the bounded fit. The displayed sweep admits the output.
      const keys: readonly [number, readonly number[]][] = [
        [0, entry.slice(0, 5)],
        [peak, [-25, 20, -8.5, 0, -5]],
        [0.75, [-25, 0, -8.5, 0, 0]],
        [0.83, [-27, 23, -3, 0, 55]],
        [1, end.slice(0, 5)],
      ];
      const at = keys.findIndex((key, i) => i > 0 && position <= key[0]);
      const [from, a] = keys[at - 1]!;
      const [to, b] = keys[at]!;
      const w = smooth((position - from) / (to - from));
      return [...a.map((x, i) => x + (b[i]! - x) * w), ...reference.slice(5)];
    };
    const build = (peak: number, knots: number): Curve | undefined => {
      const times = Array.from({ length: knots + 1 }, (_, i) => (peak * i) / knots).concat(
        Array.from({ length: knots }, (_, i) => peak + ((1 - peak) * (i + 1)) / knots),
      );
      const values = [entry];
      let previousReference = entry;
      for (const u of times.slice(1, -1)) {
        const reference = input.reference(u);
        const wanted = u <= peak
          ? start + (input.apex - start) * smooth(u / peak)
          : input.apex + (closed - input.apex) * smooth((u - peak) / (1 - peak));
        const readAt = read(input.wrist(u), reference);
        const ref = guideAt(u, peak, coordinates(reference));
        const predict = values.at(-1)!.map((x, i) => x + 0.55 * (ref[i]! - previousReference[i]!));
        const finish = smooth((u - 0.9) / 0.1);
        const guide = predict.map((x, i) => x * (1 - finish) + end[i]! * finish);
        const pad = CONTACT_MARGIN * Math.min(1, (1 - u) / 0.035);
        const lower = [pad, pad, -0.00025, -0.00025, -0.00025];
        let candidate = pickUpDigitProjection(readAt, wanted, lower, guide);
        for (const alternative of [values.at(-1)!, ref, end]) {
          if (candidate.error <= FIT) break;
          const fit = pickUpDigitProjection(readAt, wanted, lower, alternative);
          if (fit.error < candidate.error) candidate = fit;
        }
        if (candidate.error > FIT) return undefined;
        values.push(candidate.angles);
        previousReference = ref;
      }
      return interpolate(times, [...values, end]);
    };
    const evaluate = (curve: Curve) => assess((u) => input.display(u, (t) => shape(curve(t))));
    const first = build(input.peak, KNOTS);
    const check = first === undefined ? undefined : evaluate(first);
    if (first !== undefined && check !== undefined && accepted(check))
      return (u) => shape(first(u));
    // Refine interpolation when the exact display misses clearance or aperture.
    // Retiming is only needed when the displayed maximum misses its phase band.
    const phase = check?.passes === true
      ? Math.max(0.61, Math.min(0.64, 2 * input.peak - check.peak))
      : input.peak;
    const refined = build(phase, Math.ceil(1.5 * KNOTS));
    return refined !== undefined && accepted(evaluate(refined))
      ? (u) => shape(refined(u))
      : undefined;
  };
  return { close, course, verifies: (display) => accepted(assess(display)) };
}

export namespace preparePickUpDigitCourse {
  export interface IModel {
    close(wrist: Wrist, closed: IShape, apex: number): IShape | undefined;
    course(input: ICourse): FingerReader | undefined;
    verifies(display: (share: number) => Layer): boolean;
  }
  export interface ICourse {
    wrist(share: number): Wrist;
    display(share: number, digits: FingerReader): Layer;
    reference: FingerReader;
    closed: IShape;
    apex: number;
    peak: number;
  }
}
