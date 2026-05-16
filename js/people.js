const peopleList = document.getElementById("peopleList");
const addPersonForm = document.getElementById("addPersonForm");
const addRelationForm = document.getElementById("addRelationForm");


const personName = document.getElementById("personName");
const personGender = document.getElementById("personGender");
const personNote = document.getElementById("personNote");

const fromPerson = document.getElementById("fromPerson");
const toPerson = document.getElementById("toPerson");
const relationType = document.getElementById("relationType");
const relationMessage = document.getElementById("relationMessage");

const relationshipList = document.getElementById("relationshipList");
const clearCustomData = document.getElementById("clearCustomData");

const exportDataBtn = document.getElementById("exportDataBtn");
const importDataInput = document.getElementById("importDataInput");
const backupMessage = document.getElementById("backupMessage");
const resetDataBtn = document.getElementById("resetDataBtn");

let editingPersonId = null;

const personFormTitle = addPersonForm.querySelector("h3");
const personSubmitButton = addPersonForm.querySelector("button[type='submit']");

const cancelEditButton = document.createElement("button");
cancelEditButton.type = "button";
cancelEditButton.className = "form-secondary-btn";
cancelEditButton.textContent = "Cancel Edit";
cancelEditButton.style.display = "none";
addPersonForm.appendChild(cancelEditButton);

if (clearCustomData) {
  clearCustomData.textContent = "Refresh Backend Data";
}

function formatRelationshipType(type) {
  const labels = {
    PARENT_OF: "parent of",
    MARRIED_TO: "married to",
    FRIEND_OF: "friend of",

    SIBLING_OF: "sibling of",
    BROTHER_OF: "brother of",
    SISTER_OF: "sister of",

    GRANDFATHER_OF: "grandfather of",
    GRANDMOTHER_OF: "grandmother of",

    PATERNAL_UNCLE_OF: "paternal uncle of",
    PATERNAL_AUNT_OF: "paternal aunt of",
    MATERNAL_UNCLE_OF: "maternal uncle of",
    MATERNAL_AUNT_OF: "maternal aunt of",

    COUSIN_OF: "cousin of",
    NEPHEW_OF: "nephew of",
    NIECE_OF: "niece of"
  };

  return labels[type] || type;
}

function resetPersonForm() {
  editingPersonId = null;

  personName.value = "";
  personGender.value = "unknown";
  personNote.value = "";

  personFormTitle.textContent = "Add person";
  personSubmitButton.textContent = "Add Person";
  cancelEditButton.style.display = "none";
}

function startEditPerson(person) {
  editingPersonId = person.id;

  personName.value = person.name;
  personGender.value = person.gender || "unknown";
  personNote.value = person.note || "";

  personFormTitle.textContent = "Edit person";
  personSubmitButton.textContent = "Save Changes";
  cancelEditButton.style.display = "block";

  personName.focus();
}

function renderPeople() {
  const people = FamilyUtils.getAllPeople();

  peopleList.innerHTML = "";

  people.forEach((person) => {
    const row = document.createElement("div");
    row.className = "people-row person-management-row";

    row.innerHTML = `
      <div class="person-row-info">
        <strong>${person.name}</strong>
        <span>${person.note || "Person"}</span>
      </div>

      <div class="person-row-actions">
        <button type="button" class="view-person-btn">View</button>
        <button type="button" class="edit-person-btn">Edit</button>
        <button type="button" class="delete-person-btn">Delete</button>
      </div>
    `;

    row.querySelector(".view-person-btn").addEventListener("click", () => {
      window.location.href = `profile.html?id=${person.id}`;

    });

   

    row.querySelector(".edit-person-btn").addEventListener("click", () => {
      startEditPerson(person);
    });

    row.querySelector(".delete-person-btn").addEventListener("click", async () => {
      const confirmDelete = confirm(
        `Delete ${person.name}? This will also delete all relationships linked to this person.`
      );

      if (!confirmDelete) return;

      const result = await FamilyUtils.deletePerson(person.id);

      if (editingPersonId === person.id) {
        resetPersonForm();
      }

      relationMessage.textContent = result.message;
      refreshPageData();
    });

    peopleList.appendChild(row);
  });
}

