const addIngredientButton = document.querySelector("#add-ingredient");
const ingredientsList = document.querySelector("#ingredients-list");
const recipeImageInput = document.querySelector("#recipe-image");

const imagePreview = document.querySelector("#image-preview");

const imageUploadText = document.querySelector("#image-upload-text");

recipeImageInput.addEventListener("change", function (event) {
  const selectedFile = event.target.files[0];

  if (!selectedFile) {
    resetImagePreview();
    return;
  }

  const maximumFileSize = 1024 * 1024;

  if (!selectedFile.type.startsWith("image/")) {
    alert("Izvēlētais fails nav attēls.");
    recipeImageInput.value = "";
    resetImagePreview();
    return;
  }

  if (selectedFile.size > maximumFileSize) {
    alert("Attēls nedrīkst būt lielāks par 1 MB.");
    recipeImageInput.value = "";
    resetImagePreview();
    return;
  }

  const fileReader = new FileReader();

  fileReader.addEventListener("load", function () {
    selectedImageData = fileReader.result;

    imagePreview.src = selectedImageData;
    imagePreview.hidden = false;
    imageUploadText.hidden = true;
  });

  fileReader.readAsDataURL(selectedFile);
});

function resetImagePreview() {
  selectedImageData = "";
  imagePreview.src = "";
  imagePreview.hidden = true;
  imageUploadText.hidden = false;
}

let selectedImageData = "";

let ingredientCounter = 1;

function addIngredient() {
  ingredientCounter++;

  const ingredientRow = document.createElement("div");
  ingredientRow.classList.add("ingredient-row");

  ingredientRow.innerHTML = `
    <div class="form-group">
      <label for="ingredient-amount-${ingredientCounter}">
        Daudzums:
      </label>

      <input
        type="number"
        id="ingredient-amount-${ingredientCounter}"
        class="ingredient-amount"
        min="0"
        step="0.01"
        placeholder="500"
        required
      >
    </div>

    <div class="form-group">
      <label for="ingredient-unit-${ingredientCounter}">
        Mērvienība:
      </label>

      <select
        id="ingredient-unit-${ingredientCounter}"
        class="ingredient-unit"
        required
      >
        <option value="">Izvēlies</option>
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="ml">ml</option>
        <option value="l">l</option>
        <option value="gab.">gab.</option>
        <option value="ēdamkarote">ēdamkarote</option>
        <option value="tējkarote">tējkarote</option>
        <option value="šķipsna">šķipsna</option>
        <option value="pēc garšas">pēc garšas</option>
      </select>
    </div>

    <div class="form-group">
      <label for="ingredient-name-${ingredientCounter}">
        Nosaukums:
      </label>

      <input
        type="text"
        id="ingredient-name-${ingredientCounter}"
        class="ingredient-name"
        placeholder="Kartupeļi"
        required
      >
    </div>

    <button type="button" class="remove-ingredient">
      Dzēst
    </button>
  `;

  ingredientsList.append(ingredientRow);
}

function removeIngredient(event) {
  const clickedElement = event.target;

  if (!clickedElement.classList.contains("remove-ingredient")) {
    return;
  }

  const ingredientRows = ingredientsList.querySelectorAll(".ingredient-row");

  if (ingredientRows.length === 1) {
    alert("Receptē jābūt vismaz vienai sastāvdaļai.");
    return;
  }

  const selectedRow = clickedElement.closest(".ingredient-row");
  selectedRow.remove();
}

addIngredientButton.addEventListener("click", addIngredient);
ingredientsList.addEventListener("click", removeIngredient);

const addStepButton = document.querySelector("#add-step");
const stepsList = document.querySelector("#steps-list");

function renumberSteps() {
  const stepRows = stepsList.querySelectorAll(".step-row");

  stepRows.forEach(function (stepRow, index) {
    const stepNumber = index + 1;
    const label = stepRow.querySelector("label");
    const textarea = stepRow.querySelector(".recipe-step");

    label.textContent = `${stepNumber}. solis:`;
    label.htmlFor = `step-${stepNumber}`;
    textarea.id = `step-${stepNumber}`;
  });
}

