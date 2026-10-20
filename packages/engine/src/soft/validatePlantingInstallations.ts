import {
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieBuiltSurface,
  IAutoMovieFluidDomain,
  IAutoMoviePlantingArrangement,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
  IAutoMoviePlantingIrrigation,
  IAutoMoviePlantingPlacement,
  IAutoMoviePlantingSupport,
  IAutoMovieSoftBounds,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtEnvironmentContainsPoint } from "../architecture/builtEnvironmentContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { ViolationCollector } from "../validation/ViolationCollector";
import { arrangePlantingCluster } from "./arrangePlantingCluster";
import { growPlanting } from "./growPlanting";
import { validatePlantingCluster } from "./validatePlantingCluster";
import { validatePlantingDomain } from "./validatePlantingDomain";

/** Fixed schema kinds reused by installation admission; module-owned set is never mutated by a pass. */
const INSTALLATION_KINDS: Set<string> = new Set([
  "potted",
  "planter",
  "green-wall",
  "aquatic",
  "other",
]);

/** Fixed declared irrigation media; this membership check does not establish a connected water service. */
const IRRIGATION_MEDIA: Set<string> = new Set([
  "potable",
  "reclaimed",
  "rainwater",
  "pond",
]);

/**
 * Join planting recipes, clusters and installation references, then inspect member canopy bounds in authored rooms.
 *
 * @evidence contracts/common.md#principled-implementation Maps resolve environment/domain/cluster/fluid identities; admitted growth supplies the stem-and-leaf envelope, member TRS transforms its eight corners, and room containment checks those corners plus the placement origin. This is not continuous containment proof in nonconvex room unions.
 * @evidence contracts/common.md#clear-and-simple-design Installation owns the architecture/plant join, support/irrigation kind rules and aquatic free-surface check; recipe and cluster owners retain their own admission laws.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Semantic-only rooms skip geometric claims, unresolved refs produce findings, and invalid recipe/cluster admission skips derivation. Support-id existence does not prove physical load-bearing contact; generation or malformed typed containers may still throw.
 * @evidence contracts/common.md#meaningful-documentation Documents reference joining, unique cluster use, geometric versus semantic rooms, per-axis scale and aqueous rooting; exact diagnostic paths are preserved when nested findings are repathed.
 * @evidence contracts/performance.md#efficient-algorithms For D domains, C clusters and I installations, map construction and validation precede per-installation arrangement/growth; repeated recipe/cluster checks and derivations are still paid, and each of P placements makes at most nine room-point queries plus one fluid-cell query.
 * @evidence contracts/performance.md#reuse-equivalent-work Maps share completed identity lookups and each installation derives one canopy for all its members; repeated installation recipe admission is not cached, and changed mutable inputs require a fresh pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local maps, arrangements and canopies leave scope after validation; only returned findings retain offending records/points, with no renderer, fluid solver or background work acquired.
 */
