import {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { IAutoMovieHumanEyeHairHost } from "../junction/IAutoMovieHumanEyeHairHost";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieHumanHairColor } from "../structures/AutoMovieHumanHairColor";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";
import { AUTOMOVIE_HUMAN_HAIR_COLORS } from "./AUTOMOVIE_HUMAN_HAIR_COLORS";
import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";
import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";
import { frameAutoMovieHumanScalp } from "./frameAutoMovieHumanScalp";
import { growAutoMovieHumanBrows } from "./growAutoMovieHumanBrows";
import { growAutoMovieHumanHair } from "./growAutoMovieHumanHair";
import { growAutoMovieHumanLashes } from "./growAutoMovieHumanLashes";
import { ownAutoMovieHumanEyeHair } from "./ownAutoMovieHumanEyeHair";
import { paintAutoMovieHumanHairStrands } from "./paintAutoMovieHumanHairStrands";

/**
 * Emit the person's scalp hair, brows and lashes as model parts riding the head bone, with their materials and the strand atlas they sample.
 *
 * Scalp roots read the emitted head skin; brows and lashes also consume the current default head's actual orbital-course owner. A custom head with another form/chart needs its own attachment owner before this rule can claim support. All ride the `head` bone rigidly; each mesh lives in that bone's frame in metres. Part ids are `hair`, `brows` and `lashes`; a shaved scalp or zero-length lashes emit no corresponding part.
 *
 * Each takes its own colour choice through one material: the strand atlas's grey times the colour, alpha-tested at 0.35, low enough that a lone strand survives the averaging of the atlas's smaller mip levels, so the cards need no sorting against the rest of the scene while their own order, scalp outward, holds within the mesh, both faces drawn, and an anisotropic specular lobe streaked along the strands, texture `+v` from root to tip, which is what makes cards read as hair (Scheuermann 2004, after Kajiya and Kay's strand model). Hair is a dielectric with a cuticle near index 1.55 (conventional); its roughness 0.5 keeps the highlight broad enough for the cards' coarse normals.
 *
 * @param props.measurements Resolved measurements
 * @param props.skeleton The skeleton at rest
 * @param props.appearance The admitted appearance
 * @param props.skin The emitted skin parts, metres, from which the head's surface is read
 * @param props.eyeHairHost The actual selected head's lid operator for this person; composition supplies it
 * The inspection closure retains only these three actual builders and lazily
 * emits their guides, widths, roots and owned features in world rest metres.
 * It regenerates no hair and reads no saved construction. Population/resolution
 * diagnostics distinguish active coarse wave styling from resolved fine coils.
 *
 * @returns The parts, materials, atlas, actual construction closure and bounded observations
 * @throws {Error} When the skin has no head, the skeleton lacks the head bone or the supplied host belongs to another person
 */
