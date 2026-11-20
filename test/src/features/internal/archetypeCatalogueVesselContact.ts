import { createDrinkware } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanObject,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "./archetypeExtent";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/** The film subject owns the same runtime identity in every case. */
const ACTOR: string = "a";

/** The vessel shapes exercised by the same composed hand relations. */
type Vessel = "glass" | "mug";

/** Legal relation and action pairs on a drinking vessel. */
type Action = "hold" | "use" | "carry";

/** A produced vessel before the actor moves it. */
type Model = ReturnType<typeof createDrinkware>;

/** A scalar physical observation and its exact replay location. */
interface IWorst {
  gap: number;
  seed: number;
  seconds: number;
}

/** A measured dimension and its independent source interval, in metres. */
type Span = readonly [
  axis: string,
  value: number,
  minimum: number,
  maximum: number,
];

/**
 * Reads the produced material and the posed actor across a fixed vessel seed range.
 *
 * @param kind The produced vessel.
 * @param action The post-pickup relation.
 * @param name The surveyed body.
 * @param first First model seed, inclusive.
 * @param last Last model seed, exclusive.
 * @throws {Error} When a seeded film violates a material or motion bound.
 */
export function archetypeCatalogueVesselContact(
  kind: Vessel,
  action: Action,
  name: "m-average" | "f-average",
  first: number,
  last: number,
): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const handle: "body" | "handle" =
    kind === "glass" || action === "use" ? "body" : "handle";
  const profile = [...HumanColliders.bones(body)];
  const hand = HumanColliders.preparePlaced(
    body,
    new Set(profile.filter((bone): boolean => /^right(Hand|Thumb)/.test(bone))),
  );
  const curlingDigit = handle === "handle" ? "rightLittle" : "rightIndex";
  const joints = profile.filter((bone): boolean =>
    bone.startsWith(curlingDigit),
  );
  const failures: Map<string, string> = new Map();
  const label: string = `${kind}/${action}/${name}`;
  const extrema: Map<string, { low: number; high: number }> = new Map();
  const worst: Map<string, IWorst> = new Map();
  for (let seed: number = first; seed < last; ++seed) {
    try {
      const model: Model = createDrinkware({ kind }, seed);
      const shapes: IAutoMoviePhysicalShape[] = model.shapes();
      const gripShape: IAutoMoviePhysicalShape = shapes.find(
        (shape: IAutoMoviePhysicalShape): boolean => shape.id === handle,
      )!;
      const height: number = archetypeExtent(shapes, "y", ["body"]).high;
      const radius: number = archetypeExtent(shapes, "z", ["body"]).high;
      const controls: readonly Span[] =
        kind === "glass"
          ? [
              ["height", height, 0.14, 0.15],
              ["diameter", 2 * radius, 0.083, 0.089],
            ]
          : [
              ["height", height, 3.88 * 0.0254, 3.88 * 0.0254],
              ["diameter", 2 * radius, 3.5 * 0.0254, 3.5 * 0.0254],
              [
                "handle bar",
                archetypeExtent(shapes, "z", ["handle"]).size,
                0.008,
                0.016,
              ],
            ];
      for (const control of controls)
        span(extrema, failures, label, seed, control);
      const film: motionHumanLaw.IFilm = vesselFilm(
        model,
        body,
        action,
        handle,
        `catalogue/${label}`,
      );
      const closed: number = motionHumanLaw.event(film, "gripClosed");
      const start: number = closed + 1e-5;
      const end: number = film.duration;
      const mark: IAutoMovieVector3 = gripShape.transform.position;
      const edge: IAutoMovieVector3 = Vector3.add(mark, {
        x: 0,
        y: 0,
        z: 0.03,
      });
      const closedBones: motionHumanLaw.Bones = film.bones(ACTOR, start);
      const closedAngles = joints.map(
        (bone) => closedBones.get(bone)!.localRotation,
      );
      const placed: IAutoMovieRigidTransform = film.performance.prop(
        "vessel",
        start,
      );
      const initial: IAutoMovieRigidTransform = relative(
        wristOf(closedBones),
        placed,
      );
      const idle: motionHumanLaw.Bones = film.bones(ACTOR, 0);
      const fingerAngle = (bones: motionHumanLaw.Bones): number =>
        (Math.max(
          ...joints.map((bone, i): number =>
            Quaternion.angle(bones.get(bone)!.localRotation, closedAngles[i]!),
          ),
        ) *
          180) /
        Math.PI;
      if (!(fingerAngle(idle) > 1))
        record(
          failures,
          `${label}/closure`,
          `${label} seed ${seed} never closes the ${curlingDigit} grasp from its idle pose`,
        );
      if (seed === 0 && kind === "glass" && action === "hold")
        verifyTwistRejection(initial, mark, edge);
      const seam: number = film.performance.segments(ACTOR)[0]!.end;
      const meet: number | undefined =
        action === "use" ? motionHumanLaw.event(film, "atMouth") : undefined;
      for (const seconds of [
        seam - 1e-5,
        seam + 1e-5,
        ...Array.from(
          { length: 9 },
          (_: unknown, index: number): number =>
            start + (end - start) * (index / 8),
        ),
        ...(meet === undefined ? [] : [meet]),
      ]) {
        const bones: motionHumanLaw.Bones = film.bones(ACTOR, seconds);
        const prop: IAutoMovieRigidTransform = film.performance.prop(
          "vessel",
          seconds,
        );
        const current: IAutoMovieRigidTransform = relative(
          wristOf(bones),
          prop,
        );
        const drift: number = heldDrift(initial, current, mark, edge);
        observe(worst, "rigid grip", drift, seed, seconds);
        observe(
          worst,
          "curl drift (degrees)",
          fingerAngle(bones),
          seed,
          seconds,
        );
        const gaps = { "palm grip": Infinity, "thumb grip": Infinity };
        for (const part of hand(bones)) {
          const role = part.bone === "rightHand" ? "palm grip" : "thumb grip";
          gaps[role] = Math.min(
            gaps[role],
            ...part.shapes.map((shape: IAutoMoviePhysicalShape): number =>
              physicalShapePairDistance(part.pose, shape, prop, gripShape),
            ),
          );
        }
        observe(worst, "palm grip", Math.abs(gaps["palm grip"]), seed, seconds);
        observe(
          worst,
          "thumb grip",
          Math.abs(gaps["thumb grip"]),
          seed,
          seconds,
        );
      }
      if (meet !== undefined) {
        const prop: IAutoMovieRigidTransform = film.performance.prop(
          "vessel",
          meet,
        );
        const rim: IAutoMovieVector3 = point(prop, {
          x: 0,
          y: height,
          z: radius,
        });
        const mouth: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions.mouth;
        const lips: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          mouth,
          film.bones(ACTOR, meet).get(mouth.bone)!,
        ).point;
        observe(worst, "physical rim", Vector3.distance(rim, lips), seed, meet);
      }
      if (
        action === "carry" &&
        film.performance.prop("vessel", end).position.z - placed.position.z <
          0.5
      )
        record(
          failures,
          `${label}/travel`,
          `${label} seed ${seed} did not carry the vessel forward by 0.5 m`,
        );
    } catch (error) {
      record(
        failures,
        `${label}/admission`,
        `${label} seed ${seed}: ${String(error)}`,
      );
    }
  }
  if (first === 0 && last === 200)
    for (const [axis, bounds] of extrema) {
      const model: Model = createDrinkware({ kind }, 0);
      const band =
        model.provenance.bands[
          axis === "handle bar"
            ? "handleDiameter"
            : axis === "height"
              ? "height"
              : "diameter"
        ]!;
      if (bounds.high - bounds.low + 1e-9 < 0.8 * (band.maximum - band.minimum))
        record(
          failures,
          `${label}/${axis}/spread`,
          `${label} ${axis} covered less than 80 percent of its cited band`,
        );
    }
  report(failures, label, worst, {
    "palm grip": 0.01,
    "thumb grip": 0.01,
    "curl drift (degrees)": 1,
    "rigid grip": 0.001,
    "physical rim": 0.01,
  });
  TestValidator.equals(
    label + " seeds " + first + " to " + (last - 1),
    [...failures.values()],
    [],
  );
}

