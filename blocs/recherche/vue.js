// PDRTEC : la recherche de pièces de rechange (ex « Recherche PDR du Barbu »).
//
// Les données viennent de la base de la GMAO, par la requête rangée dans le fichier .ktec (une ligne par
// caractéristique de pièce, regroupées ici par code pièce). En secours, sans connexion : un export Excel du
// même rapport BIRT, glissé sur la page (lu dans le navigateur, envoyé nulle part).
// Les réglages (serveur des photos, pièces réversibles…) sont aussi dans le .ktec : les mêmes sur tous les postes.

import { api, adresse } from '/socle/api.js'
import { etat } from '/socle/etat.js'
import { notifier } from '/socle/ui.js'

export default {
  chemin: 'recherche',
  titre: 'Recherche',
  icone: 'loupe',
  menu: true,
  aide: 'pdrtec',

  async afficher(zone) {
    zone.innerHTML = PAGE
    await demarrer(zone)
  },
}

const PAGE = `
<div class="pdrtec" id="app">
  <div class="logo" id="logo" aria-hidden="true">
    <svg viewBox="0 0 80 80" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.5,38 C19,20 28,8 40,8 C52,8 61,20 59.5,38"/>
      <path d="M20.5,32 C15.5,31 15,40 20.5,41 M59.5,32 C64.5,31 65,40 59.5,41"/>
      <path d="M28,15 C31,12.5 34,11.5 37,11.3" stroke-width="2"/>
      <circle cx="32" cy="32" r="6" stroke-width="2"/><circle cx="48" cy="32" r="6" stroke-width="2"/>
      <path d="M38,31.5 Q40,29.8 42,31.5 M26,31 L20.5,30 M54,31 L59.5,30" stroke-width="2"/>
      <circle cx="32" cy="32.5" r="1.8" fill="currentColor" stroke="none"/><circle cx="48" cy="32.5" r="1.8" fill="currentColor" stroke="none"/>
      <path d="M40,36 L38.5,41 L41,41.5" stroke-width="1.8"/>
      <path fill="currentColor" stroke="none" d="M20.5,38 C22,44 26,46 30,45 C33,44 36,44.5 40,45.5 C44,44.5 47,44 50,45 C54,46 58,44 59.5,38 C61,54 56,66 48,71 C45,74 42,77 40,78 C38,77 35,74 32,71 C24,66 19,54 20.5,38Z"/>
      <path d="M31,48.5 C34,51 37.5,50.5 40,48.5 C42.5,50.5 46,51 49,48.5" stroke-width="1.8" style="stroke:var(--bg)"/>
      <path d="M36.5,55 Q40,57 43.5,55" stroke-width="1.8" style="stroke:var(--bg)"/>
    </svg>
  </div>
  <header>
    <div>
      <div class="titlerow">
        <h1 id="title">Recherche PDR du Barbu</h1>
        <button class="btn small" id="help" type="button">Notice d'utilisation de l'outil</button>
      </div>
      <p class="sub" id="source"></p>
    </div>
    <div class="actions">
      <button class="btn" id="reset" type="button">Tout réinitialiser</button>
      <button class="btn primary" id="actualiser" type="button">Actualiser depuis la base</button>
      <label class="btn" for="file">Charger un export BIRT</label>
      <input type="file" id="file" accept=".xls,.xlsx,.csv" multiple hidden>
      <button class="btn" id="settingsBtn" type="button">Paramètres</button>
    </div>
  </header>

  <div class="zone-recherche">
  <section class="panel panel-recherche">
    <div class="search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="q" type="search" placeholder="Code, désignation, référence fabricant, observation…" autocomplete="off">
    </div>
    <div class="filters" id="filters"></div>
    <div class="group" id="chargroup">
      <h2 id="chartitle"></h2>
      <div class="filters" id="charfilters"></div>
    </div>
    <div class="bar">
      <div class="chips" id="chips"></div>
      <div class="count" id="count"></div>
    </div>
  </section>
  <aside class="panel panel-options" id="panelOptions">
    <button class="titre-options" id="titreOptions" type="button" aria-expanded="true"><span>Options</span><span class="na" id="optionsActives"></span><span class="fleche-options">▾</span></button>
    <div id="coches"></div>
  </aside>
  </div>

  <div class="zone-table" id="zoneTable">
    <div class="barre-table">
      <button class="btn small" id="choixColonnes" type="button" title="Afficher ou masquer des colonnes ; glisser un titre de colonne pour changer l'ordre">☰ Colonnes</button>
      <button class="btn small" id="agrandir" type="button" title="Le tableau occupe tout l'écran (Échap pour revenir)">⤢ Agrandir le tableau</button>
      <button class="btn small" id="exporterExcel" type="button" title="La liste affichée (tous les filtres appliqués), avec ses colonnes, dans un fichier Excel">⭳ Télécharger la liste (Excel)</button>
      <button class="btn small" id="exporterCsv" type="button" title="La même liste en CSV (séparateur « ; », s'ouvre dans Excel)">⭳ CSV</button>
    </div>
    <div class="defil-haut" id="defilHaut" hidden><div></div></div>
    <div class="tablebox" id="tablebox"><table id="table"><colgroup id="colonnes"></colgroup><thead id="thead"></thead><tbody id="tbody"></tbody></table></div>
  </div>
  <p class="note">Clique sur une pièce pour voir son observation et toutes ses caractéristiques. Les données viennent directement de la base de la GMAO (« Actualiser depuis la base ») ; sans connexion, glisse un export Excel du rapport sur la page : il est lu dans ton navigateur et n'est envoyé nulle part.</p>
</div>

<dialog id="notice" class="pdrtec-dialog" aria-labelledby="noticeTitle">
  <div class="dhead">
    <h2 id="noticeTitle">Notice d'utilisation de l'outil</h2>
    <button class="btn small" id="closeNotice" type="button">Fermer</button>
  </div>
  <ol>
    <li><b>Rechercher</b> : tape un code, une désignation ou une référence fabricant dans la barre. Plusieurs mots se combinent (ex. « detect 24 »), les accents sont ignorés. Mets une expression entre guillemets pour la chercher telle quelle : <code>"REP 19"</code> trouve « REP 19 » mais pas « REP 190 » ni « REP 2 … 19 ».</li>
    <li><b>Filtrer en cascade</b> : choisis une famille puis une sous-famille. Chaque liste ne propose que les valeurs encore possibles. Le modèle de fiche technique se détermine automatiquement à partir de la sous-famille, il n'y a rien à choisir.</li>
    <li><b>Filtrer sur les caractéristiques</b> : une fois la sous-famille choisie, ses caractéristiques (tension, diamètre…) apparaissent en dessous et deviennent des colonnes du tableau. Pour les modèles activés dans Paramètres, un champ Tension unique remplace les bornes mini/maxi.</li>
    <li><b>Ligne / arborescence</b> : les pièces montées sur une ligne, un sous-ensemble, une machine, menu après menu (arborescence de la GMAO).</li>
    <li><b>Options</b> (bloc de droite) : les coches Supprimée, et celles réglées par toi, sur Tous / Oui / Non avec le nombre de pièces. Clique sur « Options » pour replier le bloc ; les coches actives restent en pastilles.</li>
    <li><b>Colonnes</b> (au-dessus du tableau) : afficher ou masquer des colonnes ; glisser un titre de colonne sur un autre pour changer l'ordre ; glisser le bord d'un titre pour la largeur. Ces choix sont gardés sur ce poste, et le téléchargement Excel / CSV les suit.</li>
    <li><b>Mode configuration</b> (Paramètres) : glisser les menus, glisser les blocs de caractéristiques par leur poignée ⠿ et les renommer, ajouter une image à côté d'un choix (▣ dans la liste), décrire une fiche, régler les coches (règles, groupes ET / OU, état de départ). « Disposition par défaut » revient à l'ordre d'origine. Décocher pour terminer.</li>
    <li><b>Trier le tableau</b> : clique sur l'en-tête d'une colonne pour trier (▲/▼), reclique pour inverser le sens.</li>
    <li><b>Voir le détail</b> : clique sur une pièce pour afficher sa photo (si disponible), son emplacement, son observation complète, ses machines, ses pièces jointes et toutes ses caractéristiques. Clique sur une pièce jointe pour l'ouvrir.</li>
    <li><b>Copier un code</b> : clique sur la petite icône à droite du code d'une pièce pour le mettre dans le presse-papier (elle passe à ✓ une fois copié).</li>
    <li><b>Familles proposées</b> : une pièce sans famille ni sous-famille dans la GMAO reçoit une proposition, <b class="propose">en jaune</b>, d'après les pièces semblables déjà classées (survole-la pour voir pourquoi). Elle sert aux filtres et au tableau ; à reporter dans la GMAO si elle est juste. Se désactive dans Paramètres.</li>
    <li><b>Retirer un filtre</b> : clique sur sa pastille, ou sur « Tout réinitialiser » pour repartir de zéro.</li>
    <li><b>Paramètres</b> : l'adresse du serveur de la GMAO pour afficher les photos, les pièces réversibles (recherche des deux extrémités dans n'importe quel ordre), le masquage des pièces à l'emplacement « SUPPRIME » (signalé en rouge dans le tableau), les modèles filtrés par tension, et la requête qui lit les pièces dans la base. Ils sont gardés dans le fichier de connaissances : les mêmes sur tous les postes.</li>
    <li><b>Mettre à jour les données</b> : « Actualiser depuis la base » relit la base de la GMAO (connexion MySQL de KTEC). Sans connexion : exporte le rapport de recherche de pièces au format Excel, puis glisse le fichier sur la page ou utilise « Charger un export BIRT » (si tu déposes plusieurs fichiers en même temps, un choix te sera proposé).</li>
  </ol>
  <p class="note">« (non renseigné) » signale un champ vide dans la base. Les « ? » dans certaines observations d'un export Excel sont des accents perdus lors de l'export BIRT.</p>
</dialog>

<dialog id="settings" class="pdrtec-dialog" aria-labelledby="settingsTitle">
  <div class="dhead">
    <h2 id="settingsTitle">Paramètres</h2>
    <button class="btn small" id="closeSettings" type="button">Fermer</button>
  </div>
  <div class="stgrow">
    <label for="stgServer">Adresse du serveur (photos de la GMAO)</label>
    <input type="text" id="stgServer" class="stginput" placeholder="ex : 10.0.0.5 ou http://mon-serveur" autocomplete="off">
    <p class="note">Adresse du serveur de la GMAO où sont stockées les photos et pièces jointes. La page s'en sert pour reconstruire le lien de chaque fichier à partir de son empreinte. Si elle est vide ou fausse, les photos sont remplacées par la chèvre (ou le fromage). Les images ne s'affichent que sur un poste du réseau de l'entreprise.</p>
  </div>
  <div class="stgrow">
    <label for="stgLien">Modèle de lien des fichiers</label>
    <input type="text" id="stgLien" class="stginput" placeholder="{serveur}/dossier/{e1}/{e2}/{empreinte}.{extension}" autocomplete="off">
    <p class="note">Où la GMAO range un fichier d'après son empreinte : <code>{serveur}</code> (l'adresse ci-dessus), <code>{empreinte}</code>, <code>{extension}</code>, et <code>{e1}</code> à <code>{e4}</code> pour les 1er à 4e caractères de l'empreinte.</p>
  </div>
  <div class="stgrow">
    <label for="stgReversible">Pièces réversibles</label>
    <label class="stgcheck"><input type="checkbox" id="stgReversible"> Chercher les deux extrémités sans tenir compte de leur ordre</label>
    <p class="note">Un flexible bride SAE ↔ écrou DIN est le même qu'un écrou DIN ↔ bride SAE. Activé, les catégories jumelles d'un modèle (ex. « Embout n°1 » et « Embout n°2 ») sont remplacées par « Un côté » / « L'autre côté », et une pièce est trouvée quel que soit le sens dans lequel elle a été saisie dans la GMAO. L'orientation n'est pas inversée : 90° vu d'un bout peut valoir 270° vu de l'autre.</p>
  </div>
  <div class="stgrow">
    <label for="stgConfiguration">Mode configuration</label>
    <label class="stgcheck"><input type="checkbox" id="stgConfiguration"> Configurer l'affichage</label>
    <p class="note">Coché : glisser les menus pour les ranger (sur la grille), ajouter une image à côté d'un choix (bouton ▣ dans la liste), décrire une fiche sous « Caractéristiques », régler les coches. Décocher pour terminer : les réglages sont gardés.</p>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn small" id="dispositionDefaut" type="button">Disposition par défaut</button>
    </div>
  </div>
  <div class="stgrow">
    <label for="stgPropositions">Familles proposées</label>
    <label class="stgcheck"><input type="checkbox" id="stgPropositions"> Proposer une famille et une sous-famille aux pièces qui n'en ont pas</label>
    <p class="note">PDRTEC apprend sur les pièces déjà classées (mots de la désignation, modèle de fiche) et propose la famille et la sous-famille les plus probables aux pièces qui n'en ont pas, quand il en est assez sûr. Les propositions sont <b class="propose">en jaune</b>, servent aux filtres et au tableau, et ne sont jamais écrites dans la GMAO : à reporter dans la GMAO si elles sont justes.</p>
  </div>
  <div class="stgrow">
    <label>Modèles avec tension mini/maxi</label>
    <p class="note">Pour les modèles cochés, les deux filtres « Tension mini » et « Tension maxi » sont remplacés par un seul champ « Tension » : tape la tension de ton installation (ex. 24) et la page garde les pièces dont la plage mini–maxi la couvre. Seuls les modèles qui ont ces deux caractéristiques sont proposés ; la liste dépend des données chargées.</p>
    <div class="chklist" id="stgModels"></div>
  </div>
  <div class="stgrow">
    <label for="stgRequete">Requête de recherche (base de la GMAO)</label>
    <textarea id="stgRequete" class="stginput" spellcheck="false" placeholder="SELECT … AS codePiece, … AS designationPiece, … AS designationLibel, … AS valeurLibel …"></textarea>
    <p class="note">Une ligne par caractéristique de pièce, avec au moins les colonnes codePiece, designationPiece et designationLibel (et, si possible : observationPiece, modeleFichetechnique, valeurLibel, designationFamille, designationSousfamille, categorieDico, emplacementPiece, observationMachine, lienPhoto, extensionPhoto, piecesJointes, extensionPiecesJointes).</p>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn small" id="stgRequeteOk" type="button">Enregistrer la requête</button>
      <label class="btn small" for="stgRptdesign">La lire dans un rapport BIRT (.rptdesign)</label>
      <input type="file" id="stgRptdesign" accept=".rptdesign" hidden>
    </div>
  </div>
  <div class="stgrow">
    <label for="stgComplements">Compléments (stock…)</label>
    <p class="note">Requête facultative : une ligne par pièce, une colonne codePiece et d'autres colonnes (ex. stock). Ces colonnes peuvent être testées par les coches (Paramètres › Mode configuration, puis « Régler les coches »).</p>
    <textarea id="stgComplements" class="stginput" spellcheck="false" placeholder="SELECT … AS codePiece, … AS stock …"></textarea>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn small" id="stgComplementsOk" type="button">Enregistrer la requête des compléments</button>
    </div>
  </div>
  <div class="stgrow">
    <label for="stgArbre">Arborescence des machines (filtre en cascade)</label>
    <p class="note">Deux requêtes, pour filtrer les pièces par ligne, sous-ensemble et machine, comme dans l'arborescence de la GMAO. Laisser vide pour ne pas proposer ce filtre.</p>
    <textarea id="stgArbre" class="stginput" spellcheck="false" placeholder="L'arbre : une ligne par nœud, colonnes noeud, parent, code, designation, machine (et ordre)"></textarea>
    <textarea id="stgLiens" class="stginput" spellcheck="false" placeholder="Les pièces montées : une ligne par pièce et par machine, colonnes codePiece, machine"></textarea>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn small" id="stgArboOk" type="button">Enregistrer les requêtes de l'arborescence</button>
    </div>
  </div>
</dialog>

<dialog id="filechoice" class="pdrtec-dialog" aria-labelledby="filechoiceTitle">
  <div class="dhead">
    <h2 id="filechoiceTitle">Plusieurs fichiers déposés</h2>
    <button class="btn small" id="closeFilechoice" type="button">Annuler</button>
  </div>
  <p class="note">Choisis celui à charger :</p>
  <div class="chklist" id="filechoiceList"></div>
</dialog>

<div id="photoPreview" aria-hidden="true"><img alt=""></div>
`

