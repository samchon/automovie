import { readHumanFaceOralCrowns } from "@automovie/human/face/anatomy/oral/readHumanFaceOralCrowns";
import { serializeHumanFaceOralNativeSource } from "@automovie/human/face/anatomy/oral/serializeHumanFaceOralNativeSource";
import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceOralSupport } from "@automovie/human/face/structures/IAutoMovieHumanFaceOralSupport";
import crypto from "node:crypto";

import { registerHumanSourceTongueAttachmentSupport } from "./registerHumanSourceTongueAttachmentSupport.ts";
import type { IHumanSourceTongueAttachmentLoop } from "./structures/IHumanSourceTongueAttachmentLoop.ts";

/**
 * Register all native crown ports and the exact original dental source after
 * the canonical head split. Native dental ordinals remain their own physical
 * domain, independent of skin partition samples. The cervical cycles are
 * topological source boundaries, not clinical CEJ, cusps or long axes. Raw
 * source rights and bytes are admitted by the compiler before this assembly.
 */
export function defineHumanSourceOralSupport(
  face: IAutoMovieHumanFaceBasis,
  generation: string,
  sourceSha256: string[],
  tongueLoop?: IHumanSourceTongueAttachmentLoop,
): IAutoMovieHumanFaceOralSupport {
  const dental = face.surfaces.find(
    (surface) => surface.id === "Human.teeth_base",
  );
  const tongue = face.surfaces.find(
    (surface) => surface.id === "Human.tongue01",
  );
  if (dental === undefined || tongue === undefined)
    throw new Error(
      "Oral source support needs its actual native dental and tongue surfaces.",
    );
  const crowns = readHumanFaceOralCrowns(face);
  return {
    generation,
    sourceSha256: [...sourceSha256],
    sourceLicense: "CC0-1.0",
    dentalSurface: dental.id,
    tongueSurface: tongue.id,
    dentalNativeSha256: crypto
      .createHash("sha256")
      .update(serializeHumanFaceOralNativeSource(dental))
      .digest("hex"),
    crowns: crowns.map((crown) => ({
      id: crown.id,
      owner: crown.mandibular ? "jaw" : "head",
      vertices: [...crown.vertices],
      cervical: [...crown.cervical],
      neutralCervicalPositions: crown.cervical.flatMap((vertex) =>
        dental.positions.slice(3 * vertex, 3 * vertex + 3),
      ),
    })),
    ...(tongueLoop === undefined
      ? {}
      : {
          tongueAttachmentSupport: registerHumanSourceTongueAttachmentSupport(
            generation,
            tongue,
            tongueLoop,
          ),
        }),
  };
}
