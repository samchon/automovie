import { createZipperPouch } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieModelPart,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanZip,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanOperate,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { zip } = AutoMovieMotionHumanOperate;

/** The stops on the fixture are inset from its nominal 20 cm zipper. */
const STROKE: number = 0.18;

/**
 * Zip open and shut with the displayed fingertips and a physical opening.
 *
 * Scenarios:
 * 1. A supported pouch opens progressively only behind its tab, retains its
 *    clearance after the fingers release, then closes on the reverse stroke.
 *    Both lips clear the seam at either side of an interior opening threshold.
 * 2. The working thumb and index follow opposite faces of the actual tab
 *    geometry while the other index remains on the stationary casing.
 * 3. Missing or moving braces, mismatched tab sites and travel through either
 *    stop are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the supported open-close action and the geometric and contact outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the explicitly registered law through HumanPerformance and reads the posed model and displayed bones.
 * @evidence contracts/development/testing.md#independent-expectations Projects physical boxes to measure the seam gap and working sites. The authored stop distance and the minimum-jerk stroke determine the threshold times independently of the reported travel. The fingertip bound is a test input.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both travel directions, retention before and after release, and independent malformed models and requests.
 * @evidence contracts/development/testing.md#execution-ownership A motion feature test using the canonical polygon body and the public bag producer.
 */
export function test_motion_operate_zip(): void {
  const model: ReturnType<typeof createZipperPouch> = createZipperPouch();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    Vector3.create(0, 1, 0),
    180,
  );
  const position: IAutoMovieVector3 = Vector3.create(
    0,
    body.measure.shoulderHeight - 0.75 * body.measure.upperArm - 0.129,
    shoulder.z + 0.82 * body.measure.forearm,
  );
  const params: IAutoMovieMotionHumanZip = {
    pouch: "pouch",
    thumb: "thumb",
    index: "index",
    brace: "brace",
    travel: STROKE,
    duration: 0.65,
  };

  /** Run one action or the round trip with the same staged model. */
  const run = (
    first: IAutoMovieMotionHumanZip,
    close: boolean = false,
  ): HumanPerformance => {
    const open: IAutoMovieMotionHumanChain = HumanChain.subject(
      "actor",
    ).registered("zip", first);
    return new HumanPerformance({
      seed: "zipper-stops",
      laws: [zip],
      performers: [
        {
          subject: "actor",
          body,
          at: Vector3.create(0, 0, 0),
          yaw: 0,
          proficiency: { level: "elite" },
        },
      ],
      props: [
        HumanObject.prop("pouch", model, { position, rotation, fixed: true }),
      ],
      composition: (close
        ? open.registered("zip", { ...params, travel: -STROKE })
        : open
      ).node,
    });
  };

  const performance: HumanPerformance = run(params, true);
  const [open, close]: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  const sample = (seconds: number): ReturnType<typeof model.articulate> =>
    model.articulate(performance.state("pouch", seconds));
  const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(position, Quaternion.rotateVector(rotation, point));

  const openStart: number = event(open!, "strokeStart");
  const openEnd: number = event(open!, "strokeEnd");
  const closeStart: number = event(close!, "strokeStart");
  const closeEnd: number = event(close!, "strokeEnd");
  const closed: readonly IAutoMovieModelPart[] = sample(openStart).parts;
  const openAgain: readonly IAutoMovieModelPart[] = sample(closeStart).parts;
  const lipNames: readonly [string, string] = ["lip-1--1", "lip-1-1"];
  const seamEdge: number = bound(part(model.parts, lipNames[0]), "x", 1);
  const stemRest: number = bound(part(model.parts, "slider-stem"), "x", -1);
  const thresholds: readonly { offset: number; share: number }[] = [
    -0.00005, 0.00005,
  ].map((offset: number): { offset: number; share: number } => ({
    offset,
    share: strokeShare((seamEdge - stemRest + offset) / STROKE),
  }));
  for (const [begin, end, initialParts, direction] of [
    [openStart, openEnd, closed, 1],
    [closeStart, closeEnd, openAgain, -1],
  ] as const) {
    const initial: number = part(initialParts, "tab").transform!.translation.x;
    const final: number = part(sample(end).parts, "tab").transform!.translation
      .x;
    TestValidator.predicate(
      "the physical tab travels between the two stops",
      Math.abs(final - initial - direction * STROKE) < 1e-9,
    );
    // The 50 µm offsets expose a wrong lip pivot before the gap visibly widens.
    for (const { offset, share } of thresholds) {
      const elapsed: number = direction === 1 ? share : 1 - share;
      const boxes: readonly IAutoMovieModelPart[] = sample(
        begin + elapsed * (end - begin),
      ).parts;
      TestValidator.predicate(
        `the physical stem reaches the threshold offset ${offset} in direction ${direction}`,
        Math.abs(
          bound(part(boxes, "slider-stem"), "x", -1) - seamEdge - offset,
        ) < 1e-8,
      );
      const left: number = bound(part(boxes, lipNames[0]), "z", 1);
      const right: number = bound(part(boxes, lipNames[1]), "z", -1);
      TestValidator.predicate(
        `neither lip crosses the seam near offset ${offset}, direction ${direction}`,
        offset > 0
          ? left < -1e-9 && right > 1e-9
          : Math.abs(left) < 1e-9 && Math.abs(right) < 1e-9,
      );
    }

    let prior: number = initial;
    const gaps: number[] =
      direction === 1 ? [0, 0, 0, 0] : [Infinity, Infinity, Infinity, Infinity];
    for (const share of [0.12, 0.25, 0.5, 0.75, 0.9]) {
      const seconds: number = begin + share * (end - begin);
      const posed: ReturnType<typeof model.articulate> = sample(seconds);
      const tab: IAutoMovieModelPart = part(posed.parts, "tab");
      const stem: IAutoMovieModelPart = part(posed.parts, "slider-stem");
      const stemEdge: number = bound(stem, "x", -1);
      const x: number = tab.transform!.translation.x;
      TestValidator.predicate(
        "the tab follows the directed stroke",
        direction * (x - prior) > 0,
      );
      prior = x;
      for (const section of [0, 1, 2, 3]) {
        const left: IAutoMovieModelPart = part(
          posed.parts,
          `lip-${section}--1`,
        );
        const right: IAutoMovieModelPart = part(
          posed.parts,
          `lip-${section}-1`,
        );
        const gap: number = bound(right, "z", -1) - bound(left, "z", 1);
        TestValidator.predicate(
          "each lip follows the stroke direction",
          direction * (gap - gaps[section]!) >= -1e-9,
        );
        gaps[section] = gap;
        TestValidator.predicate(
          `any access at section ${section} is behind the stem at ${share}`,
          gap <= 1e-9 || bound(left, "x", 1) <= stemEdge + 1e-9,
        );
      }

      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("actor", seconds);
      const contactZ: number = -0.012;
      TestValidator.predicate(
        "the opposed targets lie on the actual tab faces",
        contactZ >= bound(tab, "z", -1) && contactZ <= bound(tab, "z", 1),
      );
      for (const [name, local] of [
        [
          "thumbTipRight",
          { ...tab.transform!.translation, y: bound(tab, "y", 1), z: contactZ },
        ],
        [
          "indexTipRight",
          {
            ...tab.transform!.translation,
            y: bound(tab, "y", -1),
            z: contactZ,
          },
        ],
        ["indexTipLeft", Vector3.create(-0.098, 0.12, -0.032)],
      ] as const) {
        const surface: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.regions[name];
        const shown: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
          surface,
          bones.get(surface.bone)!,
        ).point;
        TestValidator.predicate(
          `${name} stays on its contact at ${share}`,
          Vector3.length(Vector3.subtract(shown, world(local))) <= 0.002,
        );
      }
    }
  }

  for (const [label, parts, opening] of [
    ["before opening", closed, false],
    ["after opening", sample(open!.start + open!.plan.duration).parts, true],
    ["before closing", openAgain, true],
    ["after closing", sample(close!.start + close!.plan.duration).parts, false],
  ] as const) {
    for (const section of [0, 1, 2, 3]) {
      const gap: number =
        bound(part(parts, `lip-${section}-1`), "z", -1) -
        bound(part(parts, `lip-${section}--1`), "z", 1);
      TestValidator.predicate(
        `a settled seam section has the expected clearance ${label}`,
        opening ? gap > 0.05 : Math.abs(gap) < 1e-9,
      );
    }
  }

  for (const [invalid, why] of [
    [{ ...params, brace: "missing" }, "brace"],
    [{ ...params, brace: "thumb" }, "brace"],
    [{ ...params, index: "thumb" }, "opposing"],
    [{ ...params, travel: STROKE + 0.001 }, "stop"],
    [{ ...params, travel: -0.001 }, "stop"],
  ] as const) {
    let refused: boolean = false;
    try {
      run(invalid).segments("actor");
    } catch (error: unknown) {
      refused = error instanceof HumanRefusal && error.message.includes(why);
    }
    TestValidator.predicate(
      `refuses invalid zipper action requiring ${why}`,
      refused,
    );
  }
}