// ---------------------------------------------------------------- outils

const NA = '(non renseigné)'
const $ = (id) => document.getElementById(id)
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
// « 12.000 » (décimal de la base) → « 12 » ; les textes restent tels quels.
const nombreLisible = (v) => (v !== '' && !isNaN(Number(v)) ? Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) : String(v))
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// Comme esc, avec les mots de la recherche surlignés (accents et majuscules ignorés, comme pour trouver la pièce).
function hl(s) {
  const texte = String(s ?? '')
  if (!Q.length || !texte) return esc(texte)
  // Texte « normalisé » caractère par caractère, pour retrouver la position d'origine de chaque correspondance.
  let n = ''
  const origine = []
  for (let i = 0; i < texte.length; i++) {
    const c = norm(texte[i])
    for (let k = 0; k < c.length; k++) origine.push(i)
    n += c
  }
  const zones = []
  for (const t of Q) {
    if (t.w) {
      for (let i = n.indexOf(t.w); i >= 0; i = n.indexOf(t.w, i + 1)) zones.push([i, i + t.w.length])
    } else if (t.re) {
      const re = new RegExp(t.re.source, 'g')
      for (let m; (m = re.exec(n)); re.lastIndex = m.index + 1) {
        const debut = m.index + m[1].length
        zones.push([debut, m.index + m[0].length - (m[2] || '').length])
      }
    }
  }
  if (!zones.length) return esc(texte)
  // Zones fusionnées, puis ramenées aux positions du texte d'origine.
  zones.sort((a, b) => a[0] - b[0])
  const fusion = []
  for (const z of zones) { const d = fusion.at(-1); if (d && z[0] <= d[1]) d[1] = Math.max(d[1], z[1]); else fusion.push([...z]) }
  let html = ''
  let pos = 0
  for (const [a, b] of fusion) {
    const debut = origine[a], fin = origine[b - 1] + 1
    if (debut < pos) continue
    html += esc(texte.slice(pos, debut)) + `<mark class="trouve">${esc(texte.slice(debut, fin))}</mark>`
    pos = fin
  }
  return html + esc(texte.slice(pos))
}
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
const isMiniKey = (k) => norm(k).replace(/[^a-z]/g, '') === 'tensionmini'
const isMaxiKey = (k) => norm(k).replace(/[^a-z]/g, '') === 'tensionmaxi'
const ICON_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>'
const ICON_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'

// Filtres principaux, dans l'ordre de la cascade
const MAIN = [['famille', 'Famille'], ['sousfamille', 'Sous-famille']]
let PIECES = [], sel = {}, csel = {}, q = '', Q = []
// Pièces réversibles : deux catégories « jumelles » d'un même modèle (mêmes libellés, ex. Embout n°1 / Embout n°2)
// sont cherchées comme une paire sans ordre : côté A + côté B, dans un sens ou dans l'autre.
let rsel = { A: {}, B: {} }, REV = null
let lastModel = null, sortKey = 'des', sortIsChar = false, sortDir = 1, tKeyMini = null, tKeyMaxi = null, tensionVal = ''
let SETTINGS = { serveur: '', modeleLien: '', reversible: false, masquerSupprimes: false, modelesTension: [], propositions: true, coches: [], disposition: { principaux: [], caracteristiques: {} }, descriptions: {}, images: {} }
// Compléments (requête facultative des Paramètres) : par code pièce, { colonne: valeur }. Colonnes connues.
let COMPLEMENTS = new Map(), COLONNES_COMPLEMENTS = []
// Coches Oui / Non : état de chacune (« tous », « oui », « non »), « supprimees » comprise.
let cochesEtat = {}
// Mode configuration : déplacer les menus, décrire une fiche, ajouter des images aux choix, régler les coches.
let configuration = false
// La liste affichée (après tous les filtres) et ses colonnes, pour le téléchargement Excel.
let derniereListe = { res: [], colonnes: [], toutes: [] }
// Colonnes du tableau, propres à ce poste : ordre (clés) et colonnes masquées.
let choixColonnes = { ordre: [], masquees: [] }
try { choixColonnes = { ordre: [], masquees: [], ...JSON.parse(localStorage.getItem('pdrtec-colonnes') || '{}') } } catch {}
const retenirColonnes = () => { try { localStorage.setItem('pdrtec-colonnes', JSON.stringify(choixColonnes)) } catch {} }
let requeteReglee = false
// Arborescence des machines : nœuds (Map id → { id, parent, code, desi, ordre, enfants }), liens pièce → machines,
// et la suite des nœuds choisis dans les menus en cascade (du haut vers le bas).
let ARBO = null, asel = []
// Les fiches techniques de la sous-famille choisie (la plus utilisée d'abord) : leurs caractéristiques sont proposées.
let MODELES = []
let ecouteDefilement = false

// ---------------------------------------------------------------- démarrage de l'écran

async function demarrer() {
  const lus = await api('/api/reglages')
  requeteReglee = Boolean(lus.requete)
  SETTINGS = { ...SETTINGS, ...lus }
  $('stgRequete').value = lus.requete || ''
  $('stgComplements').value = lus.complements || ''
  // « Supprimée » : état de départ réglé dans l'éditeur des coches (avant : la case « masquer les supprimés »).
  SETTINGS.supprimees ||= SETTINGS.masquerSupprimes ? 'non' : 'tous'
  etatsDeDepart()
  $('stgArbre').value = lus.arborescence?.arbre || ''
  $('stgLiens').value = lus.arborescence?.liens || ''
  brancherEvenements()
  render()
  chargerDepuisLaBase(false)
}

// Les données de la base (gardées par le serveur jusqu'au prochain « Actualiser »).
async function chargerDepuisLaBase(rafraichir) {
  if (!requeteReglee) {
    if (etat.modeAdmin === false) $('source').textContent = 'La requête qui lit les pièces n’est pas encore réglée : c’est l’administrateur qui la renseigne.'
    else sourceAvecBouton('La requête qui lit les pièces dans la base n’est pas encore réglée.', 'Paramètres', ouvrirParametres)
    return
  }
  if (!etat.connexion?.ouverte) {
    sourceAvecBouton('Connexion à la GMAO indisponible : réessaie dans un moment, ou glisse un export Excel du rapport.', 'Réessayer', () => chargerDepuisLaBase(false))
    return
  }
  $('source').textContent = rafraichir ? 'Lecture de la base…' : 'Chargement des pièces…'
  try {
    const [d, c, a] = await Promise.all([
      api(`/api/donnees${rafraichir ? '?rafraichir=1' : ''}`),
      api(`/api/complements${rafraichir ? '?rafraichir=1' : ''}`).catch((erreur) => { notifier(`Compléments : ${erreur.message}`, 'erreur'); return null }),
      api(`/api/arborescence${rafraichir ? '?rafraichir=1' : ''}`).catch((erreur) => { notifier(`Arborescence : ${erreur.message}`, 'erreur'); return null }),
    ])
    chargerArbo(a)
    chargerComplements(c)
    const date = new Date(d.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    fromAOA([d.colonnes, ...d.lignes], `base de la GMAO, lue le ${date}${d.tronque ? ' (liste tronquée)' : ''}`)
  } catch (erreur) {
    $('source').textContent = erreur.message
  }
}

function sourceAvecBouton(texte, bouton, action) {
  const zone = $('source')
  zone.innerHTML = `<span class="bandeau-source"><span>${esc(texte)}</span><button class="btn small" type="button">${esc(bouton)}</button></span>`
  zone.querySelector('button').onclick = action
}

// Les réglages vont dans le fichier .ktec (regroupés : une écriture par rafale de changements).
let minuterieReglages
function saveSettings() {
  clearTimeout(minuterieReglages)
  minuterieReglages = setTimeout(() => {
    const { serveur, modeleLien, reversible, masquerSupprimes, modelesTension, propositions, coches, supprimees, disposition, descriptions, images } = SETTINGS
    api('/api/reglages', { methode: 'POST', corps: { serveur, modeleLien, reversible, masquerSupprimes, modelesTension, propositions, coches, supprimees, disposition, descriptions, images } }).catch(() => {})
  }, 400)
}

// ---------------------------------------------------------------- pièces réversibles

function catOfK(k) { for (const p of PIECES) { if (MODELES.includes(p.modele) && p.carCat[k]) return p.carCat[k] } return '' }
function shortLabelK(k, cat) { const pre = cat + ' :'; return cat && norm(k).startsWith(norm(pre)) ? k.slice(pre.length).trim() : k }
function twinInfo(chars) {
  if (!SETTINGS.reversible || !sel.modele) return null
  const byCat = new Map()
  chars.forEach((k) => { const c = catOfK(k); if (!c) return; const lb = shortLabelK(k, c); if (!byCat.has(c)) byCat.set(c, new Map()); byCat.get(c).set(norm(lb), { k, label: lb }) })
  const cats = [...byCat.keys()]
  for (let i = 0; i < cats.length; i++) for (let j = i + 1; j < cats.length; j++) {
    const a = byCat.get(cats[i]), b = byCat.get(cats[j])
    if (a.size && a.size === b.size && [...a.keys()].every((x) => b.has(x))) {
      return { catA: cats[i], catB: cats[j], labels: [...a.keys()].map((n) => ({ n, label: a.get(n).label, kA: a.get(n).k, kB: b.get(n).k })) }
    }
  }
  return null
}
function endOk(p, kf, crit, skipN) { for (const n in crit) { if (n === skipN) continue; const L = REV.labels.find((x) => x.n === n); if (!L || (p.car[L[kf]] ?? '') !== crit[n]) return false } return true }
// Affectations valides : "12" = embout 1 côté A et embout 2 côté B ; "21" = l'inverse
function revAssign(p, skip) {
  const sA = skip && skip.s === 'A' ? skip.n : null, sB = skip && skip.s === 'B' ? skip.n : null, r = []
  if (endOk(p, 'kA', rsel.A, sA) && endOk(p, 'kB', rsel.B, sB)) r.push('12')
  if (endOk(p, 'kB', rsel.A, sA) && endOk(p, 'kA', rsel.B, sB)) r.push('21')
  return r
}
const revActive = () => REV && (Object.keys(rsel.A).length || Object.keys(rsel.B).length)

// Recherche : mots libres (tous présents, n'importe où) + "expressions entre guillemets" (exactes, mot entier)
// ex. "REP 19" trouve « REP 19 » mais ni « REP 190 », ni « PREP 19 », ni « REP 2 … 19 »
function parseQuery(raw) {
  const terms = []; const s = norm(raw).replace(/[«»“”„]/g, '"')
  const re = /"([^"]*)"?|(\S+)/g; let m
  while ((m = re.exec(s))) {
    if (m[1] !== undefined) {
      const ph = m[1].replace(/\s+/g, ' ').trim()
      if (ph) terms.push({ re: new RegExp('(^|[^a-z0-9])' + ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])') })
    } else terms.push({ w: m[2] })
  }
  return terms
}

// ---------------------------------------------------------------- lecture des données

