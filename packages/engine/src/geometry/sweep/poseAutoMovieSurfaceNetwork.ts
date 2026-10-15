import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieResolvedBone } from "../../kinematics/IAutoMovieResolvedBone";
import { Quaternion } from "../../math/Quaternion";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";
import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";
import { createAutoMovieBoneMotion } from "./createAutoMovieBoneMotion";
import { poseAutoMovieSweep } from "./poseAutoMovieSweep";

/**
 * Pose a whole surface network: re-sweep its bound sweeps and carry its free
 * points with their bones, keeping every patch, count and name.
 *
 * Each bound sweep is posed by `poseAutoMovieSweep`. A free node, a curve's
 * through points, direction and normal, and a ring's pinned positions move rigidly
 * with the bone named for them; nodes on a sweep follow that sweep by
 * construction. Anything without a binding keeps its rest position. Because
 * the patch layout is unchanged, sampling the posed network at a tier gives
 * the rest cage's topology, UVs and coordinates with posed positions, which
 * is what a renderer swaps in for the skinned positions.
 *
 * @param props.network The rest network, only read.
 * @param props.bindings Bones by name for its sweeps, free nodes, curves and rings; omitted entries stay at rest.
 * @param props.rest Bones at rest.
 * @param props.posed The same bones posed.
 * @param props.preserveVolume Passed to every sweep's posing; omitted, false.
 * @returns The posed network, a new record.
 * @throws Error when a binding names an unknown sweep, node, curve or ring, or a sweep's posing refuses.
 *
 * @evidence contracts/common.md#principled-implementation Sweep-based deformation applied per sweep, with free curve-network points following their bones rigidly, so the posed network is the same patch layout over moved geometry.
 * @evidence contracts/common.md#clear-and-simple-design Returns an ordinary network, so the sampler, tiers and coordinates serve posed surfaces unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A binding naming nothing in the network is refused rather than ignored.
 * @evidence contracts/common.md#meaningful-documentation States what moves and how, what stays, why topology is kept, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the network's sweeps, nodes, curve points and ring positions, plus each sweep's posing cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call poses one network once; bone rotations are cached by the shared motion lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned network is a new record whose untouched parts are shared with the input.
 */
export const poseAutoMovieSurfaceNetwork: (props: {
  network: IAutoMovieSurfaceNetwork;
  bindings: {
    sweeps?: Record<string, IAutoMovieSweepBinding>;
    nodes?: Record<string, AutoMovieHumanoidBone>;
    curves?: Record<string, AutoMovieHumanoidBone>;
    rings?: Record<string, AutoMovieHumanoidBone>;
  };
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}) => IAutoMovieSurfaceNetwork = (props: {
  network: IAutoMovieSurfaceNetwork;
  bindings: {
    sweeps?: Record<string, IAutoMovieSweepBinding>;
    nodes?: Record<string, AutoMovieHumanoidBone>;
    curves?: Record<string, AutoMovieHumanoidBone>;
    rings?: Record<string, AutoMovieHumanoidBone>;
  };
  rest: readonly IAutoMovieResolvedBone[];
  posed: readonly IAutoMovieResolvedBone[];
  preserveVolume?: boolean;
}): IAutoMovieSurfaceNetwork => {
  const { network, bindings } = props;
  const motion = createAutoMovieBoneMotion({
    rest: props.rest,
    posed: props.posed,
  });
  const known = (
    names: string[],
    record: object | undefined,
    what: string,
  ): void => {
    for (const name of Object.keys(record ?? {}))
      if (!names.includes(name))
        throw new Error(`binding names unknown ${what} ${name}`);
  };
  known(Object.keys(network.sweeps), bindings.sweeps, "sweep");
  known(Object.keys(network.nodes ?? {}), bindings.nodes, "node");
  known(Object.keys(network.curves ?? {}), bindings.curves, "curve");
  known(
    (network.rings ?? []).map(
      (r: IAutoMovieSurfaceNetwork.IRing): string => r.name,
    ),
    bindings.rings,
    "ring",
  );
  const sweeps: Record<string, IAutoMovieSweep> = Object.fromEntries(
    Object.entries(network.sweeps).map(
      ([name, sweep]: [string, IAutoMovieSweep]): [string, IAutoMovieSweep] => {
        const binding: IAutoMovieSweepBinding | undefined =
          bindings.sweeps?.[name];
        return [
          name,
          binding === undefined
            ? sweep
            : poseAutoMovieSweep({
                sweep,
                binding,
                rest: props.rest,
                posed: props.posed,
                preserveVolume: props.preserveVolume,
              }),
        ];
      },
    ),
  );
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> | undefined =
    network.nodes === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(network.nodes).map(
            ([name, n]: [string, IAutoMovieSurfaceNetwork.INode]): [
              string,
              IAutoMovieSurfaceNetwork.INode,
            ] => {
              const bone: AutoMovieHumanoidBone | undefined =
                bindings.nodes?.[name];
              return [
                name,
                n.type === "point" && bone !== undefined
                  ? { ...n, position: motion(bone).apply(n.position) }
                  : n,
              ];
            },
          ),
        );
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> | undefined =
    network.curves === undefined
      ? undefined
      : Object.fromEntries(
          Object.entries(network.curves).map(
            ([name, c]: [string, IAutoMovieSurfaceNetwork.ICurve]): [
              string,
              IAutoMovieSurfaceNetwork.ICurve,
            ] => {
              const bone: AutoMovieHumanoidBone | undefined =
                bindings.curves?.[name];
              if (bone === undefined) return [name, c];
              const m = motion(bone);
              return [
                name,
                {
                  ...c,
                  ...(c.through === undefined
                    ? {}
                    : {
                        through: c.through.map((p: IAutoMovieVector3) =>
                          m.apply(p),
                        ),
                      }),
                  ...(c.direction === undefined
                    ? {}
                    : {
                        direction: Quaternion.rotateVector(
                          m.rotation,
                          c.direction,
                        ),
                      }),
                  ...(c.normal === undefined
                    ? {}
                    : {
                        normal: Quaternion.rotateVector(m.rotation, c.normal),
                      }),
                },
              ];
            },
          ),
        );
  const rings: IAutoMovieSurfaceNetwork.IRing[] | undefined =
    network.rings?.map(
      (
        ring: IAutoMovieSurfaceNetwork.IRing,
      ): IAutoMovieSurfaceNetwork.IRing => {
        const bone: AutoMovieHumanoidBone | undefined =
          bindings.rings?.[ring.name];
        if (bone === undefined || ring.positions === undefined) return ring;
        const m = motion(bone);
        return {
          ...ring,
          positions: ring.positions.map((p: IAutoMovieVector3) => m.apply(p)),
        };
      },
    );
  return {
    ...network,
    sweeps,
    ...(nodes === undefined ? {} : { nodes }),
    ...(curves === undefined ? {} : { curves }),
    ...(rings === undefined ? {} : { rings }),
  };
};