export const validatePlantingInstallations: (props: {
  environment: IAutoMovieBuiltEnvironment;
  installations: IAutoMoviePlantingInstallation[];
  clusters: IAutoMoviePlantingCluster[];
  domains: IAutoMoviePlantingDomain[];
  fluidDomains?: IAutoMovieFluidDomain[] | undefined;
}) => IAutoMovieValidation = (props: {
  environment: IAutoMovieBuiltEnvironment;
  installations: IAutoMoviePlantingInstallation[];
  clusters: IAutoMoviePlantingCluster[];
  domains: IAutoMoviePlantingDomain[];
  /** Fluid domains available for aquatic planting; empty when there are none. */
  fluidDomains?: IAutoMovieFluidDomain[];
}): IAutoMovieValidation => {
  const { environment, installations, clusters, domains }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  const spaces: Map<string, IAutoMovieBuiltSpace> = new Map(
    environment.spaces.map(
      (space: IAutoMovieBuiltSpace): [string, IAutoMovieBuiltSpace] => [
        space.id,
        space,
      ],
    ),
  );
  const elements: Set<string> = new Set(
    environment.elements.map(
      (element: IAutoMovieBuiltElement): string => element.id,
    ),
  );
  const boundaries: Set<string> = new Set(
    environment.boundaries.map(
      (boundary: IAutoMovieBuiltBoundary): string => boundary.id,
    ),
  );
  const surfaces: Set<string> = new Set(
    environment.surfaces.map(
      (surface: IAutoMovieBuiltSurface): string => surface.surface.id,
    ),
  );
  const byCluster: Map<string, IAutoMoviePlantingCluster> = new Map(
    clusters.map(
      (
        cluster: IAutoMoviePlantingCluster,
      ): [string, IAutoMoviePlantingCluster] => [cluster.id, cluster],
    ),
  );
  const byDomain: Map<string, IAutoMoviePlantingDomain> = new Map(
    domains.map(
      (
        domain: IAutoMoviePlantingDomain,
      ): [string, IAutoMoviePlantingDomain] => [domain.id, domain],
    ),
  );
  const byFluid: Map<string, IAutoMovieFluidDomain> = new Map(
    (props.fluidDomains ?? []).map(
      (domain: IAutoMovieFluidDomain): [string, IAutoMovieFluidDomain] => [
        domain.id,
        domain,
      ],
    ),
  );

  const seenDomains: Set<string> = new Set<string>();
  domains.forEach((domain: IAutoMoviePlantingDomain, index: number): void => {
    if (seenDomains.has(domain.id))
      out.push(
        "type",
        `${root}.domains[${index}].id`,
        `planting recipe id "${domain.id}" is duplicated`,
        domain.id,
      );
    seenDomains.add(domain.id);
    repath(
      out,
      `${root}.domains[${index}]`,
      validatePlantingDomain({ domain }),
    );
  });

  const seenClusters: Set<string> = new Set<string>();
  clusters.forEach(
    (cluster: IAutoMoviePlantingCluster, index: number): void => {
      const path: string = `${root}.clusters[${index}]`;
      if (seenClusters.has(cluster.id))
        out.push(
          "type",
          `${path}.id`,
          `planting cluster id "${cluster.id}" is duplicated`,
          cluster.id,
        );
      seenClusters.add(cluster.id);
      repath(out, path, validatePlantingCluster({ cluster }));
      if (!byDomain.has(cluster.domain))
        out.push(
          "type",
          `${path}.domain`,
          `planting recipe "${cluster.domain}" was not supplied with this binding`,
          cluster.domain,
        );
    },
  );

  const seenInstallations: Set<string> = new Set<string>();
  const placedClusters: Map<string, string> = new Map<string, string>();
  installations.forEach(
    (installation: IAutoMoviePlantingInstallation, index: number): void => {
      const path: string = `${root}.installations[${index}]`;
      if (installation.id.trim().length === 0)
        out.push(
          "type",
          `${path}.id`,
          "planting installation id must be non-empty",
          installation.id,
        );
      else if (seenInstallations.has(installation.id))
        out.push(
          "type",
          `${path}.id`,
          `planting installation id "${installation.id}" is duplicated`,
          installation.id,
        );
      seenInstallations.add(installation.id);

      if (!INSTALLATION_KINDS.has(installation.kind))
        out.push(
          "type",
          `${path}.kind`,
          `planting installation kind must be one of ${[...INSTALLATION_KINDS].join(", ")}`,
          installation.kind,
        );
      if (installation.environment !== environment.id)
        out.push(
          "type",
          `${path}.environment`,
          `planting installation must cite its owning built environment "${environment.id}"`,
          installation.environment,
        );

      const space: IAutoMovieBuiltSpace | undefined = spaces.get(
        installation.space,
      );
      if (space === undefined)
        out.push(
          "type",
          `${path}.space`,
          `logical space "${installation.space}" does not resolve in built environment "${environment.id}"`,
          installation.space,
        );

      const support: IAutoMoviePlantingSupport = installation.support;
      if (support.kind === "surface" && !surfaces.has(support.surface))
        out.push(
          "type",
          `${path}.support.surface`,
          `support patch "${support.surface}" does not resolve in built environment "${environment.id}"`,
          support.surface,
        );
      if (support.kind === "element" && !elements.has(support.element))
        out.push(
          "type",
          `${path}.support.element`,
          `support element "${support.element}" does not resolve in built environment "${environment.id}"`,
          support.element,
        );
      if (support.kind === "boundary" && !boundaries.has(support.boundary))
        out.push(
          "type",
          `${path}.support.boundary`,
          `support boundary "${support.boundary}" does not resolve in built environment "${environment.id}"`,
          support.boundary,
        );
      // A green wall is trained against something upright. A floor patch is a
      // support for a pot, never for a wall of planting, and accepting one would
      // let a facade garden be authored lying on the ground.
      if (installation.kind === "green-wall" && support.kind === "surface")
        out.push(
          "type",
          `${path}.support`,
          "a green wall must be trained against a boundary or an element, not carried by a floor patch",
          support.kind,
        );

      const irrigation: IAutoMoviePlantingIrrigation | null =
        installation.irrigation;
      if (irrigation !== null) {
        if (!elements.has(irrigation.port))
          out.push(
            "type",
            `${path}.irrigation.port`,
            `irrigation port "${irrigation.port}" does not resolve in built environment "${environment.id}"`,
            irrigation.port,
          );
        if (
          !Number.isFinite(irrigation.demandLitresPerDay) ||
          irrigation.demandLitresPerDay <= 0
        )
          out.push(
            "range",
            `${path}.irrigation.demandLitresPerDay`,
            "irrigation demand must be finite and strictly positive",
            irrigation.demandLitresPerDay,
          );
        if (!IRRIGATION_MEDIA.has(irrigation.medium))
          out.push(
            "type",
            `${path}.irrigation.medium`,
            `irrigation medium must be one of ${[...IRRIGATION_MEDIA].join(", ")}`,
            irrigation.medium,
          );
      }
      const aquatic: boolean = installation.kind === "aquatic";
      const submerged: string | null =
        irrigation === null ? null : irrigation.fluidDomain;
      if (aquatic && submerged === null)
        out.push(
          "type",
          `${path}.irrigation`,
          "aquatic planting must cite the fluid domain its roots stand in",
          irrigation,
        );
      if (aquatic === false && submerged !== null)
        out.push(
          "type",
          `${path}.irrigation.fluidDomain`,
          "only aquatic planting may cite a fluid domain",
          submerged,
        );
      const water: IAutoMovieFluidDomain | undefined =
        submerged === null ? undefined : byFluid.get(submerged);
      if (submerged !== null && water === undefined)
        out.push(
          "type",
          `${path}.irrigation.fluidDomain`,
          `fluid domain "${submerged}" was not supplied with this binding`,
          submerged,
        );

      // A cluster is a world-space arrangement, so a second installation placing
      // it does not put a second bed anywhere: it draws the same members twice,
      // at the same coordinates, and charges a render budget for both.
      const placedBy: string | undefined = placedClusters.get(
        installation.cluster,
      );
      if (placedBy !== undefined)
        out.push(
          "type",
          `${path}.cluster`,
          `planting cluster "${installation.cluster}" is already placed by installation "${placedBy}"`,
          installation.cluster,
        );
      else placedClusters.set(installation.cluster, installation.id);

      const cluster: IAutoMoviePlantingCluster | undefined = byCluster.get(
        installation.cluster,
      );
      if (cluster === undefined) {
        out.push(
          "type",
          `${path}.cluster`,
          `planting cluster "${installation.cluster}" was not supplied with this binding`,
          installation.cluster,
        );
        return;
      }
      if (validatePlantingCluster({ cluster }).success === false) return;
      const arrangement: IAutoMoviePlantingArrangement =
        arrangePlantingCluster(cluster);
      // The canopy is checked, not only the rooting point. A bed whose members
      // all stand inside the room while their crowns grow through its wall is
      // exactly the collision this binding exists to catch, and testing one point
      // per member would report it clean. The recipe is derived once and its
      // corner box is carried through each member's own transform.
      const recipe: IAutoMoviePlantingDomain | undefined = byDomain.get(
        cluster.domain,
      );
      const canopy: IAutoMovieSoftBounds | null =
        recipe !== undefined &&
        validatePlantingDomain({ domain: recipe }).success === true
          ? (growPlanting(recipe).bounds ?? null)
          : null;
      for (const placement of arrangement.placements) {
        const outside: IAutoMovieVector3 | undefined =
          space !== undefined && builtSpaceStatesVolume(space)
            ? [
                placement.translation,
                ...(canopy === null ? [] : corners(canopy, placement)),
              ].find(
                (point: IAutoMovieVector3): boolean =>
                  builtEnvironmentContainsPoint(
                    environment,
                    installation.space,
                    point,
                  ) === false,
              )
            : undefined;
        if (outside !== undefined) {
          out.push(
            "type",
            `${path}.cluster`,
            `member "${placement.id}" reaches outside space "${installation.space}"`,
            outside,
          );
          break;
        }
        if (water === undefined) continue;
        const level: number | null = freeSurfaceAt(
          water,
          placement.translation,
        );
        if (level === null) {
          out.push(
            "type",
            `${path}.irrigation.fluidDomain`,
            `fluid domain "${water.id}" states no free surface under member "${placement.id}"`,
            placement.translation,
          );
          break;
        }
        if (placement.translation.y > level) {
          out.push(
            "range",
            `${path}.irrigation.fluidDomain`,
            `aquatic member "${placement.id}" is rooted above the free surface of "${water.id}" at ${level}`,
            placement.translation.y,
            placement.translation.y - level,
          );
          break;
        }
      }
    },
  );

  return out.toValidation();
};

