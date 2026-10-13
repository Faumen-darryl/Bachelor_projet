# Procédure de déploiement  Evently

## 1. Prérequis

- Docker et Docker Compose installés sur le serveur cible
- Un nom de domaine (optionnel pour un premier déploiement)
- Comptes actifs : Stripe, Cloudinary, un service SMTP (Gmail ou autre)
- Accès au dépôt GitHub du projet

## 2. Variables d'environnement

Avant tout déploiement, créer le fichier `apps/api/.env` à partir du modèle suivant :