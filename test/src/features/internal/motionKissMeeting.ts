import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidSocket,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  HumanChain,
  HumanMutual,
  HumanPerception,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES_TOUCH } from "./MOTION_HUMAN_LAW_STAGES_TOUCH";
import { motionComplaints } from "./motionComplaints";
import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";
import type { motionHumanLawSweep } from "./motionHumanLawSweep";
import { nclose } from "./nclose";

/**
 * Reads the extreme-pair kiss on the articulated left or right hand back or the stationary forehead. The left uses a mutual join, and the right follows the presenter's held touch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Checks three instants within the contact, event agreement for the mutual hand presentation and penetration across the performance.
 * @evidence contracts/development/implementation.md#principled-implementation The displayed bones carry the two anatomical region frames. A failure of forehead admission also reports the planted rigid-chain reach bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A film for the chosen branch supplies the contact frames and whole-film partner audit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All targets retain the extreme cast, their original stage, 5 mm separation and 10 mm skin allowance.
 * @evidence contracts/development/implementation.md#efficient-algorithms The kiss is planned once and sampled at the two contact boundaries and their midpoint; the partner audit samples the complete film.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The three specifications share measurement code and each supplies its own distinct target.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each performance and its sampled frames are local to its test.
 */
export function motionKissMeeting(
  region: "handBackLeft" | "handBackRight" | "forehead",
): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const a: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const shared: boolean = region === "handBackLeft";
  const scene: motionHumanLawSweep.IScene = MOTION_HUMAN_LAW_STAGES_TOUCH.kiss!(
    (parameter: string): string | undefined =>
      parameter === "region" ? region : undefined,
    a,
    b,
  );
  try {
    const composition: motionHumanLawSweep.IScene["composition"] = shared
      ? HumanChain.mutual(
          HumanMutual.kiss,
          {
            kisser: HumanChain.subject("a"),
            kissed: HumanChain.subject("b"),
          },
          { region },
        ).node
      : scene.composition;
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "sweep-2",
      scene.people,
      composition,
      scene.props,
    );
    const contact: number = motionHumanLaw.event(film, "contact");
    const part: number = motionHumanLaw.event(film, "part");
    all.check(`${region}: the contact precedes parting`, contact < part);
    if (shared) {
      all.check(
        "the presenter and the kisser have the same contact and parting seconds",
        nclose(contact, motionHumanLaw.event(film, "contact", "b")) &&
          nclose(part, motionHumanLaw.event(film, "part", "b")),
      );
    } else if (region === "handBackRight") {
      const ready: number = motionHumanLaw.event(film, "ready", "b");
      const relax: number = motionHumanLaw.event(film, "relax", "b");
      const kiss: IAutoMovieMotionHumanSegment =
        film.performance.segments("a")[0]!;
      all.check(
        `right hand: kiss starts at ${kiss.start} s after presentation at ${ready} s`,
        nclose(kiss.start - ready, HumanPerception.REACTION),
      );
      all.check(
        `right hand: lip contact from ${contact} to ${part} s stays within the presentation from ${ready} to ${relax} s`,
        ready < contact && part <= relax,
      );
    }
    const mouthFrame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"] =
      a.surfaces.regions.mouth;
    const targetFrame: typeof mouthFrame = b.surfaces.regions[region];
    if (region !== "forehead") {
      const presented: AutoMovieHumanoidBone =
        region === "handBackLeft" ? "leftHand" : "rightHand";
      all.check(
        `${region} must be carried by the presented ${presented}, got ${targetFrame.bone}`,
        targetFrame.bone === presented,
      );
    }
    for (const seconds of [contact, (contact + part) / 2, part]) {
      const mouth: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        mouthFrame,
        film.bones("a", seconds).get(mouthFrame.bone)!,
      ).point;
      const target: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        targetFrame,
        film.bones("b", seconds).get(targetFrame.bone)!,
      ).point;
      const gap: number = Vector3.distance(mouth, target);
      all.check(
        `${region}: the lips are ${gap * 1000} mm from the skin at ${seconds} s`,
        gap <= 0.005,
      );
    }
    const worst: ReturnType<
      typeof AutoMovieMotionHumanAuditPartner.measure
    >["worst"] = AutoMovieMotionHumanAuditPartner.measure(
      film,
      scene.people[0]!,
      scene.people[1]!,
    ).worst;
    all.check(
      `${region}: partner penetration ${worst.value * 1000} mm at ${worst.seconds} s (${worst.where})`,
      worst.value <= 0.01,
    );
  } catch (error: unknown) {
    const height: string =
      region === "forehead"
        ? `, at least ${(leastForeheadSeparation(scene) * 1000).toFixed(1)} mm vertically beyond the planted kisser's rigid links`
        : "";
    all.check(
      `${region}: the kiss must play: ${String(error)}${height}`,
      false,
    );
  }
  all.assert(`the lips meet the displayed ${region} within 5 mm`);
}

/** A lower bound on the stationary forehead's height above any planted kiss. */
function leastForeheadSeparation(scene: motionHumanLawSweep.IScene): number {
  const kisser: motionHumanLawSweep.IPerson = scene.people[0]!;
  const kissed: motionHumanLawSweep.IPerson = scene.people[1]!;
  const body: IAutoMovieMotionHumanBody = kisser.body;
  const mouth: IAutoMovieMotionHumanBody["surfaces"]["regions"]["mouth"] =
    body.surfaces.regions.mouth;
  const lengths: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map(
    body.skeleton.bones.map(
      (b: IAutoMovieBone): [AutoMovieHumanoidBone, IAutoMovieBone] => [
        b.bone,
        b,
      ],
    ),
  );
  // Vertical distance never exceeds the sum of rigid link lengths along
  // the path from a planted sole, through the hips, to the lips.
  const sockets: readonly AutoMovieHumanoidSocket[] = [
    "heelLeft",
    "ballLeft",
    "toeLeft",
    "soleLeft",
    "heelRight",
    "ballRight",
    "toeRight",
    "soleRight",
  ];
  const tallest: number =
    kisser.at.y +
    chain(mouth.bone) +
    Vector3.length(mouth.point) +
    Math.max(
      ...sockets.map((name: AutoMovieHumanoidSocket): number => {
        const ground: IAutoMovieMotionHumanBody["surfaces"]["sockets"][AutoMovieHumanoidSocket] =
          body.surfaces.sockets[name];
        return chain(ground.bone) + Vector3.length(ground.point);
      }),
    );
  const remained: IAutoMovieMotionHumanPosture = stand.posture(
    kissed.body,
    kissed.at,
    kissed.yaw,
  );
  const bones: ReturnType<typeof poseBones> = poseBones(
    kissed.body,
    resolveHumanPosture(kissed.body, remained),
  );
  const frame: typeof mouth = kissed.body.surfaces.regions.forehead;
  const height: number = resolveAutoMovieHumanoidSurfaces.place(
    frame,
    bones.get(frame.bone)!,
  ).point.y;
  return height - tallest;

  /** Sum actual rest translations from a link up to the common pelvis. */
  function chain(first: AutoMovieHumanoidBone): number {
    let length: number = 0;
    for (
      let bone: IAutoMovieBone = lengths.get(first)!;
      bone.bone !== "hips";
      bone = lengths.get(bone.parent!)!
    )
      length += Vector3.length(bone.rest.translation);
    return length;
  }
}