/** Re-path one nested validation onto the address the binding knows it by. */
const repath: (
  out: ViolationCollector,
  path: string,
  validation: IAutoMovieValidation,
) => void = (
  out: ViolationCollector,
  path: string,
  validation: IAutoMovieValidation,
): void => {
  if (validation.success === true) return;
  for (const item of validation.violations)
    out.items.push({ ...item, path: item.path.replace("$input", path) });
};

/**
 * The eight corners of one derived canopy, carried into world space by one
 * member's own transform.
 *
 * The recipe's bounds are in the recipe's frame with the trunk's base at the
 * origin, so every corner is rotated by the member's unit quaternion, scaled
 * per axis, and translated. A rotated box therefore widens rather than being
 * silently re-fitted, exactly as a staged prop's clearance volume does.
 */
const corners: (
  bounds: { min: IAutoMovieVector3; max: IAutoMovieVector3 },
  placement: IAutoMoviePlantingPlacement,
) => IAutoMovieVector3[] = (
  bounds: { min: IAutoMovieVector3; max: IAutoMovieVector3 },
  placement: IAutoMoviePlantingPlacement,
): IAutoMovieVector3[] => {
  const {
    x: qx,
    y: qy,
    z: qz,
    w: qw,
  }: typeof placement.rotation = placement.rotation;
  const out: IAutoMovieVector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const sx: number = x * placement.scale.x;
        const sy: number = y * placement.scale.y;
        const sz: number = z * placement.scale.z;
        // q * v * q⁻¹, written as the cross-product form so no matrix has to be
        // built for eight points.
        const tx: number = 2 * (qy * sz - qz * sy);
        const ty: number = 2 * (qz * sx - qx * sz);
        const tz: number = 2 * (qx * sy - qy * sx);
        out.push({
          x: placement.translation.x + sx + qw * tx + qy * tz - qz * ty,
          y: placement.translation.y + sy + qw * ty + qz * tx - qx * tz,
          z: placement.translation.z + sz + qw * tz + qx * ty - qy * tx,
        });
      }
  return out;
};

