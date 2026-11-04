import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import type { IHumanDebugCaptureArguments } from "./IHumanDebugCaptureArguments";

/**
 * Read the capture CLI's arguments.
 *
 * `--origin <url>` names the viewer (default `http://127.0.0.1:<AUTOMOVIE_HUMAN_PORT or HUMAN_DEBUG_ROUTES.port>`),
 * `--out <directory>` the output directory, `--base <text>` the search text every shot starts
 * from, and each `--shot <name>:<text>` one shot. In search texts `;` stands for `&`.
 *
 * @param argv Arguments after the program name.
 * @returns The arguments; a missing `--out` or shot, or a bad shot name, throws.
 */
export function parseHumanDebugCaptureArguments(argv: readonly string[]): IHumanDebugCaptureArguments {
  const option: (name: string) => string | undefined = (name: string): string | undefined => {
    const at: number = argv.indexOf("--" + name);
    return at < 0 ? undefined : argv[at + 1];
  };
  const text: (value: string) => string = (value: string): string => value.replace(/;/g, "&");
  const shots: { name: string; query: string }[] = argv.flatMap((value: string, k: number): { name: string; query: string }[] => {
    if (value !== "--shot") return [];
    const shot: string = argv[k + 1] ?? "";
    const at: number = shot.indexOf(":");
    return [{ name: at < 0 ? shot : shot.slice(0, at), query: at < 0 ? "" : text(shot.slice(at + 1)) }];
  });
  const out: string | undefined = option("out");
  if (out === undefined || shots.length === 0) throw new Error("--out <directory> and at least one --shot <name>:<query> are required");
  for (const shot of shots)
    if (!/^[A-Za-z0-9._-]+$/.test(shot.name)) throw new Error("Shot names are letters, digits, . _ -: " + shot.name);
  return {
    origin: option("origin") ?? "http://127.0.0.1:" + (process.env.AUTOMOVIE_HUMAN_PORT ?? String(HUMAN_DEBUG_ROUTES.port)),
    out,
    base: text(option("base") ?? ""),
    shots,
  };
}
