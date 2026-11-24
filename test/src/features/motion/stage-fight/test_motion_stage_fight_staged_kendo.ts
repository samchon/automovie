import { createKendoArmour, createStageBladeProp } from "@automovie/archetypes";
import { Quaternion, Vector3, rotationBetween } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSignature,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBlade,
  AutoMovieMotionHumanStageFight,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

/**
 * A piece of armour, the region it is worn on and the axis of the piece that
 * faces along that region's normal.
 */
interface IWorn {
  /** The piece. */
  kind: createKendoArmour.Kind;

  /** The body region its wear socket goes onto. */
  region: AutoMovieHumanoidRegion;

  /** The piece's own axis laid along the region's outward normal. */
  axis: IAutoMovieVector3;
}

/** The men on the crown, upright, and the do on the solar plexus, facing out. */
const ARMOUR: readonly IWorn[] = [
  { kind: "men", region: "crown", axis: { x: 0, y: 1, z: 0 } },
  { kind: "do", region: "solarPlexus", axis: { x: 0, y: 0, z: 1 } },
];

/**
 * The performers' opening separation, metres: the shiai-jo's two starting lines
 * lie 1.4 m apart, the toes on them and each pelvis about 0.15 m behind its
 * toes.
 */
const OPENING: number = 1.7;

/** Each performer's glide toward the other, metres. */
const GLIDE: number = 0.15;

/** Duration of the glides, seconds. */
const SECONDS: number = 1.5;

/** The independently placed editing cue within the glides. */
const CUE: number = 0.57;

/**
 * A strike lands within this of its struck point, metres: the blade strokes
 * spec's bound.
 */
const TOUCH: number = 0.015;

/** A planted sole holds within this, metres: the stage footwork spec's bound. */
const HOLD: number = 0.005;

/** A sliding sole stays within this of the floor height it started at, metres. */
const GLIDE_HEIGHT: number = 0.006;

/**
 * Two armoured performers close in kendo's sliding footwork and the first
 * strikes men: the shinai's edge lands on the struck point of the other's worn
 * men, and the result is announced at that instant. A clear distance the strike
 * cannot cross is refused.
 *
 * Scenarios:
 *
 * 1. Both wear the men and the do and hold a shinai; both glide toward each other,
 *    the travelling sole low and the other planted, with the editing cue apart
 *    from either settle on the same clock as the footfalls.
 * 2. The first's stepping men strike lands its edge on the other's men and the
 *    bout announces the first's point there; both stay upright and the striker
 *    recovers to its stance.
 * 3. From farther apart the same strike is refused on its target, and a strike
 *    aimed at the body instead of the armour is refused by the rule.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the worn armour, the sliding footwork, the struck point, the announced result and the two refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Places the public bout with worn archetype armour; reads the displayed soles, heads and pelvises, the shinai's displayed edge and the men's displayed struck point, and the schedule's footfall, cue and decisive instants.
 * @evidence contracts/development/testing.md#independent-expectations The struck regions are the FIK's; the strike lands within the blade strokes spec's 15 mm, the soles hold within the stage footwork spec's 5 mm and glide within its 6 mm of floor height, and an upright head stands over 30 percent of stature above the pelvis, as in the grapple specs.
 * @evidence contracts/development/testing.md#distinguishing-cases A reachable strike and the same strike from beyond its reach; an armour point and a bare body region; the glide's planted and moving soles. Checks are at sampled instants, not swept.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory placement and pose sampling on canonical bodies and archetype props. No viewer or native host is invoked.
 */
export function test_motion_stage_fight_staged_kendo(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: motionComplaints.IGatherer = motionComplaints();
  try {
    bout(body, OPENING, complaints);
  } catch (error) {
    complaints.list.push(`reachable bout: ${String(error)}`);
  }

  // From twice as far the strike cannot cross the distance.
  try {
    const silent: motionComplaints.IGatherer = motionComplaints();
    bout(body, 2 * OPENING, silent);
    complaints.list.push("the strike across a clear distance was admitted");
  } catch (error) {
    if (!(error instanceof HumanRefusal) || error.axis !== "target")
      complaints.list.push(`clear distance: unexpected ${String(error)}`);
  }

  // A strike at the bare body is not a kendo strike.
  try {
    AutoMovieMotionHumanStageFight.HumanStagePiste.compose({
      ...take("men"),
      first: {
        ...take("men").first,
        target: { kind: "person", subject: "b", region: "crown" },
      },
    });
    complaints.list.push("a strike at the bare crown was admitted");
  } catch (error) {
    if (!(error instanceof HumanRefusal) || error.axis !== "first.target")
      complaints.list.push(`bare target: unexpected ${String(error)}`);
  }
  complaints.assert("Staged kendo bout");
}

