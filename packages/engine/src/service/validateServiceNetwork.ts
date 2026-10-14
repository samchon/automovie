import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieServiceNetwork,
  IAutoMovieServicePenetration,
  IAutoMovieServicePort,
  IAutoMovieServiceSystem,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieWetZone,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { appendServiceNetworkCapacity } from "./appendServiceNetworkCapacity";
import { appendServiceNetworkInterference } from "./appendServiceNetworkInterference";
import { appendServiceNetworkNodes } from "./appendServiceNetworkNodes";
import { appendServiceNetworkSegments } from "./appendServiceNetworkSegments";
import { appendServiceNetworkSystems } from "./appendServiceNetworkSystems";
import { appendServiceSleeveOnFace } from "./appendServiceSleeveOnFace";
import { portRecords } from "./portRecords";

/** Tolerance for a run's end standing on the port it joins, in metres. */
const ENDPOINT_EPSILON: number = 1e-6;

/**
 * Admit a typed distribution network against its served built environment.
 * Vocabulary, references, units, port directions, declared capacity and root
 * reach are checked before conservative run/maintenance interference. Findings
 * retain declaration order and authored values; success is structural admission,
 * not hydraulic pressure, electrical loss or discipline-performance proof.
 *
 * Logical-space containment is sampled at route vertices rather than continuously
 * along each leg. Shared-endpoint run pairs are entirely exempt from clash
 * comparison, so a second overlap along those same runs is currently omitted.
 * Sleeve fit uses the authored boundary face when present; missing geometry is
 * outside that fit check's applicability rather than a reconstructed wall.
 *
 * @evidence contracts/common.md#principled-implementation Structural vocabulary, reference, declared-load and spatial checks accumulate ordered findings against the architecture's own containment and face predicates; typed input, vertex-sampled crossings and conservative shared-node-exempt clash bounds are explicit limits.
 * @evidence contracts/common.md#clear-and-simple-design Production environment validation calls this gate; split system, node, capacity, crossing, sleeve and interference owners preserve diagnostic order while shared collectors own primitive string/vector checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored values are reported without mutation; missing performance solvers are not inferred from structural success, and geometric approximations remain documented rather than treated as exact installation analysis.
 * @evidence contracts/common.md#meaningful-documentation States network/environment relationship, structural versus numerical scope, typed-input premise and the route-vertex/shared-node spatial limitations.
 * @evidence contracts/performance.md#efficient-algorithms Maps index declared ids, but reference scans, per-system reach, route-space containment, run-pair span comparisons and node-run maintenance tests retain their actual product/quadratic worst cases; diagnostics and working tables scale with input populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Space/element/boundary/system/port indexes and first port paths serve all phases once per validation; no prior build's mutable graph verdict is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lookup maps and the collector are call-local; only the validation envelope and its ordered finding values survive, with no host process, solver task or mesh cache retained.
 *
 * @author Samchon
 */
