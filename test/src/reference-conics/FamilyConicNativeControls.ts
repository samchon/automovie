import {
  AutoMovieHumanConicSection as Section,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import { AutoMovieHumanF1Placing as T } from "@automovie/human/capture";
import type { IAutoMovieHumanF1 } from "@automovie/interface";

/** Existing inventory metadata and actual signed control receipts, without generating geometry. */
export namespace FamilyConicNativeControls {
  /** Exact metadata schema of the independently saved inventory, never a new count.
   * @evidence contracts/development/design.md#principled-representation Keeps the original semantic row, unit, frame, segment and occurrence count without deriving independent degrees of freedom.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Every member is consumed when joining actual controls and local placing to its historical metadata.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Metadata is not a clinical observation, regenerated count or fabricated private-initializer receipt.
   * @evidence contracts/development/common.md#meaningful-documentation Members retain the saved inventory schema and explicitly qualified meanings.
   */
  export interface IRow {
    /** Historical control group. */
    group: string;
    /** Original logical family, or the inventory's dash for placing/constants. */
    family: string;
    /** Original semantic control/symbol label. */
    field: string;
    /** Original declared unit; mixed rows are split by actual scalar addresses below. */
    unit: string;
    /** Original chart or source-file address. */
    frame: string;
    /** Original segment owner. */
    segment: string;
    /** Original material range text. */
    stations: string;
    /** Historical occurrence count, not independent DOF. */
    count: number;
    /** Original semantic role. */
    role: string;
    /** Original meaning and qualifications; no new anatomical identification. */
    anatomy: string;
  }

  /**
   * Bidirectional plain-data residual addresses, including absent/extra keys and array entries.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Walks the union of object keys and both array lengths; only two finite numeric values receive a signed residual. Shape/owner mismatch remains unavailable rather than a zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive data walk serves raw controls, actual local placing and source2 receipts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing and extra values cannot disappear by traversing only the expected side; no numeric tolerance or geometry expectation is invented.
   * @evidence contracts/development/common.md#meaningful-documentation Caller supplies each scalar's semantic unit; this helper never merges units into an error budget.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the two plain-data trees apart from bounded object-key set construction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure data comparison owns no effects or repeated calculation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only caller-owned address rows survive the synchronous walk.
   */
  export function differences(
    actual: unknown,
    expected: unknown,
    address: string,
  ): {
    address: string;
    actual: number | null;
    expected: number | null;
    signed: number | null;
    unavailable?: string;
  }[] {
    if (typeof actual === "number" && typeof expected === "number")
      return [
        {
          address,
          actual,
          expected,
          signed:
            Number.isFinite(actual) && Number.isFinite(expected)
              ? actual - expected
              : null,
          ...(Number.isFinite(actual) && Number.isFinite(expected)
            ? {}
            : { unavailable: "nonfinite scalar" }),
        },
      ];
    if (Array.isArray(actual) || Array.isArray(expected)) {
      if (!Array.isArray(actual) || !Array.isArray(expected))
        return [
          {
            address,
            actual: null,
            expected: null,
            signed: null,
            unavailable: "array/owner shape differs",
          },
        ];
      return [
        ...(actual.length === expected.length
          ? []
          : [
              {
                address: address + ".length",
                actual: actual.length,
                expected: expected.length,
                signed: null,
                unavailable: "array length differs",
              },
            ]),
        ...Array.from(
          { length: Math.max(actual.length, expected.length) },
          (_, k: number) =>
            differences(actual[k], expected[k], address + "[" + k + "]"),
        ).flat(),
      ];
    }
    if (
      (actual !== null && typeof actual === "object") ||
      (expected !== null && typeof expected === "object")
    ) {
      if (
        actual === null ||
        typeof actual !== "object" ||
        expected === null ||
        typeof expected !== "object"
      )
        return [
          {
            address,
            actual: null,
            expected: null,
            signed: null,
            unavailable: "object/owner shape differs",
          },
        ];
      return [
        ...new Set([...Object.keys(actual), ...Object.keys(expected)]),
      ].flatMap((key: string) =>
        Object.hasOwn(actual, key) && Object.hasOwn(expected, key)
          ? differences(
              (actual as Record<string, unknown>)[key],
              (expected as Record<string, unknown>)[key],
              address + "." + key,
            )
          : [
              {
                address: address + "." + key,
                actual: null,
                expected: null,
                signed: null,
                unavailable: "object key missing or extra",
              },
            ],
      );
    }
    return actual === expected
      ? []
      : [
          {
            address,
            actual: null,
            expected: null,
            signed: null,
            unavailable:
              "missing/extra or non-numeric owner differs: " +
              String(actual) +
              " vs " +
              String(expected),
          },
        ];
  }

  /**
   * Attach actual raw controls and local placing readings to the existing inventory's stable row ids.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the saved semantic inventory as metadata and compares actual families/frames/datums against accepted authored inputs. Complete family-set and per-scalar address unions prevent omitted controls from receiving zero residuals.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Family controls and the five existing placing groups retain their historical ids; constants link their original symbols to independent actual AST-consumer comparison and the maintained rule ledger.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not recount DOF, reclassify historical anatomy as observed tissue, infer private literal arrays from their counts, or combine mm/rad/share/direction errors into one budget.
   * @evidence contracts/development/common.md#meaningful-documentation Raw skeleton course controls are separate from derived native skin-axis jets. Constant initializer-level signed evidence is explicitly unavailable in the saved artifacts.
   * @evidence contracts/development/implementation.md#efficient-algorithms One bounded family/control walk and one historical-row join precede original frame operations; no part, loft or mesh is generated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Consumes the existing Inventory/Count metadata and existing SegmentFrame operations rather than rebuilding the inventory or a frame algebra.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Produces plain evidence rows from borrowed immutable inputs, retaining no source reader or global cache.
   */
  export function read(
    assembly: IAutoMovieHumanF1.IAssembly,
    original: IAutoMovieHumanF1.IAssembly,
    inventory: readonly IRow[],
  ): unknown {
    const indexed = inventory.map((row, id: number) => ({ id, ...row }));
    const families = [
      ...new Set([
        ...original.families.map((f) => f.name),
        ...assembly.families.map((f) => f.name),
      ]),
    ].map((name: string): unknown => {
      const actual = assembly.families.find((f): boolean => f.name === name),
        prior = original.families.find((f): boolean => f.name === name);
      if (actual === undefined || prior === undefined)
        return {
          name,
          unavailable:
            actual === undefined
              ? "expected original family missing"
              : "unexpected actual family",
        };
      if (
        assembly.families.filter((f): boolean => f.name === name).length !==
          1 ||
        original.families.filter((f): boolean => f.name === name).length !== 1
      )
        return { name, unavailable: "duplicate logical family" };
      const metadata = indexed.filter((row): boolean => row.family === name);
      const fieldNames = [
        ...new Set(
          metadata
            .filter(
              (row): boolean =>
                (row.group === "wall" || row.group === "cutter") &&
                row.role !== "course",
            )
            .map((row): string => row.field),
        ),
      ];
      const units = Section.units(prior.layout);
      const unit = (address: string): string => {
        if (address.endsWith(".length")) return "count";
        const values = address.slice(name.length).match(/^\.values\[(\d+)\]/);
        if (values !== null) {
          const owned = units[Number(values[1])];
          return owned === "angle" ? "rad" : (owned ?? "unavailable");
        }
        if (/\.up\[|\.axis\[|\.turn\[/.test(address))
          return "direction component";
        if (/\.phases\[|\.roll\.values\[/.test(address)) return "rad";
        if (/\.rows$|\.columns$|\.rings$/.test(address)) return "count";
        if (
          /\.knots\[|\.centres\[|\.halves\[|\.stations\[|\.heights\[|\.shift\[|\.from$|\.tip$|\.centre\[/.test(
            address,
          )
        )
          return "mm";
        return "non-numeric ownership";
      };
      const raw = (family: typeof actual) => ({
        centres: family.centres,
        up: family.up,
        halves: family.halves,
        roll: family.roll ?? null,
        knots: family.knots,
        values: family.values,
        tips: family.tips ?? null,
        reliefs: family.reliefs ?? [],
      });
      const rows = differences(raw(actual), raw(prior), name).map((row) => {
        const address = row.address.slice(name.length),
          match = address.match(/^\.values\[(\d+)\](?:\[(\d+)\])?/);
        let linked: typeof indexed = [];
        if (match !== null) {
          const field = fieldNames[Number(match[1])],
            station =
              match[2] === undefined
                ? undefined
                : prior.knots[Number(match[2])];
          linked = metadata.filter((entry): boolean => {
            if (entry.field !== field) return false;
            if (station === undefined) return true;
            const bounds = entry.stations.split(" .. ").map(Number);
            return (
              bounds.length === 2 &&
              station >= bounds[0]! &&
              station <= bounds[1]!
            );
          });
        } else if (address.startsWith(".reliefs[")) {
          const index = Number(address.match(/^\.reliefs\[(\d+)\]/)?.[1]),
            net = prior.reliefs?.[index]?.name;
          linked = metadata.filter(
            (entry): boolean =>
              entry.group === "net" &&
              (entry.field === net || entry.field.startsWith(net + " [")),
          );
        } else if (address.startsWith(".knots["))
          linked = metadata.filter(
            (entry): boolean => entry.field === "knot stations",
          );
        else if (address.startsWith(".halves["))
          linked = metadata.filter(
            (entry): boolean => entry.field === "turn halves",
          );
        else if (address.startsWith(".tips["))
          linked = metadata.filter(
            (entry): boolean =>
              entry.field === "closed ends (from, tip, centre)",
          );
        else if (address.startsWith(".roll"))
          linked = metadata.filter((entry): boolean =>
            entry.field.startsWith("roll of the chart"),
          );
        else if (
          address.startsWith(".centres[") ||
          address.startsWith(".up[")
        ) {
          const index = Number(address.match(/^\.centres\[(\d+)\]/)?.[1]);
          const datum = address.startsWith(".up[")
            ? name + ".up"
            : T.COURSES[name]?.[index];
          if (datum !== undefined)
            linked = indexed.filter(
              (entry): boolean =>
                entry.group === "placing" &&
                entry.field
                  .slice(entry.field.indexOf(":") + 1)
                  .trim()
                  .split(", ")
                  .includes(datum),
            );
        }
        return {
          ...row,
          unit: unit(row.address),
          historicalRowIds: linked.map((entry): number => entry.id),
          metadataLinkScope:
            linked.length === 0
              ? "unavailable exact historical row; raw source address retained"
              : "actual field and material segment / net / placing datum",
          ...(linked.length === 0
            ? {
                metadataUnavailable:
                  "No historical row is substituted from the rest of the family",
              }
            : {}),
        };
      });
      const maximumByUnit: Record<string, number> = {};
      for (const row of rows)
        if (row.signed !== null)
          maximumByUnit[row.unit] = Math.max(
            maximumByUnit[row.unit] ?? 0,
            Math.abs(row.signed),
          );
      return {
        name,
        metadata,
        sourceFieldOrderAdmitted: fieldNames.length === prior.values.length,
        units,
        layout: prior.layout,
        layoutIdentical:
          JSON.stringify(actual.layout) === JSON.stringify(prior.layout),
        rows,
        maximumByUnit,
        courseScope:
          "raw supplied skeleton-course controls; actual derived skin-axis functions are read separately on sources",
        identifiability:
          "qualified normalized F1 controls P; no bone/muscle/fat identification",
        ledger: "packages/human/docs/work/provisional-conic-rule-ledger.md",
      };
    });
    const placing = indexed
      .filter((row): boolean => row.group === "placing")
      .map((row): unknown => {
        try {
          const frame = assembly.frames.get(row.segment);
          if (frame === undefined)
            throw new Error("actual segment frame absent");
          if (row.field.startsWith("chain:")) {
            const index = T.CHAIN.findIndex(
                (joint): boolean => joint.name === row.segment,
              ),
              prior = T.CHAIN[index];
            if (prior === undefined)
              throw new Error("stored logical chain address absent");
            const parent =
              prior.parent === null
                ? F.columns(
                    [0, 0, 0],
                    [
                      [1, 0, 0],
                      [0, 1, 0],
                      [0, 0, 1],
                    ],
                  )
                : assembly.frames.get(prior.parent);
            if (parent === undefined)
              throw new Error("actual parent frame absent");
            const actual = F.relative(parent, frame);
            return {
              row,
              sourceAddress: "AutoMovieHumanF1Placing.CHAIN[" + index + "]",
              offset: differences(
                actual.offset,
                prior.offset,
                row.segment + ".offset",
              ).map((r) => ({ ...r, unit: "mm" })),
              rotation: differences(
                actual.rotation,
                prior.rotation,
                row.segment + ".rotation",
              ).map((r) => ({ ...r, unit: "rotation matrix component" })),
            };
          }
          const names = row.field
            .slice(row.field.indexOf(":") + 1)
            .trim()
            .split(", ");
          return {
            row,
            readings: names.map((name: string): unknown => {
              const direction: boolean = row.field.startsWith("directions:");
              const prior = direction ? T.DIRECTIONS[name] : T.POINTS[name];
              if (prior === undefined)
                throw new Error("original placed address absent: " + name);
              const actual = direction
                ? F.toLocalDirection(frame, assembly.direction(name))
                : F.toLocal(frame, assembly.point(name));
              return {
                name,
                sourceAddress:
                  "AutoMovieHumanF1Placing." +
                  (direction ? "DIRECTIONS" : "POINTS") +
                  "." +
                  name +
                  ".local",
                unit: direction ? "direction component" : "mm",
                rows: differences(actual, prior.local, name),
              };
            }),
          };
        } catch (error: unknown) {
          return {
            row,
            unavailable: error instanceof Error ? error.message : String(error),
          };
        }
      });
    const constants = indexed
      .filter((row): boolean => row.group === "constant")
      .map((row) => ({
        row,
        sourceSymbol: row.field,
        sourceAddress: row.frame,
        disposition:
          /^(ARMSCYE_MARGIN_MM|ARMPIT_DROP_MM|ARMPIT_ROUND_MM|ARMPIT_SINK_MM|BREAST_CHEST_MM|NOSE_MARGIN_MM|NOSE_SUBNASAL_MM)$/.test(
            row.field,
          )
            ? "legacy posed/custom-chain helper P; fixed-native parent footprints directly own normalized accepted controls"
            : "shared original shape convention/derived controls P; actual tree/source consumer compared independently",
        signedConsumerOwner:
          "independent Ownership before.payload root/fills/parts and this round's forced native-F1 source2",
        initializerSignedEvidence: {
          unavailable:
            "Inventory/Count retain symbol/source/count, not private initializer literal arrays with stable numeric addresses; source presence is not such a receipt",
        },
        ledger: "packages/human/docs/work/provisional-conic-rule-ledger.md",
      }));
    return {
      families,
      placing,
      constants,
      historicalRows: inventory.length,
      meaning:
        "metadata and signed control readings, not a new DOF count or anatomical acceptance",
    };
  }
}
