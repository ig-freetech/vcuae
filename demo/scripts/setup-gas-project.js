#!/usr/bin/env node
/**
 * setup-gas-project.js
 *
 * E2E テスト用ヘルパースクリプト。
 * GAS Web App 経由でスプレッドシートを操作する。
 *
 * Used by:
 *   - demo/scripts/deploy-gas.sh
 */

/**
 * GAS Web App の doGet 経由でスプレッドシートの最終行を読み取って JSON で出力する。
 * 環境変数 GAS_ENDPOINT_URL, GAS_SELF_GENERATED_TOKEN が必要。
 */
async function readLastRow() {
  const endpointUrl = process.env.GAS_ENDPOINT_URL;
  const selfGeneratedToken = process.env.GAS_SELF_GENERATED_TOKEN || process.env.GAS_API_KEY;
  if (!endpointUrl || !selfGeneratedToken) {
    console.error('GAS_ENDPOINT_URL and GAS_SELF_GENERATED_TOKEN environment variables are required');
    process.exit(1);
  }
  const url = `${endpointUrl}?action=readLastRow&selfGeneratedToken=${encodeURIComponent(selfGeneratedToken)}`;
  const res = await fetch(url, { redirect: 'follow' });
  const json = await res.json();
  if (json.status !== 'success') {
    console.error(json.message || 'Failed to read last row');
    process.exit(1);
  }
  console.log(JSON.stringify(json.row));
}

// CLI
const command = process.argv[2];
switch (command) {
  case 'read-last-row':
    readLastRow().catch(err => { console.error(err.message); process.exit(1); });
    break;
  default:
    console.error('Usage: setup-gas-project.js <read-last-row>');
    process.exit(1);
}
