/**
 * 신전 뷰어의 CJS 서버. `/scene` 요청마다 production src 모듈 캐시를 비우고
 * 현재 source로 payload를 다시 만든다. 실패하면 500과 오류문을 돌려주며
 * 이전 성공 결과를 보여 주지 않는다. `/section?axis=x|z&offset=m`은 같은 방식으로
 * 현재 source의 정확한 연직 단면 조각을, `/review?grid=m`은 자가검사(npm run self-check)와 같은
 * producer의 겹침 스캔·관찰 pose·topology 결산을 돌려준다. 브라우저는 engine을 import하지 않는다.
 * 실행: production 루트에서 `npm run viewer -- --port <포트>` (기본 4175).
 */
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { parseArgs } from "node:util";

const productionRoot = resolve(__dirname, "../..");
const sourceRoot = resolve(productionRoot, "src") + sep;

/** 서버 자신을 제외한 src 모듈 캐시를 비워 다음 require가 현재 source를 읽게 한다. */
const clearSource = (): void => {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(sourceRoot) && !key.endsWith(`${sep}server.cts`)) delete require.cache[key];
  }
};

/** 현재 source로 payload와 그 source basis(자가검사와 같은 값)를 다시 만든다. */
const freshPayload = (): { basis: string; payload: unknown } => {
  clearSource();
  const basis = (require("../review/source-basis") as typeof import("../review/source-basis")).sourceBasis();
  const loaded = require("./payload") as typeof import("./payload");
  return { basis, payload: loaded.createViewerPayload() };
};

/** 현재 source로 자가검사와 같은 측정 결과를 만든다. */
const freshReview = (grid: string | null): unknown => {
  const value = grid === null ? 0.01 : Number(grid);
  if (!(value > 0)) throw new Error("grid는 양의 m 값이어야 합니다.");
  clearSource();
  const loaded = require("../review/review-payload") as typeof import("../review/review-payload");
  return loaded.createReviewPayload(value);
};

/** 현재 source로 연직 단면(X 또는 Z 평면)의 정확한 조각과 지면선을 만든다. */
const freshSection = (axis: string | null, offset: string | null): unknown => {
  if (axis !== "x" && axis !== "z") throw new Error("axis는 x 또는 z여야 합니다.");
  const value = Number(offset);
  if (offset === null || !Number.isFinite(value)) throw new Error("offset은 유한한 m 값이어야 합니다.");
  clearSource();
  const loaded = require("./section") as typeof import("./section");
  return loaded.createSectionPayload(axis, value);
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
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    if (path === "/section") {
      try {
        const section = freshSection(url.searchParams.get("axis"), url.searchParams.get("offset"));
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(section));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(error instanceof Error ? error.stack ?? error.message : String(error));
      }
      return;
    }
    if (path === "/review") {
      try {
        const review = freshReview(url.searchParams.get("grid"));
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(review));
      } catch (error) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(error instanceof Error ? error.stack ?? error.message : String(error));
      }
      return;
    }
    if (path === "/scene") {
      try {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(JSON.stringify(freshPayload()));
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
