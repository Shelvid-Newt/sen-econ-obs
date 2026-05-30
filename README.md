# Senegal Economic Observatory

> Un tableau de bord macroéconomique avancé pour le pilotage de l'économie sénégalaise, développé sur la base des données de conjoncture de la **DPEE** (Direction de la Prévision et des Études Économiques).

![Aperçu de l'Observatoire](frontend/public/favicon.ico)

---

## Vision du projet

Le **Senegal Economic Observatory** a été conçu avec un objectif clair : transformer les données brutes issues des rapports de conjoncture (Tableau de Bord de l'Économie) en une intelligence visuelle immédiatement exploitable pour les décideurs, chercheurs et acteurs économiques.

Il ne s'agit pas d'un simple agrégateur de données, mais d'une véritable interface de pilotage alliant :
1. **Rigueur statistique** : Extraction fidèle et standardisation automatisée des données institutionnelles.
2. **Accessibilité** : Visualisations interactives et fluides permettant de saisir les tendances structurelles (recettes, production, commerce extérieur) au premier coup d'œil.
3. **Esthétique éditoriale premium** : Un design épuré, inspiré des standards internationaux (Financial Times, The Economist), pour rendre la lecture des chiffres aussi claire qu'élégante.

## Données

L'intégralité des données publiées sur ce tableau de bord provient des fichiers publics de la DPEE. 
Dans un souci de transparence, **les données brutes originales** (format Excel) ayant servi à alimenter l'interface sont incluses dans ce dépôt, sous le dossier `raw_data/`. 

Ces données brutes sont ensuite extraites et nettoyées via des scripts de recherche quantitative (Python) avant d'être injectées dans une base de données PostgreSQL (Neon) qui alimente l'API de l'application.

## Structure du projet

L'architecture est construite autour de technologies modernes (Next.js, Drizzle, PostgreSQL, D3.js) pour garantir performance, flexibilité et extensibilité.

```text
senegal-economic-observatory/
├── frontend/                 # Application Next.js (React 19, App Router)
│   ├── src/app/              # Routes et pages (Dashboard, Production, Finances...)
│   ├── src/app/api/          # API REST (Endpoints : /series, /kpis, /prices)
│   ├── src/components/       # Composants UI et visualisations D3.js interactives
│   └── src/lib/db/           # Configuration Drizzle ORM et Schémas PostgreSQL
├── quantitative_research/    # Scripts Python (ETL) pour l'extraction des données
└── raw_data/                 # Fichiers bruts de conjoncture de la DPEE
```

## Déploiement Local

Pour lancer le projet sur votre machine locale :

```bash
cd frontend
npm install
npm run dev
# L'application sera accessible sur http://localhost:3000
```

## Licence

Code publié sous licence **MIT**. 
Les données conjoncturelles sous-jacentes proviennent de la **DPEE** (Domaine public).
