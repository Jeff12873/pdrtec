// La page « éco+ » en un seul fichier HTML : le modèle eco/modele.html rempli avec le style, SheetJS, les images
// des concombres, eco/app.js et les réglages du site.
// Sans réglages du site (site = null) : la page générique publiée avec chaque version, sans aucune donnée.
//
//   node eco/fabriquer.js <sortie.html>

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export function fabriquerEco({ version, site = null }) {
  const lire = (f) => fs.readFileSync(path.join(RACINE, f))
  const sansFinDeScript = (texte) => texte.replace(/<\/script/gi, '<\\/script')
  const remplacements = {
    __VERSION__: version,
    __CSS__: lire('interface/app.css').toString('utf8'),
    __XLSX__: sansFinDeScript(lire('interface/vendor/xlsx.full.min.js').toString('utf8')),
    __MASQUE__: lire('interface/concombre-masque.webp').toString('base64'),
    __PETIT__: lire('interface/concombre-petit.webp').toString('base64'),
    __REGLAGES__: JSON.stringify(site || { le: '', reglages: {} }).replace(/</g, '\\u003c'),
    __APP__: sansFinDeScript(lire('eco/app.js').toString('utf8')),
  }
  let html = lire('eco/modele.html').toString('utf8')
  for (const [cle, valeur] of Object.entries(remplacements)) html = html.split(cle).join(valeur)
  return html
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sortie = process.argv[2]
  if (!sortie) {
    console.error('Usage : node eco/fabriquer.js <sortie.html>')
    process.exit(1)
  }
  const version = fs.readFileSync(path.join(RACINE, 'VERSION'), 'utf8').trim()
  fs.writeFileSync(sortie, fabriquerEco({ version }))
  console.log(`Page éco+ ${version} : ${sortie}`)
}
