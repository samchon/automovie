import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/** PDF whitespace spelling used by the local indirect-reference patterns. */
const PDF_SPACE: string = "[\\0\\t\\n\\f\\r ]";

/**
 * Inspect the supported classic-xref and Catalog page-tree profile.
 *
 * Object offsets and generations must agree with the xref inventory. The page tree rejects repeated identities and mismatched parents or leaf counts. Dictionary facts come from regular expressions, not a complete PDF grammar: strings, streams and arbitrary dictionary nesting are not semantically decoded. No page box or visual content is certified.
 *
 * @evidence contracts/common.md#principled-implementation The header and terminal startxref select a classic table; Root and Pages references are read at matching in-use offsets, then visited identities and parent/count checks constrain the admitted tree.
 * @evidence contracts/common.md#clear-and-simple-design Private xref, object and page-tree helpers share one owner and return only application/pdf metadata; broader PDF decoding is not implied by this API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or inconsistent supported records throw path/family/stage failures; regex extraction cannot establish full PDF validity and is documented as such.
 * @evidence contracts/common.md#meaningful-documentation States the admitted classic-table profile, recursive page-tree checks and unsupported PDF semantics, extent and rendering.
 * @evidence contracts/performance.md#efficient-algorithms Byte conversion and initial scans cost O(B). Repeated line shifts and suffix/object scans can make xref processing quadratic in line count and traversal O(V*B); deep trees retain recursive stack risk.
 * @evidence contracts/performance.md#reuse-equivalent-work One xref map is reused for Root and page nodes; the visited set rejects duplicate identities. Object bodies are scanned per visit rather than cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The Latin-1 text, xref map and visited set are call-local, with O(B+E+V) retained data and O(depth) recursive stack. No external stream or handle is acquired.
 * @author Samchon
 */