// Empreinte + extension (colonnes dédiées du rapport) -> « empreinte.extension »
const withExt = (h, e) => { e = clean(e).replace(/^\.+/, ''); return h && e ? h + '.' + e : h }
// Les deux listes « ; » sont dans le même ordre (tri par fichier côté SQL) : on les apparie
function zipExt(hs, es) {
  const H = String(hs ?? '').split(';').map(clean), E = String(es ?? '').split(';').map(clean)
  return H.map((h, i) => withExt(h, E[i] || '')).filter(Boolean)
}
// Emplacement « SUPPRIME » (accents et casse ignorés). Une pièce n'est « supprimée » que si TOUS ses emplacements le sont.
const isDeletedEmpl = (e) => norm(e).replace(/[^a-z]/g, '') === 'supprime'
const emplParts = (e) => String(e ?? '').split(';').map(clean).filter(Boolean)
function emplHtml(e) {
  const parts = emplParts(e); if (!parts.length) return '<span class="na">—</span>'
  return parts.map((x) => (isDeletedEmpl(x) ? `<span class="tag-del">${esc(x)}</span>` : hl(x))).join(' ; ')
}
// Le rapport sort une ligne par caractéristique : on regroupe par code pièce
function fromAOA(aoa, label) {
  const h = (aoa[0] || []).map((x) => norm(x).replace(/[^a-z]/g, ''))
  const col = (k) => h.indexOf(k)
  const C = { code: col('codepiece'), des: col('designationpiece'), obs: col('observationpiece'), mod: col('modelefichetechnique'),
    lib: col('designationlibel'), val: col('valeurlibel'), fam: col('designationfamille'), sf: col('designationsousfamille'), photo: col('lienphoto'), om: col('observationmachine'), empl: col('emplacementpiece'), pj: col('piecesjointes'), extPhoto: col('extensionphoto'), extPj: col('extensionpiecesjointes'), cat: col('categoriedico') }
  if (C.code < 0 || C.des < 0 || C.lib < 0) { $('source').textContent = 'Ces données ne ressemblent pas au rapport de recherche de pièces (colonnes codePiece, designationPiece, designationLibel… introuvables).'; return }
  const map = new Map(); let stamp = ''
  // Un même libellé peut être rangé dans plusieurs catégories (ex. « Embout n°1 : Type » sous « Embout n°1 » ET « Embout n°2 »).
  // Dans ce cas la catégorie fait partie de la clé, sinon le 2e écraserait le 1er.
  const libCats = new Map(), catNames = new Set()
  // (repérage au sein d'un même modèle : « Tension mini » peut changer de catégorie d'un modèle à l'autre sans être dédoublé)
  const lk = (mod, lib) => mod + '\u0001' + lib
  if (C.cat >= 0) aoa.slice(1).forEach((r) => { const l = clean(r[C.lib]), c = clean(r[C.cat]), k = lk(clean(r[C.mod]), l); if (!l || !c) return; catNames.add(norm(c)); if (!libCats.has(k)) libCats.set(k, new Set()); libCats.get(k).add(c) })
  const carKey = (lib, cat, mod) => {
    const k = lk(mod, lib)
    if (!cat || !libCats.has(k) || libCats.get(k).size < 2) return lib
    // « Embout n°1 : Type » rangé sous « Embout n°2 » -> « Embout n°2 : Type » ; sinon « Catégorie : libellé »
    const i = lib.indexOf(':')
    if (i > 0 && catNames.has(norm(lib.slice(0, i).trim()))) return cat + ' : ' + lib.slice(i + 1).trim()
    return cat + ' : ' + lib
  }
  aoa.slice(1).forEach((r) => {
    const code = clean(r[C.code]), des = clean(r[C.des])
    if (!des) { if (code && /\d{4}/.test(code) && !stamp) stamp = code; return } // ligne vide ou date d'extraction en pied
    let p = map.get(code)
    if (!p) { p = { code, des, obs: String(r[C.obs] ?? '').trim(), obsMachine: String(r[C.om] ?? '').trim(), modele: clean(r[C.mod]) || NA, famille: clean(r[C.fam]) || NA, sousfamille: clean(r[C.sf]) || NA, photo: withExt(clean(r[C.photo]), C.extPhoto >= 0 ? r[C.extPhoto] : ''), empl: C.empl >= 0 ? clean(r[C.empl]) : '', pj: zipExt(C.pj >= 0 ? r[C.pj] : '', C.extPj >= 0 ? r[C.extPj] : ''), car: {}, carCat: {} }; map.set(code, p) }
    const lib0 = clean(r[C.lib]); if (lib0) { const cg = C.cat >= 0 ? clean(r[C.cat]) : ''; const lib = carKey(lib0, cg, clean(r[C.mod])); const v = clean(r[C.val]); if (!(lib in p.car) || v) p.car[lib] = v; if (cg && !p.carCat[lib]) p.carCat[lib] = cg }
  })
  PIECES = [...map.values()]
  PIECES.forEach((p) => { const pr = emplParts(p.empl); p.deleted = pr.length > 0 && pr.every(isDeletedEmpl) })
  PIECES.forEach((p) => { p.familleGmao = p.famille; p.sousfamilleGmao = p.sousfamille; p.extra = COMPLEMENTS.get(p.code) || {} })
  rattacherArbo()
  proposerFamilles()
  appliquerPropositions()
  const nMod = new Set(PIECES.map((p) => p.modele)).size
  const nProp = PIECES.filter((p) => p.prop).length
  $('source').textContent = `${PIECES.length} pièces · ${nMod} modèles de fiche` + (nProp ? ` · ${nProp} famille${nProp > 1 ? 's' : ''} proposée${nProp > 1 ? 's' : ''}` : '') + (stamp ? ` · extraction du ${stamp}` : '') + (label ? ` · ${label}` : '')
  sel = {}; csel = {}; rsel = { A: {}, B: {} }; asel = []; q = ''; Q = []; $('q').value = ''; lastModel = null
  render()
}

// ---------------------------------------------------------------- familles proposées

// Une pièce sans famille ou sans sous-famille dans la GMAO reçoit la plus probable d'après les pièces déjà
// classées (« bayésien naïf » : les mots de la désignation, et le modèle de fiche technique). Rien n'est proposé
// en dessous de SEUIL de confiance, ni sur la seule foi d'une marque ou d'une référence (voir solide).
// Les propositions ne sont jamais écrites dans la GMAO.
const SEUIL = 0.6

// Une proposition solide : assez sûre, et fondée sur la nature de la pièce ou son modèle de fiche (une marque comme
// « Telemecanique » se retrouve dans des familles très différentes). Une seule pièce exemple suffit si la nature
// ET le modèle concordent ; sinon il en faut deux.
const solide = (x) => x && x.confiance >= SEUIL && (x.nature || x.modele) && (x.pieces >= 2 || (x.nature && x.modele))
const MOTS_VIDES = new Set(['de', 'du', 'la', 'le', 'les', 'des', 'et', 'en', 'pour', 'avec', 'sur', 'a', 'x'])

function motsDe(p) {
  const mots = norm(p.des).split(/[^a-z0-9]+/).filter((m) => m.length >= 2 && /[a-z]/.test(m) && !MOTS_VIDES.has(m))
  // Le début de chaque mot aussi (« detect » rapproche « detecteur » et « detection »).
  const debuts = mots.filter((m) => m.length > 4).map((m) => '~' + m.slice(0, 4))
  // Le premier mot dit ce qu'est la pièce (DETECT, CONNECTEUR, RLT…) et le modèle de fiche aussi : ils comptent
  // triple, plus que la marque ou les références.
  const nature = mots.length ? Array(2).fill('^' + mots[0].slice(0, 6)) : []
  const modele = p.modele && p.modele !== NA ? Array(3).fill('#' + norm(p.modele)) : []
  return [...mots, ...debuts, ...nature, ...modele]
}

