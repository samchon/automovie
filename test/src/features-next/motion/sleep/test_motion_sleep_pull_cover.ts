import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieSoftBodyDomain,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSleep,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { checkTakeClean } from "../../../features/internal/checkTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { softPanel } from "../../../features/internal/softPanel";

/** How far above the skin a gripping hand's socket rides, metres: the closed fist's half depth over a blanket's thickness, the law's own premise for where the hands go. */
const OVER: number = 0.05;

/** How near the cover's edge comes to a site it is drawn to, metres: the touch contract's 10 mm disc and half the lattice's spacing, as the grip binds the particle nearest the hand. */
const REACH: number = 0.01 + 0.04;

/** The cover's lattice: columns across the body, rows from the thighs toward the feet, and their spacing, metres (a 0.64 by 0.64 m throw). */
const COLUMNS: number = 9;
const ROWS: number = 9;
const SPACING: number = 0.08;

/** The bones of a hand, whose grip holds its cover particle inside the closed fingers. */
const HAND: RegExp = /Hand|Thumb|Index|Middle|Ring|Little/;

/** Seconds held lying before the cover is drawn. */
const HOLD: number = 0.5;

/**
 * Pulling a cover up to the chest while lying on the back, and pushing it
 * off again (#3987).
 *
 * The cover is a soft sheet laid over the lying legs, its edge across the
 * thighs. It is weightless, so it stays where it is laid while the body
 * lies down beneath it; gravity on the cloth is the soft solver's own spec,
 * not this one's.
 *
 * Scenarios, on the average man and the small woman, one take that lies
 * down, pulls the cover up and pushes it off, the take clean:
 * 1. At the pull's `strokeEnd` the cover's edge lies at both chest sites.
 * 2. At the push's `strokeEnd` it lies back at both thigh sites.
 * 3. Through both strokes and after, no cover particle passes into the body
 *    and every one stays above the floor.
 * 4. A cover pulled while standing is refused on `base`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, its weightless premise, the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the soft solve's particles against the displayed body's chest and thigh sites and its colliders; an edge short of the chest, a cover left on the chest, a cover drawn through the body or an admitted standing pull fails.
 * @evidence contracts/development/testing.md#independent-expectations The sites are the body's own regions; the reach bound is the touch contract's disc plus half the lattice spacing; the body's colliders are its own.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, the pull and the push, and the refused standing pull; lying down and the bed are their own specs'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain with a soft prop.
 */
