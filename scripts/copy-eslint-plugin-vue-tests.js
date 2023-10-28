import { execaCommand } from 'execa'
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/vuejs/eslint-plugin-vue'
const COMMIT = 'b3129f9f3551f1ac189a0ee84b43561b3d0e4cc2'

const getTestName = (line) => {
  return (
    'eslint-plugin-vue-' +
    line.toLowerCase().trim().replaceAll(' ', '-').replaceAll('/', '-')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.endsWith('.vue')) {
      continue
    }
    const filePath = `${folder}/${dirent}`
    const testName = getTestName(dirent)
    const fileContent = await readFile(filePath, 'utf8')
    allTests.push({
      testName,
      testContent: fileContent,
    })
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}`, test.testContent)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/eslint-plugin-vue`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/eslint-plugin-vue`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(
    `${root}/.tmp/eslint-plugin-vue/tests/fixtures`,
    `${root}/.tmp/eslint-plugin-vue-fixtures`,
    {
      recursive: true,
    },
  )
  const allTests = await getAllTests(`${root}/.tmp/eslint-plugin-vue-fixtures`)
  await writeTestFiles(allTests)
}

main()
