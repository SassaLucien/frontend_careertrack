# CareerTrack Frontend

Application React Native (JavaScript) pour mobile et web - SDK 54.

## Installation
```bash
npm install
```

## Scripts
- `npm start` - Démarrer le serveur Metro
- `npm run android` - Lancer sur Android
- `npm run ios` - Lancer sur iOS  
- `npm run web` - Lancer en version web

## Structure
```
├── App.js                    # Entrée principale
├── index.js                  # Registration composant
├── app.json                  # Configuration app
├── package.json              # Dépendances
└── src/
    └── screens/
        ├── HomeScreen.js
        └── LoginScreen.js
```

## API Backend
Configurer l'URL dans les services :
- Android Emulator: `http://10.0.2.2:8080/api`
- iOS/Web: `http://localhost:8080/api`