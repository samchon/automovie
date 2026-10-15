import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieServiceNetwork,
  IAutoMovieStageSetPiece,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSubjectContribution } from "../IAutoMovieSubjectContribution";
import { IAutoMovieProfilePoint } from "../geometry/IAutoMovieProfilePoint";
import { meshAutoMovieSweep } from "../geometry/sweep/meshAutoMovieSweep";
import { Vector3 } from "../math/Vector3";
import { validateServiceNetwork } from "./validateServiceNetwork";
import { validateWetZones } from "./validateWetZones";

/** Default number of sides a swept run is drawn with. */
const DEFAULT_SIDES: number = 8;

/**
 * Lower one service network to the models and staged pieces that draw it.
 *
 * A run is authored as a centre line and a radius, which is the description a
 * clash and a sleeve are measured against; drawing it is the deterministic
 * derivation of that description and nothing more. Sweeping a regular polygon
 * section along the authored line with `meshAutoMovieSweep`, one smooth-shaded
 * ring per route point and both ends capped, is therefore the whole of it: no fitting library, no
 * elbow catalogue, no per-discipline appearance. A production that wants a
 * modelled valve body authors that prop and places it on the node, exactly as
 * it would author any other asset.
 *
 * The geometry is baked in world coordinates, matching how a connector's route
 * and a support surface are already authored, so the staged piece carries no
 * rotation and no scale of its own and a run cannot drift from the line the
 * validator measured.
 *
 * Refuses to draw an invalid network. Lowering a graph with a dangling port or
 * a clash would put a picture of a working installation in front of the reason
 * it does not work, which is the one thing this record exists to prevent.
 * No current production consumer calls this lowering; service render tests
 * exercise the emitted contribution. Sides are unbounded apart from integer
 * admission, so caller-selected resolution controls allocation size.
 *
 * @evidence contracts/common.md#principled-implementation Validated centre lines and radii become regular-section sweeps baked into the same world metre frame; zero staged position avoids applying that authored world placement twice.
 * @evidence contracts/common.md#clear-and-simple-design Shared network/wet-zone gates and sweep geometry own admission and tessellation, while this contribution builder currently has no live product consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid service geometry refuses before drawing, and no discipline-specific fitting or appearance is invented to make the installation look complete.
 * @evidence contracts/common.md#meaningful-documentation States world-baked geometry, lack of fitting library, integer resolution/refusals and the missing production consumer with unbounded side-allocation premise.
 * @evidence contracts/performance.md#efficient-algorithms Validation precedes one sweep per run; regular sections cost O(sides) and emitted vertices scale with route length times sides, with underlying network checks retaining their own pairwise costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Both gates run once before the loop, while every run's radius/route needs its own section and sweep; no mutable mesh is cached across networks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh models, set pieces and mesh buffers transfer to the contribution caller; no GPU object, validator collector or source network reference is retained.
 *
 * @author Samchon
 */
export const lowerServiceNetwork: (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
  sides?: number | undefined;
}) => IAutoMovieSubjectContribution = (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
  /** Sides the swept section is drawn with; an integer `>= 3`. Defaults to 8. */
  sides?: number;
}): IAutoMovieSubjectContribution => {
  const { network, environment }: typeof props = props;
  const sides: number = props.sides ?? DEFAULT_SIDES;
  if (!Number.isInteger(sides) || sides < 3)
    throw new Error(
      `a swept service run needs at least 3 sides, but ${sides} was requested`,
    );
  refuse(network, validateServiceNetwork({ network, environment }));
  refuse(network, validateWetZones({ network, environment }));

  const models: IAutoMovieModel[] = [];
  const set: IAutoMovieStageSetPiece[] = [];
  for (const segment of network.segments) {
    const id: string = `${network.id}/${segment.id}`;
    models.push({
      id,
      name: `service run ${segment.id}`,
      origin: "generated",
      skeleton: null,
      body: null,
      asset: null,
      materials: [],
      parts: [
        {
          id: "run",
          name: null,
          geometry: {
            type: "mesh",
            mesh: meshAutoMovieSweep({
              sweep: {
                spine: { points: segment.route, normal: across(segment.route) },
                stations: [
                  {
                    at: 0,
                    section: {
                      type: "polygon",
                      points: section(segment.radius, sides),
                    },
                  },
                ],
                correspondence: "parameter",
              },
              shading: "smooth",
            }),
          },
          material: null,
          attachedBone: null,
          transform: null,
        },
      ],
    });
    // The swept mesh is already world-space, so the piece states no rotation
    // and no scale at all: an identity written out is a transform a later
    // consumer could compose against, and there is nothing here to compose.
    set.push({ node: id, model: id, position: { x: 0, y: 0, z: 0 } });
  }
  return { models, set };
};

/** A direction across a route's first leg for the section plane's first axis: the leg crossed with `+Y`, or with `+X` when the leg is nearly vertical. */
const across: (route: readonly IAutoMovieVector3[]) => IAutoMovieVector3 = (
  route: readonly IAutoMovieVector3[],
): IAutoMovieVector3 => {
  const leg: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(route[1]!, route[0]!),
  );
  return Vector3.cross(
    Math.abs(leg.y) < 0.9 ? Vector3.create(0, 1, 0) : Vector3.create(1, 0, 0),
    leg,
  );
};

/** A regular section of the given radius, in the sweep's own profile plane. */
const section: (radius: number, sides: number) => IAutoMovieProfilePoint[] = (
  radius: number,
  sides: number,
): IAutoMovieProfilePoint[] =>
  Array.from(
    { length: sides },
    (_unused: unknown, index: number): { x: number; y: number } => {
      const angle: number = (2 * Math.PI * index) / sides;
      return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
    },
  );

const refuse: (
  network: IAutoMovieServiceNetwork,
  validation: IAutoMovieValidation,
) => void = (
  network: IAutoMovieServiceNetwork,
  validation: IAutoMovieValidation,
): void => {
  if (validation.success === true) return;
  const first: IAutoMovieConstraintViolation = validation.violations[0]!;
  throw new Error(
    `service network "${network.id}" is invalid at ${first.path}: ${first.expected}`,
  );
};