/** Adjacent requests exercise the exact handle and facing admissions. */
export namespace archetypeCatalogueVesselContact {
  /** A missing grip and a known unfit orientation must each name the actual constraint. */
  export function refusals(): void {
    const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const cases: readonly [Vessel, Action, "handle" | "facing", string][] = [
      ["glass", "hold", "handle", "catalogue/refused-handle"],
      ["mug", "use", "facing", "catalogue/mug/use/m-average"],
    ];
    for (const [kind, action, axis, seed] of cases) {
      let rejected: unknown;
      try {
        vesselFilm(createDrinkware({ kind }, 0), body, action, "handle", seed);
      } catch (error) {
        rejected = error;
      }
      TestValidator.predicate(
        `seed zero ${kind} ${action} names its ${axis} refusal`,
        rejected instanceof HumanRefusal &&
          rejected.kind === (axis === "handle" ? "affordance" : "reach") &&
          rejected.axis === axis &&
          rejected.fix.length > 0 &&
          (axis !== "handle" ||
            (rejected.feasible?.kind === "alternatives" &&
              rejected.feasible.values.includes("body"))),
      );
    }
  }
}

/** Author one wholly public pickup and its subsequent act. */
function vesselFilm(
  model: Model,
  body: IAutoMovieMotionHumanBody,
  action: Action,
  handle: "body" | "handle",
  seed: string,
): motionHumanLaw.IFilm {
  const placement: IAutoMovieMotionHumanProp = HumanObject.prop(
    "vessel",
    model,
    {
      at: {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: handle === "handle" ? 180 : 0,
    },
  );
  const picked: IAutoMovieMotionHumanChain = HumanChain.subject(ACTOR).pickUp({
    prop: "vessel",
    handle,
    ...(action === "use"
      ? { use: { tip: "lip", line: "square" as const, at: "mouth" as const } }
      : {}),
  });
  const chain: IAutoMovieMotionHumanChain =
    action === "use"
      ? picked.handToFace({
          task: "drink",
          prop: "vessel",
          grasp: { handle, line: "square" },
        })
      : action === "carry"
        ? picked.walk({ to: { x: 0, y: 0, z: 1 } })
        : picked.stand({ seconds: 0.5, sway: 0 });
  return motionHumanLaw.perform(seed, [{ subject: ACTOR, body }], chain, [
    placement,
  ]);
}

/** Read the displayed right wrist, in world coordinates. */
function wristOf(bones: motionHumanLaw.Bones): IAutoMovieRigidTransform {
  const wrist = bones.get("rightHand")!;
  return { position: wrist.worldPosition, rotation: wrist.worldRotation };
}

/** Express the independently displayed prop in the displayed wrist frame. */
function relative(
  wrist: IAutoMovieRigidTransform,
  prop: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const inverse = Quaternion.inverse(wrist.rotation);
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(prop.position, wrist.position),
    ),
    rotation: Quaternion.multiply(inverse, prop.rotation),
  };
}

