// Free, unlimited storage via GitHub (replaces Vercel Blob).
// Products + orders live in a PRIVATE data repo; uploaded images go to the
// PUBLIC site repo and are served from GitHub's raw CDN.
export const OWNER = process.env.GITHUB_OWNER || "hrbasbug";
export const SITE_REPO = process.env.GITHUB_SITE_REPO || "oguzcan-yoresel";
export const DATA_REPO = process.env.GITHUB_DATA_REPO || "oguzcan-yoresel-data";
export const BRANCH = process.env.GITHUB_BRANCH || "main";

const token = () => process.env.GITHUB_TOKEN;
export function hasGithub() { return !!token(); }

function gh(path, opts = {}) {
  return fetch("https://api.github.com" + path, {
    ...opts,
    headers: {
      Authorization: "Bearer " + token(),
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });
}

// Read a file's text + sha, or null if missing.
export async function ghGetFile(repo, path) {
  const r = await gh(`/repos/${OWNER}/${repo}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("github get " + r.status);
  const j = await r.json();
  return { text: Buffer.from(j.content, "base64").toString("utf8"), sha: j.sha };
}

// Create or overwrite a file (content: string or Buffer).
export async function ghPutFile(repo, path, content, message) {
  let sha;
  const cur = await gh(`/repos/${OWNER}/${repo}/contents/${path}?ref=${BRANCH}`);
  if (cur.ok) sha = (await cur.json()).sha;
  const body = {
    message: message || "update " + path,
    content: Buffer.from(content).toString("base64"),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const r = await gh(`/repos/${OWNER}/${repo}/contents/${path}`, { method: "PUT", body: JSON.stringify(body) });
  if (!r.ok) throw new Error("github put " + r.status + " " + (await r.text()).slice(0, 200));
  return await r.json();
}

export async function ghDeleteFile(repo, path, message) {
  const cur = await gh(`/repos/${OWNER}/${repo}/contents/${path}?ref=${BRANCH}`);
  if (!cur.ok) return;
  const sha = (await cur.json()).sha;
  await gh(`/repos/${OWNER}/${repo}/contents/${path}`, {
    method: "DELETE",
    body: JSON.stringify({ message: message || "delete " + path, sha, branch: BRANCH }),
  });
}

export async function ghListDir(repo, path) {
  const r = await gh(`/repos/${OWNER}/${repo}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error("github list " + r.status);
  const j = await r.json();
  return Array.isArray(j) ? j : [];
}
