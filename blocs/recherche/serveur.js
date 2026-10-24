// PDRTec : les données de la recherche de pièces, lues en direct sur la base de la GMAO.
//
// Tout ce qui est propre au site est dans le fichier .ktec, jamais dans le programme :
//   « pdrtec.requete »  → la requête du rapport de recherche (une ligne par caractéristique de pièce)
//   « pdrtec.arborescence » → { arbre, liens } : deux requêtes pour filtrer par l'arborescence des machines (ITM)
//        arbre : une ligne par nœud → colonnes noeud, parent, code, designation, machine (et ordre, facultatif)
//        liens : une ligne par pièce montée sur une machine → colonnes codePiece, machine
//   « pdrtec.complements » → requête facultative : une ligne par pièce (colonne codePiece) et d'autres colonnes
//        (ex. stock) que les coches peuvent tester
//   fichiers « pdrtec-images » → les images ajoutées à côté des choix des menus (mode configuration)
//   « pdrtec.reglages » → adresse du serveur des photos, modèle de lien des fichiers, pièces réversibles,
//                         emplacements supprimés masqués, modèles filtrés par tension, familles proposées
// La requête s'importe d'un .rptdesign (le rapport BIRT existant) ou se colle dans les paramètres.

import path from 'node:path'
import { ErreurHttp, envoyerOctets } from 'ktec/http.js'
import { lireInfo, ecrireInfo, lireFichier, enregistrerFichier } from 'ktec/ktec.js'
import { executerRequete } from 'ktec/mysql.js'
import { journal } from 'ktec/installation.js'

const REGLAGES_DEFAUT = {
  serveur: '',            // adresse du serveur de la GMAO (photos et pièces jointes), ex. 10.0.0.5
  modeleLien: '',         // lien d'un fichier : {serveur} {empreinte} {extension} {e1}…{e4} (1er…4e caractère de l'empreinte)
  reversible: false,      // pièces à deux extrémités cherchées dans les deux sens
  masquerSupprimes: false,
  modelesTension: [],     // modèles où « Tension mini / maxi » devient un seul champ « Tension »
  propositions: true,     // famille et sous-famille proposées (en jaune) aux pièces qui n'en ont pas dans la GMAO
  // Coches Oui / Non à droite des menus : [{ id, nom, lien: 'ou' | 'et', regles: [{ champ, test, valeurs: [] }] }]
  //   champ : code, des, empl, obs, obsMachine, ou une colonne de la requête des compléments
  //   test  : commence, contient, egal, superieur, inferieur, vide, non_vide
  coches: [],
  supprimees: '',         // coche « Supprimée » au départ : tous | oui | non (vide : d'après masquerSupprimes)
  // Mode configuration : ordre des menus, descriptions des fiches, images des choix
  disposition: { principaux: [], caracteristiques: {} },
  descriptions: {},       // { fiche technique : texte affiché sous « Caractéristiques » }
  images: {},             // { "champ\u0001valeur" : nom du fichier image }
}
const LIGNES_MAX = 1_000_000

// Les données lues sur la base, gardées en mémoire jusqu'au prochain « Actualiser ».
let cache = null // { sql, colonnes, lignes, date, dureeMs, tronque }
let cacheArbo = null // { cle, arbre, liens }
let cacheComplements = null // { sql, colonnes, lignes }

const reglages = () => ({ ...REGLAGES_DEFAUT, ...lireInfo('pdrtec.reglages', {}) })

