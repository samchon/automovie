import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanSupport } from "../law/HumanSupport";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";

/** A support key's immutable authored posture and contact order. */
interface IKey {
  /** The key's joint-space posture, world metres and clinical degrees. */
  posture: IAutoMovieMotionHumanPosture;

  /** The existing ordered contacts that choose the interval's first common pin. */
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[];
}

/** One interval's writer and standard scheduling invalidation boundary. */
interface IInterval {
  /** Read the current interior progress with fresh changing contact/floor observations. */
  write(
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture;

  /** Drop target-dependent observations made before the performance settled. */
  settle(): void;
}

/**
 * Prepare one support interval's fixed joint endpoints and first common
 * contact. Its caller retains the exact endpoint branches; interior shares
 * still read the actual interpolated contact and the current floor bound.
 *
 * @param body The unchanged body.
 * @param a The fixed key before the interval.
 * @param b The fixed key after it.
 * @param place The existing entry-time contact lookup, which may observe an unsettled schedule.
 * @returns The interior writer and invalidation of its target observations at plan settlement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed keys/contact order, caller-owned endpoints, current contact/floor readings and standard settlement invalidation of entry-target observations.
 * @evidence contracts/development/implementation.md#principled-implementation Uses supportKey.prepareBlended's original ROM/root interpolation, the same first common contact identity, exact achieved source-key contact point and current achieved contact point, followed by the original floor nonpenetration/rest rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the fixed blend and common pin, lazily measure its source point once, then evaluate the original current-point translation and floor correction per share.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No current fit, joint range, contact residual, source-key point, floor reading, interpolation or endpoint rule is replaced with a sampled pose or declared target.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed endpoint union and the C-by-D ordered common-contact search run once for C/D contacts. A pinned interval prepares its actual contact datum/name demand and measures its fixed source once per schedule generation; first actual floor demand prepares native fixed collider selection once. Every read retains current interpolation, achieved contact solve, placement and exact floor bound.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys/body/profile/contact order stay unchanged. Schedule-dependent target/source observations clear on settle, while fixed collider metadata retain native geometry ownership. Each write borrows or owns one synchronous FK/ROM source across actual source/current points and floor reads; every changing pose resolves normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The interval owns one blend/common contact and at most one fixed collider reader until release, plus at most one schedule-dependent target/source-point record until settle or release. Query FK/ROM loans end with write; no share, interpolated pose, current point, floor result or workspace is retained.
 */
export function prepareSupportInterval(
  body: IAutoMovieMotionHumanBody,
  a: IKey,
  b: IKey,
  place: (contact: IAutoMovieMotionHumanSupport.IContact) => IAutoMovieVector3 | null,
): IInterval {
  const blend: ReturnType<typeof supportKey.prepareBlended> =
    supportKey.prepareBlended(body, a.posture, b.posture);
  const pin: IAutoMovieMotionHumanSupport.IContact | undefined = a.contacts.find(
    (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
      b.contacts.some((q: IAutoMovieMotionHumanSupport.IContact): boolean =>
        supportContact.same(p, q),
      ),
  );
  let fixed:
    | {
        held: IAutoMovieVector3;
        floor: boolean;
        point: ReturnType<typeof supportContact.preparePoints>;
      }
    | undefined;
  let floor: ReturnType<typeof knockdown.prepareRest> | undefined;
  const write: IInterval["write"] = (
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const shaped: IAutoMovieMotionHumanPosture = blend(w);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    const rest: (posture: IAutoMovieMotionHumanPosture) => number = (
      posture: IAutoMovieMotionHumanPosture,
    ): number => {
      floor ??= knockdown.prepareRest(body);
      return floor(posture, read, project);
    };
    if (pin === undefined)
      return {
        ...shaped,
        root: {
          ...shaped.root,
          y: Math.max(shaped.root.y, rest(shaped)),
        },
      };
    if (fixed === undefined) {
      const target: IAutoMovieVector3 | null = place(pin);
      const aimed: IAutoMovieVector3 | null =
        target === null ? null : { ...target };
      const point: ReturnType<typeof supportContact.preparePoints> =
        supportContact.preparePoints(body, [{ contact: pin, at: aimed }]);
      fixed = {
        held: point(a.posture, read, project)[0]!,
        floor: supportContact.onFloorTarget(aimed),
        point,
      };
    }
    const now: IAutoMovieVector3 = fixed.point(shaped, read, project)[0]!;
    const moved: IAutoMovieMotionHumanPosture = {
      ...shaped,
      root: {
        x: shaped.root.x + fixed.held.x - now.x,
        y: shaped.root.y + fixed.held.y - now.y,
        z: shaped.root.z + fixed.held.z - now.z,
      },
    };
    return {
      ...moved,
      root: {
        ...moved.root,
        y: fixed.floor ? rest(moved) : Math.max(moved.root.y, rest(moved)),
      },
    };
  };
  return {
    write,
    settle: (): void => {
      fixed = undefined;
    },
  };
}
