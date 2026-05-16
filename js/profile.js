const profileContainer = document.getElementById("profileContainer");
const profileMessage = document.getElementById("profileMessage");

function getRootPerson(people) {
  return people.find((person) => {
    return person.isRoot === true || person.authUid;
  });
}

function getPersonIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function getRelationLabel(relation, currentPersonId, otherPerson) {
  const isFromCurrent = relation.from === currentPersonId;

  if (relation.type === "PARENT_OF") {
    return isFromCurrent ? "Child" : "Parent";
  }

  if (relation.type === "MARRIED_TO") {
    return "Spouse";
  }

  if (relation.type === "FRIEND_OF") {
    return "Friend";
  }

  if (relation.type === "SIBLING_OF") {
    return "Sibling";
  }

  if (relation.type === "BROTHER_OF") {
    return "Brother";
  }

  if (relation.type === "SISTER_OF") {
    return "Sister";
  }

  if (relation.type === "GRANDFATHER_OF") {
    return isFromCurrent ? "Grandchild" : "Grandfather";
  }

  if (relation.type === "GRANDMOTHER_OF") {
    return isFromCurrent ? "Grandchild" : "Grandmother";
  }

  if (relation.type === "PATERNAL_UNCLE_OF") {
    return isFromCurrent ? "Nephew/Niece" : "Paternal Uncle";
  }

  if (relation.type === "PATERNAL_AUNT_OF") {
    return isFromCurrent ? "Nephew/Niece" : "Paternal Aunt";
  }

  if (relation.type === "MATERNAL_UNCLE_OF") {
    return isFromCurrent ? "Nephew/Niece" : "Maternal Uncle";
  }

  if (relation.type === "MATERNAL_AUNT_OF") {
    return isFromCurrent ? "Nephew/Niece" : "Maternal Aunt";
  }

  if (relation.type === "COUSIN_OF") {
    return "Cousin";
  }

  if (relation.type === "NEPHEW_OF") {
    return isFromCurrent ? "Uncle/Aunt" : "Nephew";
  }

  if (relation.type === "NIECE_OF") {
    return isFromCurrent ? "Uncle/Aunt" : "Niece";
  }

  return otherPerson?.note || "Related";
}


function getGenderFromPrompt(defaultGender = "unknown") {
  const input = prompt("Gender? Type male, female, or leave blank.");

  if (!input) return defaultGender;

  const gender = input.trim().toLowerCase();

  if (gender === "male") return "male";
  if (gender === "female") return "female";

  return "unknown";
}

async function quickAddRelative(focusPersonId, relationKind) {
  const focusPerson = FamilyUtils.getPersonById(focusPersonId);

  if (!focusPerson) {
    alert("Focus person not found.");
    return;
  }

  let promptText = "Enter name";
  let gender = "unknown";
  let note = "Family member";
  let relationType = "";
  let fromId = "";
  let toId = "";

  if (relationKind === "father") {
    promptText = `Enter father's name for ${focusPerson.name}`;
    gender = "male";
    note = "Father";
    relationType = "PARENT_OF";
  }

  if (relationKind === "mother") {
    promptText = `Enter mother's name for ${focusPerson.name}`;
    gender = "female";
    note = "Mother";
    relationType = "PARENT_OF";
  }

  if (relationKind === "spouse") {
    promptText = `Enter spouse name for ${focusPerson.name}`;
    gender = getGenderFromPrompt("unknown");
    note = "Spouse";
    relationType = "MARRIED_TO";
  }

  if (relationKind === "child") {
    promptText = `Enter child name for ${focusPerson.name}`;
    gender = getGenderFromPrompt("unknown");
    note = "Child";
    relationType = "PARENT_OF";
  }

  const name = prompt(promptText);

  if (!name || !name.trim()) {
    return;
  }

  const personResult = await FamilyUtils.addPerson({
    name: name.trim(),
    gender,
    note
  });

  if (!personResult.success) {
    alert(personResult.message);
    return;
  }

  const newPerson = personResult.person;

  if (relationKind === "father" || relationKind === "mother") {
    fromId = newPerson.id;
    toId = focusPerson.id;
  }

  if (relationKind === "spouse") {
    fromId = focusPerson.id;
    toId = newPerson.id;
  }

  if (relationKind === "child") {
    fromId = focusPerson.id;
    toId = newPerson.id;
  }

  const relationResult = await FamilyUtils.addRelationship(fromId, toId, relationType);

  if (!relationResult.success) {
    alert(relationResult.message);
    return;
  }

  await FamilyUtils.loadData();

  window.location.href = `profile.html?id=${focusPerson.id}`;
}