// exemples : [{ classe, mots }] → classer(mots) = { classe, confiance, raisons }
function apprendre(exemples) {
  const classes = new Map()
  const vocabulaire = new Set()
  for (const { classe, mots } of exemples) {
    if (!classes.has(classe)) classes.set(classe, { pieces: 0, total: 0, mots: new Map() })
    const c = classes.get(classe)
    c.pieces++
    for (const m of mots) {
      c.mots.set(m, (c.mots.get(m) || 0) + 1)
      c.total++
      vocabulaire.add(m)
    }
  }
  const V = vocabulaire.size || 1
  return (mots) => {
    const connus = mots.filter((m) => vocabulaire.has(m))
    if (!connus.length || !classes.size) return null
    const scores = [...classes].map(([classe, c]) => [classe, Math.log(c.pieces / exemples.length) + connus.reduce((s, m) => s + Math.log(((c.mots.get(m) || 0) + 1) / (c.total + V)), 0)])
    const max = Math.max(...scores.map(([, v]) => v))
    const somme = scores.reduce((s, [, v]) => s + Math.exp(v - max), 0)
    const [classe, score] = scores.sort((a, b) => b[1] - a[1])[0]
    const c = classes.get(classe)
    const raisons = [...new Set(connus.filter((m) => c.mots.has(m)).map((m) => m.replace(/^[~#^]/, '')))].slice(0, 4)
    // Ce qui fonde la proposition : la nature de la pièce (premier mot) et son modèle de fiche, partagés avec la classe ?
    const nature = mots.some((m) => m.startsWith('^') && c.mots.has(m))
    const modele = mots.some((m) => m.startsWith('#') && c.mots.has(m))
    return { classe, confiance: Math.exp(score - max) / somme, pieces: c.pieces, raisons, nature, modele }
  }
}

function proposerFamilles() {
  const connue = (v) => v && v !== NA
  const classees = PIECES.filter((p) => connue(p.familleGmao))
  const parFamille = apprendre(classees.map((p) => ({ classe: p.familleGmao, mots: motsDe(p) })))
  const sousFamilles = new Map() // famille → classeur des sous-familles
  for (const p of PIECES) {
    p.prop = null
    if (connue(p.familleGmao) && connue(p.sousfamilleGmao)) continue
    const mots = motsDe(p)
    let famille = { classe: p.familleGmao, confiance: 1, gmao: true }
    if (!connue(p.familleGmao)) {
      const f = parFamille(mots)
      if (!solide(f)) continue
      famille = f
    }
    if (!sousFamilles.has(famille.classe)) {
      sousFamilles.set(famille.classe, apprendre(PIECES.filter((x) => x.familleGmao === famille.classe && connue(x.sousfamilleGmao)).map((x) => ({ classe: x.sousfamilleGmao, mots: motsDe(x) }))))
    }
    const sf = sousFamilles.get(famille.classe)(mots)
    p.prop = {
      famille: famille.gmao ? null : famille,
      sousfamille: solide(sf) ? sf : null,
    }
    if (!p.prop.famille && !p.prop.sousfamille) p.prop = null
  }
}

// Avec les propositions (Paramètres) : elles prennent la place des champs vides, pour les filtres et le tableau.
function appliquerPropositions() {
  const actives = SETTINGS.propositions !== false
  for (const p of PIECES) {
    const f = actives && p.prop?.famille, sf = actives && p.prop?.sousfamille
    p.famille = f ? f.classe : p.familleGmao
    p.sousfamille = sf ? sf.classe : p.sousfamilleGmao
    p.propose = f || sf ? { famille: Boolean(f), sousfamille: Boolean(sf) } : null
    p.__t = norm([p.code, p.des, p.empl, p.obs, p.obsMachine, p.modele, p.famille, p.sousfamille, ...Object.values(p.car)].join(' | ')).replace(/\s+/g, ' ')
  }
}

function explicationProposition(p, k) {
  const x = p.prop?.[k] || p.prop?.famille || p.prop?.sousfamille
  if (!x) return ''
  return `Proposée par PDRTEC (${Math.round(x.confiance * 100)} %), comme ${x.pieces} pièce${x.pieces > 1 ? 's' : ''} classée${x.pieces > 1 ? 's' : ''} ainsi${x.raisons.length ? ` : ${x.raisons.join(', ')}` : ''}`
}

// ---------------------------------------------------------------- filtres et tableau

// ---------------------------------------------------------------- arborescence des machines (filtre en cascade)

function chargerArbo(a) {
  if (!a?.reglee || !a.arbre.length) { ARBO = null; asel = []; return }
  const noeuds = new Map()
  for (const [id, parent, code, desi, machine, ordre] of a.arbre) noeuds.set(String(id), { id: String(id), parent: parent == null ? '' : String(parent), code: clean(code), desi: clean(desi), machine: String(machine ?? ''), ordre: Number(ordre) || 0, enfants: [] })
  for (const n of noeuds.values()) noeuds.get(n.parent)?.enfants.push(n)
  // Les nœuds d'une machine (une machine peut être à plusieurs endroits de l'arbre).
  const parMachine = new Map()
  for (const n of noeuds.values()) { if (!parMachine.has(n.machine)) parMachine.set(n.machine, []); parMachine.get(n.machine).push(n) }
  const machinesDe = new Map()
  for (const [code, machine] of a.liens) { const c = clean(code); if (!machinesDe.has(c)) machinesDe.set(c, new Set()); machinesDe.get(c).add(String(machine)) }
  ARBO = { noeuds, parMachine, machinesDe }
  asel = asel.filter((id) => noeuds.has(id))
}

// Chaque pièce reçoit les nœuds où elle est montée et tous leurs ancêtres (p.arbo), et ses chemins (p.chemins).
function rattacherArbo() {
  if (!ARBO) { PIECES.forEach((p) => { p.arbo = null; p.chemins = [] }); return }
  for (const p of PIECES) {
    p.arbo = new Set(); p.chemins = []
    for (const m of ARBO.machinesDe.get(p.code) || []) {
      for (const n of ARBO.parMachine.get(m) || []) {
        const chemin = []
        for (let x = n, garde = 0; x && garde < 30; x = ARBO.noeuds.get(x.parent), garde++) { chemin.unshift(x); p.arbo.add(x.id) }
        p.chemins.push(chemin)
      }
    }
  }
}
const libelleNoeud = (n) => (n.desi && n.desi !== n.code ? `${n.code} (${n.desi})` : n.code)
const parOrdre = (a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code, 'fr', { numeric: true })

// Les menus en cascade : les racines, puis les enfants du nœud choisi… (seulement là où il y a des pièces).
function menusArbo() {
  if (!ARBO) return ''
  const candidates = PIECES.filter((p) => match(p, 'arbo'))
  const compte = new Map()
  for (const p of candidates) for (const id of p.arbo || []) compte.set(id, (compte.get(id) || 0) + 1)
  if (!compte.size && !asel.length) return ''
  const racines = [...ARBO.noeuds.values()].filter((n) => !ARBO.noeuds.has(n.parent))
  const niveaux = [racines]
  for (const id of asel) { const n = ARBO.noeuds.get(id); if (n?.enfants.length) niveaux.push(n.enfants) }
  // Les niveaux s'empilent dans une seule colonne, chacun un peu décalé sous le précédent (comme l'arbre de la GMAO).
  const menus = niveaux.map((liste, i) => {
    const courant = asel[i] || ''
    // Le nœud choisi reste affiché même si la recherche ne trouve plus de pièce dessous.
    const choix = liste.filter((n) => compte.get(n.id) || n.id === courant).sort(parOrdre)
    if (!choix.length) return ''
    return `<div class="f" style="--niveau:${i}" data-fixe="1"><label for="a_${i}">${i ? '└ Dans ' + esc(ARBO.noeuds.get(asel[i - 1])?.code || '') : 'Ligne / arborescence'}</label><select id="a_${i}" data-a="${i}" class="${courant ? 'on' : ''}"><option value="">Tous</option>${choix.map((n) => `<option value="${esc(n.id)}" data-n="${compte.get(n.id) || 0}"${n.id === courant ? ' selected' : ''}>${esc(libelleNoeud(n))}</option>`).join('')}</select></div>`
  }).join('')
  return menus ? `<div class="arbo-cascade" data-bloc="arbo">${menus}</div>` : ''
}

// ---------------------------------------------------------------- tableau agrandi, téléchargement Excel

function agrandirTable(oui) {
  document.querySelector('.pdrtec').classList.toggle('table-agrandie', oui)
  $('agrandir').textContent = oui ? '⤡ Réduire le tableau' : '⤢ Agrandir le tableau'
  majDefilHaut()
}

// La liste affichée, telle quelle : mêmes colonnes (caractéristiques et compléments compris), toutes les lignes.
// format : xlsx (Excel) ou csv (séparateur « ; » et accents en UTF-8, comme Excel l'attend en français).
async function exporterListe(format) {
  const { res, colonnes } = derniereListe
  if (!res.length) return notifier('La liste est vide : rien à télécharger.', 'erreur')
  let XLSX
  try {
    XLSX = await chargerSheetJS()
  } catch (erreur) {
    return notifier(erreur.message, 'erreur')
  }
  const vide = (v) => (v == null || v === NA ? '' : v)
  const nombre = (v) => (v !== '' && v != null && !isNaN(Number(v)) ? Number(v) : vide(v))
  const titres = colonnes.map((c) => c.titre)
  const lignes = res.map((p) => colonnes.map((c) => (c.nombre ? nombre(c.brut(p)) : vide(c.brut(p)))))
  const feuille = XLSX.utils.aoa_to_sheet([titres, ...lignes])
  feuille['!cols'] = titres.map((t, i) => ({ wch: Math.min(60, Math.max(String(t).length, ...lignes.slice(0, 300).map((l) => String(l[i] ?? '').length)) + 2) }))
  feuille['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lignes.length, c: titres.length - 1 } }) }
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const nom = `PDRTEC ${date}${sel.sousfamille ? ' ' + sel.sousfamille.replace(/[\\/:*?"<>|]/g, '-') : ''}`
  if (format === 'csv') {
    const texte = '\ufeff' + XLSX.utils.sheet_to_csv(feuille, { FS: ';', RS: '\r\n' })
    const lien = document.createElement('a')
    lien.href = URL.createObjectURL(new Blob([texte], { type: 'text/csv;charset=utf-8' }))
    lien.download = `${nom}.csv`
    document.body.append(lien); lien.click(); lien.remove()
    setTimeout(() => URL.revokeObjectURL(lien.href), 10_000)
  } else {
    const classeur = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(classeur, feuille, 'Pièces')
    XLSX.writeFile(classeur, `${nom}.xlsx`)
  }
  notifier(`${res.length} pièce${res.length > 1 ? 's' : ''} téléchargée${res.length > 1 ? 's' : ''}`)
}

// ---------------------------------------------------------------- largeur des colonnes, défilement du haut

// Les largeurs choisies (en pixels, par colonne) sont retenues sur ce poste. Dès qu'une largeur est réglée, le tableau
// passe en largeurs fixes : le texte trop long d'une cellule est coupé (« … »), le détail de la pièce reste complet.
let largeurs = {}
try { largeurs = JSON.parse(localStorage.getItem('pdrtec-largeurs') || '{}') } catch {}
const retenirLargeurs = () => { try { localStorage.setItem('pdrtec-largeurs', JSON.stringify(largeurs)) } catch {} }

function appliquerLargeurs() {
  const ths = [...$('thead').querySelectorAll('th[data-key]')]
  const fixe = ths.some((t) => largeurs[t.dataset.key])
  $('table').classList.toggle('largeurs-fixes', fixe)
  $('colonnes').innerHTML = ths.map((t) => `<col style="${fixe ? `width:${largeurs[t.dataset.key] || 150}px` : ''}">`).join('')
  $('table').style.width = fixe ? ths.reduce((s, t) => s + (largeurs[t.dataset.key] || 150), 0) + 'px' : ''
  ths.forEach((t, i) => {
    const poignee = t.querySelector('.poignee-col')
    poignee.onclick = (e) => e.stopPropagation()
    poignee.ondblclick = (e) => { e.stopPropagation(); largeurs = {}; retenirLargeurs(); appliquerLargeurs() }
    poignee.onmousedown = (e) => {
      e.preventDefault(); e.stopPropagation()
      // Premier réglage : les largeurs actuelles de toutes les colonnes deviennent le point de départ.
      if (!fixe) ths.forEach((x) => (largeurs[x.dataset.key] = x.offsetWidth))
      const depart = e.clientX, largeur = largeurs[t.dataset.key] || t.offsetWidth
      const col = () => $('colonnes').children[i]
      appliquerLargeurs()
      const bouger = (m) => {
        largeurs[t.dataset.key] = Math.max(50, Math.round(largeur + m.clientX - depart))
        col().style.width = largeurs[t.dataset.key] + 'px'
        $('table').style.width = [...$('thead').querySelectorAll('th[data-key]')].reduce((s, x) => s + (largeurs[x.dataset.key] || 150), 0) + 'px'
        majDefilHaut()
      }
      const lacher = () => { document.removeEventListener('mousemove', bouger); document.removeEventListener('mouseup', lacher); retenirLargeurs() }
      document.addEventListener('mousemove', bouger)
      document.addEventListener('mouseup', lacher)
    }
  })
  majDefilHaut()
}

// La barre de défilement horizontal reste collée en haut de l'écran (sous la barre de KTEC) pendant qu'on descend
// dans la liste, avec les titres des colonnes : c'est elle qui fait glisser le tableau (la molette avec Maj aussi).
function majDefilHaut() {
  const boite = $('tablebox'), haut = $('defilHaut'), table = $('table')
  const barre = document.querySelector('.barre')
  document.querySelector('.pdrtec')?.style.setProperty('--haut-barre', `${barre ? barre.offsetHeight : 0}px`)
  haut.firstElementChild.style.width = table.offsetWidth + 'px'
  haut.hidden = table.offsetWidth <= boite.clientWidth + 1
  if (haut.hidden) haut.scrollLeft = 0
  table.style.transform = haut.scrollLeft ? `translateX(${-haut.scrollLeft}px)` : ''
}
function brancherDefilHaut() {
  const boite = $('tablebox'), haut = $('defilHaut')
  haut.onscroll = () => { $('table').style.transform = haut.scrollLeft ? `translateX(${-haut.scrollLeft}px)` : '' }
  boite.addEventListener('wheel', (e) => {
    const dx = e.shiftKey ? e.deltaY : e.deltaX
    if (!dx || haut.hidden) return
    e.preventDefault()
    haut.scrollLeft += dx
  }, { passive: false })
  new ResizeObserver(majDefilHaut).observe(boite)
  new ResizeObserver(majDefilHaut).observe($('table'))
}

// Glisser un titre de colonne sur un autre change l'ordre des colonnes (retenu sur ce poste).
function brancherOrdreColonnes(colonnes) {
  let tire = null
  $('thead').querySelectorAll('th[data-col]').forEach((t) => {
    t.ondragstart = (e) => { tire = t.dataset.col; t.classList.add('tire'); e.dataTransfer.effectAllowed = 'move' }
    t.ondragend = () => { t.classList.remove('tire'); tire = null; $('thead').querySelectorAll('.cible').forEach((x) => x.classList.remove('cible')) }
    t.ondragover = (e) => { if (!tire || tire === t.dataset.col) return; e.preventDefault(); t.classList.add('cible') }
    t.ondragleave = () => t.classList.remove('cible')
    t.ondrop = (e) => {
      e.preventDefault()
      if (!tire || tire === t.dataset.col) return
      const visibles = colonnes.map((c) => c.cle).filter((c) => c !== tire)
      const r = t.getBoundingClientRect()
      visibles.splice(visibles.indexOf(t.dataset.col) + (e.clientX > r.left + r.width / 2 ? 1 : 0), 0, tire)
      const masquees = derniereListe.toutes.map((c) => c.cle).filter((c) => !visibles.includes(c))
      choixColonnes.ordre = [...visibles, ...masquees]
      retenirColonnes()
      render()
    }
  })
}

// « Colonnes » : afficher ou masquer chaque colonne, ou revenir aux colonnes par défaut.
function choisirColonnes() {
  const dlg = document.createElement('dialog')
  dlg.className = 'pdrtec-dialog'
  const dessiner = () => {
    const toutes = ordonner(derniereListe.toutes.map((c) => ({ ...c, id: c.cle })), choixColonnes.ordre)
    dlg.innerHTML = `<div class="dhead"><h2>Colonnes du tableau</h2><button class="btn small" data-a="fermer" type="button">Fermer</button></div>
      <p class="note">Coche les colonnes à afficher. Pour changer l'ordre, glisse un titre de colonne sur un autre, directement dans le tableau. Ces choix sont gardés sur ce poste, et le téléchargement Excel / CSV les suit.</p>
      <div class="liste-colonnes">${toutes.map((c) => `<label class="stgcheck"><input type="checkbox" data-col="${esc(c.cle)}"${choixColonnes.masquees.includes(c.cle) ? '' : ' checked'}> ${esc(c.titre)}${c.classe === 'char' ? ' <span class="na">(caractéristique)</span>' : c.classe === 'extra' ? ' <span class="na">(compléments)</span>' : ''}</label>`).join('')}</div>
      <div class="actions" style="justify-content:flex-start"><button class="btn small" type="button" data-a="defaut">Colonnes par défaut</button></div>`
  }
  dlg.addEventListener('change', (e) => {
    const cle = e.target.dataset.col
    if (!cle) return
    choixColonnes.masquees = e.target.checked ? choixColonnes.masquees.filter((c) => c !== cle) : [...new Set([...choixColonnes.masquees, cle])]
    retenirColonnes(); render()
  })
  dlg.addEventListener('click', (e) => {
    const a = e.target.closest('button[data-a]')?.dataset.a
    if (a === 'fermer') dlg.close()
    if (a === 'defaut') { choixColonnes = { ordre: [], masquees: [] }; retenirColonnes(); render(); dessiner() }
  })
  dlg.addEventListener('close', () => dlg.remove())
  dessiner()
  document.body.append(dlg)
  dlg.showModal()
}

// ---------------------------------------------------------------- mode configuration

function basculerConfiguration(actif) {
  configuration = actif
  $('stgConfiguration').checked = actif
  document.querySelector('.pdrtec').classList.toggle('en-configuration', actif)
  render()
}

// Des blocs { id } dans l'ordre enregistré ; les nouveaux (absents de l'ordre) gardent leur place, à la suite.
function ordonner(blocs, ordre) {
  if (!ordre?.length) return blocs
  const rang = (id) => { const i = ordre.indexOf(id); return i < 0 ? ordre.length + blocs.findIndex((b) => b.id === id) : i }
  return [...blocs].sort((a, b) => rang(a.id) - rang(b.id))
}

// Glisser-déposer des menus (mode configuration) : l'ordre est enregistré pour les menus du haut, et par fiche
// pour les caractéristiques. La grille garde l'alignement.
function brancherConfiguration() {
  if (!configuration) return
  // Les blocs de caractéristiques se déplacent par leur poignée ⠿ ; l'ordre est retenu par fiche technique.
  let blocTire = null
  $('charfilters').querySelectorAll('.fgroup[data-groupe]').forEach((g) => {
    const poignee = g.querySelector('.poignee-bloc')
    if (poignee) {
      poignee.ondragstart = (e) => { e.stopPropagation(); blocTire = g; g.classList.add('tire'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(g, 20, 20) }
      poignee.ondragend = () => { g.classList.remove('tire'); blocTire = null }
    }
    g.addEventListener('dragover', (e) => {
      if (!blocTire || blocTire === g) return
      e.preventDefault()
      const r = g.getBoundingClientRect()
      g.parentNode.insertBefore(blocTire, e.clientY > r.top + r.height / 2 ? g.nextSibling : g)
    })
    g.addEventListener('drop', (e) => {
      if (!blocTire) return
      e.preventDefault()
      const blocs = { ...(SETTINGS.disposition?.blocs || {}), [sel.modele]: [...$('charfilters').querySelectorAll('.fgroup[data-groupe]')].map((x) => x.dataset.groupe) }
      SETTINGS.disposition = { ...SETTINGS.disposition, blocs }
      saveSettings()
    })
  })
  const zones = [$('filters'), ...$('charfilters').querySelectorAll('.filters'), $('charfilters')]
  let tire = null
  for (const zone of zones) {
    for (const el of zone.querySelectorAll(':scope > [data-bloc]')) {
      el.draggable = true
      el.ondragstart = (e) => { tire = el; el.classList.add('tire'); e.dataTransfer.effectAllowed = 'move' }
      el.ondragend = () => { el.classList.remove('tire'); tire = null }
      el.ondragover = (e) => {
        if (!tire || tire === el || tire.parentNode !== el.parentNode) return
        e.preventDefault()
        const r = el.getBoundingClientRect()
        const apres = e.clientY > r.bottom - r.height / 3 || (e.clientY > r.top && e.clientX > r.left + r.width / 2)
        el.parentNode.insertBefore(tire, apres ? el.nextSibling : el)
      }
      el.ondrop = (e) => {
        e.preventDefault()
        if (zone === $('filters')) SETTINGS.disposition = { ...SETTINGS.disposition, principaux: [...$('filters').querySelectorAll(':scope > [data-bloc]')].map((x) => x.dataset.bloc) }
        else if (sel.modele) SETTINGS.disposition = { ...SETTINGS.disposition, caracteristiques: { ...(SETTINGS.disposition?.caracteristiques || {}), [sel.modele]: [...$('charfilters').querySelectorAll('.f[data-bloc]')].map((x) => x.dataset.bloc) } }
        saveSettings()
      }
    }
  }
}

// Tous les menus s'affichent avec la même liste, aux couleurs du thème, qui sait montrer une image à côté d'un choix
// et le nombre de pièces en discret. Le vrai menu reste caché derrière : son état ne change pas.
function ameliorerMenus() {
  document.querySelectorAll('.pdrtec select[data-img], .pdrtec select[data-a]').forEach((s) => {
    const cle = s.dataset.img || ''
    const imageDe = (v) => { const n = cle && SETTINGS.images?.[cle + '\u0001' + v]; return n ? `<img src="${esc(adresse(`/api/images/${encodeURIComponent(n)}`))}" alt="">` : '' }
    const compte = (o) => (o.dataset.n ? `<small class="nb">${esc(o.dataset.n)}</small>` : '')
    const zone = document.createElement('div')
    zone.className = 'dd-zone'
    const choisi = s.options[s.selectedIndex]
    zone.innerHTML = `<button type="button" class="dd ${s.className}">${choisi && choisi.value ? imageDe(choisi.value) : ''}<span>${esc(choisi?.text || 'Tous')}</span></button><div class="dd-liste" hidden>${[...s.options].map((o) => `<div class="dd-choix${o.selected ? ' on' : ''}" data-v="${esc(o.value)}">${o.value ? imageDe(o.value) : ''}<span>${esc(o.text)}</span>${compte(o)}${configuration && cle && o.value ? `<button type="button" class="dd-image" title="${SETTINGS.images?.[cle + '\u0001' + o.value] ? 'Retirer l’image' : 'Ajouter une image'}">${SETTINGS.images?.[cle + '\u0001' + o.value] ? '✕' : '▣'}</button>` : ''}</div>`).join('')}</div>`
    s.hidden = true
    s.after(zone)
    const liste = zone.querySelector('.dd-liste')
    zone.addEventListener('keydown', (e) => { if (e.key === 'Escape') liste.hidden = true })
    zone.querySelector('.dd').onclick = () => { const ouvert = !liste.hidden; document.querySelectorAll('.dd-liste').forEach((l) => (l.hidden = true)); liste.hidden = ouvert }
    liste.querySelectorAll('.dd-choix').forEach((c) => (c.onclick = (e) => {
      const v = c.dataset.v
      if (e.target.closest('.dd-image')) return void changerImage(cle, v)
      s.value = v
      s.dispatchEvent(new Event('change'))
    }))
  })
}

// Ajoute (ou retire) l'image d'un choix : envoyée au serveur, rangée dans le fichier de connaissances.
function changerImage(cle, valeur) {
  const k = cle + '\u0001' + valeur
  if (SETTINGS.images?.[k]) {
    const images = { ...SETTINGS.images }
    delete images[k]
    SETTINGS.images = images
    saveSettings(); render()
    return
  }
  const choix = document.createElement('input')
  choix.type = 'file'
  choix.accept = '.png,.jpg,.jpeg,.gif,.webp,.svg'
  choix.onchange = async () => {
    const fichier = choix.files[0]
    if (!fichier) return
    try {
      const r = await api('/api/images', { methode: 'POST', fichier, entetes: { 'X-Nom': encodeURIComponent(fichier.name) } })
      SETTINGS.images = { ...SETTINGS.images, [k]: r.nom }
      saveSettings(); render()
    } catch (erreur) {
      notifier(erreur.message, 'erreur')
    }
  }
  choix.click()
}

// L'éditeur des coches. Pour chaque coche : un nom, son état de départ (Tous, Oui, Non), et ses règles,
// une par ligne, liées par OU (une suffit) ou ET (toutes) ; un groupe ( … ) a son propre lien, en retrait.
// Une règle : champ (de la pièce ou des compléments), test, valeurs séparées par des virgules.
function editerCoches() {
  let coches = structuredClone(SETTINGS.coches || [])
  let departSupprimees = SETTINGS.supprimees || 'tous'
  const champs = { ...CHAMPS_PIECE, ...Object.fromEntries(COLONNES_COMPLEMENTS.map((c) => [c, `${c} (compléments)`])) }
  const ETATS = { tous: 'Tous', oui: 'Oui', non: 'Non' }
  const dlg = document.createElement('dialog')
  dlg.className = 'pdrtec-dialog editeur-coches'
  const opts = (o, v) => Object.entries(o).map(([k, t]) => `<option value="${esc(k)}"${k === v ? ' selected' : ''}>${esc(t)}</option>`).join('')
  // Le chemin d'une liste de règles : « i » (la coche), puis les indices des groupes (« i.2.0 »).
  const liste = (chemin) => {
    const [i, ...reste] = chemin.split('.').map(Number)
    let r = coches[i]
    for (const j of reste) r = r.regles[j]
    return r
  }
  const lien = (chemin, valeur) => `<select class="fin" data-lien="${chemin}"><option value="ou"${valeur !== 'et' ? ' selected' : ''}>une règle suffit (OU)</option><option value="et"${valeur === 'et' ? ' selected' : ''}>toutes les règles (ET)</option></select>`
  const regles = (chemin, items, profondeur) => `<div class="regles" style="--profondeur:${profondeur}">${items.map((r, j) => {
    const ici = `${chemin}.${j}`
    if (r.regles) {
      return `<div class="groupe-regles"><div class="ligne-regle">${lien(ici, r.lien)}<span class="na">groupe</span><span class="espace"></span><button class="btn mini" type="button" data-a="retirer" data-c="${ici}">✕</button></div>${regles(ici, r.regles, profondeur + 1)}</div>`
    }
    return `<div class="ligne-regle"><select class="fin" data-c="${ici}" data-r="champ">${opts(champs, r.champ)}</select><select class="fin" data-c="${ici}" data-r="test">${opts(TESTS, r.test)}</select>${['vide', 'non_vide'].includes(r.test) ? '<span class="espace"></span>' : `<input class="fin" type="text" value="${esc((r.valeurs || []).join(', '))}" data-c="${ici}" data-r="valeurs" placeholder="valeurs, séparées par des virgules">`}<button class="btn mini" type="button" data-a="retirer" data-c="${ici}">✕</button></div>`
  }).join('')}<div class="ajout-regles"><button class="btn mini" type="button" data-a="regle" data-c="${chemin}">+ Règle</button>${profondeur < 3 ? `<button class="btn mini" type="button" data-a="groupe" data-c="${chemin}">+ Groupe ( … )</button>` : ''}</div></div>`
  const dessiner = () => {
    dlg.innerHTML = `<div class="dhead"><h2>Les coches</h2><button class="btn small" data-a="fermer" type="button">Fermer</button></div>
      <p class="note">Une pièce est « Oui » pour une coche si ses règles sont vraies. L'état de départ est celui de la coche à l'ouverture de PDRTEC.${COLONNES_COMPLEMENTS.length ? '' : ' Pour tester le stock, ajoutez d’abord la requête des compléments dans les Paramètres.'}</p>
      <div class="edition-coche"><div class="ligne-coche"><b class="nom-fixe">Supprimée</b><span class="na">emplacement « SUPPRIME »</span><span class="espace"></span><label class="depart">au départ <select class="fin" data-depart="supprimees">${opts(ETATS, departSupprimees)}</select></label></div></div>
      ${coches.map((c, i) => `<div class="edition-coche">
        <div class="ligne-coche"><input class="fin nom-coche-edit" type="text" value="${esc(c.nom)}" data-i="${i}" data-n="nom" placeholder="Nom de la coche">${lien(String(i), c.lien)}<label class="depart">au départ <select class="fin" data-depart="${i}">${opts(ETATS, c.depart || 'tous')}</select></label><button class="btn mini" type="button" data-a="supprimer" data-i="${i}">Retirer</button></div>
        ${regles(String(i), c.regles || [], 1)}
      </div>`).join('')}
      <div class="actions" style="justify-content:flex-start"><button class="btn small" type="button" data-a="ajouter">+ Coche</button><button class="btn small primary" type="button" data-a="enregistrer">Enregistrer</button></div>`
  }
  dlg.addEventListener('change', (e) => {
    const t = e.target
    if (t.dataset.n) coches[Number(t.dataset.i)].nom = t.value
    if (t.dataset.lien) liste(t.dataset.lien).lien = t.value
    if (t.dataset.depart) { if (t.dataset.depart === 'supprimees') departSupprimees = t.value; else coches[Number(t.dataset.depart)].depart = t.value }
    if (t.dataset.r) {
      const parts = t.dataset.c.split('.'), j = Number(parts.pop()), r = liste(parts.join('.')).regles[j]
      r[t.dataset.r] = t.dataset.r === 'valeurs' ? t.value.split(',').map((v) => v.trim()).filter(Boolean) : t.value
      if (t.dataset.r === 'test') dessiner()
    }
  })
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]')
    if (!b) return
    const a = b.dataset.a
    if (a === 'fermer') return dlg.close()
    if (a === 'ajouter') coches.push({ id: 'c' + Date.now().toString(36), nom: 'Nouvelle coche', lien: 'ou', depart: 'tous', regles: [{ champ: 'code', test: 'commence', valeurs: [] }] })
    if (a === 'supprimer') coches.splice(Number(b.dataset.i), 1)
    if (a === 'regle') (liste(b.dataset.c).regles ||= []).push({ champ: 'code', test: 'commence', valeurs: [] })
    if (a === 'groupe') (liste(b.dataset.c).regles ||= []).push({ lien: 'et', regles: [{ champ: 'code', test: 'commence', valeurs: [] }] })
    if (a === 'retirer') { const parts = b.dataset.c.split('.'), j = Number(parts.pop()); liste(parts.join('.')).regles.splice(j, 1) }
    if (a === 'enregistrer') {
      SETTINGS.coches = coches.filter((c) => c.nom.trim())
      SETTINGS.supprimees = departSupprimees
      saveSettings(); etatsDeDepart(); dlg.close(); render()
      return notifier('Coches enregistrées')
    }
    dessiner()
  })
  dlg.addEventListener('close', () => dlg.remove())
  dessiner()
  document.body.append(dlg)
  dlg.showModal()
}

// ---------------------------------------------------------------- compléments et coches

function chargerComplements(c) {
  COMPLEMENTS = new Map(); COLONNES_COMPLEMENTS = []
  if (!c?.colonnes?.length) return
  const iCode = c.colonnes.findIndex((n) => n.toLowerCase() === 'codepiece')
  COLONNES_COMPLEMENTS = c.colonnes.filter((_, i) => i !== iCode)
  for (const l of c.lignes) {
    const o = {}
    c.colonnes.forEach((n, i) => { if (i !== iCode) o[n] = l[i] })
    COMPLEMENTS.set(clean(l[iCode]), o)
  }
}

const CHAMPS_PIECE = { code: 'Code', des: 'Désignation', empl: 'Emplacement', obs: 'Observation', obsMachine: 'Observation machine', famille: 'Famille', sousfamille: 'Sous-famille' }
const TESTS = { commence: 'commence par', ne_commence: 'ne commence pas par', contient: 'contient', ne_contient: 'ne contient pas', egal: 'est', different: 'n’est pas', superieur: 'supérieur à', inferieur: 'inférieur à', vide: 'est vide', non_vide: 'n’est pas vide' }
// Les tests contraires : vrais quand le test d'origine est faux pour toutes les valeurs (et tous les emplacements).
const CONTRAIRES = { ne_commence: 'commence', ne_contient: 'contient', different: 'egal' }

// Une règle : le champ (de la pièce ou des compléments), un test, des valeurs (l'une suffit).
// L'emplacement peut en avoir plusieurs (« ; ») : la règle est vraie si l'un d'eux la vérifie.
function regleVraie(p, r) {
  if (CONTRAIRES[r.test]) return !regleVraie(p, { ...r, test: CONTRAIRES[r.test] })
  const brut = r.champ in CHAMPS_PIECE ? p[r.champ] : p.extra?.[r.champ]
  const textes = r.champ === 'empl' ? emplParts(brut) : [String(brut ?? '')]
  const valeurs = (r.valeurs || []).map((v) => String(v).trim()).filter(Boolean)
  return textes.some((t) => {
    const n = norm(t).trim()
    switch (r.test) {
      case 'vide': return !n
      case 'non_vide': return Boolean(n)
      case 'superieur': return n !== '' && valeurs.some((v) => Number(t.replace(',', '.')) > Number(v.replace(',', '.')))
      case 'inferieur': return n !== '' && valeurs.some((v) => Number(t.replace(',', '.')) < Number(v.replace(',', '.')))
      case 'egal': return valeurs.some((v) => n === norm(v))
      case 'contient': return valeurs.some((v) => n.includes(norm(v)))
      default: return valeurs.some((v) => n.startsWith(norm(v)))
    }
  })
}
// Une liste de règles et de groupes ({ lien, regles }), liés par OU (une suffit) ou ET (toutes).
function groupeVrai(p, regles, lien) {
  const utiles = (regles || []).filter((r) => (r.regles ? r.regles.length : r.champ && r.test))
  if (!utiles.length) return false
  const vraie = (r) => (r.regles ? groupeVrai(p, r.regles, r.lien) : regleVraie(p, r))
  return lien === 'et' ? utiles.every(vraie) : utiles.some(vraie)
}
const cocheVraie = (p, c) => groupeVrai(p, c.regles, c.lien)

// Chaque coche démarre dans l'état choisi pour elle (Tous, Oui ou Non) à l'ouverture de PDRTEC.
function etatsDeDepart() {
  cochesEtat = { supprimees: SETTINGS.supprimees || 'tous' }
  for (const c of SETTINGS.coches || []) cochesEtat[c.id] = c.depart || 'tous'
}

// Bloc Options replié ou ouvert : retenu sur ce poste.
let optionsRepliees = false
try { optionsRepliees = localStorage.getItem('pdrtec-options-repliees') === '1' } catch {}

// Les coches du bloc Options : « Supprimée », puis celles des réglages. Chaque coche : Tous / Oui / Non.
const toutesLesCoches = () => [{ id: 'supprimees', nom: 'Supprimée' }, ...(SETTINGS.coches || [])]
function panneauCoches() {
  const toutes = toutesLesCoches()
  const lignes = toutes.map((c) => {
    const e = cochesEtat[c.id] || 'tous'
    const base = PIECES.filter((p) => match(p, 'coche:' + c.id))
    const oui = c.id === 'supprimees' ? base.filter((p) => p.deleted).length : base.filter((p) => cocheVraie(p, c)).length
    const bouton = (v, texte, n) => `<button type="button" class="seg${e === v ? ' on' : ''}" data-coche="${esc(c.id)}" data-v="${v}">${texte}${n !== null ? ` <small>${n}</small>` : ''}</button>`
    return `<div class="coche"><span class="nom-coche" title="${esc(c.nom)}">${esc(c.nom)}</span><span class="segs">${bouton('tous', 'Tous', null)}${bouton('oui', 'Oui', oui)}${bouton('non', 'Non', base.length - oui)}</span></div>`
  }).join('')
  return `<div class="coches-panel">${lignes}${configuration ? '<button type="button" class="btn small" id="editerCoches">Régler les coches…</button>' : ''}</div>`
}

function match(p, skipMain, skipChar) {
  if (skipMain !== 'coche:supprimees' && cochesEtat.supprimees === 'non' && p.deleted) return false
  if (skipMain !== 'coche:supprimees' && cochesEtat.supprimees === 'oui' && !p.deleted) return false
  for (const c of SETTINGS.coches || []) {
    const e = cochesEtat[c.id]
    if (!e || e === 'tous' || skipMain === 'coche:' + c.id) continue
    if (cocheVraie(p, c) !== (e === 'oui')) return false
  }
  if (Q.length && !Q.every((t) => (t.re ? t.re.test(p.__t) : p.__t.includes(t.w)))) return false
  for (const k in sel) { if (k !== skipMain && k !== 'modele' && p[k] !== sel[k]) return false }
  if (asel.length && skipMain !== 'arbo' && !p.arbo?.has(asel.at(-1))) return false
  for (const k in csel) { if (k !== skipChar && (p.car[k] ?? '') !== csel[k]) return false }
  if (revActive() && !revAssign(p, skipChar && typeof skipChar === 'object' ? skipChar : null).length) return false
  if (tKeyMini && tKeyMaxi && tensionVal !== '') {
    const val = Number(tensionVal)
    const mini = p.car[tKeyMini], maxi = p.car[tKeyMaxi]
    if (!Number.isNaN(val) && (mini !== undefined || maxi !== undefined)) {
      const nMini = mini ? Number(mini) : -Infinity, nMaxi = maxi ? Number(maxi) : Infinity
      if (!(val >= nMini && val <= nMaxi)) return false
    }
  }
  return true
}
const sortFr = (a, b) => (a === NA ? 1 : b === NA ? -1 : a.localeCompare(b, 'fr', { numeric: true }))
function options(values, current) {
  const vals = [...new Set(values)].sort(sortFr)
  return '<option value="">Tous</option>' + vals.map((v) => `<option value="${esc(v)}"${v === current ? ' selected' : ''}>${esc(v)}</option>`).join('')
}
// Caractéristiques du modèle choisi
// (toutes les fiches de la sous-famille : une pièce sans fiche, ou d'une autre fiche, ne les fait pas disparaître)
function modelChars() {
  if (!MODELES.length) return []
  const s = new Set(); PIECES.forEach((p) => { if (MODELES.includes(p.modele)) Object.keys(p.car).forEach((k) => s.add(k)) })
  return [...s]
}
function render() {
  // Le modèle fiche technique n'est jamais choisi à la main : il découle de la seule taxonomie famille/sous-famille
  // (il ne peut y en avoir qu'un) — indépendamment des filtres de caractéristiques ou de la recherche texte,
  // pour éviter qu'un filtre transitoire (tension, recherche…) ne fasse disparaître/réapparaître le modèle
  // Les fiches de la sous-famille, la plus utilisée d'abord ; les pièces sans fiche sont ignorées ici.
  if (sel.sousfamille) {
    const compte = new Map()
    PIECES.forEach((p) => { for (const k in sel) { if (k !== 'modele' && p[k] !== sel[k]) return } if (p.modele && p.modele !== NA) compte.set(p.modele, (compte.get(p.modele) || 0) + 1) })
    MODELES = [...compte].sort((a, b) => b[1] - a[1]).map(([m]) => m)
    const auto = MODELES[0]
    if (sel.modele !== auto) { auto ? (sel.modele = auto) : delete sel.modele; csel = {}; rsel = { A: {}, B: {} } }
  } else {
    MODELES = []
    if (sel.modele) { delete sel.modele; csel = {}; rsel = { A: {}, B: {} } }
  }
  REV = twinInfo(modelChars()); if (!REV) rsel = { A: {}, B: {} }

  // Filtres principaux
  // Les blocs du haut (familles, arborescence, coches), dans l'ordre choisi en mode configuration.
  const blocs = [
    ...MAIN.map(([k, l]) => ({ id: k, html: `<div class="f" data-bloc="${k}"><label for="m_${k}">${l}</label><select id="m_${k}" data-k="${k}" data-img="m:${k}" class="${sel[k] ? 'on' : ''}">${options(PIECES.filter((p) => match(p, k)).map((p) => p[k]), sel[k])}</select></div>` })),
    { id: 'arbo', html: menusArbo() },
  ].filter((b) => b.html)
  $('filters').innerHTML = ordonner(blocs, SETTINGS.disposition?.principaux).map((b) => b.html).join('')
  $('coches').innerHTML = panneauCoches()
  const actives = toutesLesCoches().filter((c) => (cochesEtat[c.id] || 'tous') !== 'tous')
  $('optionsActives').textContent = actives.length ? `(${actives.length} active${actives.length > 1 ? 's' : ''})` : ''
  $('panelOptions').classList.toggle('repliees', optionsRepliees)
  $('titreOptions').setAttribute('aria-expanded', String(!optionsRepliees))
  $('titreOptions').onclick = () => { optionsRepliees = !optionsRepliees; try { localStorage.setItem('pdrtec-options-repliees', optionsRepliees ? '1' : '0') } catch {}; render() }
  $('coches').querySelectorAll('button[data-coche]').forEach((b) => (b.onclick = () => { cochesEtat[b.dataset.coche] = b.dataset.v; render() }))
  if ($('editerCoches')) $('editerCoches').onclick = editerCoches
  $('filters').querySelectorAll('select[data-k]').forEach((s) => (s.onchange = () => { const k = s.dataset.k; s.value ? (sel[k] = s.value) : delete sel[k]; render() }))
  // Choisir un nœud garde ceux du dessus et efface ceux du dessous.
  $('filters').querySelectorAll('select[data-a]').forEach((s) => (s.onchange = () => { const i = Number(s.dataset.a); asel = asel.slice(0, i); if (s.value) asel.push(s.value); render() }))
  // Caractéristiques : n'apparaissent qu'une fois le modèle déterminé
  const chars = modelChars()
  const autres = MODELES.length > 1 ? ` <span class="na">(+ ${MODELES.length - 1} autre${MODELES.length > 2 ? 's' : ''} fiche${MODELES.length > 2 ? 's' : ''})</span>` : ''
  $('chartitle').innerHTML = sel.modele ? (chars.length ? `Caractéristiques · <b>${esc(sel.modele)}</b>${autres}` : `Aucune caractéristique renseignée pour <b>${esc(sel.modele)}</b>`) : 'Choisis une sous-famille pour filtrer sur ses caractéristiques'

  // Modèle activé dans Paramètres avec tension mini/maxi renseignée : un seul champ « Tension » remplace les deux pastilles
  const tensionOn = !!(sel.modele && SETTINGS.modelesTension.includes(sel.modele))
  tKeyMini = tensionOn ? chars.find(isMiniKey) : null
  tKeyMaxi = tensionOn ? chars.find(isMaxiKey) : null
  const tensionMode = !!(tKeyMini && tKeyMaxi)
  if (!tensionMode) tensionVal = ''
  else { delete csel[tKeyMini]; delete csel[tKeyMaxi] }
  const twinKeys = new Set(REV ? REV.labels.flatMap((L) => [L.kA, L.kB]) : [])
  twinKeys.forEach((k) => delete csel[k])
  const filterChars = (tensionMode ? chars.filter((k) => k !== tKeyMini && k !== tKeyMaxi) : chars).filter((k) => !twinKeys.has(k))

  const focusOnTension = document.activeElement && document.activeElement.id === 'tension'
    ? { start: document.activeElement.selectionStart, end: document.activeElement.selectionEnd } : null
  // Filtres regroupés par catégorie du dictionnaire ; le préfixe « Catégorie : » est retiré du libellé dans son groupe
  const catOf = catOfK, shortLabel = shortLabelK
  const tensionHtml = tensionMode ? `<div class="f"><label for="tension" title="Tension">Tension</label><input id="tension" type="text" inputmode="decimal" autocomplete="off" placeholder="ex : 24" value="${esc(tensionVal)}" class="tensioninput${tensionVal !== '' ? ' on' : ''}"></div>` : ''
  const tensionCat = tensionMode ? catOf(tKeyMini) : ''
  const fGroups = new Map()
  filterChars.forEach((k) => { const c = catOf(k); if (!fGroups.has(c)) fGroups.set(c, []); fGroups.get(c).push(k) })
  if (tensionMode && !fGroups.has(tensionCat)) fGroups.set(tensionCat, [])
  let fi = 0
  // Une caractéristique sans aucune valeur pour les pièces encore possibles est masquée
  // (ex. les dimensions des détecteurs rectangulaires quand la forme choisie est cylindrique).
  const ordreFiche = SETTINGS.disposition?.caracteristiques?.[sel.modele]
  const groupHtml = (cat, keys) => ordonner(keys.map((k) => ({ id: k })), ordreFiche).map(({ id: k }) => {
    const vals = PIECES.filter((p) => match(p, null, k)).map((p) => p.car[k]).filter((v) => v)
    if (!vals.length && !csel[k] && !configuration) return ''
    const i = fi++
    return `<div class="f" data-bloc="${esc(k)}"><label for="c_${i}" title="${esc(k)}">${esc(shortLabel(k, cat))}</label><select id="c_${i}" data-k="${esc(k)}" data-img="c:${esc(k)}" class="${csel[k] ? 'on' : ''}">${options(vals, csel[k])}</select></div>`
  }).join('') + (tensionMode && cat === tensionCat ? tensionHtml : '')
  const onlyNoCat = fGroups.size <= 1 && (fGroups.size === 0 || fGroups.has(''))
  // Côtés A / B (pièces réversibles) : valeurs possibles calculées dans les deux sens
  const revVals = (sd, n) => {
    const out = []
    PIECES.filter((p) => match(p, null, { s: sd, n })).forEach((p) => revAssign(p, { s: sd, n }).forEach((a) => {
      const L = REV.labels.find((x) => x.n === n); const kf = (sd === 'A') === (a === '12') ? 'kA' : 'kB'; const v = p.car[L[kf]]; if (v) out.push(v)
    }))
    return out
  }
  const revHtml = REV ? ['A', 'B'].map((sd) => `<div class="fgroup"><div class="kcat">${sd === 'A' ? 'Un côté' : "L'autre côté"}<span class="revnote">⇄ ${esc(REV.catA)} ou ${esc(REV.catB)}</span></div><div class="filters">${REV.labels.map((L) => {
    const i = fi++
    return `<div class="f"><label for="c_${i}" title="${esc(L.label)}">${esc(L.label)}</label><select id="c_${i}" data-rs="${sd}" data-rn="${esc(L.n)}" class="${rsel[sd][L.n] ? 'on' : ''}">${options(revVals(sd, L.n), rsel[sd][L.n])}</select></div>`
  }).join('')}</div></div>`).join('') : ''
  const description = sel.modele && (configuration
    ? `<textarea id="descriptionFiche" class="description-fiche" placeholder="Description de la fiche « ${esc(sel.modele)} » (affichée ici, sous Caractéristiques)">${esc(SETTINGS.descriptions?.[sel.modele] || '')}</textarea>`
    : SETTINGS.descriptions?.[sel.modele] ? `<p class="description-fiche">${esc(SETTINGS.descriptions[sel.modele]).replace(/\n/g, '<br>')}</p>` : '')
  $('charfilters').innerHTML = (description || '') + (onlyNoCat ? groupHtml('', fGroups.get('') || [])
    : ordonner([...fGroups].map(([cat, keys]) => ({ id: cat, keys })), SETTINGS.disposition?.blocs?.[sel.modele]).map(({ id: cat, keys }) => {
      const html = groupHtml(cat, keys)
      if (!html) return ''
      // Le nom du bloc : celui du dictionnaire, ou celui donné en mode configuration.
      const nom = SETTINGS.disposition?.nomsBlocs?.[sel.modele]?.[cat] || cat || 'Autres'
      const titre = configuration
        ? `<div class="kcat titre-bloc"><span class="poignee-bloc" draggable="true" title="Glisser pour déplacer le bloc">⠿</span><input class="nom-bloc" data-cat="${esc(cat)}" value="${esc(nom)}" title="Nom du bloc (vide : nom d'origine)"></div>`
        : `<div class="kcat">${esc(nom)}</div>`
      return `<div class="fgroup" data-groupe="${esc(cat)}">${titre}<div class="filters">${html}</div></div>`
    }).join('')) + revHtml
  $('charfilters').querySelectorAll('input.nom-bloc').forEach((i) => (i.onchange = () => {
    const noms = { ...(SETTINGS.disposition?.nomsBlocs || {}) }
    noms[sel.modele] = { ...(noms[sel.modele] || {}), [i.dataset.cat]: i.value.trim() }
    if (!i.value.trim()) delete noms[sel.modele][i.dataset.cat]
    SETTINGS.disposition = { ...SETTINGS.disposition, nomsBlocs: noms }
    saveSettings(); render()
  }))
  if ($('descriptionFiche')) $('descriptionFiche').onchange = (e) => { SETTINGS.descriptions = { ...SETTINGS.descriptions, [sel.modele]: e.target.value.trim() }; saveSettings() }
  brancherConfiguration()
  ameliorerMenus()
  $('charfilters').querySelectorAll('select[data-k]').forEach((s) => (s.onchange = () => { const k = s.dataset.k; s.value ? (csel[k] = s.value) : delete csel[k]; render() }))
  $('charfilters').querySelectorAll('select[data-rs]').forEach((s) => (s.onchange = () => { const sd = s.dataset.rs, n = s.dataset.rn; s.value ? (rsel[sd][n] = s.value) : delete rsel[sd][n]; render() }))
  const tIn = $('tension')
  if (tIn) {
    let tT; tIn.oninput = () => { clearTimeout(tT); const v = tIn.value; tT = setTimeout(() => { tensionVal = v.trim(); render() }, 150) }
    if (focusOnTension) { tIn.focus(); try { tIn.setSelectionRange(focusOnTension.start, focusOnTension.end) } catch {} }
  }
  if (sel.modele !== lastModel) { lastModel = sel.modele; const cf = $('charfilters'); cf.classList.remove('fade'); void cf.offsetWidth; cf.classList.add('fade') }

  // Pastilles des filtres actifs
  const chips = [...MAIN.filter(([k]) => sel[k]).map(([k, l]) => ({ t: 'm', k, l, v: sel[k] })), ...Object.keys(csel).map((k) => ({ t: 'c', k, l: k, v: csel[k] })),
    ...(tensionMode && tensionVal !== '' ? [{ t: 't', k: 'tension', l: 'Tension', v: tensionVal + ' V' }] : []),
    ...(asel.length && ARBO ? [{ t: 'a', k: 'arbo', l: asel.map((id) => ARBO.noeuds.get(id)?.code).join(' › '), v: libelleNoeud(ARBO.noeuds.get(asel.at(-1))) }] : []),
    ...(REV ? ['A', 'B'].flatMap((sd) => Object.keys(rsel[sd]).map((n) => { const L = REV.labels.find((x) => x.n === n); return { t: 'r', s: sd, n, l: (sd === 'A' ? 'Un côté' : "L'autre côté") + ' · ' + (L ? L.label : n), v: rsel[sd][n] } })) : []),
    // Les coches réglées sur Oui ou Non, visibles même quand le bloc Options est replié.
    ...toutesLesCoches().filter((c) => (cochesEtat[c.id] || 'tous') !== 'tous').map((c) => ({ t: 'k', k: c.id, l: c.nom, v: `${c.nom} : ${cochesEtat[c.id] === 'oui' ? 'oui' : 'non'}` }))]
  $('chips').innerHTML = chips.map((c, i) => `<button class="chip" type="button" data-i="${i}" title="${esc(c.l)}">${esc(c.v)}<span>✕</span></button>`).join('')
  $('chips').querySelectorAll('.chip').forEach((b) => (b.onclick = () => { const c = chips[b.dataset.i]; if (c.t === 'm') delete sel[c.k]; else if (c.t === 'k') cochesEtat[c.k] = 'tous'; else if (c.t === 'a') asel = []; else if (c.t === 't') tensionVal = ''; else if (c.t === 'r') delete rsel[c.s][c.n]; else delete csel[c.k]; render() }))

  // Tableau, triable en cliquant sur une colonne (pastille ▲▼ = colonne active)
  if (sortIsChar && !(sortIsChar === 'x' ? COLONNES_COMPLEMENTS : chars).includes(sortKey)) { sortKey = 'des'; sortIsChar = false; sortDir = 1 }
  const res = PIECES.filter((p) => match(p)).sort((a, b) => {
    const val = (p) => (sortIsChar === 'x' ? p.extra?.[sortKey] : sortIsChar ? p.car[sortKey] : p[sortKey])
    const va = val(a), vb = val(b)
    const ea = va == null || va === '' || va === NA, eb = vb == null || vb === '' || vb === NA
    if (ea && eb) return 0; if (ea) return 1; if (eb) return -1
    return sortDir * String(va).localeCompare(String(vb), 'fr', { numeric: true })
  })
  $('count').innerHTML = `<b>${res.length}</b> / ${PIECES.length} pièces`
  // Les colonnes du tableau : les fixes, les caractéristiques de la fiche, les compléments (ex. le stock).
  // L'ordre et les colonnes masquées sont propres à ce poste (« Colonnes », glisser un titre).
  const cell = (v) => (v && v !== NA ? esc(v) : '<span class="na">—</span>')
  // Famille ou sous-famille proposée par PDRTEC (absente de la GMAO) : en jaune, avec la raison au survol.
  const cellClasse = (p, k) => (p.propose?.[k] ? `<span class="propose" title="${esc(explicationProposition(p, k))}">${esc(p[k])}</span>` : cell(p[k]))
  const toutes = [
    { cle: 'code', titre: 'Code', tri: ['code', false], classe: 'code', html: (p) => `<span class="caret">›</span>${hl(p.code)}<button type="button" class="cpy" data-code="${esc(p.code)}" title="Copier le code" aria-label="Copier le code ${esc(p.code)}">${ICON_COPY}</button>`, brut: (p) => p.code },
    { cle: 'des', titre: 'Désignation', tri: ['des', false], classe: 'des', html: (p) => (modeLegumes ? `<span class="legume" title="${esc(p.des)}">${esc(nomLegume(p))}</span>` : hl(p.des)), brut: (p) => p.des },
    { cle: 'empl', titre: 'Emplacement', tri: ['empl', false], classe: 'empl', html: (p) => emplHtml(p.empl), brut: (p) => p.empl },
    { cle: 'famille', titre: 'Famille', tri: ['famille', false], html: (p) => cellClasse(p, 'famille'), brut: (p) => p.famille },
    { cle: 'sousfamille', titre: 'Sous-famille', tri: ['sousfamille', false], html: (p) => cellClasse(p, 'sousfamille'), brut: (p) => p.sousfamille },
    ...chars.map((c) => ({ cle: 'c:' + c, titre: c, tri: [c, true], classe: 'char', html: (p) => cell(p.car[c]), brut: (p) => p.car[c] })),
    ...COLONNES_COMPLEMENTS.map((c) => ({ cle: 'x:' + c, titre: c.charAt(0).toUpperCase() + c.slice(1), tri: [c, 'x'], classe: 'extra', nombre: true, html: (p) => (p.extra?.[c] == null || p.extra[c] === '' ? '<span class="na">—</span>' : esc(nombreLisible(p.extra[c]))), brut: (p) => p.extra?.[c] })),
  ]
  const colonnes = ordonner(toutes.map((c) => ({ ...c, id: c.cle })), choixColonnes.ordre).filter((c) => !choixColonnes.masquees.includes(c.cle))
  derniereListe = { res, colonnes, toutes }
  const th = (c) => {
    const [cle, genre] = c.tri
    const on = sortIsChar === genre && sortKey === cle
    return `<th class="${c.classe === 'char' ? 'char' : c.classe === 'extra' ? 'extra' : ''}" draggable="true" data-col="${esc(c.cle)}" data-key="${esc(cle)}" data-char="${genre === 'x' ? 'x' : genre ? 1 : 0}">${esc(c.titre)}${on ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}<span class="poignee-col" title="Glisser pour régler la largeur ; double-clic : largeur automatique"></span></th>`
  }
  $('thead').innerHTML = '<tr>' + colonnes.map(th).join('') + '</tr>'
  appliquerLargeurs()
  brancherOrdreColonnes(colonnes)
  $('thead').querySelectorAll('th[data-key]').forEach((t) => (t.onclick = (e) => {
    if (e.target.closest('.poignee-col')) return
    const key = t.dataset.key, isChar = t.dataset.char === 'x' ? 'x' : t.dataset.char === '1'
    if (sortKey === key && sortIsChar === isChar) sortDir *= -1; else { sortKey = key; sortIsChar = isChar; sortDir = 1 }
    render()
  }))
  const n = Math.max(1, colonnes.length)
  $('tbody').innerHTML = res.length ? res.slice(0, 500).map((p, i) =>
    `<tr class="row" tabindex="0" data-i="${i}">${colonnes.map((c) => `<td${c.classe ? ` class="${c.classe}"` : ''}>${c.html(p)}</td>`).join('')}</tr>`
    + `<tr class="detail" hidden><td colspan="${n}">${detail(p)}</td></tr>`).join('')
    : PIECES.length ? `<tr><td class="empty" colspan="${n}">Aucune pièce ne correspond. Retire un filtre pour élargir.</td></tr>`
      : `<tr><td class="empty" colspan="${n}">Aucune donnée chargée. « Actualiser depuis la base », ou glisse un export Excel du rapport ici.</td></tr>`
  if (res.length > 500) $('tbody').insertAdjacentHTML('beforeend', `<tr><td class="empty" colspan="${n}">500 premières pièces affichées · affine la recherche</td></tr>`)
  $('tbody').querySelectorAll('.cpy').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); copyCode(b) }; b.onkeydown = (e) => e.stopPropagation() })
  $('tbody').querySelectorAll('tr.row').forEach((tr) => { const t = () => { tr.classList.toggle('open'); tr.nextElementSibling.hidden = !tr.classList.contains('open') }; tr.onclick = t; tr.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t() } } })
  majDefilHaut()
}

