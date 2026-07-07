// GitHub Pagesへ手動デプロイするスクリプト(gh-pagesブランチ方式)
// 使い方: npm run deploy
//
// GHPAGES=true でビルドし、dist/ の内容を gh-pages ブランチとして
// origin へ force push する。Pagesのソースが gh-pages ブランチに
// 設定されていれば、1〜2分で公開される。
//
// メインリポジトリのGit(認証設定込み)でコミットを作成するため、
// 一時リポジトリを作る方式より認証まわりが安定する。
//
// 備考: PAT(Personal Access Token)に workflow スコープを追加すれば、
// docs/deploy-workflow.yml を .github/workflows/ へ移動することで
// mainへのpushだけで自動デプロイされるGitHub Actions方式に切り替えられる。
import { execSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const run = (cmd, env = {}) => {
  console.log(`> ${cmd}`)
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, ...env } })
    .toString()
    .trim()
}

// 1. Pages用ビルド(base=/chinese-trainer/)
run('npm run build', { GHPAGES: 'true' })

// 2. Jekyll処理を無効化
writeFileSync(join(process.cwd(), 'dist', '.nojekyll'), '')

// 3. 一時インデックスで dist/ の内容だけのツリーを作成し、コミットしてpush
const tmpIndex = join(process.cwd(), '.git', 'gh-pages-index')
const env = { GIT_INDEX_FILE: tmpIndex }
try {
  run('git read-tree --empty', env)
  run('git --work-tree=dist add -A', env)
  const tree = run('git write-tree', env)
  const commit = run(`git commit-tree ${tree} -m "Deploy to GitHub Pages"`, env)
  run(`git push -f origin ${commit}:refs/heads/gh-pages`)
} finally {
  rmSync(tmpIndex, { force: true })
}

console.log('\n公開URL: https://aubeworks.github.io/chinese-trainer/ (反映まで1〜2分)')
