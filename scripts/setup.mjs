#!/usr/bin/env node
// CreateWorker setup helper — verify your key, list workers, and flag one as an external worker.
// Zero dependencies (Node 18+). Reads your key from the CREATEWORKER_API_KEY environment variable.
//
//   CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs                      # check key + list workers
//   CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs make-external <id>   # flag a worker external
//   CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs create "<name>"      # create + flag external

const BASE = process.env.CREATEWORKER_BASE_URL || "https://www.createworker.com";
const KEY = process.env.CREATEWORKER_API_KEY;

if (!KEY) {
  console.error("Missing CREATEWORKER_API_KEY.");
  console.error("Get a key from your CreateWorker dashboard (Developer), then run:");
  console.error("  CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs");
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${KEY}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`);
  }
  return data;
}

async function listWorkers() {
  const acct = await api("GET", "/account");
  console.log(`OK - key works. Organization: ${acct.name} (${acct.slug})`);

  const { data: workers } = await api("GET", "/workers");
  if (!workers || !workers.length) {
    console.log('\nNo workers yet. Create one:  node scripts/setup.mjs create "My Agent"');
    return;
  }
  console.log("\nWorkers:");
  for (const w of workers) {
    console.log(`  ${w.id}  ${w.name}${w.externalExecutor ? "   <- EXTERNAL (this repo runs it)" : ""}`);
  }
  const external = workers.filter((w) => w.externalExecutor);
  if (!external.length) {
    console.log("\nNone are external yet. Flag one:  node scripts/setup.mjs make-external <workerId>");
  } else {
    console.log(`\n${external.length} external worker(s) ready. Assign them tasks in CreateWorker, then run /watch-createworker.`);
  }
}

async function makeExternal(id) {
  if (!id) throw new Error("Usage: node scripts/setup.mjs make-external <workerId>");
  const w = await api("PATCH", `/workers/${id}`, { externalExecutor: true });
  console.log(`OK - "${w.name}" (${w.id}) is now an external worker. Its tasks wait for this repo's agent.`);
}

async function create(name) {
  if (!name) throw new Error('Usage: node scripts/setup.mjs create "<name>"');
  const w = await api("POST", "/workers", { name, roleKey: "GENERAL_PURPOSE" });
  console.log(`OK - created worker "${w.name}" (${w.id}).`);
  await makeExternal(w.id);
}

const [cmd, arg] = process.argv.slice(2);
const run =
  cmd === "make-external" ? makeExternal(arg)
  : cmd === "create" ? create(arg)
  : listWorkers();

run.catch((e) => { console.error("ERROR: " + e.message); process.exit(1); });
