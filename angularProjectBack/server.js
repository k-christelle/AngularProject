const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('Tentative de connexion à MongoDB...');

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log('Connecté à MongoDB');

  // Admin local: créé automatiquement si absent
  const adminNom = process.env.ADMIN_NOM || 'LineoL';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  try {
    const existingAdmin = await User.findOne({ nom: adminNom });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = new User({
        id: new mongoose.Types.ObjectId().toString(),
        nom: adminNom,
        password: hashedPassword
      });
      await newAdmin.save();
      console.log(`Admin local créé: ${adminNom}`);
    } else {
      console.log(`Admin local déjà présent: ${adminNom}`);
    }
  } catch (e) {
    console.error('Erreur création admin local:', e);
  }
})
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Schéma et modèle pour les utilisateurs
const userSchema = new mongoose.Schema({
  id: String,
  nom: String,
  password: String
});

const User = mongoose.model('User', userSchema, 'CollectionMbds');

// Schéma et modèle pour les assignments
const assignmentSchema = new mongoose.Schema({
  titre: String,
  description: String,
  dateDeCreation: String,
  dateDeRendu: String,
  createdBy: String,
  assignedTo: String,
  matiere: String,
  matiereKey: String,
  matiereLabel: String,
  matiereImageUrl: String,
  auteurNom: String,
  auteurPhotoUrl: String,
  profNom: String,
  profPhotoUrl: String,
  note: Number,
  rendu: Boolean,
  remarques: String
});

const Assignment = mongoose.model('Assignment', assignmentSchema, 'Assignments');

// Routes de diagnostic (à placer au tout début)
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend Angular Project est opérationnel !',
    status: 'OK',
    routes: [
      '/api/login (POST)',
      '/api/signup (POST)',
      '/api/assignments (GET, POST, DELETE)',
      '/api/assignments/:id (PUT, DELETE)',
      '/api/users (GET)'
    ],
    mongodb: mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API Backend Assignment App',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/login', 'POST /api/signup'],
      assignments: ['GET /api/assignments', 'POST /api/assignments', 'DELETE /api/assignments'],
      assignment: ['GET /api/assignments/:id', 'PUT /api/assignments/:id', 'DELETE /api/assignments/:id'],
      users: ['GET /api/users']
    }
  });
});

