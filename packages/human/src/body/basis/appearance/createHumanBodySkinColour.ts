import { HUMAN_BODY_SKIN_SITES } from "../../constants/HUMAN_BODY_SKIN_SITES";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySkinSites } from "../../structures/IAutoMovieHumanBodySkinSites";
import type { IHumanBodySkinColourSurface } from "./IHumanBodySkinColourSurface";

type Rgb = [number, number, number];

const SITES: readonly (keyof IAutoMovieHumanBodySkinSites["sites"])[] = ["protected", "exposed", "neck", "dorsal", "palmar"];

/**
 * Skin colour by anatomical site, from the cheek albedo the face wears.
 *
 * Each vertex of a surface is given weights over the table's five sites, read once off the neutral body and its rig. Of the skin weights, the hand's bones (the hand, thumb and fingers) split between the palm and the back of the hand by the vertex normal along those bones' flexion reference, the direction a digit curls toward, weighted by the skin; the foot's bones split between the sole (the palm's albedo) and the back of the foot by the normal against up, the back of the foot half exposed; the forearm is exposed, the shank exposed by the table's share, the neck and head the neck's; the rest of the skin is protected. The weights then diffuse by the table's sweeps so sites meet softly. Each site's albedo is the table's power of the cheek, held at 1, and a vertex's albedo is its weighted sum. Near the surface's open boundary, the neck's cut where the face joins, the albedo goes from the cheek itself at the cut to the sites' over the table's collar band (a smoothstep in the neutral distance to the nearest boundary vertex), so the body meets the face in its colour. Over each joint the table names, the skin on the extension side (a Gaussian along the bone within its reach, where the normal faces away from the flexion side, diffused as the sites are) takes the joint's ratio, blended from straight to folded by the flexion `flexion` reads (the joint's rest when it reads none).
 *
 * The result is a material base colour, the largest albedo of any vertex per channel, and per surface the per-vertex multipliers of that base (albedo over base, each in (0, 1]), which the builder attaches to the regions of the table's material. The compiled basis and appearance table must remain unchanged during the returned closure's lifetime. These are authored appearance relations, not measured personal skin-site distributions or clinical fold mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Neutral triangle normals and admitted bone weights classify five site fields; diffusion, boundary smoothstep and pose prominence ratios combine authored cheek-power albedos into per-vertex linear colors.
 * @evidence contracts/common.md#clear-and-simple-design One fixed-source compilation prepares geometric fields while the returned closure evaluates changing cheek and flexion values without moving skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored site powers and joint-fold ratios do not certify individual pigmentation or physiology; fixed-basis/table immutability is required for prepared fields to remain valid.
 * @evidence contracts/common.md#meaningful-documentation The prose gives linear color/base normalization, neutral field construction, boundary matching, pose fallback and cache-lifetime premises.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans V vertices/T triangles, D diffusion sweeps and P prominence fields; collar distance is O(V*B) for B boundary vertices. Each color call costs O(V*P), and base maxima use a bounded-argument scan instead of source-sized spread arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Neutral site/collar/prominence arrays are prepared once per unchanged basis/table; cheek and current joint flexion are reevaluated because they alter albedo.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains O(V*(5+P)) prepared fields until unreachable; topology temporaries expire after compilation and fresh color arrays escape per call without GPU resources.
 */
