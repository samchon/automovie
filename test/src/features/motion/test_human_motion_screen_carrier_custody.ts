import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCarrierCustody,
  HumanChain,
  HumanHand,
  HumanPerformance,
  HumanPropFrame,
  HumanRefusal,
  poseBones,
  putDownAperture,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

const { predicate, equals } = TestValidator;

/** Rigid attachment and insertion allowances in metres and radians. */
const RIGID: number = 0.001;
const PLACE: number = 0.015;
const ANGLE: number = Math.PI / 12;

/** The display's surfaces and the shallow case's opening and seat. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const IDENTITY = Quaternion.identity();
const REST: IAutoMovieRigidTransform = { position: ZERO, rotation: IDENTITY };
const SEAT: IAutoMovieVector3 = { ...ZERO, y: 0.02 };
const OPENING: IAutoMovieVector3 = { ...ZERO, y: 0.075 };
const GRIP: IAutoMovieVector3 = { ...ZERO, y: 0.06 };
const LABEL: IAutoMovieVector3 = { x: 0.013, y: 0.025, z: 0 };
const RADIUS: number = 0.021;
const BASE_RADIUS: number = 0.014;
const MOUTH: number = 0.045;
const INNER: number = 0.048;
const SPHERES = [
  ["cap", GRIP, RADIUS],
  ["base", ZERO, BASE_RADIUS],
] as const;

/** The installed laws used by the authored composition. */
const Chain = HumanChain.extend({
  putDownAperture,
  takeFromCarrier: HumanCarrierCustody,
});

/**
 * An inert ornament keeps its identity through a shallow case, a hand, and
 * the same case again. The case can rest on a table or travel on the actor.
 *
 * Scenarios:
 * 1. Confirm grip, clearance, return and seek for resting and worn cases on both bodies.
 * 2. Cut before closure, at closure, during loading and during the early rise.
 * 3. Refuse a missing carrier, an invalid socket and an unreachable seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged props, custody sequence, display samples, cuts and invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the registered pickup and aperture placement through HumanChain. Observes displayed props and bones around custody changes and cuts.
 * @evidence contracts/development/testing.md#independent-expectations Uses authored case and label offsets, the rigid hand transform, both sphere radii, existing insertion allowances and the 1 mm mount bound. The shape and motion readings cover the sampled instants of the fixture.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares a resting case and a case the performer moves, measures at and on either side of closure, and removes one reference or fit at a time.
 * @evidence contracts/development/testing.md#execution-ownership The synchronous native specification builds local bodies, compositions and display-frame readers. Website and installed replay own host checks.
 */
