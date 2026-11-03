import { HumanAnatomyAudit } from "../HumanAnatomyAudit";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The seam table of a seam test: one line per person and declared seam with
 * its gap, normal angle, crease and curvature jump, each against its limit,
 * and the seam's verdict, so the owner reads every seam, passing or red, from
 * one run. It reads the rows `HumanEventSeamRows.rows` returns, four per seam
 * in the order gap, angle, crease, jump, and prints the place of each red
 * reading under its line.
 */
export namespace HumanEventSeamTable {
  /** A row collector and the table of what it collected. */
  export interface ICollector {
    /** The rows of one person, recorded as they pass through. */
    rowsOf: (person: string) => IRow[];

    /** The table of every row recorded so far. */
    format: () => string;
  }

  /**
   * Wrap a seam test's rows so its table can be printed whatever the test's
   * verdict.
   *
   * @param label The seam family, the table's title.
   * @param rowsOf The rows of one person, four per seam.
   */
  export function collect(label: string, rowsOf: (person: string) => IRow[]): ICollector {
    const all: IRow[] = [];
    return {
      rowsOf: (person: string): IRow[] => {
        const rows: IRow[] = rowsOf(person);
        all.push(...rows);
        return rows;
      },
      format: (): string => format(label, all),
    };
  }

  /**
   * The table of seam rows, four per seam.
   *
   * @param label The seam family.
   * @param rows The rows, four per seam in the order of `HumanEventSeamRows.rows`.
   */
  export function format(label: string, rows: readonly IRow[]): string {
    const lines: string[] = [
      `${label} seam table (limits: gap mm, angle deg, crease mm both signs, curvature jump 1/mm; "read" = no limit for the declared class)`,
      `${"person".padEnd(10)} ${"seam".padEnd(34)} ${"gap/lim".padEnd(13)} ${"angle/lim".padEnd(15)} ${"crease/lim".padEnd(13)} ${"jump/lim".padEnd(18)} class  verdict`,
    ];
    for (let i: number = 0; i + 3 < rows.length; i += 4) {
      const [gap, angle, crease, jump] = [rows[i]!, rows[i + 1]!, rows[i + 2]!, rows[i + 3]!];
      const seam: string = gap.site.slice(5, gap.site.indexOf(": "));
      const g2: boolean = Number.isFinite(jump.high);
      const red: IRow[] = [gap, angle, crease, jump].filter((r: IRow): boolean => !HumanAnatomyAudit.passes(r));
      lines.push(
        [
          gap.person.padEnd(10),
          seam.padEnd(34),
          `${gap.value.toFixed(2)}/${gap.high}`.padEnd(13),
          `${angle.value.toFixed(3)}/${angle.high}`.padEnd(15),
          `${crease.value.toFixed(2)}/${crease.high}`.padEnd(13),
          `${jump.value.toFixed(5)}/${g2 ? jump.high.toFixed(5) : "read"}`.padEnd(18),
          (g2 ? "G2" : "G1").padEnd(6),
          red.length === 0 ? "pass" : `RED ${red.length}`,
        ].join(" "),
      );
      for (const r of red) lines.push(`    red: ${r.site.slice(r.site.indexOf(": ") + 2)}`);
    }
    return lines.join("\n");
  }
}
