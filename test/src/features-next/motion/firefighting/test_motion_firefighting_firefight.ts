import {
  createFireExtinguisher,
  createHoseLine,
  createPalette,
} from "@automovie/archetypes";
import { Quaternion, Vector3, physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFirefighting,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON, HumanHand } from "@automovie/motions/internal";

import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** A held prop drifts at most this in its hand's frame, metres. */
const HOLD: number = 0.005;
/** An outlet aims at its target within this, degrees. */
const AIM: number = 15;
/** A gripping hand stays on its grip within this, metres. */
const ON: number = 0.05;
/** The lying victim's heading, degrees: across the way ahead. */
const VICTIM_YAW: number = 90;
/** Seconds the victim holds lying: past the helper's last beat, so the victim lies whenever the helper reads them. */
const LIE: number = 20;
/** The contact skin, metres: the 10 mm the take verdicts read a body part as touching another within. */
const SKIN: number = 0.01;
/** The fire's base on the floor ahead, world metres. */
const FIRE: IAutoMovieVector3 = { x: 0, y: 0, z: 2.2 };

/**
 * Firefighting drills (#3976): the extinguisher's PASS, a two-member hose
 * line and beating flames on a lying partner.
 *
 * Scenarios, on m-average and f-small:
 * 1. PASS: the pin comes out before the lever moves, the nozzle points at
 *    the fire's base, the lever stays squeezed through the sweep, the
 *    sweep spans side to side, and the extinguisher stays in the palm.
 *    Squeezing with the pin in is refused.
 * 2. Hose line: the operator opens the bail and aims the stream at the
 *    fire, the backup's hands stay on their grip, and both lean into the
 *    nozzle reaction. An operator with no target is refused.
 * 3. Flames: kneeling, a held cloth comes down on the lying partner's
 *    chest at each beat and rises between, staying in the palm. A count of
 *    zero is refused.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each drill, the bodies and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the chain's pass, hoseTeam, beatFlames, kneel and lieDown and reads displayed props, articulations and bones.
 * @evidence contracts/development/testing.md#independent-expectations The outlets and grips are the archetypes' contacts and the fire an authored point; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Pin in against pulled, nozzle against backup, beat bottom against top.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_firefighting_firefight(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("firefight");
}

/** The fire as a target. */
const TARGET: IAutoMovieMotionTarget = {
  kind: "point",
  at: FIRE,
  frame: "world",
};

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
  subject: string = "actor",
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments(subject)
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** The angle between an outlet's discharge and the line to the fire, degrees. */
function aimError(
  take: HumanPerformance,
  subject: string,
  outlet: IOutlet,
  t: number,
): number {
  const frame: IAutoMovieRigidTransform = take.prop(subject, t);
  const at: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, outlet.point),
  );
  const out: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(frame.rotation, outlet.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const to: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(FIRE, at));
  return (
    (Math.acos(
      Math.max(-1, Math.min(1, Vector3.dot(Vector3.normalize(out), to))),
    ) *
      180) /
    Math.PI
  );
}

