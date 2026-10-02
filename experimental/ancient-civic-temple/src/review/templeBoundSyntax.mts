/** Lexical normalization of the authored Korean metre-bound grammar.
 * Sign conversion, noun matching and W/2 interpretation are shared by clause
 * and relation consumers; unknown symbolic forms remain NaN. */
type Axis = "X" | "Y" | "Z";
const number = "[+−-]?\\d+(?:\\.\\d+)?";
const scalar = (s: string) => Number(s.replace("−", "-"));
const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
const escape = (s: string) => s.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
const axes: Axis[] = ["X", "Y", "Z"];

const mentions = (sentence: string, noun: string) => new RegExp(
  "(?<![\\p{L}\\p{N}])" + escape(noun) + "(?=$|[.,;:()·\\s]|은|는|이|가|을|를|의|와|과|에서|으로|로|\\s+[가-힣]+(?:은|는|이|가))", "u",
).test(sentence);
const expression = (source: string, width: number) => {
  const match = source.replaceAll("−", "-").match(/^W\/2([+-]\d+(?:\.\d+)?)?$/);
  return match ? width / 2 + Number(match[1] ?? 0) : NaN;
};


export const templeBoundSyntax = { number, scalar, near, escape, axes, mentions, expression };
