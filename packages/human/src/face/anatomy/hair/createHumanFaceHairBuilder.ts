import {
  Vector3,
  createAutoMovieMeshRayCaster,
  createAutoMovieMeshSeparationQuery,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import type { IHumanFaceHairHostQueries } from "./IHumanFaceHairHostQueries";
import type { IHumanFaceHairSourceSurface } from "./IHumanFaceHairSourceSurface";
import type { IHumanFaceHairContactLayout } from "./IHumanFaceHairContactLayout";
import type { IHumanFaceHairContactCurve } from "./IHumanFaceHairContactCurve";
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
 * Compile shared growth correspondence, then generate numerical hair on a face.
 * The connected basis builder supplies admitted neutral topology once and its
 * current complete surface positions on each edit, before UV/material splitting.
 * Root sampling and field coordinates belong to the neutral; barycentric roots
 * and closed contact queries belong to the current shape/performance. Domain and
 * closure metadata are shared, and every personal difference is in the layer.
 * No person name selects a generator, guide array, mesh cache or bitmap.
 *
 * Compilation owns the source arrays. Evaluation admits all layers first, then
 * resolves domains even for empty populations. Nonempty layers integrate metric
 * curves, mesh those same stations and generate one numerical fibre finish.
 * The caller composes these owned parts/materials and checks resident identity
 * collisions. Closed queries verify topology; embeddedness/outward orientation
 * remain the shared source and deformation's premises, not automatic anatomy.
 *
 * A ribbon's width is not authored: each root's seated neighbourhood measures
 * the scalp that root stands for (`humanFaceHairDensity`), against the share of
 * the domain its own sampler accepted taken on this face's own triangles, so a
 * thinned hairline widens its ribbons exactly as far as it thinned them and a
 * larger head widens them with it.
 * The optional observer receives actual completed guide, interpolation,
 * grown-strand, ribbon-buffer and whole-layer boundaries. It reads no model,
 * changes no geometry or budget and is never an elapsed-time heartbeat.
 */
export function createHumanFaceHairBuilder(input: IAutoMovieHumanFaceBasis) {
  const sources = new Map(
    input.surfaces.map((original) => {
      const surface: IHumanFaceHairSourceSurface = structuredClone({
        id: original.id,
        positions: original.positions,
        indices: original.indices,
        hairDomains: original.hairDomains,
        hairContactClosure: original.hairContactClosure,
      });
      const ids = new Set<string>();
      const domains = new Map(
        (surface.hairDomains ?? []).map((domain) => {
          if (
            domain.id.trim() === "" ||
            ids.has(domain.id) ||
            !domain.origin.every(Number.isFinite) ||
            domain.triangles.length === 0 ||
            domain.triangles.some(
              (triangle, at) =>
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
        }),
      );
      const closure = surface.hairContactClosure ?? [];
      if (
        closure.length % 3 !== 0 ||
        closure.some(
          (id) =>
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
      const loops = humanFaceHairClosureLoops(closure);
      const close = (current: readonly number[]) =>
        closeHumanFaceHairContact(current, surface.indices, loops);
      if (domains.size > 0) {
        const closed = close(surface.positions);
        createAutoMovieSignedMeshQuery({
          positions: closed.positions,
          indices: closed.indices,
          normals: null,
          uvs: null,
          skin: null,
        });
      }
      return [surface.id, { surface, domains, close }] as const;
    }),
  );
  return (
    hair: IAutoMovieHumanFaceHair,
    positions: ReadonlyMap<string, readonly number[]>,
    progress?: (owner: string) => void,
  ) => {
    assertHumanFaceHair(hair);
    const parts: IAutoMovieModelPart[] = [],
      materials: IAutoMovieMaterial[] = [];
    const contactLayouts = new Map<string, IHumanFaceHairContactLayout>();
    const queries = new Map<string, IHumanFaceHairHostQueries>();
    let stations = 0;
    const spend = (count: number): void => {
      stations += count;
      if (stations > 1_000_000)
        throw new Error(
          "Numerical hair exceeds its million-station assembled budget.",
        );
    };
    for (const layer of hair.layers) {
      const source = sources.get(layer.surface);
      const domain = source?.domains.get(layer.domain);
      const current = positions.get(layer.surface);
      if (
        source === undefined ||
        domain === undefined ||
        current === undefined ||
        current.length !== source.surface.positions.length
      )
        throw new Error(
          "Numerical hair requires its declared resident surface and growth domain.",
        );
      const { roots, share } = domain.sample(layer);
      if (roots.length === 0) continue;
      // The share is of the neutral domain the sampler measured; the area a
      // population grows on is that share of the same triangles as they stand
      // on this face, so a larger head grows on more of it.
      const area = measureHumanFaceHairDomainArea({
        share,
        triangles: domain.triangles,
        indices: source.surface.indices,
        current,
      });
      let collider = queries.get(layer.surface);
      if (collider === undefined) {
        const closed = source.close(current);
        const mesh = {
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
      const { query, raycaster, boundary, separation } = collider;
      const gatherAnchor =
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
      const gatherDirection =
        gatherAnchor === undefined
          ? undefined
          : createHumanFaceHairGatherField({
              positions: current,
              indices: source.surface.indices,
              triangles: domain.triangles,
              anchor: gatherAnchor,
            });
      const guided = layer.guides;
      const isGuide = (sequence: number): boolean =>
        guided === undefined ||
        humanFaceHairSequence(sequence, 17) < guided.fraction;
      const seats = seatHumanFaceHairRoots({
        roots,
        indices: source.surface.indices,
        current,
      });
      const budgets = seats.map(() => ({ remaining: 1_000_000 }));
      const integrated = new Map<
        number,
        ReturnType<typeof integrateHumanFaceHairCurve>
      >();
      seats.forEach(({ root, seated, normal }, at) => {
        if (!isGuide(root.sequence)) return;
        const curve = integrateHumanFaceHairCurve({
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
      });
      if (integrated.size === 0)
        throw new Error(
          "A guided hair layer selected no guide among its roots; raise the guide fraction or the count.",
        );
      const strandIndices = seats
        .map((_, at) => at)
        .filter((at) => !integrated.has(at));
      const strands = interpolateHumanFaceHairStrands({
        layer,
        origin: domain.origin,
        guides: [...integrated].map(([at, curve]) => ({
          root: seats[at].seated,
          reference: seats[at].root.point,
          points: curve.points,
        })),
        strands: strandIndices.map((at) => ({
          root: seats[at].seated,
          reference: seats[at].root.point,
          sequence: seats[at].root.sequence,
          normal: seats[at].normal,
        })),
      });
      spend(strands.reduce((total, strand) => total + strand.points.length, 0));
      progress?.("hair:" + layer.id + ":interpolated-strands");
      // Interpolated strands keep the clearance their guides were integrated
      // with, and a strand the projection cannot place is grown instead
      // (`growHumanFaceHairStrand`).
      const strandOrdinal = new Map(
        strandIndices.map((at, ordinal) => [at, ordinal]),
      );
      const curves = seats.map(({ root, seated, normal }, at) => {
        const guide = integrated.get(at);
        if (guide !== undefined) return guide;
        const strand = strands[strandOrdinal.get(at)!];
        const budget = budgets[at];
        const contact = humanFaceHairContact({
          layer,
          root: strand.points[0],
          length: strand.length,
          query,
        });
        const grown = integrateHumanFaceHairCurve({
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
          place: (rooted) =>
            growHumanFaceHairStrand({
              strand,
              contact,
              rooted,
              integrate: () => undefined,
            }),
        });
        spend(grown.points.length - strand.points.length);
        progress?.("hair:" + layer.id + ":strand:" + root.sequence);
        return grown;
      });
      const id = "numerical-hair:" + layer.id;
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
      const material = layer.terminalShaftDiameter === undefined ? createPortraitHairMaterial(
        base, {
          seed: layer.seed,
          fibres: layer.finish.fibres,
          coverage: layer.finish.coverage,
          fibreNormalScale: layer.finish.normal,
          fibreShadeStrength: layer.finish.shade,
          grey: layer.finish.grey,
        },
      ) : base;
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
            widths: layer.terminalShaftDiameter === undefined ? humanFaceHairDensity({
              roots: seats.map((seat) => seat.seated),
              area,
            }) : curves.map(() => layer.terminalShaftDiameter!),
            query,
            separation,
            budgets,
            attachments: seats.map(({ root }) => ({
              triangle: root.triangle,
              weights: root.weights,
              supports: boundary.resolve(root),
            })),
            progress: progress === undefined ? undefined : (ordinal) =>
              progress("hair:" + layer.id + ":ribbon:" + ordinal),
            observeContactCurve: (curve) => { contactCurves.push(curve); },
          }),
        },
      });
      contactLayouts.set(id, {
        surface: layer.surface, domain: layer.domain,
        representation: layer.terminalShaftDiameter === undefined ? "ribbon" : "terminal-shaft",
        clearance: layer.clearance + layer.samplingStep / 2,
        curves: contactCurves,
      });
      progress?.("hair:" + layer.id + ":layer-mesh");
    }
    return { parts, materials, contactLayouts, stationCount: stations };
  };
}