function renderPersonOptions() {
  const people = FamilyUtils.getAllPeople();

  fromPerson.innerHTML = "";
  toPerson.innerHTML = "";

  people.forEach((person) => {
    const fromOption = document.createElement("option");
    fromOption.value = person.id;
    fromOption.textContent = person.name;

    const toOption = document.createElement("option");
    toOption.value = person.id;
    toOption.textContent = person.name;

    fromPerson.appendChild(fromOption);
    toPerson.appendChild(toOption);
  });
}

function renderRelationships() {
  const relationships = FamilyUtils.getAllRelationships();

  relationshipList.innerHTML = "";

  if (relationships.length === 0) {
    relationshipList.innerHTML = `<p class="empty-text">No relationships found.</p>`;
    return;
  }

  relationships.forEach((relation) => {
    const from = FamilyUtils.getPersonById(relation.from);
    const to = FamilyUtils.getPersonById(relation.to);

    if (!from || !to) return;

    const item = document.createElement("div");
    item.className = "relationship-row";

    item.innerHTML = `
      <strong>${from.name}</strong>
      <span>${formatRelationshipType(relation.type)}</span>
      <strong>${to.name}</strong>
      <button class="delete-relation-btn" type="button">Delete</button>
    `;

    const deleteButton = item.querySelector(".delete-relation-btn");

    deleteButton.addEventListener("click", async () => {
      const deleted = await FamilyUtils.deleteRelationship(relation.id);

      relationMessage.textContent = deleted
        ? "Relationship deleted."
        : "Could not delete relationship.";

      refreshPageData();
    });

    relationshipList.appendChild(item);
  });
}

function refreshPageData() {
  renderPeople();
  renderPersonOptions();
  renderRelationships();
}

addPersonForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = personName.value.trim();

  if (!name) return;

  if (editingPersonId) {
    const result = await FamilyUtils.updatePerson(editingPersonId, {
      name,
      gender: personGender.value,
      note: personNote.value.trim()
    });

    relationMessage.textContent = result.message;
    resetPersonForm();
    refreshPageData();
    return;
  }

  const result = await FamilyUtils.addPerson({
    name,
    gender: personGender.value,
    note: personNote.value.trim()
  });

  relationMessage.textContent = result.message;

  if (result.success) {
    resetPersonForm();
    refreshPageData();
  }
});

addRelationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fromId = fromPerson.value;
  const toId = toPerson.value;
  const type = relationType.value;

  if (fromId === toId) {
    relationMessage.textContent = "Please select two different people.";
    return;
  }

  const result = await FamilyUtils.addRelationship(fromId, toId, type);
  relationMessage.textContent = result.message;

  if (result.success) {
    refreshPageData();
  }
});

cancelEditButton.addEventListener("click", () => {
  resetPersonForm();
  relationMessage.textContent = "Edit cancelled.";
});

clearCustomData.addEventListener("click", async () => {
  const result = await FamilyUtils.loadData();
  relationMessage.textContent = result.message;
  refreshPageData();
});

exportDataBtn.addEventListener("click", async () => {
  const data = await FamilyUtils.exportCustomData();
  const jsonText = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonText], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `familygraph-backend-backup-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);

  backupMessage.textContent = "Backend backup exported.";
});

importDataInput.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const importedData = JSON.parse(reader.result);
      const result = await FamilyUtils.importCustomData(importedData);

      backupMessage.textContent = result.message;

      if (result.success) {
        resetPersonForm();
        refreshPageData();
      }
    } catch (error) {
      backupMessage.textContent = "Could not read JSON file.";
    }

    importDataInput.value = "";
  };

  reader.readAsText(file);
});

resetDataBtn.addEventListener("click", async () => {
  const confirmReset = confirm(
    "Reset your family graph? This will remove all people and relationships from your account."
  );

  if (!confirmReset) return;

  const result = await FamilyUtils.resetBackendData();

  backupMessage.textContent = result.message;
  relationMessage.textContent = result.message;

  if (result.success) {
    resetPersonForm();
    window.location.href = "setup-profile.html";
  }
});
async function initPeoplePage() {
  relationMessage.textContent = "Loading backend data...";
  const result = await FamilyUtils.loadData();
  const people = FamilyUtils.getAllPeople();

const hasRootPerson = people.some((person) => {
  return person.isRoot === true || person.authUid;
});

if (!hasRootPerson) {
  window.location.href = "setup-profile.html";
  return;
}
  relationMessage.textContent = result.message;
  refreshPageData();
}

initPeoplePage();