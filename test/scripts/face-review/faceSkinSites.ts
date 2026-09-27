import type {
  IAutoMovieHumanFaceBasis,
  IPortraitColourField,
} from "@automovie/human";

import type { IFacePopulationFacts } from "./facePopulationFacts";
import { FACE_SKIN_ALBEDO_GROUPS } from "./faceSkinAlbedo";
import { faceUnseenParts } from "./faceUnseenNorms";
import { faceSkinNormals } from "./prepareLidCreaseBasis";

/** One group's ratio of a site's albedo to its cheek's, per channel. */
export interface IFaceSkinSiteGroup {
  subjects: number;
  mean: [number, number, number];
}

/** The skin site norms (`derive-skin-site-norms.py`): group -> site -> sex. */
export interface IFaceSkinSiteNorms {
  groups: Record<
    string,
    Record<
      string,
      {
        all: IFaceSkinSiteGroup;
        F?: IFaceSkinSiteGroup;
        M?: IFaceSkinSiteGroup;
      }
    >
  >;
}

/**
 * The head sites the neutral surface carries, by the archive's names. The
 * cheek is the reference every ratio is taken against; the archive's cheek
 * bone and neck have no site here (no recorded ancestry's groups measure the
 * cheek bone, and the connected head's skin ends under the jaw).
 */
export const FACE_SKIN_SITES = [
  "forehead",
  "noseTip",
  "chin",
  "earLobe",
] as const;

/** A site enters only when this many subjects measured it. */
export const FACE_SKIN_SITE_MINIMUM_SUBJECTS = 30;

/**
 * A subject's regional albedo pattern from its recorded facts: per site, the
 * subject-weighted mean ratio to the cheek over the archive groups measuring
 * its recorded ancestry (`FACE_SKIN_ALBEDO_GROUPS`, the same groups its cheek
 * albedo comes from), of its recorded sex where a group records it and of
 * every subject otherwise. A site the groups measured on fewer than
 * `FACE_SKIN_SITE_MINIMUM_SUBJECTS` subjects is left out; an unrecorded
 * ancestry gives none. Pure.
 */
export function faceSkinSiteRatios(
  facts: Pick<IFacePopulationFacts, "ancestry" | "sex">,
  norms: IFaceSkinSiteNorms,
): Partial<
  Record<
    (typeof FACE_SKIN_SITES)[number],
    { ratio: [number, number, number]; subjects: number }
  >
> | null {
  if (facts.ancestry === null) return null;
  const key = facts.sex === "female" ? "F" : facts.sex === "male" ? "M" : "all";
  const out: ReturnType<typeof faceSkinSiteRatios> = {};
  for (const site of FACE_SKIN_SITES) {
    const groups = FACE_SKIN_ALBEDO_GROUPS[facts.ancestry].flatMap((name) => {
      const group = norms.groups[name];
      if (group === undefined)
        throw new Error(`The skin site norms lack the group ${name}.`);
      const one = group[site];
      return one === undefined ? [] : [one[key] ?? one.all];
    });
    const subjects = groups.reduce((sum, group) => sum + group.subjects, 0);
    if (subjects < FACE_SKIN_SITE_MINIMUM_SUBJECTS) continue;
    out[site] = {
      ratio: [0, 1, 2].map(
        (c) =>
          groups.reduce(
            (sum, group) => sum + group.subjects * group.mean[c]!,
            0,
          ) / subjects,
      ) as [number, number, number],
      subjects,
    };
  }
  return out;
}

/** A measured site's place on the neutral skin, metres. */
export interface IFaceSkinSite {
  site: (typeof FACE_SKIN_SITES)[number] | "cheek";
  side: "left" | "right" | null;
  center: [number, number, number];
}

