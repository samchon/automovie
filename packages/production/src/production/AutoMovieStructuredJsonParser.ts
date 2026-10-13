import { AUTOMOVIE_STRUCTURED_JSON_MAX_JSON_NESTING_DEPTH } from "./AUTOMOVIE_STRUCTURED_JSON_MAX_JSON_NESTING_DEPTH";
import { escapeAutoMovieJsonPointer } from "./escapeAutoMovieJsonPointer";
import type { AutoMovieStructuredJsonStage } from "./AutoMovieStructuredJsonStage";
import { AutoMovieStructuredJsonError } from "./AutoMovieStructuredJsonError";

/**
 * Recursive-descent JSON grammar that owns both validation and materialization.
 *
 * @evidence contracts/common.md#principled-implementation Recursive descent validates and materializes one strictly decoded JSON text while tracking cursor and object-local decoded member names.
 * @evidence contracts/common.md#clear-and-simple-design parseAutoMovieStructuredJson owns strict UTF-8 ingress; this parser owns grammar and duplicate admission before schemas.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The explicit depth counter rejects values beyond 256; no byte budget or finite-number refinement is imposed and number suffix slicing can add quadratic copy work.
 * @evidence contracts/common.md#meaningful-documentation Documents one-shot parser state, JSON Pointer diagnostics, duplicate-name scope and fixed recursive depth policy.
 * @evidence contracts/performance.md#efficient-algorithms Includes N text scanning, token decoding and output materialization; repeated number suffix slices may copy O(N^2) units depending on host string storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Validation and materialization share a single grammar pass; no second last-wins JSON parse or retained parse cache substitutes for duplicate checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parser retains record/text only for the synchronous parse; output tree transfers to the caller and per-object name sets/recursive frames expire on success or refusal.
 */
export class AutoMovieStructuredJsonParser {

    /**
     * Current UTF-16 position consumed by this one-shot parser.
     */
    private cursor: number = 0;

    /**
     * Constructor parameter properties retain the logical record and strictly decoded text beside an initially zero cursor. Ingress allocates one parser instance for its immediately following one-shot parse.
     *
     * The constructor does not independently validate encoding/grammar or reset an instance after parsing.
     *
     * States borrowed immutable string references and the one-invocation parser lifetime.
     *
     * Two string references and one scalar cursor take constant construction work; retained text size follows the admitted input. The exact decoded text is reused by every grammar method rather than copied during construction.
     *
     * The temporary parser owns these references until its synchronous parse returns or throws; no descriptor or task is acquired.
     */
    public constructor(private readonly record: string, private readonly text: string) { }

    /**
     * Whitespace surrounds one grammar value and any trailing content is refused.
     *
     * @evidence contracts/common.md#principled-implementation Whitespace surrounds one grammar value and any trailing content is refused.
     * @evidence contracts/common.md#clear-and-simple-design The ingress owner invokes this parser once for each strictly decoded record.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A reused instance keeps its consumed cursor, so this is a one-shot parser rather than a resettable document cache.
     * @evidence contracts/common.md#meaningful-documentation States complete-root parsing and trailing-content failure.
     * @evidence contracts/performance.md#efficient-algorithms Includes the complete recursive grammar/materialization cost and trailing whitespace scan.
     * @evidence contracts/performance.md#reuse-equivalent-work The produced tree is the validation result; no independent last-wins parse is repeated.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The returned tree transfers to the ingress caller; frames/name sets expire while text remains with the temporary parser.
     */
    public parse(): unknown {
        this.whitespace();
        const value: unknown = this.value("", 0);
        this.whitespace();
        if (this.cursor !== this.text.length)
            this.syntax("unexpected content after the root value", "");
        return value;
    }

    /**
     * The current token dispatches to JSON string, object, array, keyword or number grammar after the depth guard. One dispatcher owns grammar choice for every root/member/element.
     *
     * Depth greater than 256 is a declared denial policy; unsupported tokens never receive a substitute null.
     *
     * States unknown return shape and containing pointer/depth context.
     *
     * Dispatch costs constant work plus the selected token/container parser and recursive depth. The same dispatcher is used recursively without caching values over cursor state.
     *
     * Only the selected JSON value escapes; recursion frames remain scoped to the current parse.
     */
    private value(pointer: string, depth: number): unknown {
        if (depth > AUTOMOVIE_STRUCTURED_JSON_MAX_JSON_NESTING_DEPTH)
            this.syntax(`nesting exceeds ${AUTOMOVIE_STRUCTURED_JSON_MAX_JSON_NESTING_DEPTH} containers`, pointer);
        const token: string | undefined = this.text[this.cursor];
        if (token === '"')
            return this.string(pointer);
        if (token === "{")
            return this.object(pointer, depth);
        if (token === "[")
            return this.array(pointer, depth);
        if (token === "t")
            return this.keyword("true", true, pointer);
        if (token === "f")
            return this.keyword("false", false, pointer);
        if (token === "n")
            return this.keyword("null", null, pointer);
        if (token === "-" || (token !== undefined && /[0-9]/.test(token)))
            return this.number(pointer);
        this.syntax("expected a JSON value", pointer);
    }

