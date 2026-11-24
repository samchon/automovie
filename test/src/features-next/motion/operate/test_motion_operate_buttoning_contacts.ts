import {
  Quaternion,
  Transform,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { HumanManipulate } = AutoMovieMotionHumanOperate;

/**
 * Coordinated thumb and index contact on a fixed garment prop (#3420).
 *
 * Scenarios:
 * 1. At the authored instant, the right thumb meets the button while the
 *    left index finger meets the rim of the buttonhole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two digits, their prop sites and the common authored instant.
 * @evidence contracts/development/testing.md#behavioral-verification Places one registered keyed sequence and measures both displayed fingertip surfaces from resolved bones at the authored second.
 * @evidence contracts/development/testing.md#independent-expectations The two world targets are the garment origin plus authored socket offsets, and the 2 mm bound comes from #3420's keyed-contact acceptance.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite hands, different digits, distinct sockets and one shared instant distinguish the two intended contacts from a single press or a swapped assignment.
 * @evidence contracts/development/testing.md#execution-ownership A motions unit test on one polygon-man body, discovered by its exported name and using no host.
 */
export function test_motion_operate_buttoning_contacts(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const rightShoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const leftShoulder: IAutoMovieVector3 = body.rest.get("leftUpperArm")!;
  const at: IAutoMovieVector3 = {
    x: 0,
    y: body.measure.shoulderHeight - body.measure.upperArm,
    z: rightShoulder.z + 0.8 * body.measure.forearm,
  };

  // The raised work surface follows the existing keyed-contact fixture.
  // Each garment socket sits toward the shoulder of the hand that uses it.
  const seconds: number = 0.25;
  const sites: readonly {
    readonly contact: IAutoMovieMotionHumanManipulate.IContact;
    readonly offset: IAutoMovieVector3;
    readonly region: "thumbTipRight" | "indexTipLeft";
  }[] = [
    {
      contact: {
        site: "button",
        hand: "right",
        digit: "thumb",
        at: seconds,
        depth: 0,
      },
      offset: { x: Math.sign(rightShoulder.x) * 0.025, y: 0, z: 0 },
      region: "thumbTipRight",
    },
    {
      contact: {
        site: "buttonholeRim",
        hand: "left",
        digit: "index",
        at: seconds,
        depth: 0,
      },
      offset: { x: Math.sign(leftShoulder.x) * 0.025, y: 0, z: 0 },
      region: "indexTipLeft",
    },
  ];
  const garment: IAutoMovieMotionHumanProp = {
    subject: "garment",
    fixed: true,
    frame: { position: at, rotation: Quaternion.identity() },
    points: {},
    affordances: sites.map(
      (
        site: (typeof sites)[number],
      ): NonNullable<IAutoMovieMotionHumanProp["affordances"]>[number] => ({
        id: site.contact.site,
        kind: "surface",
        frame: { ...Transform.identity(), translation: site.offset },
        extent: null,
      }),
    ),
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "buttoning contacts",
    laws: [HumanManipulate.sequence],
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "elite" },
      },
    ],
    props: [garment],
    composition: HumanChain.subject("actor").registered("manipulate", {
      prop: garment.subject,
      contacts: sites.map(
        (
          site: (typeof sites)[number],
        ): IAutoMovieMotionHumanManipulate.IContact => site.contact,
      ),
    }).node,
  });

  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("actor", seconds);
  for (const site of sites) {
    const surface: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[site.region];
    const tip: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      surface,
      bones.get(surface.bone)!,
    ).point;
    const target: IAutoMovieVector3 = Vector3.add(at, site.offset);
    const miss: number = Vector3.length(Vector3.subtract(tip, target));
    TestValidator.predicate(
      `${site.region} misses ${site.contact.site} by ${(1000 * miss).toFixed(2)} mm (at most 2 mm expected)`,
      miss <= 0.002,
    );
  }
}