// ---------------------------------------------------------------- photos et pièces jointes

// Le lien d'un fichier de la GMAO, reconstruit à partir de son empreinte avec le modèle des paramètres.
function photoUrl(hash) {
  if (!hash || !SETTINGS.serveur || !SETTINGS.modeleLien) return null
  const srv = SETTINGS.serveur.trim().replace(/\/+$/, '')
  if (!srv) return null
  const base = /^https?:\/\//i.test(srv) ? srv : 'http://' + srv
  const m = String(hash).match(/^([^.]+)(?:\.([a-z0-9]+))?$/i); if (!m) return null
  const h = m[1].toLowerCase(), ext = m[2] || 'png'
  const valeurs = { serveur: base, empreinte: h, extension: ext, e1: h[0], e2: h[1], e3: h[2], e4: h[3] }
  return SETTINGS.modeleLien.replace(/\{(\w+)\}/g, (tout, nom) => (nom in valeurs ? valeurs[nom] : tout))
}
// Images : on essaie l'extension annoncée, puis ses variantes de casse, puis les formats courants.
// Couvre les exports sans colonne d'extension, les .jpeg/.jpg et les serveurs sensibles à la casse.
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
function photoCandidates(hash) {
  if (!hash) return []
  const m = String(hash).match(/^([^.]+)(?:\.([a-z0-9]+))?$/i); if (!m) return []
  const exts = []
  const add = (e) => { if (e && !exts.includes(e)) exts.push(e) }
  if (m[2]) { add(m[2]); add(m[2].toLowerCase()); add(m[2].toUpperCase()) }
  IMG_EXTS.forEach((e) => add(e)); IMG_EXTS.forEach((e) => add(e.toUpperCase()))
  return exts.map((e) => photoUrl(m[1] + '.' + e)).filter(Boolean)
}
// Erreur de chargement : on passe à l'extension suivante ; quand tout a échoué, on appelle le repli
function tryNextImg(img, onFail) {
  const rest = (img.dataset.next || '').split('|').filter(Boolean)
  if (rest.length) { img.dataset.next = rest.slice(1).join('|'); img.src = rest[0]; return }
  onFail(img)
}
function pjFail(img) { const a = img.parentNode; a.classList.add('doc'); img.replaceWith('Document') }
// Émoji natif plutôt qu'une icône dessinée à la main. Une fois sur deux, la chèvre laisse place à un fromage de chèvre.
// Tirage refait à chaque ouverture de la page, mais stable pour une pièce donnée (sinon l'icône changerait à chaque filtre)
const GOAT_SEED = Math.floor(Math.random() * 1e9)
const goatHash = (t) => [...String(t)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, GOAT_SEED)
function goatHtml(code) {
  return goatHash(code) % 2
    ? '<span class="goat" role="img" aria-label="fromage de chèvre">🧀</span><span class="sadlabel">Pas de photo</span>'
    : '<span class="goat" role="img" aria-label="chèvre">🐐</span><span class="sadlabel">Pas de photo</span>'
}
function goatFail(img) { const box = img.closest('.photobox'); if (box) { box.classList.add('empty'); box.innerHTML = goatHtml(img.dataset.code) } }
// Appelées par les attributs onerror des images (le tableau est écrit en HTML).
window.pdrtec = { photoErr: (img) => tryNextImg(img, goatFail), pjErr: (img) => tryNextImg(img, pjFail) }
function photoBox(p) {
  const c = photoCandidates(p.photo), url = c[0]
  return url ? `<div class="photobox"><img src="${esc(url)}" alt="Photo de la pièce" loading="lazy" data-code="${esc(p.code)}" data-next="${esc(c.slice(1).join('|'))}" onerror="pdrtec.photoErr(this)"></div>`
    : `<div class="photobox empty">${goatHtml(p.code)}</div>`
}
// observationMachine vient d'une agrégation (plusieurs lignes liées jointes par " ; ") :
// entrées vides et doublons littéraux fréquents, à nettoyer avant affichage
function splitObsMachine(s) {
  const seen = new Set()
  // le « # » est un remplissage saisi dans la GMAO quand il n'y a pas d'observation
  return String(s ?? '').split(';').map(clean)
    .map((l) => l.replace(/\s*:\s*#\s*$/, '').replace(/:\s*#\s+/, ': '))
    .filter(Boolean).filter((l) => { const k = norm(l); if (seen.has(k)) return false; seen.add(k); return true })
}
// Observation machine : ce qui suit le premier « : » (l'observation elle-même) est surligné
function omLine(l) {
  const i = l.indexOf(':')
  if (i < 0 || !l.slice(i + 1).trim()) return `<div>${hl(l)}</div>`
  return `<div>${hl(l.slice(0, i + 1))} <mark class="hl">${hl(l.slice(i + 1).trim())}</mark></div>`
}
// Caractéristiques regroupées par catégorie du dictionnaire (ordre d'apparition dans les données)
function carGroups(p, kv) {
  const chip = ([k, v]) => `<span>${esc(k)} : <b>${v ? hl(v) : '<span class="na">vide</span>'}</b></span>`
  const groups = new Map()
  kv.forEach((e) => { const g = p.carCat[e[0]] || ''; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(e) })
  if (groups.size === 1 && groups.has('')) return `<div class="kv">${kv.map(chip).join('')}</div>`
  return [...groups].map(([g, list]) => `<div class="kcat">${esc(g || 'Sans catégorie')}</div><div class="kv">${list.map(chip).join('')}</div>`).join('')
}
function detail(p) {
  // Les " / " du rapport sont des retours à la ligne
  const lines = p.obs.replace(/^[*/\s]+/, '').split(/\s\/\s?/).map(clean).filter(Boolean)
  const omLines = splitObsMachine(p.obsMachine)
  const kv = Object.entries(p.car)
  const pjs = p.pj.map((h) => {
    const u = photoUrl(h)
    const isImg = !/\.[a-z0-9]+$/i.test(h) || /\.(png|jpe?g|gif|bmp|webp)$/i.test(h)
    if (u && !isImg) { const ext = (h.match(/\.([a-z0-9]+)$/i) || [, ''])[1]; return `<a class="pjitem doc" href="${esc(u)}" target="_blank" rel="noopener" title="Ouvrir le document">${esc(ext || 'Document')}</a>` }
    const c = photoCandidates(h)
    return c.length ? `<a class="pjitem" href="${esc(c[0])}" target="_blank" rel="noopener" title="Ouvrir la pièce jointe"><img src="${esc(c[0])}" alt="Pièce jointe" loading="lazy" data-next="${esc(c.slice(1).join('|'))}" onload="this.parentNode.href=this.src" onerror="pdrtec.pjErr(this)"></a>`
      : `<span class="pjitem doc" title="${esc(h)}">Document</span>`
  }).join('')
  const proposition = p.propose?.famille || p.propose?.sousfamille
    ? `<div class="k">Classement proposé (absent de la GMAO)</div><div><span class="propose">${esc(p.famille)} › ${esc(p.sousfamille)}</span></div><div class="note">${esc(explicationProposition(p, p.propose.sousfamille ? 'sousfamille' : 'famille'))}. À reporter dans la GMAO si c'est juste.</div>`
    : ''
  const obs = `<div class="obs">${proposition}${p.empl ? `<div class="k">Emplacement</div><div>${emplHtml(p.empl)}</div>` : ''}<div class="k">Observation</div>${lines.length ? lines.map((l) => `<div>${hl(l)}</div>`).join('') : '<div class="na">Aucune observation</div>'}`
    + (omLines.length ? `<div class="k">Observation machine</div>${omLines.map(omLine).join('')}` : '')
    + (p.chemins?.length ? `<div class="k">Montée sur (arborescence)</div>${p.chemins.slice(0, 12).map((c) => `<div class="chemin-arbo">${c.map((n, i) => (i === c.length - 1 ? `<b>${hl(libelleNoeud(n))}</b>` : hl(n.code))).join(' › ')}</div>`).join('')}${p.chemins.length > 12 ? `<div class="na">… et ${p.chemins.length - 12} autres</div>` : ''}` : '')
    + (p.pj.length ? `<div class="k">Pièces jointes (${p.pj.length})</div><div class="pjlist">${pjs}</div>` : '')
    + `<div class="k">Caractéristiques</div>${kv.length ? carGroups(p, kv) : '<div class="na">Aucune</div>'}</div>`
  return `<div class="detailgrid">${photoBox(p)}${obs}</div>`
}

// Copier le code PDR : icône à côté du code, ✓ pendant un instant une fois copié
function copyCode(btn) {
  const code = btn.dataset.code
  const done = (ok) => {
    btn.innerHTML = ok ? ICON_OK : ICON_COPY; btn.classList.toggle('ok', ok); btn.title = ok ? 'Copié !' : 'Copie impossible'
    clearTimeout(btn._t); btn._t = setTimeout(() => { btn.innerHTML = ICON_COPY; btn.classList.remove('ok'); btn.title = 'Copier le code' }, 1200)
  }
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = code; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select()
    let ok = false; try { ok = document.execCommand('copy') } catch {} ta.remove(); done(ok)
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => done(true), fallback); else fallback()
}

// ---------------------------------------------------------------- export Excel (secours, sans connexion)

// SheetJS n'est chargé qu'au premier fichier (embarqué avec PDRTEC : pas besoin d'Internet).
let sheetjs = null
function chargerSheetJS() {
  sheetjs ??= new Promise((ok, echec) => {
    const script = document.createElement('script')
    script.src = new URL('../../interface/vendor/xlsx.full.min.js', import.meta.url).href
    script.onload = () => ok(window.XLSX)
    script.onerror = () => echec(new Error('Lecteur Excel introuvable'))
    document.head.append(script)
  })
  return sheetjs
}
function readFile(f) {
  const fr = new FileReader()
  fr.onload = async (e) => {
    try {
      const XLSX = await chargerSheetJS()
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
      const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' })
      fromAOA(aoa, f.name)
    } catch { $('source').textContent = 'Impossible de lire ce fichier. Réexporte le rapport BIRT au format Excel et réessaie.' }
  }
  fr.readAsArrayBuffer(f)
}
// Un seul fichier : chargement direct. Plusieurs : on demande lequel.
function handleFiles(files) {
  if (!files || !files.length) return
  if (files.length === 1) { readFile(files[0]); return }
  const list = [...files], fcDlg = $('filechoice')
  $('filechoiceList').innerHTML = list.map((f, i) => `<button class="btn" type="button" data-i="${i}">${esc(f.name)}</button>`).join('')
  $('filechoiceList').querySelectorAll('button').forEach((b) => (b.onclick = () => { fcDlg.close(); readFile(list[b.dataset.i]) }))
  fcDlg.showModal()
}

// ---------------------------------------------------------------- paramètres

// Un modèle n'est proposé que s'il a, sur au moins une de ses pièces, une caractéristique Tension mini ET Tension maxi
function modelHasTensionRange(modele) {
  let hasMini = false, hasMaxi = false
  for (const p of PIECES) {
    if (p.modele !== modele) continue
    for (const k in p.car) { if (!hasMini && isMiniKey(k)) hasMini = true; if (!hasMaxi && isMaxiKey(k)) hasMaxi = true }
    if (hasMini && hasMaxi) return true
  }
  return false
}
function renderSettingsModels() {
  const models = [...new Set(PIECES.map((p) => p.modele))].filter((m) => m && m !== NA && modelHasTensionRange(m)).sort(sortFr)
  $('stgModels').innerHTML = models.length ? models.map((m) => `<label><input type="checkbox" data-m="${esc(m)}"${SETTINGS.modelesTension.includes(m) ? ' checked' : ''}> ${esc(m)}</label>`).join('') : '<p class="na">Aucun modèle avec tension mini/maxi dans les données chargées</p>'
  $('stgModels').querySelectorAll('input[type=checkbox]').forEach((cb) => (cb.onchange = () => {
    const m = cb.dataset.m
    if (cb.checked) { if (!SETTINGS.modelesTension.includes(m)) SETTINGS.modelesTension = [...SETTINGS.modelesTension, m] }
    else SETTINGS.modelesTension = SETTINGS.modelesTension.filter((x) => x !== m)
    saveSettings(); render()
  }))
}
function ouvrirParametres() {
  $('stgServer').value = SETTINGS.serveur
  $('stgLien').value = SETTINGS.modeleLien
  $('stgReversible').checked = !!SETTINGS.reversible
  $('stgPropositions').checked = SETTINGS.propositions !== false
  renderSettingsModels()
  $('settings').showModal()
}
async function enregistrerRequete(envoi) {
  try {
    const r = await envoi()
    $('stgRequete').value = r.requete
    requeteReglee = true
    $('settings').close()
    chargerDepuisLaBase(true)
  } catch (erreur) {
    notifier(erreur.message, 'erreur')
  }
}

// ---------------------------------------------------------------- évènements

function brancherEvenements() {
  let t; $('q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { q = e.target.value.trim(); Q = parseQuery(q); render() }, 120) }
  $('reset').onclick = () => { sel = {}; csel = {}; rsel = { A: {}, B: {} }; asel = []; q = ''; Q = []; $('q').value = ''; render() }
  $('actualiser').onclick = () => chargerDepuisLaBase(true)
  $('file').onchange = (e) => handleFiles(e.target.files)
  const app = $('app')
  app.ondragover = (e) => { e.preventDefault(); app.classList.add('drop') }
  app.ondragleave = (e) => { if (!app.contains(e.relatedTarget)) app.classList.remove('drop') }
  app.ondrop = (e) => { e.preventDefault(); app.classList.remove('drop'); handleFiles(e.dataTransfer.files) }

  // Fenêtres : fermeture par le bouton ou par un clic à côté.
  for (const [id, bouton] of [['notice', 'closeNotice'], ['settings', 'closeSettings'], ['filechoice', 'closeFilechoice']]) {
    const dlg = $(id)
    $(bouton).onclick = () => dlg.close()
    dlg.onclick = (e) => { if (e.target === dlg) dlg.close() }
  }
  $('help').onclick = () => $('notice').showModal()
  $('settingsBtn').onclick = ouvrirParametres
  // Les paramètres sont réservés à l'administrateur (KTEC 0.6 et plus).
  if (etat.modeAdmin === false) $('settingsBtn').hidden = true
  $('stgServer').oninput = () => { SETTINGS.serveur = $('stgServer').value.trim(); saveSettings(); render() }
  $('stgLien').oninput = () => { SETTINGS.modeleLien = $('stgLien').value.trim(); saveSettings(); render() }
  $('stgReversible').onchange = () => { SETTINGS.reversible = $('stgReversible').checked; rsel = { A: {}, B: {} }; saveSettings(); render() }
  $('stgPropositions').onchange = () => { SETTINGS.propositions = $('stgPropositions').checked; appliquerPropositions(); sel = {}; csel = {}; saveSettings(); render() }
  brancherDefilHaut()
  $('choixColonnes').onclick = choisirColonnes
  window.addEventListener('resize', majDefilHaut)
  $('agrandir').onclick = () => agrandirTable(!document.querySelector('.pdrtec').classList.contains('table-agrandie'))
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.querySelector('.pdrtec.table-agrandie')) agrandirTable(false) })
  $('exporterExcel').onclick = () => exporterListe('xlsx')
  $('exporterCsv').onclick = () => exporterListe('csv')
  $('stgComplementsOk').onclick = async () => {
    try {
      await api('/api/complements/requete', { methode: 'POST', corps: { sql: $('stgComplements').value } })
      notifier('Requête des compléments enregistrée')
      $('settings').close()
      chargerDepuisLaBase(true)
    } catch (erreur) {
      notifier(erreur.message, 'erreur')
    }
  }
  $('stgConfiguration').onchange = () => { basculerConfiguration($('stgConfiguration').checked); if (configuration) $('settings').close() }
  $('dispositionDefaut').onclick = () => {
    SETTINGS.disposition = { ...SETTINGS.disposition, principaux: [], caracteristiques: { ...(SETTINGS.disposition?.caracteristiques || {}) } }
    if (sel.modele) {
      delete SETTINGS.disposition.caracteristiques[sel.modele]
      SETTINGS.disposition.blocs = { ...(SETTINGS.disposition.blocs || {}) }; delete SETTINGS.disposition.blocs[sel.modele]
      SETTINGS.disposition.nomsBlocs = { ...(SETTINGS.disposition.nomsBlocs || {}) }; delete SETTINGS.disposition.nomsBlocs[sel.modele]
    }
    saveSettings(); render()
    notifier('Disposition par défaut rétablie')
  }
  document.addEventListener('click', (e) => { if (!e.target.closest('.dd-zone')) document.querySelectorAll('.dd-liste').forEach((l) => (l.hidden = true)) })
  $('stgArboOk').onclick = async () => {
    try {
      await api('/api/arborescence/requetes', { methode: 'POST', corps: { arbre: $('stgArbre').value, liens: $('stgLiens').value } })
      notifier('Requêtes de l’arborescence enregistrées')
      $('settings').close()
      chargerDepuisLaBase(true)
    } catch (erreur) {
      notifier(erreur.message, 'erreur')
    }
  }
  $('stgRequeteOk').onclick = () => enregistrerRequete(() => api('/api/requete', { methode: 'POST', corps: { sql: $('stgRequete').value } }))
  $('stgRptdesign').onchange = (e) => {
    const fichier = e.target.files[0]
    if (fichier) enregistrerRequete(() => api('/api/requete/rptdesign', { methode: 'POST', fichier }))
    e.target.value = ''
  }

  // Survol de la photo d'une pièce : aperçu agrandi au centre (délégation, le tableau étant reconstruit à chaque filtre)
  const box = $('photoPreview'), big = box.querySelector('img')
  app.onmouseover = (e) => {
    const img = e.target.closest && e.target.closest('.photobox img')
    if (!img || !img.complete || !img.naturalWidth) return
    big.src = img.currentSrc || img.src; box.classList.add('on')
  }
  app.onmouseout = (e) => { if (e.target.closest && e.target.closest('.photobox img')) box.classList.remove('on') }
  if (!ecouteDefilement) {
    ecouteDefilement = true
    window.addEventListener('scroll', () => $('photoPreview')?.classList.remove('on'), { passive: true })
  }

  logoEtTitre()
}

