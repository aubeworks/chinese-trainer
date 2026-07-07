// GitHub Pagesへ手動デプロイするスクリプト(gh-pagesブランチ方式)
// 使い方: npm run deploy
//
// GHPAGES=true でビルドし、dist/ の内容を gh-pages ブランチとして
// origin へ force push する。Pagesのソースが gh-pages ブランチに
// 設定されていれば、1〜2分で公開される。
//
// 備考: PAT(Personal Access Token)に workflow スコープを追加すれば、
// docs/deploy-workflow.yml を .github/workflows/ へ移動することで
// mainへのpushだけで自動デプロイされるGitHub Actions方式に切り替えられる。
import { execSync } from 'node:child_process'
import { writeFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const run = (cmd, opts = {}) => {
  console.log(`> ${cmd}`)
  execSync(cmd, { stdio: 'inherit', ...opts })
}

// 1. Pages用ビルド(base=/chinese-trainer/)
run('npm run build', { env: { ...process.env, GHPAGES: 'true' } })

// 2. originのURLを取得
const origin = execSync('git remote get-url origin').toString().trim()

// 3. dist/ を gh-pages ブランチとしてpush
const dist = join(process.cwd(), 'dist')
writeFileSync(join(dist, '.nojekyll'), '') // Jekyll処理を無効化
if (existsSync(join(dist, '.git'))) rmSync(join(dist, '.git'), { recursive: true, force: true })
run('git init -b gh-pages', { cwd: dist })
run('git add -A', { cwd: dist })
run('git -c user.name="deploy" -c user.email="deploy@local" commit -m "Deploy to GitHub Pages"', { cwd: dist })
run(`git push -f "${origin}" gh-pages`, { cwd: dist })
rmSync(join(dist, '.git'), { recursive: true, force: true })

console.log('\n公開URL: https://aubeworks.github.io/chinese-trainer/ (反映まで1〜2分)')