export function emitAutoMovieHumanHair(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  appearance: IAutoMovieHumanAppearance;
  skin: readonly IAutoMovieModelPart[];
  eyeHairHost: IAutoMovieHumanEyeHairHost;
  /** Same generated rest skin's exact chart/contact owner; omitted retains the legacy skin-chart adapter. */
  surface?: AutoMovieHumanHeadSurface;
}): {
  parts: IAutoMovieModelPart[];
  materials: IAutoMovieMaterial[];
  images: IAutoMovieImage[];
  inspect: () => IAutoMovieHumanConstructionNet[];
  diagnostics: {
    scalp: ReturnType<AutoMovieHumanCardBuilder["statistics"]>;
    eyeRoots: Record<"left" | "right", ownAutoMovieHumanEyeHair.IProjection>;
    fineCurlResolved: false;
  };
} {
  if (
    props.eyeHairHost.context.measurements !== props.measurements ||
    props.eyeHairHost.context.skeleton !== props.skeleton
  )
    throw new Error(
      "The eye-hair appearance capability belongs to another person context",
    );
  const head: IAutoMovieHumanSkeleton.IJoint | undefined =
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === "head",
    );
  if (head === undefined) throw new Error("the skeleton lacks the head bone");
  const surface: AutoMovieHumanHeadSurface = props.surface ??
    new AutoMovieHumanHeadSurface(props.skin);
  const scalp: frameAutoMovieHumanScalp.IScalp = frameAutoMovieHumanScalp({
    measurements: props.measurements,
    skeleton: props.skeleton,
    hairline: props.appearance.hair.hairline,
  });
  const strands: IAutoMovieImage = paintAutoMovieHumanHairStrands();
  const builders: Record<
    "hair" | "brows" | "lashes",
    AutoMovieHumanCardBuilder
  > = {
    hair: new AutoMovieHumanCardBuilder(),
    brows: new AutoMovieHumanCardBuilder(),
    lashes: new AutoMovieHumanCardBuilder(),
  };
  const owners: ReturnType<typeof ownAutoMovieHumanEyeHair> =
    ownAutoMovieHumanEyeHair({
      measurements: props.measurements,
      skeleton: props.skeleton,
      surface,
      host: props.eyeHairHost,
    });
  const parts: IAutoMovieModelPart[] = [];
  const materials: Map<string, IAutoMovieMaterial> = new Map();
  const add: (
    name: "hair" | "brows" | "lashes",
    color: AutoMovieHumanHairColor,
    mesh: IAutoMovieMesh | null,
  ) => void = (
    name: "hair" | "brows" | "lashes",
    color: AutoMovieHumanHairColor,
    mesh: IAutoMovieMesh | null,
  ): void => {
    if (mesh === null || mesh.positions.length === 0) return;
    const material: IAutoMovieMaterial = materialOf(color, strands.id);
    materials.set(material.id, material);
    const origin: number[] = [
      head.position.x,
      head.position.y,
      head.position.z,
    ];
    parts.push({
      id: name,
      name,
      geometry: {
        type: "mesh",
        mesh: {
          ...mesh,
          positions: mesh.positions.map(
            (x: number, i: number): number => (x - origin[i % 3]!) / 1000,
          ),
        },
      },
      material: material.id,
      attachedBone: "head",
      transform: null,
    });
  };
  const appearance: IAutoMovieHumanAppearance = props.appearance;
  add(
    "hair",
    appearance.hair.color,
    growAutoMovieHumanHair({
      surface,
      scalp,
      skeleton: props.skeleton,
      hair: appearance.hair,
      builder: builders.hair,
    }),
  );
  add(
    "brows",
    appearance.brows.color,
    growAutoMovieHumanBrows({ owners, builder: builders.brows }),
  );
  add(
    "lashes",
    appearance.lashes.color,
    growAutoMovieHumanLashes({
      owners,
      length: appearance.lashes.length,
      builder: builders.lashes,
    }),
  );
  return {
    parts,
    materials: [...materials.values()],
    images: parts.length === 0 ? [] : [strands],
    inspect: (): IAutoMovieHumanConstructionNet[] =>
      (["hair", "brows", "lashes"] as const)
        .flatMap(
          (
            name: "hair" | "brows" | "lashes",
          ): IAutoMovieHumanConstructionNet[] => builders[name].inspect(name),
        )
        .filter(
          (net: IAutoMovieHumanConstructionNet): boolean =>
            net.cage.positions.length !== 0 || net.curves.length !== 0,
        ),
    diagnostics: {
      scalp: builders.hair.statistics(),
      eyeRoots: {
        left: { ...owners.left.projection },
        right: { ...owners.right.projection },
      },
      fineCurlResolved: false,
    },
  };
}

/** The hair material of one colour, sampling the strand atlas. */
function materialOf(
  color: AutoMovieHumanHairColor,
  atlas: string,
): IAutoMovieMaterial {
  const c: { r: number; g: number; b: number } =
    AUTOMOVIE_HUMAN_HAIR_COLORS[color];
  return {
    id: `hair.${color}`,
    name: `${color} hair`,
    baseColor: { ...c, a: null, hex: null },
    metallic: 0,
    roughness: 0.5,
    emissive: null,
    opacity: 1,
    baseColorTexture: {
      asset: atlas,
      texCoord: 0,
      coordinateSource: "normalized",
      colorSpace: "linear",
      sampler: {
        wrapS: "clamp",
        wrapT: "clamp",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    },
    alphaMode: "mask",
    alphaCutoff: 0.35,
    doubleSided: true,
    ior: 1.55,
    specularIntensity: 0.6,
    anisotropy: { strength: 0.3, rotationDeg: 90, texture: null },
  };
}
