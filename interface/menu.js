// Le menu de PDRTEC, chargé par la coquille commune de KTEC (page /pdrtec/).

import recherche from '../blocs/recherche/vue.js'
import aide from '../blocs/aide/vue.js'

export const blocs = [recherche, aide]
export { recherche as accueil }
export const styles = 'interface/app.css'
