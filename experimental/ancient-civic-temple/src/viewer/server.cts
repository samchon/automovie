/**
 * 신전 뷰어의 CJS 서버. `/scene` 요청마다 production src 모듈 캐시를 비우고
 * 현재 source로 payload를 다시 만든다. 실패하면 500과 오류문을 돌려주며
 * 이전 성공 결과를 보여 주지 않는다. 브라우저는 engine을 import하지 않는다.
 * 실행: production 루트에서 `npm run viewer -- --port <포트>` (기본 4175).
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { parseArgs } from "node:util";

const productionRoot = resolve(__dirname, "../..");
const sourceRoot = resolve(productionRoot, "src") + sep;

/** 저작 입력 bytes의 해시. 관찰 기록의 source revision 식별자다. */
const sourceBasis = async (): Promise<string> => {
  const hash = createHash("sha256");
  const visit = async (relative: string): Promise<void> => {
    const entries = await readdir(resolve(productionRoot, relative), { withFileTypes: true });
    for (const item of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const child = `${relative}/${item.name}`;
      if (item.isDirectory()) await visit(child);
      else if (item.isFile()) hash.update(child).update(await readFile(resolve(productionRoot, child)));
    }
  };
  for (const directory of ["src", "public", "docs/spaces", "docs/settings"]) await visit(directory);
  for (const file of ["package.json", "lint.config.ts"]) hash.update(file).update(await readFile(resolve(productionRoot, file)));
  return hash.digest("hex").slice(0, 16);
};

/** 서버 자신을 제외한 src 모듈을 다시 읽어 현재 source의 payload를 만든다. */
const freshPayload = (): unknown => {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(sourceRoot) && !key.endsWith(`${sep}server.cts`)) delete require.cache[key];
  }
  const loaded = require("./payload") as typeof import("./payload");
  return loaded.createViewerPayload();
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({ options: { port: { type: "string", default: "4175" } } });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("--port는 1~65535 정수여야 합니다.");
  const threeBuild = dirname(require.resolve("three"));
  const files = new Map([
    ["/", resolve(productionRoot, "public/index.html")],
    ["/viewer.css", resolve(productionRoot, "public/viewer.css")],
    ["/src/viewer/client.mjs", resolve(productionRoot, "src/viewer/client.mjs")],
    ["/src/viewer/scene.mjs", resolve(productionRoot, "src/viewer/scene.mjs")],
    ["/vendor/three.module.js", resolve(threeBuild, "three.module.js")],
    ["/vendor/three.core.js", resolve(threeBuild, "three.core.js")],
    ["/vendor/OrbitControls.js", resolve(threeBuild, "../examples/jsm/controls/OrbitControls.js")],
  ]);
  const handle = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    if (path === "/scene") {
      try {
        const basis = await sourceBasis();
        const payload = freshPayload();
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(JSON.stringify({ basis, payload }));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(error instanceof Error ? error.stack ?? error.message : String(error));
      }
      return;
    }
    const file = files.get(path);
    if (file === undefined) {
      response.writeHead(404).end();
      return;
    }
    const type = file.endsWith(".html") ? "text/html; charset=utf-8"
      : file.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
    response.writeHead(200, { "Content-Type": type }).end(await readFile(file));
  };
  const server = createServer((request, response) => {
    handle(request, response).catch((error: unknown) => {
      console.error(error);
      response.destroy();
    });
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`신전 뷰어: http://127.0.0.1:${port}/`);
  });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
