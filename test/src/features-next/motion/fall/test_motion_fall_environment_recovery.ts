import { createKerb, createLadder } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanEnvironmentRecovery,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanFoot, HumanHand } from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Cut a real walk at a staged trip and a staged slip and follow each outcome
 * into the next beat.
 *
 * Scenarios:
 * 1. The ordinary walk is read first: a forward toe swing just above the
 *    floor and a two-foot load transition, and it publishes no support loss.
 * 2. A kerb staged under that toe trips it at the cut; the left hand braces
 *    on a ladder rail, holds a fixed point on the bar in either sampling
 *    order, and the walk continues.
 * 3. A frictionless floor slips the right foot at the load transition into
 *    the requested fall; the foot's support ends, the fall ends lying, and the
 *    get-up returns to walking.
 * 4. A rail out of reach refuses the braced outcome naming the rail.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the observed gait cues and the caught and uncaught outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual toe cue, supporting palm, published support intervals, fall base and onward displayed body.
 * @evidence contracts/development/testing.md#independent-expectations Scene geometry and original gait are observed without the new law before composing the matched cuts.
 * @evidence contracts/development/testing.md#distinguishing-cases A caught obstruction, a support-relative slip and fall, an unreachable bar and the plain original walk.
 * @evidence contracts/development/testing.md#execution-ownership Uses portable public HumanChain performances with real fixed archetypes.
 */
