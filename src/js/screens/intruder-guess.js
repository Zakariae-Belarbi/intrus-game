// Intruder Guess Screen - L'intrus devine l'animal
const IntruderGuessScreen = {
    selectedAnimal: null,
    hasSubmitted: false,
    animals: [],

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const submitBtn = Utils.getElementById('submit-guess-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitGuess();
            });
        }
    },

    startGuess(animals = []) {
        console.log('[IntruderGuess] startGuess', animals);
        this.selectedAnimal = null;
        this.hasSubmitted = false;
        this.animals = animals;
        
        this.renderAnimals();
        this.updateSubmitButton();
        
        Utils.showNotification?.('🕵️ Trouvez le bon animal pour gagner !', 'info');
    },

    renderAnimals() {
        const grid = Utils.getElementById('animals-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        this.animals.forEach((animal, index) => {
            const animalOption = Utils.createElement('div', 'animal-option hover-lift');
            animalOption.style.animationDelay = `${index * 0.05}s`;
            animalOption.style.cssText += `
                padding: 1.5rem;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                user-select: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
            `;
            
            // Gérer l'animal en tant qu'objet {emoji, name} ou string
            const emoji = animal.emoji || animal;
            const name = animal.name || '';
            
            animalOption.innerHTML = `
                <div style="font-size: 3rem;">${emoji}</div>
                ${name ? `<div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${name}</div>` : ''}
            `;
            
            animalOption.addEventListener('click', () => {
                this.selectAnimal(animal, animalOption);
            });
            
            animalOption.addEventListener('mouseenter', () => {
                if (!this.hasSubmitted) {
                    animalOption.style.transform = 'scale(1.1) rotate(5deg)';
                }
            });
            
            animalOption.addEventListener('mouseleave', () => {
                if (!this.hasSubmitted && !animalOption.classList.contains('selected')) {
                    animalOption.style.transform = 'scale(1)';
                }
            });

            grid.appendChild(animalOption);
        });
        
        // Style de la grille
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        `;
    },

    selectAnimal(animal, optionElement) {
        if (this.hasSubmitted) {
            Utils.showNotification?.('Vous avez déjà validé votre choix !', 'error');
            Utils.playErrorSound?.();
            return;
        }

        // Retirer la sélection précédente
        document.querySelectorAll('.animal-option').forEach(option => {
            option.classList.remove('selected');
            option.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
            option.style.transform = 'scale(1)';
        });

        // Sélectionner l'animal actuel
        optionElement.classList.add('selected');
        optionElement.style.background = 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)';
        optionElement.style.transform = 'scale(1.15)';
        optionElement.style.boxShadow = '0 8px 16px rgba(132, 250, 176, 0.4)';
        
        this.selectedAnimal = animal;
        this.updateSubmitButton();
        
        Utils.playClickSound?.();
        
        const displayName = animal.name ? `${animal.name} ${animal.emoji}` : animal;
        Utils.showNotification?.(`${displayName} sélectionné`, 'info');
    },

    updateSubmitButton() {
        const submitButton = Utils.getElementById('submit-guess-btn');
        if (!submitButton) return;
        
        if (this.selectedAnimal && !this.hasSubmitted) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
            submitButton.style.background = 'var(--success)';
            Utils.pulse?.(submitButton);
        } else {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
            Utils.stopPulse?.(submitButton);
        }
    },

    submitGuess() {
        if (!this.selectedAnimal) {
            Utils.showNotification?.('Veuillez sélectionner un animal', 'error');
            Utils.playErrorSound?.();
            return;
        }

        if (this.hasSubmitted) {
            Utils.showNotification?.('Vous avez déjà validé !', 'error');
            Utils.playErrorSound?.();
            return;
        }

        // Envoyer la réponse au serveur
        if (window.realtime?.submitIntruderGuess) {
            window.realtime.submitIntruderGuess(this.selectedAnimal);
        }
        
        this.hasSubmitted = true;
        this.disableSelection();
        
        const displayName = this.selectedAnimal.name ? 
            `${this.selectedAnimal.name} ${this.selectedAnimal.emoji}` : 
            this.selectedAnimal;
        Utils.showNotification?.(`Réponse confirmée : ${displayName}`, 'success');
        Utils.playSuccessSound?.();
    },

    disableSelection() {
        document.querySelectorAll('.animal-option').forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.7';
        });
        
        // Garder l'animal sélectionné en surbrillance
        const selectedOption = document.querySelector('.animal-option.selected');
        if (selectedOption) {
            selectedOption.style.opacity = '1';
            selectedOption.style.transform = 'scale(1.15)';
        }
        
        this.updateSubmitButton();
    },

    show() {
        Utils.showScreen?.('intruder-guess-screen');
    }
};

// Exposer globalement
window.IntruderGuessScreen = IntruderGuessScreen;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    IntruderGuessScreen.init();
});