// Variante aléatoire du logo à l'ouverture : une fois sur deux, un chevelu (coupe afro, sans barbe) plutôt que le barbu.
// Easter egg discret : clique sur la tête, elle gonfle, éclate au 10e clic → concombre masqué (re-clique pour revenir)
const CHEVELU_SVG = `<svg viewBox="0 0 80 80" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="40" cy="15" r="15" fill="currentColor" stroke="none"/>
      <circle cx="21" cy="19" r="12" fill="currentColor" stroke="none"/>
      <circle cx="59" cy="19" r="12" fill="currentColor" stroke="none"/>
      <circle cx="10" cy="29" r="10" fill="currentColor" stroke="none"/>
      <circle cx="70" cy="29" r="10" fill="currentColor" stroke="none"/>
      <circle cx="16" cy="38" r="8.5" fill="currentColor" stroke="none"/>
      <circle cx="64" cy="38" r="8.5" fill="currentColor" stroke="none"/>
      <path d="M20.5,32 C15.5,31 15,40 20.5,41 M59.5,32 C64.5,31 65,40 59.5,41"/>
      <circle cx="32" cy="32" r="6" stroke-width="2"/><circle cx="48" cy="32" r="6" stroke-width="2"/>
      <path d="M38,31.5 Q40,29.8 42,31.5 M26,31 L20.5,30 M54,31 L59.5,30" stroke-width="2"/>
      <circle cx="32" cy="32.5" r="1.8" fill="currentColor" stroke="none"/><circle cx="48" cy="32.5" r="1.8" fill="currentColor" stroke="none"/>
      <path d="M40,36 L38.5,41 L41,41.5" stroke-width="1.8"/>
      <path d="M20.5,38 Q21,56 40,60 Q59,56 59.5,38"/>
      <path d="M33,49 Q40,53.5 47,49" stroke-width="1.8"/>
    </svg>`
