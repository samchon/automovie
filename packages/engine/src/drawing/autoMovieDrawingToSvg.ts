import {
  AutoMovieDrawingRole,
  IAutoMovieDrawing,
  IAutoMovieDrawingAnnotation,
  IAutoMovieDrawingDimension,
  IAutoMovieDrawingExtent,
  IAutoMovieDrawingGap,
  IAutoMovieDrawingLine,
  IAutoMovieDrawingOpeningMark,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingRegion,
  IAutoMovieDrawingView,
} from "@automovie/interface";

import { AUTOMOVIE_DRAWING_ROLES } from "./constants/AUTOMOVIE_DRAWING_ROLES";
import { AUTOMOVIE_DRAWING_SVG_MARGIN } from "./constants/AUTOMOVIE_DRAWING_SVG_MARGIN";

/** One SVG attribute as a name and its unescaped value. */
type Attribute = [string, string];

/**
 * Serialize one derived drawing as a self-describing SVG sheet.
 *
 * Every line carries its owner, space, layer and role; every region its space,
 * cell, kind, finish and area; every opening its identity, basis and size, as
 * an empty group when it has no outline; every dimension and note its status,
 * as an empty group with its reason when stale; and every gap is a marker, so
 * a sheet cannot look complete while its record says it is not. The root
 * carries the drawing's protocol, view, environment, projection, discipline,
 * scale and digest.
 *
 * The scale is drafting scale: one model metre is `1000 / scale` page
 * millimetres, so a 1:50 plan prints at 1:50, and pen weights and text height
 * are page millimetres. The page is the drawing's extent plus a fixed
 * {@link AUTOMOVIE_DRAWING_SVG_MARGIN} on each side, with y flipped because
 * SVG y grows downward. Numbers are rounded and printed to three decimals and
 * every attribute value is XML-escaped, so one drawing and view yield one byte
 * sequence.
 *
 * Throws an `Error` when the view is not the one the drawing was derived from,
 * or its pen has a weight, dash or text height that is not a finite positive
 * number.
 *
 * @param props.drawing Drawing to serialize.
 * @param props.view View the drawing was derived from; supplies the pen.
 * @returns The SVG document, lines separated by `\n`, without a trailing
 *   newline.
 *
 * @evidence contracts/common.md#principled-implementation Maps page metres to SVG user units in millimetres by the drafting-scale factor and flips y once, writes geometry as plain `line`, `polygon` and `text` elements with semantic `data-*` attributes, and escapes the five XML special characters in every value, so the output is well-formed for any authored text.
 * @evidence contracts/common.md#clear-and-simple-design One serializer owns pen validation, page placement and element emission; the tag, escape, number and point helpers are private because no other module writes SVG.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No drawing or view is special-cased; stale and outline-less items are emitted as empty groups by a stated rule rather than dropped, and a mismatched or invalid pen throws instead of being replaced by defaults.
 * @evidence contracts/common.md#meaningful-documentation The comment states every element and attribute family, the scale and page mapping, the margin, the flip, rounding and escaping, every refusal, and the exact output shape.
 * @evidence contracts/performance.md#efficient-algorithms One pass over each array of the drawing emitting one element each, so time and output are linear in the drawing's size; the body is joined once at the end instead of by repeated concatenation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure serializer called once per sheet; nothing equivalent repeats within a call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Builds the body strings for one call and returns one string owned by the caller; nothing is retained.
 * @author Samchon
 */