/** Invert the minimum-jerk stroke with less than 3 nm of travel error. */
function strokeShare(travel: number): number {
  let low: number = 0;
  let high: number = 1;
  for (let iteration: number = 0; iteration < 26; ++iteration) {
    const share: number = (low + high) / 2;
    const progress: number = share ** 3 * (10 - 15 * share + 6 * share ** 2);
    if (progress < travel) low = share;
    else high = share;
  }
  return (low + high) / 2;
}

/** Locate a named box on the displayed pouch. */
function part(
  parts: readonly IAutoMovieModelPart[],
  id: string,
): IAutoMovieModelPart {
  return parts.find((item: IAutoMovieModelPart): boolean => item.id === id)!;
}

/** Project the oriented half-extents of a posed box onto a pouch axis. */
function bound(
  part: IAutoMovieModelPart,
  axis: "x" | "y" | "z",
  side: -1 | 1,
): number {
  if (
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type !== "box" ||
    part.transform === null
  )
    throw new Error("Expected a posed pouch box");
  const frame: IAutoMovieTransform = part.transform;
  const box: typeof part.geometry.shape = part.geometry.shape;
  const localAxis: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.create(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0,
    ),
  );
  const halfExtent: number =
    (Math.abs(localAxis.x * frame.scale.x) * box.width +
      Math.abs(localAxis.y * frame.scale.y) * box.height +
      Math.abs(localAxis.z * frame.scale.z) * box.depth) /
    2;
  return frame.translation[axis] + side * halfExtent;
}

/** Read a named event from the public plan rather than assuming a clock share. */
function event(segment: IAutoMovieMotionHumanSegment, name: string): number {
  return (
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (item: IAutoMovieMotionEvent): boolean => item.name === name,
      )!.share
  );
}