export function test_human_motion_screen_carrier_custody(): void {
  const failures: string[] = [];
  /** Collect each independent scenario's failure before reporting the round. */
  const run = (label: string, check: () => void): void => {
    try {
      check();
    } catch (error: unknown) {
      failures.push(
        label + " " + (error instanceof Error ? error.message : String(error)),
      );
    }
  };

  for (const [cast, worn] of [
    ["m-average", false],
    ["m-average", true],
    ["f-small", true],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
    const name: string = cast + (worn ? " worn case" : " resting case");
    const props: IAutoMovieMotionHumanProp[] = fixture(body, worn);
    const move = { to: { x: 0.25, y: 0, z: 0.35 }, face: 40 };
    const pose = { seconds: 0.5, sway: 0 };

    /** Resolve each variation through the public performance constructor. */
    const scene = (
      chain: IAutoMovieMotionHumanChain,
      objects: IAutoMovieMotionHumanProp[] = props,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "screen-carrier-custody",
        props: objects,
        laws: [putDownAperture, HumanCarrierCustody],
        performers: [
          {
            subject: "curator",
            body,
            at: ZERO,
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    /** Begin the same grasp without relying on an already held prop. */
    const pickup = (): ReturnType<typeof Chain.subject> =>
      Chain.subject("curator").takeFromCarrier({
        prop: "ornament",
        handle: "roundedCap",
        lift: 0.11,
      });
    /** Return through the named clear opening to a seat, then move the actor. */
    const route = (point: string = "seated"): IAutoMovieMotionHumanChain =>
      pickup()
        .stand(pose)
        .putDownAperture({
          prop: "ornament",
          onto: { prop: "case", aperture: "opening", point },
        })
        .walk(move);

    const pickupOnly: HumanPerformance = scene(pickup().stand(pose));
    const reach: IAutoMovieMotionHumanSegment =
      pickupOnly.segments("curator")[0]!;
    const close: number = event(reach, "gripClosed");
    const liftOff: number = event(reach, "liftOff");
    const lifted: number = event(reach, "lifted");

    run(name + " pickup", () => {
      for (const t of [close - 0.01, close, close + 0.01])
        predicate(
          "seated through grip closure",
          same(caseLocal(pickupOnly, t), { ...REST, position: SEAT }, RIGID),
        );
      const palm: IAutoMovieVector3 = HumanHand.frame(
        body,
        pickupOnly.bones("curator", close),
        "right",
        "palm",
        "flat",
      ).point;
      const grip: IAutoMovieVector3 = pointAt(
        pickupOnly.prop("ornament", close),
        GRIP,
      );
      predicate(
        "the displayed palm closes on the cap",
        Vector3.distance(palm, grip) <= RADIUS + 0.025,
      );
      for (const phase of [0.25, 0.5, 0.75, 1]) {
        const frame: IAutoMovieRigidTransform = caseLocal(
          pickupOnly,
          liftOff + (lifted - liftOff) * phase,
        );
        predicate(
          "the ornament lifts clear on the opening's line",
          Math.hypot(frame.position.x, frame.position.z) <= PLACE &&
            clearsCase(frame),
        );
      }
      predicate(
        "the lower edge clears the mouth",
        caseLocal(pickupOnly, lifted).position.y - BASE_RADIUS > MOUTH,
      );
      predicate(
        "the wrist offset survives the held beat",
        same(
          handLocal(pickupOnly, lifted),
          handLocal(pickupOnly, pickupOnly.duration - 0.1),
          RIGID,
        ),
      );
    });

    run(name + " return and seek", () => {
      const film: HumanPerformance = scene(route());
      const placement: IAutoMovieMotionHumanSegment =
        film.segments("curator")[2]!;
      const opening: number = event(placement, "aperture");
      const placed: number = event(placement, "placed");
      const release: number = event(placement, "release");
      predicate(
        "return contacts occur in order",
        lifted < opening && opening < placed && placed < release,
      );
      for (const [t, target] of [
        [opening, OPENING],
        [placed, SEAT],
        [release, SEAT],
      ] as const) {
        const relative: IAutoMovieRigidTransform = caseLocal(film, t);
        predicate(
          "the ornament meets the case at " + t,
          Vector3.distance(relative.position, target) <= PLACE &&
            Quaternion.angle(relative.rotation, REST.rotation) <= ANGLE,
        );
      }
      for (const share of [0.25, 0.5, 0.75])
        predicate(
          "the ornament fits inside the opening as it descends",
          clearsCase(caseLocal(film, opening + (placed - opening) * share)),
        );
      for (const t of [close, opening, placed, release]) continuous(film, t);

      const end: number = film.duration;
      predicate(
        "the ornament stays seated after travel",
        same(caseLocal(film, release), caseLocal(film, end), RIGID),
      );
      if (worn) {
        const atRelease: IAutoMovieRigidTransform = film.prop("case", release);
        const afterTravel: IAutoMovieRigidTransform = film.prop("case", end);
        predicate(
          "the worn case moves and turns",
          Vector3.distance(atRelease.position, afterTravel.position) > 0.1 &&
            Quaternion.angle(atRelease.rotation, afterTravel.rotation) > 0.2,
        );
      }
      const aroundGrip: number[] = [close - 0.001, close, close + 0.001];
      const events: number[] = [lifted, opening, placed, release];
      const times: number[] = [0, ...aroundGrip, ...events, end];
      const frames: IAutoMovieRigidTransform[] = times.map(
        (t: number): IAutoMovieRigidTransform => film.prop("ornament", t),
      );
      for (const i of [...times.keys()].reverse().concat([...times.keys()])) {
        const t: number = times[i]!;
        predicate(
          "seek restores the ornament pose",
          same(film.prop("ornament", t), frames[i]!, 1e-8),
        );
        keepsLabel(film, t);
      }
    });

    for (const [phase, t] of [
      ["before", close * 0.7],
      ["closing", close],
      ["loading", (close + liftOff) / 2],
      ["rising", liftOff + (lifted - liftOff) * 0.3],
    ] as const)
      run(name + " interrupt " + phase, () => {
        const paused = pickup()
          .until({ share: (t - reach.start) / reach.plan.duration })
          .stand(pose);
        const movedBeforeGrip: boolean = phase === "before";
        const cut: HumanPerformance = scene(
          movedBeforeGrip ? paused.walk(move) : paused,
        );
        const end: number = cut.duration;
        const held: string | undefined =
          cut.segments("curator")[1]!.context.entry.holds.right;
        equals(
          "cut keeps the current custody",
          held,
          movedBeforeGrip ? undefined : "ornament",
        );
        for (let i: number = 0; i <= 24; ++i)
          predicate(
            "the cut leaves the ornament clear of the case",
            clearsCase(caseLocal(cut, t + (end - t) * (i / 24))),
          );
        continuous(cut, t);
        keepsLabel(cut, end);
        predicate(
          "the cut preserves the attached frame",
          movedBeforeGrip
            ? same(caseLocal(cut, end), { ...REST, position: SEAT }, RIGID)
            : same(handLocal(cut, t), handLocal(cut, end), RIGID),
        );
      });
    if (cast === "m-average" && !worn) {
      const carrier: IAutoMovieMotionHumanProp = props[0]!;
      const ornament: IAutoMovieMotionHumanProp = props[1]!;
      const noSeat: IAutoMovieMotionHumanProp = {
        ...carrier,
        affordances: carrier.affordances?.filter(
          (site: IAutoMovieAffordance): boolean => site.id !== "seated",
        ),
      };
      for (const [axis, build] of [
        ["props.ornament.mounted.prop", () => scene(pickup(), [ornament])],
        [
          "props.ornament.mounted.point",
          () => scene(pickup(), [noSeat, ornament]),
        ],
        ["prop", () => scene(route("far"))],
      ] as const)
        run(axis, () => {
          let refusal: unknown;
          try {
            build();
          } catch (error: unknown) {
            refusal = error;
          }
          predicate(
            "invalid custody refuses at " + axis,
            refusal instanceof HumanRefusal && refusal.axis === axis,
          );
        });
    }
  }
  equals("carrier custody findings", failures, []);
}

/** Build the same scene-local prop identities for either carrier placement. */
function fixture(
  body: IAutoMovieMotionHumanBody,
  worn: boolean,
): IAutoMovieMotionHumanProp[] {
  const initial: IAutoMovieRigidTransform = {
    position: { x: -0.23, y: 0.88 * body.measure.hipHeight, z: 0.34 },
    rotation: REST.rotation,
  };
  const carrier: IAutoMovieMotionHumanProp = {
    subject: "case",
    frame: initial,
    points: {},
    affordances: [
      socket("seated", SEAT),
      socket("opening", OPENING),
      socket("far", { ...SEAT, z: 4 }),
    ],
    shapes: walls(),
  };
  if (worn) {
    const neutral = resolveHumanPosture(body, stand.posture(body, ZERO, 0));
    const hips = HumanPropFrame.bone(poseBones(body, neutral).get("hips")!);
    carrier.worn = {
      subject: "curator",
      bone: "hips",
      offset: HumanPropFrame.relative(hips, initial),
    };
  }
  const ornament: IAutoMovieMotionHumanProp = {
    subject: "ornament",
    frame: REST,
    points: {},
    mounted: { prop: "case", point: "seated", offset: REST },
    affordances: [
      {
        ...socket("roundedCap", GRIP),
        kind: "handle",
        grip: "power",
        symmetry: "round",
        aperture: 2 * RADIUS,
      },
      socket("label", LABEL),
    ],
    shapes: SPHERES.map(
      ([id, position, radius]): IAutoMoviePhysicalShape => ({
        id,
        kind: "sphere",
        radius,
        material: "foam",
        transform: { ...REST, position },
      }),
    ),
  };
  const label: IAutoMovieMotionHumanProp = {
    subject: "label",
    frame: REST,
    points: {},
    mounted: { prop: "ornament", point: "label", offset: REST },
  };
  return [carrier, ornament, label];
}

/** A socket authored in the prop's local frame. */
function socket(id: string, position: IAutoMovieVector3): IAutoMovieAffordance {
  const frame = Transform.of(position, REST.rotation);
  return { id, kind: "socket", frame, extent: null };
}

/** Four walls and a floor define a shallow case with an open top. */
function walls(): IAutoMoviePhysicalShape[] {
  const wall: number = 0.004;
  const outer: number = INNER + 2 * wall;
  const halfHeight: number = MOUTH / 2;
  const side: number = INNER + wall;
  const endSize: IAutoMovieVector3 = { x: outer, y: halfHeight, z: wall };
  const sideSize: IAutoMovieVector3 = { x: wall, y: halfHeight, z: INNER };
  return (
    [
      ["front", { x: 0, y: halfHeight, z: side }, endSize],
      ["back", { x: 0, y: halfHeight, z: -side }, endSize],
      ["left", { x: -side, y: halfHeight, z: 0 }, sideSize],
      ["right", { x: side, y: halfHeight, z: 0 }, sideSize],
      ["base", { x: 0, y: 0.002, z: 0 }, { x: outer, y: 0.002, z: outer }],
    ] as const
  ).map(
    ([id, position, halfExtents]): IAutoMoviePhysicalShape => ({
      id,
      kind: "box",
      material: "foam",
      transform: { ...REST, position },
      halfExtents,
    }),
  );
}

/** Compare the two posed sphere centres to the open top or the inner walls and floor. */
function clearsCase(frame: IAutoMovieRigidTransform): boolean {
  return SPHERES.every(([, point, radius]): boolean => {
    const centre: IAutoMovieVector3 = pointAt(frame, point);
    return (
      centre.y - radius > MOUTH ||
      (centre.y - radius >= 0.004 &&
        Math.max(Math.abs(centre.x), Math.abs(centre.z)) + radius < INNER)
    );
  });
}

/** Map an action event to film seconds. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const cue = segment.plan.events.find(
    (candidate): boolean => candidate.name === name,
  )!;
  return segment.start + segment.plan.duration * cue.share;
}

/** Place a local landmark in its displayed parent frame. */
function pointAt(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    frame.rotation,
    point,
  );
  return Vector3.add(frame.position, offset);
}

/** Observe the ornament in the case's displayed frame. */
function caseLocal(
  film: HumanPerformance,
  t: number,
): IAutoMovieRigidTransform {
  const carrier: IAutoMovieRigidTransform = film.prop("case", t);
  return HumanPropFrame.relative(carrier, film.prop("ornament", t));
}

/** Observe the ornament in the hand's displayed frame. */
function handLocal(
  film: HumanPerformance,
  t: number,
): IAutoMovieRigidTransform {
  const hand = film.bones("curator", t).get("rightHand")!;
  return HumanPropFrame.relative(
    HumanPropFrame.bone(hand),
    film.prop("ornament", t),
  );
}

/** The child prop follows the same ornament on either carrier. */
function keepsLabel(film: HumanPerformance, t: number): void {
  const ornament: IAutoMovieRigidTransform = film.prop("ornament", t);
  const label: IAutoMovieRigidTransform = film.prop("label", t);
  const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
    ornament,
    label,
  );
  predicate(
    "the same label stays attached",
    same(local, { ...REST, position: LABEL }, RIGID),
  );
}

/** Test the displayed prop across the boundary of a transfer or cut. */
function continuous(film: HumanPerformance, t: number): void {
  const before: IAutoMovieRigidTransform = film.prop("ornament", t - 0.0001);
  const after: IAutoMovieRigidTransform = film.prop("ornament", t + 0.0001);
  predicate("the ornament does not jump at " + t, same(before, after, RIGID));
}

/** Compare the displayed translation and attitude at the stated bounds. */
function same(
  a: IAutoMovieRigidTransform,
  b: IAutoMovieRigidTransform,
  distance: number,
): boolean {
  return (
    Vector3.distance(a.position, b.position) <= distance &&
    Quaternion.angle(a.rotation, b.rotation) <= 0.001
  );
}
