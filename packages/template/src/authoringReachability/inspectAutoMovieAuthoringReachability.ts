import type { AutoMovieAuthoringProductionKind } from "./AutoMovieAuthoringProductionKind";
import type { IAutoMovieAuthoringReachabilityRow } from "./IAutoMovieAuthoringReachabilityRow";
import { AuthoringReachabilityRules } from "./AuthoringReachabilityRules";
type AutoMovieAuthoringCapability = AuthoringReachabilityRules.AutoMovieAuthoringCapability;
type AutoMovieProductionDesignField = AuthoringReachabilityRules.AutoMovieProductionDesignField;
const PRODUCTION_DESIGN_FIELD_ROUTES = AuthoringReachabilityRules.PRODUCTION_DESIGN_FIELD_ROUTES;
const BASE_ROUTE_DEFINITIONS = AuthoringReachabilityRules.BASE_ROUTE_DEFINITIONS;
import { AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS } from "./AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS";
import { isAutoMovieAuthoringProductionKind } from "./isAutoMovieAuthoringProductionKind";
const KINDS = AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS;
const ROUTE_REGISTRY = AuthoringReachabilityRules.ROUTE_REGISTRY;

const FIELDS: ReadonlySet<string> = new Set(
  Object.keys(PRODUCTION_DESIGN_FIELD_ROUTES),
);

const CAPABILITIES: ReadonlySet<string> = new Set<AutoMovieAuthoringCapability>(
  [
    ...(Object.keys(BASE_ROUTE_DEFINITIONS) as Array<
      keyof typeof BASE_ROUTE_DEFINITIONS
    >),
    "film-sources",
    "acceptance",
    "camera-actions",
    "production-design-field",
  ],
);

const ROUTES: ReadonlySet<string> = new Set(Object.keys(ROUTE_REGISTRY));

const rowKey = (row: {
  capability: AutoMovieAuthoringCapability;
  field: AutoMovieProductionDesignField | null;
  kind: AutoMovieAuthoringProductionKind;
}): string =>
  `${row.kind}:${row.capability}${row.field === null ? "" : `:${row.field}`}`;

/** Every kind, capability, and field-level address the matrix must answer. */
const EXPECTED_ROW_KEYS: ReadonlySet<string> = new Set(
  KINDS.flatMap((kind) =>
    [...CAPABILITIES].flatMap((capability) =>
      capability === "production-design-field"
        ? [...FIELDS].map((designField) =>
            rowKey({
              capability,
              field: designField as AutoMovieProductionDesignField,
              kind,
            }),
          )
        : [
            rowKey({
              capability: capability as AutoMovieAuthoringCapability,
              field: null,
              kind,
            }),
          ],
    ),
  ),
);

const blank = (value: string | null): boolean =>
  value === null || value.trim().length === 0;

/**
 * Reject a capability matrix that hides a missing route as applicability.
 *
 * Every finding names the row it was observed on, so the command that prints
 * the matrix can refuse the whole answer rather than publish a route an author
 * would have to complete by guessing.
 */
export const inspectAutoMovieAuthoringReachability = (
  rows: readonly IAutoMovieAuthoringReachabilityRow[],
): string[] => {
  const findings: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = rowKey(row);
    if (seen.has(key)) findings.push(`${key} is duplicated.`);
    seen.add(key);
    if (isAutoMovieAuthoringProductionKind(row.kind) === false)
      findings.push(
        `${key} names unknown production kind ${JSON.stringify(row.kind)}.`,
      );
    if (CAPABILITIES.has(row.capability) === false)
      findings.push(
        `${key} names unknown capability ${JSON.stringify(row.capability)}.`,
      );
    else if (row.capability === "production-design-field") {
      if (row.field === null || FIELDS.has(row.field) === false)
        findings.push(`${key} must name one production design field.`);
    } else if (row.field !== null)
      findings.push(`${key} takes no production design field.`);
    if (
      row.choices !== null &&
      (row.choices.length === 0 ||
        row.choices.some(
          (choice, index) =>
            choice.trim().length === 0 ||
            row.choices!.indexOf(choice) !== index,
        ))
    )
      findings.push(`${key} has invalid closed choices.`);
    if (row.inapplicableReason === null) {
      for (const [name, value] of [
        ["owner", row.owner],
        ["input", row.input],
        ["consumer", row.consumer],
        ["route", row.route],
      ] as const)
        if (blank(value)) findings.push(`${key} has no ${name}.`);
      if (row.route !== null && ROUTES.has(row.route) === false)
        findings.push(
          `${key} names unknown generated-project route ${JSON.stringify(row.route)}.`,
        );
      if (row.owner !== null && /(^|\/)packages\//u.test(row.owner))
        findings.push(
          `${key} names a repository path instead of its generated-project owner.`,
        );
    } else {
      if (blank(row.inapplicableReason))
        findings.push(`${key} has a blank inapplicable reason.`);
      if (
        row.choices !== null ||
        row.owner !== null ||
        row.input !== null ||
        row.consumer !== null ||
        row.route !== null
      )
        findings.push(`${key} mixes an inapplicable reason with a route.`);
    }
  }
  for (const expected of EXPECTED_ROW_KEYS)
    if (seen.has(expected) === false) findings.push(`${expected} is missing.`);
  return findings;
};
