/** 목표: renderer → preload → IPC → main 관계의 정적 근거를 읽는다.
 * 실행: node guide/examples/02_practice.mjs
 * 기대: context bridge 1개 이상, IPC 2개 이상과 notes:search 채널 관찰.
 * 관찰 가능한 문자열·호출 관계가 실제 실행 성공을 보장하지 않음을 학습한다.
 */
import assert from "node:assert/strict";
import { analyze, withFixture } from "./support.mjs";

await withFixture(async (root) => {
  const evidence = analyze(root);
  const result = evidence.normalized_result;
  assert.ok(result.summary.context_bridge_apis >= 1);
  assert.ok(result.summary.ipc.operations >= 2);
  assert.ok(JSON.stringify(result.graph).includes("notes:search"));
  console.log(
    JSON.stringify(
      {
        browser_windows: result.summary.browser_windows,
        context_bridge_apis: result.summary.context_bridge_apis,
        ipc: result.summary.ipc,
        authority: evidence.authority,
        limitations: evidence.limitations,
      },
      null,
      2,
    ),
  );
});

// 과제: 문자열 채널을 런타임 계산으로 바꿨을 때 unknown/limitations가 어떻게 달라질까?