export function inspectDesignReferencePdf(props: {
  /** Logical source path named by the exact xref or page-tree refusal. */
  path: string;

  /** Complete PDF bytes read as Latin-1 for byte-exact object offsets. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer {
  const text: string = Buffer.from(props.bytes).toString("latin1");
  if (!/^%PDF-1\.[0-7](?:\r\n|\r|\n)/.test(text))
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "header",
      "unsupported or incomplete header",
    );
  if (!/\d+[\0\t\n\f\r ]+\d+[\0\t\n\f\r ]+obj\b[\s\S]*?\bendobj\b/.test(text))
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "object",
      "no closed indirect object was found",
    );
  const closure: RegExpExecArray | null =
    /startxref[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+%%EOF(?:\r\n|\r|\n)?$/.exec(
      text,
    );
  if (closure === null)
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "closure",
      "missing startxref or terminal %%EOF",
    );
  const offset: number = Number(closure[1]);
  if (!Number.isSafeInteger(offset) || !text.startsWith("xref", offset))
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "xref",
      "startxref does not identify an xref table",
    );
  const trailer: string = text.slice(offset, closure.index);
  const xref: { entries: Map<number, IPdfXrefEntry>; root: IPdfReference } | null = inspectClassicPdfXref(trailer);
  if (xref === null)
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "trailer",
      "xref and Root trailer are incomplete",
    );
  const rootObject: string | null = readClassicPdfObject(text, xref.entries, xref.root);
  if (rootObject === null || pdfTypes(rootObject).join() !== "Catalog")
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "Root",
      "the Root reference has no matching in-use xref object",
    );
  const pages: IPdfReference[] = pdfReferences(rootObject, "Pages");
  if (pages.length !== 1)
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "Pages",
      "the Catalog must carry one Pages tree reference",
    );
  inspectClassicPdfPageTree({
    path: props.path,
    text,
    entries: xref.entries,
    root: pages[0]!,
  });
  return { media: "application/pdf" };
}

/**
 * Byte-offset and generation facts of one classic PDF cross-reference entry.
 *
 * @author Samchon
 */
interface IPdfXrefEntry {
  offset: number;
  generation: number;
  inUse: boolean;
}

/**
 * Indirect PDF object identity used by the admitted page tree.
 *
 * @author Samchon
 */
interface IPdfReference {
  object: number;
  generation: number;
}

/** Read classic table entries and the local trailer Root/Size fields. */
function inspectClassicPdfXref(
  text: string,
): {
  entries: Map<number, IPdfXrefEntry>;
  root: IPdfReference;
} | null {
  const normalized: string = text.replace(/\r\n?/g, "\n");
  const trailer: RegExpExecArray | null = /\ntrailer[\0\t\n\f ]*<<([\s\S]*)>>[\0\t\n\f ]*$/.exec(
    normalized,
  );
  if (trailer === null) return null;
  const lines: string[] = normalized.slice(0, trailer.index).split("\n");
  if (lines.shift() !== "xref") return null;
  const entries: Map<number, IPdfXrefEntry> = new Map<number, IPdfXrefEntry>();
  while (lines.length !== 0) {
    const heading: RegExpExecArray | null = /^(\d+)[ \t]+(\d+)$/.exec(lines.shift()!);
    if (heading === null) return null;
    const first: number = Number(heading[1]);
    const count: number = Number(heading[2]);
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(count) ||
      count < 1
    )
      return null;
    for (let index: number = 0; index < count; ++index) {
      const entry: RegExpExecArray | null = /^(\d{10})[ \t]+(\d{5})[ \t]+([nf])[ \t]*$/.exec(
        lines.shift() ?? "",
      );
      if (entry === null || entries.has(first + index)) return null;
      entries.set(first + index, {
        offset: Number(entry[1]),
        generation: Number(entry[2]),
        inUse: entry[3] === "n",
      });
    }
  }
  const dictionary: string = trailer[1]!;
  const roots: RegExpExecArray[] = [
    ...dictionary.matchAll(
      /\/Root[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+R\b/g,
    ),
  ];
  const sizes: RegExpExecArray[] = [...dictionary.matchAll(/\/Size[\0\t\n\f\r ]+(\d+)\b/g)];
  if (roots.length !== 1 || sizes.length !== 1) return null;
  const root: IPdfReference = {
    object: Number(roots[0]![1]),
    generation: Number(roots[0]![2]),
  };
  const size: number = Number(sizes[0]![1]);
  if (
    !Number.isSafeInteger(root.object) ||
    !Number.isSafeInteger(root.generation) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    root.object >= size ||
    [...entries.keys()].some((object: number) : boolean => object >= size)
  )
    return null;
  return { entries, root };
}

/** Match one in-use object's header and first endobj at its declared offset. */
function readClassicPdfObject(
  text: string,
  entries: ReadonlyMap<number, IPdfXrefEntry>,
  reference: IPdfReference,
): string | null {
  const entry: IPdfXrefEntry | undefined = entries.get(reference.object);
  if (
    entry === undefined ||
    entry.inUse === false ||
    entry.generation !== reference.generation
  )
    return null;
  return (
    new RegExp(
      `^${reference.object}${PDF_SPACE}+${reference.generation}${PDF_SPACE}+obj\\b([\\s\\S]*?)\\bendobj\\b`,
    ).exec(text.slice(entry.offset))?.[1] ?? null
  );
}

/** Extract the local Type-name pattern without parsing arbitrary dictionaries. */
function pdfTypes(body: string): string[] { return [...body.matchAll(/\/Type[\0\t\n\f\r ]+\/([A-Za-z]+)\b/g)].map(
    (match: RegExpExecArray) : string => match[1]!,
  ); }

/** Extract matching indirect references for one fixed local dictionary key. */
function pdfReferences(body: string, key: string): IPdfReference[] { return [
    ...body.matchAll(
      new RegExp(
        `/${key}${PDF_SPACE}+(\\d+)${PDF_SPACE}+(\\d+)${PDF_SPACE}+R\\b`,
        "g",
      ),
    ),
  ].map((match: RegExpExecArray) : IPdfReference => ({
    object: Number(match[1]),
    generation: Number(match[2]),
  })); }

/** Traverse the admitted page tree with identity, parent and leaf-count checks. */
function inspectClassicPdfPageTree(props: {
  path: string;
  text: string;
  entries: ReadonlyMap<number, IPdfXrefEntry>;
  root: IPdfReference;
}): void {
  const visited: Set<string> = new Set<string>();
  function visit(
    reference: IPdfReference,
    parent: IPdfReference | null,
  ): number {
    const identity: string = `${reference.object}:${reference.generation}`;
    if (visited.has(identity))
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "the Pages tree contains a cycle or repeated child",
      );
    visited.add(identity);
    const body: string | null = readClassicPdfObject(props.text, props.entries, reference);
    if (body === null)
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "a Pages tree reference has no matching in-use xref object",
      );
    const types: string[] = pdfTypes(body);
    if (types.length !== 1 || (types[0] !== "Pages" && types[0] !== "Page"))
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "every Pages tree object must declare one Page or Pages type",
      );
    const parents: IPdfReference[] = pdfReferences(body, "Parent");
    if (
      parent === null
        ? parents.length !== 0 || types[0] !== "Pages"
        : parents.length !== 1 ||
          parents[0]!.object !== parent.object ||
          parents[0]!.generation !== parent.generation
    )
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "each non-root page-tree object must point to its exact parent",
      );
    if (types[0] === "Page") return 1;
    const kids: RegExpExecArray[] = [...body.matchAll(/\/Kids[\0\t\n\f\r ]*\[([^\]]*)\]/g)];
    const counts: RegExpExecArray[] = [...body.matchAll(/\/Count[\0\t\n\f\r ]+(\d+)\b/g)];
    if (kids.length !== 1 || counts.length !== 1)
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "each Pages node must carry one Kids array and Count",
      );
    const children: IPdfReference[] = [
      ...kids[0]![1]!.matchAll(/(\d+)[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+R\b/g),
    ].map((match: RegExpExecArray) : IPdfReference => ({
      object: Number(match[1]),
      generation: Number(match[2]),
    }));
    const residue: string = kids[0]![1]!
      .replace(/\d+[\0\t\n\f\r ]+\d+[\0\t\n\f\r ]+R\b/g, "")
      .trim();
    const declared: number = Number(counts[0]![1]);
    if (!Number.isSafeInteger(declared) || residue !== "")
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "the Kids array and Count must use bounded indirect identities",
      );
    const measured: number = children.reduce(
      (sum: number, child: IPdfReference) : number => sum + visit(child, reference),
      0,
    );
    if (measured !== declared)
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        `page-tree Count ${declared} does not match ${measured} leaves`,
      );
    return measured;
  }
  visit(props.root, null);
}