/** Bound translation and every angular direction at the same 30 mm lever arm. */
function heldDrift(
  initial: IAutoMovieRigidTransform,
  current: IAutoMovieRigidTransform,
  mark: IAutoMovieVector3,
  edge: IAutoMovieVector3,
): number {
  return Math.max(
    Vector3.distance(point(initial, mark), point(current, mark)),
    Vector3.distance(point(initial, edge), point(current, edge)),
    0.06 * Math.sin(Quaternion.angle(initial.rotation, current.rotation) / 2),
  );
}

/** A twist about the original two-point line leaves both points fixed. */
function verifyTwistRejection(
  initial: IAutoMovieRigidTransform,
  mark: IAutoMovieVector3,
  edge: IAutoMovieVector3,
): void {
  const rotation = Quaternion.multiply(
    initial.rotation,
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
  );
  const twisted: IAutoMovieRigidTransform = {
    rotation,
    position: Vector3.subtract(
      point(initial, mark),
      Quaternion.rotateVector(rotation, mark),
    ),
  };
  TestValidator.predicate(
    "a twist invisible to both markers exceeds the rigid grip bound",
    Vector3.distance(point(initial, mark), point(twisted, mark)) <= 1e-9 &&
      Vector3.distance(point(initial, edge), point(twisted, edge)) <= 1e-9 &&
      heldDrift(initial, twisted, mark, edge) > 0.001,
  );
}

/** Place a material point by the public rigid transform. */
function point(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}

/** Read a sourced dimension and update its observed spread. */
function span(
  extrema: Map<string, { low: number; high: number }>,
  failures: Map<string, string>,
  label: string,
  seed: number,
  [axis, value, minimum, maximum]: Span,
): void {
  if (!(value >= minimum - 1e-9 && value <= maximum + 1e-9)) {
    record(
      failures,
      `${label}/${axis}`,
      `${label} seed ${seed} ${axis} ${value} m outside [${minimum}, ${maximum}]`,
    );
    return;
  }
  const bounds: { low: number; high: number } = extrema.get(axis) ?? {
    low: value,
    high: value,
  };
  bounds.low = Math.min(bounds.low, value);
  bounds.high = Math.max(bounds.high, value);
  extrema.set(axis, bounds);
}

/** Keep only the largest gap for a metric and the seed that reproduces it. */
function observe(
  worst: Map<string, IWorst>,
  metric: string,
  gap: number,
  seed: number,
  seconds: number,
): void {
  const previous: IWorst | undefined = worst.get(metric);
  if (previous === undefined || !(gap <= previous.gap))
    worst.set(metric, {
      gap: Number.isFinite(gap) ? gap : Infinity,
      seed,
      seconds,
    });
}

/** Compare the exact reported extrema with their independently stated bounds. */
function report(
  failures: Map<string, string>,
  label: string,
  worst: Map<string, IWorst>,
  limits: Readonly<Record<string, number>>,
): void {
  for (const [metric, sample] of worst) {
    const bound: number = limits[metric]!;
    if (!(sample.gap <= bound))
      record(
        failures,
        `${label}/${metric}`,
        `${label} ${metric} ${sample.gap} exceeds ${bound}, seed ${sample.seed} at ${sample.seconds} s`,
      );
    console.log(
      `${label} ${metric} max ${sample.gap}, seed ${sample.seed} at ${sample.seconds} s`,
    );
  }
}

/** Keep one representative failure per cause while the complete pass finishes. */
function record(
  failures: Map<string, string>,
  key: string,
  message: string,
): void {
  if (!failures.has(key)) failures.set(key, message);
}