    /**
     * A decoded-name set is local to each object and duplicate refusal precedes child materialization; defineProperty preserves __proto__ as data. This grammar owner constructs the same object it admits, keeping sibling name scopes independent.
     *
     * Decoded escapes compare exactly without case or Unicode normalization; no last-wins duplicate escapes to schemas.
     *
     * States object-local duplicate scope, containing pointer and own writable data members.
     *
     * Visits M members, retains M names and materializes children; pointer construction/child parser costs remain included. One set handles the current object's names and is not shared across sibling objects.
     *
     * The completed object transfers to its parent; local names and parser frames expire on completion or throw.
     */
    private object(pointer: string, depth: number): Record<string, unknown> {
        this.cursor += 1;
        this.whitespace();
        const output: Record<string, unknown> = {};
        const names: Set<string> = new Set<string>();
        if (this.take("}"))
            return output;
        while (true) {
            if (this.text[this.cursor] !== '"')
                this.syntax("expected an object member name", pointer);
            const nameOffset: number = this.cursor;
            const name: string = this.string(pointer);
            if (names.has(name))
                this.fail("duplicate", nameOffset, pointer, `duplicate member ${JSON.stringify(name)}`, name);
            names.add(name);
            this.whitespace();
            if (!this.take(":"))
                this.syntax("expected ':' after member name", pointer);
            this.whitespace();
            const childPointer: string = `${pointer}/${escapeAutoMovieJsonPointer(name)}`;
            const value: unknown = this.value(childPointer, depth + 1);
            Object.defineProperty(output, name, {
                configurable: true,
                enumerable: true,
                writable: true,
                value,
            });
            this.whitespace();
            if (this.take("}"))
                return output;
            if (!this.take(","))
                this.syntax("expected ',' or '}'", pointer);
            this.whitespace();
        }
    }

    /**
     * Ordered recursive values and required separators produce a dense array with index-based pointers. Array grammar and materialization stay together below value dispatch.
     *
     * Trailing commas and missing separators are refused rather than represented as sparse slots.
     *
     * States dense ordered output and child pointer/depth propagation.
     *
     * Visits A elements plus all child parsing costs and retains A output values. The array is materialized once; no independent validation pass or sparse-array repair occurs.
     *
     * The completed array transfers to its parent and partial output expires on refusal.
     */
    private array(pointer: string, depth: number): unknown[] {
        this.cursor += 1;
        this.whitespace();
        const output: unknown[] = [];
        if (this.take("]"))
            return output;
        while (true) {
            output.push(this.value(`${pointer}/${output.length}`, depth + 1));
            this.whitespace();
            if (this.take("]"))
                return output;
            if (!this.take(","))
                this.syntax("expected ',' or ']'", pointer);
            this.whitespace();
        }
    }

    /**
     * A quoted-token scan validates escapes/control characters, then JSON.parse decodes that admitted token only. Object names and string values share escape admission while object scope owns duplicate decisions.
     *
     * Escaped lone surrogates remain valid JSON strings here; the separate canonical identity domain can later refuse them.
     *
     * States token decoding, control/escape refusal and unterminated-string byte context.
     *
     * Scans S token units and decodes its substring with proportional token/output storage. The admitted token is decoded once; no whole-document JSON.parse bypasses duplicate ownership.
     *
     * The resulting string transfers to its container; local token text expires and no handle is acquired.
     */
    private string(pointer: string): string {
        const start: number = this.cursor;
        this.cursor += 1;
        while (this.cursor < this.text.length) {
            const character: string = this.text[this.cursor]!;
            if (character === '"') {
                this.cursor += 1;
                return JSON.parse(this.text.slice(start, this.cursor)) as string;
            }
            if (character === "\\") {
                this.cursor += 1;
                const escape: string | undefined = this.text[this.cursor];
                if (escape === undefined || !'"\\/bfnrtu'.includes(escape))
                    this.syntax("invalid string escape", pointer);
                if (escape === "u") {
                    const digits: string = this.text.slice(this.cursor + 1, this.cursor + 5);
                    if (!/^[0-9a-fA-F]{4}$/.test(digits))
                        this.syntax("invalid Unicode escape", pointer);
                    this.cursor += 4;
                }
            }
            else if (character.charCodeAt(0) <= 0x1f)
                this.syntax("unescaped control character in string", pointer);
            this.cursor += 1;
        }
        this.fail("syntax", start, pointer, "unterminated string");
    }

