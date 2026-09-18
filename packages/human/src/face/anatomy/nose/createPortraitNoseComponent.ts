import { IControlMesh } from "../../mesh/IControlMesh";
import { portraitNormals } from "../../mesh/portraitNormals";
import { IPortraitComponent } from "../../surface/IPortraitComponent";
import { portraitCutBoundary } from "../cranium/portraitCutBoundary";
import { appendPortraitNasalRimSection } from "./appendPortraitNasalRimSection";
import { appendPortraitNostrils } from "./appendPortraitNostrils";
import { createPortraitNasalEnvelope } from "./createPortraitNasalEnvelope";
import { createPortraitNasalLobules } from "./createPortraitNasalLobules";
import { createPortraitNasalRimSection } from "./createPortraitNasalRimSection";
import { createPortraitNasalSection } from "./createPortraitNasalSection";
import { fitPortraitNostrilRim } from "./fitPortraitNostrilRim";
import { createPortraitNasalBodySurface } from "./createPortraitNasalBodySurface";
import { createPortraitNasalSupport } from "./createPortraitNasalSupport";
import { portraitNasalCavityOffset } from "./portraitNasalCavityOffset";
import { portraitNoseDepth } from "./portraitNoseDepth";
import { resizePortraitNostrilRim } from "./resizePortraitNostrilRim";
import { IPortraitNoseShape } from "./structures/IPortraitNoseShape";
import { IPortraitNoseSocket } from "./structures/IPortraitNoseSocket";

/**
 * Build one replaceable nose against the host's declared nasal attachment.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Fits a replaceable nose whose aperture, surrounding skin and recessed cavity share one boundary.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Owns copied nasal settings, admits mutually exclusive depth bases, fits each rim once and attaches lining plus optional final exterior shaping.
 */