function addStep() {
  const stepRow = document.createElement("div");
  stepRow.classList.add("step-row");

  stepRow.innerHTML = `
    <label>Jauns solis:</label>

    <textarea
      class="recipe-step"
      placeholder="Apraksti nākamo gatavošanas soli"
      required
    ></textarea>

    <button type="button" class="remove-step">
      Dzēst soli
    </button>
  `;

  stepsList.append(stepRow);
  renumberSteps();
}

function removeStep(event) {
  const clickedElement = event.target;

  if (!clickedElement.classList.contains("remove-step")) {
    return;
  }

  const stepRows = stepsList.querySelectorAll(".step-row");

  if (stepRows.length === 1) {
    alert("Receptē jābūt vismaz vienam gatavošanas solim.");
    return;
  }

  const selectedStep = clickedElement.closest(".step-row");
  selectedStep.remove();

  renumberSteps();
}

addStepButton.addEventListener("click", addStep);
stepsList.addEventListener("click", removeStep);

const recipeForm = document.querySelector("#recipe-form");
const recipeList = document.querySelector("#recipe-list");

// ===== RECEPŠU MEKLĒTĀJS =====

const recipeSearchInput = document.querySelector("#recipe-search");
const searchResultCount = document.querySelector("#search-result-count");

const savedRecipes = localStorage.getItem("recipes");

let recipes = savedRecipes ? JSON.parse(savedRecipes) : [];

// Savāc visas receptes sastāvdaļas
function collectIngredients() {
  const ingredientRows = ingredientsList.querySelectorAll(".ingredient-row");

  return Array.from(ingredientRows).map(function (row) {
    const amount = Number(row.querySelector(".ingredient-amount").value);

    return {
      amount: amount,
      baseAmount: amount,
      unit: row.querySelector(".ingredient-unit").value,
      name: row.querySelector(".ingredient-name").value.trim(),
    };
  });
}

// Savāc visus receptes pagatavošanas soļus
function collectSteps() {
  const stepFields = stepsList.querySelectorAll(".recipe-step");

  return Array.from(stepFields).map(function (textarea) {
    return textarea.value.trim();
  });
}
function saveRecipes() {
  const recipesAsText = JSON.stringify(recipes);

  localStorage.setItem("recipes", recipesAsText);
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName);

  element.textContent = text;

  return element;
}

