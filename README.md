# PDRTec

Application de la suite **[KTEC](https://github.com/Jeff12873/ktec)** : la recherche de pièces de rechange
(ex « Recherche PDR du Barbu »), en direct sur la base de la GMAO.

- **Recherche** : code, désignation, référence, observation ; expressions exactes entre guillemets ; accents ignorés.
- **Filtres en cascade** : famille › sous-famille ; le modèle de fiche technique en découle et ses caractéristiques
  deviennent des filtres et des colonnes, groupées par catégorie.
- **Tension** : un seul champ remplace « tension mini / maxi » pour les modèles choisis.
- **Pièces réversibles** : une pièce à deux extrémités (flexible…) est trouvée dans un sens comme dans l'autre.
- **Détail** : photo (agrandie au survol), emplacement (« SUPPRIME » signalé ou masqué), observation, machines où la
  pièce est montée, pièces jointes, caractéristiques ; copie du code en un clic.
- **Données en direct** par la connexion MySQL de KTEC ; en secours, un export Excel du rapport BIRT glissé sur la
  page (lu dans le navigateur, envoyé nulle part).
- Le barbu, le chevelu, la chèvre, le fromage et le concombre masqué sont toujours là.

Tout ce qui est propre au site (la requête de recherche, l'adresse du serveur des photos et le modèle de lien des
fichiers, les réglages) est rangé dans le fichier de connaissances **`.ktec`**, jamais dans ce dépôt : c'est une
coquille vide. La requête se colle dans les Paramètres ou se lit directement dans le rapport BIRT existant.

## Installer

PDRTec s'installe avec KTEC (voir le [dépôt ktec](https://github.com/Jeff12873/ktec)). Il n'a besoin que de Java
(pour la connexion MySQL), installé une seule fois pour toutes les applications. À chaque envoi sur `main`, GitHub
publie `pdrtec.zip` (l'application seule) dans les Releases.

## Développer

Dans le `reglages-poste.json` de KTEC : `{ "applisDev": ["/chemin/vers/PDRTec"] }`, puis lancer KTEC et ouvrir
http://127.0.0.1:47700/pdrtec/.

| Dossier | Contenu |
|---|---|
| `blocs/recherche/` | `serveur.js` (requête et réglages dans le .ktec, lecture de la base), `vue.js` (l'écran de recherche) |
| `blocs/aide/` | Aide intégrée (pages dans `interface/aide/`) |
| `interface/` | Menu, styles (`app.css`, reliés au thème KTEC), icône, lecteur Excel embarqué (`vendor/`) |

## Composants tiers

SheetJS Community Edition 0.18.5 (Apache 2.0), embarqué dans `interface/vendor/` pour fonctionner sans Internet.
