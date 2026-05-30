
# Senegal Economic Observatory

> Un tableau de bord interactif de l'économie sénégalaise, construit à partir des données publiques de conjoncture de la **DPEE** (Direction de la Prévision et des Études Économiques) — restructurées, nettoyées et visualisées pour le pilotage.

Données publiques · esthétique éditoriale (Financial Times × Our World in Data) · indicateurs composites avancés.

---

## Aperçu

Une application de type cadran (et non un simple site) : une page de garde, puis un tableau de bord à navigation latérale couvrant :

| Vue | Contenu |
|-----|---------|
| **Vue d'ensemble** | KPI macro (recettes, Brent, EUR/USD, USD-CFA), indices sectoriels d'activité, balance commerciale |
| **Production** | Or, ciment (production / ventes / export), pêche (artisanale vs industrielle) |
| **Échanges** | Sankey des flux commerciaux, taux de couverture, structure des importations |
| **Prix** | Suivi national des prix vivriers, dispersion régionale, choroplèthe |
| **Finances** | Recettes décomposées (TVA, douanes, autres), masse salariale, part des douanes |
| **Transport** | Trafic maritime (embarquements / débarquements) et aérien (mouvements, passagers, fret) |
| **Signaux** | Série analytique (en préparation) |

---

## Méthodologie

### Source
Toutes les séries proviennent du **Tableau de Bord de l'Économie (TBO)** mensuel de la DPEE. La dernière édition intégrée est **Janvier 2026**.

### Pipeline de traitement
Le script `quantitative_research/extract_tbo.py` (Python + `openpyxl`) lit le classeur TBO et produit des séries temporelles propres au format JSON (`frontend/public/data/`). Pour chaque série :

1. **Extraction** depuis la feuille et la colonne sources (les agrégats fragiles du classeur sont contournés au profit des feuilles d'origine).
2. **Détection d'aberrations** par écart absolu médian (MAD, seuil 3,5) — robuste aux valeurs extrêmes.
3. **Interpolation linéaire** des valeurs manquantes ou aberrantes ; la valeur brute (`raw_value`) est toujours conservée à côté de la valeur traitée (`value`).

### Indicateurs dérivés (non triviaux)
Au-delà des séries brutes, le tableau de bord calcule notamment : indice composite d'activité, **taux de couverture** des échanges, **dispersion régionale** des prix (coefficient de variation inter-marchés), **part de l'artisanal** dans la pêche, **orientation export** du ciment, **volatilité** glissante, **part des douanes** et ratio masse salariale / recettes.

### Limites de données (transparence)
- **Prix régionaux** : la DPEE a cessé de publier la ventilation par région après **mars 2019** ; la choroplèthe affiche ce dernier relevé, tandis que le **suivi national des prix est à jour** (janvier 2026).
- **Finances** : le TBO publie les recettes et la masse salariale, **mais ni les dépenses totales ni la dette** — non représentées ici.
- **Échanges** : le commerce extérieur est exprimé en **volumes** (1000 tonnes), pas en valeur ; la balance des paiements n'est pas couverte.

---

## Stack technique

- **Next.js 16** (App Router, Turbopack) · **React 19**
- **D3 v7** + **d3-sankey** pour les visualisations sur mesure
- **Tailwind CSS v4**
- Pipeline de données : **Python** + `openpyxl`

## Lancer en local

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## Licence

Code et données restructurées publiés sous licence **MIT**. Données sources : DPEE (domaine public).
