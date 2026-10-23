// Regenerates THIRD_PARTY_LICENSES.txt from the Rust and npm dependency trees
// and fails if anything outside the allowed licence families sneaks in.
// Usage: npm run licenses
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const ALLOWED = /^(MIT|Apache-2\.0|Apache-2\.0 WITH LLVM-exception|BSD-2-Clause|BSD-3-Clause|ISC|Zlib|0BSD|Unicode-3\.0|Unicode-DFS-2016|CC0-1\.0|BSL-1\.0|MPL-2\.0|LGPL-2\.1-or-later|LGPL-3\.0|OFL-1\.1|Unlicense|CDLA-Permissive-2\.0)$/;

// A crate is fine if at least one side of every "OR" choice is allowed.
function ok(expr) {
  if (!expr) return false;
  return expr
    .replace(/[()]/g, "")
    .split(/\s+AND\s+/)
    .every((part) => part.split(/\s+OR\s+|\//).some((l) => ALLOWED.test(l.trim())));
}

const meta = JSON.parse(
  execFileSync(
    "cargo",
    ["metadata", "--format-version", "1", "--filter-platform", "x86_64-pc-windows-msvc", "--manifest-path", join(root, "src-tauri", "Cargo.toml")],
    { maxBuffer: 1 << 28 },
  ).toString(),
);
// Only packages actually reachable from badlo for Windows.
const byId = new Map(meta.packages.map((p) => [p.id, p]));
const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]));
const seen = new Set();
const stack = [meta.resolve.root];
while (stack.length) {
  const id = stack.pop();
  if (seen.has(id)) continue;
  seen.add(id);
  for (const d of nodes.get(id)?.deps ?? []) {
    if (d.dep_kinds.some((k) => k.kind !== "dev")) stack.push(d.pkg);
  }
}
const rust = [...seen]
  .map((id) => byId.get(id))
  .filter((p) => p && p.name !== "badlo")
  .map((p) => ({ name: p.name, version: p.version, license: p.license ?? "", url: p.repository ?? "" }));

// npm: runtime dependencies only (they end up inside the app).
const npm = [];
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const queue = Object.keys(pkg.dependencies ?? {});
const npmSeen = new Set();
while (queue.length) {
  const name = queue.pop();
  if (npmSeen.has(name)) continue;
  npmSeen.add(name);
  const file = join(root, "node_modules", name, "package.json");
  if (!existsSync(file)) continue;
  const p = JSON.parse(readFileSync(file, "utf8"));
  const repo = typeof p.repository === "string" ? p.repository : p.repository?.url ?? "";
  npm.push({ name: p.name, version: p.version, license: p.license ?? "", url: repo });
  queue.push(...Object.keys(p.dependencies ?? {}));
}

const bad = [...rust, ...npm].filter((d) => !ok(d.license));
if (bad.length) {
  console.error("Licences that need a human look:\n" + bad.map((d) => `  ${d.name} ${d.version}: ${d.license || "(none)"}`).join("\n"));
  process.exit(1);
}

const sort = (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version);
const line = (d) => `${d.name} ${d.version}\n    License: ${d.license}${d.url ? `\n    Source:  ${d.url}` : ""}`;
const text = `Badlo - third-party components
================================

Badlo is built from open-source components. Each is listed below with its
licence and source. Full licence texts are available at https://spdx.org/licenses/
and in each project's source repository. No GPL/AGPL code (e.g. Ghostscript,
MuPDF) is included.

Fonts
-----
Inter (by Rasmus Andersson), bundled via @fontsource/inter
    License: SIL Open Font License 1.1 (OFL-1.1)
    Source:  https://github.com/rsms/inter

System components (not shipped, provided by Windows)
----------------------------------------------------
Microsoft Edge WebView2 Runtime - Microsoft Software License Terms

UI libraries (npm)
------------------
${npm.sort(sort).map(line).join("\n")}

Native libraries (Rust crates)
------------------------------
${rust.sort(sort).map(line).join("\n")}
`;
writeFileSync(join(root, "THIRD_PARTY_LICENSES.txt"), text.replace(/\n/g, "\r\n"));
console.log(`THIRD_PARTY_LICENSES.txt: ${npm.length} npm + ${rust.length} Rust components, all allowed.`);