export function createPortraitNoseComponent(
  inputSocket: IPortraitNoseSocket,
  inputShape: IPortraitNoseShape,
): IPortraitComponent {
  const socket = {
    ...inputSocket,
    tipRadius: [...inputSocket.tipRadius] as [number, number],
    surface: [...inputSocket.surface],
    nostrils: inputSocket.nostrils.map((faces) => [...faces]),
    supportPlane:
      inputSocket.supportPlane === undefined
        ? undefined
        : [...inputSocket.supportPlane],
  };
  const shape = { ...inputShape, cavityOffset: [...inputShape.cavityOffset] };
  const bindLobules = createPortraitNasalLobules(inputShape.lobules);
  const rimSection =
    inputShape.rimSection === undefined
      ? undefined
      : { ...inputShape.rimSection };
  const envelopes = structuredClone(inputShape.envelopes ?? []);
  if (
    envelopes.length !== 0 &&
    (envelopes.length !== socket.nostrils.length ||
      rimSection !== undefined ||
      inputShape.body !== undefined ||
      inputShape.rimRefinement === "curve")
  )
    throw new Error(
      "Complete nasal envelopes need one profile per opening and cannot stack legacy rim or final-body construction.",
    );
  if (
    (shape.rimRefinement ?? "surface") !== "surface" &&
    shape.rimRefinement !== "curve"
  )
    throw new Error("Nasal rim refinement must be surface or curve.");
  const body =
    inputShape.body === undefined
      ? undefined
      : structuredClone(inputShape.body);
  if (inputShape.section !== undefined && body !== undefined)
    throw new Error(
      "Choose one pre-fit or final nasal section basis, not two stacked constructions.",
    );
  if (
    (inputShape.lobules?.length ?? 0) !== 0 &&
    (inputShape.section !== undefined || body !== undefined)
  )
    throw new Error(
      "Choose local nasal lobules or a complete section/body basis.",
    );
  if (
    (shape.depthScale ?? 1) !== 1 &&
    (inputShape.section !== undefined ||
      (body !== undefined && !("lobules" in body.shape)))
  )
    throw new Error("Choose one nasal depth-scale or section/body basis.");
  if (!Number.isFinite(shape.depthScale ?? 1) || (shape.depthScale ?? 1) <= 0)
    throw new Error("Nasal depth scale must be finite and positive.");
  const section =
    inputShape.section === undefined
      ? undefined
      : createPortraitNasalSection(inputShape.section);
  if (
    [
      shape.widthScale,
      shape.nostrilWidthScale,
      shape.nostrilHeightScale,
      shape.cavityContraction,
      shape.rimSupport,
    ].some((v) => !Number.isFinite(v) || v <= 0) ||
    shape.cavityContraction >= 1 ||
    shape.rimSupport >= 1 ||
    !Number.isFinite(shape.rimRoundness) ||
    shape.rimRoundness < 0 ||
    shape.rimRoundness > 1 ||
    !Number.isFinite(shape.blendReach) ||
    shape.blendReach < 0 ||
    ![
      shape.tipProjection,
      shape.alarProjection,
      shape.nostrilRise,
      shape.nostrilTilt,
    ].every(Number.isFinite) ||
    shape.cavityOffset.length !== 3 ||
    !shape.cavityOffset.every(Number.isFinite)
  )
    throw new Error(
      "Nasal dimensions must be finite, with positive openings and a contracted inner lining.",
    );
  return {
    id: "nose",
    fit: (host) => {
      const supportIds = socket.supportPlane ?? [];
      if (
        (shape.depthScale ?? 1) !== 1 &&
        supportIds.some(
          (id) =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error("Nasal support plane must name resident skin datums.");
      const support = createPortraitNasalSupport(
        (shape.depthScale ?? 1) === 1
          ? []
          : supportIds.map((id) => host.positions[id]),
        shape.depthScale,
      );
      const datum =
        socket.sectionAnchor === undefined
          ? undefined
          : host.positions[socket.sectionAnchor];
      if (
        (section !== undefined || body !== undefined) &&
        (!Number.isInteger(socket.sectionAnchor) ||
          socket.sectionAnchor! < 0 ||
          datum === undefined ||
          datum.length !== 3 ||
          !datum.every(Number.isFinite))
      )
        throw new Error(
          "A nasal section needs a resident finite socket datum.",
        );
      // One depth evaluator owns both exterior targets and pre-fit aperture
      // samples. A section replaces the inferred local depth; the existing tip
      // and alar controls remain explicit additional signed offsets. The lining
      // later reads the actual fitted rim, so it cannot retain a stale basis.
      const baseDepth = (point: number[]): number =>
        support(point) +
        portraitNoseDepth(point, socket, shape) +
        (section === undefined ? 0 : section(point, datum!));
      const sculptedDatums = host.positions.map((point) => [
        point[0],
        point[1],
        point[2] + baseDepth(point),
      ]);
      const lobules = bindLobules(sculptedDatums);
      const depth = (point: number[]): number => {
        const base = baseDepth(point);
        return base + lobules([point[0], point[1], point[2] + base]);
      };
      const openings = socket.nostrils.map((ordinals) =>
        ordinals.map((i) => host.indices.slice(3 * i, 3 * i + 3)),
      );
      const targets = new Map<number, number[]>();
      for (const id of socket.surface) {
        const point = host.positions[id];
        targets.set(id, [
          socket.midline + (point[0] - socket.midline) * shape.widthScale,
          point[1],
          point[2] + depth(point),
        ]);
      }
      // Exterior tangents belong to the sculpted skin before an aperture plane
      // moves its cut vertices. Capture that basis once for every rim section.
      const nasalCuts = new Set(socket.nostrils.flat());
      const skinNormals =
        rimSection === undefined && envelopes.length === 0
          ? undefined
          : portraitNormals(
              host.positions.flatMap((point, id) => targets.get(id) ?? point),
              host.indices.filter(
                (_value, index) => !nasalCuts.has(Math.floor(index / 3)),
              ),
            );
      for (const faces of openings) {
        const ids = portraitCutBoundary(faces).map((edge) => edge.a);
        const rim = resizePortraitNostrilRim(
          fitPortraitNostrilRim(
            ids.map((id) => [
              host.positions[id][0],
              host.positions[id][1],
              host.positions[id][2] + depth(host.positions[id]),
            ]),
            shape.rimRoundness,
          ),
          shape.nostrilWidthScale,
          shape.nostrilHeightScale,
        );
        const center = [0, 1, 2].map(
          (axis) =>
            ids.reduce((sum, id) => sum + host.positions[id][axis], 0) /
            ids.length,
        );
        // Rotate about the fitted opening centre, including the nasal volume
        // edit. The rim and its lining must use the same anatomical frame.
        const centerZ =
          ids.reduce(
            (sum, id) =>
              sum + host.positions[id][2] + depth(host.positions[id]),
            0,
          ) / ids.length;
        const angle = (shape.nostrilTilt * Math.PI) / 180;
        for (let vertex = 0; vertex < ids.length; vertex++) {
          const id = ids[vertex],
            point = rim[vertex];
          const y = point[1] - center[1];
          const z = point[2] - centerZ;
          targets.set(id, [
            socket.midline + (point[0] - socket.midline) * shape.widthScale,
            center[1] +
              shape.nostrilRise +
              y * Math.cos(angle) -
              z * Math.sin(angle),
            centerZ + y * Math.sin(angle) + z * Math.cos(angle),
          ]);
        }
      }
      const rimBands =
        rimSection === undefined
          ? undefined
          : openings.map((faces) => {
              const ids = portraitCutBoundary(faces).map((edge) => edge.a);
              const section = createPortraitNasalRimSection(
                ids.map((id) => targets.get(id)!),
                rimSection,
                ids.map((id) => skinNormals!.slice(id * 3, id * 3 + 3)),
              );
              ids.forEach((id, i) => targets.set(id, section.outer[i]));
              return { ids, section };
            });
      const fittedEnvelopes = envelopes.map((profile, index) => {
        const ids = portraitCutBoundary(openings[index]).map((edge) => edge.a);
        const envelope = createPortraitNasalEnvelope(
          ids.map((id) => targets.get(id)!),
          ids.map((id) => skinNormals!.slice(id * 3, id * 3 + 3)),
          profile,
          portraitNasalCavityOffset(shape),
          shape.cavityContraction,
        );
        ids.forEach((id, i) => targets.set(id, envelope.outer[i]));
        return { ids, envelope };
      });
      return {
        constraints: [...targets].map(([vertex, target]) => ({
          vertex,
          target,
          reach: shape.blendReach,
        })),
        cutFaces: socket.nostrils.flat(),
        attach: (cage, _adapted, region) => {
          const liningGroup = region("nostril-interiors", "nasal-interior");
          if (fittedEnvelopes.length !== 0) {
            const skinGroup = region("nasal-rims", "skin");
            const replacements = fittedEnvelopes.map(
              ({ ids, envelope }, index) => {
                const group = region(
                  "nasal-envelope-reserved-" + index,
                  "skin",
                );
                // Refine against the same complete section, not a fan to the
                // floor: that fan pulls the outer attachment across the rim.
                envelope.append(cage, ids, ids, group, group);
                return {
                  group,
                  append: (mesh: IControlMesh, boundary: readonly number[]) =>
                    envelope.append(
                      mesh,
                      boundary,
                      ids,
                      skinGroup,
                      liningGroup,
                    ),
                };
              },
            );
            return { openings: [], replacements, finish: () => [] };
          }
          const bandGroup =
            rimBands === undefined ? undefined : region("nasal-rims", "skin");
          const innerLoops =
            rimBands === undefined
              ? openings.map((faces) =>
                  portraitCutBoundary(faces).map((edge) => edge.a),
                )
              : rimBands.map(({ ids, section }) =>
                  appendPortraitNasalRimSection(cage, ids, section, bandGroup!),
                );
          const liningFaces =
            rimBands === undefined
              ? openings
              : innerLoops.map((loop) =>
                  Array.from({ length: loop.length - 2 }, (_, i) => [
                    loop[0],
                    loop[i + 1],
                    loop[i + 2],
                  ]),
                );
          appendPortraitNostrils(cage, liningFaces, shape, liningGroup);
          return {
            openings: [],
            // Both exterior and vestibule share these actual fitted rim IDs.
            // Opposite triangles may be asymmetric; they must not pull a
            // deliberately smooth aperture contour back into a pinched edge.
            curves: shape.rimRefinement === "curve" ? innerLoops : undefined,
            finalSurface:
              body === undefined
                ? undefined
                : createPortraitNasalBodySurface(
                    body.shape,
                    socket.sectionAnchor!,
                    liningGroup,
                    host.viewRay,
                    body.joinWidth,
                    body.depthReach,
                    sculptedDatums,
                  ),
            finish: () => [],
          };
        },
      };
    },
  };
}
