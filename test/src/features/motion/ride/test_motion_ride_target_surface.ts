import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSkill,
  IAutoMovieMotionHumanTouchSite,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanTouch, HumanChain } from "@automovie/motions";
import { HumanSkill } from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { motionHumanLaw } from "../../internal/motionHumanLaw";

const { touchSite } = AutoMovieMotionHumanTouch;

/**
 * A site belongs to the tangent plane of its region. The reach rule chooses the
 * closest point of its closed disk.
 *
 * Scenarios:
 *
 * 1. Project the shoulder at the centre, inside, on and outside a disk.
 * 2. Fix a site on the horizontal tangent plane, then move a seeded site with its
 *    region.
 * 3. Collapse the disk to zero radius and refuse negative radii.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads site frames under changing shoulder and region positions. A fixed centre, wrong axis, inverted radius or fresh draw changes the returned coordinates.
 * @evidence contracts/development/testing.md#independent-expectations Orthogonal projection followed by radial clipping minimizes distance to a closed disk. The explicit coordinates use a 3:4:5 triangle and the coordinate axes.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks interior, exact perimeter, exterior and normal-only displacements, a vertical normal, zero radius and negative radius.
 * @evidence contracts/development/testing.md#execution-ownership Uses the public site primitive, in-memory vectors and a real seeded variation stream.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the projection, coordinate frames and domain.
 */
export function test_motion_ride_target_surface(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    checkCheekNormals(checks);
  } catch (error: unknown) {
    checks.check(`checkCheekNormals: ${everydayTake.describe(error)}`, false);
  }
  try {
    checkAnatomicalExtents(checks);
  } catch (error: unknown) {
    checks.check(
      `checkAnatomicalExtents: ${everydayTake.describe(error)}`,
      false,
    );
  }
  const skill: IAutoMovieMotionHumanSkill = HumanSkill.resolve(
    { p: 0 },
    "site",
  );
  const context: Pick<IAutoMovieMotionHumanActionContext, "series"> = {
    series: (channel: string): IAutoMovieMotionHumanActionContext.ISeries => ({
      random: HumanSkill.series(skill, "a", "touch", channel),
      index: 0,
    }),
  };
  const frame: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: { x: 1, y: 2, z: 3 },
    normal: { x: 0, y: 0, z: 1 },
  };
  const radius: number = 0.05;
  const nearest: ReturnType<typeof touchSite> = touchSite(context, {
    rule: "reach",
    within: radius,
  });
  for (const [scale, expected] of [
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [2, 1],
  ] as const) {
    try {
      const shoulder: IAutoMovieVector3 = Vector3.add(frame.point, {
        x: 0.03 * scale,
        y: 0.04 * scale,
        z: 0.4,
      });
      const target: IAutoMovieVector3 = Vector3.add(frame.point, {
        x: 0.03 * expected,
        y: 0.04 * expected,
        z: 0,
      });
      const site: IAutoMovieMotionHumanTouchSite.IFrame = nearest(
        frame,
        shoulder,
      );
      checks.check(
        `nearest point at ${scale} radii`,
        Vector3.distance(site.point, target) <= 1e-12,
      );
      checks.equals(
        "the normal remains the region normal",
        site.normal,
        frame.normal,
      );
    } catch (error: unknown) {
      checks.check(
        `${String(scale)} ${String(expected)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  const upward: IAutoMovieMotionHumanTouchSite.IFrame = {
    point: frame.point,
    normal: { x: 0, y: 1, z: 0 },
  };
  const fixed: ReturnType<typeof touchSite> = touchSite(context, {
    up: 0.02,
    out: 0.04,
  });
  checks.check(
    "a horizontal plane carries the stated offset",
    Vector3.distance(fixed(upward, frame.point).point, {
      x: 0.96,
      y: 2,
      z: 3.02,
    }) <= 1e-12,
  );
  const draw: ReturnType<typeof touchSite> = touchSite(context, {
    draw: radius,
  });
  const offset: IAutoMovieVector3 = Vector3.subtract(
    draw(frame, frame.point).point,
    frame.point,
  );
  checks.check(
    "the drawn site belongs to the disk",
    offset.z === 0 && Vector3.length(offset) <= radius,
  );
  const moved: IAutoMovieMotionHumanTouchSite.IFrame = {
    ...frame,
    point: { x: 3, y: 2, z: 1 },
  };
  checks.check(
    "the offset rides a translated frame",
    Vector3.distance(
      draw(moved, frame.point).point,
      Vector3.add(moved.point, offset),
    ) <= 1e-12,
  );
  const zero: ReturnType<typeof touchSite> = touchSite(context, {
    rule: "reach",
    within: 0,
  });
  checks.equals(
    "zero radius keeps the centre",
    zero(frame, moved.point).point,
    frame.point,
  );
  checks.refuses("negative reach radius", () =>
    touchSite(context, { rule: "reach", within: -radius }),
  );
  checks.refuses("negative draw radius", () =>
    touchSite(context, { draw: -radius }),
  );
  checks.assert("ride target surface");
}

/**
 * The cheek regions lie on the zygomatic prominence over the buccal area: the
 * place a palm washing the face, cupping it or slapping it meets, beside the
 * nose and above the jaw, facing forward and out.
 *
 * Each body stands quietly heading +Z (its right toward -X); the regions are
 * placed on its displayed head at 0.25 s.
 *
 * Scenarios, on the average man and the small woman:
 *
 * 1. Each cheek lies between the mouth's and the nose bridge's heights, the
 *    cheekbone's band of the face.
 * 2. Each cheek lies at least 25 mm out from the nose toward its own side, behind
 *    the nose's point and ahead of its side's ear.
 * 3. Each cheek lies above its side's jaw region.
 * 4. Each cheek's normal faces forward (its forward part over 0.6), out to its own
 *    side (over 0.4) and within 10 degrees of level.
 * 5. The left cheek is the right cheek mirrored in the head's median plane within
 *    1 mm, and its normal the mirrored normal within 0.01.
 */
function checkCheekNormals(checks: motionComplaints.IGatherer): void {
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "cheek",
      [{ subject: "a", body }],
      HumanChain.subject("a").stand({ hold: 0.5 }),
    );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      film.bones("a", 0.25);
    const place = (
      region: AutoMovieHumanoidRegion,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } => {
      const frame: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions[region];
      return resolveAutoMovieHumanoidSurfaces.place(
        frame,
        bones.get(frame.bone)!,
      );
    };
    const nose: IAutoMovieVector3 = place("nose").point;
    const bridge: IAutoMovieVector3 = place("noseBridge").point;
    const mouth: IAutoMovieVector3 = place("mouth").point;
    const median: number = bones.get("head")!.worldPosition.x;
    for (const [side, sign] of [
      ["Right", -1],
      ["Left", 1],
    ] as const) {
      const cheek = place(`cheek${side}`);
      const at: IAutoMovieVector3 = cheek.point;
      const n: IAutoMovieVector3 = cheek.normal;
      const label: string = `${name} cheek${side}`;
      if (!(at.y > mouth.y && at.y < bridge.y))
        complaints.push(
          `${label}: height ${mm(at.y)} mm outside the mouth ${mm(mouth.y)} to the nose bridge ${mm(bridge.y)}`,
        );
      const out: number = sign * (at.x - nose.x);
      const ear: IAutoMovieVector3 = place(`ear${side}`).point;
      if (!(out >= 0.025 && at.z < nose.z && at.z > ear.z))
        complaints.push(
          `${label}: ${mm(out)} mm out from the nose (at least 25.0), depth ${mm(at.z)} mm against the nose ${mm(nose.z)} and the ear ${mm(ear.z)}`,
        );
      const jaw: IAutoMovieVector3 = place(`jaw${side}`).point;
      if (!(at.y > jaw.y))
        complaints.push(
          `${label}: height ${mm(at.y)} mm not above the jaw's ${mm(jaw.y)}`,
        );
      const tilt: number = (Math.asin(Math.abs(n.y)) * 180) / Math.PI;
      if (!(n.z > 0.6 && sign * n.x > 0.4 && tilt <= 10))
        complaints.push(
          `${label}: normal (${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)}), ${tilt.toFixed(1)} deg off level`,
        );
    }
    const right = place("cheekRight");
    const left = place("cheekLeft");
    const mirror: number = Math.hypot(
      left.point.x - median - (median - right.point.x),
      left.point.y - right.point.y,
      left.point.z - right.point.z,
    );
    const turned: number = Math.hypot(
      left.normal.x + right.normal.x,
      left.normal.y - right.normal.y,
      left.normal.z - right.normal.z,
    );
    if (!(mirror <= 0.001 && turned <= 0.01))
      complaints.push(
        `${name}: the left cheek is ${mm(mirror)} mm and ${turned.toFixed(3)} in its normal off the right cheek's mirror`,
      );
  }
  checks.equals("the cheeks lie on the cheekbones", complaints, []);
}