/**
 * Where the archive's probe sits on the neutral head, read from the basis
 * surface (X left, Y up, Z forward), each by one anatomical rule:
 *
 * - noseTip: the pronasale, the most anterior skin vertex.
 * - forehead: on the midline, halfway in height between the glabella and the
 *   top of the frontal plane. The frontal plane's top is the lowest midline
 *   vertex above the globes whose normal turns more than 45 degrees upward
 *   (above it the vault faces up, not forward); the glabella is the most
 *   anterior midline vertex between the globes' height and that top.
 * - chin: the soft-tissue pogonion, the most anterior midline vertex in the
 *   lower half of the stomion-to-menton height, below the lower lip. The
 *   menton is the lowest midline vertex whose normal still faces forward.
 * - earLobe: the lobule of each auricle, the centroid of the auricle's
 *   vertices the side's ear-lobe channel moves, each weighted by how far
 *   that channel's endpoints move it.
 * - cheek: the reference site, on the mid-pupillary line (the globe centre's
 *   X), halfway in height between the globe centre and the stomion, at the
 *   most anterior forward-facing skin vertex within 4 mm of that line and
 *   height (the mouth's lining lies behind it).
 *
 * The midline is the skin vertices with X at zero, facing forward and in
 * the front half of the skin's depth (the back of the head also crosses
 * it); the stomion is the basis vermilion seam pair's mean; the globes are
 * the articulation's eye centres. The skin is the `Human` surface's skin
 * region. A basis missing any of these, or an ear-lobe channel that moves
 * no auricle, refuses. Pure.
 */
