import { createSkateboard, createSurfboard } from "@automovie/archetypes/sport";
import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSurface,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRide,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/** Stage origin in metres. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
/** The vertical axis of the stage heading. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
/** The local skateboard axle around which the tail pitches. */
const ACROSS: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
/** The established motion support tolerance in metres. */
const GAP: number = 0.01;
/** Each foot and palm has its own material support. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Measure ground push, tail strike, landing and bilateral deck recovery on
 * two polygon bodies. Verify their water mount, displayed palm-to-sole
 * transfer with overlap and flight, banked turn, and geometry refusals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists both public board sequences, observed anatomy and geometry refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Samples actual world transforms and bones through both registered phrases on two production bodies.
 * @evidence contracts/development/testing.md#independent-expectations Skate roll and tail strike follow the authored axle and tail geometry. Surf support checks use model-local material coordinates and the existing 10 mm support tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases The pushing foot is world-fixed while the deck translates. Surf overlap and flight have distinct support windows. Both malformed boards fail closed.
 * @evidence contracts/development/testing.md#execution-ownership The exported case runs public in-memory HumanPerformance with no browser or renderer.
 */
export function test_motion_ride_board_sport_take(): void {
  const failures: string[] = [];
  for (const key of ["f-average", "m-short-legged"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(key);
    const lead: AutoMovieHumanSide = key === "f-average" ? "left" : "right";
    for (const { label, run } of [
      { label: "skate", run: (): void => skate(body, lead, failures) },
      {
        label: "surf overlap",
        run: (): void => surf(body, lead, "overlap", failures),
      },
      {
        label: "surf flight",
        run: (): void => surf(body, lead, "flight", failures),
      },
    ]) {
      const begin: number = failures.length;
      try {
        run();
      } catch (error) {
        failures.push(String(error));
      }
      for (let i: number = begin; i < failures.length; ++i)
        failures[i] = key + " " + label + ": " + failures[i];
    }
  }
  TestValidator.equals("physical board support takes", failures, []);
}

/** Stage one moving skateboard with a tail strike and clean axle landing. */
function skate(
  body: IAutoMovieMotionHumanBody,
  lead: AutoMovieHumanSide,
  failures: string[],
): void {
  const board: ReturnType<typeof createSkateboard> = createSkateboard({
    model: "8.5x33.5",
  });
  const Skate = HumanChain.extend({
    skateboardPhrase: AutoMovieMotionHumanRide.HumanSurface.skateboardPhrase,
  });
  const duration: number = 2.8;
  const windup: number = 0.5;
  const deck: number = board.affordance("deck").frame.translation.y;
  const ready: IAutoMovieVector3 = { ...ZERO, y: deck };
  const yaw: number = lead === "left" ? 90 : -90;
  const trail: AutoMovieHumanSide = lead === "left" ? "right" : "left";
  const neutral = motionHumanStance(body, ready, yaw);
  const prop = HumanObject.prop("board", board, { at: ZERO, yaw: 0 });
  const points = { ...prop.points };
  for (const side of SIDES) {
    const foot = neutral.get(side === "left" ? "leftFoot" : "rightFoot")!;
    const contact: IAutoMovieVector3 = HumanFoot.point(body, side, "sole", {
      ankle: foot.worldPosition,
      rotation: foot.worldRotation,
    });
    points[side] = { point: { ...contact, y: deck }, normal: UP };
  }
  const line: typeof AutoMovieMotionHumanRide.HumanSurface.SKATEBOARD =
    AutoMovieMotionHumanRide.HumanSurface.SKATEBOARD;
  const aft: number = board.affordance("wheel-back-left").frame.translation.z;
  const tail: IAutoMovieVector3 =
    board.affordance("tailStrike").frame.translation;
  const tyre: number = board.dimensions.wheel! / 2;
  const rise: number = tail.y - tyre;
  const run: number = tail.z - aft;
  const pop: number =
    Math.atan2(rise, run) + Math.asin(tyre / Math.hypot(rise, run));
  const track = (seconds: number): IAutoMovieRigidTransform => {
    const at: number = Math.max(0, Math.min(1, (seconds - windup) / duration));
    const pitch: number =
      pop * (ease(at, line.pop, line.tail) - ease(at, line.tail, line.apex));
    const hop: number =
      0.14 * (ease(at, line.lift, line.apex) - ease(at, line.apex, line.land));
    const yaw: number = 12 * ease(at, line.land, 1);
    return {
      position: {
        x: 0.08 * ease(at, line.land, 1),
        y: tyre * (1 - Math.cos(pitch)) + aft * Math.sin(pitch) + hop,
        z: -at * 0.9,
      },
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(UP, yaw),
        Quaternion.fromAxisAngle(ACROSS, pitch / Quaternion.DEG2RAD),
      ),
    };
  };
  const build = (
    motion: (seconds: number) => IAutoMovieRigidTransform,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "skateboard push and ollie",
      performers: [
        {
          subject: "rider",
          body,
          at: ready,
          yaw,
          proficiency: { level: "trained" },
        },
      ],
      props: [{ ...prop, points, motion }],
      laws: [AutoMovieMotionHumanRide.HumanSurface.skateboardPhrase],
      composition: Skate.subject("rider")
        .support({
          stances: [
            {
              seconds: windup,
              contacts: [
                {
                  part: "leftFoot",
                  kind: "bear",
                  target: {
                    kind: "prop",
                    subject: "board",
                    point: "left",
                  },
                },
                {
                  part: "rightFoot",
                  kind: "bear",
                  target: {
                    kind: "prop",
                    subject: "board",
                    point: "right",
                  },
                },
              ],
            },
          ],
        })
        .skateboardPhrase({ on: "board", duration: duration, lead }).node,
    });
  const film: HumanPerformance = build(track);
  collectTakeClean("take", film, failures);
  const action: IAutoMovieMotionHumanSegment = film.segments("rider")[1]!;
  const clock = (share: number): number => action.start + share * duration;
  const deckSole: IAutoMovieVector3 = local(
    film.prop("board", clock(line.push)),
    sole(body, film, lead, clock(line.push)),
  );
  const streetSole: IAutoMovieVector3 = sole(
    body,
    film,
    trail,
    clock(line.push),
  );
  for (const share of [
    line.push,
    (line.push + line.recover) / 2,
    line.recover,
  ]) {
    const time: number = clock(share);
    if (
      !vclose(
        local(film.prop("board", time), sole(body, film, lead, time)),
        deckSole,
        GAP,
      ) ||
      !vclose(sole(body, film, trail, time), streetSole, GAP) ||
      Math.abs(streetSole.y) > GAP ||
      Math.abs(deckSole.y - deck) > GAP
    )
      failures.push("world/deck separation during a ground push at " + share);
  }

  const popFrame: IAutoMovieRigidTransform = film.prop(
    "board",
    clock(line.tail),
  );
  const airborne: IAutoMovieRigidTransform = film.prop(
    "board",
    clock(line.apex),
  );
  if (
    !nclose(world(popFrame, tail).y, 0, 1e-6) ||
    airborne.position.y < 0.12 ||
    SIDES.some(
      (side: AutoMovieHumanSide): boolean =>
        local(airborne, sole(body, film, side, clock(line.apex))).y <=
        deck + GAP,
    ) ||
    action.plan.contacts.some(
      ({ from, to }): boolean => from <= line.apex && to >= line.apex,
    )
  )
    failures.push("tail strike or airborne support schedule");
  for (const share of [line.settle, line.stance, line.land, line.absorb, 1]) {
    const time: number = clock(share);
    const frame: IAutoMovieRigidTransform = film.prop("board", time);
    if (
      Math.abs(
        world(frame, board.affordance("wheel-front-left").frame.translation).y,
      ) > GAP
    )
      failures.push("front wheels missed the street plane at " + share);
    for (const side of SIDES)
      if (
        Math.abs(
          local(frame, sole(body, film, side, time)).y -
            board.affordance("deck").frame.translation.y,
        ) > GAP
      )
        failures.push(side + " sole missed the deck at " + share);
  }
  const before: IAutoMovieVector3 = film
    .bones("rider", clock(line.land) - 0.001)
    .get("hips")!.worldPosition;
  const after: IAutoMovieVector3 = film
    .bones("rider", clock(line.land) + 0.001)
    .get("hips")!.worldPosition;
  if (Vector3.distance(before, after) > GAP)
    failures.push("pelvis snapped at touchdown");
  refused(
    () =>
      build(
        (seconds: number): IAutoMovieRigidTransform => ({
          position: { ...track(seconds).position, y: 0 },
          rotation: Quaternion.identity(),
        }),
      ),
    failures,
  );
}