/** PASS with an extinguisher. */
function pass(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const model = createFireExtinguisher({ id: "extinguisher" });
  const nozzle = model.affordance("nozzle").frame;
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("extinguisher", model, { x: -0.25, y: 0.5, z: 0.3 }),
  ];
  const take: HumanPerformance = everydayTake.perform(
    `firefight-${label}`,
    body,
    props,
    HumanChain.subject("actor").stand().pass({
      prop: "extinguisher",
      target: TARGET,
      sweeps: 1,
    }),
    Object.values(HUMAN_LEXICON).flat(),
  );
  everydayTake.clean(label, take);
  const pull: IAutoMovieMotionHumanSegment = named(take, "workHeld")[0]!;
  const sweep: IAutoMovieMotionHumanSegment = named(take, "extinguish")[0]!;
  checks.check(
    `${label}: the pin is out before the lever moves`,
    (take.state("extinguisher", pull.end)["pin"] ?? 0) >= 0.04 - 1e-6 &&
      (take.state("extinguisher", pull.end)["lever"] ?? 0) <= 1e-6,
  );
  const middle: number = (sweep.start + sweep.end) / 2;
  checks.check(
    `${label}: the lever stays squeezed through the sweep`,
    (take.state("extinguisher", middle)["lever"] ?? 0) >= 20 - 0.5,
  );
  const outlet: IOutlet = {
    point: nozzle.translation,
    rotation: nozzle.rotation,
  };
  let least: number = Infinity;
  let most: number = 0;
  for (let i: number = 0; i <= 24; ++i) {
    const t: number =
      sweep.start + (sweep.end - sweep.start) * (0.2 + (0.6 * i) / 24);
    const error: number = aimError(take, "extinguisher", outlet, t);
    least = Math.min(least, error);
    most = Math.max(most, error);
  }
  checks.check(
    `${label}: the nozzle crosses the fire's base (${least.toFixed(1)} degrees)`,
    least <= AIM,
  );
  checks.check(
    `${label}: the sweep goes side to side (${most.toFixed(1)} degrees off at its edge)`,
    most >= 10,
  );
  checks.check(
    `${label}: the extinguisher stays in the palm`,
    everydayTake.drift(
      take,
      "right",
      "extinguisher",
      pull.start,
      take.duration,
    ) <= HOLD,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const locked: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `firefight-${label}-locked`,
        body,
        props,
        HumanChain.subject("actor")
          .stand()
          .pickUp({
            prop: "extinguisher",
            handle: "handle",
            hand: "right",
            lift: 0.1,
          })
          .registered("extinguish", { prop: "extinguisher", target: TARGET }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: squeezing with the pin in is refused`,
      locked !== undefined,
    );
  }
}

/** A two-member hose team. */
function hose(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const model = createHoseLine({ id: "hose" });
  const tip = model.affordance("tip").frame;
  const height: number = body.measure.hipHeight + 0.1;
  // The line runs by the operator's right hand; the backup stands on its
  // run, so it lies before the backup's middle for both hands, the grip a
  // forearm ahead, as the forearms reach forward with the elbows by the
  // trunk.
  const run: number = -0.2;
  // The line's tail, its nozzle grip just ahead of the operator.
  const tail: number = 0.35 - 3;
  const behind: number =
    tail +
    model.affordance("backup").frame.translation.z -
    body.measure.forearm;
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("hose", model, { x: run, y: height, z: tail }),
  ];
  const [operator, second] = AutoMovieMotionHumanFirefighting.hoseTeam(
    { chain: HumanChain.subject("actor").stand(), at: { x: 0, y: 0, z: 0 } },
    {
      chain: HumanChain.subject("backup").stand(),
      at: { x: run, y: 0, z: behind },
    },
    { prop: "hose", target: TARGET, sweeps: 1 },
  );
  const take: HumanPerformance = everydayTake.perform(
    `firefight-${label}`,
    body,
    props,
    operator,
    Object.values(HUMAN_LEXICON).flat(),
    [
      {
        subject: "backup",
        body,
        at: { x: run, y: 0, z: behind },
        yaw: 0,
        chain: second,
      },
    ],
  );
  everydayTake.clean(label, take);
  const work: IAutoMovieMotionHumanSegment = named(take, "hoseLine")[0]!;
  const middle: number = (work.start + work.end) / 2;
  checks.check(
    `${label}: the operator opens the bail`,
    (take.state("hose", middle)["bail"] ?? 0) >= 90 - 0.5,
  );
  let least: number = Infinity;
  for (let i: number = 0; i <= 24; ++i)
    least = Math.min(
      least,
      aimError(
        take,
        "hose",
        { point: tip.translation, rotation: tip.rotation },
        work.start + (work.end - work.start) * (0.2 + (0.6 * i) / 24),
      ),
    );
  checks.check(
    `${label}: the stream crosses the fire (${least.toFixed(1)} degrees)`,
    least <= AIM,
  );
  const grip: IAutoMovieVector3 = everydayTake.point(
    take,
    model,
    "hose",
    "backup",
    middle,
  );
  // Each hand's grip site lies on the line within the grip's own length.
  const span: number = model.affordance("backup").length ?? 0;
  for (const side of ["left", "right"] as const) {
    const hand: IAutoMovieResolvedBone = take
      .bones("backup", middle)
      .get(`${side}Hand`)!;
    const site: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, side, "grip").point,
      ),
    );
    checks.check(
      `${label}: the backup's ${side} hand stays on the line`,
      Vector3.distance(site, grip) <= span / 2 + ON,
    );
  }
  for (const who of ["actor", "backup"]) {
    const lean = (t: number): number => {
      const bones = take.bones(who, t);
      return (
        bones.get("head")!.worldPosition.z - bones.get("hips")!.worldPosition.z
      );
    };
    checks.check(
      `${label}: the ${who === "actor" ? "operator" : "backup"} leans into the reaction`,
      lean(middle) > lean(work.start) + 0.02,
    );
  }
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const blind: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `firefight-${label}-blind`,
        body,
        props,
        HumanChain.subject("actor")
          .stand()
          .pickUp({ prop: "hose", handle: "nozzle", hand: "right", lift: 0 })
          .registered("hoseLine", {
            prop: "hose",
            role: "nozzle",
            grip: "nozzle",
          }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: an operator with no target is refused`,
      blind !== undefined,
    );
  }
}

/** Beating flames on a lying partner from a kneel. */
function flames(
  body: IAutoMovieMotionHumanBody,
  label: string,
  checks: motionComplaints.IGatherer,
): void {
  const cloth = createPalette({ id: "sack", kind: "cloth" });
  // The helper kneels on both knees where it stands, the first knee over the
  // middle of its own foot; the victim lies across before it, its sternum
  // abreast of that knee and the near face of its lying body (every collider
  // of the body as it lies, read off the victim lying alone at the origin
  // with its take heading) a shin's radius plus the verdicts' 10 mm contact
  // skin beyond the knee's centre, so no kneeling shin enters it. The victim
  // is then moved by that offset.
  const knee: IAutoMovieVector3 = {
    x: -body.measure.hipHalfWidth,
    y: 0,
    z: body.measure.footLength / 2 - body.measure.heel,
  };
  const alone: HumanPerformance = new HumanPerformance({
    seed: `firefight-${label}-lying`,
    performers: [
      {
        subject: "victim",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: VICTIM_YAW,
        proficiency: { level: "trained" },
      },
    ],
    laws: [],
    props: [],
    composition: HumanChain.subject("victim").lieDown({ hold: LIE }).node,
  });
  const down: IAutoMovieMotionHumanSegment = named(
    alone,
    "lieDown",
    "victim",
  )[0]!;
  const region: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.sternum;
  const torso: IAutoMovieResolvedBone = alone
    .bones("victim", down.end)
    .get(region.bone)!;
  const own: IAutoMovieVector3 = Vector3.add(
    torso.worldPosition,
    Quaternion.rotateVector(torso.worldRotation, region.point),
  );
  const lying: ReadonlyMap<string, IAutoMovieResolvedBone> = alone.bones(
    "victim",
    down.end,
  );
  let near: number = Infinity;
  for (const segment of body.profile.segments) {
    const bone: IAutoMovieResolvedBone | undefined = lying.get(segment.bone);
    if (bone === undefined) continue;
    for (const shape of segment.shapes)
      near = Math.min(
        near,
        physicalShapeBounds(
          { position: bone.worldPosition, rotation: bone.worldRotation },
          shape,
        ).min.z,
      );
  }
  const victim: IAutoMovieVector3 = {
    x: knee.x - own.x,
    y: 0,
    z: knee.z + body.measure.shankRadius + SKIN - near,
  };
  const props: IAutoMovieMotionHumanProp[] = [
    everydayTake.prop("sack", cloth, { x: -0.3, y: 0.9, z: 0.25 }),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .stand()
    .pickUp({ prop: "sack", handle: "hold", hand: "right", lift: 0.05 })
    // Down on both knees beside the victim, staying there to beat.
    .kneel({
      kind: "both",
      at: { kind: "point", at: knee, frame: "world" },
      rise: false,
    })
    .registered("beatFlames", {
      prop: "sack",
      partner: "victim",
      region: "sternum",
      count: 2,
    });
  // The victim's chain comes first in the parallel group, so the victim
  // already lies where the helper reads the region.
  const take: HumanPerformance = new HumanPerformance({
    seed: `firefight-${label}`,
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "victim",
        body,
        at: victim,
        yaw: VICTIM_YAW,
        proficiency: { level: "trained" },
      },
    ],
    laws: Object.values(HUMAN_LEXICON).flat(),
    props,
    composition: HumanChain.subject("victim").lieDown({ hold: LIE }).with(chain)
      .node,
  });
  everydayTake.clean(label, take);
  const beat: IAutoMovieMotionHumanSegment = named(take, "beatFlames")[0]!;
  const face = (t: number): IAutoMovieVector3 =>
    everydayTake.point(take, cloth, "sack", "face", t);
  const chest = (t: number): IAutoMovieVector3 =>
    take.bones("victim", t).get("chest")!.worldPosition;
  const span: number = beat.end - beat.start;
  let low: number = Infinity;
  let high: number = -Infinity;
  for (let i: number = 0; i <= 36; ++i) {
    const t: number = beat.start + (span * i) / 36;
    const gap: number = face(t).y - chest(t).y;
    low = Math.min(low, gap);
    high = Math.max(high, gap);
  }
  checks.check(
    `${label}: the cloth comes down on the chest and rises between beats`,
    low <= 0.25 && high - low >= 0.2,
  );
  checks.check(
    `${label}: the cloth stays in the palm`,
    everydayTake.drift(take, "right", "sack", beat.start, beat.end) <= HOLD,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const none: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `firefight-${label}-none`,
        body,
        props,
        HumanChain.subject("actor")
          .stand()
          .pickUp({ prop: "sack", handle: "hold", hand: "right", lift: 0.05 })
          .registered("beatFlames", {
            prop: "sack",
            partner: "victim",
            region: "sternum",
            count: 0,
          }),
        Object.values(HUMAN_LEXICON).flat(),
        [
          {
            subject: "victim",
            body,
            at: {
              x: 0.1,
              y: 0,
              z: body.measure.upperArm + body.measure.forearm,
            },
            yaw: 90,
            chain: HumanChain.subject("victim").lieDown({ hold: LIE }),
          },
        ],
      ),
    );
    checks.check(
      `${label}: a count of zero beats is refused`,
      none !== undefined,
    );
  }
}

/** An outlet's place and attitude in its prop's frame. */
interface IOutlet {
  /** Where it is, metres. */
  point: IAutoMovieVector3;

  /** Its attitude; its `+Y` the discharge. */
  rotation: IAutoMovieRigidTransform["rotation"];
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "pass", run: pass },
  { label: "hose", run: hose },
  { label: "flames", run: flames },
];