function renderProfile(person) {
  const relationships = FamilyUtils.getAllRelationships();

  const connectedRelations = relationships
    .filter((relation) => {
      return relation.from === person.id || relation.to === person.id;
    })
    .map((relation) => {
      const otherId = relation.from === person.id ? relation.to : relation.from;
      const otherPerson = FamilyUtils.getPersonById(otherId);

      return {
        relation,
        otherPerson,
        label: getRelationLabel(relation, person.id, otherPerson)
      };
    })
    .filter((item) => item.otherPerson);

  profileContainer.innerHTML = `
    <section class="profile-clean-card">
      <div class="profile-clean-header">
        <div class="profile-avatar">
          ${FamilyUtils.getInitials(person.name)}
        </div>

        <div>
          <p class="profile-small-label">
            ${person.isRoot ? "Root person" : "Family member"}
          </p>

          <h1>${person.name}</h1>

          <div class="profile-clean-meta">
            <span>${person.gender || "unknown"}</span>
            <span>${person.birthYear || "Birth year not added"}</span>
            <span>${person.note || "No note added"}</span>
          </div>
        </div>
      </div>

      <div class="profile-clean-actions">
        <button type="button" onclick="FamilyUtils.openTree('${person.id}')">
          Open Tree
        </button>

        <a href="people.html">Manage People</a>
        <a href="path.html">Find Path</a>
      </div>
    </section>

    <section class="profile-clean-card quick-add-card">
  <h2>Quick add family</h2>
  <p class="empty-profile-text">
    Add close family members directly from this profile.
  </p>

  <div class="quick-add-grid">
    <button type="button" onclick="quickAddRelative('${person.id}', 'father')">
      Add Father
      <small>দেউতা যোগ কৰক</small>
    </button>

    <button type="button" onclick="quickAddRelative('${person.id}', 'mother')">
      Add Mother
      <small>মা যোগ কৰক</small>
    </button>

    <button type="button" onclick="quickAddRelative('${person.id}', 'spouse')">
      Add Spouse
      <small>জীৱনসঙ্গী যোগ কৰক</small>
    </button>

    <button type="button" onclick="quickAddRelative('${person.id}', 'child')">
      Add Child
      <small>সন্তান যোগ কৰক</small>
    </button>
  </div>
</section>

    <section class="profile-clean-card">
      <h2>Connected people</h2>

      ${
        connectedRelations.length === 0
          ? `<p class="empty-profile-text">No relationships added yet.</p>`
          : `<div class="profile-relation-list">
              ${connectedRelations
                .map((item) => {
                  return `
                    <button class="profile-relation-item" onclick="window.location.href='profile.html?id=${item.otherPerson.id}'">
                      <span>${item.otherPerson.name}</span>
                      <small>${item.label}</small>
                    </button>
                  `;
                })
                .join("")}
            </div>`
      }
    </section>
  `;
}

async function initProfilePage() {
  if (!profileContainer) return;

  profileMessage.textContent = "Loading profile...";

  const result = await FamilyUtils.loadData();

  if (!result.success) {
    profileMessage.textContent = result.message;
  }

  const people = FamilyUtils.getAllPeople();

  if (people.length === 0) {
    window.location.href = "setup-profile.html";
    return;
  }

  let personId = getPersonIdFromUrl();

  if (!personId) {
    const rootPerson = getRootPerson(people);

    if (rootPerson) {
      window.location.href = `profile.html?id=${rootPerson.id}`;
      return;
    }

    window.location.href = "setup-profile.html";
    return;
  }

  const person = FamilyUtils.getPersonById(personId);

  if (!person) {
    profileMessage.textContent = "Profile not found.";
    profileContainer.innerHTML = `
      <section class="profile-clean-card">
        <h2>Profile not found</h2>
        <p class="empty-profile-text">This person may not exist in your family tree.</p>
        <a href="people.html">Go to People</a>
      </section>
    `;
    return;
  }

  profileMessage.textContent = "";
  renderProfile(person);
}

initProfilePage();