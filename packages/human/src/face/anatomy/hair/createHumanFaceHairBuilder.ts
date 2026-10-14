import {
  Vector3,
  createAutoMovieMeshRayCaster,
  createAutoMovieMeshSeparationQuery,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type {
  IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface,
  IAutoMovieHumanFaceHairCurve as ImportedIAutoMovieHumanFaceHairCurve,
  IAutoMovieHumanFaceHairDomain as ImportedIAutoMovieHumanFaceHairDomain,
  IAutoMovieHumanFaceHairRootedTransition as ImportedIAutoMovieHumanFaceHairRootedTransition,
  IHumanFaceHairContactSurface as ImportedIHumanFaceHairContactSurface,
  IHumanFaceHairGatherAnchor as ImportedIHumanFaceHairGatherAnchor,
} from "@automovie/human";
import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieVector3 as ImportedIAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IHumanFaceHairLayerGuides as ImportedIHumanFaceHairLayerGuides } from "../../structures/IHumanFaceHairLayerGuides";
import type { IHumanFaceHairContact as ImportedIHumanFaceHairContact } from "./IHumanFaceHairContact";
import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";
import type { IHumanFaceHairContactLayout } from "./IHumanFaceHairContactLayout";
import type { IHumanFaceHairHostQueries } from "./IHumanFaceHairHostQueries";
import type { IHumanFaceHairRootPopulation as ImportedIHumanFaceHairRootPopulation } from "./IHumanFaceHairRootPopulation";
import type { IHumanFaceHairRootSeat as ImportedIHumanFaceHairRootSeat } from "./IHumanFaceHairRootSeat";
import type { IHumanFaceHairSampledRoot as ImportedIHumanFaceHairSampledRoot } from "./IHumanFaceHairSampledRoot";
import type { IHumanFaceHairSourceSurface } from "./IHumanFaceHairSourceSurface";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { buildHumanFaceHairMesh } from "./buildHumanFaceHairMesh";
import { closeHumanFaceHairContact } from "./closeHumanFaceHairContact";
import { createHumanFaceHairGatherField } from "./createHumanFaceHairGatherField";
import { createHumanFaceHairRootBoundary } from "./createHumanFaceHairRootBoundary";
import { createHumanFaceHairRoots } from "./createHumanFaceHairRoots";
import { createPortraitHairMaterial } from "./createPortraitHairMaterial";
import { growHumanFaceHairStrand } from "./growHumanFaceHairStrand";
import { humanFaceHairClosureLoops } from "./humanFaceHairClosureLoops";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairDensity } from "./humanFaceHairDensity";
import { humanFaceHairSequence } from "./humanFaceHairSequence";
import { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";
import { interpolateHumanFaceHairStrands } from "./interpolateHumanFaceHairStrands";
import { measureHumanFaceHairDomainArea } from "./measureHumanFaceHairDomainArea";
import { resolveHumanFaceHairGatherAnchor } from "./resolveHumanFaceHairGatherAnchor";
import { seatHumanFaceHairRoots } from "./seatHumanFaceHairRoots";

/**
 * Compile shared growth correspondence, then generate numerical hair on a face. The connected basis builder supplies admitted neutral topology once and its current complete surface positions on each edit, before UV/material splitting. Root sampling and field coordinates belong to the neutral; barycentric roots and closed contact queries belong to the current shape/performance. Domain and closure metadata are shared, and every personal difference is in the layer. No person name selects a generator, guide array, mesh cache or bitmap.
 *
 * Compilation owns the source arrays. Evaluation admits all layers first, then resolves domains even for empty populations. Nonempty layers integrate metric curves, mesh those same stations and generate one numerical fibre finish. The caller composes these owned parts/materials and checks resident identity collisions. Closed queries verify topology; embeddedness/outward orientation remain the shared source and deformation's premises, not automatic anatomy.
 *
 * Ribbon width is a nominal coverage proxy from current seated-root neighbourhoods (`humanFaceHairDensity`). Small populations instead use current domain area times the sampler's neutral acceptance share; that approximation does not integrate the accepted patch's local deformation or prove seamless scalp coverage. Physical terminal shafts retain their authored diameter instead. The optional synchronous observer receives completed guide, interpolation, grown-strand, ribbon-buffer and whole-layer boundaries. It receives only the owner name; observer errors propagate and can stop construction. These notifications certify neither elapsed-time health nor visible appearance.
 *
 * @evidence contracts/common.md#principled-implementation Neutral domain sampling and current barycentric seating share registered topology before contact-query and curve/mesh construction.
 * @evidence contracts/common.md#clear-and-simple-design One compiler separates stable neutral correspondence from per-evaluation current collider, locks and material output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing domains, empty guide selections or construction-budget exhaustion refuse; closure embeddedness remains an admitted source premise.
 * @evidence contracts/common.md#meaningful-documentation Progress reports completed owner boundaries, not elapsed-time health or render quality; all geometry remains head-frame metres.
 * @evidence contracts/performance.md#efficient-algorithms Compile cost follows source topology; evaluation follows sampled roots, integrated stations, density work and budgeted queries.
 * @evidence contracts/performance.md#reuse-equivalent-work Domain samplers persist in the builder and each current surface shares one collider across its evaluated layers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Compilation owns cloned required source fields; current queries and lock state are evaluation-local, while returned parts/materials/layouts are caller-owned.
 */
export function createHumanFaceHairBuilder(
  input: IAutoMovieHumanFaceBasis,
): (
  hair: IAutoMovieHumanFaceHair,
  positions: ReadonlyMap<string, readonly number[]>,
  progress?: (owner: string) => void,
) => {
  parts: IAutoMovieModelPart[];
  materials: IAutoMovieMaterial[];
  contactLayouts: Map<string, IHumanFaceHairContactLayout>;
  stationCount: number;
} {
  const sources: Map<
    string,
    {
      readonly surface: IHumanFaceHairSourceSurface;
      readonly domains: Map<
        string,
        {
          readonly origin: ImportedIAutoMovieVector3;
          readonly triangles: number[];
          readonly sample: (
            layer: Pick<
              IAutoMovieHumanFaceHair.Layer,
              "count" | "seed" | "hairline" | "rootRegion"
            >,
          ) => ImportedIHumanFaceHairRootPopulation;
        }
      >;
      readonly close: (
        current: readonly number[],
      ) => ImportedIHumanFaceHairContactSurface;
    }
  > = new Map(
    input.surfaces.map(
      (
        original: ImportedIAutoMovieHumanFaceBasisSurface,
      ): readonly [
        string,
        {
          readonly surface: IHumanFaceHairSourceSurface;
          readonly domains: Map<
            string,
            {
              readonly origin: ImportedIAutoMovieVector3;
              readonly triangles: number[];
              readonly sample: (
                layer: Pick<
                  IAutoMovieHumanFaceHair.Layer,
                  "count" | "seed" | "hairline" | "rootRegion"
                >,
              ) => ImportedIHumanFaceHairRootPopulation;
            }
          >;
          readonly close: (
            current: readonly number[],
          ) => ImportedIHumanFaceHairContactSurface;
        },
      ] => {
        const surface: IHumanFaceHairSourceSurface = structuredClone({
          id: original.id,
          positions: original.positions,
          indices: original.indices,
          hairDomains: original.hairDomains,
          hairContactClosure: original.hairContactClosure,
        });
        const ids: Set<string> = new Set<string>();
        const domains: Map<
          string,
          {
            readonly origin: ImportedIAutoMovieVector3;
            readonly triangles: number[];
            readonly sample: (
              layer: Pick<
                IAutoMovieHumanFaceHair.Layer,
                "count" | "seed" | "hairline" | "rootRegion"
              >,
            ) => ImportedIHumanFaceHairRootPopulation;
          }
        > = new Map(
          (surface.hairDomains ?? []).map(
            (
              domain: ImportedIAutoMovieHumanFaceHairDomain,
            ): readonly [
              string,
              {
                readonly origin: ImportedIAutoMovieVector3;
                readonly triangles: number[];
                readonly sample: (
                  layer: Pick<
                    IAutoMovieHumanFaceHair.Layer,
                    "count" | "seed" | "hairline" | "rootRegion"
                  >,
                ) => ImportedIHumanFaceHairRootPopulation;
              },
            ] => {
              if (
                domain.id.trim() === "" ||
                ids.has(domain.id) ||
                !domain.origin.every(Number.isFinite) ||
                domain.triangles.length === 0 ||
                domain.triangles.some(
                  (triangle: number, at: number): boolean =>
                    !Number.isInteger(triangle) ||
                    triangle < 0 ||
                    triangle >= surface.indices.length / 3 ||
                    (at > 0 && triangle <= domain.triangles[at - 1]),
                )
              )
                throw new Error(
                  "Shared hair domains need distinct identities, finite origins and ordered resident triangles.",
                );
              ids.add(domain.id);
              return [
                domain.id,
                {
                  origin: Vector3.create(...domain.origin),
                  triangles: domain.triangles,
                  sample: createHumanFaceHairRoots({
                    positions: surface.positions,
                    indices: surface.indices,
                    ...domain,
                  }),
                },
              ] as const;
            },
          ),
        );
        const closure: readonly number[] = surface.hairContactClosure ?? [];
        if (
          closure.length % 3 !== 0 ||
          closure.some(
            (id: number): boolean =>
              !Number.isInteger(id) ||
              id < 0 ||
              id >= surface.positions.length / 3,
          )
        )
          throw new Error(
            "Shared hair contact closure needs complete resident triangles.",
          );
        // The closure names the opening it closes; its own triangles are laid
        // over the neutral ring, and a shape that bends that ring out of its
        // plane can fold them inside out, which turns empty space far below the
        // head into "inside". So the cap is rebuilt on every evaluation as a fan
        // from the current ring's centroid (`closeHumanFaceHairContact`),
        // keeping the authored edge orientation, which stays embedded while the
        // ring stays star-shaped about its centre.
        const loops: [number, number][][] = humanFaceHairClosureLoops(closure);
        const close: (
          current: readonly number[],
        ) => ImportedIHumanFaceHairContactSurface = (
          current: readonly number[],
        ): ImportedIHumanFaceHairContactSurface =>
          closeHumanFaceHairContact(current, surface.indices, loops);
        if (domains.size > 0) {
          const closed: ImportedIHumanFaceHairContactSurface = close(
            surface.positions,
          );
          createAutoMovieSignedMeshQuery({
            positions: closed.positions,
            indices: closed.indices,
            normals: null,
            uvs: null,
            skin: null,
          });
        }
        return [surface.id, { surface, domains, close }] as const;
      },
    ),
  );
  return (
    hair: IAutoMovieHumanFaceHair,
    positions: ReadonlyMap<string, readonly number[]>,
    progress?: (owner: string) => void,
  ): {
    parts: IAutoMovieModelPart[];
    materials: IAutoMovieMaterial[];
    contactLayouts: Map<string, IHumanFaceHairContactLayout>;
    stationCount: number;
  } => {
    assertHumanFaceHair(hair);
    const parts: IAutoMovieModelPart[] = [],
      materials: IAutoMovieMaterial[] = [];
    const contactLayouts: Map<string, IHumanFaceHairContactLayout> = new Map<
      string,
      IHumanFaceHairContactLayout
    >();
    const queries: Map<string, IHumanFaceHairHostQueries> = new Map<
      string,
      IHumanFaceHairHostQueries
    >();
    let stations: number = 0;
    const spend: (count: number) => void = (count: number): void => {
      stations += count;
      if (stations > 1_000_000)
        throw new Error(
          "Numerical hair exceeds its million-station assembled budget.",
        );
    };
    for (const layer of hair.layers) {
      const source:
        | {
            readonly surface: IHumanFaceHairSourceSurface;
            readonly domains: Map<
              string,
              {
                readonly origin: ImportedIAutoMovieVector3;
                readonly triangles: number[];
                readonly sample: (
                  layer: Pick<
                    IAutoMovieHumanFaceHair.Layer,
                    "count" | "seed" | "hairline" | "rootRegion"
                  >,
                ) => ImportedIHumanFaceHairRootPopulation;
              }
            >;
            readonly close: (
              current: readonly number[],
            ) => ImportedIHumanFaceHairContactSurface;
          }
        | undefined = sources.get(layer.surface);
      const domain:
        | {
            readonly origin: ImportedIAutoMovieVector3;
            readonly triangles: number[];
            readonly sample: (
              layer: Pick<
                IAutoMovieHumanFaceHair.Layer,
                "count" | "seed" | "hairline" | "rootRegion"
              >,
            ) => ImportedIHumanFaceHairRootPopulation;
          }
        | undefined = source?.domains.get(layer.domain);
      const current: readonly number[] | undefined = positions.get(
        layer.surface,
      );
      if (
        source === undefined ||
        domain === undefined ||
        current === undefined ||
        current.length !== source.surface.positions.length
      )
        throw new Error(
          "Numerical hair requires its declared resident surface and growth domain.",
        );
      const { roots, share }: ImportedIHumanFaceHairRootPopulation =
        domain.sample(layer);
      if (roots.length === 0) continue;
      // The share is of the neutral domain the sampler measured; the area a
      // population grows on is that share of the same triangles as they stand
      // on this face, so a larger head grows on more of it.
      const area: number = measureHumanFaceHairDomainArea({
        share,
        triangles: domain.triangles,
        indices: source.surface.indices,
        current,
      });
      let collider: IHumanFaceHairHostQueries | undefined = queries.get(
        layer.surface,
      );
      if (collider === undefined) {
        const closed: ImportedIHumanFaceHairContactSurface =
          source.close(current);
        const mesh: {
          positions: number[];
          indices: number[];
          normals: null;
          uvs: null;
          skin: null;
        } = {
          positions: closed.positions,
          indices: closed.indices,
          normals: null,
          uvs: null,
          skin: null,
        };
        collider = {
          query: createAutoMovieSignedMeshQuery(mesh),
          raycaster: createAutoMovieMeshRayCaster(mesh),
          separation: {
            source: createAutoMovieMeshSeparationQuery(mesh),
            represented: createAutoMovieMeshSeparationQuery(mesh, "float32"),
          },
          boundary: createHumanFaceHairRootBoundary(closed),
        };
        queries.set(layer.surface, collider);
      }
      const {
        query,
        raycaster,
        boundary,
        separation,
      }: IHumanFaceHairHostQueries = collider;
      const gatherAnchor: ImportedIHumanFaceHairGatherAnchor | undefined =
        layer.gather === undefined
          ? undefined
          : resolveHumanFaceHairGatherAnchor({
              origin: domain.origin,
              positions: source.surface.positions,
              current,
              indices: source.surface.indices,
              triangles: domain.triangles,
              polar: layer.gather.anchor.polar,
              azimuth: layer.gather.anchor.azimuth,
            });
      const gatherDirection:
        | ((point: ImportedIAutoMovieVector3) => ImportedIAutoMovieVector3)
        | undefined =
        gatherAnchor === undefined
          ? undefined
          : createHumanFaceHairGatherField({
              positions: current,
              indices: source.surface.indices,
              triangles: domain.triangles,
              anchor: gatherAnchor,
            });
      const guided: ImportedIHumanFaceHairLayerGuides | undefined =
        layer.guides;
      const isGuide: (sequence: number) => boolean = (
        sequence: number,
      ): boolean =>
        guided === undefined ||
        humanFaceHairSequence(sequence, 17) < guided.fraction;
      const seats: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>[] =
        seatHumanFaceHairRoots({
          roots,
          indices: source.surface.indices,
          current,
        });
      const budgets: { remaining: number }[] = seats.map(
        (): { remaining: number } => ({ remaining: 1_000_000 }),
      );
      const integrated: Map<number, ImportedIAutoMovieHumanFaceHairCurve> =
        new Map<number, ReturnType<typeof integrateHumanFaceHairCurve>>();
      seats.forEach(
        (
          {
            root,
            seated,
            normal,
          }: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>,
          at: number,
        ): void => {
          if (!isGuide(root.sequence)) return;
          const curve: ImportedIAutoMovieHumanFaceHairCurve =
            integrateHumanFaceHairCurve({
              layer,
              origin: domain.origin,
              reference: root.point,
              root: seated,
              normal,
              sequence: root.sequence,
              query,
              raycaster,
              budget: budgets[at],
              rootBoundary: {
                triangles: boundary.resolve(root),
                distance: boundary.distance,
              },
              gatherAnchor: gatherAnchor?.point,
              gatherDirection,
            });
          spend(curve.points.length);
          integrated.set(at, curve);
          progress?.("hair:" + layer.id + ":guide:" + root.sequence);
        },
      );
      if (integrated.size === 0)
        throw new Error(
          "A guided hair layer selected no guide among its roots; raise the guide fraction or the count.",
        );
      const strandIndices: number[] = seats
        .map(
          (
            _: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>,
            at: number,
          ): number => at,
        )
        .filter((at: number): boolean => !integrated.has(at));
      const strands: {
        points: ImportedIAutoMovieVector3[];
        length: number;
        normal: ImportedIAutoMovieVector3;
      }[] = interpolateHumanFaceHairStrands({
        layer,
        origin: domain.origin,
        guides: [...integrated].map(
          ([at, curve]: [number, ImportedIAutoMovieHumanFaceHairCurve]): {
            root: ImportedIAutoMovieVector3;
            reference: ImportedIAutoMovieVector3;
            points: ImportedIAutoMovieVector3[];
          } => ({
            root: seats[at].seated,
            reference: seats[at].root.point,
            points: curve.points,
          }),
        ),
        strands: strandIndices.map(
          (
            at: number,
          ): {
            root: ImportedIAutoMovieVector3;
            reference: ImportedIAutoMovieVector3;
            sequence: number;
            normal: ImportedIAutoMovieVector3;
          } => ({
            root: seats[at].seated,
            reference: seats[at].root.point,
            sequence: seats[at].root.sequence,
            normal: seats[at].normal,
          }),
        ),
      });
      spend(
        strands.reduce(
          (
            total: number,
            strand: {
              points: ImportedIAutoMovieVector3[];
              length: number;
              normal: ImportedIAutoMovieVector3;
            },
          ): number => total + strand.points.length,
          0,
        ),
      );
      progress?.("hair:" + layer.id + ":interpolated-strands");
      // Interpolated strands keep the clearance their guides were integrated
      // with, and a strand the projection cannot place is grown instead
      // (`growHumanFaceHairStrand`).
      const strandOrdinal: Map<number, number> = new Map(
        strandIndices.map((at: number, ordinal: number): [number, number] => [
          at,
          ordinal,
        ]),
      );
      const curves: ImportedIAutoMovieHumanFaceHairCurve[] = seats.map(
        (
          {
            root,
            seated,
            normal,
          }: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>,
          at: number,
        ): ImportedIAutoMovieHumanFaceHairCurve => {
          const guide: ImportedIAutoMovieHumanFaceHairCurve | undefined =
            integrated.get(at);
          if (guide !== undefined) return guide;
          const strand: {
            points: ImportedIAutoMovieVector3[];
            length: number;
            normal: ImportedIAutoMovieVector3;
          } = strands[strandOrdinal.get(at)!];
          const budget: { remaining: number } = budgets[at];
          const contact: ImportedIHumanFaceHairContact = humanFaceHairContact({
            layer,
            root: strand.points[0],
            length: strand.length,
            query,
          });
          const grown: ImportedIAutoMovieHumanFaceHairCurve =
            integrateHumanFaceHairCurve({
              layer,
              origin: domain.origin,
              reference: root.point,
              root: seated,
              normal,
              sequence: root.sequence,
              query,
              raycaster,
              budget,
              rootBoundary: {
                triangles: boundary.resolve(root),
                distance: boundary.distance,
              },
              gatherAnchor: gatherAnchor?.point,
              gatherDirection,
              metric: { length: strand.length, contact },
              place: (
                rooted: ImportedIAutoMovieHumanFaceHairRootedTransition,
              ): ImportedIAutoMovieHumanFaceHairCurve | undefined =>
                growHumanFaceHairStrand({
                  strand,
                  contact,
                  rooted,
                  integrate: (): undefined => undefined,
                }),
            });
          spend(grown.points.length - strand.points.length);
          progress?.("hair:" + layer.id + ":strand:" + root.sequence);
          return grown;
        },
      );
      const id: string = "numerical-hair:" + layer.id;
      const contactCurves: IHumanFaceHairContactCurve[] = [];
      const base: IAutoMovieMaterial = {
        id,
        name: id,
        baseColor: {
          r: layer.finish.color[0],
          g: layer.finish.color[1],
          b: layer.finish.color[2],
          a: 1,
          hex: null,
        },
        roughness: layer.finish.roughness,
        metallic: 0,
        opacity: 1,
        emissive: null,
        baseColorTexture: null,
        doubleSided: true,
      };
      const material: IAutoMovieMaterial =
        layer.terminalShaftDiameter === undefined
          ? createPortraitHairMaterial(base, {
              seed: layer.seed,
              fibres: layer.finish.fibres,
              coverage: layer.finish.coverage,
              fibreNormalScale: layer.finish.normal,
              fibreShadeStrength: layer.finish.shade,
              grey: layer.finish.grey,
            })
          : base;
      materials.push(material);
      parts.push({
        id,
        name: id,
        material: material.id,
        attachedBone: null,
        transform: null,
        geometry: {
          type: "mesh",
          mesh: buildHumanFaceHairMesh(curves, layer, {
            widths:
              layer.terminalShaftDiameter === undefined
                ? humanFaceHairDensity({
                    roots: seats.map(
                      (
                        seat: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>,
                      ): ImportedIAutoMovieVector3 => seat.seated,
                    ),
                    area,
                  })
                : curves.map((): number => layer.terminalShaftDiameter!),
            query,
            separation,
            budgets,
            attachments: seats.map(
              ({
                root,
              }: ImportedIHumanFaceHairRootSeat<ImportedIHumanFaceHairSampledRoot>): {
                triangle: number;
                weights: [number, number, number];
                supports: number[];
              } => ({
                triangle: root.triangle,
                weights: root.weights,
                supports: boundary.resolve(root),
              }),
            ),
            progress:
              progress === undefined
                ? undefined
                : (ordinal: number): void =>
                    progress("hair:" + layer.id + ":ribbon:" + ordinal),
            observeContactCurve: (curve: IHumanFaceHairContactCurve): void => {
              contactCurves.push(curve);
            },
          }),
        },
      });
      contactLayouts.set(id, {
        surface: layer.surface,
        domain: layer.domain,
        representation:
          layer.terminalShaftDiameter === undefined
            ? "ribbon"
            : "terminal-shaft",
        clearance: layer.clearance + layer.samplingStep / 2,
        curves: contactCurves,
      });
      progress?.("hair:" + layer.id + ":layer-mesh");
    }
    return { parts, materials, contactLayouts, stationCount: stations };
  };
}