export function routes(r) {
  r.get('/api/reglages', () => ({ ...reglages(), requete: lireInfo('pdrtec.requete', ''), arborescence: lireInfo('pdrtec.arborescence', { arbre: '', liens: '' }), complements: lireInfo('pdrtec.complements', '') }))

  // La requête des compléments (vide : pas de compléments).
  r.post('/api/complements/requete', async (ctx) => {
    const { sql = '' } = await ctx.json()
    const propre = String(sql).trim().replace(/;\s*$/, '')
    if (propre && !/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)*(select|with)\b/i.test(propre)) throw new ErreurHttp(400, 'La requête doit être une lecture (SELECT).')
    ecrireInfo('pdrtec.complements', propre)
    cacheComplements = null
    return { complements: propre }
  })

  // Les compléments : { colonnes: [noms], lignes: [[…]] } (la colonne codePiece rattache chaque ligne à sa pièce).
  r.get('/api/complements', async (ctx) => {
    const sql = lireInfo('pdrtec.complements', '')
    if (!sql) return { colonnes: [], lignes: [] }
    if (cacheComplements && cacheComplements.sql === sql && !ctx.query.rafraichir) return { colonnes: cacheComplements.colonnes, lignes: cacheComplements.lignes }
    const r2 = await executerRequete(sansCommentaires(sql), LIGNES_MAX)
    if (!r2.colonnes.some((c) => c.nom.toLowerCase() === 'codepiece')) throw new ErreurHttp(400, 'Requête des compléments : il faut une colonne codePiece.')
    cacheComplements = { sql, colonnes: r2.colonnes.map((c) => c.nom), lignes: r2.lignes }
    return { colonnes: cacheComplements.colonnes, lignes: cacheComplements.lignes }
  })

  // Images des choix des menus, rangées dans le fichier de connaissances.
  r.post('/api/images', async (ctx) => {
    const nom = path.basename(decodeURIComponent(ctx.req.headers['x-nom'] || 'image.png')).replace(/[^\w.\- ]+/g, '_')
    if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(nom)) throw new ErreurHttp(400, 'Image PNG, JPEG, GIF, WebP ou SVG seulement.')
    const octets = await ctx.octets()
    if (octets.length > 2 * 1024 * 1024) throw new ErreurHttp(400, 'Image trop lourde (2 Mo au plus).')
    const unique = `${Date.now().toString(36)}-${nom}`
    enregistrerFichier('pdrtec-images', unique, octets, 'PDRTec')
    return { nom: unique }
  })
  r.get('/api/images/:nom', (ctx) => {
    const octets = lireFichier('pdrtec-images', path.basename(ctx.params.nom))
    if (!octets) throw new ErreurHttp(404, 'Image introuvable')
    const ext = path.extname(ctx.params.nom).toLowerCase()
    envoyerOctets(ctx.res, Buffer.from(octets), { type: { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream' })
  })

  // Les deux requêtes de l'arborescence (vides : pas de filtre par machine).
  r.post('/api/arborescence/requetes', async (ctx) => {
    const { arbre = '', liens = '' } = await ctx.json()
    const propre = (sql) => String(sql || '').trim().replace(/;\s*$/, '')
    for (const sql of [arbre, liens].map(propre).filter(Boolean)) {
      if (!/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)*(select|with)\b/i.test(sql)) throw new ErreurHttp(400, 'Les requêtes doivent être des lectures (SELECT).')
    }
    ecrireInfo('pdrtec.arborescence', { arbre: propre(arbre), liens: propre(liens) })
    cacheArbo = null
    return { arbre: propre(arbre), liens: propre(liens) }
  })

  // L'arborescence : { arbre: [[noeud, parent, code, designation, machine, ordre]], liens: [[codePiece, machine]] }.
  r.get('/api/arborescence', async (ctx) => {
    const { arbre, liens } = lireInfo('pdrtec.arborescence', { arbre: '', liens: '' })
    if (!arbre || !liens) return { arbre: [], liens: [], reglee: false }
    const cle = arbre + '\u0001' + liens
    if (cacheArbo && cacheArbo.cle === cle && !ctx.query.rafraichir) return { arbre: cacheArbo.arbre, liens: cacheArbo.liens, reglee: true }
    const [a, l] = [await executerRequete(sansCommentaires(arbre), LIGNES_MAX), await executerRequete(sansCommentaires(liens), LIGNES_MAX)]
    // Les colonnes sont prises par leur nom (l'ordre de la requête est libre).
    const colonnes = (r, noms) => noms.map((n) => r.colonnes.findIndex((c) => c.nom.toLowerCase() === n.toLowerCase()))
    const ia = colonnes(a, ['noeud', 'parent', 'code', 'designation', 'machine', 'ordre'])
    const il = colonnes(l, ['codePiece', 'machine'])
    if (ia.slice(0, 5).some((i) => i < 0)) throw new ErreurHttp(400, 'Requête de l’arborescence : il faut les colonnes noeud, parent, code, designation et machine.')
    if (il.some((i) => i < 0)) throw new ErreurHttp(400, 'Requête des pièces par machine : il faut les colonnes codePiece et machine.')
    cacheArbo = {
      cle,
      arbre: a.lignes.map((x) => ia.map((i) => (i < 0 ? null : x[i]))),
      liens: l.lignes.map((x) => il.map((i) => x[i])),
    }
    journal(`PDRTec : arborescence de ${cacheArbo.arbre.length} nœuds, ${cacheArbo.liens.length} pièces montées`)
    return { arbre: cacheArbo.arbre, liens: cacheArbo.liens, reglee: true }
  })

  r.post('/api/reglages', async (ctx) => {
    const changements = await ctx.json()
    const permis = Object.fromEntries(Object.entries(changements).filter(([cle]) => cle in REGLAGES_DEFAUT))
    ecrireInfo('pdrtec.reglages', { ...reglages(), ...permis })
    return reglages()
  })

  // La requête collée dans les paramètres.
  r.post('/api/requete', async (ctx) => {
    const { sql } = await ctx.json()
    return enregistrerRequete(sql)
  })

  // La requête lue dans un rapport BIRT existant (.rptdesign envoyé tel quel) : le texte du premier jeu de données.
  // Le reste du fichier (connexion, mot de passe éventuel) n'est ni lu ni gardé.
  r.post('/api/requete/rptdesign', async (ctx) => {
    const texte = (await ctx.octets()).toString('utf8')
    const trouve = texte.match(/<xml-property name="queryText"><!\[CDATA\[([\s\S]*?)\]\]><\/xml-property>/)
    if (!trouve) throw new ErreurHttp(400, 'Aucune requête trouvée dans ce fichier : est-ce bien un rapport BIRT (.rptdesign) ?')
    return enregistrerRequete(trouve[1])
  })

  // Les lignes du rapport : { colonnes: [noms], lignes: [[…]], date, dureeMs, tronque }.
  r.get('/api/donnees', async (ctx) => {
    const sql = lireInfo('pdrtec.requete', '')
    if (!sql) throw new ErreurHttp(409, 'La requête de recherche n’est pas encore réglée : ouvrez les Paramètres.')
    if (cache && cache.sql === sql && !ctx.query.rafraichir) return sansSql(cache)
    const resultat = await executerRequete(sansCommentaires(sql), LIGNES_MAX)
    cache = { sql, colonnes: resultat.colonnes.map((c) => c.nom), lignes: resultat.lignes, date: new Date().toISOString(), dureeMs: resultat.dureeMs, tronque: resultat.tronque }
    journal(`PDRTec : ${cache.lignes.length} lignes lues en ${cache.dureeMs} ms`)
    return sansSql(cache)
  })
}

function enregistrerRequete(sql) {
  sql = String(sql || '').trim().replace(/;\s*$/, '')
  if (!/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)*(select|with)\b/i.test(sql)) throw new ErreurHttp(400, 'La requête doit être une lecture (SELECT).')
  ecrireInfo('pdrtec.requete', sql)
  cache = null
  return { requete: sql }
}

const sansSql = ({ sql, ...reste }) => reste

// La requête sans ses commentaires (-- … et /* … */), qui peuvent contenir des « ; » refusés par le moteur.
// Les textes entre apostrophes sont laissés tels quels.
function sansCommentaires(sql) {
  let sortie = ''
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i]
    if (c === "'") {
      const fin = sql.indexOf("'", i + 1)
      const j = fin < 0 ? sql.length : fin
      sortie += sql.slice(i, j + 1)
      i = j
    } else if (c === '-' && sql[i + 1] === '-') {
      while (i < sql.length && sql[i] !== '\n') i++
      sortie += '\n'
    } else if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2)
      i = fin < 0 ? sql.length : fin + 1
      sortie += ' '
    } else sortie += c
  }
  return sortie.trim()
}