function roundIngredientAmount(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
// ===== SAGATAVO ARĪ IEPRIEKŠ SAGLABĀTĀS RECEPTES =====

function prepareRecipeScalingData() {
  let dataWasChanged = false;

  recipes.forEach(function (recipe) {
    const currentPortions = Number(recipe.portions) || 1;
    const basePortions = Number(recipe.basePortions);

    if (!Number.isFinite(basePortions) || basePortions < 1) {
      recipe.basePortions = currentPortions;
      recipe.portions = currentPortions;

      dataWasChanged = true;
    }

    recipe.ingredients.forEach(function (ingredient) {
      const baseAmount = Number(ingredient.baseAmount);

      if (!Number.isFinite(baseAmount)) {
        ingredient.baseAmount = Number(ingredient.amount) || 0;

        dataWasChanged = true;
      }
    });
  });

  if (dataWasChanged) {
    saveRecipes();
  }
}
// ===== IZMAIŅA 4: IZVEIDO PORCIJU MAIŅAS LAUKU =====

function createPortionsControl(recipe) {
  const portionsControl = document.createElement("div");
  portionsControl.classList.add("portions-control");

  const portionsLabel = createTextElement("label", "Jaunais porciju skaits:");

  const portionsInput = document.createElement("input");

  portionsInput.type = "number";
  portionsInput.min = "1";
  portionsInput.step = "1";
  portionsInput.value = recipe.portions;
  portionsInput.classList.add("recipe-portions");

  const recalculateButton = createTextElement(
    "button",
    "Pārrēķināt sastāvdaļas",
  );

  recalculateButton.type = "button";
  recalculateButton.classList.add("recalculate-portions");
  recalculateButton.dataset.id = recipe.id;

  portionsControl.append(portionsLabel, portionsInput, recalculateButton);

  return portionsControl;
}
// Atlasa receptes pēc nosaukuma vai sastāvdaļas
function getFilteredRecipes() {
  const searchTerms = recipeSearchInput.value
    .toLowerCase()
    .split(",")
    .map(function (term) {
      return term.trim();
    })
    .filter(function (term) {
      return term !== "";
    });

  // Ja meklētājs ir tukšs, parāda visas receptes
  if (searchTerms.length === 0) {
    return recipes;
  }

  return recipes.filter(function (recipe) {
    return searchTerms.every(function (searchTerm) {
      const titleMatches = recipe.title.toLowerCase().includes(searchTerm);

      const ingredientMatches = recipe.ingredients.some(function (ingredient) {
        return ingredient.name.toLowerCase().includes(searchTerm);
      });

      return titleMatches || ingredientMatches;
    });
  });
}
function displayRecipes() {
  recipeList.innerHTML = "";

  const filteredRecipes = getFilteredRecipes();

  searchResultCount.textContent = `Atrastas receptes: ${filteredRecipes.length} no ${recipes.length}`;

  if (recipes.length === 0) {
    const emptyMessage = createTextElement(
      "li",
      "Pagaidām nav saglabāta neviena recepte.",
    );

    recipeList.append(emptyMessage);
    return;
  }
  // Receptes ir saglabātas, bet neviena neatbilst meklējumam
  if (filteredRecipes.length === 0) {
    const noResultsMessage = createTextElement(
      "li",
      "Neviena recepte netika atrasta.",
    );

    recipeList.append(noResultsMessage);
    return;
  }

  filteredRecipes.forEach(function (recipe) {
    const recipeCard = document.createElement("li");
    recipeCard.classList.add("recipe-card");

    const title = createTextElement("h3", recipe.title);
    const description = createTextElement("p", recipe.description);

    recipeCard.append(title);

    if (recipe.image) {
      const recipeImage = document.createElement("img");

      recipeImage.src = recipe.image;
      recipeImage.alt = `${recipe.title} attēls`;
      recipeImage.classList.add("recipe-image");

      recipeCard.append(recipeImage);
    }

    recipeCard.append(description);

    const information = createTextElement(
      "p",
      `Kategorija: ${recipe.category || "nav norādīta"} |
      Porcijas: ${recipe.portions || "nav norādīts"} |
      Sagatavošana: ${recipe.preparationTime || 0} min |
      Gatavošana: ${recipe.cookingTime || 0} min |
      Temperatūra: ${recipe.temperature || 0} °C`,
    );

    recipeCard.append(information);
    const portionsControl = createPortionsControl(recipe);

    recipeCard.append(portionsControl);
    const ingredientsTitle = createTextElement("h4", "Sastāvdaļas");

    const ingredientsListElement = document.createElement("ul");

    recipe.ingredients.forEach(function (ingredient) {
      const ingredientText = [
        ingredient.amount,
        ingredient.unit,
        ingredient.name,
      ]
        .filter(Boolean)
        .join(" ");

      const ingredientItem = createTextElement("li", ingredientText);

      ingredientsListElement.append(ingredientItem);
    });

    recipeCard.append(ingredientsTitle, ingredientsListElement);

    const stepsTitle = createTextElement("h4", "Gatavošanas secība");

    const stepsListElement = document.createElement("ol");

    recipe.steps.forEach(function (step) {
      const stepItem = createTextElement("li", step);

      stepsListElement.append(stepItem);
    });

    recipeCard.append(stepsTitle, stepsListElement);

    if (recipe.notes) {
      const notes = createTextElement("p", `Piezīmes: ${recipe.notes}`);

      recipeCard.append(notes);
    }

    const deleteButton = createTextElement("button", "Dzēst recepti");

    deleteButton.type = "button";
    deleteButton.classList.add("delete-recipe");
    deleteButton.dataset.id = recipe.id;

    recipeCard.append(deleteButton);
    recipeList.append(recipeCard);
  });
}

function resetRecipeForm() {
  recipeForm.reset();
  resetImagePreview();

  const ingredientRows = ingredientsList.querySelectorAll(".ingredient-row");

  ingredientRows.forEach(function (row, index) {
    if (index > 0) {
      row.remove();
    }
  });

  ingredientCounter = 1;

  const stepRows = stepsList.querySelectorAll(".step-row");

  stepRows.forEach(function (row, index) {
    if (index > 0) {
      row.remove();
    }
  });

  renumberSteps();
}

function addRecipe(event) {
  event.preventDefault();

  // ===== NOLASA UN PĀRBAUDA PORCIJU SKAITU =====

  const portions = Number(document.querySelector("#portions").value);

  if (!Number.isInteger(portions) || portions < 1) {
    alert("Porciju skaitam jābūt veselam skaitlim, kas ir vismaz 1.");
    return;
  }
  const recipe = {
    id: Date.now(),

    title: document.querySelector("#recipe-name").value.trim(),

    description: document.querySelector("#recipe-description").value.trim(),
    image: selectedImageData,

    category: document.querySelector("#category").value,
    // Pašreizējais porciju skaits
    portions: portions,

    // Sākotnējais porciju skaits aprēķiniem
    basePortions: portions,

    preparationTime: document.querySelector("#preparation-time").value,

    cookingTime: document.querySelector("#cooking-time").value,

    temperature: document.querySelector("#temperature").value,

    ingredients: collectIngredients(),
    steps: collectSteps(),

    notes: document.querySelector("#notes").value.trim(),
  };

  recipes.push(recipe);

  saveRecipes();
  displayRecipes();
  resetRecipeForm();
}
// ===== DZĒŠ IZVĒLĒTO RECEPTI =====

function deleteRecipe(event) {
  if (!event.target.classList.contains("delete-recipe")) {
    return;
  }

  const selectedRecipeId = Number(event.target.dataset.id);

  recipes = recipes.filter(function (recipe) {
    return recipe.id !== selectedRecipeId;
  });

  saveRecipes();
  displayRecipes();
}
// ===== IZMAIŅA 6: PĀRRĒĶINA SASTĀVDAĻU DAUDZUMUS =====

function recalculatePortions(event) {
  const clickedButton = event.target.closest(".recalculate-portions");

  if (!clickedButton) {
    return;
  }

  const selectedRecipeId = Number(clickedButton.dataset.id);

  const selectedRecipe = recipes.find(function (recipe) {
    return recipe.id === selectedRecipeId;
  });

  if (!selectedRecipe) {
    return;
  }

  const portionsControl = clickedButton.closest(".portions-control");

  const portionsInput = portionsControl.querySelector(".recipe-portions");

  const newPortions = Number(portionsInput.value);

  if (!Number.isInteger(newPortions) || newPortions < 1) {
    alert("Porciju skaitam jābūt veselam skaitlim, kas ir vismaz 1.");

    portionsInput.value = selectedRecipe.portions;
    return;
  }

  const multiplier = newPortions / selectedRecipe.basePortions;

  selectedRecipe.ingredients.forEach(function (ingredient) {
    const newAmount = ingredient.baseAmount * multiplier;

    ingredient.amount = roundIngredientAmount(newAmount);
  });

  selectedRecipe.portions = newPortions;

  saveRecipes();
  displayRecipes();
}
// Saglabā jaunu recepti
recipeForm.addEventListener("submit", addRecipe);

// Dzēš izvēlēto recepti
recipeList.addEventListener("click", deleteRecipe);

// Pārrēķina sastāvdaļas jaunajam porciju skaitam
recipeList.addEventListener("click", recalculatePortions);

// Filtrē receptes katru reizi, kad meklētājā tiek ievadīts teksts
recipeSearchInput.addEventListener("input", displayRecipes);

// Pielāgo iepriekš saglabātās receptes jaunajai datu struktūrai
prepareRecipeScalingData();

// Parāda visas saglabātās receptes
displayRecipes();
