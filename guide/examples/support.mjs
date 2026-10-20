/** 공통 실습 도구: 임시 자작 앱과 공개 CLI만 사용한다.
 * 원본 REA: Copyright (c) 2026 morluto, MIT (../../LICENSE).
 * 요구 사항: .nvmrc의 Node.js, npm ci, npm run build:cached.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repository = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export async function withFixture(run) {
  const root = await mkdtemp(join(tmpdir(), "rea-learning-"));
  const files = {
    "package.json": JSON.stringify({
      name: "rea-learning-notes",
      version: "1.0.0",
      main: "main.cjs",
    }),
    // 이 대상은 실행하지 않는다. 분석 중 실행된 경우에만 표시 파일이 생긴다.
    "main.cjs": `const fs = require('node:fs');
const path = require('node:path');
fs.writeFileSync(path.join(__dirname, 'executed.flag'), 'executed');
const { app, BrowserWindow, ipcMain } = require('electron');
const { searchNotes } = require('./search.cjs');
app.whenReady().then(() => {
  const window = new BrowserWindow({ webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true } });
  window.loadFile('index.html');
});
ipcMain.handle('notes:search', (_event, query) => searchNotes(query));
`,
    "preload.cjs": `const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('notesApi', {
  search: (query) => ipcRenderer.invoke('notes:search', query)
});
`,
    "renderer.mjs": `export async function searchFromPage(query) {
  return window.notesApi.search(query);
}
`,
    "search.cjs": `const notes = ['agent harness', 'static analysis', 'evidence'];
exports.searchNotes = (query) => notes.filter(note => note.includes(query));
`,
    "index.html":
      '<!doctype html><title>Learning Notes</title><script type="module" src="./renderer.mjs"></script>',
  };
  try {
    await Promise.all(
      Object.entries(files).map(([name, content]) =>
        writeFile(join(root, name), content, "utf8"),
      ),
    );
    return await run(root);
  } finally {
    // 직접 만든 임시 루트라는 사실을 확인한 뒤 정리한다.
    assert.equal(resolve(dirname(root)), resolve(tmpdir()));
    assert.ok(root.startsWith(join(tmpdir(), "rea-learning-")));
    await rm(root, { recursive: true, force: true });
  }
}

export function invokeAnalysis(root, options = []) {
  const completed = spawnSync(
    process.execPath,
    [
      join(repository, "scripts/rea.mjs"),
      "analyze-javascript-application",
      root,
      ...options,
      "--json",
    ],
    {
      cwd: repository,
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 32 * 1024 * 1024,
    },
  );
  if (completed.error) throw completed.error;
  let value;
  try {
    value = JSON.parse(completed.stdout);
  } catch {
    throw new Error(
      `CLI JSON을 읽을 수 없습니다: ${completed.stderr.slice(-2000)}`,
    );
  }
  return { status: completed.status, value };
}

export function analyze(root, options = []) {
  const { status, value } = invokeAnalysis(root, options);
  assert.equal(status, 0, JSON.stringify(value));
  assert.equal(
    value.operation,
    "analyze_javascript_application",
    JSON.stringify(value),
  );
  assert.ok(value.normalized_result, JSON.stringify(value));
  assert.equal(value.confidence, "derived");
  assert.equal(
    existsSync(join(root, "executed.flag")),
    false,
    "정적 분석은 대상 앱을 실행하면 안 됩니다.",
  );
  return value;
}
