import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";

/** A support key's immutable authored posture and contact order. */
interface IKey {
  /** The key's joint-space posture, world metres and clinical degrees. */
  posture: IHumanPosture;

  /** The existing ordered contacts that choose the interval's first common pin. */
  contacts: readonly HumanSupport.IContact[];
}

/** One interval's writer and standard scheduling invalidation boundary. */
interface IInterval {
  /** Read the current interior progress with fresh changing contact/floor observations. */
  write(
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IHumanPosture;

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
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed endpoint union and the C-by-D ordered common-contact search run once for C/D endpoint contacts. A pinned interval measures its fixed source point once, while each read retains current joint interpolation, one actual current contact solve and one floor reading.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys/contact order stay unchanged. Entry-target/source-point/floor observations are shared only within one schedule generation; settle clears them before the completed performance is queried. Each write borrows or owns one synchronous FK/ROM source across its actual source/current points and floor readings; every changing pose remains resolved normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One interval owns one blend reader/common contact until release and at most one target/source-point record until settle or release. Query FK/ROM loans end with write; no queried share, interpolated pose, current contact point or workspace is retained.
 */
export function prepareSupportInterval(
  body: IHumanBody,
  a: IKey,
  b: IKey,
  place: (contact: HumanSupport.IContact) => IAutoMovieVector3 | null,
): IInterval {
  const blend: ReturnType<typeof supportKey.prepareBlended> =
    supportKey.prepareBlended(body, a.posture, b.posture);
  const pin: HumanSupport.IContact | undefined = a.contacts.find(
    (p: HumanSupport.IContact): boolean =>
      b.contacts.some((q: HumanSupport.IContact): boolean =>
        supportContact.same(p, q),
      ),
  );
  let fixed:
    | {
        aimed: IAutoMovieVector3 | null;
        held: IAutoMovieVector3;
        floor: boolean;
      }
    | undefined;
  const write: IInterval["write"] = (
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IHumanPosture => {
    const shaped: IHumanPosture = blend(w);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    if (pin === undefined)
      return {
        ...shaped,
        root: {
          ...shaped.root,
          y: Math.max(
            shaped.root.y,
            knockdown.rest(body, shaped, read, project),
          ),
        },
      };
    if (fixed === undefined) {
      const target: IAutoMovieVector3 | null = place(pin);
      const aimed: IAutoMovieVector3 | null =
        target === null ? null : { ...target };
      fixed = {
        aimed,
        held: supportContact.point(body, a.posture, pin, aimed, read, project),
        floor: supportContact.onFloorTarget(aimed),
      };
    }
    const now: IAutoMovieVector3 = supportContact.point(
      body,
      shaped,
      pin,
      fixed.aimed,
      read,
      project,
    );
    const moved: IHumanPosture = {
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
        y: fixed.floor
          ? knockdown.rest(body, moved, read, project)
          : Math.max(moved.root.y, knockdown.rest(body, moved, read, project)),
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
