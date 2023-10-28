import { execaCommand } from 'execa'
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/vuejs/docs'
const COMMIT = 'ca0ece79806b1873cb5275f39a3865569f67b0ca'

const getTestName = (line) => {
  return (
    'vue-docs-' +
    line
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replace('template.html', '.vue')
      .replace('-src-', '-')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.endsWith('template.html')) {
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
  await execaCommand(`git clone ${REPO} .tmp/vue-docs`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/vue-docs`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(
    `${root}/.tmp/vue-docs/src/examples`,
    `${root}/.tmp/vue-docs-examples`,
    {
      recursive: true,
    },
  )
  const allTests = await getAllTests(`${root}/.tmp/vue-docs-examples`)
  await writeTestFiles(allTests)
}

main()
