import { bindHumanSourcePart } from "./bindHumanSourcePart.ts";
import { checkHumanSourcePartRefit } from "./checkHumanSourcePartRefit.ts";
import { closestHumanSourceTriangle } from "./closestHumanSourceTriangle.ts";
import { collectHumanSourceDrivers } from "./collectHumanSourceDrivers.ts";
import { createHumanSourceAnchorCarry } from "./createHumanSourceAnchorCarry.ts";
import { createHumanSourcePartRow } from "./createHumanSourcePartRow.ts";
import { createHumanSourceSkinPointRow } from "./createHumanSourceSkinPointRow.ts";
import { markHumanSourceHeadOnly } from "./markHumanSourceHeadOnly.ts";
import { measureHumanSourcePartMotion } from "./measureHumanSourcePartMotion.ts";
import { recordHumanSourceRigidGap } from "./recordHumanSourceRigidGap.ts";
import { regenerateHumanSourceFaceLandmarks } from "./regenerateHumanSourceFaceLandmarks.ts";
import type { IHumanSourceGenerationGap } from "./structures/IHumanSourceGenerationGap.ts";
import type { IHumanSourceLoss } from "./structures/IHumanSourceLoss.ts";
import type { IHumanSourcePartInput } from "./structures/IHumanSourcePartInput.ts";
import type { IHumanSourcePartRekey } from "./structures/IHumanSourcePartRekey.ts";

/**
 * Bind every attached face part to the skin and regenerate its body-control
 * rows from the skin's rows, so one body control moves skin and parts from the
 * same base (3d-modeling: a derivative is regenerated when its base changes).
 *
 * Binding kind follows the part's anatomy and the published attachments
 * (`bindHumanSourcePart`). Eyebrow and eyelash cards deform with the skin they
 * lie on, so each vertex takes the row of its nearest head skin point. Globes,
 * dentition and tongue are rigid bodies and must not stretch: each moves as
 * one translation (`createHumanSourcePartRow`). A globe follows its own eye
 * cube, the centre the face articulation rotates it about. A dentition arch
 * (split by the published jaw attachment) and the tongue follow the mean
 * translation of the skin they sit in, because their articulation pivot, the
 * skull-mandible joint, lies far behind them and a translation taken there
 * would leave them behind a reshaped mouth. MPFB's own proxy bindings were
 * checked first: only the eyebrow binds to skin vertices; the eyelashes,
 * globes, dentition and tongue bind to helper geometry that no
 * post-extraction skin row moves, so they cannot regenerate rows for this
 * generation's controls.
 *
 * Body rows exist for the head-shaping body endpoints only (every macro and
 * every regional target that deforms the head); they are keyed by the body
 * endpoint, indexed by part vertex, relative to the head anchor like the
 * skin's head-only rows. Face-channel rows stay on the part; face endpoints
 * that now alias a body channel are removed from parts and the face landmark
 * set, which gains the head-shaping endpoints' rows
 * (`regenerateHumanSourceFaceLandmarks`). Each part is checked against the
 * skin around it (`measureHumanSourcePartMotion`, a rigid part's motion
 * recorded as a named gap by `recordHumanSourceRigidGap`) and against MPFB's
 * refit (`checkHumanSourcePartRefit`). `drivers` lists every body endpoint
 * whose state drives head-partition data (`collectHumanSourceDrivers`).
 */
export function bindHumanSourceParts(input: IHumanSourcePartInput): IHumanSourcePartRekey {
  const { generation, body, sample, offset } = input;
  const skin = generation.skin;
  const headShaping = new Set(generation.anchor?.targets ?? []);
  const aliased = new Set(generation.aliases.flatMap((alias) => Object.keys(alias.endpoints)));
  const anchorOf = createHumanSourceAnchorCarry(body, generation.anchor?.landmarks ?? []);
  const bodyEndpoints = Object.keys(body.surfaces[0].targets).filter((name) => headShaping.has(name));
  const headOnly = markHumanSourceHeadOnly(skin);
  const headTriangles: number[] = [];
  skin.labels.forEach((label, t) => {
    if (label === 0) headTriangles.push(t);
  });
  const pointRow = createHumanSourceSkinPointRow(generation, anchorOf);
  const nearest = closestHumanSourceTriangle(skin.positions, skin.triangles, headTriangles);
  const checks: Record<string, number | boolean | string> = {};
  const gaps: IHumanSourceGenerationGap[] = [];
  const losses: IHumanSourceLoss[] = [];

  const parts = generation.parts.map((part) => {
    const bound = bindHumanSourcePart(part, nearest, body.landmarks.ids);
    const partRow = createHumanSourcePartRow(bound, body, anchorOf, pointRow);
    const bodyTargets: Record<string, number[]> = {};
    let rows = 0;
    for (const name of bodyEndpoints) {
      const out: number[] = [];
      for (let v = 0; v < bound.count; v++) {
        const row = partRow(name, v);
        if (row.some((x) => x !== 0)) out.push(v, ...row);
      }
      if (out.length > 0) {
        bodyTargets[name] = out;
        rows += out.length / 4;
      }
    }
    const sizes = measureHumanSourcePartMotion(bound, partRow, pointRow);
    if (bound.rigid) {
      const recorded = recordHumanSourceRigidGap(part.id, bound.count, sizes);
      gaps.push(recorded.gap);
      losses.push(...recorded.losses);
    }
    const refit = checkHumanSourcePartRefit({ id: part.id, count: bound.count, positions: part.surface.positions, row: partRow, anchorOf, sample, offset });
    const relative = Object.entries(sizes).map(([name, size]) => `${name} ${(size * 1000).toFixed(2)} mm`);
    checks[part.id] = `${bound.binding.kind}; ${rows} body rows over ${Object.keys(bodyTargets).length} endpoints; part-vs-skin ${relative.join(", ")}; ${refit}`;
    const targets = Object.fromEntries(Object.entries(part.surface.targets).filter(([name]) => !aliased.has(name)));
    return {
      ...part,
      provenance: `published face part; body-control rows regenerated from the skin through a ${bound.binding.kind} binding`,
      surface: { ...part.surface, targets },
      binding: bound.binding,
      bodyTargets,
    };
  });
  const landmarks = regenerateHumanSourceFaceLandmarks(generation.landmarks, body, headShaping, aliased, anchorOf);
  const bodyKeys = new Set(Object.keys(body.surfaces[0].targets));
  return {
    generation: {
      ...generation,
      parts,
      landmarks,
      drivers: collectHumanSourceDrivers({ generation, headOnly, headShaping, bodyKeys, parts, landmarks }),
      gaps: [...generation.gaps, ...gaps],
      stamps: [
        ...generation.stamps,
        { derivative: "part body-control rows and face landmark body rows", authoredOn: generation.id, status: "regenerated", note: "parts bound to the skin (surface or rigid); rows relative to the head anchor" },
      ],
    },
    losses,
    checks,
  };
}
