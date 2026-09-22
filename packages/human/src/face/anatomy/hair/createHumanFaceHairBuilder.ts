import { Vector3, createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type {
  IAutoMovieMaterial,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";
import { assertHumanFaceHair } from "./assertHumanFaceHair";
import { buildHumanFaceHairMesh } from "./buildHumanFaceHairMesh";
import { createHumanFaceHairRoots } from "./createHumanFaceHairRoots";
import { createPortraitHairMaterial } from "./createPortraitHairMaterial";
import { growHumanFaceHairStrand } from "./growHumanFaceHairStrand";
import { humanFaceHairContact } from "./humanFaceHairContact";
import { humanFaceHairSequence } from "./humanFaceHairSequence";
import { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";
import { interpolateHumanFaceHairStrands } from "./interpolateHumanFaceHairStrands";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Reuses one anatomical domain and shared generator across numerical identities.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Connects numerical roots, fields, contact, strips and procedural finish to current face geometry.
 */
export function createHumanFaceHairBuilder(input: IAutoMovieHumanFaceBasis) {
  const sources = new Map(
    input.surfaces.map((original) => {
      const surface = structuredClone(original);
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
      const indices = [...surface.indices, ...closure];
      if (domains.size > 0)
        createAutoMovieSignedMeshQuery({
          positions: surface.positions,
          indices,
          normals: null,
          uvs: null,
          skin: null,
        });
      return [surface.id, { surface, domains, indices }] as const;
    }),
  );
  return (
    hair: IAutoMovieHumanFaceHair,
    positions: ReadonlyMap<string, readonly number[]>,
  ) => {
    assertHumanFaceHair(hair);
    const parts: IAutoMovieModelPart[] = [],
      materials: IAutoMovieMaterial[] = [];
    const queries = new Map<
      string,
      ReturnType<typeof createAutoMovieSignedMeshQuery>
    >();
    let stations = 0;
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
      const roots = domain.sample(layer);
      if (roots.length === 0) continue;
      let query = queries.get(layer.surface);
      if (query === undefined) {
        query = createAutoMovieSignedMeshQuery({
          positions: [...current],
          indices: source.indices,
          normals: null,
          uvs: null,
          skin: null,
        });
        queries.set(layer.surface, query);
      }
      const guided = layer.guides;
      const isGuide = (sequence: number): boolean =>
        guided === undefined ||
        humanFaceHairSequence(sequence, 17) < guided.fraction;
      const seats = roots.map((root) => {
        const ids = source.surface.indices.slice(
          root.triangle * 3,
          root.triangle * 3 + 3,
        );
        const points = ids.map((id) =>
          Vector3.create(
            current[id * 3],
            current[id * 3 + 1],
            current[id * 3 + 2],
          ),
        );
        const seated = points.reduce(
          (sum, point, at) =>
            Vector3.add(sum, Vector3.scale(point, root.weights[at])),
          Vector3.create(),
        );
        const normal = Vector3.normalize(
          Vector3.cross(
            Vector3.subtract(points[1], points[0]),
            Vector3.subtract(points[2], points[0]),
          ),
        );
        return { root, seated, normal };
      });
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
        });
        stations += curve.points.length;
        if (stations > 1_000_000)
          throw new Error(
            "Numerical hair exceeds its million-station assembled budget.",
          );
        integrated.set(at, curve);
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
      for (const strand of strands) stations += strand.points.length;
      if (stations > 1_000_000)
        throw new Error(
          "Numerical hair exceeds its million-station assembled budget.",
        );
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
        const grown = growHumanFaceHairStrand({
          strand,
          contact: humanFaceHairContact({
            layer,
            root: strand.points[0],
            length: strand.length,
            query,
          }),
          integrate: () =>
            integrateHumanFaceHairCurve({
              layer,
              origin: domain.origin,
              reference: root.point,
              root: seated,
              normal,
              sequence: root.sequence,
              query,
            }),
        });
        stations += grown.points.length - strand.points.length;
        if (stations > 1_000_000)
          throw new Error(
            "Numerical hair exceeds its million-station assembled budget.",
          );
        return grown;
      });
      const id = "numerical-hair:" + layer.id;
      const material = createPortraitHairMaterial(
        {
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
        },
        {
          seed: layer.seed,
          fibres: layer.finish.fibres,
          coverage: layer.finish.coverage,
          fibreNormalScale: layer.finish.normal,
          fibreShadeStrength: layer.finish.shade,
        },
      );
      materials.push(material);
      parts.push({
        id,
        name: id,
        material: material.id,
        attachedBone: null,
        transform: null,
        geometry: { type: "mesh", mesh: buildHumanFaceHairMesh(curves, layer) },
      });
    }
    return { parts, materials };
  };
}