/**
 * The free-surface elevation of one fluid domain under a world point, or `null`
 * when that domain cannot answer for the point at all.
 *
 * Read from the authored bed and depth rather than from a solve: a binding is a
 * statement about the design, and integrating a pond to decide whether a reed
 * is planted in it would make the answer depend on a shot second nobody named.
 *
 * `null` covers both ways the question can be unanswerable — a point outside
 * the lattice, and a lattice whose bed or depth array does not reach the cell —
 * because a fluid domain arrives here from another binding's validation and
 * this one must not read past the end of an array and compare against `NaN`. A
 * comparison against `NaN` is false, which would make a malformed pond report
 * every reed as properly planted.
 */
const freeSurfaceAt: (
  domain: IAutoMovieFluidDomain,
  point: { x: number; y: number; z: number },
) => number | null = (
  domain: IAutoMovieFluidDomain,
  point: { x: number; y: number; z: number },
): number | null => {
  const column: number = Math.floor(
    (point.x - domain.grid.origin.x) / domain.grid.cellX,
  );
  const row: number = Math.floor(
    (point.z - domain.grid.origin.z) / domain.grid.cellZ,
  );
  if (column < 0 || column >= domain.grid.columns) return null;
  if (row < 0 || row >= domain.grid.rows) return null;
  const cell: number = row * domain.grid.columns + column;
  const level: number =
    domain.grid.origin.y + domain.bed[cell] + domain.depth[cell];
  return Number.isFinite(level) ? level : null;
};
