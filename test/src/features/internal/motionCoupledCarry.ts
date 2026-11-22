import { Vector3, resolveAutoMovieCenterOfMass } from "@automovie/engine";
import type {
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanCarryPerson,
  HumanCarriedCoupling,
  HumanCarriedCouplingLoad,
  HumanCarriedLean,
  HumanChain,
  HumanPerformance,
  HumanPhysics,
  HumanSignature,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { profileHumanMotion } from "./profileHumanMotion";

/** The caller's coupling or the one obtained while timing the plan. */
type PendingCoupling = IAutoMovieMotionCoupling | undefined;

/**
 * Stages a coupled carry over a stand or a walk and lends a matching
 * coupling to both trials. Uses the test's own body pair, contact schedule,
 * lean and optional load or transitions.
 *
 * @param names The bearer and borne fixture bodies.
 * @param carry The named carry being performed.
 * @param walking Whether the bearer walks or stands for the hold.
 * @param extra Additional mass or explicit lift and set-down times.
 * @param known The same pair and carry's coupling, when already resolved.
 * @returns The displayed film, its bodies and the coupling under test.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains the inputs, the two carrier branches and which coupling can be reused.
 * @evidence contracts/development/implementation.md#principled-implementation Stages the actual registered actions with a scheduled lean then reads the resulting performance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body pair and one film construction per variant.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The supplied coupling is independently established by the same pair, load and carry. The actual registered action plans normally.
 * @evidence contracts/development/implementation.md#efficient-algorithms Optional profiling returns the ordinary test performance. Default execution adds no display samples.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The two carrier actions consume the same unchanged coupling for their scheduled lean.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No film or coupling is held outside the calling test.
 */
export function motionCoupledCarry(
  names: motionCoupledCarry.Pair,
  carry: IAutoMovieMotionHumanCarried.Carry,
  walking: boolean,
  extra: motionCoupledCarry.IExtra = {},
  known?: IAutoMovieMotionCoupling,
): motionCoupledCarry.IScene {
  const bodies: Record<motionCoupledCarry.Subject, IAutoMovieMotionHumanBody> =
    {
      a: motionHumanBody(names[0]),
      b: motionHumanBody(names[1]),
    };
  const own: IAutoMovieMotionHumanChain = HumanChain.subject("a").stand({
    hold: 0.3,
  });
  const moved: IAutoMovieMotionHumanChain = walking
    ? own.walk({ to: { x: 0, y: 0, z: 2 } })
    : own.stand({ hold: 2 });
  let coupling: PendingCoupling = known;
  const film: IAutoMovieMotionHumanPerformance = profileHumanMotion(
    `${walking ? "coupled-walk" : "coupled-stand"}/${carry}/${names[0]}/${names[1]}`,
    (): IAutoMovieMotionHumanPerformance => {
      coupling ??= HumanCarriedCoupling.couple(
        bodies.a,
        bodies.b,
        AutoMovieMotionHumanCarryPerson.carryPerson.CARRIES[carry],
        carry,
        extra.mass ?? 0,
      );
      return new HumanPerformance({
        seed: "coupled",
        laws: [
          AutoMovieMotionHumanCarryPerson.carryPerson.borne,
          AutoMovieMotionHumanCarryPerson.carryPerson.bearing,
        ],
        performers: (["a", "b"] as const).map(
          (
            subject: motionCoupledCarry.Subject,
          ): motionCoupledCarry.Performer => ({
            subject,
            body: bodies[subject],
            at: { x: 0, y: 0, z: subject === "a" ? 0 : -0.3 },
            yaw: 0,
            proficiency: { level: "trained" },
          }),
        ),
        composition: moved
          .over(
            (overlay: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              overlay.registered("bearing", {
                carry,
                seconds: 2,
                of: "b",
                ...(extra.mass === undefined ? {} : { mass: extra.mass }),
              }),
          )
          .with(
            HumanChain.subject("b")
              .stand({ hold: 0.3 })
              .registered("borne", { by: "a", carry, seconds: 2, ...extra }),
          ).node,

        // Schedule the pair's lean over the bearer's own trunk action.
        layers: {
          a: [
            {
              layer: HumanCarriedLean.coupled(
                HumanCarriedCouplingLoad.lean(bodies.a, coupling),
              ),
              from: 0.3,
              fade: AutoMovieMotionHumanCarryPerson.carryPerson.TAKE,
            },
          ],
        },
      });
    },
    ["b", "a"],
    "borne",
  );
  return { bodies, film, coupling: coupling! };
}

/** The staging and measurements used by the coupled carry test. */
export namespace motionCoupledCarry {
  /** Body fixtures used by the paired comparisons. */
  export type Name = "m-large" | "f-small" | "m-average";

  /** The bearer fixture followed by the borne fixture. */
  export type Pair = readonly [Name, Name];

  /** The bearer `a` or the borne person `b`. */
  export type Subject = "a" | "b";

  /** The performer record consumed by the performance. */
  export type Performer =
    IAutoMovieMotionHumanPerformance.IInput["performers"][number];

  /** Additional carry load in kg and transition durations in seconds. */
  export interface IExtra {
    /** Mass added to the borne body. */
    mass?: number;
    /** Time spent lifting into the carry. */
    lift?: number;
    /** Time spent setting the borne body down. */
    setDown?: number;
  }

  /** The real film and the fixed data it represents. */
  export interface IScene {
    /** Displayed poses and placed actions. */
    film: IAutoMovieMotionHumanPerformance;
    /** The bodies by their actual performer ids. */
    bodies: Record<Subject, IAutoMovieMotionHumanBody>;
    /** The fixed pair's chosen contact and load record. */
    coupling: IAutoMovieMotionCoupling;
  }

  /** Request balance judgement on the test's displayed support span. */
  export function balanceAudit(
    film: IAutoMovieMotionHumanPerformance,
  ): HumanPhysics.ISpan {
    const span: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
    return {
      name: span.name,
      start: span.start,
      entryTime: span.entryTime,
      end: span.end,
      plan: span.plan,
      physical: true,
    };
  }

  /** The mass-weighted centre in world metres of both displayed bodies. */
  export function centre(
    a: IAutoMovieMotionHumanSignature.IReader,
    b: IAutoMovieMotionHumanSignature.IReader,
    seconds: number,
  ): IAutoMovieVector3 {
    const ca: ReturnType<typeof resolveAutoMovieCenterOfMass> =
      a.body.massModel;
    const cb: ReturnType<typeof resolveAutoMovieCenterOfMass> =
      b.body.massModel;
    return Vector3.scale(
      Vector3.add(
        Vector3.scale(
          resolveAutoMovieCenterOfMass.place(
            ca,
            HumanSignature.bones(a, seconds),
          ),
          ca.mass,
        ),
        Vector3.scale(
          resolveAutoMovieCenterOfMass.place(
            cb,
            HumanSignature.bones(b, seconds),
          ),
          cb.mass,
        ),
      ),
      1 / (ca.mass + cb.mass),
    );
  }
}
