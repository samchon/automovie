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

/** A scalar physical observation in metres and its exact replay location. */
interface IWorst {
  gap: number;
  seed: number;
  seconds: number;
}

/** An independent closed interval observed directly on the emitted shape. */
interface ISpan {
  label: string;
  minimum: number;
  maximum: number;
  read: () => number;
}

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
      const controls: readonly ISpan[] =
        kind === "glass"
          ? [
              {
                label: "height",
                minimum: 0.14,
                maximum: 0.15,
                read: () => height,
              },
              {
                label: "diameter",
                minimum: 0.083,
                maximum: 0.089,
                read: () => 2 * radius,
              },
            ]
          : [
              {
                label: "height",
                minimum: 3.88 * 0.0254,
                maximum: 3.88 * 0.0254,
                read: () => height,
              },
              {
                label: "diameter",
                minimum: 3.5 * 0.0254,
                maximum: 3.5 * 0.0254,
                read: () => 2 * radius,
              },
              {
                label: "handle bar",
                minimum: 0.008,
                maximum: 0.016,
                read: () => archetypeExtent(shapes, "z", ["handle"]).size,
              },
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
      const initial: [IAutoMovieVector3, IAutoMovieVector3] = [
        heldPoint(film, start, mark),
        heldPoint(film, start, edge),
      ];
      const colliders: ReturnType<typeof HumanColliders.placed> =
        HumanColliders.placed(body, film.bones(ACTOR, start));
      const placed: IAutoMovieRigidTransform = film.performance.prop(
        "vessel",
        start,
      );
      const surface: number = Math.min(
        ...colliders
          .filter((part): boolean =>
            /^right(Hand|Thumb|Index|Middle|Ring|Little)/.test(part.bone),
          )
          .flatMap((part) =>
            part.shapes.map((shape: IAutoMoviePhysicalShape): number =>
              physicalShapePairDistance(part.pose, shape, placed, gripShape),
            ),
          ),
      );
      observe(worst, "grip surface", Math.abs(surface), seed, start);
      const seam: number = film.performance.segments(ACTOR)[0]!.end;
      for (const seconds of [
        seam - 1e-5,
        seam + 1e-5,
        ...Array.from(
          { length: 9 },
          (_: unknown, index: number): number =>
            start + (end - start) * (index / 8),
        ),
      ]) {
        const drift: number = Math.max(
          Vector3.distance(heldPoint(film, seconds, mark), initial[0]),
          Vector3.distance(heldPoint(film, seconds, edge), initial[1]),
        );
        observe(worst, "rigid grip", drift, seed, seconds);
      }
      if (action === "use") {
        const meet: number = motionHumanLaw.event(film, "atMouth");
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
    "grip surface": 0.01,
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

/** Read a material point in the displayed right wrist's local coordinates. */
function heldPoint(
  film: motionHumanLaw.IFilm,
  seconds: number,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  const wrist = film.bones(ACTOR, seconds).get("rightHand")!;
  return Quaternion.rotateVector(
    Quaternion.inverse(wrist.worldRotation),
    Vector3.subtract(
      point(film.performance.prop("vessel", seconds), local),
      wrist.worldPosition,
    ),
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
  control: ISpan,
): void {
  const value: number = control.read();
  if (!(value >= control.minimum - 1e-9 && value <= control.maximum + 1e-9)) {
    record(
      failures,
      `${label}/${control.label}`,
      `${label} seed ${seed} ${control.label} ${value} m outside [${control.minimum}, ${control.maximum}]`,
    );
    return;
  }
  const bounds: { low: number; high: number } = extrema.get(control.label) ?? {
    low: value,
    high: value,
  };
  bounds.low = Math.min(bounds.low, value);
  bounds.high = Math.max(bounds.high, value);
  extrema.set(control.label, bounds);
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