    /**
     * The anchored JSON number grammar consumes its matched prefix and Number materializes the admitted spelling. Container/root separator checks subsequently reject unconsumed suffixes such as leading-zero continuations.
     *
     * Large exponents can yield Infinity as native JSON numeric semantics; finite application ranges require later admission.
     *
     * States grammar versus numeric refinement and cursor advancement.
     *
     * Slices the remaining N-unit suffix and scans the number token; repeated copied suffixes may contribute quadratic work/storage churn. No numeric token cache spans cursor positions; each current spelling is interpreted once.
     *
     * Only a number escapes; suffix/match text expires after the call and no handle is acquired.
     */
    private number(pointer: string): number {
        const rest: string = this.text.slice(this.cursor);
        const match: RegExpExecArray | null = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(rest);
        if (match === null)
            this.syntax("invalid number", pointer);
        this.cursor += match[0].length;
        return Number(match[0]);
    }

    /**
     * Exact true/false/null spelling advances the cursor and returns the supplied matching scalar. Value dispatch supplies the fixed keyword/scalar pairs.
     *
     * The generic helper trusts those internal pairs; it is not exposed as a general string-to-value decoder.
     *
     * States fixed spelling comparison and pointer-attributed failure.
     *
     * At most five keyword units are compared with constant extra storage. The dispatcher reuses this helper for the three scalar literals without retaining token results.
     *
     * Only the supplied scalar returns and no buffer or task is retained.
     */
    private keyword<T>(spelling: string, value: T, pointer: string): T {
        if (!this.text.startsWith(spelling, this.cursor))
            this.syntax(`expected ${spelling}`, pointer);
        this.cursor += spelling.length;
        return value;
    }

    /**
     * Only JSON space, tab, LF and CR advance the cursor. Every grammar boundary shares this whitespace owner.
     *
     * Other Unicode whitespace and a preserved leading BOM are not silently normalized into JSON syntax.
     *
     * States exact whitespace domain and in-place cursor mutation.
     *
     * Visits W consumed whitespace units with constant storage. Current cursor text is scanned once at each boundary rather than cached or rescanned from the root.
     *
     * No value is retained and no handle is acquired.
     */
    private whitespace(): void {
        while (this.text[this.cursor] === " " ||
            this.text[this.cursor] === "\t" ||
            this.text[this.cursor] === "\n" ||
            this.text[this.cursor] === "\r")
            this.cursor += 1;
    }

    /**
     * One current-character equality conditionally advances the cursor and reports success. Object/array separators share this small consuming-token primitive.
     *
     * A false match leaves the cursor unchanged for the owning grammar refusal.
     *
     * States consume-on-match semantics and no normalization.
     *
     * One character comparison and optional increment cost constant work/storage. The current cursor is authoritative; no token verdict is reused after advancement.
     *
     * Only a boolean escapes and no text or handle is retained.
     */
    private take(character: string): boolean {
        if (this.text[this.cursor] !== character)
            return false;
        this.cursor += 1;
        return true;
    }

    /**
     * The current cursor becomes the syntax failure's proving position under its containing pointer. Grammar owners share this never-returning stage adapter.
     *
     * The adapter does not catch or compensate for malformed grammar.
     *
     * States syntax stage and current-cursor attribution.
     *
     * Delegates fixed argument formatting and UTF-8 offset calculation to fail. The current failure is constructed once with current position, not cached.
     *
     * The error transfers to the ingress caller and no resource is acquired.
     */
    private syntax(detail: string, pointer: string): never {
        this.fail("syntax", this.cursor, pointer, detail);
    }

    /**
     * UTF-8 byteLength of the decoded prefix maps a UTF-16 cursor to the error's persistent-byte offset. Grammar and duplicate refusals share logical record, stage and pointer attribution.
     *
     * Strict ingress preserved BOM/text bytes, so offset mapping relies on the admitted UTF-8 scalar sequence rather than replacement decoding.
     *
     * States character-to-byte position conversion and optional duplicate member.
     *
     * Slices/encodes a prefix of up to N text units when a failure occurs; native error/stack formatting adds explanation cost. Offsets are calculated for the current first refusal and not retained in a global position table.
     *
     * The thrown error retains metadata only; prefix buffers expire and input text is not attached to the error.
     */
    private fail(stage: AutoMovieStructuredJsonStage, characterOffset: number, pointer: string, detail: string, member?: string): never {
        throw new AutoMovieStructuredJsonError(this.record, stage, Buffer.byteLength(this.text.slice(0, characterOffset), "utf8"), pointer, detail, member);
    }
}