export const validateServiceNetwork: (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
}) => IAutoMovieValidation = (props: {
  network: IAutoMovieServiceNetwork;
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieValidation => {
  const { network, environment }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  out.nonEmpty(`${root}.id`, network.id, "service network id");
  if (network.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `service network schema version must be 1, but was ${network.version}`,
      network.version,
    );
  if (network.units !== "meter")
    out.push(
      "type",
      `${root}.units`,
      `service network units must be "meter", but was ${String(network.units)}`,
      network.units,
    );
  if (network.environment !== environment.id)
    out.push(
      "type",
      `${root}.environment`,
      `service network must cite its served built environment "${environment.id}"`,
      network.environment,
    );

  const spaceIds: Set<string> = new Set(
    environment.spaces.map((space: IAutoMovieBuiltSpace): string => space.id),
  );
  const elementIds: Set<string> = new Set(
    environment.elements.map((item: IAutoMovieBuiltElement): string => item.id),
  );
  const boundaryIds: Set<string> = new Set(
    environment.boundaries.map(
      (boundary: IAutoMovieBuiltBoundary): string => boundary.id,
    ),
  );
  const openings: Map<string, IAutoMovieBuiltOpening> = new Map(
    environment.openings.map(
      (opening: IAutoMovieBuiltOpening): [string, IAutoMovieBuiltOpening] => [
        opening.id,
        opening,
      ],
    ),
  );

  collectIds(network.nodes, `${root}.nodes`, "service node", out);
  collectIds(network.systems, `${root}.systems`, "service system", out);
  collectIds(network.segments, `${root}.segments`, "service segment", out);
  const penetrationIds: Set<string> = collectIds(
    network.penetrations,
    `${root}.penetrations`,
    "service penetration",
    out,
  );
  const systems: Map<string, IAutoMovieServiceSystem> = new Map(
    network.systems.map(
      (
        system: IAutoMovieServiceSystem,
      ): readonly [string, IAutoMovieServiceSystem] =>
        [system.id, system] as const,
    ),
  );
  const ports: Map<string, IAutoMovieServicePort> = portRecords(network);

  appendServiceNetworkSystems(network, root, out, positive);

  const portPaths: Map<string, string> = new Map<string, string>();
  const seenPorts: Set<string> = new Set<string>();
  appendServiceNetworkNodes({
    network,
    environment,
    spaceIds,
    elementIds,
    systems,
    portPaths,
    seenPorts,
    root,
    out,
    positive,
    nonNegative,
  });

  const used: Set<string> = new Set<string>();
  for (const segment of network.segments) {
    used.add(segment.from);
    used.add(segment.to);
  }
  for (const [id, path] of portPaths)
    if (!used.has(id))
      out.push(
        "type",
        path,
        `service port "${id}" is joined to no run; a dangling port is a network that stops here`,
        id,
      );

  const citedPenetrations: Set<string> = appendServiceNetworkSegments({
    network,
    environment,
    systems,
    ports,
    penetrationIds,
    root,
    out,
    positive,
    coincident,
    distance,
  });

  network.penetrations.forEach(
    (sleeve: IAutoMovieServicePenetration, index: number): void => {
      const path: string = `${root}.penetrations[${index}]`;
      if (!boundaryIds.has(sleeve.boundary))
        out.push(
          "type",
          `${path}.boundary`,
          `penetration boundary "${sleeve.boundary}" does not resolve in built environment "${environment.id}"`,
          sleeve.boundary,
        );
      if (sleeve.opening !== null) {
        const opening: IAutoMovieBuiltOpening | undefined = openings.get(
          sleeve.opening,
        );
        if (opening === undefined)
          out.push(
            "type",
            `${path}.opening`,
            `penetration opening "${sleeve.opening}" does not resolve in built environment "${environment.id}"`,
            sleeve.opening,
          );
        else if (opening.boundary !== sleeve.boundary)
          out.push(
            "type",
            `${path}.opening`,
            `penetration opening "${sleeve.opening}" is cut through boundary "${opening.boundary}", not "${sleeve.boundary}"`,
            sleeve.opening,
          );
      }
      out.finiteVector(
        `${path}.position`,
        sleeve.position,
        "penetration position",
      );
      positive(sleeve.radius, `${path}.radius`, "penetration radius", out);
      appendServiceSleeveOnFace(environment, sleeve, path, out);
      if (!citedPenetrations.has(sleeve.id))
        out.warn(
          "coverage",
          path,
          `service penetration "${sleeve.id}" is cited by no run`,
          sleeve.id,
        );
      if (
        sleeve.sealed === false &&
        network.zones.some((zone: IAutoMovieWetZone): boolean =>
          zone.membrane.includes(sleeve.boundary),
        )
      )
        out.push(
          "type",
          `${path}.sealed`,
          `a penetration through waterproofed boundary "${sleeve.boundary}" must be sealed`,
          sleeve.sealed,
        );
    },
  );

  appendServiceNetworkCapacity(network, root, out);

  appendServiceNetworkInterference(network, root, out);

  return out.toValidation();
};

/** Preserve the first id set while collecting every duplicate and blank-id finding in source order. */
const collectIds: <T extends { id: string }>(
  records: readonly T[],
  path: string,
  label: string,
  out: ViolationCollector,
) => Set<string> = <T extends { id: string }>(
  records: readonly T[],
  path: string,
  label: string,
  out: ViolationCollector,
): Set<string> => {
  const ids: Set<string> = new Set<string>();
  records.forEach((record: T, index: number): void => {
    out.nonEmpty(`${path}[${index}].id`, record.id, `${label} id`);
    if (ids.has(record.id))
      out.push(
        "type",
        `${path}[${index}].id`,
        `${label} id "${record.id}" must be unique`,
        record.id,
      );
    ids.add(record.id);
  });
  return ids;
};

/** Compare a route endpoint with its port using the declared micrometre tolerance, retaining the original measured gap in the finding. */
const coincident: (
  point: IAutoMovieVector3,
  target: IAutoMovieVector3,
  path: string,
  portId: string,
  out: ViolationCollector,
) => void = (
  point: IAutoMovieVector3,
  target: IAutoMovieVector3,
  path: string,
  portId: string,
  out: ViolationCollector,
): void => {
  const gap: number = distance(point, target);
  if (gap > ENDPOINT_EPSILON)
    out.push(
      "range",
      path,
      `a run must start and end on the ports it joins, but this end stood ${gap} m from port "${portId}"`,
      point,
      gap,
    );
};

/** Three-dimensional metre distance with hypot's scaled norm; overflowed endpoint subtraction remains nonfinite. */
const distance: (one: IAutoMovieVector3, other: IAutoMovieVector3) => number = (
  one: IAutoMovieVector3,
  other: IAutoMovieVector3,
): number => Math.hypot(other.x - one.x, other.y - one.y, other.z - one.z);

/** Append the service gate's unchanged strict-positive finite scalar diagnostic. */
const positive: (
  value: number,
  path: string,
  label: string,
  out: ViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value <= 0)
    out.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value,
    );
};

/** Append the service gate's unchanged inclusive-zero finite scalar diagnostic. */
const nonNegative: (
  value: number,
  path: string,
  label: string,
  out: ViolationCollector,
) => void = (
  value: number,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < 0)
    out.push(
      "range",
      path,
      `${label} must be a finite number >= 0, but was ${value}`,
      value,
    );
};
