import type { IAutoMovieHumanBodyBasisChannel } from "@automovie/human/body/structures/shape/IAutoMovieHumanBodyBasisChannel";
import type { IAutoMovieHumanBodyBasisCorrective } from "@automovie/human/body/structures/shape/IAutoMovieHumanBodyBasisCorrective";

import { createHumanSourceAnchorCarry } from "./createHumanSourceAnchorCarry.ts";
import { createHumanSourceBodyRecipes } from "./createHumanSourceBodyRecipes.ts";
import { humanSourcePositionTolerance } from "./humanSourcePositionTolerance.ts";
import { markHumanSourceHeadOnly } from "./markHumanSourceHeadOnly.ts";
import { markHumanSourceSide } from "./markHumanSourceSide.ts";
import { roundHalfEven } from "./roundHalfEven.ts";
import type { IHumanSourceChannelSide } from "./structures/IHumanSourceChannelSide.ts";
import type { IHumanSourceGenerationAlias } from "./structures/IHumanSourceGenerationAlias.ts";
import type { IHumanSourceMacroDefinition } from "./structures/IHumanSourceMacroDefinition.ts";
import type { IHumanSourceMacroInput } from "./structures/IHumanSourceMacroInput.ts";

/** The head anchor: the two eye joint cubes, whose mean tracks the published face frame. */
const ANCHOR_LANDMARKS = ["joint-l-eye", "joint-r-eye"];

/**
 * Define every head-shaping body endpoint once over the whole skin.
 *
 * A macro endpoint is one MPFB macro state (or a pair residual of two). Its
 * field is one upstream row over the entire source mesh, so splitting it into a
 * face copy and a body copy, each with its own frame and node, creates a cut
 * mismatch that a band can only hide. Here each body macro endpoint keeps its
 * published rows on body vertices and cut samples, and on head-only vertices
 * takes the same upstream recipe relative to the head anchor (mean of the two
 * eye joint cubes, the frame the published face subtracted). Head carry plus
 * row then equals the absolute upstream row on the head, so the field is
 * continuous at the cut without any band row. The same holds for a regional
 * body target whose upstream row, minus the anchor carry, still deforms a
 * head-only vertex (a neck or upper-torso target): it is head-shaping too and
 * gets the same one definition instead of a band.
 *
 * Face controls that sample the same macro axis are not defined again: a face
 * channel becomes an alias of the body channel of that axis, at the body's
 * nodes (a person's global dimensions are the body macro's), and a face
 * corrective whose drivers are all such channels is an alias of the body pair
 * corrective with the same drivers. A face corrective that also has another
 * driver keeps its rows with its macro drivers renamed to the body channel,
 * and records the face node it was authored at when that differs. A face
 * channel whose two endpoints are exactly a body channel's upstream targets
 * (for example a face neck width sampled from the body's neck scale target)
 * is the same quantity and becomes an alias of that body channel likewise.
 */
