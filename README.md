🔐 REST API Authentication – Express.js

API REST d’authentification construite avec Node.js, Express et JWT, permettant la gestion des utilisateurs (inscription, connexion, refresh token, logout, etc.).

🚀 Fonctionnalités

✅ Inscription (Register)

✅ Connexion (Login)

✅ Authentification via JWT

✅ Refresh Token

✅ Middleware de protection des routes

✅ Hashage des mots de passe

✅ Structure claire et scalable

🛠️ Technologies utilisées

Node.js

Express.js

JWT (JSON Web Token)

bcrypt

dotenv

MongoDB / PostgreSQL / Prisma / Mongoose (selon ton choix)

⚙️ Installation
1️⃣ Cloner le projet
git clone https://github.com/bouabre225/Api-Auth-express.git
cd Api-Auth-expres

2️⃣ Installer les dépendances
npm install

3️⃣ Configuration des variables d’environnement

Créer un fichier .env :

PORT=3001
JWT_SECRET=super_secret_key
JWT_REFRESH_SECRET=super_refresh_secret
TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
DATABASE_URL=your_database_url

4️⃣ Lancer le serveur
npm run dev

ou

npm start

Serveur disponible sur :

http://localhost:3001