/** The bout: the glides, then the first's men strike, scored for the first. */
function take(
  point: string,
): AutoMovieMotionHumanStageFight.HumanStagePiste.ITake {
  return {
    anchor: "kendo",
    kind: "kendo",
    first: {
      chain: HumanChain.subject("a").pickUp({
        prop: "a.shinai",
        handle: "grip",
        hand: "right",
        use: { tip: "point", line: "oblique" },
      }),
      direction: "forward",
      lead: "right",
      distance: GLIDE,
      blade: "a.shinai",
      target: { kind: "prop", subject: "b.men", point },
    },
    second: {
      chain: HumanChain.subject("b").pickUp({
        prop: "b.shinai",
        handle: "grip",
        hand: "right",
        use: { tip: "point", line: "oblique" },
      }),
      direction: "forward",
      lead: "right",
      distance: GLIDE,
      blade: "b.shinai",
      target: { kind: "prop", subject: "a.men", point: "men" },
    },
    duration: SECONDS,
    cue: CUE,
    result: "first",
    reserve: [OPENING, 0.25],
  };
}

/** Play the bout from an opening separation and check what it shows. */
function bout(
  body: IAutoMovieMotionHumanBody,
  opening: number,
  complaints: motionComplaints.IGatherer,
): void {
  const shinai = createStageBladeProp({ kind: "shinai", id: "shinai" });
  const grip: IAutoMovieVector3 = shinai.affordance("grip").frame.translation;
  const edge = shinai.affordance("edge");
  const at: Readonly<Record<string, IAutoMovieVector3>> = {
    a: { x: 0, y: 0, z: 0 },
    b: { x: 0, y: 0, z: opening },
  };
  const yaw = (subject: string): number => (subject === "a" ? 0 : 180);
  const props: IAutoMovieMotionHumanProp[] = [];
  for (const subject of ["a", "b"] as const) {
    const side: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw(subject)),
      {
        x: -body.measure.shoulderHalfWidth,
        y: body.measure.waistHeight - grip.y,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
    );
    props.push(
      HumanObject.prop(`${subject}.shinai`, shinai, {
        at: Vector3.add(at[subject]!, side),
        yaw: yaw(subject),
      }),
    );
    for (const piece of ARMOUR) props.push(worn(body, subject, piece));
  }
  const placed: AutoMovieMotionHumanStageFight.HumanStagePiste.IPlaced =
    AutoMovieMotionHumanStageFight.HumanStagePiste.compose({
      ...take("men"),
      reserve: [opening, 0.25],
    });
  const film: HumanPerformance = new HumanPerformance({
    seed: "kendo-men",
    laws: [
      AutoMovieMotionHumanStageFight.stageBladeFootwork,
      ...Object.values(AutoMovieMotionHumanBlade.HumanBlade),
    ],
    performers: ["a", "b"].map((subject: string) => ({
      subject,
      body,
      at: at[subject]!,
      yaw: yaw(subject),
      proficiency: { level: "trained" as const },
    })),
    props,
    composition: placed.composition,
  });
  assertTakeClean(`kendo ${body.measure.stature}`, film);
  const entry = (anchor: string): IAutoMovieScheduleEntry => {
    const found: IAutoMovieScheduleEntry | undefined =
      film.schedule.entries.find(
        (row): boolean => row.intent.anchor === anchor,
      );
    if (found === undefined) throw new Error(`missing ${anchor}`);
    return found;
  };
  const strike: IAutoMovieScheduleEntry = entry("kendo.attack");
  const contact: number = strike.contact ?? Number.NaN;

  // 1. The glides: the travelling sole low, the other planted, the cue apart.
  for (const subject of ["a", "b"] as const) {
    const glide: IAutoMovieScheduleEntry = entry(
      subject === "a" ? "kendo.first" : "kendo.second",
    );
    const sole = (
      side: AutoMovieHumanSide,
      seconds: number,
    ): IAutoMovieVector3 => {
      const foot: IAutoMovieResolvedBone = film
        .bones(subject, seconds)
        .get(`${side}Foot`)!;
      return HumanFoot.point(body, side, "ball", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      });
    };
    const early: number = glide.start + 0.27 * SECONDS;
    const event = (name: string): number | undefined =>
      glide.events?.find((row): boolean => row.name === name)?.seconds;
    const cue: number | undefined = event("propCue");
    complaints.check(
      `${subject}: the right sole glides low while the left stays planted, and the cue falls apart from either settle`,
      Math.abs(sole("right", early).y - sole("right", glide.start).y) <=
        GLIDE_HEIGHT &&
        Vector3.distance(sole("right", early), sole("right", glide.start)) >
          0.02 &&
        Vector3.distance(sole("left", early), sole("left", glide.start)) <=
          HOLD &&
        cue !== undefined &&
        nclose(cue, glide.start + CUE * SECONDS) &&
        !nclose(cue, event("firstSettle") ?? Number.NaN) &&
        !nclose(cue, event("followSettle") ?? Number.NaN) &&
        glide.end <= strike.start + 1e-9,
    );
  }

  // 2. The edge lands on the men's struck point, announced for the first.
  const frame: IAutoMovieRigidTransform = film.prop("a.shinai", contact);
  const half: number = (edge.length ?? 0) / 2;
  const along: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  // The striking part is read on the shinai's axis, as the blade strokes
  // spec reads a blade: the edge's span along it, not its surface offset.
  const centre: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: edge.frame.translation.y,
      z: 0,
    }),
  );
  const men: IAutoMovieRigidTransform = film.prop("b.men", contact);
  const struck: IAutoMovieVector3 = Vector3.add(
    men.position,
    Quaternion.rotateVector(
      men.rotation,
      createKendoArmour({ kind: "men" }).affordance("men").frame.translation,
    ),
  );
  let missed: number = Infinity;
  for (let share: number = -1; share <= 1; share += 0.02)
    missed = Math.min(
      missed,
      Vector3.distance(
        Vector3.add(centre, Vector3.scale(along, share * half)),
        struck,
      ),
    );
  const announced:
    | AutoMovieMotionHumanStageFight.HumanStagePiste.IAnnouncement
    | undefined = placed.announced(film.schedule);
  complaints.check(
    `the men strike's edge lands ${missed} m from the struck men and scores for the first at that instant`,
    missed <= TOUCH &&
      announced?.result === "first" &&
      nclose(announced.seconds, contact),
  );

  // Both stay upright, and the striker recovers to its stance.
  for (const subject of ["a", "b"] as const) {
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
      film,
      subject,
      body,
      yaw(subject),
    );
    complaints.check(
      `${subject} keeps an upright posture through the strike`,
      [strike.start, contact, strike.end].every(
        (seconds: number): boolean =>
          HumanSignature.joint(reader, seconds, "head").y -
            HumanSignature.joint(reader, seconds, "hips").y >
          0.3 * body.measure.stature,
      ),
    );
  }
  const ankle = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 =>
    film.bones("a", seconds).get(`${side}Foot`)!.worldPosition;
  complaints.check(
    "the striker recovers to the stance it struck from",
    (["left", "right"] as const).every(
      (side: AutoMovieHumanSide): boolean =>
        Vector3.distance(ankle(side, strike.end), ankle(side, strike.start)) <=
        TOUCH,
    ),
  );
}

/** A piece of armour worn from the film's start on its region's bone. */
function worn(
  body: IAutoMovieMotionHumanBody,
  subject: string,
  piece: IWorn,
): IAutoMovieMotionHumanProp {
  const armour = createKendoArmour({ kind: piece.kind });
  const prop: IAutoMovieMotionHumanProp = HumanObject.prop(
    `${subject}.${piece.kind}`,
    armour,
    { at: { x: 0, y: 0, z: 0 }, yaw: 0 },
  );
  const region = body.surfaces.regions[piece.region];
  const socket: IAutoMovieVector3 = armour.affordance("wear").frame.translation;
  const rotation: IAutoMovieQuaternion = rotationBetween(
    piece.axis,
    region.normal,
  );
  return {
    ...prop,
    worn: {
      subject,
      bone: region.bone,
      offset: {
        position: Vector3.subtract(
          region.point,
          Quaternion.rotateVector(rotation, socket),
        ),
        rotation,
      },
    },
  };
}