export function createHumanBodySkinColour(
  basis: IAutoMovieHumanBodyBasis,
  table: IAutoMovieHumanBodySkinSites = HUMAN_BODY_SKIN_SITES,
): (
  cheek: Rgb,
  flexion?: (bone: string) => number | null,
) => { base: Rgb; colors: number[][] } {
  const joints: Map<string, IAutoMovieHumanBodyBasis["joints"][number]> = new Map(
    basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [string, IAutoMovieHumanBodyBasis["joints"][number]] => [joint.bone as string, joint]),
  );
  const landmark: (id: string) => number[] = (id: string): number[] => {
    const k: number = basis.landmarks.ids.indexOf(id);
    return basis.landmarks.positions.slice(k * 3, k * 3 + 3);
  };
  const reference: Map<string, IAutoMovieHumanBodyBasis["joints"][number]["reference"]> = new Map(
    basis.joints.map((joint: IAutoMovieHumanBodyBasis["joints"][number]): [string, IAutoMovieHumanBodyBasis["joints"][number]["reference"]] => [joint.bone as string, joint.reference]),
  );
  const smooth: (x: number, interval: [number, number]) => number = (x: number, [from, to]: [number, number]): number => {
    const t: number = Math.min(1, Math.max(0, (x - from) / (to - from)));
    return t * t * (3 - 2 * t);
  };
  const surfaces: IHumanBodySkinColourSurface[] = basis.surfaces.map((surface: IAutoMovieHumanBodyBasis["surfaces"][number]): IHumanBodySkinColourSurface => {
    const count: number = surface.positions.length / 3;
    const p: number[] = surface.positions;
    const normals: Float64Array = new Float64Array(count * 3);
    const neighbours: Set<number>[] = Array.from({ length: count }, (): Set<number> => new Set<number>());
    const edges: Map<string, number> = new Map<string, number>();
    for (let t: number = 0; t < surface.indices.length; t += 3) {
      const [a, b, c]: number[] = [0, 1, 2].map((k: number): number => surface.indices[t + k]);
      const e1: number[] = [0, 1, 2].map((k: number): number => p[b * 3 + k] - p[a * 3 + k]);
      const e2: number[] = [0, 1, 2].map((k: number): number => p[c * 3 + k] - p[a * 3 + k]);
      const n: number[] = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k: number = 0; k < 3; k++) normals[v * 3 + k] += n[k];
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        neighbours[u].add(v);
        neighbours[v].add(u);
        const key: string = u < v ? `${u},${v}` : `${v},${u}`;
        edges.set(key, (edges.get(key) ?? 0) + 1);
      }
    }
    const boundary: Set<number> = new Set<number>();
    for (const [key, triangles] of edges)
      if (triangles === 1)
        for (const v of key.split(",")) boundary.add(Number(v));
    let weights: Float64Array[] = SITES.map((): Float64Array => new Float64Array(count));
    for (let v: number = 0; v < count; v++) {
      const size: number =
        Math.hypot(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]) || 1;
      const normal: number[] = [0, 1, 2].map((k: number): number => normals[v * 3 + k] / size);
      let hand: number = 0;
      let foot: number = 0;
      let forearm: number = 0;
      let shank: number = 0;
      let neck: number = 0;
      const flexion: number[] = [0, 0, 0];
      for (let q: number = 0; q < 4; q++) {
        const bone: string = surface.skin.joints[surface.skin.boneIndices[v * 4 + q]];
        const w: number = surface.skin.weights[v * 4 + q];
        if (/^(left|right)(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)) {
          hand += w;
          const r: IAutoMovieHumanBodyBasis["joints"][number]["reference"] = reference.get(bone)!;
          for (let k: number = 0; k < 3; k++) flexion[k] += w * r[k];
        } else if (/^(left|right)(Foot|Toes)/.test(bone)) foot += w;
        else if (/^(left|right)LowerArm/.test(bone)) forearm += w;
        else if (/^(left|right)LowerLeg/.test(bone)) shank += w;
        else if (/^(neck|head)$/.test(bone)) neck += w;
      }
      const reach: number = Math.hypot(flexion[0], flexion[1], flexion[2]) || 1;
      const palm: number = smooth(
        (normal[0] * flexion[0] +
          normal[1] * flexion[1] +
          normal[2] * flexion[2]) /
          reach,
        table.palmarFacing,
      );
      const sole: number = smooth(-normal[1], table.soleFacing);
      const exposed: number =
        forearm +
        table.shankExposure * shank +
        table.shankExposure * foot * (1 - sole);
      const palmar: number = hand * palm + foot * sole;
      const dorsal: number = hand * (1 - palm);
      weights[1][v] = exposed;
      weights[2][v] = neck;
      weights[3][v] = dorsal;
      weights[4][v] = palmar;
      weights[0][v] = Math.max(0, 1 - exposed - neck - dorsal - palmar);
    }
    for (let sweep: number = 0; sweep < table.sweeps; sweep++)
      weights = weights.map((field: Float64Array): Float64Array =>
        field.map((value: number, v: number): number => {
          const around: Set<number> = neighbours[v];
          if (around.size === 0) return value;
          let sum: number = 0;
          for (const u of around) sum += field[u];
          return 0.5 * value + (0.5 * sum) / around.size;
        }),
      );
    // each prominence's region on either side, off the neutral rig: the
    // joint frame is the bone's (Y head to tail, X = Y x reference, Z =
    // X x Y the flexion side), and the extension side faces -Z
    const prominences: IHumanBodySkinColourSurface["prominences"] = table.prominences.flatMap((prominence: IAutoMovieHumanBodySkinSites["prominences"][number]): IHumanBodySkinColourSurface["prominences"] =>
      (["left", "right"] as const).flatMap((side: "left" | "right"): IHumanBodySkinColourSurface["prominences"] => {
        const joint: IAutoMovieHumanBodyBasis["joints"][number] | undefined = joints.get(side + prominence.bone);
        if (joint === undefined) return [];
        const head: number[] = landmark(joint.head);
        const tail: number[] = landmark(joint.tail);
        const y: number[] = unit(tail.map((value: number, k: number): number => value - head[k]));
        const x: number[] = unit(cross(y, joint.reference));
        const z: number[] = cross(x, y);
        let field: Float64Array = Float64Array.from({ length: count }, (_: unknown, v: number): number => {
          const d: number[] = [0, 1, 2].map((k: number): number => p[v * 3 + k] - head[k]);
          const along: number = dot(d, y);
          const radial: number = Math.hypot(
            d[0] - along * y[0],
            d[1] - along * y[1],
            d[2] - along * y[2],
          );
          if (radial > prominence.reachMetres) return 0;
          const n: number[] = [0, 1, 2].map((k: number): number => normals[v * 3 + k]);
          const size: number = Math.hypot(n[0], n[1], n[2]) || 1;
          return (
            Math.exp(-((along / prominence.sigmaMetres) ** 2)) *
            smooth(-dot(n, z) / size, [0.2, 0.6])
          );
        });
        for (let sweep: number = 0; sweep < table.sweeps; sweep++)
          field = field.map((value: number, v: number): number => {
            const around: Set<number> = neighbours[v];
            if (around.size === 0) return value;
            let sum: number = 0;
            for (const u of around) sum += field[u];
            return 0.5 * value + (0.5 * sum) / around.size;
          });
        return [
          {
            prominence,
            bone: joint.bone as string,
            neutral: joint.neutral.flexion,
            field,
          },
        ];
      }),
    );
    const ring: number[] = [...boundary];
    const collar: Float64Array = Float64Array.from({ length: count }, (_: unknown, v: number): number => {
      let nearest: number = Infinity;
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
    return { count, weights, collar, prominences };
  });

  return (cheek: Rgb, flexion?: (bone: string) => number | null): { base: Rgb; colors: number[][] } => {
    const albedo: number[][] = SITES.map((site: keyof IAutoMovieHumanBodySkinSites["sites"]): number[] =>
      table.sites[site].map(([a, b]: [number, number], k: number): number =>
        Math.min(1, Math.exp(a) * cheek[k] ** b),
      ),
    );
    const per: number[][][] = surfaces.map(({ count, weights, collar, prominences }: IHumanBodySkinColourSurface): number[][] => {
      // each prominence's ratio at its joint's flexion, the rest's when the
      // pose leaves the joint unposed
      const ratios: number[][] = prominences.map(({ prominence, bone, neutral }: IHumanBodySkinColourSurface["prominences"][number]): number[] => {
        const share: number = Math.min(
          1,
          Math.max(
            0,
            (flexion?.(bone) ?? neutral) / prominence.foldedAtDegrees,
          ),
        );
        return prominence.extended.map(
          (value: number, k: number): number => value + (prominence.folded[k] - value) * share,
        );
      });
      return Array.from({ length: count }, (_: unknown, v: number): number[] => {
        const total: number = weights.reduce((sum: number, field: Float64Array): number => sum + field[v], 0);
        return [0, 1, 2].map((k: number): number => {
          let sites: number = weights.reduce(
            (sum: number, field: Float64Array, s: number): number => sum + (field[v] / total) * albedo[s][k],
            0,
          );
          prominences.forEach(({ field }: IHumanBodySkinColourSurface["prominences"][number], at: number): void => {
            sites *= 1 + field[v] * (ratios[at][k] - 1);
          });
          return collar[v] * cheek[k] + (1 - collar[v]) * sites;
        });
      });
    });
    const base: Rgb = [-Infinity, -Infinity, -Infinity];
    for (const vertices of per)
      for (const rgb of vertices)
        for (let k: number = 0; k < 3; k++)
          base[k] = Math.max(base[k], rgb[k]);
    return {
      base,
      colors: per.map((vertices: number[][]): number[] =>
        vertices.flatMap((rgb: number[]): number[] => rgb.map((value: number, k: number): number => value / base[k])),
      ),
    };
  };
}

const dot: (a: number[], b: number[]) => number = (a: number[], b: number[]): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross: (a: number[], b: number[]) => number[] = (a: number[], b: number[]): number[] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit: (a: number[]) => number[] = (a: number[]): number[] => {
  const size: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / size, a[1] / size, a[2] / size];
};