/**
 * Every region of a body is an area: a disc about its point, reaching half way
 * to its nearest neighbour that faces the same way, no farther than its segment
 * allows and never smaller than the 10 mm contact tolerance.
 *
 * Scenarios, on the average man and the small woman:
 *
 * 1. Every region has an extent of at least 10 mm.
 * 2. No two regions that face the same way overlap: their extents together are no
 *    more than the distance between their points, unless both sit at the 10 mm
 *    floor.
 * 3. A region and its mirror have the same extent.
 */
function checkAnatomicalExtents(checks: motionComplaints.IGatherer): void {
  const findings: string[] = [];
  for (const name of ["m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const entries = Object.entries(body.surfaces.regions) as [
      AutoMovieHumanoidRegion,
      (typeof body.surfaces.regions)[AutoMovieHumanoidRegion],
    ][];
    const placed = entries.map(([region, frame]) => {
      const rest: IAutoMovieVector3 = body.rest.get(frame.bone)!;
      return {
        region,
        radius: frame.radius ?? 0,
        point: Vector3.add(rest, frame.point),
        normal: Quaternion.rotateVector(Quaternion.identity(), frame.normal),
      };
    });
    for (const a of placed) {
      // 1. The floor.
      if (!(a.radius >= 0.01 - 1e-12))
        findings.push(`${name} ${a.region}: extent ${a.radius}`);
      // 3. The mirror.
      const mirror: string = a.region.endsWith("Left")
        ? a.region.replace(/Left$/, "Right")
        : a.region.replace(/Right$/, "Left");
      const twin = placed.find((p) => p.region === mirror);
      if (twin !== undefined && Math.abs(twin.radius - a.radius) > 1e-9)
        findings.push(
          `${name} ${a.region}: extent ${a.radius} but its mirror's ${twin.radius}`,
        );
      // 2. No overlap with a neighbour facing the same way.
      for (const b of placed)
        if (
          a.region < b.region &&
          Vector3.dot(a.normal, b.normal) > 0 &&
          !(a.radius <= 0.01 + 1e-12 && b.radius <= 0.01 + 1e-12) &&
          a.radius + b.radius >
            Vector3.length(Vector3.subtract(a.point, b.point)) + 1e-9
        )
          findings.push(`${name} ${a.region} and ${b.region} overlap`);
    }
  }
  checks.equals("region extents", findings, []);
}
