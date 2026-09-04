# Tournée matériel — V1

Application web installable (PWA) pour organiser les livraisons et récupérations de tables, chaises et barnums.

## Fonctions
- Saisie manuelle des livraisons/récupérations
- Enregistrement local dans le navigateur
- Géocodage des adresses avec OpenStreetMap/Nominatim
- Recherche d'un ordre de tournée tenant compte des distances et de la capacité du camion
- Calcul du chargement initial minimal par type de matériel pour l'ordre trouvé
- Stock camion après chaque arrêt
- Boutons Appeler et Navigation
- Installation sur iPhone via « Ajouter à l'écran d'accueil »

## Limites V1
- 20 interventions maximum recommandé
- Pas de comptes utilisateurs ni synchronisation entre appareils
- Pas encore de scan OCR des feuilles papier
- Capacités camion gérées séparément par type, pas encore en volume réel
- La distance affichée est une approximation géographique ; la navigation réelle est confiée à Google Maps/Plans
- Le service public Nominatim convient à un prototype avec faible volume, pas à une utilisation intensive ou critique

## Déploiement rapide GitHub Pages
1. Créer un dépôt GitHub, par exemple `tournee-mairie`.
2. Envoyer tous les fichiers de ce dossier à la racine du dépôt.
3. Dans GitHub : Settings > Pages.
4. Source : Deploy from a branch.
5. Branch : main, dossier /(root), puis Save.
6. GitHub fournit ensuite une URL HTTPS.
7. Ouvrir cette URL sur l'iPhone dans Safari, bouton Partager > Ajouter à l'écran d'accueil.

## Déploiement Netlify
Le dossier peut aussi être glissé dans Netlify Drop pour obtenir directement une URL HTTPS.