export function test_motion_fall_environment_recovery(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body = motionHumanBody("m-average");
  const performer = {
    subject: "a",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" as const },
  };
  const travel = HumanChain.subject("a").walk({
    to: { x: 0, y: 0, z: 4.5 },
    pace: "normal",
  });
  const baseline = new HumanPerformance({
    seed: "environment-baseline",
    performers: [performer],
    composition: travel.node,
  });
  const gait: IAutoMovieMotionHumanSegment = baseline.segments("a")[0]!;
  const planted = (side: AutoMovieHumanSide, share: number): boolean =>
    gait.plan.contacts.some(
      (window) =>
        window.part === side + "Foot" &&
        share > window.from &&
        share < window.to,
    );
  let obstruction: IObstruction | undefined;
  let slip: ILoadTransition | undefined;
  for (let i: number = 15; i <= 66; i++) {
    const share: number = i / 100;
    const t: number = share * gait.plan.duration;
    const bones = baseline.bones("a", t);
    const earlier = baseline.bones("a", t - 0.012);
    const later = baseline.bones("a", t + 0.012);
    if (planted("left", share) && planted("right", share)) {
      const centre: number = bones.get("hips")!.worldPosition.z;
      const strength: number = Math.abs(
        later.get("hips")!.worldPosition.z +
          earlier.get("hips")!.worldPosition.z -
          2 * centre,
      );
      if (slip === undefined || strength > slip.strength)
        slip = { share, strength };
    }
    if (obstruction === undefined) {
      for (const side of ["left", "right"] as const) {
        const other = side === "left" ? "right" : "left";
        if (planted(side, share) || !planted(other, share)) continue;
        const toe = HumanFoot.sockets(body, bones, side)[2]!.point;
        const before = HumanFoot.sockets(body, earlier, side)[2]!.point;
        if (toe.y >= 0.025 && toe.y <= 0.1 && toe.z - before.z > 0.005) {
          obstruction = { side, share, toe };
          break;
        }
      }
    }
  }
  all.check(
    "the ordinary walk supplies both an actual forward swing and a two-foot load transition",
    obstruction !== undefined && slip !== undefined && slip.strength > 1e-5,
  );
  if (obstruction === undefined || slip === undefined) {
    all.assert("staged cues exist on the baseline walk");
    return;
  }
  all.check(
    "the ordinary walk emits no environmental event",
    !gait.plan.events.some((event) => event.name === "supportLost"),
  );

  const kerb = createKerb({ kind: "kerb", height: 0.1 });
  const ladder = createLadder({
    kind: "fixed",
    rungs: 5,
    spacing: 0.3,
    width: 0.47,
  });
  const source = HumanObject.prop("lip", kerb, {
    at: { x: obstruction.toe.x, y: 0, z: obstruction.toe.z - 0.01 },
    yaw: 0,
    fixed: true,
  });
  const rail = HumanObject.prop("rail", ladder, {
    at: { x: 0.57, y: 0, z: obstruction.toe.z - 0.1 },
    yaw: 0,
    fixed: true,
  });
  const far = HumanObject.prop("far", ladder, {
    at: { x: 3.5, y: 0, z: obstruction.toe.z },
    yaw: 0,
    fixed: true,
  });
  const staged = (
    share: number,
    params: IAutoMovieMotionHumanEnvironmentRecovery.IParams,
    rise: boolean,
  ): HumanPerformance => {
    const recovered = travel
      .until({ share })
      .registered("environmentalRecovery", params);
    return new HumanPerformance({
      seed: "environment-" + params.kind,
      performers: [performer],
      props: [source, rail, far],
      laws: [
        AutoMovieMotionHumanFall.HumanEnvironmentRecovery.environmentalRecovery,
      ],
      composition: (rise ? recovered.getUp() : recovered).walk({
        to: { x: 0, y: 0, z: 5.5 },
        pace: "slow",
      }).node,
    });
  };
  const caught = run(() =>
    staged(
      obstruction!.share,
      {
        kind: "trip",
        foot: obstruction!.side,
        obstacle: "lip",
        outcome: "rail",
        rail: { prop: "rail", point: "rightRail", hand: "left" },
      },
      false,
    ),
  );
  all.check(
    "the caught trip reaches the named rail: " + String(caught.error),
    caught.film !== undefined,
  );
  if (caught.film !== undefined) {
    const film = caught.film;
    const reaction = film.segments("a")[1]!;
    const hold = reaction.plan.contacts.find(
      (window) => window.part === "leftHand" && window.kind === "grip",
    );
    all.check(
      "the trip happens at the cut and sends the load into the named bar",
      reaction.plan.events.some(
        (event) => event.name === "trip:lip" && event.share === 0,
      ) &&
        reaction.plan.events.some(
          (event) => event.name === "supportLost" && event.share === 0,
        ) &&
        hold !== undefined &&
        hold.support.kind === "prop" &&
        hold.support.subject === "rail" &&
        (hold.load ?? 0) > 0,
    );
    if (hold !== undefined) {
      const bar = ladder.affordances.find(
        (affordance) => affordance.id === "rightRail",
      )!;
      const pose = rail.frame;
      const centre = Vector3.add(pose.position, bar.frame.translation);
      const axis = Quaternion.rotateVector(bar.frame.rotation, {
        x: 1,
        y: 0,
        z: 0,
      });
      const first =
        reaction.start + ((hold.from + hold.to) * reaction.plan.duration) / 2;
      const before = HumanHand.frame(
        body,
        film.bones("a", first),
        "left",
        "grip",
      ).point;
      film.bones("a", reaction.end);
      film.bones("a", 0);
      const reobserved = HumanHand.frame(
        body,
        film.bones("a", first),
        "left",
        "grip",
      ).point;
      const difference = Vector3.subtract(before, centre);
      const projected = Math.max(
        -bar.length! / 2,
        Math.min(bar.length! / 2, Vector3.dot(axis, difference)),
      );
      all.check(
        "the actual hand wraps a fixed point on the finite bar in either sample order",
        Vector3.distance(before, reobserved) <= 1e-9 &&
          Vector3.length(
            Vector3.subtract(difference, Vector3.scale(axis, projected)),
          ) <= 0.025,
      );
    }
    all.check(
      "the caught stride continues downstage",
      film.bones("a", film.duration).get("hips")!.worldPosition.z > 5,
    );
  }

  const fallen = run(() =>
    staged(
      slip!.share,
      {
        kind: "slip",
        foot: "right",
        coefficient: 0,
        outcome: "fall",
      },
      true,
    ),
  );
  all.check(
    "the low-grip floor admits the compatible fall and rise: " +
      String(fallen.error),
    fallen.film !== undefined,
  );
  if (fallen.film !== undefined) {
    const fall = fallen.film.segments("a")[1]!;
    all.check(
      "the slip releases the named foot before the terminal floor pose",
      fall.plan.events.some(
        (event) => event.name === "slip:floor" && event.share === 0,
      ) &&
        fall.plan.base?.kind === "lying" &&
        !fall.plan.contacts.some(
          (window) => window.part === "rightFoot" && window.from === 0,
        ),
    );
    const end = fallen.film.bones("a", fallen.film.duration);
    all.check(
      "the existing get-up returns to the continuing walk",
      end.get("hips")!.worldPosition.z > 5 &&
        end.get("head")!.worldPosition.y > 0.8 * body.measure.stature,
    );
  }

  const unreachable = run(() =>
    staged(
      obstruction!.share,
      {
        kind: "trip",
        foot: obstruction!.side,
        obstacle: "lip",
        outcome: "rail",
        rail: { prop: "far", point: "rightRail", hand: "left" },
      },
      false,
    ),
  );
  all.check(
    "an unreachable named rail refuses the outcome",
    unreachable.error instanceof HumanRefusal &&
      unreachable.error.axis === "rail.point",
  );
  all.assert("the named environmental source initiates the displayed recovery");
}

/** A staged swing the toe can trip at. */
interface IObstruction {
  /** The walk's share at the cue. */
  share: number;

  /** The swinging foot. */
  side: AutoMovieHumanSide;

  /** Its displayed toe, world metres. */
  toe: IAutoMovieVector3;
}

/** The strongest two-foot load transition of the walk. */
interface ILoadTransition {
  /** The walk's share there. */
  share: number;

  /** The hips' second difference along the path, metres. */
  strength: number;
}

/** A built take or the error that refused it. */
interface IRun {
  /** The take. */
  film?: HumanPerformance;

  /** The refusal. */
  error?: unknown;
}

/** Build a take, keeping its refusal. */
function run(build: () => HumanPerformance): IRun {
  try {
    return { film: build() };
  } catch (error) {
    return { error };
  }
}
