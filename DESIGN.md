# 🎨 Design System - Intrus Game

## Vue d'ensemble

Le jeu Intrus Game dispose maintenant d'un design moderne, professionnel et totalement optimisé pour mobile avec :

- ✨ **Identité visuelle moderne** avec palette de couleurs vibrante
- 📱 **Mobile-first** : parfaitement responsive sur tous les écrans
- 🎭 **Glassmorphism** : effets de verre dépoli élégants
- 🌈 **Animations subtiles** : transitions fluides et micro-interactions
- 📖 **Guide d'accueil** : tutoriel interactif pour nouveaux joueurs

---

## 🎨 Palette de couleurs

### Couleurs primaires
- **Primary**: `#6366F1` (Indigo vibrant)
- **Secondary**: `#EC4899` (Rose magenta)
- **Accent**: `#14B8A6` (Turquoise)

### Couleurs d'état
- **Success**: `#10B981` (Vert)
- **Warning**: `#F59E0B` (Orange)
- **Error**: `#EF4444` (Rouge)
- **Info**: `#3B82F6` (Bleu)

### Surfaces
- **Background**: Dégradé sombre `#0F172A` → `#1E293B`
- **Surface Glass**: Blanc semi-transparent avec blur
- **Text Primary**: `#0F172A`
- **Text Secondary**: `#64748B`

---

## 📐 Système d'espacement

```css
--space-xs: 0.25rem   (4px)
--space-sm: 0.5rem    (8px)
--space-md: 1rem      (16px)
--space-lg: 1.5rem    (24px)
--space-xl: 2rem      (32px)
--space-2xl: 3rem     (48px)
--space-3xl: 4rem     (64px)
```

---

## 🔘 Composants clés

### Boutons
- **Primary**: Gradient indigo avec effet hover et glow
- **Secondary**: Gradient rose pour actions secondaires
- **Taille minimale**: 48px (touch-friendly)

### Cartes (Cards)
- Glass morphism avec `backdrop-filter: blur(20px)`
- Bordure subtile et ombres élégantes
- Animation au survol (lift effect)

### Inputs
- Design moderne avec bordure focus colorée
- Effet glow au focus
- Hauteur minimale 48px pour mobile

### Notifications
- Toast style en haut à droite
- Animation slide-in avec bounce
- 4 types : success, error, warning, info

---

## 📱 Optimisations mobile

### Responsive Breakpoints
- **Desktop**: > 768px
- **Tablet**: 481px - 768px
- **Mobile**: < 480px

### Touches spécifiques
- Cibles tactiles minimum 48x48px
- Désactivation des effets hover sur touch devices
- Scrollbars personnalisées (subtiles)
- Font-smoothing optimisé pour retina

---

## 🎬 Animations

### Disponibles
- `fade-in` : Apparition en fondu
- `slide-up` : Montée fluide
- `pop-in` : Apparition avec rebond
- `pulse` : Pulsation infinie
- `float` : Flottement doux
- `shimmer` : Effet de brillance

### Performance
- Utilisation de `transform` et `opacity` (GPU-accelerated)
- `prefers-reduced-motion` respecté
- Durées réduites sur mobile

---

## 📖 Guide d'accueil (Tutorial)

### Fonctionnalités
- **Apparition automatique** au premier lancement
- **4 étapes illustrées** avec icônes colorées
- **Stockage LocalStorage** pour ne pas réafficher
- **Bouton "Comment jouer"** dans le lobby pour réaccès
- **Design responsive** avec scroll sur mobile

### Utilisation
```javascript
// Afficher le tutoriel
Tutorial.show();

// Masquer le tutoriel
Tutorial.hide();

// Réinitialiser (pour tests)
Tutorial.reset();
```

---

## 🎯 Points d'attention UX

### Accessibilité
- Contraste minimum WCAG AA
- Focus visible sur tous les éléments interactifs
- Support clavier complet
- Labels clairs et descriptifs

### Performance
- Transitions CSS optimisées
- Animations GPU-accelerated
- Lazy-loading des ressources
- Backdrop-filter avec fallback

### Mobile
- Viewport meta tag configuré
- Touch targets 48px minimum
- Scroll behavior smooth
- Safe area insets respectés

---

## 📂 Structure des fichiers CSS

```
src/styles/
├── main.css           # Styles de base, layout, variables
├── components.css     # Tous les composants (boutons, cards, etc.)
├── animations.css     # Toutes les animations et transitions
└── tutorial.css       # Guide d'accueil exclusivement
```

---

## 🚀 Utilisation

### Ajouter un nouveau composant

1. Utiliser les variables CSS existantes
2. Respecter le système d'espacement
3. Ajouter les états hover/focus/active
4. Tester sur mobile (min 320px width)
5. Vérifier avec `prefers-reduced-motion`

### Exemple de bouton custom
```css
.my-custom-btn {
    padding: var(--space-md) var(--space-xl);
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    transition: all var(--transition-normal);
    min-height: 48px;
}

.my-custom-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
}
```

---

## ✅ Checklist Design

- [x] Palette de couleurs moderne et cohérente
- [x] Glass morphism sur toutes les surfaces
- [x] Animations fluides et subtiles
- [x] Responsive mobile-first
- [x] Guide d'accueil interactif
- [x] Optimisation touch (48px minimum)
- [x] Accessibilité (contraste, focus, labels)
- [x] Performance (GPU, reduced-motion)
- [x] Scrollbars personnalisées
- [x] Notifications toast modernes

---

## 🎨 Aperçu visuel

### Lobby
- Fond sombre avec gradient animé
- 2 cartes en verre avec hover lift
- Titre avec gradient text
- Bouton "Comment jouer" secondaire

### Tutorial
- Modal centré avec glassmorphism
- 4 étapes avec icônes colorées
- Animation d'entrée avec bounce
- Bouton CTA proéminent

### Jeu (Phases)
- En-tête avec progress bar animée
- Sections questions/réponses en verre
- Bulles de conversation colorées
- Boutons de vote avec gradient

### Résultats
- Grille de scores responsive
- Animations de célébration
- Boutons d'action empilés sur mobile

---

**Design créé pour une expérience immersive, agréable et professionnelle sur tous les appareils.** 🎮✨