// Le concombre masqué : une pluie de concombres sur toute la page, et les pièces rebaptisées en légumes
// (l'affichage seulement : codes, recherche, filtres et téléchargements gardent les vraies désignations).
let modeLegumes = false
const LEGUMES = ['Courgette', 'Poireau', 'Navet', 'Radis', 'Carotte', 'Betterave', 'Panais', 'Céleri', 'Artichaut', 'Aubergine', 'Potiron', 'Brocoli', 'Chou-fleur', 'Épinard', 'Haricot', 'Petit pois', 'Topinambour', 'Rutabaga', 'Salsifis', 'Cornichon', 'Fenouil', 'Asperge', 'Endive', 'Patate douce']
const QUALITES = ['hydraulique', 'pneumatique', 'blindé', 'turbo', 'inductif', 'à roulements', 'renforcé', 'double effet', 'étanche', 'basse tension', 'magnétique', 'graissé', 'à ressort', 'haute pression', 'anti-vibration', 'masqué']
function nomLegume(p) {
  const n = [...String(p.code)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const chiffres = String(p.des).match(/\d+(?:[.,]\d+)?/)
  return `${LEGUMES[n % LEGUMES.length]} ${QUALITES[(n >>> 5) % QUALITES.length]}${chiffres ? ' ' + chiffres[0] : ''}`
}
function pluieDeConcombres() {
  const image = new URL('../../interface/concombre-petit.webp', import.meta.url).href
  const ciel = document.createElement('div')
  ciel.className = 'pluie-concombres'
  ciel.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 45; i++) {
    const c = document.createElement(i % 3 ? 'span' : 'img')
    if (c.tagName === 'IMG') c.src = image; else c.textContent = '🥒'
    c.style.left = `${Math.random() * 100}vw`
    c.style.animationDelay = `${Math.random() * 2.2}s`
    c.style.animationDuration = `${2.6 + Math.random() * 2.4}s`
    c.style.setProperty('--tour', `${Math.round(Math.random() * 720 - 360)}deg`)
    c.style.setProperty('--taille', `${0.7 + Math.random() * 0.9}`)
    ciel.append(c)
  }
  document.body.append(ciel)
  setTimeout(() => ciel.remove(), 7500)
}

function logoEtTitre() {
  const logo = $('logo'), title = $('title')
  if (Math.random() < 0.5) { logo.innerHTML = CHEVELU_SVG; title.textContent = 'Recherche PDR du chevelu' }
  const original = logo.innerHTML, ORIGINAL_TITLE = title.textContent
  const CUCUMBER = `<img class="concombre-masque" src="${new URL('../../interface/concombre-masque.webp', import.meta.url).href}" alt="Le concombre masqué">`
  let clicks = 0, popped = false
  logo.addEventListener('click', () => {
    if (popped) { popped = false; clicks = 0; logo.style.transform = ''; logo.innerHTML = original; title.textContent = ORIGINAL_TITLE; modeLegumes = false; render(); return }
    clicks++
    if (clicks >= 10) {
      popped = true
      logo.classList.add('pop')
      setTimeout(() => { logo.classList.remove('pop'); logo.style.transform = ''; logo.innerHTML = CUCUMBER; title.textContent = 'Recherche PDR du concombre masqué'; modeLegumes = true; render(); pluieDeConcombres() }, 220)
    } else {
      logo.style.transform = `scale(${1 + clicks * 0.08})`
    }
  })
}
