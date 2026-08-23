const { Octokit } = require("@octokit/rest");

class GithubService {
  constructor({ token, owner, repo, branch, authorName, authorEmail }) {
    this.octokit = new Octokit({ auth: token });
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.author = { name: authorName, email: authorEmail };
    this._queue = Promise.resolve();
  }

  serialize(operation) {
    const run = this._queue.then(operation);
    this._queue = run.catch(() => {});
    return run;
  }

  async getHeadCommitSha() {
    const { data } = await this.octokit.repos.getBranch({
      owner: this.owner,
      repo: this.repo,
      branch: this.branch,
    });
    return data.commit.sha;
  }

  async getJsonFile(path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: ref || this.branch,
      });
      if (Array.isArray(data) || data.type !== "file") return null;
      return JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async getFileSha(path, ref) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: ref || this.branch,
      });
      if (Array.isArray(data)) return null;
      return data.sha;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  }

  async listDir(path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      });
      if (!Array.isArray(data)) return [];
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        type: item.type,
      }));
    } catch (err) {
      if (err.status === 404) return [];
      throw err;
    }
  }

  async createBlob(content, encoding = "utf-8") {
    const { data } = await this.octokit.git.createBlob({
      owner: this.owner,
      repo: this.repo,
      content,
      encoding,
    });
    return data.sha;
  }

  async commitChanges(message, changes) {
    return this.serialize(async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await this._commitOnce(message, changes);
        } catch (err) {
          const isConflict =
            err.status === 409 ||
            err.status === 422 ||
            (err.status === 400 && attempt < 2);
          if (!isConflict || attempt === 2) throw err;
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
    });
  }

  async _commitOnce(message, changes) {
    const parentSha = await this.getHeadCommitSha();
    const baseTreeSha = await this.octokit.git
      .getCommit({
        owner: this.owner,
        repo: this.repo,
        commit_sha: parentSha,
      })
      .then((r) => r.data.tree.sha);

    const tree = [];
    for (const change of changes) {
      if (change.delete) {
        tree.push({
          path: change.path,
          mode: "100644",
          type: "blob",
          sha: null,
        });
      } else {
        const blobSha = await this.createBlob(change.content, change.encoding || "utf-8");
        tree.push({
          path: change.path,
          mode: "100644",
          type: "blob",
          sha: blobSha,
        });
      }
    }

    const { data: treeData } = await this.octokit.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: baseTreeSha,
      tree,
    });

    const { data: commitData } = await this.octokit.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: treeData.sha,
      parents: [parentSha],
      author: { ...this.author, date: new Date().toISOString() },
    });

    await this.octokit.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${this.branch}`,
      sha: commitData.sha,
    });

    return {
      commitSha: commitData.sha,
      htmlUrl: commitData.html_url,
    };
  }
}

module.exports = { GithubService };
