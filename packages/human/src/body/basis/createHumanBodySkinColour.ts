import { HUMAN_BODY_SKIN_SITES } from "../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinSites } from "../structures/IAutoMovieHumanBodySkinSites";

type Rgb = [number, number, number];

const SITES = ["protected", "exposed", "neck", "dorsal", "palmar"] as const;

/**
 * Skin colour by anatomical site, from the cheek albedo the face wears.
 *
 * Each vertex of a surface is given weights over the table's five sites,
 * read once off the neutral body and its rig. Of the skin weights, the
 * hand's bones (the hand, thumb and fingers) split between the palm and the
 * back of the hand by the vertex normal along those bones' flexion
 * reference, the direction a digit curls toward, weighted by the skin; the
 * foot's bones split between the sole (the palm's albedo) and the back of the
 * foot by the normal against up, the back of the foot half exposed; the
 * forearm is exposed, the shank exposed by the table's share, the neck and
 * head the neck's; the rest of the skin is protected. The weights then
 * diffuse by the table's sweeps so sites meet softly. Each site's albedo is
 * the table's power of the cheek, held at 1, and a vertex's albedo is
 * its weighted sum. Near the surface's open boundary, the neck's cut where
 * the face joins, the albedo goes from the cheek itself at the cut to the
 * sites' over the table's collar band (a smoothstep in the neutral distance
 * to the nearest boundary vertex), so the body meets the face in its colour.
 *
 * The result is a material base colour, the largest albedo of any vertex
 * per channel, and per surface the per-vertex multipliers of that base
 * (albedo over base, each in (0, 1]), which the builder attaches to the
 * regions of the table's material.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Colours the body's skin by anatomical site from the face's cheek, meeting the face in its colour at the neck.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Implements the site assignment, the fits, the collar band and the base-and-multiplier split the specification fixes.
 */
export function createHumanBodySkinColour(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodySkinSites = HUMAN_BODY_SKIN_SITES,
): (cheek: Rgb) => { base: Rgb; colors: number[][] } {
  const reference = new Map(
    basis.joints.map((joint) => [joint.bone as string, joint.reference]),
  );
  const smooth = (x: number, [from, to]: [number, number]): number => {
    const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const surfaces = basis.surfaces.map((surface) => {
    const count = surface.positions.length / 3;
    const p = surface.positions;
    const normals = new Float64Array(count * 3);
    const neighbours = Array.from({ length: count }, () => new Set<number>());
    const edges = new Map<string, number>();
    for (let t = 0; t < surface.indices.length; t += 3) {
      const [a, b, c] = [0, 1, 2].map((k) => surface.indices[t + k]);
      const e1 = [0, 1, 2].map((k) => p[b * 3 + k] - p[a * 3 + k]);
      const e2 = [0, 1, 2].map((k) => p[c * 3 + k] - p[a * 3 + k]);
      const n = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k = 0; k < 3; k++) normals[v * 3 + k] += n[k];
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        neighbours[u].add(v);
        neighbours[v].add(u);
        const key = u < v ? `${u},${v}` : `${v},${u}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    const boundary = new Set<number>();
    for (const [key, triangles] of edges)
      if (triangles === 1)
        for (const v of key.split(",")) boundary.add(Number(v));
    let weights = SITES.map(() => new Float64Array(count));
    for (let v = 0; v < count; v++) {
      const size =
        Math.hypot(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]) || 1;
      const normal = [0, 1, 2].map((k) => normals[v * 3 + k] / size);
      let hand = 0;
      let foot = 0;
      let forearm = 0;
      let shank = 0;
      let neck = 0;
      const flexion = [0, 0, 0];
      for (let q = 0; q < 4; q++) {
        const bone = surface.skin.joints[surface.skin.boneIndices[v * 4 + q]];
        const w = surface.skin.weights[v * 4 + q];
        if (/^(left|right)(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)) {
          hand += w;
          const r = reference.get(bone)!;
          for (let k = 0; k < 3; k++) flexion[k] += w * r[k];
        } else if (/^(left|right)(Foot|Toes)/.test(bone)) foot += w;
        else if (/^(left|right)LowerArm/.test(bone)) forearm += w;
        else if (/^(left|right)LowerLeg/.test(bone)) shank += w;
        else if (/^(neck|head)$/.test(bone)) neck += w;
      }
      const reach = Math.hypot(flexion[0], flexion[1], flexion[2]) || 1;
      const palm = smooth(
        (normal[0] * flexion[0] +
          normal[1] * flexion[1] +
          normal[2] * flexion[2]) /
          reach,
        table.palmarFacing,
      );
      const sole = smooth(-normal[1], table.soleFacing);
      const exposed =
        forearm +
        table.shankExposure * shank +
        table.shankExposure * foot * (1 - sole);
      const palmar = hand * palm + foot * sole;
      const dorsal = hand * (1 - palm);
      weights[1][v] = exposed;
      weights[2][v] = neck;
      weights[3][v] = dorsal;
      weights[4][v] = palmar;
      weights[0][v] = Math.max(0, 1 - exposed - neck - dorsal - palmar);
    }
    for (let sweep = 0; sweep < table.sweeps; sweep++)
      weights = weights.map((field) =>
        field.map((value, v) => {
          const around = neighbours[v];
          if (around.size === 0) return value;
          let sum = 0;
          for (const u of around) sum += field[u];
          return 0.5 * value + (0.5 * sum) / around.size;
        }),
      );
    const ring = [...boundary];
    const collar = Float64Array.from({ length: count }, (_, v) => {
      let nearest = Infinity;
      for (const u of ring)
        nearest = Math.min(
          nearest,
          Math.hypot(
            p[v * 3] - p[u * 3],
            p[v * 3 + 1] - p[u * 3 + 1],
            p[v * 3 + 2] - p[u * 3 + 2],
          ),
        );
      return 1 - smooth(nearest, [0, table.collarMetres]);
    });
    return { count, weights, collar };
  });

  return (cheek) => {
    const albedo = SITES.map((site) =>
      table.sites[site].map(([a, b], k) =>
        Math.min(1, Math.exp(a) * cheek[k] ** b),
      ),
    );
    const per = surfaces.map(({ count, weights, collar }) =>
      Array.from({ length: count }, (_, v) => {
        const total = weights.reduce((sum, field) => sum + field[v], 0);
        return [0, 1, 2].map((k) => {
          const sites = weights.reduce(
            (sum, field, s) => sum + (field[v] / total) * albedo[s][k],
            0,
          );
          return collar[v] * cheek[k] + (1 - collar[v]) * sites;
        });
      }),
    );
    const base = [0, 1, 2].map((k) =>
      Math.max(...per.flatMap((vertices) => vertices.map((rgb) => rgb[k]))),
    ) as Rgb;
    return {
      base,
      colors: per.map((vertices) =>
        vertices.flatMap((rgb) => rgb.map((value, k) => value / base[k])),
      ),
    };
  };
}
