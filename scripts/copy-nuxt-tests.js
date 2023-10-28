import { execaCommand } from 'execa'
import { copyFile, cp, rm } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/nuxt/nuxt'
const COMMIT = '163988449cf31b4fccb487be88281eda1591bbac'

const getTestName = (line) => {
  return (
    'nuxt-' +
    line.toLowerCase().slice(2).trim().replaceAll(' ', '-').replaceAll('/', '-')
  )
}

const copyVueFile = async (file) => {
  const absolutePath = join(`${root}/.tmp/nuxt-cases`, file)
  const testName = getTestName(file)
  await copyFile(absolutePath, `${root}/test/cases/${testName}`)
}

const copyVueTests = async (files) => {
  for (const file of files) {
    await copyVueFile(file)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/nuxt`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/nuxt`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(`${root}/.tmp/nuxt/test`, `${root}/.tmp/nuxt-cases`, {
    recursive: true,
  })
  const { stdout } = await execaCommand('find . -type f -name *.vue', {
    cwd: `${root}/.tmp/nuxt-cases`,
  })
  const vueFiles = stdout.split('\n')
  await copyVueTests(vueFiles)
}

main()