export function test_motion_sleep_pull_cover(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      verify(checks, fit);
    } catch (error: unknown) {
      checks.check(
        `${fit}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }

  // 4. Standing.
  checks.check(
    "a cover pulled while standing is refused on the base",
    ((): boolean => {
      try {
        bed(motionHumanBody("m-average"), false).bones("a", 1);
        return false;
      } catch (error: unknown) {
        return error instanceof HumanRefusal && error.axis === "base";
      }
    })(),
  );
  checks.assert("the cover pull and push meet their acceptance");
}

/** The bodies covered. */
type Fit = "m-average" | "f-small";

/** One body's take and its checks 1 to 3. */
function verify(checks: motionComplaints.IGatherer, fit: Fit): void {
  {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
    const film: HumanPerformance = bed(body, true);
    checkTakeClean(checks, `${fit} pulls a cover up and off`, film);
    const [pull, push]: IAutoMovieMotionHumanSegment[] = film
      .segments("a")
      .filter(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.name === AutoMovieMotionHumanSleep.pullCover.name,
      );
    const end = (segment: IAutoMovieMotionHumanSegment): number =>
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === "strokeEnd",
        )!.share;
    const edge = (seconds: number): IAutoMovieVector3[] => {
      const points: number[] = film.soft("cover", seconds);
      return Array.from(
        { length: COLUMNS },
        (_v: unknown, c: number): IAutoMovieVector3 => ({
          x: points[3 * c]!,
          y: points[3 * c + 1]!,
          z: points[3 * c + 2]!,
        }),
      );
    };
    const reaches = (
      seconds: number,
      regions: readonly AutoMovieHumanoidRegion[],
    ): number =>
      Math.max(
        ...regions.map((region: AutoMovieHumanoidRegion): number => {
          const at: IAutoMovieVector3 = site(
            body,
            film.bones("a", seconds),
            region,
          );
          return Math.min(
            ...edge(seconds).map((p: IAutoMovieVector3): number =>
              Vector3.distance(p, at),
            ),
          );
        }),
      );

    // 1 and 2. The edge at the chest, then back at the thighs.
    const up: number = reaches(end(pull!), ["chestLeft", "chestRight"]);
    checks.check(
      `${fit}: the pulled edge lies at the chest (${(up * 1000).toFixed(0)} mm)`,
      up <= REACH,
    );
    const off: number = reaches(end(push!), [
      "thighFrontLeft",
      "thighFrontRight",
    ]);
    checks.check(
      `${fit}: the pushed edge lies back at the thighs (${(off * 1000).toFixed(0)} mm)`,
      off <= REACH,
    );

    // 3. Over the body, never in it.
    let deepest: number = Infinity;
    let lowest: number = Infinity;
    for (let k: number = 0; k <= 12; ++k) {
      const t: number = pull!.start + ((push!.end - pull!.start) * k) / 12;
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("a", t);
      const points: number[] = film.soft("cover", t);
      for (let i: number = 0; i < points.length; i += 3) {
        const p: IAutoMovieVector3 = {
          x: points[i]!,
          y: points[i + 1]!,
          z: points[i + 2]!,
        };
        // A gripped particle rides inside the closing hand by design.
        const near: IAutoMovieMotionHumanColliders.INearestResult =
          HumanColliders.nearest(body, bones, p, p);
        if (!HAND.test(near.bone)) deepest = Math.min(deepest, near.distance);
        lowest = Math.min(lowest, p.y);
      }
    }
    checks.check(
      `${fit}: the cover stays over the body (deepest ${(deepest * 1000).toFixed(1)} mm, lowest ${(lowest * 1000).toFixed(0)} mm)`,
      deepest >= 0 && lowest > 0,
    );
  }
}

/** A region's world point lifted `OVER` along its normal, on posed bones. */
function site(
  body: IAutoMovieMotionHumanBody,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  region: AutoMovieHumanoidRegion,
): IAutoMovieVector3 {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = bones.get(frame.bone)!;
  return Vector3.add(
    Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, frame.point),
    ),
    Vector3.scale(
      Quaternion.rotateVector(bone.worldRotation, frame.normal),
      OVER,
    ),
  );
}

/** Performer `a` at the origin; lying down on the back first when `lying`, it pulls the cover laid over its legs up and pushes it off. */
function bed(
  body: IAutoMovieMotionHumanBody,
  lying: boolean,
): HumanPerformance {
  const performer: IAutoMovieMotionHumanPerformer = {
    subject: "a",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" },
  };

  // Where the lying thighs are, read on the body lain down alone.
  const lain: HumanPerformance = new HumanPerformance({
    seed: "pull cover lain",
    performers: [performer],
    composition: HumanChain.subject("a").lieDown({
      kind: "supine",
      hold: HOLD,
    }).node,
  });
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = lain.bones(
    "a",
    lain.duration,
  );
  const left: IAutoMovieVector3 = site(body, bones, "thighFrontLeft");
  const right: IAutoMovieVector3 = site(body, bones, "thighFrontRight");
  const middle: IAutoMovieVector3 = Vector3.lerp(left, right, 0.5);
  const toward: number = Math.sign(
    bones.get("leftFoot")!.worldPosition.z - middle.z,
  );
  const domain: IAutoMovieSoftBodyDomain = softPanel({
    columns: COLUMNS,
    rows: ROWS,
    spacing: { u: SPACING, v: SPACING },
    origin: {
      x: middle.x - ((COLUMNS - 1) * SPACING) / 2,
      y: Math.max(left.y, right.y),
      z: middle.z,
    },
    axisU: { x: 1, y: 0, z: 0 },
    axisV: { x: 0, y: 0, z: toward },
    overrides: {
      id: "cover",
      solver: {
        fixedStepSeconds: 1 / 64,
        gravity: { x: 0, y: 0, z: 0 },
        drag: 6,
        iterations: 8,
        stiffness: { structural: 1, shear: 0.5, bend: 0.05 },
        referenceSpeed: 4,
        maxSteps: 64 * 40,
      },
      mass: new Array(COLUMNS * ROWS).fill(0.01),
    },
  });
  const cover: IAutoMovieMotionHumanProp = {
    subject: "cover",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    soft: domain,
  };
  const start: IAutoMovieMotionHumanChain = lying
    ? HumanChain.subject("a").lieDown({ kind: "supine", hold: HOLD })
    : HumanChain.subject("a").stand({ hold: 0.2, sway: 0 });
  return new HumanPerformance({
    seed: "pull cover",
    performers: [performer],
    props: [cover],
    laws: [AutoMovieMotionHumanSleep.pullCover],
    composition: start
      .registered(AutoMovieMotionHumanSleep.pullCover.name, { prop: "cover" })
      .registered(AutoMovieMotionHumanSleep.pullCover.name, {
        prop: "cover",
        off: true,
      }).node,
  });
}
