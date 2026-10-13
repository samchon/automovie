import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { invalidDesignReferenceContainer } from "./invalidDesignReferenceContainer";

/**
 * Admit one classic-xref PDF through its exact object offsets and closed Catalog page tree. Page extents remain unsupported; no document content executes.
 */
const PDF_SPACE = "[\\0\\t\\n\\f\\r ]";

/** Require a classic xref inventory and a closed Catalog page tree. */
export const inspectDesignReferencePdf = (props: {
  /** Logical source path named by the exact xref or page-tree refusal. */
  path: string;

  /** Complete PDF bytes read as Latin-1 for byte-exact object offsets. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer => {
  const text = Buffer.from(props.bytes).toString("latin1");
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
  const closure =
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
  const offset = Number(closure[1]);
  if (!Number.isSafeInteger(offset) || !text.startsWith("xref", offset))
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "xref",
      "startxref does not identify an xref table",
    );
  const trailer = text.slice(offset, closure.index);
  const xref = inspectClassicPdfXref(trailer);
  if (xref === null)
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "trailer",
      "xref and Root trailer are incomplete",
    );
  const rootObject = readClassicPdfObject(text, xref.entries, xref.root);
  if (rootObject === null || pdfTypes(rootObject).join() !== "Catalog")
    throw invalidDesignReferenceContainer(
      props.path,
      "PDF",
      "Root",
      "the Root reference has no matching in-use xref object",
    );
  const pages = pdfReferences(rootObject, "Pages");
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
};

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

const inspectClassicPdfXref = (
  text: string,
): {
  entries: Map<number, IPdfXrefEntry>;
  root: IPdfReference;
} | null => {
  const normalized = text.replace(/\r\n?/g, "\n");
  const trailer = /\ntrailer[\0\t\n\f ]*<<([\s\S]*)>>[\0\t\n\f ]*$/.exec(
    normalized,
  );
  if (trailer === null) return null;
  const lines = normalized.slice(0, trailer.index).split("\n");
  if (lines.shift() !== "xref") return null;
  const entries = new Map<number, IPdfXrefEntry>();
  while (lines.length !== 0) {
    const heading = /^(\d+)[ \t]+(\d+)$/.exec(lines.shift()!);
    if (heading === null) return null;
    const first = Number(heading[1]);
    const count = Number(heading[2]);
    if (
      !Number.isSafeInteger(first) ||
      !Number.isSafeInteger(count) ||
      count < 1
    )
      return null;
    for (let index = 0; index < count; ++index) {
      const entry = /^(\d{10})[ \t]+(\d{5})[ \t]+([nf])[ \t]*$/.exec(
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
  const dictionary = trailer[1]!;
  const roots = [
    ...dictionary.matchAll(
      /\/Root[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+R\b/g,
    ),
  ];
  const sizes = [...dictionary.matchAll(/\/Size[\0\t\n\f\r ]+(\d+)\b/g)];
  if (roots.length !== 1 || sizes.length !== 1) return null;
  const root = {
    object: Number(roots[0]![1]),
    generation: Number(roots[0]![2]),
  };
  const size = Number(sizes[0]![1]);
  if (
    !Number.isSafeInteger(root.object) ||
    !Number.isSafeInteger(root.generation) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    root.object >= size ||
    [...entries.keys()].some((object) => object >= size)
  )
    return null;
  return { entries, root };
};

const readClassicPdfObject = (
  text: string,
  entries: ReadonlyMap<number, IPdfXrefEntry>,
  reference: IPdfReference,
): string | null => {
  const entry = entries.get(reference.object);
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
};

const pdfTypes = (body: string): string[] =>
  [...body.matchAll(/\/Type[\0\t\n\f\r ]+\/([A-Za-z]+)\b/g)].map(
    (match) => match[1]!,
  );

const pdfReferences = (body: string, key: string): IPdfReference[] =>
  [
    ...body.matchAll(
      new RegExp(
        `/${key}${PDF_SPACE}+(\\d+)${PDF_SPACE}+(\\d+)${PDF_SPACE}+R\\b`,
        "g",
      ),
    ),
  ].map((match) => ({
    object: Number(match[1]),
    generation: Number(match[2]),
  }));

const inspectClassicPdfPageTree = (props: {
  path: string;
  text: string;
  entries: ReadonlyMap<number, IPdfXrefEntry>;
  root: IPdfReference;
}): void => {
  const visited = new Set<string>();
  const visit = (
    reference: IPdfReference,
    parent: IPdfReference | null,
  ): number => {
    const identity = `${reference.object}:${reference.generation}`;
    if (visited.has(identity))
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "the Pages tree contains a cycle or repeated child",
      );
    visited.add(identity);
    const body = readClassicPdfObject(props.text, props.entries, reference);
    if (body === null)
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "a Pages tree reference has no matching in-use xref object",
      );
    const types = pdfTypes(body);
    if (types.length !== 1 || (types[0] !== "Pages" && types[0] !== "Page"))
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "every Pages tree object must declare one Page or Pages type",
      );
    const parents = pdfReferences(body, "Parent");
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
    const kids = [...body.matchAll(/\/Kids[\0\t\n\f\r ]*\[([^\]]*)\]/g)];
    const counts = [...body.matchAll(/\/Count[\0\t\n\f\r ]+(\d+)\b/g)];
    if (kids.length !== 1 || counts.length !== 1)
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "each Pages node must carry one Kids array and Count",
      );
    const children = [
      ...kids[0]![1]!.matchAll(/(\d+)[\0\t\n\f\r ]+(\d+)[\0\t\n\f\r ]+R\b/g),
    ].map((match) => ({
      object: Number(match[1]),
      generation: Number(match[2]),
    }));
    const residue = kids[0]![1]!
      .replace(/\d+[\0\t\n\f\r ]+\d+[\0\t\n\f\r ]+R\b/g, "")
      .trim();
    const declared = Number(counts[0]![1]);
    if (!Number.isSafeInteger(declared) || residue !== "")
      throw invalidDesignReferenceContainer(
        props.path,
        "PDF",
        "Pages",
        "the Kids array and Count must use bounded indirect identities",
      );
    const measured = children.reduce(
      (sum, child) => sum + visit(child, reference),
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
  };
  visit(props.root, null);
};
