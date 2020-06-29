const HyperspaceClient = require('hyperspace/client')
const HyperspaceServer = require('hyperspace/server')
const hyperdrive = require('hyperdrive')

main()
async function main () {
  var hserver
  var hclient
  const cleanup = async () => {
    if (hclient) await hclient.close()
    if (hserver) await hserver.close()
  }
  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)

  hserver = new HyperspaceServer({
    host: 'pauls-hyper-mirror-hyperspace',
    storage: './.data'
  })
  await hserver.ready()

  hclient = new HyperspaceClient({ host: 'pauls-hyper-mirror-hyperspace' })
  await hclient.ready()

  var indexDrive = await loadDrive(hclient, process.argv[2])
  var activeDrives = {}

  console.log('Paul\'s Hyper Mirror')
  console.log(`Source: ${process.argv[2]}`)
  console.log('')
  console.log('---')
  console.log('')

  while (true) {
    console.log('Mirror tick', (new Date()).toLocaleString())
    try {
      var urls = await readDb(indexDrive)
      console.log(urls.size, 'URLs found')

      for (let url of Array.from(urls)) {
        if (!(url in activeDrives)) {
          console.log('Swarming', url)
          activeDrives[url] = await loadDrive(hclient, url)
        }
      }
      for (let url in activeDrives) {
        if (!urls.has(url)) {
          console.log('Unswarming', url)
          await activeDrives[url].promises.close()
          delete activeDrives[url]
        }
      }
      await new Promise(r => setTimeout(r, 60e3))
    } catch (e) {
      console.log('Error during tick', e)
    }
  }
}

async function readDb (indexDrive) {
  try {
    const str = await indexDrive.promises.readFile('/mirror.json', 'utf8').catch(e => '')
    return new Set(JSON.parse(str))
  } catch (e) {
    return new Set()
  }
}

async function loadDrive (hclient, url) {
  const key = urlToKey(url)
  const drive = hyperdrive(hclient.corestore, key, {sparse: false, extension: false})
  await drive.promises.ready()
  await hclient.network.configure(drive.discoveryKey, { announce: true, lookup: true, flush: true })

  return drive
}

function urlToKey (url) {
  return Buffer.from(/([0-9a-f]{64})/i.exec(url)[1], 'hex')
}