// Endpoint pour la connexion
app.post('/api/login', async (req, res) => {
  const { nom, password } = req.body;
  try {
    const user = await User.findOne({ nom });
    if (user && await bcrypt.compare(password, user.password)) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Endpoint pour la création de compte
app.post('/api/signup', async (req, res) => {
  const { nom, password } = req.body;
  try {
    console.log('Tentative de création d\'utilisateur avec nom:', nom);
    const existingUser = await User.findOne({ nom });
    if (existingUser) {
      console.log('Utilisateur existant trouvé:', existingUser);
      return res.json({ success: false, message: 'Ce nom d\'utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      id: new mongoose.Types.ObjectId().toString(),
      nom,
      password: hashedPassword
    });

    console.log('Nouvel utilisateur à enregistrer:', newUser);
    await newUser.save();
    console.log('Utilisateur enregistré avec succès dans CollectionMbds');
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Endpoint pour créer un assignment
app.post('/api/assignments', async (req, res) => {
  const {
    titre,
    description,
    dateDeCreation,
    dateDeRendu,
    createdBy,
    assignedTo,
    matiere,
    matiereKey,
    matiereLabel,
    note,
    rendu,
    remarques,
    auteurNom,
    auteurPhotoUrl,
    profNom,
    profPhotoUrl,
    matiereImageUrl
  } = req.body;
  try {
    // Vérifier si l'utilisateur est un admin (par exemple, "LineoL")
    if (createdBy !== 'LineoL') {
      return res.status(403).json({ success: false, message: 'Seul l\'administrateur peut créer un assignment' });
    }

    const matiereResolved = matiere || matiereLabel || matiereKey;

    // Vérifier les champs obligatoires
    const missingFields = [];
    if (!titre) missingFields.push('titre');
    if (!description) missingFields.push('description');
    if (!dateDeCreation) missingFields.push('dateDeCreation');
    if (!dateDeRendu) missingFields.push('dateDeRendu');
    if (!assignedTo) missingFields.push('assignedTo');
    if (!matiereResolved) missingFields.push('matiere/matiereLabel/matiereKey');

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Champs manquants: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Règle: impossible de marquer rendu si pas noté (note doit exister et être entre 0 et 20)
    if (rendu === true) {
      if (note === null || note === undefined) {
        return res.status(400).json({ success: false, message: 'Impossible de marquer rendu sans note' });
      }
      if (typeof note !== 'number' || note < 0 || note > 20) {
        return res.status(400).json({ success: false, message: 'La note doit être entre 0 et 20' });
      }
    }

    // Vérifier si l'utilisateur assigné existe
    const user = await User.findOne({ nom: assignedTo });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur assigné non trouvé' });
    }

    const newAssignment = new Assignment({
      titre,
      description,
      dateDeCreation,
      dateDeRendu,
      createdBy,
      assignedTo,
      matiere: matiereResolved,
      note,
      rendu: !!rendu,
      remarques,

      // Champs optionnels (issus du front)
      matiereKey,
      matiereLabel,
      matiereImageUrl,
      auteurNom,
      auteurPhotoUrl,
      profNom,
      profPhotoUrl
    });

    console.log('Nouvel assignment à enregistrer:', newAssignment);
    await newAssignment.save();
    console.log('Assignment enregistré avec succès dans Assignments');
    res.json({ success: true, assignment: newAssignment });
  } catch (error) {
    console.error('Erreur lors de la création de l\'assignment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer tous les assignments
app.get('/api/assignments', async (req, res) => {
  const { nom } = req.query;
  try {
    let assignments;
    if (nom && nom === 'LineoL') {
      assignments = await Assignment.find({ createdBy: nom });
    } else if (nom) {
      assignments = await Assignment.find({ assignedTo: nom });
    } else {
      assignments = await Assignment.find();
    }
    console.log(`Assignments trouvés pour nom=${nom}:`, assignments);
    res.json(assignments);
  } catch (error) {
    console.error('Erreur lors de la récupération des assignments:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour supprimer un assignment par ID
app.delete('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Assignment.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Assignment non trouvé' });
    }
    res.json({ success: true, message: 'Assignment supprimé', deleted });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'assignment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Endpoint pour réinitialiser (vider) la collection d'assignments
app.delete('/api/assignments', async (req, res) => {
  const { createdBy } = req.body;
  if (createdBy !== 'LineoL') {
    return res.status(403).json({ success: false, message: "Seul l'administrateur peut réinitialiser la base" });
  }

  try {
    const result = await Assignment.deleteMany({});
    console.log('Assignments supprimés:', result.deletedCount);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des assignments:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer les assignments d’un utilisateur spécifique
app.get('/api/assignments/:nom', async (req, res) => {
  const { nom } = req.params;
  try {
    console.log(`Recherche des assignments pour assignedTo: ${nom}`);
    const assignments = await Assignment.find({ assignedTo: nom });
    console.log(`Assignments trouvés:`, assignments);
    res.json(assignments);
  } catch (error) {
    console.error('Erreur lors de la récupération des assignments:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour récupérer tous les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Endpoint pour mettre à jour un assignment
app.put('/api/assignments/:id', async (req, res) => {
  const { id } = req.params;
  const updatedAssignment = req.body;

  try {
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment non trouvé' });
    }

    // Vérifier si l'utilisateur est un admin (par exemple, "LineoL")
    if (assignment.createdBy !== 'LineoL') {
      return res.status(403).json({ success: false, message: 'Seul l\'administrateur peut modifier un assignment' });
    }

    const result = await Assignment.findByIdAndUpdate(id, updatedAssignment, { new: true });
    res.json(result);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'assignment:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});


const PORT = process.env.PORT || 8010;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));