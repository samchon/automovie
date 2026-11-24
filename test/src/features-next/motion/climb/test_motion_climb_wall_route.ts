import { createClimbingHold } from "@automovie/archetypes/architecture";
import {
  Quaternion,
  Vector3,
  physicalShapeBounds,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanWallClimb,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanClimb,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanColliders,
  HumanHand,
  HumanObstacle,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../features/internal/archetypeExtent";
import { collectTakeClean } from "../../../features/internal/collectTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { nclose } from "../../../features/internal/nclose";

/** The existing displayed contact tolerance for wall stances, metres. */
const CONTACT: number = 0.01;

/** A limb in the route planner's assignment order. */
type Limb = IAutoMovieMotionHumanWallClimb.IMove["limb"];

/**
 * A named climbing route supports a loaded reach, a shared-ledge foot swap
 * and a timed hand catch with contacts retained.
 *
 * Scenarios:
 * 1. Mount visible rectangular holds and compare their grip lip and toe
 *    patch with the actual shapes.
 * 2. Play a lateral reach, a timed release and foot swap, then a hand catch
 *    and recovery. Check every retained grip and toe against its placed
 *    frame through the take, the wall clearance of the collision shapes
 *    and the movement and recovery of the measured centre of mass.
 * 3. Refuse a duplicate claim on one occupied hold and a named grip beyond
 *    the avatar's supported reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged contact sequence and measured outputs.
 * @evidence contracts/development/testing.md#behavioral-verification Uses named prop points from actual archetypes, support timelines and displayed polygon-man frames. Measures the body against the wall and the contact locations independently of the planner.
 * @evidence contracts/development/testing.md#independent-expectations Uses collider extents for contact dimensions and the existing 10 mm wall-climb bound. The numbered route's assigned labels and the provisional timing and movement bounds concern the authored film. Quaine and Martin 1999 (DOI 10.1016/S0966-6362(99)00024-7) grounds the retained-contact stance. Schweizer et al. 2024 (https://pmc.ncbi.nlm.nih.gov/articles/PMC11048272/) distinguish the acquisition, holding and release phases. The test measures kinematics without estimating contact force.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body sizes, both hand and foot changes, a real transfer of one foothold between feet and two refusal causes.
 * @evidence contracts/development/testing.md#execution-ownership The test constructs real bodies, props and a wall through their SDK entry points without a viewer.
 */
export function test_motion_climb_wall_route(): void {
  const failures: string[] = [];
  /** Record every acceptance failure from the current playback. */
  const check = (condition: boolean, detail: string): void => {
    if (!condition) failures.push(detail);
  };
  for (const size of ["m-average", "f-small"] as const) {
    const fixture: IFixture = buildRoute(size, check);
    try {
      verifyRoute(fixture, check);
    } catch (error) {
      failures.push(size + " route plan: " + String(error));
    }
    verifyRefusals(fixture, check);
  }
  TestValidator.equals(
    "the rendered route retains, transfers and catches the authored holds",
    failures,
    [],
  );
}

/** The test's built set and the lookups used to measure the real performance. */
interface IFixture {
  /** The tested body's label. */
  size: Parameters<typeof motionHumanBody>[0];

  /** The posed polygon man. */
  body: IAutoMovieMotionHumanBody;

  /** The face of the authored wall that the avatar approaches, world metres. */
  wallZ: number;

  /** The static placements and geometry of the route holds. */
  props: ReadonlyMap<string, IAutoMovieMotionHumanProp>;

  /** The authored contact assignments. */
  route: IAutoMovieMotionHumanWallClimb;

  /** Plan these assignments in the same room and on the same body. */
  play: (route: IAutoMovieMotionHumanWallClimb) => HumanPerformance;
}

/** Assemble the same route topology at two sets of authored body-relative heights. */
function buildRoute(
  size: IFixture["size"],
  check: (condition: boolean, detail: string) => void,
): IFixture {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(size);
  const standing: ReturnType<typeof motionHumanStance> =
    motionHumanStance(body);
  const leftX: number = standing.get("leftToes")!.worldPosition.x;
  const rightX: number = standing.get("rightToes")!.worldPosition.x;
  const wallZ: number = body.measure.forearm + 0.17;

  // The smaller avatar starts at the farther staging mark on the actor side.
  const entryZ: number = size === "f-small" ? -0.16 : 0;
  const handY: number = body.measure.hipHeight + body.measure.upperArm;
  const shoulder: number = body.measure.shoulderHalfWidth;
  const props: Map<string, IAutoMovieMotionHumanProp> = new Map();

  /** Mount the model against the wall and retain the target name for the route. */
  const mount = (
    subject: string,
    contact: createClimbingHold.Affordance,
    x: number,
    y: number,
    width: number,
    depth: number,
  ): IAutoMovieMotionHumanWallClimb.Hold => {
    const model: ReturnType<typeof createClimbingHold> = createClimbingHold(
      { id: subject, width, rise: contact === "grip" ? 0.05 : 0.035, depth },
      size,
    );
    const top: number = archetypeExtent(model, "y").high;
    const front: number = archetypeExtent(model, "z").high;
    const offer: ReturnType<typeof model.affordance> =
      model.affordance(contact);
    const z: number = contact === "grip" ? front : front / 2;
    check(
      nclose(offer.frame.translation.y, top) &&
        nclose(offer.frame.translation.z, z) &&
        (contact === "grip"
          ? offer.kind === "handle" && nclose(offer.length!, width)
          : offer.kind === "surface" &&
            nclose(offer.width!, width) &&
            nclose(offer.depth!, front)),
      size +
        " " +
        subject +
        " contact lies on its own " +
        contact +
        " geometry",
    );
    const prop: IAutoMovieMotionHumanProp = HumanObject.prop(subject, model, {
      at: { x, y: y - top, z: wallZ },
      yaw: 180,
      fixed: true,
    });
    props.set(subject, prop);
    return { kind: "prop", subject, point: contact };
  };

  const leftGrip: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "grip-left",
    "grip",
    shoulder,
    handY,
    0.14,
    0.17,
  );
  const rightGrip: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "grip-right",
    "grip",
    -shoulder,
    handY,
    0.14,
    0.17,
  );
  const traverse: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "grip-traverse",
    "grip",
    shoulder + 0.14,
    handY + 0.1,
    0.16,
    0.18,
  );
  const finish: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "grip-catch",
    "grip",
    0.025,
    handY + 0.25,
    0.17,
    0.16,
  );
  const leftToe: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "toe-left",
    "toe",
    leftX,
    0.1,
    0.11,
    0.21,
  );
  const rightToe: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "toe-shared",
    "toe",
    rightX,
    0.11,
    0.1,
    0.22,
  );
  const upperToe: IAutoMovieMotionHumanWallClimb.Hold = mount(
    "toe-upper",
    "toe",
    rightX - 0.15,
    0.22,
    0.12,
    0.18,
  );
  mount("grip-outside", "grip", -2, handY + 1.2, 0.15, 0.16);

  const route: IAutoMovieMotionHumanWallClimb = {
    start: {
      leftHand: leftGrip,
      rightHand: rightGrip,
      leftFoot: leftToe,
      rightFoot: rightToe,
    },
    moves: [
      { limb: "leftHand", to: traverse, seconds: 0.78, event: "loaded-reach" },
      { limb: "rightFoot", to: null, seconds: 0.32, event: "free-right" },
      { limb: "leftFoot", to: rightToe, seconds: 0.66, event: "swap-left" },
      {
        limb: "rightFoot",
        to: upperToe,
        seconds: 0.54,
        event: "swap-recovered",
      },
      { limb: "rightHand", to: finish, seconds: 0.42, event: "catch-held" },
      { limb: "rightHand", to: finish, seconds: 0.32, event: "recovered" },
    ],
  };
  const wall: ReturnType<typeof HumanObstacle.wall> = HumanObstacle.wall(
    "mounting-wall",
    { x: -3, y: 0, z: wallZ + 0.06 },
    { x: 3, y: 0, z: wallZ + 0.06 },
    0.12,
    3,
  );
  return {
    size,
    body,
    wallZ,
    props,
    route,
    play: (authored: IAutoMovieMotionHumanWallClimb): HumanPerformance =>
      new HumanPerformance({
        seed: "wall-route",
        props: [...props.values()],
        obstacles: [wall],
        performers: [
          {
            subject: "climber",
            body,
            at: { x: 0, y: 0, z: entryZ },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("climber").support(
          AutoMovieMotionHumanClimb.wallClimbSupport(authored),
        ).node,
      }),
  };
}

/** Read the film's real contact windows, scene geometry and fitted mass centre. */
function verifyRoute(
  fixture: IFixture,
  check: (condition: boolean, detail: string) => void,
): void {
  const { size, body, wallZ, props }: IFixture = fixture;
  const film: HumanPerformance = fixture.play(fixture.route);
  const verdicts: string[] = [];
  collectTakeClean(`${size} wall route`, film, verdicts);
  for (const verdict of verdicts) check(false, verdict);
  const segment: IAutoMovieMotionHumanSegment = film.segments("climber")[0]!;
  const duration: number = segment.plan.duration;
  const event = (name: string): number =>
    segment.start +
    duration *
      segment.plan.events.find(
        (mark: IAutoMovieMotionEvent): boolean => mark.name === name,
      )!.share;
  const bones = (time: number): ReturnType<HumanPerformance["bones"]> =>
    film.bones("climber", time);
  const contact = (
    pose: ReturnType<typeof bones>,
    limb: Limb,
  ): IAutoMovieVector3 => {
    const side: AutoMovieHumanSide = limb.startsWith("left") ? "left" : "right";
    return limb.endsWith("Hand")
      ? HumanHand.frame(body, pose, side, "grip").point
      : pose.get(`${side}Toes`)!.worldPosition;
  };

  let nearWall: number = Infinity;
  const windows: readonly IAutoMovieMotionHumanContactWindow[] =
    segment.plan.contacts;
  const slips: Map<IAutoMovieMotionHumanContactWindow, number> = new Map();
  const shares: Set<number> = new Set([
    0,
    1,
    ...segment.plan.events.map(
      (part: IAutoMovieMotionEvent): number => part.share,
    ),
  ]);
  const count: number = Math.ceil(48 * duration);
  for (let frame: number = 0; frame <= count; ++frame)
    shares.add(frame / count);
  for (const share of shares) {
    const pose: ReturnType<typeof bones> = bones(
      segment.start + share * duration,
    );
    for (const placed of HumanColliders.placed(body, pose))
      for (const shape of placed.shapes)
        nearWall = Math.min(
          nearWall,
          wallZ - physicalShapeBounds(placed.pose, shape).max.z,
        );
    for (const window of windows) {
      if (
        window.support.kind !== "prop" ||
        share < window.from ||
        share > window.to
      )
        continue;
      const prop: IAutoMovieMotionHumanProp = props.get(
        window.support.subject,
      )!;
      const limb: Limb = window.part as Limb;
      const local: IAutoMovieVector3 =
        prop.points[limb.endsWith("Hand") ? "grip" : "toe"]!.point;
      const world: IAutoMovieVector3 = Vector3.add(
        prop.frame.position,
        Quaternion.rotateVector(prop.frame.rotation, local),
      );
      const miss: number = Vector3.distance(contact(pose, limb), world);
      slips.set(window, Math.max(slips.get(window) ?? 0, miss));
    }
  }
  for (const [window, miss] of slips)
    check(
      miss <= CONTACT,
      size +
        " " +
        window.part +
        " " +
        JSON.stringify(window.support) +
        " misses by " +
        miss +
        " m",
    );
  check(
    nearWall >= -0.001,
    size + " wall signed clearance: " + nearWall + " m",
  );

  const bearing = (
    limb: Limb,
    subject: string,
  ): IAutoMovieMotionHumanContactWindow | undefined =>
    windows.find(
      (window: IAutoMovieMotionHumanContactWindow): boolean =>
        window.part === limb &&
        window.support.kind === "prop" &&
        window.support.subject === subject,
    );
  const oldFoot: IAutoMovieMotionHumanContactWindow | undefined = bearing(
    "rightFoot",
    "toe-shared",
  );
  const newFoot: IAutoMovieMotionHumanContactWindow | undefined = bearing(
    "leftFoot",
    "toe-shared",
  );
  const catchWindow: IAutoMovieMotionHumanContactWindow | undefined = bearing(
    "rightHand",
    "grip-catch",
  );
  const catchTime: number = event("bear5");
  const caughtAt: number = (catchTime - segment.start) / duration;
  check(
    oldFoot !== undefined && newFoot !== undefined && oldFoot.to < newFoot.from,
    size + " releases the shared foothold before the other foot bears there",
  );
  check(
    catchWindow !== undefined &&
      nclose(catchWindow.from, caughtAt) &&
      nclose(catchWindow.to, 1) &&
      (bearing("leftHand", "grip-traverse")?.from ?? Infinity) < caughtAt &&
      nclose(bearing("leftHand", "grip-traverse")?.to ?? -1, 1),
    size +
      " shares the catch instant with the retained left hand and holds through recovery",
  );

  const pre: IAutoMovieVector3 = contact(bones(catchTime - 0.075), "rightHand");
  const arriving: IAutoMovieVector3 = contact(bones(catchTime), "rightHand");
  const held: IAutoMovieVector3 = contact(
    bones(event("recovered")),
    "rightHand",
  );
  const approach: number = Vector3.distance(pre, arriving);
  const recovery: number = Vector3.distance(arriving, held);
  check(
    approach >= 0.025 && recovery <= CONTACT,
    size + " catch approach and arrest: " + approach + " m, " + recovery + " m",
  );
  const mass = (time: number): IAutoMovieVector3 =>
    resolveAutoMovieCenterOfMass.place(body.massModel, bones(time));
  const shifted: number = Vector3.distance(
    mass(event("stance0")),
    mass(event("catch-held")),
  );
  const settled: number = Vector3.distance(
    mass(event("catch-held")),
    mass(event("recovered")),
  );
  check(
    shifted >= 0.03 &&
      settled < 0.02 &&
      mass(event("recovered")).z < wallZ - 0.05,
    size +
      " fitted centre moves then settles: " +
      shifted +
      " m, " +
      settled +
      " m",
  );
}

/** Exercise both authored occupancy refusal and solved reach refusal. */
function verifyRefusals(
  fixture: IFixture,
  check: (condition: boolean, detail: string) => void,
): void {
  const { route, size }: IFixture = fixture;
  let duplicate: unknown;
  try {
    AutoMovieMotionHumanClimb.wallClimbSupport({
      ...route,
      moves: [{ limb: "leftFoot", to: route.start.rightFoot }],
    });
  } catch (error) {
    duplicate = error;
  }
  check(
    duplicate instanceof HumanRefusal && duplicate.axis === "moves",
    size + " rejects two simultaneous claims to a single foothold",
  );
  let unreachable: unknown;
  try {
    fixture.play({
      ...route,
      moves: [
        {
          limb: "rightHand",
          to: { kind: "prop", subject: "grip-outside", point: "grip" },
        },
      ],
    });
  } catch (error) {
    unreachable = error;
  }
  check(
    unreachable instanceof HumanRefusal && unreachable.kind === "reach",
    size + " reports a named unreachable grip: " + String(unreachable),
  );
}