export function defineHumanSourceMacros(
  input: IHumanSourceMacroInput,
): IHumanSourceMacroDefinition {
  const { generation, face, body, cut, faceRows, reader, field } = input;
  const n = generation.skin.originalVertices;
  const axisOf = (state: string | undefined): string | null => {
    if (state === undefined || !reader.has(state)) return null;
    const macro = reader.state(state).recipe.macro as
      | Record<string, number>
      | undefined;
    if (macro === undefined) return null;
    const keys = Object.keys(macro);
    return keys.length === 1 ? keys[0] : null;
  };
  const nodeOf = (state: string): number =>
    Object.values(
      reader.state(state).recipe.macro as Record<string, number>,
    )[0];

  // Body macro channels by axis; face channels that sample the same axis.
  const bodyByAxis = new Map<string, IAutoMovieHumanBodyBasisChannel>();
  for (const channel of body.channels) {
    const axis = axisOf(channel.positive);
    if (axis !== null) bodyByAxis.set(axis, channel);
  }
  const aliases: IHumanSourceGenerationAlias[] = [];
  const channelAlias = new Map<string, string>();
  // A face channel whose endpoints are exactly a body channel's upstream
  // targets, side for side, samples the same quantity as that body channel.
  const sameTargetOwner = (
    channel: (typeof face.channels)[number],
  ): IAutoMovieHumanBodyBasisChannel | undefined => {
    const positive = faceRows.recipes[channel.positive];
    if (positive === undefined) return undefined;
    const owner = body.channels.find(
      (candidate) => candidate.positive === positive,
    );
    if (owner === undefined) return undefined;
    if (channel.negative === null)
      return owner.negative === null ? owner : undefined;
    return faceRows.recipes[channel.negative] === owner.negative
      ? owner
      : undefined;
  };
  for (const channel of face.channels) {
    const axis = axisOf(faceRows.recipes[channel.positive]);
    const owner =
      axis === null ? sameTargetOwner(channel) : bodyByAxis.get(axis);
    if (owner === undefined) continue;
    const endpoints: Record<string, string> = {
      [channel.positive]: owner.positive,
    };
    const notes: string[] = [];
    for (const side of ["positive", "negative"] as const) {
      const faceEndpoint = channel[side];
      const bodyEndpoint = owner[side];
      if (faceEndpoint === null || bodyEndpoint === null) continue;
      endpoints[faceEndpoint] = bodyEndpoint;
      const faceState = faceRows.recipes[faceEndpoint];
      if (faceState === undefined)
        notes.push(`${side}: face endpoint had no upstream recipe`);
      else if (axis === null)
        notes.push(`${side}: same upstream target ${faceState}`);
      else if (nodeOf(faceState) !== nodeOf(bodyEndpoint))
        notes.push(
          `${side}: face node ${axis} ${nodeOf(faceState)} replaced by body node ${nodeOf(bodyEndpoint)}`,
        );
    }
    channelAlias.set(channel.id, owner.id);
    aliases.push({
      kind: "channel",
      from: channel.id,
      to: owner.id,
      endpoints,
      note: notes.join("; ") || "same nodes",
    });
  }

  // Face correctives over aliased drivers.
  const bodyCorrectiveByDrivers = new Map<
    string,
    IAutoMovieHumanBodyBasisCorrective
  >();
  const driversKey = (inputs: readonly IHumanSourceChannelSide[]): string =>
    inputs
      .map((i) => `${i.channel}:${i.side}`)
      .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))
      .join("+");
  for (const corrective of body.correctives ?? [])
    if (corrective.inputs.every((i) => "channel" in i))
      bodyCorrectiveByDrivers.set(
        driversKey(corrective.inputs as IHumanSourceChannelSide[]),
        corrective,
      );
  const droppedFaceTargets = new Set<string>();
  const correctives = generation.correctives.flatMap((corrective) => {
    if (corrective.origin !== "face") return [corrective];
    const inputs = corrective.inputs.map((i) =>
      "channel" in i && channelAlias.has(i.channel)
        ? { ...i, channel: channelAlias.get(i.channel)! }
        : i,
    );
    const changed = inputs.some((i, k) => i !== corrective.inputs[k]);
    if (!changed) return [corrective];
    const allAliased = corrective.inputs.every(
      (i) => "channel" in i && channelAlias.has(i.channel),
    );
    const owner = allAliased
      ? bodyCorrectiveByDrivers.get(
          driversKey(inputs as IHumanSourceChannelSide[]),
        )
      : undefined;
    if (owner !== undefined) {
      droppedFaceTargets.add(corrective.target);
      aliases.push({
        kind: "corrective",
        from: corrective.id,
        to: owner.id,
        endpoints: { [corrective.target]: owner.target },
        note: "same macro drivers; body pair residual at body nodes",
      });
      return [];
    }
    aliases.push({
      kind: "corrective",
      from: corrective.id,
      to: corrective.id,
      endpoints: {},
      note: allAliased
        ? "no body pair corrective with these drivers was published; face rows kept with body drivers"
        : "macro drivers renamed to the body channels; rows authored at the face nodes are kept",
    });
    return [{ ...corrective, inputs }];
  });

  // Body macro endpoints: one upstream row, head part relative to the anchor.
  const recipeOf = createHumanSourceBodyRecipes(reader, field);
  const anchorOf = createHumanSourceAnchorCarry(body, ANCHOR_LANDMARKS);
  const headOnly = markHumanSourceHeadOnly(generation.skin);
  const bodySide = markHumanSourceSide(generation.skin, 1);
  const targets = { ...generation.targets };
  // Head-shaping body endpoints: every macro, and every body endpoint whose
  // upstream target, minus the rigid anchor carry, still moves a head-only
  // vertex by more than the storage resolution (a residual within it is the
  // rounding of a rigid move, not a deformation). Both get one definition over the whole skin; the others move the
  // head only as the rigid carry and cross the cut on the body band.
  const headRows = (name: string): number[][] => {
    const recipe = recipeOf(name)!;
    const anchor = anchorOf(name);
    const out: number[][] = [];
    for (let x = 0; x < n; x++) {
      if (headOnly[x] === 0) continue;
      const row = [0, 1, 2].map(
        (c) => roundHalfEven(recipe.skin[3 * x + c], 6) - anchor[c],
      );
      if (row.some((v) => v !== 0)) out.push([x, ...row]);
    }
    return out;
  };
  const macroTargets = Object.keys(body.surfaces[0].targets).filter((name) => {
    if (!reader.has(name)) return false;
    const kind = reader.state(name).kind;
    if (kind === "body-macro" || kind === "body-macro-pair") return true;
    return (
      kind === "body-target" &&
      headRows(name).some(
        (row) =>
          Math.hypot(row[1], row[2], row[3]) > humanSourcePositionTolerance,
      )
    );
  });
  const before: string[] = [];
  let worstAfter = 0;
  let worstBefore = 0;
  for (const name of macroTargets) {
    const anchor = anchorOf(name);
    const rows = targets[name] ?? [];
    const kept: number[][] = [];
    for (let i = 0; i < rows.length; i += 4)
      if (rows[i] >= n || bodySide[rows[i]] === 1)
        kept.push(rows.slice(i, i + 4));
    kept.push(...headRows(name));
    kept.sort((a, b) => a[0] - b[0]);
    targets[name] = kept.flat();
    // Cut mismatch: each cut sample against the stencil of the two evaluated ends.
    const value = new Map(kept.map((r) => [r[0], r.slice(1)]));
    const absolute = (x: number, c: number): number =>
      (value.get(x)?.[c] ?? 0) + (headOnly[x] === 1 ? anchor[c] : 0);
    cut.intersections.forEach((s, i) => {
      const stored = value.get(n + i) ?? [0, 0, 0];
      const gap = Math.hypot(
        ...[0, 1, 2].map(
          (c) =>
            (1 - s.t) * absolute(s.a, c) + s.t * absolute(s.b, c) - stored[c],
        ),
      );
      worstAfter = Math.max(worstAfter, gap);
    });
  }
  // Before: each aliased published face macro endpoint against its body endpoint at the cut, anchored.
  const faceSkin = face.surfaces.find((surface) => surface.id === "Human")!;
  for (const alias of aliases.filter((a) => a.kind === "channel")) {
    for (const [faceEndpoint, bodyEndpoint] of Object.entries(
      alias.endpoints,
    )) {
      const faceValue = new Map<number, number[]>();
      // The published face row, re-addressed: the band stage already faded face
      // macros at the cut, so the generation rows are not the before state.
      const faceRowsAt = faceSkin.targets[faceEndpoint] ?? [];
      for (let i = 0; i < faceRowsAt.length; i += 4)
        faceValue.set(
          cut.faceToG1[faceRowsAt[i]],
          faceRowsAt.slice(i + 1, i + 4),
        );
      const bodyValue = new Map<number, number[]>();
      const bodyRowsAt = targets[bodyEndpoint] ?? [];
      for (let i = 0; i < bodyRowsAt.length; i += 4)
        bodyValue.set(bodyRowsAt[i], bodyRowsAt.slice(i + 1, i + 4));
      const anchor = anchorOf(bodyEndpoint);
      let worst = 0;
      for (let i = 0; i < cut.intersections.length; i++) {
        const f = faceValue.get(n + i) ?? [0, 0, 0];
        const b = bodyValue.get(n + i) ?? [0, 0, 0];
        worst = Math.max(
          worst,
          Math.hypot(...[0, 1, 2].map((c) => f[c] + anchor[c] - b[c])),
        );
      }
      worstBefore = Math.max(worstBefore, worst);
      before.push(
        `${faceEndpoint}->${bodyEndpoint} ${(worst * 1000).toFixed(3)} mm`,
      );
    }
  }

  // Remove the face definitions that now alias body ones.
  const aliasedEndpoints = new Set(
    aliases
      .filter((a) => a.kind === "channel")
      .flatMap((a) => Object.keys(a.endpoints)),
  );
  for (const name of [...aliasedEndpoints, ...droppedFaceTargets])
    delete targets[name];
  return {
    generation: {
      ...generation,
      channels: generation.channels.filter(
        (c) => !(c.origin === "face" && channelAlias.has(c.id)),
      ),
      correctives,
      targets,
      anchor: {
        landmarks: ANCHOR_LANDMARKS,
        rule: "mean of the endpoint's rows on these body landmarks",
        targets: macroTargets,
      },
      aliases,
      stamps: [
        ...generation.stamps,
        {
          derivative: "macro definition",
          authoredOn: generation.id,
          status: "regenerated",
          note: `${macroTargets.length} head-shaping body endpoints (macros and regional targets that deform the head) over the whole skin relative to the eye anchor; ${aliases.length} face aliases`,
        },
      ],
    },
    checks: {
      macroTargets: macroTargets.length,
      headShapingRegionalTargets: macroTargets
        .filter((name) => reader.state(name).kind === "body-target")
        .join(", "),
      faceChannelAliases: aliases
        .filter((a) => a.kind === "channel")
        .map((a) => `${a.from}->${a.to} (${a.note})`)
        .join("; "),
      faceCorrectiveAliases: aliases.filter(
        (a) => a.kind === "corrective" && a.to !== a.from,
      ).length,
      faceCorrectivesKeptWithBodyDrivers: aliases.filter(
        (a) => a.kind === "corrective" && a.to === a.from,
      ).length,
      cutMismatchBeforeWorstMetres: worstBefore,
      cutMismatchBefore: before.join("; "),
      cutMismatchAfterWorstMetres: worstAfter,
    },
  };
}
