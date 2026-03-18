// ICI UN SERVEUR NODEJS ARCHI MINIMAL
// QUI VA SE CONTENTER DE RENVOYER LA PAGE
// index.html située dans le dossier 
// dist/assignment-app+/browser

//Install express server
const express = require("express");
const path = require("path");

const app = express();

// Serve only the static files form the dist directory
app.use(express.static(__dirname + "/dist/assignment-app/browser"));

app.get("/*", function (req, res) {
 res.sendFile(path.join(__dirname + "/dist/assignment-app/browser/index.html"));
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8081);
