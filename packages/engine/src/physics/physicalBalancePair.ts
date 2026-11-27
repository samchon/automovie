import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalSupportPatch,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/internal/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { physicalBalanceAssessment as Assessment } from "./physicalBalanceAssessment";

/**
 * A diagonal pair's step (`AutoMoviePhysicalBalance.assess`): both feet moved
 * by one displacement while the other diagonal holds the centre of pressure on
 * its hull (Chen et al. 2022, Section 2.1, Example 1; MIT Cheetah-Software,
 * trotting): its place and time are chosen together as a single step's are, the
 * lead's middle on the capture point at landing within reach, else the shortest
 * displacement toward it that captures, and it captures when the capture point
 * then lies inside the new support.
 */
export namespace physicalBalancePair {
  /** A pair's planned displacement, its swing and whether it captures. */
  export interface IPair {
    /** The displacement both feet take. */
    travel: IAutoMovieVector3;

    /** Its length, metres. */
    distance: number;

    /** The swing's duration, seconds. */
    seconds: number;

    /** Whether the capture point lands inside the new support. */
    viable: boolean;

    /** How far past the new support it lands, metres. */
    violation: number;
  }

  /** Plan a pair's displacement. */
  export function pair(
    scope: Assessment.IAssessment,
    lead: IAutoMoviePhysicalSupportPatch,
    partner: IAutoMoviePhysicalSupportPatch,
  ): IPair {
    const { input, capturePoint, omega }: Assessment.IAssessment = scope;
    const held = (outline: IAutoMovieVector3[]): IAutoMovieVector3[] =>
      AutoMoviePhysicalBalance.held(scope, outline);
    const swing = (distance: number): number =>
      AutoMoviePhysicalBalance.swing(scope, distance);
    const until = (distance: number): number =>
      AutoMoviePhysicalBalance.until(scope, distance);
    const {
      PASSES,
      SETTLED,
    }: Pick<typeof Assessment, "PASSES" | "SETTLED"> = Assessment;
    const excess = AutoMoviePhysicalBalance.excess;
    const rest: IAutoMovieVector3[] = input.supports
      .filter(
        (other: (typeof input.supports)[number]): boolean =>
          other !== lead && other !== partner,
      )
      .flatMap(
        (other: (typeof input.supports)[number]): IAutoMovieVector3[] =>
          other.points,
      );
    const holding: IAutoMovieVector3[] = held(convexHull2D(rest));
    const moved = (
      support: IAutoMoviePhysicalSupportPatch,
      d: IAutoMovieVector3,
    ): IAutoMovieVector3[] =>
      support.points.map(
        (p: IAutoMovieVector3): IAutoMovieVector3 => ({
          x: p.x + d.x,
          y: p.y,
          z: p.z + d.z,
        }),
      );
    const after = (d: IAutoMovieVector3): IAutoMovieVector3[] =>
      held(convexHull2D([...rest, ...moved(lead, d), ...moved(partner, d)]));
    const still: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const place = (xi: IAutoMovieVector3): IAutoMovieVector3 => {
      if (excess(after(still), xi) <= 0) return still;
      const aim: IAutoMovieVector3 = {
        x: xi.x - lead.position.x,
        y: 0,
        z: xi.z - lead.position.z,
      };
      const gap: number = Math.hypot(aim.x, aim.z);
      if (gap <= input.maximumStep && excess(after(aim), xi) <= 0) return aim;
      const toward: IAutoMovieVector3 =
        gap > 0
          ? { x: aim.x / gap, y: 0, z: aim.z / gap }
          : { x: 0, y: 0, z: 1 };
      const step = (d: number): IAutoMovieVector3 => Vector3.scale(toward, d);
      let near: number = 0;
      let far: number = input.maximumStep;
      if (excess(after(step(far)), xi) > 0) return step(far);
      while (far - near > SETTLED) {
        const middle: number = (near + far) / 2;
        if (excess(after(step(middle)), xi) <= 0) far = middle;
        else near = middle;
      }
      return step(far);
    };
    let distance: number = Math.min(
      input.maximumStep,
      Math.hypot(
        capturePoint.x - lead.position.x,
        capturePoint.z - lead.position.z,
      ),
    );
    let travel: IAutoMovieVector3 = still;
    let landing: IAutoMovieVector3 = { ...capturePoint };
    for (let pass: number = 0; pass < PASSES; pass++) {
      const before: IAutoMovieVector3 = travel;
      landing = AutoMoviePhysicalBalance.diverge(
        capturePoint,
        holding,
        omega * until(distance),
      );
      travel = place(landing);
      distance = Math.hypot(travel.x, travel.z);
      if (Math.hypot(travel.x - before.x, travel.z - before.z) <= SETTLED)
        break;
    }
    const violation: number = excess(after(travel), landing);
    return {
      travel,
      distance,
      seconds: swing(distance),
      viable: violation <= SETTLED,
      violation,
    };
  }

  /** The recovery a planned pair asks for. */
  export function paired(
    scope: Assessment.IAssessment,
    lead: IAutoMoviePhysicalSupportPatch,
    partner: IAutoMoviePhysicalSupportPatch,
    planned: IPair,
  ): IAutoMoviePhysicalBalance.IResult {
    const { input, result, timing }: Assessment.IAssessment = scope;
    return {
      ...result,
      state: "recovery",
      step: {
        bone: lead.bone,
        target: {
          x: lead.position.x + planned.travel.x,
          y: input.floor,
          z: lead.position.z + planned.travel.z,
        },
        ...(timing
          ? {
              seconds: planned.seconds,
              viable: planned.viable,
              violation: planned.violation,
            }
          : {}),
        pair: {
          bone: partner.bone,
          target: {
            x: partner.position.x + planned.travel.x,
            y: input.floor,
            z: partner.position.z + planned.travel.z,
          },
        },
      },
    };
  }
}
