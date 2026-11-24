import { createHandgun } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The gap between the holder's chest and the hostage's back in the hold, metres: the grapple specs' skin. */
const SKIN: number = 0.01;

/**
 * How far behind the hostage the holder stands, metres: a close hold, the
 * holder's chest against the hostage's back, each trunk half its depth from
 * its line, so the holding arm reaches round the hostage's own trunk.
 */
const behind = (
  holder: IAutoMovieMotionHumanBody,
  hostage: IAutoMovieMotionHumanBody,
): number =>
  (holder.measure.chestDepth + hostage.measure.chestDepth) / 2 + SKIN;
/** The pair walks back this far, metres: authored. */
const BACK: number = 0.9;
/** The muzzle stays at the temple within this, metres: a hand's breadth. */
const AIM: number = 0.08;

/**
 * A hostage hold from behind with a handgun at the temple, walking back, on
 * two body pairs.
 *
 * Scenarios:
 * 1. Through the walk the muzzle stays at the hostage's temple.
 * 2. The pair keeps its order: the holder stays behind the hostage along
 *    the walk at every sampled instant, and both travel the authored
 *    distance.
 * 3. A weapon given without its point is refused, and a shorter holder whose
 *    reach the touch law finds short of a taller hostage's temple is refused
 *    on the target.
 * 4. The take passes the shipped verdict report: no feet crossing or
 *    penetrating between the two, no foot slide.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hold, the walk and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered hostageHold and heldHostage rows through HumanPerformance and reads the muzzle, the temple, both roots and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The separation and the walk are authored; the aim bound is a hand's breadth.
 * @evidence contracts/development/testing.md#distinguishing-cases Two body pairs and a refused parameter pair.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_hostage_hold(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const [holderLabel, hostageLabel] of [
    ["m-average", "f-small"],
    ["f-small", "m-average"],
  ] as const) {
    const label: string = `${holderLabel} holds ${hostageLabel}`;
    const holder: IAutoMovieMotionHumanBody = motionHumanBody(holderLabel);
    const hostage: IAutoMovieMotionHumanBody = motionHumanBody(hostageLabel);
    // A holder shorter than the hostage may find the temple outside its
    // reach: the touch law's own reach model (its lean-capped arm) then
    // refuses on the target, which is the honest result for that pair. A
    // holder at least the hostage's height must play the hold.
    if (holder.measure.stature < hostage.measure.stature) {
      let beyond: unknown = undefined;
      try {
        perform(holder, hostage, "muzzle");
      } catch (error: unknown) {
        beyond = error;
      }
      if (beyond !== undefined) {
        checks.check(
          `${label}: a temple beyond the holder's reach is refused on the target: ${String(beyond)}`,
          beyond instanceof HumanRefusal && beyond.axis === "target",
        );
        continue;
      }
    }
    try {
      const film: HumanPerformance = perform(holder, hostage, "muzzle");
      const hold: IAutoMovieMotionHumanSegment = film
        .segments("h")
        .find((s: IAutoMovieMotionHumanSegment): boolean => s.id === "hold")!;
      const share: (name: string) => number = (name: string): number =>
        hold.start +
        hold.plan.duration *
          hold.plan.events.find((e): boolean => e.name === name)!.share;
      const held: number = share("held");
      const backed: number = share("backed");
      const model: ReturnType<typeof createHandgun> = createHandgun({
        frame: "compact",
      });
      for (let i: number = 0; i <= 8; ++i) {
        const t: number = held + ((backed - held) * i) / 8;
        const frame: IAutoMovieRigidTransform = film.prop("gun", t);
        const muzzle: IAutoMovieVector3 = Vector3.add(
          frame.position,
          Quaternion.rotateVector(
            frame.rotation,
            model.affordance("muzzle").frame.translation,
          ),
        );
        // The hostage's temple on its displayed head.
        const site: IAutoMovieHumanoidSurfaces.IFrame =
          hostage.surfaces.regions.templeRight;
        const temple: IAutoMovieVector3 =
          resolveAutoMovieHumanoidSurfaces.point(
            site,
            film.bones("v", t).get(site.bone)!,
          );
        checks.check(
          `${label}: the muzzle stays at the temple at ${t.toFixed(2)} (${Vector3.distance(muzzle, temple).toFixed(3)} m)`,
          Vector3.distance(muzzle, temple) <= AIM,
        );
        const a: IAutoMovieVector3 = film.posture("h", t).root;
        const b: IAutoMovieVector3 = film.posture("v", t).root;
        checks.check(
          `${label}: the holder stays behind at ${t.toFixed(2)}`,
          b.z - a.z >= 0.15,
        );
      }
      for (const subject of ["h", "v"] as const) {
        const moved: number =
          film.posture(subject, held).root.z -
          film.posture(subject, film.duration).root.z;
        checks.check(
          `${label}: ${subject} walks back ${moved.toFixed(3)} m`,
          Math.abs(moved - BACK) <= 0.05,
        );
      }
      assertTakeClean(label, film);
    } catch (error: unknown) {
      checks.check(`${label} refused: ${String(error)}`, false);
    }
    let refusal: unknown = undefined;
    try {
      perform(holder, hostage, undefined);
    } catch (error: unknown) {
      refusal = error;
    }
    checks.check(
      `${label}: a weapon without its point is refused: ${String(refusal)}`,
      refusal instanceof HumanRefusal && refusal.axis === "point",
    );
  }
  checks.assert("hostage hold");
}

/** A holder with a handgun behind a standing hostage, holding and walking back. */
function perform(
  holder: IAutoMovieMotionHumanBody,
  hostage: IAutoMovieMotionHumanBody,
  point: string | undefined,
): HumanPerformance {
  const back: number = behind(holder, hostage);
  const model: ReturnType<typeof createHandgun> = createHandgun({
    frame: "compact",
  });
  const gun: IAutoMovieMotionHumanProp = HumanObject.prop("gun", model, {
    position: {
      x: -0.2 * holder.measure.stature,
      y: 0.55 * holder.measure.stature,
      z: 0.25 - back,
    },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
  });
  return new HumanPerformance({
    seed: "hostage-hold",
    laws: Object.values(HUMAN_LEXICON).flat(),
    props: [gun],
    performers: [
      {
        subject: "h",
        body: holder,
        at: { x: 0, y: 0, z: -back },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "v",
        body: hostage,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("h")
      .pickUp({ prop: "gun", handle: "grip", hand: "right" })
      .registered(
        "hostageHold",
        {
          partner: "v",
          prop: "gun",
          ...(point === undefined ? {} : { point }),
          region: "templeRight",
          back: BACK,
        },
        "hold",
      )
      .with(
        HumanChain.subject("v")
          .stand({ hold: 2, sway: 0 })
          .registered("heldHostage", { partner: "h" }),
      ).node,
  });
}