export function faceSkinSites(
  basis: IAutoMovieHumanFaceBasis,
): IFaceSkinSite[] {
  const human = basis.surfaces.find((one) => one.id === "Human");
  const landmarks = basis.landmarks;
  const eyes = basis.articulation?.eyes;
  if (
    human === undefined ||
    landmarks === undefined ||
    eyes === undefined ||
    basis.contact === undefined
  )
    throw new Error(
      "Skin sites need the Human surface, landmarks, eyes and contact.",
    );
  const P = human.positions;
  const point = (v: number) =>
    [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!] as [number, number, number];
  const skin = [
    ...new Set(
      human.regions
        .filter((one) => one.material === "skin")
        .flatMap((one) => one.indices),
    ),
  ];
  const normals = faceSkinNormals(P, human.indices);
  const landmark = (id: string) => {
    const at = landmarks.ids.indexOf(id);
    if (at < 0) throw new Error(`No landmark ${id}.`);
    return [0, 1, 2].map((k) => landmarks.positions[3 * at + k]!);
  };
  const globes = eyes.map((one) => landmark(one.center));
  const globeHeight = globes.reduce((s, g) => s + g[1]!, 0) / globes.length;
  const { lips } = basis.contact;
  const stomion = (P[3 * lips.upper + 1]! + P[3 * lips.lower + 1]!) / 2;
  const midline = skin.filter((v) => P[3 * v] === 0);
  const most = (vertices: number[], score: (v: number) => number) =>
    vertices.reduce((best, v) => (score(v) > score(best) ? v : best));
  // The face's midline: forward-facing and in the front half of the head's
  // depth (the back of the head also crosses X = 0).
  const depths = skin.map((v) => P[3 * v + 2]!);
  const middle = (Math.min(...depths) + Math.max(...depths)) / 2;
  const front = midline.filter(
    (v) => normals[3 * v + 2]! > 0 && P[3 * v + 2]! > middle,
  );
  // Up-facing beyond 45 degrees: the normal's Y exceeds its Z.
  const vault = front.filter(
    (v) =>
      P[3 * v + 1]! > globeHeight && normals[3 * v + 1]! > normals[3 * v + 2]!,
  );
  const top = most(vault, (v) => -P[3 * v + 1]!);
  const glabella = most(
    front.filter(
      (v) => P[3 * v + 1]! > globeHeight && P[3 * v + 1]! < P[3 * top + 1]!,
    ),
    (v) => P[3 * v + 2]!,
  );
  const foreheadHeight = (P[3 * glabella + 1]! + P[3 * top + 1]!) / 2;
  const nearest = (vertices: number[], height: number) =>
    most(vertices, (v) => -Math.abs(P[3 * v + 1]! - height));
  const forehead = nearest(
    front.filter((v) => P[3 * v + 1]! > globeHeight),
    foreheadHeight,
  );
  const menton = most(
    front.filter((v) => P[3 * v + 1]! < stomion),
    (v) => -P[3 * v + 1]!,
  );
  const chin = most(
    front.filter(
      (v) =>
        P[3 * v + 1]! < (stomion + P[3 * menton + 1]!) / 2 &&
        P[3 * v + 1]! >= P[3 * menton + 1]!,
    ),
    (v) => P[3 * v + 2]!,
  );
  const noseTip = most(skin, (v) => P[3 * v + 2]!);
  const sites: IFaceSkinSite[] = [
    { site: "forehead", side: null, center: point(forehead) },
    { site: "noseTip", side: null, center: point(noseTip) },
    { site: "chin", side: null, center: point(chin) },
  ];
  const { auricles } = faceUnseenParts(basis, human);
  for (const side of ["left", "right"] as const) {
    const channel = basis.channels.find((one) => one.id === `${side}EarLobe`);
    if (channel === undefined) throw new Error(`No ${side}EarLobe channel.`);
    const travel = new Map<number, number>();
    for (const endpoint of [channel.positive, channel.negative]) {
      const rows = endpoint === null ? undefined : human.targets[endpoint];
      for (let i = 0; rows !== undefined && i < rows.length; i += 4)
        travel.set(
          rows[i]!,
          (travel.get(rows[i]!) ?? 0) +
            Math.hypot(rows[i + 1]!, rows[i + 2]!, rows[i + 3]!),
        );
    }
    const lobule = auricles[side].filter((v) => (travel.get(v) ?? 0) > 0);
    const weight = lobule.reduce((s, v) => s + travel.get(v)!, 0);
    if (weight === 0) throw new Error(`No ${side} lobule.`);
    sites.push({
      site: "earLobe",
      side,
      center: [0, 1, 2].map(
        (k) =>
          lobule.reduce((s, v) => s + travel.get(v)! * P[3 * v + k]!, 0) /
          weight,
      ) as [number, number, number],
    });
    // The cheek on this side's mid-pupillary line.
    const globe = globes.find((g) =>
      side === "left" ? g[0]! > 0 : g[0]! < 0,
    )!;
    const height = (globe[1]! + stomion) / 2;
    const band = skin.filter(
      (v) =>
        Math.abs(P[3 * v]! - globe[0]!) < 0.004 &&
        Math.abs(P[3 * v + 1]! - height) < 0.004 &&
        normals[3 * v + 2]! > 0,
    );
    const cheek = most(band, (v) => P[3 * v + 2]!);
    sites.push({ site: "cheek", side, center: point(cheek) });
  }
  return sites;
}

/**
 * The regional albedo as colour fields: one sphere per placed site with a
 * ratio, centred on the site, whose gain is the ratio and whose radius is the
 * distance to the nearest other site (the cheeks included), so every site's
 * centre reads its own ratio alone and the pattern fades to the cheek's
 * between them. Strength one. Sites without a ratio add nothing; the cheek
 * is the material itself. Pure.
 */
export function faceSkinSiteFields(
  sites: readonly IFaceSkinSite[],
  ratios: NonNullable<ReturnType<typeof faceSkinSiteRatios>>,
): IPortraitColourField[] {
  return sites.flatMap((one) => {
    if (one.site === "cheek") return [];
    const ratio = ratios[one.site];
    if (ratio === undefined) return [];
    const radius = Math.min(
      ...sites
        .filter((other) => other !== one)
        .map((other) =>
          Math.hypot(
            ...[0, 1, 2].map((k) => other.center[k]! - one.center[k]!),
          ),
        ),
    );
    return [
      {
        name: one.side === null ? one.site : `${one.site}-${one.side}`,
        center: [...one.center] as [number, number, number],
        radius: [radius, radius, radius] as [number, number, number],
        gain: [...ratio.ratio] as [number, number, number],
        strength: 1,
      },
    ];
  });
}