/** Stage a water approach, a palm-driven transfer, and a banked roll-away. */
function surf(
  body: IAutoMovieMotionHumanBody,
  lead: AutoMovieHumanSide,
  transfer: IAutoMovieMotionHumanSurface.ISurfboardPhraseParams["transfer"],
  failures: string[],
): void {
  const board: ReturnType<typeof createSurfboard> = createSurfboard({
    model: "6'0",
  });
  const Surf = HumanChain.extend({
    surfboardPhrase: AutoMovieMotionHumanRide.HumanSurface.surfboardPhrase,
  });
  const duration: number = 2.65;
  const swimmers = [
    {
      subject: "rider",
      body,
      at: { x: 0, y: 0, z: 1.6 },
      yaw: 180,
      proficiency: { level: "trained" as const },
    },
  ];
  const swimming: ReturnType<typeof Surf.subject> = Surf.subject("rider").swim({
    kind: "frontCrawl",
    count: 1,
    water: 0,
  });
  const first: HumanPerformance = new HumanPerformance({
    seed: "surfboard water mount and popup",
    performers: swimmers,
    composition: swimming.node,
  });
  const entry: number = first.duration;
  const phases: typeof AutoMovieMotionHumanRide.HumanSurface.SURFBOARD =
    AutoMovieMotionHumanRide.HumanSurface.SURFBOARD;
  const track = (seconds: number): IAutoMovieRigidTransform => {
    const share: number = Math.max(
      0,
      Math.min(1, (seconds - entry) / duration),
    );
    const bank: number = ease(share, phases.feet, 1);
    return {
      position: { x: 0.2 * bank, y: -0.016, z: -0.5 * share },
      rotation: Quaternion.multiply(
        Quaternion.fromAxisAngle(UP, 22 * bank),
        Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 8 * bank),
      ),
    };
  };
  const build = (
    motion: (seconds: number) => IAutoMovieRigidTransform,
  ): HumanPerformance =>
    new HumanPerformance({
      seed: "surfboard water mount and popup",
      performers: swimmers,
      props: [HumanObject.prop("board", board, { at: ZERO, yaw: 0 }, motion)],
      laws: [AutoMovieMotionHumanRide.HumanSurface.surfboardPhrase],
      composition: swimming.surfboardPhrase({
        on: "board",
        duration: duration,
        lead,
        transfer,
      }).node,
    });
  const film: HumanPerformance = build(track);
  collectTakeClean("take", film, failures);
  const action: IAutoMovieMotionHumanSegment = film.segments("rider")[1]!;
  const firstFoot: number =
    transfer === "overlap" ? phases.overlap : phases.flight;
  const clock = (share: number): number => action.start + share * duration;
  const transition: number = (firstFoot + phases.release) * 0.5;
  for (const [cue, bone] of [
    [phases.mount, "leftHand"],
    [phases.palms, "leftFoot"],
  ] as const) {
    const before = film.bones("rider", clock(cue) - 1e-4).get(bone)!;
    const after = film.bones("rider", clock(cue) + 1e-4).get(bone)!;
    if (!vclose(before.worldPosition, after.worldPosition, GAP))
      failures.push(bone + " jumps when its reach begins");
  }
  for (const share of [phases.mount, (phases.mount + phases.palms) / 2]) {
    const time: number = clock(share);
    const chest: IAutoMovieMotionHumanBody["surfaces"]["regions"]["sternum"] =
      body.surfaces.regions.sternum;
    const sternum: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      chest,
      film.bones("rider", time).get(chest.bone)!,
    ).point;
    const deck: IAutoMovieVector3 = local(film.prop("board", time), sternum);
    if (Math.abs(deck.y - board.affordance("deck").frame.translation.y) > GAP)
      failures.push("the surface under the paddling chest misses the deck");
  }
  const active: readonly IAutoMovieMotionHumanContactWindow[] =
    action.plan.contacts.filter(
      ({ from, to }): boolean => transition >= from && transition <= to,
    );
  if (active.length !== (transfer === "overlap" ? 3 : 0))
    failures.push("hands and feet did not publish the expected overlap or gap");
  for (const share of [
    phases.palms,
    (phases.palms + phases.release) * 0.5,
    phases.release,
  ]) {
    const time: number = clock(share);
    const frame: IAutoMovieRigidTransform = film.prop("board", time);
    const bones = film.bones("rider", time);
    for (const side of SIDES) {
      const region =
        body.surfaces.regions[side === "left" ? "palmLeft" : "palmRight"];
      const palm: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        region,
        bones.get(region.bone)!,
      ).point;
      const expected: IAutoMovieVector3 = board.affordance(
        side === "left" ? "leftPalm" : "rightPalm",
      ).frame.translation;
      if (!vclose(local(frame, palm), expected, GAP))
        failures.push(side + " palm misses the deck patch at " + share);
    }
  }
  for (const share of [
    firstFoot,
    (firstFoot + phases.feet) / 2,
    phases.feet,
    phases.settle,
    1,
  ]) {
    const time: number = clock(share);
    const frame: IAutoMovieRigidTransform = film.prop("board", time);
    for (const side of share < phases.feet ? [lead] : SIDES) {
      const placed: IAutoMovieVector3 = local(
        frame,
        sole(body, film, side, time),
      );
      const site: IAutoMovieVector3 = board.affordance(
        side === lead ? "frontStance" : "rearStance",
      ).frame.translation;
      if (!vclose(placed, site, GAP))
        failures.push(side + " sole misses the stance patch at " + share);
    }
  }
  const hip = (share: number): IAutoMovieVector3 => {
    const time: number = clock(share);
    return local(
      film.prop("board", time),
      film.bones("rider", time).get("hips")!.worldPosition,
    );
  };
  const finished: IAutoMovieVector3 = hip(1);
  if (
    finished.y - hip(phases.mount).y < 0.3 ||
    Vector3.distance(hip(phases.release - 0.001), hip(phases.release + 0.001)) >
      GAP ||
    !vclose(hip(phases.settle), finished, GAP)
  )
    failures.push("pelvis cannot rise cleanly through the selected transfer");
  refused(
    () =>
      build(
        (seconds: number): IAutoMovieRigidTransform => ({
          ...track(seconds),
          position: { ...track(seconds).position, y: -0.3 },
        }),
      ),
    failures,
  );
}

/** The displayed sole of one foot in world metres. */
function sole(
  body: IAutoMovieMotionHumanBody,
  film: HumanPerformance,
  side: AutoMovieHumanSide,
  time: number,
): IAutoMovieVector3 {
  const bone = film
    .bones("rider", time)
    .get(side === "left" ? "leftFoot" : "rightFoot")!;
  return HumanFoot.point(body, side, "sole", {
    ankle: bone.worldPosition,
    rotation: bone.worldRotation,
  });
}

/** Assert a named board geometry refusal at authoring. */
function refused(play: () => HumanPerformance, failures: string[]): void {
  try {
    play();
    failures.push("invalid support geometry was accepted");
  } catch (error) {
    if (!(error instanceof HumanRefusal) || error.axis !== "on")
      failures.push(String(error));
  }
}

/** Minimum jerk between phase shares of the independently authored board motion. */
function ease(at: number, from: number, to: number): number {
  return minimumJerk(Math.max(0, Math.min(1, (at - from) / (to - from)))).s;
}

/** Place board-local metres. */
function world(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, local),
  );
}

/** Read board-local coordinates from a displayed point. */
function local(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.position),
  );
}