export const autoMovieDrawingToSvg = (props: {
  /** Drawing to serialize. */
  drawing: IAutoMovieDrawing;
  /** View the drawing was derived from; supplies the pen. */
  view: IAutoMovieDrawingView;
}): string => {
  const { drawing, view } = props;
  if (view.id !== drawing.view)
    throw new Error(
      `drawing "${drawing.view}" cannot be drawn with the pen of view "${view.id}"`,
    );
  for (const role of AUTOMOVIE_DRAWING_ROLES) {
    const weight: number = view.style.weights[role];
    if (!Number.isFinite(weight) || weight <= 0)
      throw new Error(
        `drawing view "${view.id}" ${role} stroke weight must be a finite number > 0, but was ${weight}`,
      );
    for (const dash of view.style.dashes[role])
      if (!Number.isFinite(dash) || dash <= 0)
        throw new Error(
          `drawing view "${view.id}" ${role} dash pattern must hold only finite numbers > 0, but held ${dash}`,
        );
  }
  if (!Number.isFinite(view.style.textHeight) || view.style.textHeight <= 0)
    throw new Error(
      `drawing view "${view.id}" text height must be a finite number > 0, but was ${view.style.textHeight}`,
    );

  const perMetre: number = 1000 / drawing.scale;
  const extent: IAutoMovieDrawingExtent = drawing.extent ?? {
    min: { x: 0, y: 0 },
    max: { x: 0, y: 0 },
  };
  const width: number =
    (extent.max.x - extent.min.x) * perMetre + AUTOMOVIE_DRAWING_SVG_MARGIN * 2;
  const height: number =
    (extent.max.y - extent.min.y) * perMetre + AUTOMOVIE_DRAWING_SVG_MARGIN * 2;
  const at = (point: IAutoMovieDrawingPoint): { x: string; y: string } => ({
    x: number(
      (point.x - extent.min.x) * perMetre + AUTOMOVIE_DRAWING_SVG_MARGIN,
    ),
    y: number(
      (extent.max.y - point.y) * perMetre + AUTOMOVIE_DRAWING_SVG_MARGIN,
    ),
  });
  const points = (polygon: readonly IAutoMovieDrawingPoint[]): string =>
    polygon
      .map((point: IAutoMovieDrawingPoint): string => {
        const placed: { x: string; y: string } = at(point);
        return `${placed.x},${placed.y}`;
      })
      .join(" ");
  const stroke = (role: AutoMovieDrawingRole): string =>
    number(view.style.weights[role]);

  const body: string[] = [
    ...drawing.regions.map((region: IAutoMovieDrawingRegion): string =>
      tag("polygon", [
        ["class", "automovie-region"],
        ["data-space", region.space],
        ["data-cell", region.cell],
        ["data-kind", region.kind],
        ["data-finish", region.finish ?? ""],
        ["data-area", number(region.area)],
        ["points", points(region.polygon)],
        ["fill", "currentColor"],
        ["fill-opacity", "0.06"],
        ["stroke", "none"],
      ]),
    ),
    ...drawing.lines.map((line: IAutoMovieDrawingLine): string => {
      const from: { x: string; y: string } = at(line.from);
      const to: { x: string; y: string } = at(line.to);
      const dashes: readonly number[] = view.style.dashes[line.role];
      return tag("line", [
        ["class", "automovie-line"],
        ["data-owner", line.owner],
        ["data-space", line.space ?? ""],
        ["data-layer", line.layer],
        ["data-role", line.role],
        ["x1", from.x],
        ["y1", from.y],
        ["x2", to.x],
        ["y2", to.y],
        ["stroke", "currentColor"],
        ["stroke-width", stroke(line.role)],
        ...(dashes.length === 0
          ? []
          : [["stroke-dasharray", dashes.map(number).join(",")] as Attribute]),
      ]);
    }),
    ...drawing.openings.map((mark: IAutoMovieDrawingOpeningMark): string => {
      const identity: Attribute[] = [
        ["class", "automovie-opening"],
        ["data-opening", mark.opening],
        ["data-boundary", mark.boundary],
        ["data-kind", mark.kind],
        ["data-fill", mark.fill ?? ""],
        ["data-basis", mark.basis],
        ["data-width", mark.width === null ? "" : number(mark.width)],
        ["data-height", mark.height === null ? "" : number(mark.height)],
      ];
      // An opening with no outline is still carried, because the schedule
      // counts it and the sheet must agree about how many openings exist.
      return mark.polygon.length < 3
        ? tag("g", identity)
        : tag("polygon", [
            ...identity,
            ["points", points(mark.polygon)],
            ["fill", "none"],
            ["stroke", "currentColor"],
            ["stroke-width", stroke("cut")],
          ]);
    }),
    ...drawing.dimensions.map(
      (dimension: IAutoMovieDrawingDimension): string => {
        if (dimension.status === "stale")
          return tag("g", [
            ["class", "automovie-dimension"],
            ["data-id", dimension.id],
            ["data-status", "stale"],
            ["data-reason", dimension.reason ?? ""],
          ]);
        const from: { x: string; y: string } = at(dimension.from!);
        const to: { x: string; y: string } = at(dimension.to!);
        return tag("line", [
          ["class", "automovie-dimension"],
          ["data-id", dimension.id],
          ["data-status", "resolved"],
          ["data-measure", dimension.measure],
          ["data-value", number(dimension.value!)],
          ["x1", from.x],
          ["y1", from.y],
          ["x2", to.x],
          ["y2", to.y],
          ["stroke", "currentColor"],
          ["stroke-width", stroke("projected")],
        ]);
      },
    ),
    ...drawing.annotations.map(
      (annotation: IAutoMovieDrawingAnnotation): string => {
        if (annotation.status === "stale")
          return tag("g", [
            ["class", "automovie-annotation"],
            ["data-id", annotation.id],
            ["data-status", "stale"],
            ["data-reason", annotation.reason ?? ""],
          ]);
        const placed: { x: string; y: string } = at(annotation.at!);
        return `  ${tag(
          "text",
          [
            ["class", "automovie-annotation"],
            ["data-id", annotation.id],
            ["data-status", "resolved"],
            ["x", placed.x],
            ["y", placed.y],
            ["font-size", number(view.style.textHeight)],
            ["fill", "currentColor"],
          ],
          false,
        )}${xml(annotation.text)}</text>`;
      },
    ),
    ...drawing.gaps.map((gap: IAutoMovieDrawingGap): string =>
      tag("g", [
        ["class", "automovie-gap"],
        ["data-subject", gap.subject],
        ["data-status", gap.status],
        ["data-reason", gap.reason],
        ["data-remedy", gap.remedy],
      ]),
    ),
  ];

  return [
    tag(
      "svg",
      [
        ["xmlns", "http://www.w3.org/2000/svg"],
        ["width", `${number(width)}mm`],
        ["height", `${number(height)}mm`],
        ["viewBox", `0 0 ${number(width)} ${number(height)}`],
        ["data-automovie-protocol", drawing.protocol],
        ["data-automovie-view", drawing.view],
        ["data-automovie-environment", drawing.environment],
        ["data-automovie-projection", drawing.projection],
        ["data-automovie-discipline", drawing.discipline],
        ["data-automovie-scale", number(drawing.scale)],
        ["data-automovie-digest", drawing.digest],
      ],
      false,
    ),
    ...body,
    "</svg>",
  ].join("\n");
};

/** One element: indented and self-closing, or an unindented opening tag. */
const tag = (
  name: string,
  attributes: readonly Attribute[],
  selfClosing: boolean = true,
): string => {
  const written: string = attributes
    .map(([key, value]: Attribute): string => `${key}="${xml(value)}"`)
    .join(" ");
  return selfClosing ? `  <${name} ${written} />` : `<${name} ${written}>`;
};

/**
 * Format one page millimetre value to three fixed decimals.
 *
 * Rounding first keeps a value a whisker below zero from printing a sign:
 * it rounds to negative zero, which `toFixed` writes as `0.000`.
 */
const number = (value: number): string =>
  (Math.round(value * 1000) / 1000).toFixed(3);

/** Escape the five XML special characters. */
const xml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
